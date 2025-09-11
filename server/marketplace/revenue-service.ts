import { storage } from "../storage";
import {
  type MarketplaceItem,
  type MarketplaceTransaction,
  type MarketplaceLicense,
  type InsertMarketplaceTransaction,
  type InsertMarketplaceLicense
} from "@shared/schema";
import crypto from "crypto";

// Revenue and payment management service
export class RevenueService {
  private static instance: RevenueService;

  private constructor() {}

  static getInstance(): RevenueService {
    if (!RevenueService.instance) {
      RevenueService.instance = new RevenueService();
    }
    return RevenueService.instance;
  }

  // Process payment for item purchase
  async processPurchase(
    itemId: string,
    userId: string,
    paymentDetails: {
      paymentMethodId?: string;
      amount: number;
      currency: string;
    }
  ): Promise<{
    transaction: MarketplaceTransaction;
    license: MarketplaceLicense;
  }> {
    // Get item details
    const item = await storage.getMarketplaceItem(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    if (item.price === 0) {
      throw new Error('Item is free, no purchase needed');
    }

    // Validate payment amount
    if (paymentDetails.amount !== item.price) {
      throw new Error('Invalid payment amount');
    }

    // Process payment (mock implementation)
    // In production, integrate with Stripe or other payment processor
    const paymentId = `pay_${crypto.randomUUID()}`;
    const paymentStatus = 'succeeded'; // Mock success

    if (paymentStatus !== 'succeeded') {
      throw new Error('Payment failed');
    }

    // Calculate revenue split
    const authorRevenue = item.price * (item.revenueShare || 0.7);
    const platformRevenue = item.price * (1 - (item.revenueShare || 0.7));

    // Create transaction record
    const transaction = await storage.createMarketplaceTransaction({
      itemId,
      userId,
      authorId: item.authorId,
      type: 'purchase',
      amount: item.price,
      currency: item.currency || 'USD',
      status: 'completed',
      paymentProvider: 'stripe',
      paymentId,
      authorRevenue,
      platformRevenue,
      metadata: {
        paymentMethodId: paymentDetails.paymentMethodId
      }
    });

    // Generate license
    const license = await this.generateLicense(itemId, userId, item.pricingModel);

    // Update author revenue
    const author = await storage.getMarketplaceAuthor(item.authorId);
    if (author) {
      await storage.updateMarketplaceAuthor(item.authorId, {
        totalRevenue: author.totalRevenue + authorRevenue
      });
    }

    // Track sale
    await storage.updateMarketplaceItem(itemId, {
      downloads: item.downloads + 1
    });

    return { transaction, license };
  }

  // Process subscription payment
  async processSubscription(
    itemId: string,
    userId: string,
    action: 'subscribe' | 'cancel' | 'renew'
  ): Promise<MarketplaceTransaction> {
    const item = await storage.getMarketplaceItem(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    if (item.pricingModel !== 'subscription') {
      throw new Error('Item is not subscription-based');
    }

    const subscriptionPrice = item.subscriptionPrice || 0;
    if (subscriptionPrice === 0) {
      throw new Error('Invalid subscription price');
    }

    let transactionType: 'subscription' | 'renewal' | 'cancellation';
    let amount = 0;

    switch (action) {
      case 'subscribe':
        transactionType = 'subscription';
        amount = subscriptionPrice;
        break;
      case 'renew':
        transactionType = 'renewal';
        amount = subscriptionPrice;
        break;
      case 'cancel':
        transactionType = 'cancellation';
        amount = 0;
        break;
    }

    // Process subscription (mock)
    const subscriptionId = `sub_${crypto.randomUUID()}`;
    
    // Calculate revenue split
    const authorRevenue = amount * (item.revenueShare || 0.7);
    const platformRevenue = amount * (1 - (item.revenueShare || 0.7));

    // Create transaction
    const transaction = await storage.createMarketplaceTransaction({
      itemId,
      userId,
      authorId: item.authorId,
      type: transactionType,
      amount,
      currency: item.currency || 'USD',
      status: 'completed',
      paymentProvider: 'stripe',
      paymentId: subscriptionId,
      authorRevenue,
      platformRevenue,
      metadata: {
        subscriptionId,
        action
      }
    });

    // Update or create license
    if (action === 'subscribe' || action === 'renew') {
      const existingLicense = await this.getLicenseByUserAndItem(userId, itemId);
      if (existingLicense) {
        // Extend existing license
        const newValidUntil = new Date();
        newValidUntil.setMonth(newValidUntil.getMonth() + 1);
        // TODO: Update license expiry
      } else {
        // Create new subscription license
        await this.generateLicense(itemId, userId, 'subscription');
      }
    } else if (action === 'cancel') {
      // Mark license as cancelled
      const license = await this.getLicenseByUserAndItem(userId, itemId);
      if (license) {
        // TODO: Update license status to cancelled
      }
    }

    return transaction;
  }

  // Generate license key
  private async generateLicense(
    itemId: string,
    userId: string,
    pricingModel: string
  ): Promise<MarketplaceLicense> {
    const licenseType = pricingModel === 'subscription' ? 'subscription' : 'perpetual';
    
    // Set validity period
    let validUntil: Date | null = null;
    if (licenseType === 'subscription') {
      validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + 1); // 1 month subscription
    }

    const license = await storage.createMarketplaceLicense({
      itemId,
      userId,
      type: licenseType,
      status: 'active',
      maxActivations: licenseType === 'subscription' ? 5 : 1,
      validUntil,
      features: {
        updates: true,
        support: licenseType === 'subscription',
        commercial: true
      },
      restrictions: {}
    });

    return license;
  }

  // Verify license
  async verifyLicense(
    licenseKey: string,
    itemId?: string
  ): Promise<{
    valid: boolean;
    license?: MarketplaceLicense;
    reason?: string;
  }> {
    const license = await storage.getMarketplaceLicense(licenseKey);
    
    if (!license) {
      return { valid: false, reason: 'License not found' };
    }

    // Check if license matches item
    if (itemId && license.itemId !== itemId) {
      return { valid: false, reason: 'License not valid for this item' };
    }

    // Check status
    if (license.status !== 'active') {
      return { valid: false, reason: `License is ${license.status}` };
    }

    // Check expiry
    if (license.validUntil && new Date() > license.validUntil) {
      return { valid: false, reason: 'License expired' };
    }

    // Check activation limit
    if (license.currentActivations >= license.maxActivations) {
      return { valid: false, reason: 'Activation limit reached' };
    }

    return { valid: true, license };
  }

  // Activate license
  async activateLicense(
    licenseKey: string,
    deviceId: string
  ): Promise<MarketplaceLicense> {
    const verification = await this.verifyLicense(licenseKey);
    
    if (!verification.valid || !verification.license) {
      throw new Error(verification.reason || 'Invalid license');
    }

    // TODO: Update license activation count
    // await storage.updateMarketplaceLicense(verification.license.id, {
    //   currentActivations: verification.license.currentActivations + 1
    // });

    return verification.license;
  }

  // Process refund
  async processRefund(
    transactionId: string,
    reason: string
  ): Promise<MarketplaceTransaction> {
    // TODO: Get transaction from storage
    // const transaction = await storage.getMarketplaceTransaction(transactionId);
    
    // Mock refund processing
    const refundId = `refund_${crypto.randomUUID()}`;
    
    // Create refund transaction
    const refundTransaction = await storage.createMarketplaceTransaction({
      itemId: 'mock-item-id', // Would come from original transaction
      userId: 'mock-user-id',
      authorId: 'mock-author-id',
      type: 'refund',
      amount: -100, // Negative amount for refund
      currency: 'USD',
      status: 'completed',
      paymentProvider: 'stripe',
      paymentId: refundId,
      authorRevenue: -70,
      platformRevenue: -30,
      metadata: {
        originalTransactionId: transactionId,
        reason
      }
    });

    // Revoke license
    // TODO: Find and revoke license associated with transaction

    return refundTransaction;
  }

  // Get user's licenses
  async getUserLicenses(userId: string): Promise<MarketplaceLicense[]> {
    // TODO: Implement getUserMarketplaceLicenses in storage
    return [];
  }

  // Get license by user and item
  private async getLicenseByUserAndItem(
    userId: string,
    itemId: string
  ): Promise<MarketplaceLicense | null> {
    // TODO: Implement this query in storage
    return null;
  }

  // Calculate author payouts
  async calculatePayouts(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    authorId: string;
    totalRevenue: number;
    transactionCount: number;
    items: Array<{
      itemId: string;
      revenue: number;
      sales: number;
    }>;
  }>> {
    // TODO: Implement transaction aggregation
    // This would query transactions within date range
    // Group by author and calculate totals
    
    return [];
  }

  // Process payout to author
  async processPayout(
    authorId: string,
    amount: number
  ): Promise<void> {
    const author = await storage.getMarketplaceAuthor(authorId);
    if (!author) {
      throw new Error('Author not found');
    }

    if (!author.stripeAccountId) {
      throw new Error('Author has not set up payment account');
    }

    // TODO: Process actual payout via Stripe Connect
    console.log(`Processing payout of ${amount} to author ${authorId}`);
    
    // Record payout transaction
    await storage.createMarketplaceTransaction({
      itemId: '', // Payout not tied to specific item
      userId: authorId,
      authorId,
      type: 'payout',
      amount,
      currency: 'USD',
      status: 'completed',
      paymentProvider: 'stripe',
      paymentId: `payout_${crypto.randomUUID()}`,
      authorRevenue: amount,
      platformRevenue: 0,
      metadata: {
        stripeAccountId: author.stripeAccountId
      }
    });
  }

  // Get revenue analytics
  async getRevenueAnalytics(
    authorId?: string,
    timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    averageTransactionValue: number;
    topItems: Array<{
      itemId: string;
      name: string;
      revenue: number;
      sales: number;
    }>;
    revenueByDay: Array<{
      date: string;
      revenue: number;
      transactions: number;
    }>;
  }> {
    // TODO: Implement analytics aggregation
    // This would query and aggregate transaction data
    
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      averageTransactionValue: 0,
      topItems: [],
      revenueByDay: []
    };
  }

