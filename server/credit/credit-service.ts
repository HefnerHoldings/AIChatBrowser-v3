import { db } from "../db";
import { 
  userCredits, 
  creditTransactions, 
  subscriptions,
  type InsertCreditTransaction,
  type UserCredits,
  type Subscription
} from "@shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export class CreditService {
  private static instance: CreditService;
  
  private constructor() {}
  
  static getInstance(): CreditService {
    if (!CreditService.instance) {
      CreditService.instance = new CreditService();
    }
    return CreditService.instance;
  }

  /**
   * Get or create user credits record
   */
  async ensureUserCredits(userId: string): Promise<UserCredits> {
    const existing = await db.select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }

    // Create new user with 5 free credits
    const newCredits = await db.insert(userCredits)
      .values({
        userId,
        balance: 5,
        totalPurchased: 0,
        totalUsed: 0,
        freeCreditsUsed: 0,
      })
      .returning();
    
    return newCredits[0];
  }

  /**
   * Check user's credit balance
   */
  async checkBalance(userId: string): Promise<number> {
    const credits = await this.ensureUserCredits(userId);
    return credits.balance;
  }

  /**
   * Get detailed credit information
   */
  async getCreditInfo(userId: string): Promise<{
    balance: number;
    totalPurchased: number;
    totalUsed: number;
    freeCreditsUsed: number;
    subscription: Subscription | null;
  }> {
    const credits = await this.ensureUserCredits(userId);
    
    const userSubscription = await db.select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      ))
      .limit(1);

    return {
      balance: credits.balance,
      totalPurchased: credits.totalPurchased,
      totalUsed: credits.totalUsed,
      freeCreditsUsed: credits.freeCreditsUsed,
      subscription: userSubscription[0] || null,
    };
  }

  /**
   * Deduct credits from user balance
   */
  async deductCredits(
    userId: string, 
    amount: number, 
    reason: string,
    metadata?: any
  ): Promise<boolean> {
    const credits = await this.ensureUserCredits(userId);
    
    if (credits.balance < amount) {
      return false; // Insufficient credits
    }

    // Start transaction
    await db.transaction(async (tx) => {
      // Update balance
      await tx.update(userCredits)
        .set({
          balance: sql`${userCredits.balance} - ${amount}`,
          totalUsed: sql`${userCredits.totalUsed} + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId));

      // Log transaction
      await tx.insert(creditTransactions)
        .values({
          userId,
          amount: -amount, // Negative for deduction
          type: 'usage',
          description: reason,
          metadata,
        });
    });

    return true;
  }

  /**
   * Add credits to user balance
   */
  async addCredits(
    userId: string, 
    amount: number, 
    reason: string,
    stripePaymentId?: string,
    stripeSessionId?: string
  ): Promise<void> {
    await this.ensureUserCredits(userId);

    await db.transaction(async (tx) => {
      // Update balance
      await tx.update(userCredits)
        .set({
          balance: sql`${userCredits.balance} + ${amount}`,
          totalPurchased: stripePaymentId 
            ? sql`${userCredits.totalPurchased} + ${amount}`
            : userCredits.totalPurchased,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId));

      // Log transaction
      await tx.insert(creditTransactions)
        .values({
          userId,
          amount, // Positive for addition
          type: stripePaymentId ? 'purchase' : 'bonus',
          description: reason,
          stripePaymentId,
          stripeSessionId,
        });
    });
  }

  /**
   * Get daily free credits (resets daily)
   */
  async getDailyFreeCredits(userId: string): Promise<number> {
    const credits = await this.ensureUserCredits(userId);
    const now = new Date();
    const lastReset = new Date(credits.lastFreeReset);
    
    // Check if it's a new day
    if (now.toDateString() !== lastReset.toDateString()) {
      // Reset daily free credits
      await db.update(userCredits)
        .set({
          freeCreditsUsed: 0,
          lastFreeReset: now,
          updatedAt: now,
        })
        .where(eq(userCredits.userId, userId));
      
      return 5; // Full 5 free credits available
    }
    
    return Math.max(0, 5 - credits.freeCreditsUsed);
  }

  /**
   * Use daily free credits
   */
  async useFreeCredits(userId: string, amount: number): Promise<boolean> {
    const available = await this.getDailyFreeCredits(userId);
    
    if (available < amount) {
      return false;
    }

    await db.update(userCredits)
      .set({
        freeCreditsUsed: sql`${userCredits.freeCreditsUsed} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, userId));

    // Log the free credit usage
    await db.insert(creditTransactions)
      .values({
        userId,
        amount: 0, // No balance change for free credits
        type: 'free_usage',
        description: `Used ${amount} daily free credits`,
      });

    return true;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    userId: string, 
    limit: number = 50
  ): Promise<any[]> {
    return await db.select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(sql`${creditTransactions.createdAt} DESC`)
      .limit(limit);
  }

  /**
   * Process subscription renewal
   */
  async processSubscriptionRenewal(
    userId: string,
    plan: string,
    creditsAmount: number
  ): Promise<void> {
    await this.addCredits(
      userId,
      creditsAmount,
      `Monthly subscription renewal - ${plan} plan`,
    );

    // Update subscription period
    await db.update(subscriptions)
      .set({
        creditsRemainingThisPeriod: creditsAmount,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId));
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<void> {
    await db.update(subscriptions)
      .set({
        status: 'canceled',
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId));
  }
}

export const creditService = CreditService.getInstance();