import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { loadAndValidateConfig } from './config.js';

// Strict UUIDv4 pattern
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUIDv4(id: string): boolean {
  return typeof id === 'string' && UUID_V4_REGEX.test(id.trim());
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashSessionToken(token: string, secret?: string): string {
  const effectiveSecret = secret || loadAndValidateConfig().sessionTokenSecret;
  return crypto.createHmac('sha256', effectiveSecret).update(token).digest('hex');
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// In-Memory Rate Limiter
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up stale rate limits every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
  const config = loadAndValidateConfig();
  const now = Date.now();

  // Key by authenticated session ID if present in header, otherwise client IP / header
  const authHeader = req.headers['authorization'];
  const sessionHeader = req.headers['x-session-id'] as string;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-client';
  
  const rateLimitKey = sessionHeader || (typeof authHeader === 'string' ? authHeader.slice(-16) : clientIp);

  const windowMs = config.rateLimitWindowSeconds * 1000;
  const maxRequests = config.rateLimitRequests;

  let record = rateLimitStore.get(rateLimitKey);
  if (!record || record.resetTime < now) {
    record = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(rateLimitKey, record);
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - 1).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());
    return next();
  }

  record.count += 1;
  const remaining = Math.max(0, maxRequests - record.count);
  res.setHeader('X-RateLimit-Limit', maxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());

  if (record.count > maxRequests) {
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfterSec.toString());
    res.status(429).json({
      error_code: 'RATE_LIMITED',
      message: 'Too many requests. Please wait before retrying.',
      retry_after_seconds: retryAfterSec,
    });
    return;
  }

  next();
}

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  // Content Security Policy permitting Vite dev & Three.js canvas
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:; media-src 'self' blob:; frame-ancestors 'self' *;"
  );
  next();
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const config = loadAndValidateConfig();
  const origin = req.headers.origin;

  if (origin) {
    const isAllowed =
      config.allowedOrigins.includes('*') ||
      config.allowedOrigins.includes(origin) ||
      config.environment === 'development' ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1');

    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-ID, Idempotency-Key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
}
