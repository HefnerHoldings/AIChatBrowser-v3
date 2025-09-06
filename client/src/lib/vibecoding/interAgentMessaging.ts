// Inter-Agent Messaging Protocol with Negotiation and Consensus

import { AgentRole } from './multiAgentOrchestrator';

export interface MessageProtocol {
  version: string;
  schema: string;
  timestamp: Date;
  sequence: number;
  checksum: string;
}

export interface NegotiationContext {
  id: string;
  topic: string;
  initiator: AgentRole;
  participants: AgentRole[];
  state: 'proposed' | 'negotiating' | 'consensus' | 'deadlock' | 'resolved';
  proposals: Proposal[];
  counterProposals: CounterProposal[];
  finalAgreement?: Agreement;
  deadline: Date;
  rounds: number;
  maxRounds: number;
}

export interface Proposal {
  id: string;
  author: AgentRole;
  content: {
    action: string;
    resources: Resource[];
    timeline: Timeline;
    constraints: Constraint[];
    expectedOutcome: Outcome;
  };
  priority: number; // 0-100
  confidence: number; // 0-100
  timestamp: Date;
}

export interface CounterProposal extends Proposal {
  inResponseTo: string; // Proposal ID
  modifications: Modification[];
  justification: string;
}

export interface Modification {
  field: string;
  originalValue: any;
  proposedValue: any;
  reason: string;
}

export interface Agreement {
  id: string;
  negotiationId: string;
  terms: any;
  signatories: Map<AgentRole, Signature>;
  effectiveDate: Date;
  expirationDate?: Date;
  status: 'active' | 'completed' | 'violated' | 'cancelled';
}

export interface Signature {
  agent: AgentRole;
  timestamp: Date;
  commitment: 'full' | 'partial' | 'conditional';
  conditions?: string[];
}

export interface Resource {
  type: 'time' | 'compute' | 'memory' | 'api' | 'human';
  quantity: number;
  unit: string;
  availability: 'immediate' | 'scheduled' | 'conditional';
}

export interface Timeline {
  start: Date;
  end: Date;
  milestones: Milestone[];
  criticalPath: string[];
  bufferTime: number; // hours
}

export interface Milestone {
  id: string;
  name: string;
  date: Date;
  deliverable: string;
  responsible: AgentRole;
}

export interface Constraint {
  type: 'technical' | 'resource' | 'time' | 'quality' | 'security';
  description: string;
  severity: 'optional' | 'recommended' | 'required' | 'critical';
  validator: (context: any) => boolean;
}

export interface Outcome {
  success: Metric[];
  failure: Risk[];
  metrics: Map<string, number>;
}

export interface Metric {
  name: string;
  target: number;
  unit: string;
  measurement: 'increase' | 'decrease' | 'maintain';
}

export interface Risk {
  description: string;
  probability: number; // 0-1
  impact: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
}

export class InterAgentMessaging {
  private negotiations: Map<string, NegotiationContext> = new Map();
  private agreements: Map<string, Agreement> = new Map();
  private messageQueue: MessageQueue;
  private consensusEngine: ConsensusEngine;
  private conflictResolver: ConflictResolver;

  constructor() {
    this.messageQueue = new MessageQueue();
    this.consensusEngine = new ConsensusEngine();
    this.conflictResolver = new ConflictResolver();
  }

  initiateNegotiation(
    topic: string,
    initiator: AgentRole,
    participants: AgentRole[],
    initialProposal: Proposal
  ): NegotiationContext {
    const negotiation: NegotiationContext = {
      id: crypto.randomUUID(),
      topic,
      initiator,
      participants: [initiator, ...participants],
      state: 'proposed',
      proposals: [initialProposal],
      counterProposals: [],
      deadline: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      rounds: 1,
      maxRounds: 10
    };

    this.negotiations.set(negotiation.id, negotiation);
    this.broadcastNegotiationRequest(negotiation);
    
    return negotiation;
  }

  submitCounterProposal(
    negotiationId: string,
    author: AgentRole,
    counterProposal: CounterProposal
  ): boolean {
    const negotiation = this.negotiations.get(negotiationId);
    if (!negotiation || negotiation.state === 'resolved') {
      return false;
    }

    negotiation.counterProposals.push(counterProposal);
    negotiation.rounds++;
    negotiation.state = 'negotiating';

    // Check if we've reached max rounds
    if (negotiation.rounds >= negotiation.maxRounds) {
      this.escalateDeadlock(negotiation);
    } else {
      this.evaluateProposals(negotiation);
    }

    return true;
  }

  private evaluateProposals(negotiation: NegotiationContext) {
    const proposals = [...negotiation.proposals, ...negotiation.counterProposals];
    const scores = this.scoreProposals(proposals, negotiation.participants);
    
    const bestProposal = this.selectBestProposal(scores);
    
    if (bestProposal && this.hasConsensus(bestProposal, negotiation.participants)) {
      negotiation.state = 'consensus';
      this.createAgreement(negotiation, bestProposal);
    } else {
      // Continue negotiation
      this.requestNewProposals(negotiation, bestProposal);
    }
  }

