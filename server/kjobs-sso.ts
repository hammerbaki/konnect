import crypto from 'crypto';
import { Request, Response } from 'express';
import { storage } from './storage';

const SSO_SECRET = process.env.KJOBS_SSO_SECRET;

interface SSOPayload {
  userId: string;
  email?: string;
  name?: string;
  exp: number;
  iat: number;
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = str.length % 4;
  if (padding) {
    str += '='.repeat(4 - padding);
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

function verifyHmacSignature(token: string, secret: string): SSOPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.error('SSO: Invalid token format - expected 3 parts');
    return null;
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const providedSignature = signatureB64.replace(/=+$/, '');

  if (expectedSignature.length !== providedSignature.length) {
    console.error('SSO: Signature length mismatch');
    return null;
  }

  if (!crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(providedSignature)
  )) {
    console.error('SSO: Signature verification failed');
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as SSOPayload;
    
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.error('SSO: Token expired');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('SSO: Failed to parse payload', error);
    return null;
  }
}

export async function handleKJobsSSO(req: Request, res: Response) {
  const token = req.query.token as string;
  
  if (!token) {
    console.error('SSO: No token provided');
    return res.redirect('/?error=sso_no_token');
  }

  if (!SSO_SECRET) {
    console.error('SSO: KJOBS_SSO_SECRET not configured');
    return res.redirect('/?error=sso_config_error');
  }

  const payload = verifyHmacSignature(token, SSO_SECRET);
  
  if (!payload) {
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
      (req.user as any) = {
        claims: () => ({
          sub: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.id,
          email: user.email,
        }),
      };
    }

    const redirectUrl = req.query.redirect as string || '/dashboard';
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

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const payload = Buffer.from(JSON.stringify({
    userId,
    email,
    name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const signature = crypto
    .createHmac('sha256', SSO_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${header}.${payload}.${signature}`;
}
