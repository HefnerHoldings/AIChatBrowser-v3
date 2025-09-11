import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import crypto from 'crypto';
import { z } from 'zod';

// Rate limiters for different endpoints
const rateLimiters = {
  general: new RateLimiterMemory({
    points: 100, // Number of requests
    duration: 60, // Per 60 seconds
    blockDuration: 60, // Block for 1 minute
  }),
  auth: new RateLimiterMemory({
    points: 5, // 5 login attempts
    duration: 900, // Per 15 minutes
    blockDuration: 900, // Block for 15 minutes
  }),
  api: new RateLimiterMemory({
    points: 1000,
    duration: 60,
    blockDuration: 60,
  }),
  heavy: new RateLimiterMemory({
    points: 10,
    duration: 60,
    blockDuration: 300, // Block for 5 minutes
  }),
};

// Rate limiting middleware factory
export function createRateLimiter(type: keyof typeof rateLimiters = 'general') {
  const limiter = rateLimiters[type];
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `${req.ip}-${req.path}`;
      await limiter.consume(key);
      next();
    } catch (error) {
      res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.round((error as any).msBeforeNext / 1000) || 60,
      });
    }
  };
}

// CSRF token generation and validation
const csrfTokens = new Map<string, { token: string; expires: number }>();

export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 3600000; // 1 hour
  
  csrfTokens.set(sessionId, { token, expires });
  
  // Clean up expired tokens
  for (const [id, data] of csrfTokens.entries()) {
    if (data.expires < Date.now()) {
      csrfTokens.delete(id);
    }
  }
  
  return token;
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  const data = csrfTokens.get(sessionId);
  
  if (!data || data.expires < Date.now()) {
    return false;
  }
  
  return data.token === token;
}

// CSRF protection middleware
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for GET requests and API endpoints that use JWT
  if (req.method === 'GET' || req.path.startsWith('/api/')) {
    return next();
  }
  
  const sessionId = (req as any).session?.id;
  const token = req.headers['x-csrf-token'] as string || req.body._csrf;
  
  if (!sessionId || !token || !validateCSRFToken(sessionId, token)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  next();
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' wss: https:; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );
  
  // Other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS (HTTP Strict Transport Security)
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  next();
}

// Input sanitization utility
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove any potential script tags and dangerous HTML
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '') // Remove event handlers
      .replace(/on\w+\s*=\s*'[^']*'/gi, '')
      .replace(/javascript:/gi, '')
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        // Sanitize both key and value
        const sanitizedKey = sanitizeInput(key);
        sanitized[sanitizedKey] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }
  
  return input;
}

// Input validation middleware factory
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize input first
      req.body = sanitizeInput(req.body);
      req.query = sanitizeInput(req.query);
      req.params = sanitizeInput(req.params);
      
      // Validate against schema
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      
      return res.status(400).json({
        error: 'Invalid input',
      });
    }
  };
}

// SQL injection prevention
export function preventSQLInjection(input: string): string {
  // Basic SQL injection prevention
  return input
    .replace(/['";\\]/g, '') // Remove quotes and semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comments
    .replace(/\*\//g, '')
    .replace(/\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|EXEC|EXECUTE)\b/gi, '');
}

// XSS prevention for output
export function escapeHTML(str: string): string {
  const htmlEscapes: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return str.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
}

// Authentication check middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = (req as any).session;
  
  if (!session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check session expiry
  if (session.expires && session.expires < Date.now()) {
    session.destroy((err: any) => {
      if (err) console.error('Session destruction error:', err);
    });
    return res.status(401).json({ error: 'Session expired' });
  }
  
  next();
}

// Permission check middleware factory
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check user permissions (implement based on your permission system)
    // This is a placeholder implementation
    const hasPermission = await checkUserPermission(userId, permission);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Placeholder permission checker
async function checkUserPermission(userId: string, permission: string): Promise<boolean> {
  // Implement your permission checking logic here
  // For now, return true for demo purposes
  return true;
}

// Request size limiting
export function limitRequestSize(maxSize: number = 10 * 1024 * 1024) { // 10MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      return res.status(413).json({ error: 'Request entity too large' });
    }
    
    next();
  };
}

// IP-based access control
const blockedIPs = new Set<string>();
const allowedIPs = new Set<string>();

export function ipAccessControl(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || '';
  
  // Check if IP is blocked
  if (blockedIPs.has(ip)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // If allowed IPs are configured, check if current IP is allowed
  if (allowedIPs.size > 0 && !allowedIPs.has(ip)) {
    return res.status(403).json({ error: 'Access restricted' });
  }
  
  next();
}

// Add IP to blocklist
export function blockIP(ip: string) {
  blockedIPs.add(ip);
}

// Remove IP from blocklist
export function unblockIP(ip: string) {
  blockedIPs.delete(ip);
}

// Add IP to allowlist
export function allowIP(ip: string) {
  allowedIPs.add(ip);
}

// Export all middleware
export const securityMiddleware = {
  rateLimiter: createRateLimiter,
  csrfProtection,
  securityHeaders,
  validateInput,
  requireAuth,
  requirePermission,
  limitRequestSize,
  ipAccessControl,
};

// Export utilities
export const securityUtils = {
  sanitizeInput,
  preventSQLInjection,
  escapeHTML,
  generateCSRFToken,
  validateCSRFToken,
  blockIP,
  unblockIP,
  allowIP,
};