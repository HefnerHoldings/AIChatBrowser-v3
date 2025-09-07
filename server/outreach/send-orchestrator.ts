// Send Orchestrator - Manages multi-channel outreach campaigns

import {
  SendSchedule,
  SendStep,
  SendCaps,
  Channel,
  MessageVariant,
  Prospect,
  SendResponse,
  OutreachMetrics
} from './types';
import { v4 as uuidv4 } from 'uuid';

export class SendOrchestrator {
  private schedules: Map<string, SendSchedule> = new Map();
  private channelProviders: Map<Channel, ChannelProvider> = new Map();
  private suppressionList: Set<string> = new Set();
  private domainCooldowns: Map<string, Date> = new Map();

  constructor() {
    this.initializeProviders();
    this.loadSuppressionList();
  }

  // Create outreach schedule for prospect
  async createSchedule(
    prospect: Prospect,
    campaignId: string,
    variants: MessageVariant[]
  ): Promise<SendSchedule> {
    // Check compliance
    if (!await this.checkCompliance(prospect)) {
      throw new Error(`Prospect ${prospect.prospect_id} failed compliance check`);
    }

    // Create schedule with escalation steps
    const schedule: SendSchedule = {
      schedule_id: uuidv4(),
      prospect_id: prospect.prospect_id,
      campaign_id: campaignId,
      steps: this.createEscalationSteps(variants),
      caps: this.getDefaultCaps(),
      consent_ok: await this.checkConsent(prospect),
      status: 'pending',
      created_at: new Date()
    };

    this.schedules.set(schedule.schedule_id, schedule);
    return schedule;
  }

  // Create escalation steps
  private createEscalationSteps(variants: MessageVariant[]): SendStep[] {
    const steps: SendStep[] = [];
    
    // Standard escalation sequence
    const sequence = [
      { day: 0, channel: 'email' as Channel, followUp: false },
      { day: 4, channel: 'email' as Channel, followUp: true },
      { day: 7, channel: 'sms' as Channel, followUp: true },
      { day: 11, channel: 'email' as Channel, followUp: true },
      { day: 14, channel: 'linkedin' as Channel, followUp: true },
      { day: 20, channel: 'email' as Channel, followUp: true }
    ];

    sequence.forEach((seq, index) => {
      const variant = variants.find(v => v.channel === seq.channel);
      if (variant) {
        steps.push({
          step_number: index + 1,
          day_offset: seq.day,
          channel: seq.channel,
          template_id: seq.followUp ? `followup_${seq.channel}_${index}` : 'initial',
          variant_id: variant.variant_id,
          status: 'pending'
        });
      }
    });

    return steps;
  }

  // Execute scheduled sends
  async executeSends(dryRun: boolean = false): Promise<number> {
    let sentCount = 0;
    const now = new Date();

    for (const schedule of this.schedules.values()) {
      if (schedule.status !== 'active') continue;

      for (const step of schedule.steps) {
        if (step.status !== 'pending') continue;

        // Check if it's time to send
        const sendTime = new Date(schedule.started_at!);
        sendTime.setDate(sendTime.getDate() + step.day_offset);

        if (sendTime <= now) {
          // Check caps and cooldowns
          if (!this.checkSendCaps(schedule, step)) {
            step.status = 'skipped';
            continue;
          }

          if (dryRun) {
            console.log(`[DRY RUN] Would send ${step.channel} to ${schedule.prospect_id}`);
            sentCount++;
          } else {
            const sent = await this.sendMessage(schedule, step);
            if (sent) {
              sentCount++;
              step.status = 'sent';
              step.sent_at = new Date();
            } else {
              step.status = 'failed';
            }
          }
        }
      }

      // Update schedule status
      this.updateScheduleStatus(schedule);
    }

    return sentCount;
  }

  // Send individual message
  private async sendMessage(
    schedule: SendSchedule,
    step: SendStep
  ): Promise<boolean> {
    const provider = this.channelProviders.get(step.channel);
    if (!provider) {
      console.error(`No provider for channel ${step.channel}`);
      return false;
    }

    try {
      // Get prospect details
      const prospect = await this.getProspect(schedule.prospect_id);
      
      // Get message variant
      const variant = await this.getMessageVariant(step.variant_id!);
      
      // Send via provider
      const response = await provider.send({
        to: this.getRecipientForChannel(prospect, step.channel),
        subject: variant.subject,
        body: variant.body_text,
        metadata: {
          campaign_id: schedule.campaign_id,
          schedule_id: schedule.schedule_id,
          step_number: step.step_number
        }
      });

      // Record response
      step.response = {
        delivered: response.success,
        error: response.error
      };

      // Update domain cooldown
      if (response.success) {
        this.updateDomainCooldown(prospect.domain);
      }

      // Track metrics
      await this.trackMetrics({
        campaign_id: schedule.campaign_id,
        prospect_id: schedule.prospect_id,
        message_id: response.messageId || '',
        channel: step.channel,
        delivered: response.success ? 1 : 0,
        opens: 0,
        clicks: 0,
        replies: 0,
        meetings: 0,
        attributed_pipeline: 0,
        timestamp: new Date()
      });

      return response.success;
    } catch (error) {
      console.error(`Send error for ${schedule.prospect_id}:`, error);
      return false;
    }
  }

