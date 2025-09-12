import { Request, Response, NextFunction } from 'express';
import { creditService, quotaService, usageTracker } from '../credit';

export interface CreditCheckOptions {
  model?: string;
  estimatedTokens?: number;
  requiredCredits?: number;
  allowFreeCredits?: boolean;
}

// Middleware to check credit balance before AI operations
export function checkCredits(options: CreditCheckOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: Get userId from authenticated user session
      const userId = req.body.userId || req.query.userId || "default-user";
      const { model = 'gpt-4o-mini', estimatedTokens = 1000, allowFreeCredits = true } = options;
      
      // Calculate required credits
      let requiredCredits = options.requiredCredits;
      if (!requiredCredits) {
        // Estimate credits based on model and tokens
        const estimate = usageTracker.estimateCreditsForMessage(model, estimatedTokens);
        requiredCredits = estimate.estimatedCredits;
      }
      
      // Store required credits in request for later deduction
      (req as any).requiredCredits = requiredCredits;
      (req as any).userId = userId;
      (req as any).model = model;
      
      // Check quota
      const quotaCheck = await quotaService.checkQuota(userId, requiredCredits);
      
      if (!quotaCheck.allowed) {
        // Return appropriate error based on reason
        if (quotaCheck.reason === 'RATE_LIMITED') {
          res.status(429).json({
            error: 'Rate limit exceeded',
            message: `Please wait ${quotaCheck.waitTime} seconds before trying again`,
            retryAfter: quotaCheck.waitTime
          });
          return;
        }
        
        if (quotaCheck.reason === 'INSUFFICIENT_CREDITS') {
          const creditInfo = await creditService.getCreditInfo(userId);
          const suggestion = await quotaService.getSuggestedUpgrade(userId);
          
          res.status(402).json({
            error: 'Insufficient credits',
            message: 'You do not have enough credits for this operation',
            requiredCredits,
            currentBalance: creditInfo.balance,
            suggestion
          });
          return;
        }
        
        // Generic quota exceeded
        res.status(403).json({
          error: 'Quota exceeded',
          message: quotaCheck.reason || 'You have exceeded your usage quota'
        });
        return;
      }
      
      // All checks passed, continue to next middleware
      next();
    } catch (error) {
      console.error('Credit check error:', error);
      res.status(500).json({
        error: 'Credit system error',
        message: 'Unable to verify credit balance'
      });
    }
  };
}

// Middleware to deduct credits after successful AI operation
export function deductCredits() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to deduct credits on successful response
    res.json = function(data: any) {
      // Check if response was successful (2xx status code)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = (req as any).userId;
        const requiredCredits = (req as any).requiredCredits;
        const model = (req as any).model;
        
        if (userId && requiredCredits) {
          // Deduct credits asynchronously
          usageTracker.trackUsage(
            userId,
            model,
            requiredCredits,
            'ai-chat'
          ).catch(error => {
            console.error('Failed to deduct credits:', error);
          });
        }
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
}

// Middleware to track API usage
export function trackUsage(feature: string = 'api') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Store original end method
    const originalEnd = res.end;
    
    // Override end method to track usage
    res.end = function(...args: any[]) {
      const duration = Date.now() - startTime;
      const userId = (req as any).userId || 'anonymous';
      
      // Log usage asynchronously
      setImmediate(() => {
        console.log(`API Usage: ${feature} by ${userId} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
      });
      
      // Call original end method
      return originalEnd.apply(this, args);
    };
    
    next();
  };
}

// Middleware to enforce subscription limits
export function enforceSubscriptionLimits() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: Get userId from authenticated user session
      const userId = req.body.userId || req.query.userId || "default-user";
      
      // Get user's subscription info
      const creditInfo = await creditService.getCreditInfo(userId);
      
      // Check if user has active subscription
      if (creditInfo.subscription) {
        // Check subscription-specific limits
        const quotaStatus = await quotaService.getQuotaStatus(userId);
        
        // Check if within subscription limits
        if (quotaStatus.rateLimits) {
          const { requests, perMinute } = quotaStatus.rateLimits;
          
          // Store rate limit info in response headers
          res.setHeader('X-RateLimit-Limit', perMinute.toString());
          res.setHeader('X-RateLimit-Remaining', Math.max(0, perMinute - requests).toString());
          
          if (requests >= perMinute) {
            res.status(429).json({
              error: 'Rate limit exceeded',
              message: `Subscription limit: ${perMinute} requests per minute`,
              retryAfter: 60
            });
            return;
          }
        }
      }
      
      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      // Don't block on error, just log it
      next();
    }
  };
}

// Middleware to add credit info to response headers
export function addCreditHeaders() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: Get userId from authenticated user session
      const userId = req.body.userId || req.query.userId || "default-user";
      
      // Get credit info
      const creditInfo = await creditService.getCreditInfo(userId);
      const quotaStatus = await quotaService.getQuotaStatus(userId);
      
      // Add credit info to response headers
      res.setHeader('X-Credits-Balance', creditInfo.balance.toString());
      res.setHeader('X-Credits-Daily-Free', quotaStatus.credits.dailyFree.toString());
      res.setHeader('X-Credits-Daily-Used', quotaStatus.credits.dailyFreeUsed.toString());
      
      if (quotaStatus.rateLimits) {
        res.setHeader('X-RateLimit-Requests', quotaStatus.rateLimits.requests.toString());
        res.setHeader('X-RateLimit-PerMinute', quotaStatus.rateLimits.perMinute.toString());
      }
    } catch (error) {
      // Don't block on error, just log it
      console.error('Failed to add credit headers:', error);
    }
    
    next();
  };
}