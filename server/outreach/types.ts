// Outreach Engine Types and Interfaces

export interface Prospect {
  prospect_id: string;
  company_name: string;
  domain: string;
  industry?: string;
  region?: string;
  language_pref: string;
  contact_roles: ContactRole[];
  created_at: Date;
  updated_at: Date;
  status: 'active' | 'paused' | 'suppressed';
}

export interface ContactRole {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  linkedin_url?: string;
  preferred_channel: Channel;
}

export type Channel = 'email' | 'sms' | 'whatsapp' | 'linkedin';

export interface Evidence {
  evidence_id: string;
  prospect_id: string;
  source: EvidenceSource;
  url: string;
  title: string;
  snippet: string;
  published_at: Date;
  language: string;
  authority: number; // 0-1
  hash: string;
  quotes?: string[];
  raw_data?: any;
  processed_at: Date;
}

export type EvidenceSource = 
  | 'google_review' 
  | 'trustpilot' 
  | 'news' 
  | 'rss' 
  | 'fb_page' 
  | 'ig_post' 
  | 'x_tweet' 
  | 'yt_video'
  | 'website'
  | 'press_release'
  | 'case_study';

export interface Hook {
  hook_id: string;
  prospect_id: string;
  hook_type: HookType;
  headline: string;
  quote?: string;
  evidence_refs: string[];
  freshness_days: number;
  score: number;
  confidence: number;
  status: 'pending' | 'approved' | 'review' | 'rejected';
  created_at: Date;
}

export type HookType = 
  | 'review_win' 
  | 'award' 
  | 'product_launch' 
  | 'pr_feature' 
  | 'milestone' 
  | 'case_post'
  | 'funding'
  | 'partnership'
  | 'expansion';

export interface MessageVariant {
  variant_id: string;
  hook_id: string;
  channel: Channel;
  subject?: string;
  body_text: string;
  language: string;
  voice_profile: VoiceProfile;
  generator_meta: GeneratorMeta;
  confidence: number;
  created_at: Date;
  performance_score?: number;
}

export interface VoiceProfile {
  tone: 'professional' | 'casual' | 'enthusiastic' | 'consultative';
  formality: 'high' | 'medium' | 'low';
  personalization: 'high' | 'medium' | 'low';
}

export interface GeneratorMeta {
  model: string;
  temperature: number;
  prompt_template: string;
  evidence_used: string[];
  generation_time_ms: number;
}

export interface SendSchedule {
  schedule_id: string;
  prospect_id: string;
  campaign_id: string;
  steps: SendStep[];
  caps: SendCaps;
  consent_ok: boolean;
  status: 'pending' | 'active' | 'completed' | 'paused';
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
}

export interface SendStep {
  step_number: number;
  day_offset: number;
  channel: Channel;
  template_id: string;
  variant_id?: string;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  sent_at?: Date;
  response?: SendResponse;
}

export interface SendCaps {
  quiet_hours: { start: string; end: string };
  per_domain_frequency_days: number;
  max_attempts_per_channel: number;
  escalation_delay_days: number;
}

export interface SendResponse {
  delivered: boolean;
  opened?: boolean;
  clicked?: boolean;
  replied?: boolean;
  meeting_booked?: boolean;
  unsubscribed?: boolean;
  error?: string;
}

export interface OutreachMetrics {
  campaign_id: string;
  prospect_id: string;
  message_id: string;
  channel: Channel;
  delivered: number;
  opens: number;
  clicks: number;
  replies: number;
  meetings: number;
  attributed_pipeline: number;
  timestamp: Date;
}

export interface ComplianceCheck {
  check_id: string;
  prospect_id: string;
  hook_id?: string;
  status: 'APPROVE' | 'REVIEW' | 'REJECT';
  reasons: string[];
  checked_at: Date;
  checked_by: 'system' | 'human';
}

export interface EventClassification {
  event_type: HookType;
  sentiment: 'positive' | 'neutral' | 'negative';
  specificity: number; // 0-1
  relevance: number; // 0-1
  summary: string;
}

export interface MessagePlan {
  subject_options: string[];
  outline: string[];
  cta: string;
  value_props: string[];
  personalization_points: string[];
}

export interface VerificationResult {
  verdict: 'PASS' | 'FAIL';
  unsupported_claims: string[];
  suggested_fixes: string[];
  confidence: number;
}

export interface ABTestResult {
  test_id: string;
  variant_a: string;
  variant_b: string;
  metric: 'open_rate' | 'click_rate' | 'reply_rate';
  winner: 'A' | 'B' | 'TIE';
  confidence_level: number;
  sample_size: number;
  improvement_percent: number;
}