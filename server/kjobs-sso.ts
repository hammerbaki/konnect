import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { storage } from './storage';

const SSO_SECRET = process.env.KJOBS_SSO_SECRET || '';

interface SSOPayload {
  userId: string;
  email?: string;
  name?: string;
  exp?: number;
  iat?: number;
}

export async function handleKJobsSSO(req: Request, res: Response) {
  console.log('SSO: Received SSO request');
  const token = req.query.token as string;
  
  if (!token) {
    console.error('SSO: No token provided');
    return res.redirect('/?error=sso_no_token');
  }

  console.log('SSO: Token received, length:', token.length);

  if (!SSO_SECRET) {
    console.error('SSO: KJOBS_SSO_SECRET not configured');
    return res.redirect('/?error=sso_config_error');
  }

  console.log('SSO: Secret configured, verifying token with jwt.verify...');
  
  let payload: SSOPayload;
  try {
    payload = jwt.verify(token, SSO_SECRET, { algorithms: ['HS256'] }) as SSOPayload;
    console.log('SSO: Token verified successfully, userId:', payload.userId);
  } catch (error: any) {
    console.error('SSO: Token verification failed:', error.message);
    return res.redirect('/?error=sso_invalid_token');
  }

  if (!payload.userId) {
    console.error('SSO: No userId in token payload');
    return res.redirect('/?error=sso_invalid_token');
  }

  try {
    const ssoUserId = `kjobs_${payload.userId}`;
    
    const user = await storage.upsertUser({
      id: ssoUserId,
      email: payload.email || null,
      firstName: payload.name?.split(' ')[0] || null,
      lastName: payload.name?.split(' ').slice(1).join(' ') || null,
      profileImageUrl: null,
    });
    
    console.log(`SSO: User logged in via K-JOBS: ${user.id}`);

    if (req.session) {
      (req.session as any).userId = user.id;
      (req.session as any).ssoProvider = 'kjobs';
      (req.session as any).email = payload.email;
      (req.session as any).name = payload.name;
      (req.user as any) = {
        claims: () => ({
          sub: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.id,
          email: user.email,
        }),
      };
    }

    const redirectUrl = req.query.redirect as string || '/dashboard';
    console.log('SSO: Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('SSO: Error processing login', error);
    return res.redirect('/?error=sso_processing_error');
  }
}

export function generateTestToken(userId: string, email?: string, name?: string): string {
  if (!SSO_SECRET) {
    throw new Error('KJOBS_SSO_SECRET not configured');
  }

  return jwt.sign(
    {
      userId,
      email,
      name,
    },
    SSO_SECRET,
    { 
      algorithm: 'HS256',
      expiresIn: '1h'
    }
  );
}
