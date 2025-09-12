import { creditService } from "./credit-service";
import { usageTracker } from "./usage-tracker";

interface QuotaConfig {
  dailyFreeCredits: number;
  maxCreditsPerRequest: number;
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
}

const DEFAULT_QUOTA: QuotaConfig = {
  dailyFreeCredits: 5,
  maxCreditsPerRequest: 100,
  maxRequestsPerMinute: 10,
  maxRequestsPerHour: 100,
  maxRequestsPerDay: 500,
};

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, {
  minute: { count: number; reset: number };
  hour: { count: number; reset: number };
  day: { count: number; reset: number };
}>();

export class QuotaService {
  private static instance: QuotaService;
  private quotaConfig: QuotaConfig;
  
  private constructor() {
    this.quotaConfig = DEFAULT_QUOTA;
  }
  
  static getInstance(): QuotaService {
    if (!QuotaService.instance) {
      QuotaService.instance = new QuotaService();
    }
    return QuotaService.instance;
  }

  /**
   * Check if user can make a request
   */
  async checkQuota(userId: string, requiredCredits: number): Promise<{
    allowed: boolean;
    reason?: string;
    remainingCredits?: number;
    nextFreeCredits?: Date;
  }> {
    // Check credit balance
    const balance = await creditService.checkBalance(userId);
    
    if (balance < requiredCredits) {
      const freeCredits = await creditService.getDailyFreeCredits(userId);
      
      if (freeCredits >= requiredCredits) {
        // Can use free credits
        return {
          allowed: true,
          remainingCredits: balance,
        };
      }
      
      // Calculate next free credit reset time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      return {
        allowed: false,
        reason: `Insufficient credits. You need ${requiredCredits} credits but have ${balance}. Daily free credits: ${freeCredits}/5.`,
        remainingCredits: balance,
        nextFreeCredits: tomorrow,
      };
    }
    
    // Check if request exceeds max credits per request
    if (requiredCredits > this.quotaConfig.maxCreditsPerRequest) {
      return {
        allowed: false,
        reason: `Request exceeds maximum credits per request (${this.quotaConfig.maxCreditsPerRequest})`,
        remainingCredits: balance,
      };
    }
    
