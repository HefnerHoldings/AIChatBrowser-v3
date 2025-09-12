import { db } from "../db";
import { aiUsageEvents, type InsertAiUsageEvent } from "@shared/schema";
import { creditService } from "./credit-service";

// Model cost configuration
interface ModelConfig {
  creditsPerStandardMessage: number;
  maxStandardTokens: {
    input: number;
    output: number;
  };
  costPerInputToken: number; // in USD
  costPerOutputToken: number; // in USD
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // OpenAI Models
  'gpt-4o': {
    creditsPerStandardMessage: 25,
    maxStandardTokens: { input: 2000, output: 1000 },
    costPerInputToken: 0.00001, // $10 per 1M tokens
    costPerOutputToken: 0.00003, // $30 per 1M tokens
  },
  'gpt-4o-mini': {
    creditsPerStandardMessage: 1,
    maxStandardTokens: { input: 2000, output: 1000 },
    costPerInputToken: 0.00000015, // $0.15 per 1M tokens
    costPerOutputToken: 0.0000006, // $0.60 per 1M tokens
  },
  'gpt-4-turbo': {
    creditsPerStandardMessage: 20,
    maxStandardTokens: { input: 2000, output: 1000 },
    costPerInputToken: 0.00001, // $10 per 1M tokens
    costPerOutputToken: 0.00003, // $30 per 1M tokens
  },
  'gpt-3.5-turbo': {
    creditsPerStandardMessage: 1,
    maxStandardTokens: { input: 2000, output: 1000 },
    costPerInputToken: 0.0000005, // $0.50 per 1M tokens
    costPerOutputToken: 0.0000015, // $1.50 per 1M tokens
  },
  
  // Anthropic Models
  'claude-3-opus': {
    creditsPerStandardMessage: 30,
    maxStandardTokens: { input: 2000, output: 1000 },
    costPerInputToken: 0.000015, // $15 per 1M tokens
    costPerOutputToken: 0.000075, // $75 per 1M tokens
  },
  'claude-3-sonnet': {
    creditsPerStandardMessage: 10,
    maxStandardTokens: { input: 2000, output: 1000 },
    costPerInputToken: 0.000003, // $3 per 1M tokens
    costPerOutputToken: 0.000015, // $15 per 1M tokens
  },
  'claude-3-haiku': {
    creditsPerStandardMessage: 1,
    maxStandardTokens: { input: 2000, output: 1000 },
    costPerInputToken: 0.00000025, // $0.25 per 1M tokens
    costPerOutputToken: 0.00000125, // $1.25 per 1M tokens
  },
  
  // Google Models
  'gemini-pro': {
    creditsPerStandardMessage: 5,
    maxStandardTokens: { input: 2000, output: 1000 },
    costPerInputToken: 0.000001, // $1 per 1M tokens
    costPerOutputToken: 0.000002, // $2 per 1M tokens
  },
};

export class UsageTracker {
  private static instance: UsageTracker;
  
  private constructor() {}
  
  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  /**
   * Calculate credits required for a specific model and token count
   */
  calculateCredits(model: string, inputTokens: number, outputTokens: number): number {
    const config = MODEL_CONFIGS[model] || MODEL_CONFIGS['gpt-3.5-turbo'];
    const { creditsPerStandardMessage, maxStandardTokens } = config;
    
    // Check if message is within standard limits
    const isStandard = 
      inputTokens <= maxStandardTokens.input && 
      outputTokens <= maxStandardTokens.output;
    
    if (isStandard) {
      return creditsPerStandardMessage;
    }
    
    // Double credits for messages exceeding standard limits
    return creditsPerStandardMessage * 2;
  }

  /**
   * Calculate USD cost for tokens
   */
  calculateUsdCost(model: string, inputTokens: number, outputTokens: number): number {
    const config = MODEL_CONFIGS[model] || MODEL_CONFIGS['gpt-3.5-turbo'];
    const inputCost = inputTokens * config.costPerInputToken;
    const outputCost = outputTokens * config.costPerOutputToken;
    return inputCost + outputCost;
  }

  /**
   * Check if user has enough credits for a request
   */
  async checkCreditsForRequest(
    userId: string, 
    model: string, 
    estimatedInputTokens: number = 2000
  ): Promise<{ hasCredits: boolean; requiredCredits: number; userBalance: number }> {
    // Estimate output tokens as half of input for checking
    const estimatedOutputTokens = Math.floor(estimatedInputTokens / 2);
    const requiredCredits = this.calculateCredits(model, estimatedInputTokens, estimatedOutputTokens);
    const userBalance = await creditService.checkBalance(userId);
    
    return {
      hasCredits: userBalance >= requiredCredits,
      requiredCredits,
      userBalance,
    };
  }