  // Apply coupon/discount
  async applyCoupon(
    itemId: string,
    couponCode: string
  ): Promise<{
    valid: boolean;
    discount: number;
    finalPrice: number;
  }> {
    const item = await storage.getMarketplaceItem(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    // Mock coupon validation
    const validCoupons: Record<string, number> = {
      'LAUNCH20': 0.2,
      'STUDENT50': 0.5,
      'BETA30': 0.3
    };

    const discountRate = validCoupons[couponCode];
    if (!discountRate) {
      return {
        valid: false,
        discount: 0,
        finalPrice: item.price
      };
    }

    const discount = item.price * discountRate;
    const finalPrice = item.price - discount;

    return {
      valid: true,
      discount,
      finalPrice
    };
  }

  // Update payment settings for author
  async updatePaymentSettings(
    authorId: string,
    settings: {
      stripeAccountId?: string;
      paypalEmail?: string;
      payoutFrequency?: 'weekly' | 'monthly';
      minimumPayout?: number;
    }
  ): Promise<void> {
    const author = await storage.getMarketplaceAuthor(authorId);
    if (!author) {
      throw new Error('Author not found');
    }

    await storage.updateMarketplaceAuthor(authorId, {
      stripeAccountId: settings.stripeAccountId,
      payoutSettings: {
        ...author.payoutSettings,
        ...settings
      }
    });
  }

  // Generate sales report
  async generateSalesReport(
    authorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    period: string;
    totalSales: number;
    totalRevenue: number;
    totalRefunds: number;
    netRevenue: number;
    items: Array<{
      itemName: string;
      sales: number;
      revenue: number;
      refunds: number;
    }>;
  }> {
    // TODO: Generate detailed sales report
    return {
      period: `${startDate.toISOString()} - ${endDate.toISOString()}`,
      totalSales: 0,
      totalRevenue: 0,
      totalRefunds: 0,
      netRevenue: 0,
      items: []
    };
  }
}

export const revenueService = RevenueService.getInstance();