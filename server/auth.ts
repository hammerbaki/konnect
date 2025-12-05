import bcrypt from 'bcrypt';
import crypto from 'crypto';
import session from 'express-session';
import type { Express, RequestHandler, Request, Response, NextFunction } from 'express';
import connectPg from 'connect-pg-simple';
import { storage } from './storage';
import { sendMagicLinkEmail, sendWelcomeEmail } from './email';

const SALT_ROUNDS = 12;
const MAGIC_LINK_EXPIRY_MINUTES = 15;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateMagicToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: 'sessions',
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'konnect-session-secret-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
  });
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

export function setupAuth(app: Express) {
  console.log('Setting up custom authentication...');
  
  app.set('trust proxy', 1);
  app.use(getSession());
  
  console.log('✓ Custom authentication configured');
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  (req as any).user = user;
  next();
};

export async function registerAuthRoutes(app: Express) {
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: '이메일과 비밀번호를 입력해 주세요.' });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ message: '비밀번호는 8자 이상이어야 합니다.' });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
      }
      
      const passwordHash = await hashPassword(password);
      const user = await storage.createUser(email, passwordHash);
      
      if (firstName || lastName) {
        await storage.upsertUser({
          id: user.id,
          email: user.email,
          firstName: firstName || null,
          lastName: lastName || null,
        });
      }
      
      await storage.verifyUserEmail(user.id);
      
      req.session.userId = user.id;
      
      sendWelcomeEmail(email, firstName).catch(err => {
        console.error('Failed to send welcome email:', err);
      });
      
      const updatedUser = await storage.getUser(user.id);
      res.status(201).json({
        user: {
          id: updatedUser!.id,
          email: updatedUser!.email,
          firstName: updatedUser!.firstName,
          lastName: updatedUser!.lastName,
          credits: updatedUser!.credits,
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: '이메일과 비밀번호를 입력해 주세요.' });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }
      
      if (!user.passwordHash) {
        return res.status(401).json({ 
          message: '이 계정은 매직 링크로 로그인해 주세요.',
          useMagicLink: true 
        });
      }
      
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }
      
      req.session.userId = user.id;
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          credits: user.credits,
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: '로그인 중 오류가 발생했습니다.' });
    }
  });

  app.post('/api/auth/magic-link', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: '이메일을 입력해 주세요.' });
      }
      
      const token = generateMagicToken();
      const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);
      
      await storage.createMagicLinkToken({
        email,
        token,
        expiresAt,
      });
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const magicLink = `${baseUrl}/api/auth/verify-magic-link?token=${token}`;
      
      const sent = await sendMagicLinkEmail(email, magicLink);
      if (!sent) {
        return res.status(500).json({ message: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.' });
      }
      
      res.json({ message: '로그인 링크가 이메일로 발송되었습니다.' });
    } catch (error) {
      console.error('Magic link error:', error);
      res.status(500).json({ message: '매직 링크 발송 중 오류가 발생했습니다.' });
    }
  });

  app.get('/api/auth/verify-magic-link', async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.redirect('/?error=invalid_token');
      }
      
      const magicToken = await storage.getMagicLinkToken(token);
      
      if (!magicToken) {
        return res.redirect('/?error=invalid_token');
      }
      
      if (new Date() > magicToken.expiresAt) {
        return res.redirect('/?error=expired_token');
      }
      
      await storage.markMagicLinkUsed(magicToken.id);
      
      let user = await storage.getUserByEmail(magicToken.email);
      
      if (!user) {
        user = await storage.createUser(magicToken.email, null);
        await storage.verifyUserEmail(user.id);
        
        sendWelcomeEmail(magicToken.email).catch(err => {
          console.error('Failed to send welcome email:', err);
        });
      }
      
      if (!user.emailVerified) {
        await storage.verifyUserEmail(user.id);
      }
      
      req.session.userId = user.id;
      
      res.redirect('/');
    } catch (error) {
      console.error('Magic link verification error:', error);
      res.redirect('/?error=verification_failed');
    }
  });

  app.get('/api/auth/user', isAuthenticated, async (req: Request, res: Response) => {
    const user = (req as any).user;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      credits: user.credits,
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: '로그아웃 중 오류가 발생했습니다.' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: '로그아웃되었습니다.' });
    });
  });

  app.post('/api/auth/set-password', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { password } = req.body;
      
      if (!password || password.length < 8) {
        return res.status(400).json({ message: '비밀번호는 8자 이상이어야 합니다.' });
      }
      
      const passwordHash = await hashPassword(password);
      
      await storage.upsertUser({
        id: user.id,
        email: user.email,
        passwordHash,
      });
      
      res.json({ message: '비밀번호가 설정되었습니다.' });
    } catch (error) {
      console.error('Set password error:', error);
      res.status(500).json({ message: '비밀번호 설정 중 오류가 발생했습니다.' });
    }
  });
  
  // Delay cleanup to allow database connection to stabilize in production
  setTimeout(() => {
    storage.cleanupExpiredTokens().catch(err => {
      console.error('Failed to cleanup expired tokens:', err);
    });
  }, 10000); // Wait 10 seconds before cleanup
}