  // Check send caps
  private checkSendCaps(schedule: SendSchedule, step: SendStep): boolean {
    const now = new Date();
    const hour = now.getHours();
    
    // Check quiet hours
    const quietStart = parseInt(schedule.caps.quiet_hours.start.split(':')[0]);
    const quietEnd = parseInt(schedule.caps.quiet_hours.end.split(':')[0]);
    
    if (hour >= quietStart || hour < quietEnd) {
      return false; // Within quiet hours
    }

    // Check per-channel limits
    const sentToChannel = schedule.steps.filter(
      s => s.channel === step.channel && s.status === 'sent'
    ).length;
    
    if (sentToChannel >= schedule.caps.max_attempts_per_channel) {
      return false; // Channel limit reached
    }

    // Check domain cooldown
    const prospect = { domain: 'example.com' }; // Would fetch actual prospect
    const cooldown = this.domainCooldowns.get(prospect.domain);
    
    if (cooldown) {
      const daysSinceLast = (now.getTime() - cooldown.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLast < schedule.caps.per_domain_frequency_days) {
        return false; // Still in cooldown
      }
    }

    return true;
  }

  // Check compliance
  private async checkCompliance(prospect: Prospect): Promise<boolean> {
    // Check suppression list
    if (this.suppressionList.has(prospect.domain)) {
      return false;
    }

    if (this.suppressionList.has(prospect.contact_roles[0]?.email || '')) {
      return false;
    }

    // Check for valid contact info
    if (!prospect.contact_roles || prospect.contact_roles.length === 0) {
      return false;
    }

    // Check language preference
    if (prospect.language_pref && !['no', 'en'].includes(prospect.language_pref)) {
      return false; // Only support Norwegian and English for now
    }

    return true;
  }

  // Check consent
  private async checkConsent(prospect: Prospect): Promise<boolean> {
    // For B2B email, legitimate interest is typically acceptable
    // For SMS/WhatsApp, need explicit consent
    
    // This would check consent database
    // For now, assume email is OK, others need consent
    
    return true; // Simplified for demo
  }

  // Handle responses (webhooks)
  async handleResponse(
    messageId: string,
    event: 'delivered' | 'opened' | 'clicked' | 'replied' | 'unsubscribed',
    metadata?: any
  ): Promise<void> {
    // Find the schedule and step
    for (const schedule of this.schedules.values()) {
      for (const step of schedule.steps) {
        if (step.response && (step.response as any).messageId === messageId) {
          // Update response
          switch (event) {
            case 'opened':
              step.response.opened = true;
              break;
            case 'clicked':
              step.response.clicked = true;
              break;
            case 'replied':
              step.response.replied = true;
              // Stop further escalation
              schedule.status = 'completed';
              break;
            case 'unsubscribed':
              step.response.unsubscribed = true;
              this.suppressionList.add(schedule.prospect_id);
              schedule.status = 'paused';
              break;
          }

          // Update metrics
          await this.updateMetrics(schedule.campaign_id, event);
          return;
        }
      }
    }
  }

  // Start campaign
  async startCampaign(campaignId: string): Promise<number> {
    let started = 0;
    
    for (const schedule of this.schedules.values()) {
      if (schedule.campaign_id === campaignId && schedule.status === 'pending') {
        schedule.status = 'active';
        schedule.started_at = new Date();
        started++;
      }
    }
    
    return started;
  }

  // Pause campaign
  async pauseCampaign(campaignId: string): Promise<number> {
    let paused = 0;
    
    for (const schedule of this.schedules.values()) {
      if (schedule.campaign_id === campaignId && schedule.status === 'active') {
        schedule.status = 'paused';
        paused++;
      }
    }
    
    return paused;
  }

