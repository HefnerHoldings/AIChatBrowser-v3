import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { MultiAgentOrchestrator } from './MultiAgentOrchestrator';
import { 
  Brain,
  Users,
  Code2,
  Database,
  Target,
  Shield,
  GitBranch,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Activity,
  Sparkles,
  Trophy,
  Briefcase,
  Building,
  BarChart3,
  Lightbulb
} from 'lucide-react';

// Agent Role Definitions
export enum AgentRole {
  LEADER = 'leader',
  PM = 'pm',
  ARCHITECT = 'architect', 
  ENGINEER = 'engineer',
  ANALYST = 'analyst'
}

// Agent Intent Types
export enum AgentIntent {
  PLAN = 'plan',
  SPEC = 'spec',
  DESIGN = 'design',
  IMPLEMENT = 'implement',
  TEST = 'test',
  MEASURE = 'measure',
  REVIEW = 'review',
  MERGE = 'merge',
  DEPLOY = 'deploy'
}

// Inter-agent Message Schema
interface AgentMessage {
  id: string;
  role: AgentRole;
  intent: AgentIntent;
  topic: string;
  inputs?: {
    files?: string[];
    requirements?: string[];
  };
  constraints?: {
    perf_budget?: {
      lcp_ms?: number;
      tbt_ms?: number;
      cls?: number;
    };
  };
  proposal?: {
    steps: string[];
  };
  diff?: string;
  asserts?: string[];
  evidence?: Array<{
    type: string;
    ref: string;
  }>;
  decision?: {
    status: 'approve' | 'revise' | 'block';
    notes: string;
  };
  timestamp: Date;
}

// Agent State
interface Agent {
  role: AgentRole;
  name: string;
  icon: any;
  color: string;
  status: 'idle' | 'thinking' | 'working' | 'waiting' | 'reviewing';
  currentTask?: string;
  objectiveScore: number;
  messages: AgentMessage[];
}

// Objective Functions
const OBJECTIVE_FUNCTIONS = {
  [AgentRole.PM]: 'Maximize Acceptance Score (fulfilled requirements / total requirements)',
  [AgentRole.ARCHITECT]: 'Minimize Structure Debt (violations of architectural guidelines)',
  [AgentRole.ENGINEER]: 'Minimize time to green QA/PR',
  [AgentRole.ANALYST]: 'Maximize measurement coverage within budget'
};

export function MultiAgentTeam() {
  // Bruk den nye Multi-Agent Orchestrator
  return <MultiAgentOrchestrator />;
}