  /**
   * Log AI usage and deduct credits
   */
  async logUsage(
    userId: string,
    model: string,
    provider: string,
    inputTokens: number,
    outputTokens: number,
    requestType: string = 'chat',
    responseTime?: number,
    success: boolean = true,
    errorMessage?: string,
    metadata?: any
  ): Promise<void> {
    const totalTokens = inputTokens + outputTokens;
    const creditsUsed = this.calculateCredits(model, inputTokens, outputTokens);
    const costUsd = this.calculateUsdCost(model, inputTokens, outputTokens);
    
    // Log the usage event
    await db.insert(aiUsageEvents).values({
      userId,
      model,
      provider,
      inputTokens,
      outputTokens,
      totalTokens,
      creditsUsed,
      costUsd,
      requestType,
      responseTime,
      success,
      errorMessage,
      metadata,
    });
    
    // Only deduct credits if the request was successful
    if (success) {
      await creditService.deductCredits(
        userId,
        creditsUsed,
        `AI usage: ${model} (${totalTokens} tokens)`,
        { model, inputTokens, outputTokens, requestType }
      );
    }
  }

  /**
   * Get usage statistics for a user
   */
  async getUserUsageStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalCreditsUsed: number;
    totalCostUsd: number;
    totalRequests: number;
    byModel: Record<string, {
      requests: number;
      creditsUsed: number;
      costUsd: number;
      totalTokens: number;
    }>;
  }> {
    const query = db.select()
      .from(aiUsageEvents)
      .where(eq(aiUsageEvents.userId, userId));
    
    // Add date filters if provided
    if (startDate) {
      query.where(gte(aiUsageEvents.createdAt, startDate));
    }
    
    const events = await query;
    
    const stats = {
      totalCreditsUsed: 0,
      totalCostUsd: 0,
      totalRequests: events.length,
      byModel: {} as Record<string, any>,
    };
    
    for (const event of events) {
      stats.totalCreditsUsed += event.creditsUsed;
      stats.totalCostUsd += event.costUsd || 0;
      
      if (!stats.byModel[event.model]) {
        stats.byModel[event.model] = {
          requests: 0,
          creditsUsed: 0,
          costUsd: 0,
          totalTokens: 0,
        };
      }
      
      stats.byModel[event.model].requests += 1;
      stats.byModel[event.model].creditsUsed += event.creditsUsed;
      stats.byModel[event.model].costUsd += event.costUsd || 0;
      stats.byModel[event.model].totalTokens += event.totalTokens;
    }
    
    return stats;
  }

  /**
   * Get available models with their credit costs
   */
  getModelPricing(): Array<{
    model: string;
    provider: string;
    creditsPerMessage: number;
    maxStandardInput: number;
    maxStandardOutput: number;
  }> {
    return Object.entries(MODEL_CONFIGS).map(([model, config]) => ({
      model,
      provider: this.getProviderForModel(model),
      creditsPerMessage: config.creditsPerStandardMessage,
      maxStandardInput: config.maxStandardTokens.input,
      maxStandardOutput: config.maxStandardTokens.output,
    }));
  }

  /**
   * Get provider for a model
   */
  private getProviderForModel(model: string): string {
    if (model.startsWith('gpt')) return 'openai';
    if (model.startsWith('claude')) return 'anthropic';
    if (model.startsWith('gemini')) return 'google';
    return 'unknown';
  }

  /**
   * Estimate credits for a message
   */
  estimateCreditsForMessage(
    model: string,
    messageLength: number
  ): { min: number; max: number } {
    const config = MODEL_CONFIGS[model] || MODEL_CONFIGS['gpt-3.5-turbo'];
    
    // Rough estimation: 1 token ≈ 4 characters
    const estimatedInputTokens = Math.ceil(messageLength / 4);
    
    // Minimum assumes standard response
    const min = config.creditsPerStandardMessage;
    
    // Maximum assumes double for large response
    const max = estimatedInputTokens > config.maxStandardTokens.input 
      ? config.creditsPerStandardMessage * 2
      : config.creditsPerStandardMessage;
    
    return { min, max };
  }
}

import { eq, gte } from "drizzle-orm";

export const usageTracker = UsageTracker.getInstance();