  private scoreProposals(
    proposals: Proposal[],
    participants: AgentRole[]
  ): Map<string, ProposalScore> {
    const scores = new Map<string, ProposalScore>();

    proposals.forEach(proposal => {
      const score: ProposalScore = {
        proposalId: proposal.id,
        totalScore: 0,
        agentScores: new Map(),
        feasibility: this.assessFeasibility(proposal),
        alignment: this.assessAlignment(proposal),
        risk: this.assessRisk(proposal)
      };

      // Each agent scores the proposal
      participants.forEach(agent => {
        const agentScore = this.calculateAgentScore(agent, proposal);
        score.agentScores.set(agent, agentScore);
        score.totalScore += agentScore;
      });

      score.totalScore /= participants.length; // Average
      scores.set(proposal.id, score);
    });

    return scores;
  }

  private assessFeasibility(proposal: Proposal): number {
    let score = 100;

    // Check resource availability
    proposal.content.resources.forEach(resource => {
      if (resource.availability !== 'immediate') {
        score -= 10;
      }
    });

    // Check timeline realism
    const duration = proposal.content.timeline.end.getTime() - proposal.content.timeline.start.getTime();
    const days = duration / (1000 * 60 * 60 * 24);
    
    if (days < 1) score -= 20; // Too aggressive
    if (days > 30) score -= 10; // Too long

    // Check constraint violations
    proposal.content.constraints.forEach(constraint => {
      if (constraint.severity === 'critical' && !constraint.validator(proposal)) {
        score -= 30;
      }
    });

    return Math.max(0, score);
  }

  private assessAlignment(proposal: Proposal): number {
    // Assess how well the proposal aligns with system goals
    // This would integrate with the Vibe Profiler
    return 75 + Math.random() * 25; // Simplified for demo
  }

  private assessRisk(proposal: Proposal): number {
    let riskScore = 0;

    proposal.content.expectedOutcome.failure.forEach(risk => {
      const impactScore = {
        low: 10,
        medium: 25,
        high: 50,
        critical: 100
      }[risk.impact];

      riskScore += risk.probability * impactScore;
    });

    return Math.max(0, 100 - riskScore);
  }

  private calculateAgentScore(agent: AgentRole, proposal: Proposal): number {
    // Each agent scores based on their role and priorities
    const roleWeights = {
      [AgentRole.LEADER]: { strategy: 0.4, feasibility: 0.3, risk: 0.3 },
      [AgentRole.PROJECT_MANAGER]: { timeline: 0.4, resources: 0.4, risk: 0.2 },
      [AgentRole.ARCHITECT]: { technical: 0.5, scalability: 0.3, quality: 0.2 },
      [AgentRole.ENGINEER]: { implementation: 0.5, efficiency: 0.3, simplicity: 0.2 },
      [AgentRole.DATA_ANALYST]: { metrics: 0.5, insights: 0.3, accuracy: 0.2 },
      [AgentRole.CRITIC]: { quality: 0.4, completeness: 0.3, risks: 0.3 },
      [AgentRole.RESEARCHER]: { innovation: 0.4, best_practices: 0.3, future_proof: 0.3 },
      [AgentRole.FIXER]: { quick_fix: 0.4, stability: 0.3, rollback: 0.3 }
    };

    const weights = roleWeights[agent] || { default: 1.0 };
    
    // Simplified scoring based on proposal properties
    let score = proposal.priority * 0.3 + proposal.confidence * 0.3;
    
    // Add role-specific adjustments
    Object.values(weights).forEach(weight => {
      score += Math.random() * 40 * weight;
    });

    return Math.min(100, score);
  }

  private selectBestProposal(scores: Map<string, ProposalScore>): Proposal | null {
    let bestScore = 0;
    let bestProposalId = '';

    scores.forEach((score, proposalId) => {
      const weightedScore = 
        score.totalScore * 0.4 +
        score.feasibility * 0.3 +
        score.alignment * 0.2 +
        score.risk * 0.1;

      if (weightedScore > bestScore) {
        bestScore = weightedScore;
        bestProposalId = proposalId;
      }
    });

    // Find and return the actual proposal
    for (const negotiation of Array.from(this.negotiations.values())) {
      const proposal = [...negotiation.proposals, ...negotiation.counterProposals]
        .find(p => p.id === bestProposalId);
      if (proposal) return proposal;
    }

    return null;
  }

  private hasConsensus(proposal: Proposal | null, participants: AgentRole[]): boolean {
    if (!proposal) return false;

    // Simplified consensus: requires 75% agreement
    const requiredVotes = Math.ceil(participants.length * 0.75);
    const votes = this.consensusEngine.collectVotes(proposal!, participants);
    
    return votes.filter(v => v.approve).length >= requiredVotes;
  }

