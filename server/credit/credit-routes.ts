import type { Express } from "express";
import { creditService, usageTracker, quotaService } from "./index";
import { storage } from "../storage";
import { z } from "zod";
import { 
  insertCreditPackSchema,
  insertCreditTransactionSchema,
  creditPacks
} from "@shared/schema";

// Stripe setup (only if configured)
let stripe: any = null;
if (process.env.STRIPE_SECRET_KEY) {
  const Stripe = require('stripe');
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
}

export function registerCreditRoutes(app: Express) {
  // Get user credit balance and info
  app.get("/api/credits/balance", async (req, res) => {
    try {
      // TODO: Get userId from authenticated user session
      const userId = req.query.userId as string || "default-user";
      const creditInfo = await creditService.getCreditInfo(userId);
      const quotaStatus = await quotaService.getQuotaStatus(userId);
      
      res.json({
        balance: creditInfo.balance,
        totalPurchased: creditInfo.totalPurchased,
        totalUsed: creditInfo.totalUsed,
        dailyFreeCredits: quotaStatus.credits.dailyFree,
        dailyFreeUsed: quotaStatus.credits.dailyFreeUsed,
        subscription: creditInfo.subscription,
        rateLimits: quotaStatus.rateLimits,
        nextReset: quotaStatus.nextReset,
      });
    } catch (error) {
      console.error("Error fetching credit balance:", error);
      res.status(500).json({ message: "Failed to fetch credit balance" });
    }
  });
  
  // Get transaction history
  app.get("/api/credits/history", async (req, res) => {
    try {
      // TODO: Get userId from authenticated user session
      const userId = req.query.userId as string || "default-user";
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      
      const history = await creditService.getTransactionHistory(userId, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      res.status(500).json({ message: "Failed to fetch transaction history" });
    }
  });
  
  // Get available credit packs
  app.get("/api/credits/packs", async (req, res) => {
    try {
      const packs = await storage.getCreditPacks();
      res.json(packs);
    } catch (error) {
      console.error("Error fetching credit packs:", error);
      res.status(500).json({ message: "Failed to fetch credit packs" });
    }
  });
  
  // Get model pricing
  app.get("/api/ai-chat/models", async (req, res) => {
    try {
      const models = usageTracker.getModelPricing();
      res.json(models);
    } catch (error) {
      console.error("Error fetching model pricing:", error);
      res.status(500).json({ message: "Failed to fetch model pricing" });
    }
  });
  
  // Estimate credits for a message
  app.post("/api/credits/estimate", async (req, res) => {
    try {
      const { model, messageLength } = req.body;
      
      if (!model || !messageLength) {
        res.status(400).json({ message: "Model and messageLength are required" });
        return;
      }
      
      const estimate = usageTracker.estimateCreditsForMessage(model, messageLength);
      res.json(estimate);
    } catch (error) {
      console.error("Error estimating credits:", error);
      res.status(500).json({ message: "Failed to estimate credits" });
    }
  });
  
  // Get usage statistics
  app.get("/api/credits/usage-stats", async (req, res) => {
    try {
      // TODO: Get userId from authenticated user session
      const userId = req.query.userId as string || "default-user";
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const stats = await usageTracker.getUserUsageStats(userId, startDate, endDate);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching usage statistics:", error);
      res.status(500).json({ message: "Failed to fetch usage statistics" });
    }
  });
  
  // Check quota for a request
  app.post("/api/credits/check-quota", async (req, res) => {
    try {
      // TODO: Get userId from authenticated user session
      const userId = req.body.userId || "default-user";
      const { requiredCredits } = req.body;
      
      if (!requiredCredits) {
        res.status(400).json({ message: "requiredCredits is required" });
        return;
      }
      
      const quotaCheck = await quotaService.checkQuota(userId, requiredCredits);
      res.json(quotaCheck);
    } catch (error) {
      console.error("Error checking quota:", error);
      res.status(500).json({ message: "Failed to check quota" });
    }
  });
  
  // Purchase credits (create Stripe checkout session)
  app.post("/api/credits/purchase", async (req, res) => {
    try {
      // TODO: Get userId from authenticated user session
      const userId = req.body.userId || "default-user";
      const { creditPackId } = req.body;
      
      if (!creditPackId) {
        res.status(400).json({ message: "creditPackId is required" });
        return;
      }
      
      // Get credit pack details
      const pack = await storage.getCreditPack(creditPackId);
      if (!pack) {
        res.status(404).json({ message: "Credit pack not found" });
        return;
      }
      
      // Check if Stripe is configured
      if (!stripe) {
        res.status(503).json({ 
          message: "Payment system not configured. Please contact support.",
          error: "Stripe keys are not configured"
        });
        return;
      }
      
      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: pack.displayName,
              description: pack.description || `${pack.credits} AI credits`,
            },
            unit_amount: pack.priceCents,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${req.headers.origin || 'http://localhost:5000'}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin || 'http://localhost:5000'}/credits/cancel`,
        metadata: {
          userId,
          creditPackId,
          credits: pack.credits.toString(),
        },
      });
      
      res.json({ checkoutUrl: session.url, sessionId: session.id });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ 
        message: "Failed to create checkout session",
        error: error.message 
      });
    }
  });
  
  // Stripe webhook handler
  app.post("/api/credits/webhook", async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      res.status(503).json({ message: "Payment system not configured" });
      return;
    }
    
    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          const { userId, creditPackId, credits } = session.metadata;
          
          // Add credits to user account
          await creditService.addCredits(
            userId,
            parseInt(credits),
            `Purchased ${credits} credits`,
            session.payment_intent,
            session.id
          );
          break;
          
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          const subscription = event.data.object;
          // Handle subscription updates
          // TODO: Implement subscription handling
          console.log("Subscription event:", subscription);
          break;
          
        case 'invoice.payment_succeeded':
          const invoice = event.data.object;
          // Handle subscription renewal
          if (invoice.subscription) {
            // TODO: Add monthly credits for subscription
            console.log("Invoice payment succeeded:", invoice);
          }
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      
      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(400).json({ message: `Webhook Error: ${error.message}` });
    }
  });
  
  // Get suggested upgrade
  app.get("/api/credits/suggested-upgrade", async (req, res) => {
    try {
      // TODO: Get userId from authenticated user session
      const userId = req.query.userId as string || "default-user";
      
      const suggestion = await quotaService.getSuggestedUpgrade(userId);
      res.json(suggestion);
    } catch (error) {
      console.error("Error getting suggested upgrade:", error);
      res.status(500).json({ message: "Failed to get suggested upgrade" });
    }
  });
  
  // Admin: Add credits manually (for testing/support)
  app.post("/api/credits/admin/add", async (req, res) => {
    try {
      // TODO: Check admin permissions
      const { userId, amount, reason } = req.body;
      
      if (!userId || !amount) {
        res.status(400).json({ message: "userId and amount are required" });
        return;
      }
      
      await creditService.addCredits(userId, amount, reason || "Admin credit adjustment");
      res.json({ success: true, message: `Added ${amount} credits to user ${userId}` });
    } catch (error) {
      console.error("Error adding credits:", error);
      res.status(500).json({ message: "Failed to add credits" });
    }
  });
  
  // Admin: Reset daily quota
  app.post("/api/credits/admin/reset-quota", async (req, res) => {
    try {
      // TODO: Check admin permissions
      const { userId } = req.body;
      
      if (!userId) {
        res.status(400).json({ message: "userId is required" });
        return;
      }
      
      await quotaService.resetDailyQuota(userId);
      res.json({ success: true, message: `Reset daily quota for user ${userId}` });
    } catch (error) {
      console.error("Error resetting quota:", error);
      res.status(500).json({ message: "Failed to reset quota" });
    }
  });
  
  // Admin: Clear rate limit
  app.post("/api/credits/admin/clear-rate-limit", async (req, res) => {
    try {
      // TODO: Check admin permissions
      const { userId } = req.body;
      
      if (!userId) {
        res.status(400).json({ message: "userId is required" });
        return;
      }
      
      quotaService.clearRateLimit(userId);
      res.json({ success: true, message: `Cleared rate limit for user ${userId}` });
    } catch (error) {
      console.error("Error clearing rate limit:", error);
      res.status(500).json({ message: "Failed to clear rate limit" });
    }
  });
  
  console.log("Credit system routes registered successfully");
}