// Hook Miner - Discovers and ranks engagement hooks from evidence

import { Evidence, Hook, HookType, EventClassification } from './types';
import { EvidenceStore } from './evidence-store';
import { v4 as uuidv4 } from 'uuid';

export class HookMiner {
  private evidenceStore: EvidenceStore;
  private scoringWeights = {
    recency: 0.35,
    relevance: 0.25,
    authority: 0.20,
    specificity: 0.10,
    sentiment: 0.10
  };

  constructor(evidenceStore: EvidenceStore) {
    this.evidenceStore = evidenceStore;
  }

  // Mine hooks from fresh evidence
  async mineHooks(
    prospectId: string,
    maxDaysOld: number = 14,
    limit: number = 5
  ): Promise<Hook[]> {
    // Get fresh evidence
    const evidence = await this.evidenceStore.findFreshEvidence(
      prospectId,
      maxDaysOld
    );

    if (evidence.length === 0) {
      return [];
    }

    // Process each evidence into potential hooks
    const hooks: Hook[] = [];
    
    for (const ev of evidence) {
      const classification = await this.evidenceStore.classifyEvidence(ev);
      const hook = await this.createHook(ev, classification);
      
      if (hook) {
        hooks.push(hook);
      }
    }

    // Score and rank hooks
    const scoredHooks = hooks.map(hook => ({
      ...hook,
      score: this.scoreHook(hook, evidence)
    }));

    // Sort by score and return top N
    return scoredHooks
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(hook => this.assignStatus(hook));
  }

