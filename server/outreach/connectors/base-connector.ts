// Base Connector for All Data Sources

import { Evidence, EvidenceSource } from '../types';

export abstract class BaseConnector {
  protected source: EvidenceSource;
  protected rateLimit: number = 10; // requests per second
  protected lastFetch: Map<string, Date> = new Map();

  constructor(source: EvidenceSource) {
    this.source = source;
  }

  // Abstract methods that each connector must implement
  abstract fetch(prospectId: string, params: ConnectorParams): Promise<RawData[]>;
  abstract normalize(rawData: RawData): Evidence;
  abstract validateCredentials(): Promise<boolean>;

  // Common methods
  protected async checkRateLimit(): Promise<void> {
    // Implement rate limiting logic
    await new Promise(resolve => setTimeout(resolve, 1000 / this.rateLimit));
  }

  protected generateHash(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  protected shouldFetch(prospectId: string, maxAge: number = 3600000): boolean {
    const lastFetch = this.lastFetch.get(prospectId);
    if (!lastFetch) return true;
    return Date.now() - lastFetch.getTime() > maxAge;
  }

  async fetchWithCache(prospectId: string, params: ConnectorParams): Promise<Evidence[]> {
    if (!this.shouldFetch(prospectId, params.maxAge)) {
      return [];
    }

    await this.checkRateLimit();
    const rawData = await this.fetch(prospectId, params);
    const evidence = rawData.map(data => this.normalize(data));
    
    this.lastFetch.set(prospectId, new Date());
    return evidence;
  }
}

export interface ConnectorParams {
  domain?: string;
  companyName?: string;
  maxAge?: number;
  limit?: number;
  since?: Date;
  language?: string;
  additionalParams?: Record<string, any>;
}

export interface RawData {
  id: string;
  content: any;
  metadata: Record<string, any>;
  timestamp: Date;
}