  private createAgreement(negotiation: NegotiationContext, proposal: Proposal) {
    const agreement: Agreement = {
      id: crypto.randomUUID(),
      negotiationId: negotiation.id,
      terms: proposal.content,
      signatories: new Map(),
      effectiveDate: new Date(),
      status: 'active'
    };

    // Collect signatures
    negotiation.participants.forEach(agent => {
      agreement.signatories.set(agent, {
        agent,
        timestamp: new Date(),
        commitment: 'full',
        conditions: []
      });
    });

    negotiation.finalAgreement = agreement;
    negotiation.state = 'resolved';
    this.agreements.set(agreement.id, agreement);

    this.notifyAgreementReached(agreement);
  }

  private escalateDeadlock(negotiation: NegotiationContext) {
    negotiation.state = 'deadlock';
    
    // Apply conflict resolution
    const resolution = this.conflictResolver.resolve(negotiation);
    
    if (resolution) {
      this.createAgreement(negotiation, resolution);
    } else {
      // Final escalation to human intervention
      this.requestHumanIntervention(negotiation);
    }
  }

  private broadcastNegotiationRequest(negotiation: NegotiationContext) {
    // Send negotiation request to all participants
    const message = {
      type: 'negotiation_request',
      negotiation,
      timestamp: new Date()
    };

    this.messageQueue.broadcast(message, negotiation.participants);
  }

  private requestNewProposals(negotiation: NegotiationContext, currentBest: Proposal | null) {
    const message = {
      type: 'proposal_request',
      negotiationId: negotiation.id,
      currentBest,
      round: negotiation.rounds,
      deadline: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    };

    this.messageQueue.broadcast(message, negotiation.participants);
  }

  private notifyAgreementReached(agreement: Agreement) {
    const message = {
      type: 'agreement_reached',
      agreement,
      timestamp: new Date()
    };

    const participants = Array.from(agreement.signatories.keys());
    this.messageQueue.broadcast(message, participants);
  }

  private requestHumanIntervention(negotiation: NegotiationContext) {
    console.log('Human intervention required for negotiation:', negotiation.id);
    // In production, this would trigger a notification to human operators
  }

  getActiveNegotiations(): NegotiationContext[] {
    return Array.from(this.negotiations.values())
      .filter(n => n.state !== 'resolved');
  }

  getAgreements(): Agreement[] {
    return Array.from(this.agreements.values());
  }

  monitorAgreement(agreementId: string): AgreementStatus {
    const agreement = this.agreements.get(agreementId);
    if (!agreement) {
      return { status: 'not_found', violations: [] };
    }

    // Check for violations
    const violations = this.checkViolations(agreement);
    
    if (violations.length > 0) {
      agreement.status = 'violated';
      return { status: 'violated', violations };
    }

    // Check if completed
    if (this.isCompleted(agreement)) {
      agreement.status = 'completed';
      return { status: 'completed', violations: [] };
    }

    return { status: 'active', violations: [] };
  }

  private checkViolations(agreement: Agreement): string[] {
    const violations: string[] = [];
    
    // Check timeline violations
    if (agreement.expirationDate && new Date() > agreement.expirationDate) {
      violations.push('Agreement has expired');
    }

    // Additional violation checks would go here
    
    return violations;
  }

  private isCompleted(agreement: Agreement): boolean {
    // Check if all terms have been fulfilled
    // This would integrate with actual task tracking
    return false; // Simplified for demo
  }
}

interface ProposalScore {
  proposalId: string;
  totalScore: number;
  agentScores: Map<AgentRole, number>;
  feasibility: number;
  alignment: number;
  risk: number;
}

interface AgreementStatus {
  status: 'active' | 'completed' | 'violated' | 'not_found';
  violations: string[];
}

class MessageQueue {
  private queue: any[] = [];

  broadcast(message: any, recipients: AgentRole[]) {
    recipients.forEach(recipient => {
      this.queue.push({ ...message, to: recipient });
    });
    this.processQueue();
  }

  private processQueue() {
    while (this.queue.length > 0) {
      const message = this.queue.shift();
      // Process message delivery
      console.log('Delivering message to', message.to, ':', message.type);
    }
  }
}

class ConsensusEngine {
  collectVotes(proposal: Proposal, participants: AgentRole[]): Vote[] {
    return participants.map(agent => ({
      agent,
      approve: Math.random() > 0.3, // Simplified voting
      reason: 'Based on role priorities'
    }));
  }
}

class ConflictResolver {
  resolve(negotiation: NegotiationContext): Proposal | null {
    // Attempt to find middle ground
    const allProposals = [...negotiation.proposals, ...negotiation.counterProposals];
    
    if (allProposals.length === 0) return null;

    // Create compromise proposal
    const compromise = this.createCompromise(allProposals);
    return compromise;
  }

  private createCompromise(proposals: Proposal[]): Proposal {
    // Take average/median values from all proposals
    const firstProposal = proposals[0];
    
    return {
      ...firstProposal,
      id: crypto.randomUUID(),
      author: AgentRole.LEADER, // Leader makes final compromise
      priority: proposals.reduce((sum, p) => sum + p.priority, 0) / proposals.length,
      confidence: proposals.reduce((sum, p) => sum + p.confidence, 0) / proposals.length,
      timestamp: new Date()
    };
  }
}

interface Vote {
  agent: AgentRole;
  approve: boolean;
  reason: string;
}