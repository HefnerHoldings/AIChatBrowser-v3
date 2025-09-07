// Evidence Store - Central storage for all evidence data

import { Evidence, EvidenceSource, EventClassification } from './types';
import { Pool } from '@neondatabase/serverless';

export class EvidenceStore {
  private pool: Pool;
  private cache: Map<string, Evidence[]> = new Map();

  constructor(databaseUrl?: string) {
    this.pool = new Pool({ 
      connectionString: databaseUrl || process.env.DATABASE_URL 
    });
  }

  // Store new evidence
  async storeEvidence(evidence: Evidence): Promise<string> {
    const dedupKey = this.generateDedupKey(evidence);
    
    // Check for duplicates
    const existing = await this.findByDedupKey(dedupKey);
    if (existing) {
      return existing.evidence_id;
    }

    // Store in database
    const query = `
      INSERT INTO evidence (
        evidence_id, prospect_id, source, url, title, snippet,
        published_at, language, authority, hash, quotes, raw_data, processed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (hash) DO UPDATE SET processed_at = $13
      RETURNING evidence_id
    `;

    const values = [
      evidence.evidence_id,
      evidence.prospect_id,
      evidence.source,
      evidence.url,
      evidence.title,
      evidence.snippet,
      evidence.published_at,
      evidence.language,
      evidence.authority,
      evidence.hash,
      JSON.stringify(evidence.quotes || []),
      JSON.stringify(evidence.raw_data || {}),
      new Date()
    ];

    try {
      const result = await this.pool.query(query, values);
      this.invalidateCache(evidence.prospect_id);
      return result.rows[0].evidence_id;
    } catch (error) {
      console.error('Error storing evidence:', error);
      throw error;
    }
  }

  // Retrieve evidence for a prospect
  async getEvidenceForProspect(
    prospectId: string,
    options: {
      sources?: EvidenceSource[];
      since?: Date;
      limit?: number;
      minAuthority?: number;
    } = {}
  ): Promise<Evidence[]> {
    // Check cache first
    const cacheKey = `${prospectId}-${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let query = `
      SELECT * FROM evidence 
      WHERE prospect_id = $1
    `;
    const values: any[] = [prospectId];
    let paramIndex = 2;

    if (options.sources && options.sources.length > 0) {
      query += ` AND source = ANY($${paramIndex})`;
      values.push(options.sources);
      paramIndex++;
    }

    if (options.since) {
      query += ` AND published_at >= $${paramIndex}`;
      values.push(options.since);
      paramIndex++;
    }

    if (options.minAuthority !== undefined) {
      query += ` AND authority >= $${paramIndex}`;
      values.push(options.minAuthority);
      paramIndex++;
    }

    query += ` ORDER BY published_at DESC`;

    if (options.limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(options.limit);
    }

    try {
      const result = await this.pool.query(query, values);
      const evidence = result.rows.map(row => this.mapRowToEvidence(row));
      
      // Cache the results
      this.cache.set(cacheKey, evidence);
      setTimeout(() => this.cache.delete(cacheKey), 300000); // 5 min cache
      
      return evidence;
    } catch (error) {
      console.error('Error retrieving evidence:', error);
      return [];
    }
  }

  // Find fresh evidence (hooks)
  async findFreshEvidence(
    prospectId: string,
    maxDaysOld: number = 14
  ): Promise<Evidence[]> {
    const since = new Date();
    since.setDate(since.getDate() - maxDaysOld);

    return this.getEvidenceForProspect(prospectId, {
      since,
      minAuthority: 0.5,
      limit: 10
    });
  }

  // Classify evidence
  async classifyEvidence(evidence: Evidence): Promise<EventClassification> {
    // This would typically call an LLM for classification
    // For now, return a simple classification based on source
    const classification: EventClassification = {
      event_type: this.inferEventType(evidence),
      sentiment: 'positive', // Would be determined by LLM
      specificity: 0.7,
      relevance: 0.8,
      summary: evidence.snippet.substring(0, 200)
    };

    // Store classification
    await this.storeClassification(evidence.evidence_id, classification);
    
    return classification;
  }

  private inferEventType(evidence: Evidence): any {
    const sourceTypeMap = {
      'google_review': 'review_win',
      'trustpilot': 'review_win',
      'news': 'pr_feature',
      'press_release': 'pr_feature',
      'case_study': 'case_post',
      'fb_page': 'milestone',
      'ig_post': 'milestone',
      'x_tweet': 'milestone',
      'yt_video': 'product_launch'
    };

    return sourceTypeMap[evidence.source] || 'milestone';
  }

  private async storeClassification(
    evidenceId: string,
    classification: EventClassification
  ): Promise<void> {
    const query = `
      UPDATE evidence 
      SET classification = $1
      WHERE evidence_id = $2
    `;
    
    await this.pool.query(query, [JSON.stringify(classification), evidenceId]);
  }

  private generateDedupKey(evidence: Evidence): string {
    // Create dedup key from URL + title + snippet
    const content = `${evidence.url}-${evidence.title}-${evidence.snippet}`;
    return this.hashContent(content);
  }

  private hashContent(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async findByDedupKey(dedupKey: string): Promise<Evidence | null> {
    const query = 'SELECT * FROM evidence WHERE hash = $1';
    const result = await this.pool.query(query, [dedupKey]);
    
    if (result.rows.length > 0) {
      return this.mapRowToEvidence(result.rows[0]);
    }
    
    return null;
  }

  private mapRowToEvidence(row: any): Evidence {
    return {
      evidence_id: row.evidence_id,
      prospect_id: row.prospect_id,
      source: row.source,
      url: row.url,
      title: row.title,
      snippet: row.snippet,
      published_at: row.published_at,
      language: row.language,
      authority: row.authority,
      hash: row.hash,
      quotes: row.quotes ? JSON.parse(row.quotes) : [],
      raw_data: row.raw_data ? JSON.parse(row.raw_data) : undefined,
      processed_at: row.processed_at
    };
  }

  private invalidateCache(prospectId: string): void {
    // Remove all cache entries for this prospect
    for (const key of this.cache.keys()) {
      if (key.startsWith(prospectId)) {
        this.cache.delete(key);
      }
    }
  }

  // Batch operations
  async storeBatch(evidenceList: Evidence[]): Promise<void> {
    for (const evidence of evidenceList) {
      await this.storeEvidence(evidence);
    }
  }

  // Clean up old evidence
  async cleanupOldEvidence(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const query = `
      DELETE FROM evidence 
      WHERE published_at < $1
      RETURNING evidence_id
    `;

    const result = await this.pool.query(query, [cutoffDate]);
    return result.rowCount || 0;
  }
}