  // Get campaign stats
  async getCampaignStats(campaignId: string): Promise<CampaignStats> {
    const schedules = Array.from(this.schedules.values())
      .filter(s => s.campaign_id === campaignId);
    
    const stats: CampaignStats = {
      total_prospects: schedules.length,
      active: schedules.filter(s => s.status === 'active').length,
      completed: schedules.filter(s => s.status === 'completed').length,
      paused: schedules.filter(s => s.status === 'paused').length,
      messages_sent: 0,
      opens: 0,
      clicks: 0,
      replies: 0,
      meetings: 0
    };

    for (const schedule of schedules) {
      for (const step of schedule.steps) {
        if (step.status === 'sent') {
          stats.messages_sent++;
          if (step.response?.opened) stats.opens++;
          if (step.response?.clicked) stats.clicks++;
          if (step.response?.replied) stats.replies++;
          if (step.response?.meeting_booked) stats.meetings++;
        }
      }
    }

    stats.open_rate = stats.messages_sent > 0 
      ? (stats.opens / stats.messages_sent) * 100 
      : 0;
    
    stats.reply_rate = stats.messages_sent > 0
      ? (stats.replies / stats.messages_sent) * 100
      : 0;

    return stats;
  }

  // Helper methods
  private initializeProviders() {
    // Initialize channel providers
    this.channelProviders.set('email', new EmailProvider());
    this.channelProviders.set('sms', new SMSProvider());
    this.channelProviders.set('whatsapp', new WhatsAppProvider());
    this.channelProviders.set('linkedin', new LinkedInProvider());
  }

  private loadSuppressionList() {
    // Load from database
    // For demo, hardcode some entries
    this.suppressionList.add('example.com');
    this.suppressionList.add('test@example.com');
  }

  private getDefaultCaps(): SendCaps {
    return {
      quiet_hours: { start: '21:00', end: '08:00' },
      per_domain_frequency_days: 14,
      max_attempts_per_channel: 3,
      escalation_delay_days: 3
    };
  }

  private updateScheduleStatus(schedule: SendSchedule) {
    const allSent = schedule.steps.every(s => 
      s.status === 'sent' || s.status === 'skipped'
    );
    
    const hasReply = schedule.steps.some(s => 
      s.response?.replied
    );
    
    if (hasReply || allSent) {
      schedule.status = 'completed';
      schedule.completed_at = new Date();
    }
  }

  private updateDomainCooldown(domain: string) {
    this.domainCooldowns.set(domain, new Date());
  }

  private getRecipientForChannel(prospect: Prospect, channel: Channel): string {
    const contact = prospect.contact_roles[0];
    
    switch (channel) {
      case 'email':
        return contact?.email || '';
      case 'sms':
      case 'whatsapp':
        return contact?.phone || '';
      case 'linkedin':
        return contact?.linkedin_url || '';
      default:
        return '';
    }
  }

  private async getProspect(prospectId: string): Promise<Prospect> {
    // Would fetch from database
    // Placeholder implementation
    return {
      prospect_id: prospectId,
      company_name: 'Example Company',
      domain: 'example.com',
      language_pref: 'no',
      contact_roles: [],
      created_at: new Date(),
      updated_at: new Date(),
      status: 'active'
    };
  }

  private async getMessageVariant(variantId: string): Promise<MessageVariant> {
    // Would fetch from database
    // Placeholder implementation
    return {} as MessageVariant;
  }

  private async trackMetrics(metrics: OutreachMetrics) {
    // Store metrics in database
    console.log('Tracking metrics:', metrics);
  }

  private async updateMetrics(campaignId: string, event: string) {
    // Update campaign metrics
    console.log(`Updating metrics for campaign ${campaignId}: ${event}`);
  }
}

// Channel provider interfaces
interface ChannelProvider {
  send(params: SendParams): Promise<SendResult>;
}

interface SendParams {
  to: string;
  subject?: string;
  body: string;
  metadata?: any;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Placeholder providers
class EmailProvider implements ChannelProvider {
  async send(params: SendParams): Promise<SendResult> {
    // Would integrate with SendGrid, etc.
    console.log(`Sending email to ${params.to}`);
    return { success: true, messageId: uuidv4() };
  }
}

class SMSProvider implements ChannelProvider {
  async send(params: SendParams): Promise<SendResult> {
    // Would integrate with Twilio, etc.
    console.log(`Sending SMS to ${params.to}`);
    return { success: true, messageId: uuidv4() };
  }
}

class WhatsAppProvider implements ChannelProvider {
  async send(params: SendParams): Promise<SendResult> {
    // Would integrate with WhatsApp Business API
    console.log(`Sending WhatsApp to ${params.to}`);
    return { success: true, messageId: uuidv4() };
  }
}

class LinkedInProvider implements ChannelProvider {
  async send(params: SendParams): Promise<SendResult> {
    // Would integrate with LinkedIn API
    console.log(`Sending LinkedIn message to ${params.to}`);
    return { success: true, messageId: uuidv4() };
  }
}

interface CampaignStats {
  total_prospects: number;
  active: number;
  completed: number;
  paused: number;
  messages_sent: number;
  opens: number;
  clicks: number;
  replies: number;
  meetings: number;
  open_rate?: number;
  reply_rate?: number;
}