// Original implementasjon bevart for referanse
function MultiAgentTeamOriginal() {
  const [agents, setAgents] = useState<Agent[]>([
    {
      role: AgentRole.LEADER,
      name: 'Team Leader',
      icon: Brain,
      color: 'purple',
      status: 'thinking',
      currentTask: 'Orchestrating project plan',
      objectiveScore: 92,
      messages: []
    },
    {
      role: AgentRole.PM,
      name: 'Product Manager',
      icon: Briefcase,
      color: 'blue',
      status: 'working',
      currentTask: 'Defining user stories',
      objectiveScore: 88,
      messages: []
    },
    {
      role: AgentRole.ARCHITECT,
      name: 'Architect',
      icon: Building,
      color: 'green',
      status: 'idle',
      currentTask: undefined,
      objectiveScore: 95,
      messages: []
    },
    {
      role: AgentRole.ENGINEER,
      name: 'Engineer',
      icon: Code2,
      color: 'orange',
      status: 'waiting',
      currentTask: 'Awaiting specifications',
      objectiveScore: 90,
      messages: []
    },
    {
      role: AgentRole.ANALYST,
      name: 'Data Analyst',
      icon: BarChart3,
      color: 'pink',
      status: 'idle',
      currentTask: undefined,
      objectiveScore: 87,
      messages: []
    }
  ]);

  const [activeConversation, setActiveConversation] = useState<AgentMessage[]>([]);
  const [currentNegotiation, setCurrentNegotiation] = useState<any>(null);
  const [projectProgress, setProjectProgress] = useState(25);

  // Simulate agent activity
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => {
        // Randomly change status
        if (Math.random() > 0.8) {
          const statuses: Array<Agent['status']> = ['idle', 'thinking', 'working', 'waiting', 'reviewing'];
          return {
            ...agent,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            objectiveScore: Math.min(100, agent.objectiveScore + (Math.random() * 2 - 0.5))
          };
        }
        return agent;
      }));
      
      // Update project progress
      setProjectProgress(prev => Math.min(100, prev + Math.random() * 2));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Send message between agents
  const sendAgentMessage = useCallback((from: AgentRole, to: AgentRole, message: Partial<AgentMessage>) => {
    const newMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      role: from,
      intent: message.intent || AgentIntent.PLAN,
      topic: message.topic || 'general',
      timestamp: new Date(),
      ...message
    };

    setActiveConversation(prev => [...prev, newMessage]);
    
    // Update agent messages
    setAgents(prev => prev.map(agent => {
      if (agent.role === to) {
        return {
          ...agent,
          messages: [...agent.messages, newMessage],
          status: 'thinking' as const
        };
      }
      return agent;
    }));
  }, []);

  // Negotiation Protocol
  const initiateNegotiation = (topic: string, proposal: string[]) => {
    setCurrentNegotiation({
      topic,
      proposal,
      status: 'pending',
      votes: []
    });

    // Simulate agent responses
    setTimeout(() => {
      setCurrentNegotiation((prev: any) => ({
        ...prev,
        votes: [
          { agent: AgentRole.PM, vote: 'approve', reason: 'Meets acceptance criteria' },
          { agent: AgentRole.ARCHITECT, vote: 'revise', reason: 'Needs better structure' },
          { agent: AgentRole.ENGINEER, vote: 'approve', reason: 'Implementation feasible' }
        ]
      }));
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Team Overview */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Vibecoding Agent Team</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <Activity className="h-3 w-3 mr-1" />
              {agents.filter(a => a.status !== 'idle').length} Active
            </Badge>
            <Progress value={projectProgress} className="w-32 h-2" />
            <span className="text-sm font-medium">{Math.round(projectProgress)}%</span>
          </div>
        </div>

        {/* Agent Cards */}
        <div className="grid grid-cols-5 gap-3">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-3 border-2 ${
                agent.status === 'working' ? 'border-green-500' :
                agent.status === 'thinking' ? 'border-blue-500' :
                agent.status === 'reviewing' ? 'border-purple-500' :
                agent.status === 'waiting' ? 'border-yellow-500' :
                'border-muted'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <agent.icon className={`h-5 w-5 text-${agent.color}-600`} />
                  <Badge variant={agent.status === 'idle' ? 'secondary' : 'default'} className="text-xs">
                    {agent.status}
                  </Badge>
                </div>
                
                <h4 className="font-medium text-sm mb-1">{agent.name}</h4>
                
                {agent.currentTask && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {agent.currentTask}
                  </p>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Objective</span>
                    <span className="text-xs font-medium">{agent.objectiveScore}%</span>
                  </div>
                  <Progress value={agent.objectiveScore} className="h-1" />
                </div>

                {agent.status === 'working' && (
                  <motion.div
                    className="mt-2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Communication & Negotiation */}
      <div className="grid grid-cols-2 gap-4 flex-1">
        {/* Agent Conversations */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Agent Communication
            </h3>
            <Button size="sm" variant="outline" onClick={() => {
              sendAgentMessage(AgentRole.LEADER, AgentRole.PM, {
                intent: AgentIntent.PLAN,
                topic: 'pricing_page',
                proposal: {
                  steps: ['Define requirements', 'Create wireframes', 'Implement', 'Test']
                }
              });
            }}>
              <Sparkles className="h-4 w-4 mr-2" />
              Simulate Message
            </Button>
          </div>

          <ScrollArea className="h-64">
            <div className="space-y-2">
              {activeConversation.slice(-5).map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-2 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">
                      {msg.role.toUpperCase()} → {msg.intent}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{msg.topic}</p>
                  {msg.proposal && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Steps: {msg.proposal.steps.join(' → ')}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Negotiation Protocol */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Negotiation & Consensus
            </h3>
            <Button size="sm" variant="outline" onClick={() => {
              initiateNegotiation('architecture_decision', [
                'Use Next.js 14',
                'Tailwind CSS',
                'PostgreSQL',
                'Deploy to Vercel'
              ]);
            }}>
              <Lightbulb className="h-4 w-4 mr-2" />
              Start Negotiation
            </Button>
          </div>

          {currentNegotiation ? (
            <div className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">{currentNegotiation.topic}</h4>
                <div className="space-y-1">
                  {currentNegotiation.proposal.map((step: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {currentNegotiation.votes && currentNegotiation.votes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Agent Votes</h4>
                  {currentNegotiation.votes.map((vote: any) => (
                    <div key={vote.agent} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <Badge variant={vote.vote === 'approve' ? 'default' : 'secondary'}>
                        {vote.agent.toUpperCase()}
                      </Badge>
                      <div className="text-sm">
                        <span className={`font-medium ${
                          vote.vote === 'approve' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {vote.vote}
                        </span>
                        <span className="text-muted-foreground ml-2">{vote.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active negotiations</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Objective Functions */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Agent Objective Functions
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(OBJECTIVE_FUNCTIONS).map(([role, objective]) => (
            <div key={role} className="p-2 bg-muted/50 rounded-lg">
              <Badge variant="outline" className="text-xs mb-1">
                {role.toUpperCase()}
              </Badge>
              <p className="text-xs text-muted-foreground">{objective}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}