  // Create hook from evidence
  private async createHook(
    evidence: Evidence,
    classification: EventClassification
  ): Promise<Hook | null> {
    // Skip negative sentiment
    if (classification.sentiment === 'negative') {
      return null;
    }

    // Calculate freshness
    const freshnessInDays = Math.floor(
      (Date.now() - evidence.published_at.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Skip if too old
    if (freshnessInDays > 30) {
      return null;
    }

    const hook: Hook = {
      hook_id: uuidv4(),
      prospect_id: evidence.prospect_id,
      hook_type: classification.event_type as HookType,
      headline: this.generateHeadline(evidence, classification),
      quote: this.extractQuote(evidence),
      evidence_refs: [evidence.evidence_id],
      freshness_days: freshnessInDays,
      score: 0, // Will be calculated
      confidence: classification.relevance * classification.specificity,
      status: 'pending',
      created_at: new Date()
    };

    return hook;
  }

  // Generate headline for hook
  private generateHeadline(
    evidence: Evidence,
    classification: EventClassification
  ): string {
    const typeTemplates: Record<string, string> = {
      'review_win': `Ny ${evidence.authority > 0.8 ? 'topprangert' : 'positiv'} anmeldelse`,
      'award': `Vant ${evidence.title.includes('Award') ? evidence.title : 'prestisjetung utmerkelse'}`,
      'product_launch': `Lanserte ${evidence.title.includes('launch') ? 'nytt produkt' : evidence.title}`,
      'pr_feature': `Omtalt i ${evidence.source === 'news' ? 'media' : evidence.source}`,
      'milestone': `Nådde ${evidence.title.includes('milestone') ? 'viktig milepæl' : evidence.title}`,
      'case_post': `Delte suksesshistorie: ${evidence.title}`,
      'funding': `Sikret ${evidence.title.includes('funding') ? 'finansiering' : 'investering'}`,
      'partnership': `Inngått partnerskap`,
      'expansion': `Ekspanderer ${evidence.title.includes('expand') ? 'virksomheten' : 'til nye markeder'}`
    };

    const template = typeTemplates[classification.event_type] || evidence.title;
    
    // Add date reference
    const dateStr = evidence.published_at.toLocaleDateString('nb-NO', { 
      day: 'numeric', 
      month: 'short' 
    });
    
    return `${template} (${dateStr})`;
  }

  // Extract relevant quote
  private extractQuote(evidence: Evidence): string | undefined {
    if (evidence.quotes && evidence.quotes.length > 0) {
      return evidence.quotes[0];
    }

    // Extract from snippet if short enough
    if (evidence.snippet.length <= 150) {
      return evidence.snippet;
    }

    // Find sentence with key terms
    const sentences = evidence.snippet.split(/[.!?]/);
    const keyTerms = ['best', 'excellent', 'amazing', 'growth', 'success', 'award', 'launch'];
    
    for (const sentence of sentences) {
      if (keyTerms.some(term => sentence.toLowerCase().includes(term))) {
        return sentence.trim();
      }
    }

    return undefined;
  }

  // Score hook based on multiple factors
  private scoreHook(hook: Hook, allEvidence: Evidence[]): number {
    // Recency score (0-1)
    const recencyScore = this.calculateRecencyScore(hook.freshness_days);
    
    // Relevance score (from classification)
    const relevanceScore = hook.confidence;
    
    // Authority score (from evidence source)
    const evidence = allEvidence.find(e => e.evidence_id === hook.evidence_refs[0]);
    const authorityScore = evidence?.authority || 0.5;
    
    // Specificity score (mentions specific product/location)
    const specificityScore = this.calculateSpecificityScore(hook.headline, hook.quote);
    
    // Sentiment score
    const sentimentScore = this.calculateSentimentScore(hook.hook_type);
    
    // Calculate weighted score
    const finalScore = 
      this.scoringWeights.recency * recencyScore +
      this.scoringWeights.relevance * relevanceScore +
      this.scoringWeights.authority * authorityScore +
      this.scoringWeights.specificity * specificityScore +
      this.scoringWeights.sentiment * sentimentScore;
    
    return Math.min(1.0, Math.max(0.0, finalScore));
  }

  // Calculate recency score
  private calculateRecencyScore(freshnessInDays: number): number {
    if (freshnessInDays < 2) return 1.0;
    if (freshnessInDays <= 7) return 0.8;
    if (freshnessInDays <= 14) return 0.6;
    if (freshnessInDays <= 30) return 0.4;
    return 0.2;
  }

  // Calculate specificity score
  private calculateSpecificityScore(headline: string, quote?: string): number {
    const content = `${headline} ${quote || ''}`.toLowerCase();
    let score = 0.5; // Base score

    // Check for specific mentions
    const specificTerms = [
      'produkt', 'tjeneste', 'løsning', 
      'oslo', 'bergen', 'trondheim', 'stavanger',
      'millioner', 'prosent', 'kunder', 'ansatte'
    ];

    for (const term of specificTerms) {
      if (content.includes(term)) {
        score += 0.1;
      }
    }

    // Check for numbers/metrics
    if (/\d+/.test(content)) {
      score += 0.1;
    }

    // Check for company/product names (capitalized words)
    const capitalizedWords = content.match(/[A-Z][a-z]+/g);
    if (capitalizedWords && capitalizedWords.length > 2) {
      score += 0.1;
    }

    return Math.min(1.0, score);
  }

  // Calculate sentiment score
  private calculateSentimentScore(hookType: HookType): number {
    const positiveTypes = ['review_win', 'award', 'funding', 'milestone'];
    const neutralTypes = ['product_launch', 'case_post', 'partnership', 'expansion'];
    
    if (positiveTypes.includes(hookType)) return 1.0;
    if (neutralTypes.includes(hookType)) return 0.7;
    return 0.5;
  }

  // Assign status based on score
  private assignStatus(hook: Hook): Hook {
    if (hook.score >= 0.78 && hook.freshness_days <= 14) {
      hook.status = 'approved';
    } else if (hook.score >= 0.60) {
      hook.status = 'review';
    } else {
      hook.status = 'rejected';
    }
    
    return hook;
  }

  // Get top hooks for campaign
  async getTopHooksForCampaign(
    prospectIds: string[],
    maxPerProspect: number = 2
  ): Promise<Map<string, Hook[]>> {
    const hooksByProspect = new Map<string, Hook[]>();
    
    for (const prospectId of prospectIds) {
      const hooks = await this.mineHooks(prospectId, 14, maxPerProspect);
      if (hooks.length > 0) {
        hooksByProspect.set(prospectId, hooks);
      }
    }
    
    return hooksByProspect;
  }

  // Refresh hooks for active campaigns
  async refreshHooks(staleThresholdHours: number = 24): Promise<number> {
    // This would query for prospects with active campaigns
    // and refresh their hooks if older than threshold
    // Implementation depends on campaign management system
    
    return 0; // Return number of refreshed hooks
  }
}