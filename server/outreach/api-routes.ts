// Outreach Engine API Routes

import { Express } from 'express';
import { EvidenceStore } from './evidence-store';
import { HookMiner } from './hook-miner';
import { MessageGenerator } from './message-generator';
import { SendOrchestrator } from './send-orchestrator';
import { Prospect, Evidence, Hook, Campaign, MessageVariant } from './types';

const evidenceStore = new EvidenceStore();
const hookMiner = new HookMiner(evidenceStore);
const messageGenerator = new MessageGenerator(evidenceStore);
const sendOrchestrator = new SendOrchestrator();

export function registerOutreachRoutes(app: Express) {
  
  // ========== CAMPAIGNS ==========
  
  // Get all campaigns
  app.get('/api/outreach/campaigns', async (req, res) => {
    try {
      // Mock data for now - would fetch from database
      const campaigns = [
        {
          id: '1',
          name: 'Q1 2025 - Review Winners',
          status: 'active',
          prospects: 245,
          sent: 180,
          opens: 126,
          replies: 18,
          meetings: 5,
          created_at: new Date('2025-01-10'),
          started_at: new Date('2025-01-12')
        }
      ];
      res.json(campaigns);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create campaign
  app.post('/api/outreach/campaigns', async (req, res) => {
    try {
      const { name, hook_types, max_age_days, prospect_ids } = req.body;
      
      // Create campaign in database
      const campaign = {
        id: Date.now().toString(),
        name,
        status: 'draft',
        prospects: prospect_ids?.length || 0,
        created_at: new Date()
      };
      
      res.json(campaign);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start campaign
  app.post('/api/outreach/campaigns/:id/start', async (req, res) => {
    try {
      const { id } = req.params;
      const started = await sendOrchestrator.startCampaign(id);
      res.json({ started, status: 'active' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Pause campaign
  app.post('/api/outreach/campaigns/:id/pause', async (req, res) => {
    try {
      const { id } = req.params;
      const paused = await sendOrchestrator.pauseCampaign(id);
      res.json({ paused, status: 'paused' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get campaign stats
  app.get('/api/outreach/campaigns/:id/stats', async (req, res) => {
    try {
      const { id } = req.params;
      const stats = await sendOrchestrator.getCampaignStats(id);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== PROSPECTS ==========

  // Get prospects
  app.get('/api/outreach/prospects', async (req, res) => {
    try {
      const { industry, status, has_hooks } = req.query;
      
      // Mock data - would fetch from database
      const prospects = [
        {
          id: '1',
          company: 'TechCorp AS',
          domain: 'techcorp.no',
          contact_name: 'Lars Hansen',
          email: 'lars@techcorp.no',
          industry: 'Technology',
          status: 'pending',
          score: 0.85
        }
      ];
      
      res.json(prospects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== LEADS ==========

  // Get leads
  app.get('/api/outreach/leads', async (req, res) => {
    try {
      // Mock data - would fetch from database
      const leads = [];
      res.json(leads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add prospect
  app.post('/api/outreach/prospects', async (req, res) => {
    try {
      const prospect: Prospect = req.body;
      
      // Store in database
      // For now, return the prospect with an ID
      const savedProspect = {
        ...prospect,
        prospect_id: Date.now().toString(),
        created_at: new Date(),
        updated_at: new Date(),
        status: 'active' as const
      };
      
      res.json(savedProspect);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Import prospects (bulk)
  app.post('/api/outreach/prospects/import', async (req, res) => {
    try {
      const { prospects } = req.body;
      let imported = 0;
      
      for (const prospect of prospects) {
        // Process and store each prospect
        imported++;
      }
      
      res.json({ imported, total: prospects.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== HOOKS/SIGNALS ==========

  // Mine hooks for prospect
  app.post('/api/outreach/hooks/mine', async (req, res) => {
    try {
      const { prospect_id, max_days_old, limit } = req.body;
      
      const hooks = await hookMiner.mineHooks(
        prospect_id,
        max_days_old || 14,
        limit || 5
      );
      
      res.json(hooks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get recent hooks
  app.get('/api/outreach/hooks/recent', async (req, res) => {
    try {
      // Mock data - would fetch fresh signals
      const recentHooks = [
        {
          id: 'h1',
          prospect_id: '1',
          company: 'TechCorp AS',
          type: 'review_win',
          headline: 'Ny 5-stjernes anmeldelse på Trustpilot',
          source: 'Trustpilot',
          date: new Date(),
          score: 0.92,
          status: 'approved'
        }
      ];
      
      res.json(recentHooks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Approve/reject hook
  app.patch('/api/outreach/hooks/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Update hook status in database
      res.json({ id, status });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== EVIDENCE ==========

  // Store evidence
  app.post('/api/outreach/evidence', async (req, res) => {
    try {
      const evidence: Evidence = req.body;
      const evidenceId = await evidenceStore.storeEvidence(evidence);
      res.json({ evidence_id: evidenceId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get evidence for prospect
  app.get('/api/outreach/evidence/:prospectId', async (req, res) => {
    try {
      const { prospectId } = req.params;
      const { sources, since, limit } = req.query;
      
      const evidence = await evidenceStore.getEvidenceForProspect(prospectId, {
        sources: sources ? (sources as string).split(',') as any : undefined,
        since: since ? new Date(since as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });
      
      res.json(evidence);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== MESSAGES ==========

  // Generate message
  app.post('/api/outreach/messages/generate', async (req, res) => {
    try {
      const { hook_id, channel, voice_profile, recipient_name } = req.body;
      
      // Get hook details
      // For now, use mock data
      const hook: Hook = {
        hook_id,
        prospect_id: '1',
        hook_type: 'review_win',
        headline: 'Test hook',
        evidence_refs: [],
        freshness_days: 1,
        score: 0.9,
        confidence: 0.9,
        status: 'approved',
        created_at: new Date()
      };
      
      const message = await messageGenerator.generateMessage(
        hook,
        channel,
        voice_profile,
        recipient_name
      );
      
      res.json(message);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get message variants
  app.get('/api/outreach/messages/variants/:hookId', async (req, res) => {
    try {
      const { hookId } = req.params;
      
      // Mock data - would fetch from database
      const variants = [
        {
          variant_id: '1',
          hook_id: hookId,
          channel: 'email',
          subject: 'Gratulerer med suksessen!',
          body_text: 'Hei...',
          language: 'no',
          confidence: 0.85
        }
      ];
      
      res.json(variants);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== SEND ==========

  // Create send schedule
  app.post('/api/outreach/send/schedule', async (req, res) => {
    try {
      const { prospect_id, campaign_id, variants } = req.body;
      
      // Get prospect
      const prospect: Prospect = {
        prospect_id,
        company_name: 'Test Company',
        domain: 'test.com',
        language_pref: 'no',
        contact_roles: [],
        created_at: new Date(),
        updated_at: new Date(),
        status: 'active'
      };
      
      const schedule = await sendOrchestrator.createSchedule(
        prospect,
        campaign_id,
        variants
      );
      
      res.json(schedule);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Execute sends
  app.post('/api/outreach/send/execute', async (req, res) => {
    try {
      const { dry_run } = req.body;
      const sent = await sendOrchestrator.executeSends(dry_run || false);
      res.json({ sent });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Handle webhook (email events)
  app.post('/api/outreach/webhook/:provider', async (req, res) => {
    try {
      const { provider } = req.params;
      const event = req.body;
      
      // Process webhook based on provider
      if (event.message_id && event.event) {
        await sendOrchestrator.handleResponse(
          event.message_id,
          event.event,
          event
        );
      }
      
      res.json({ received: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== ANALYTICS ==========

  // Get overall stats
  app.get('/api/outreach/analytics/overview', async (req, res) => {
    try {
      const stats = {
        total_sent: 2450,
        open_rate: 68,
        reply_rate: 12.5,
        meeting_rate: 1.8,
        best_hook_type: 'review_win',
        best_channel: 'email',
        avg_response_time_hours: 18
      };
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get hook performance
  app.get('/api/outreach/analytics/hooks', async (req, res) => {
    try {
      const performance = [
        { type: 'review_win', reply_rate: 18, sample_size: 450 },
        { type: 'award', reply_rate: 15, sample_size: 280 },
        { type: 'product_launch', reply_rate: 12, sample_size: 320 }
      ];
      
      res.json(performance);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== COMPLIANCE ==========

  // Add to suppression list
  app.post('/api/outreach/suppression', async (req, res) => {
    try {
      const { email, domain, reason } = req.body;
      
      // Add to suppression list in database
      res.json({ suppressed: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check compliance
  app.post('/api/outreach/compliance/check', async (req, res) => {
    try {
      const { prospect_id, message_content } = req.body;
      
      // Run compliance checks
      const result = {
        status: 'APPROVE',
        reasons: [],
        score: 0.95
      };
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}