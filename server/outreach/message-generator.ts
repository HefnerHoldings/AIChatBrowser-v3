// Message Generator with RAG-grounding

import { 
  Hook, 
  Evidence, 
  MessageVariant, 
  MessagePlan,
  VoiceProfile,
  Channel,
  VerificationResult 
} from './types';
import { EvidenceStore } from './evidence-store';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

export class MessageGenerator {
  private evidenceStore: EvidenceStore;
  private openai: OpenAI | null = null;
  private templates: Map<string, MessageTemplate> = new Map();

  constructor(evidenceStore: EvidenceStore) {
    this.evidenceStore = evidenceStore;
    this.initializeOpenAI();
    this.loadTemplates();
  }

  private initializeOpenAI() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY 
      });
    }
  }

  // Generate message from hook
  async generateMessage(
    hook: Hook,
    channel: Channel,
    voiceProfile: VoiceProfile,
    recipientName?: string,
    companyContext?: CompanyContext
  ): Promise<MessageVariant> {
    // Get evidence for RAG grounding
    const evidence = await this.getEvidenceForHook(hook);
    
    // Create message plan
    const plan = await this.createMessagePlan(hook, evidence, companyContext);
    
    // Generate message content
    const content = await this.generateContent(
      hook,
      evidence,
      plan,
      channel,
      voiceProfile,
      recipientName
    );
    
    // Verify claims
    const verification = await this.verifyContent(content, evidence);
    
    // Polish if needed
    const polishedContent = verification.verdict === 'PASS' 
      ? content 
      : await this.applyFixes(content, verification.suggested_fixes);
    
    // Create variant
    const variant: MessageVariant = {
      variant_id: uuidv4(),
      hook_id: hook.hook_id,
      channel,
      subject: channel === 'email' ? this.extractSubject(polishedContent) : undefined,
      body_text: this.extractBody(polishedContent),
      language: 'no',
      voice_profile: voiceProfile,
      generator_meta: {
        model: 'gpt-5',
        temperature: 0.7,
        prompt_template: 'rag_grounded_v1',
        evidence_used: evidence.map(e => e.evidence_id),
        generation_time_ms: Date.now()
      },
      confidence: verification.confidence || 0.8,
      created_at: new Date()
    };
    
    // Generate channel-specific variants
    if (channel === 'email') {
      await this.addChannelVariants(variant, hook, evidence);
    }
    
    return variant;
  }

  // Create message plan
  private async createMessagePlan(
    hook: Hook,
    evidence: Evidence[],
    context?: CompanyContext
  ): Promise<MessagePlan> {
    const valueProps = this.getValuePropsForHook(hook.hook_type, context?.industry);
    
    const plan: MessagePlan = {
      subject_options: [
        `Gratulerer med ${hook.headline}! 🎉`,
        `Så ${hook.headline} - imponerende!`,
        `${hook.headline} → +12% flere leads?`
      ],
      outline: [
        'Anerkjennelse - referér til spesifikk hendelse',
        'Hvorfor nå - koble til deres momentum',
        'Verdi - konkret løsning med tall',
        'CTA - enkel neste steg'
      ],
      cta: this.selectCTA(hook.hook_type),
      value_props: valueProps,
      personalization_points: [
        `Kildenavn: ${evidence[0].source}`,
        `Dato: ${evidence[0].published_at.toLocaleDateString('nb-NO')}`,
        hook.quote ? `Sitat: "${hook.quote}"` : ''
      ].filter(Boolean)
    };
    
    return plan;
  }

  // Generate content with RAG grounding
  private async generateContent(
    hook: Hook,
    evidence: Evidence[],
    plan: MessagePlan,
    channel: Channel,
    voiceProfile: VoiceProfile,
    recipientName?: string
  ): Promise<string> {
    if (!this.openai) {
      return this.generateFallbackContent(hook, evidence, plan, channel, recipientName);
    }

    const systemPrompt = `Du er en norsk B2B salgsekspert som skriver personlige, relevante meldinger.
KRITISK: Du kan KUN bruke informasjon fra Evidence-dataene under. IKKE finn på nye fakta.

Evidence som du MÅ basere meldingen på:
${evidence.map(e => `
- Kilde: ${e.source}
- Tittel: ${e.title}
- Utdrag: ${e.snippet}
- Dato: ${e.published_at.toLocaleDateString('nb-NO')}
- URL: ${e.url}
`).join('\n')}

Regler:
1. Skriv ${channel === 'email' ? '90-130' : '50-80'} ord på naturlig norsk
2. Inkluder ALLTID kildenavn og dato i teksten
3. Vær ${voiceProfile.tone} og ${voiceProfile.formality === 'low' ? 'uformell' : 'profesjonell'}
4. Følg denne strukturen: ${plan.outline.join(' → ')}
5. Avslutt med: ${plan.cta}
6. ALDRI lag opp nye påstander som ikke finnes i Evidence`;

    const userPrompt = `Skriv en ${channel}-melding til ${recipientName || 'mottaker'} om:
Hook: ${hook.headline}
${hook.quote ? `Sitat: "${hook.quote}"` : ''}

Bruk verdiproposisjon: ${plan.value_props[0]}
Emnelinjeforslag: ${plan.subject_options[0]}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('OpenAI generation error:', error);
      return this.generateFallbackContent(hook, evidence, plan, channel, recipientName);
    }
  }

  // Fallback content generation
  private generateFallbackContent(
    hook: Hook,
    evidence: Evidence[],
    plan: MessagePlan,
    channel: Channel,
    recipientName?: string
  ): string {
    const name = recipientName || 'der';
    const source = evidence[0].source.replace('_', ' ');
    const date = evidence[0].published_at.toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short'
    });

    if (channel === 'email') {
      return `EMNE: ${plan.subject_options[0]}

Hei ${name},

Så at dere ${hook.headline} - gratulerer! 

${hook.quote ? `"${hook.quote}"` : evidence[0].snippet.substring(0, 100)}

Med slike ${hook.hook_type === 'review_win' ? 'gode anmeldelser' : 'positive nyheter'}, 
er dette perfekt timing for å forsterke momentumet med ${plan.value_props[0]}.

${plan.cta}?

Beste hilsener,
[Avsender]

PS: Hentet fra ${source}, ${date}`;
    } else {
      return `Hei ${name}! Gratulerer med ${hook.headline}! 
${plan.value_props[0]}. ${plan.cta}? 
(Ref: ${source}, ${date})
Svar STOPP for å melde deg av.`;
    }
  }

  // Verify content against evidence
  private async verifyContent(
    content: string,
    evidence: Evidence[]
  ): Promise<VerificationResult> {
    // Extract claims from content
    const claims = this.extractClaims(content);
    const evidenceText = evidence.map(e => `${e.title} ${e.snippet}`).join(' ');
    
    const unsupportedClaims: string[] = [];
    
    for (const claim of claims) {
      if (!this.isClaimSupported(claim, evidenceText)) {
        unsupportedClaims.push(claim);
      }
    }
    
    return {
      verdict: unsupportedClaims.length === 0 ? 'PASS' : 'FAIL',
      unsupported_claims: unsupportedClaims,
      suggested_fixes: unsupportedClaims.map(claim => 
        `Fjern eller reformuler: "${claim}"`
      ),
      confidence: unsupportedClaims.length === 0 ? 0.95 : 0.5
    };
  }

  // Extract claims from content
  private extractClaims(content: string): string[] {
    // Simple extraction of factual statements
    const sentences = content.split(/[.!?]/);
    const claims: string[] = [];
    
    const factIndicators = [
      'vant', 'fikk', 'lanserte', 'åpnet', 'signerte',
      'økte', 'reduserte', 'forbedret', 'oppnådde'
    ];
    
    for (const sentence of sentences) {
      if (factIndicators.some(indicator => 
        sentence.toLowerCase().includes(indicator)
      )) {
        claims.push(sentence.trim());
      }
    }
    
    return claims;
  }

  // Check if claim is supported by evidence
  private isClaimSupported(claim: string, evidenceText: string): boolean {
    const claimWords = claim.toLowerCase().split(/\s+/);
    const evidenceWords = evidenceText.toLowerCase();
    
    // Check if key words from claim appear in evidence
    let matchCount = 0;
    for (const word of claimWords) {
      if (word.length > 3 && evidenceWords.includes(word)) {
        matchCount++;
      }
    }
    
    // Require at least 40% word overlap
    return matchCount / claimWords.length >= 0.4;
  }

  // Apply suggested fixes
  private async applyFixes(
    content: string,
    fixes: string[]
  ): Promise<string> {
    let fixedContent = content;
    
    for (const fix of fixes) {
      if (fix.includes('Fjern')) {
        const toRemove = fix.match(/"([^"]+)"/)?.[1];
        if (toRemove) {
          fixedContent = fixedContent.replace(toRemove, '');
        }
      }
    }
    
    // Clean up double spaces and empty lines
    fixedContent = fixedContent.replace(/\s+/g, ' ').trim();
    
    return fixedContent;
  }

  // Add channel-specific variants
  private async addChannelVariants(
    variant: MessageVariant,
    hook: Hook,
    evidence: Evidence[]
  ): Promise<void> {
    // SMS variant
    const smsText = await this.generateSMSVariant(hook, evidence);
    
    // WhatsApp variant  
    const whatsappText = await this.generateWhatsAppVariant(hook, evidence);
    
    // Store as metadata
    (variant as any).channel_variants = {
      sms: smsText,
      whatsapp: whatsappText
    };
  }

  // Generate SMS variant
  private async generateSMSVariant(
    hook: Hook,
    evidence: Evidence[]
  ): Promise<string> {
    const source = evidence[0].source.replace('_', ' ');
    const date = evidence[0].published_at.toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short'
    });
    
    return `Hei! Gratulerer med ${hook.headline}! 
Kan vi hjelpe dere kapitalisere på dette? 
15 min prat? Ring/SMS: [telefon]
(${source}, ${date})
Svar STOPP for avmelding`;
  }

  // Generate WhatsApp variant
  private async generateWhatsAppVariant(
    hook: Hook,
    evidence: Evidence[]
  ): Promise<string> {
    return `👋 Hei! 

Så at dere ${hook.headline} - imponerende! 🎉

Sendte nettopp en e-post med konkrete tips for hvordan dere kan utnytte dette momentumet.

Ha en flott dag!
[Avsender]`;
  }

  // Helper methods
  private async getEvidenceForHook(hook: Hook): Promise<Evidence[]> {
    const evidence: Evidence[] = [];
    
    for (const evidenceId of hook.evidence_refs) {
      const ev = await this.evidenceStore.getEvidenceForProspect(
        hook.prospect_id,
        { limit: 1 }
      );
      if (ev.length > 0) {
        evidence.push(ev[0]);
      }
    }
    
    return evidence;
  }

  private getValuePropsForHook(
    hookType: HookType,
    industry?: string
  ): string[] {
    const baseProps = {
      'review_win': [
        'transformere gode anmeldelser til +15% flere leads',
        'automatisk dele positive tilbakemeldinger på alle kanaler',
        'bygge tillit med sosiale bevis i salgsprosessen'
      ],
      'award': [
        'maksimere PR-verdien av utmerkelsen',
        'posisjonere dere som bransjelederen',
        'konvertere anerkjennelse til konkrete salg'
      ],
      'product_launch': [
        'sikre rask adopsjon med målrettet lansering',
        'nå de rette kundene på rett tidspunkt',
        'generere kvalifiserte leads fra dag én'
      ],
      'milestone': [
        'dele suksessen med potensielle kunder',
        'bygge momentum for videre vekst',
        'styrke markedsposisjonen'
      ]
    };
    
    return baseProps[hookType] || baseProps['milestone'];
  }

  private selectCTA(hookType: HookType): string {
    const ctas = {
      'review_win': '15 min om anmeldelsesmarkedsføring',
      'award': 'Få mini-kampanje for prisen',
      'product_launch': 'Se demo av lanseringsverktøy',
      'pr_feature': 'Diskutere PR-strategi (15 min)',
      'milestone': 'Feire med gratis vekstanalyse',
      'case_post': 'Dele flere suksesshistorier',
      'funding': 'Gratulere og diskutere vekstplaner',
      'partnership': 'Utforske synergier (20 min)',
      'expansion': 'Støtte ekspansjonen med leads'
    };
    
    return ctas[hookType] || '15 minutters uforpliktende prat';
  }

  private extractSubject(content: string): string {
    const subjectMatch = content.match(/EMNE:\s*(.+?)[\n\r]/);
    return subjectMatch ? subjectMatch[1] : 'Gratulerer med suksessen!';
  }

  private extractBody(content: string): string {
    // Remove subject line if present
    return content.replace(/EMNE:\s*.+?[\n\r]/, '').trim();
  }

  private loadTemplates() {
    // Load predefined templates
    // This would typically load from database or config
  }
}

interface CompanyContext {
  industry?: string;
  size?: string;
  location?: string;
  recent_activity?: string[];
}

interface MessageTemplate {
  id: string;
  name: string;
  channel: Channel;
  subject_template?: string;
  body_template: string;
  variables: string[];
}