    // Check rate limits
    const rateLimitCheck = this.checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return {
        allowed: false,
        reason: rateLimitCheck.reason,
        remainingCredits: balance,
      };
    }
    
    return {
      allowed: true,
      remainingCredits: balance,
    };
  }

  /**
   * Check rate limits for a user
   */
  private checkRateLimit(userId: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const userLimits = rateLimitStore.get(userId) || {
      minute: { count: 0, reset: now + 60000 },
      hour: { count: 0, reset: now + 3600000 },
      day: { count: 0, reset: now + 86400000 },
    };
    
    // Reset counters if time windows have passed
    if (now > userLimits.minute.reset) {
      userLimits.minute = { count: 0, reset: now + 60000 };
    }
    if (now > userLimits.hour.reset) {
      userLimits.hour = { count: 0, reset: now + 3600000 };
    }
    if (now > userLimits.day.reset) {
      userLimits.day = { count: 0, reset: now + 86400000 };
    }
    
    // Check limits
    if (userLimits.minute.count >= this.quotaConfig.maxRequestsPerMinute) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: Max ${this.quotaConfig.maxRequestsPerMinute} requests per minute`,
      };
    }
    
    if (userLimits.hour.count >= this.quotaConfig.maxRequestsPerHour) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: Max ${this.quotaConfig.maxRequestsPerHour} requests per hour`,
      };
    }
    
    if (userLimits.day.count >= this.quotaConfig.maxRequestsPerDay) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: Max ${this.quotaConfig.maxRequestsPerDay} requests per day`,
      };
    }
    
    // Increment counters
    userLimits.minute.count++;
    userLimits.hour.count++;
    userLimits.day.count++;
    
    rateLimitStore.set(userId, userLimits);
    
    return { allowed: true };
  }

  /**
   * Record a request for rate limiting
   */
  recordRequest(userId: string): void {
    const now = Date.now();
    const userLimits = rateLimitStore.get(userId) || {
      minute: { count: 0, reset: now + 60000 },
      hour: { count: 0, reset: now + 3600000 },
      day: { count: 0, reset: now + 86400000 },
    };
    
    // Increment counters (already done in checkRateLimit, but this is for explicit recording)
    rateLimitStore.set(userId, userLimits);
  }

  /**
   * Get user's quota status
   */
  async getQuotaStatus(userId: string): Promise<{
    credits: {
      balance: number;
      dailyFree: number;
      dailyFreeUsed: number;
    };
    rateLimits: {
      requestsThisMinute: number;
      requestsThisHour: number;
      requestsToday: number;
      maxPerMinute: number;
      maxPerHour: number;
      maxPerDay: number;
    };
    nextReset: {
      dailyFreeCredits: Date;
      minuteRateLimit: Date;
      hourRateLimit: Date;
      dayRateLimit: Date;
    };
  }> {
    const creditInfo = await creditService.getCreditInfo(userId);
    const freeCreditsAvailable = await creditService.getDailyFreeCredits(userId);
    
    const now = Date.now();
    const userLimits = rateLimitStore.get(userId) || {
      minute: { count: 0, reset: now + 60000 },
      hour: { count: 0, reset: now + 3600000 },
      day: { count: 0, reset: now + 86400000 },
    };
    
    // Calculate next daily reset
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return {
      credits: {
        balance: creditInfo.balance,
        dailyFree: freeCreditsAvailable,
        dailyFreeUsed: creditInfo.freeCreditsUsed,
      },
      rateLimits: {
        requestsThisMinute: userLimits.minute.count,
        requestsThisHour: userLimits.hour.count,
        requestsToday: userLimits.day.count,
        maxPerMinute: this.quotaConfig.maxRequestsPerMinute,
        maxPerHour: this.quotaConfig.maxRequestsPerHour,
        maxPerDay: this.quotaConfig.maxRequestsPerDay,
      },
      nextReset: {
        dailyFreeCredits: tomorrow,
        minuteRateLimit: new Date(userLimits.minute.reset),
        hourRateLimit: new Date(userLimits.hour.reset),
        dayRateLimit: new Date(userLimits.day.reset),
      },
    };
  }

  /**
   * Reset daily quota for a user (admin function)
   */
  async resetDailyQuota(userId: string): Promise<void> {
    await creditService.getDailyFreeCredits(userId); // This will trigger a reset if needed
  }

  /**
   * Update quota configuration (admin function)
   */
  updateQuotaConfig(config: Partial<QuotaConfig>): void {
    this.quotaConfig = { ...this.quotaConfig, ...config };
  }

  /**
   * Clear rate limit for a user (admin function)
   */
  clearRateLimit(userId: string): void {
    rateLimitStore.delete(userId);
  }

  /**
   * Get suggested upgrade based on usage pattern
   */
  async getSuggestedUpgrade(userId: string): Promise<{
    currentPlan: string;
    suggestedPlan?: string;
    reason?: string;
  }> {
    const creditInfo = await creditService.getCreditInfo(userId);
    const stats = await usageTracker.getUserUsageStats(userId);
    
    // Analyze usage pattern
    const avgCreditsPerDay = stats.totalCreditsUsed / 30; // Assume 30-day period
    
    if (!creditInfo.subscription) {
      if (avgCreditsPerDay > 5) {
        return {
          currentPlan: 'Free',
          suggestedPlan: 'Pro',
          reason: `You're using an average of ${Math.round(avgCreditsPerDay)} credits per day. The Pro plan includes 2,000 credits per month.`,
        };
      }
      return { currentPlan: 'Free' };
    }
    
    if (creditInfo.subscription.plan === 'pro' && avgCreditsPerDay > 66) {
      return {
        currentPlan: 'Pro',
        suggestedPlan: 'Business',
        reason: `You're using an average of ${Math.round(avgCreditsPerDay)} credits per day. The Business plan includes 10,000 credits per month.`,
      };
    }
    
    return { currentPlan: creditInfo.subscription.plan };
  }
}

export const quotaService = QuotaService.getInstance();