import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Brain,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Shield,
  Target,
  Activity,
  Send,
  Bot,
  User,
  FileCode2,
  Database,
  Sparkles,
  Vote,
  Handshake,
  AlertTriangle,
  ChevronRight,
  Play,
  Pause,
  RotateCw,
  Plus
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Agent typer og roller
type AgentRole = 'leader' | 'pm' | 'architect' | 'engineer' | 'analyst' | 'qa' | 'security';
type AgentStatus = 'idle' | 'thinking' | 'proposing' | 'voting' | 'executing' | 'blocked';
type ConsensusType = 'unanimous' | 'majority' | 'leader-override' | 'expert-domain';

interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  avatar: string;
  expertise: string[];
  trustScore: number; // 0-100
  activeTask?: string;
  lastActivity?: Date;
  voteWeight: number; // Vekt i avstemninger basert på ekspertise
}

interface Message {
  id: string;
  agentId: string;
  type: 'proposal' | 'vote' | 'concern' | 'info' | 'question' | 'decision';
  content: string;
  timestamp: Date;
  metadata?: {
    proposalId?: string;
    voteValue?: 'approve' | 'reject' | 'abstain';
    confidence?: number;
    relatedAgents?: string[];
  };
}

interface Proposal {
  id: string;
  agentId: string;
  title: string;
  description: string;
  type: 'technical' | 'architectural' | 'process' | 'security';
  status: 'pending' | 'voting' | 'approved' | 'rejected' | 'implemented';
  votes: Map<string, 'approve' | 'reject' | 'abstain'>;
  consensusType: ConsensusType;
  requiredApproval: number; // Prosent
  createdAt: Date;
  deadline?: Date;
}

interface Task {
  id: string;
  title: string;
  assignedTo: string[];
  status: 'pending' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  estimatedTime: number; // minutter
  actualTime?: number;
}

// Predefinerte agenter
const defaultAgents: Agent[] = [
  {
    id: 'leader',
    name: 'Magnus',
    role: 'leader',
    status: 'idle',
    avatar: '👔',
    expertise: ['strategi', 'beslutning', 'koordinering'],
    trustScore: 95,
    voteWeight: 2
  },
  {
    id: 'pm',
    name: 'Astrid',
    role: 'pm',
    status: 'idle',
    avatar: '📋',
    expertise: ['prosjektledelse', 'planlegging', 'ressurser'],
    trustScore: 90,
    voteWeight: 1.5
  },
  {
    id: 'architect',
    name: 'Erik',
    role: 'architect',
    status: 'idle',
    avatar: '🏗️',
    expertise: ['systemdesign', 'arkitektur', 'patterns'],
    trustScore: 92,
    voteWeight: 2
  },
  {
    id: 'engineer',
    name: 'Nora',
    role: 'engineer',
    status: 'idle',
    avatar: '💻',
    expertise: ['koding', 'implementering', 'debugging'],
    trustScore: 88,
    voteWeight: 1
  },
  {
    id: 'analyst',
    name: 'Lars',
    role: 'analyst',
    status: 'idle',
    avatar: '📊',
    expertise: ['data', 'analyse', 'rapportering'],
    trustScore: 85,
    voteWeight: 1
  },
  {
    id: 'qa',
    name: 'Ingrid',
    role: 'qa',
    status: 'idle',
    avatar: '🔍',
    expertise: ['testing', 'kvalitet', 'validering'],
    trustScore: 87,
    voteWeight: 1.5
  },
  {
    id: 'security',
    name: 'Bjørn',
    role: 'security',
    status: 'idle',
    avatar: '🛡️',
    expertise: ['sikkerhet', 'compliance', 'risiko'],
    trustScore: 93,
    voteWeight: 2
  }
];

export function MultiAgentOrchestrator() {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [messages, setMessages] = useState<Message[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRunning, setIsRunning] = useState(false);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simuler agent-aktivitet
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        simulateAgentActivity();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isRunning, agents, proposals]);

  const simulateAgentActivity = () => {
    const activeAgents = agents.filter(a => a.status !== 'idle');
    
    if (activeAgents.length === 0 && Math.random() > 0.5) {
      // Start ny aktivitet
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      createProposal(randomAgent);
    } else if (proposals.some(p => p.status === 'pending')) {
      // Stem på ventende forslag
      const pendingProposal = proposals.find(p => p.status === 'pending');
      if (pendingProposal) {
        const voter = agents.find(a => !pendingProposal.votes.has(a.id));
        if (voter) {
          voteOnProposal(voter, pendingProposal.id, Math.random() > 0.3 ? 'approve' : 'reject');
        }
      }
    }
  };

  const createProposal = (agent: Agent) => {
    const proposal: Proposal = {
      id: `prop-${Date.now()}`,
      agentId: agent.id,
      title: `Forslag fra ${agent.name}`,
      description: 'Implementer ny funksjon for bedre ytelse',
      type: 'technical',
      status: 'pending',
      votes: new Map(),
      consensusType: 'majority',
      requiredApproval: 60,
      createdAt: new Date()
    };

    setProposals(prev => [...prev, proposal]);
    
    const message: Message = {
      id: `msg-${Date.now()}`,
      agentId: agent.id,
      type: 'proposal',
      content: `Jeg foreslår: ${proposal.title}`,
      timestamp: new Date(),
      metadata: { proposalId: proposal.id }
    };
    
    setMessages(prev => [...prev, message]);
    updateAgentStatus(agent.id, 'proposing');
  };

  const voteOnProposal = (agent: Agent, proposalId: string, vote: 'approve' | 'reject' | 'abstain') => {
    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        const newVotes = new Map(p.votes);
        newVotes.set(agent.id, vote);
        
        // Sjekk om konsensus er nådd
        const approvalPercentage = calculateApprovalPercentage(newVotes);
        const newStatus = approvalPercentage >= p.requiredApproval ? 'approved' : 
                         newVotes.size === agents.length ? 'rejected' : 'voting';
        
        return { ...p, votes: newVotes, status: newStatus };
      }
      return p;
    }));

    const message: Message = {
      id: `msg-${Date.now()}`,
      agentId: agent.id,
      type: 'vote',
      content: `Jeg stemmer ${vote === 'approve' ? '✅ for' : vote === 'reject' ? '❌ mot' : '⏸️ avholder meg'}`,
      timestamp: new Date(),
      metadata: { proposalId, voteValue: vote }
    };
    
    setMessages(prev => [...prev, message]);
    updateAgentStatus(agent.id, 'voting');
  };

  const calculateApprovalPercentage = (votes: Map<string, string>): number => {
    let totalWeight = 0;
    let approvedWeight = 0;
    
    votes.forEach((vote, agentId) => {
      const agent = agents.find(a => a.id === agentId);
      if (agent) {
        totalWeight += agent.voteWeight;
        if (vote === 'approve') {
          approvedWeight += agent.voteWeight;
        }
      }
    });
    
    return totalWeight > 0 ? (approvedWeight / totalWeight) * 100 : 0;
  };

  const updateAgentStatus = (agentId: string, status: AgentStatus) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, status, lastActivity: new Date() } : a
    ));
  };

  const sendUserMessage = () => {
    if (!userInput.trim()) return;

    // Send til leader-agenten
    const message: Message = {
      id: `msg-${Date.now()}`,
      agentId: 'user',
      type: 'info',
      content: userInput,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, message]);
    setUserInput('');
    
    // Leader svarer
    setTimeout(() => {
      const leaderResponse: Message = {
        id: `msg-${Date.now() + 1}`,
        agentId: 'leader',
        type: 'info',
        content: `Forstått! Jeg koordinerer teamet for å håndtere: "${userInput}"`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, leaderResponse]);
      updateAgentStatus('leader', 'thinking');
    }, 1000);
  };

  const getRoleIcon = (role: AgentRole) => {
    switch (role) {
      case 'leader': return <Users className="h-4 w-4" />;
      case 'pm': return <Target className="h-4 w-4" />;
      case 'architect': return <FileCode2 className="h-4 w-4" />;
      case 'engineer': return <Bot className="h-4 w-4" />;
      case 'analyst': return <Database className="h-4 w-4" />;
      case 'qa': return <CheckCircle className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'idle': return 'bg-gray-500';
      case 'thinking': return 'bg-yellow-500';
      case 'proposing': return 'bg-blue-500';
      case 'voting': return 'bg-purple-500';
      case 'executing': return 'bg-green-500';
      case 'blocked': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Multi-Agent Orchestrator</CardTitle>
              <CardDescription>
                AI-team med konsensus-protokoller og strukturert kommunikasjon
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {isRunning ? (
              <Button variant="destructive" size="sm" onClick={() => setIsRunning(false)}>
                <Pause className="h-4 w-4 mr-2" />
                Stopp
              </Button>
            ) : (
              <Button size="sm" onClick={() => setIsRunning(true)}>
                <Play className="h-4 w-4 mr-2" />
                Start orkestrator
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => {
              setMessages([]);
              setProposals([]);
              setAgents(defaultAgents);
            }}>
              <RotateCw className="h-4 w-4 mr-2" />
              Tilbakestill
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="communication">Kommunikasjon</TabsTrigger>
            <TabsTrigger value="proposals">Forslag & Konsensus</TabsTrigger>
            <TabsTrigger value="tasks">Oppgaver</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Agent Grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {agents.map(agent => (
                <Card key={agent.id} className="relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-2 h-2 m-2 rounded-full ${getStatusColor(agent.status)}`} />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-2xl">{agent.avatar}</div>
                      <div>
                        <p className="font-semibold">{agent.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getRoleIcon(agent.role)}
                          <span className="capitalize">{agent.role}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Trust</span>
                        <span>{agent.trustScore}%</span>
                      </div>
                      <Progress value={agent.trustScore} className="h-1" />
                      
                      <Badge variant="outline" className="text-xs">
                        {agent.status}
                      </Badge>
                      
                      {agent.activeTask && (
                        <p className="text-xs text-muted-foreground truncate">
                          {agent.activeTask}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Statistikk */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Aktive agenter</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {agents.filter(a => a.status !== 'idle').length}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Vote className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Aktive forslag</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {proposals.filter(p => p.status === 'pending' || p.status === 'voting').length}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Godkjente</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {proposals.filter(p => p.status === 'approved').length}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Oppgaver</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {tasks.length}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="communication" className="mt-6">
            <div className="flex flex-col h-[600px]">
              {/* Meldinger */}
              <ScrollArea className="flex-1 border rounded-lg p-4 mb-4">
                <div className="space-y-3">
                  {messages.map(msg => {
                    const agent = msg.agentId === 'user' ? null : agents.find(a => a.id === msg.agentId);
                    const isUser = msg.agentId === 'user';
                    
                    return (
                      <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}>
                        {!isUser && (
                          <div className="text-2xl">{agent?.avatar || '🤖'}</div>
                        )}
                        <div className={`max-w-[70%] ${isUser ? 'order-first' : ''}`}>
                          <div className={`rounded-lg p-3 ${
                            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">
                                {isUser ? 'Du' : agent?.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {msg.type}
                              </Badge>
                            </div>
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {msg.timestamp.toLocaleTimeString('nb-NO')}
                            </p>
                          </div>
                        </div>
                        {isUser && (
                          <div className="text-2xl">👤</div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendUserMessage()}
                  placeholder="Send melding til AI-teamet..."
                  className="flex-1"
                />
                <Button onClick={sendUserMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="proposals" className="space-y-4 mt-6">
            {proposals.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Vote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Ingen aktive forslag</p>
                </CardContent>
              </Card>
            ) : (
              proposals.map(proposal => {
                const agent = agents.find(a => a.id === proposal.agentId);
                const approvalPercentage = calculateApprovalPercentage(proposal.votes);
                
                return (
                  <Card key={proposal.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{proposal.title}</h3>
                          <p className="text-sm text-muted-foreground">{proposal.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs">Foreslått av:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-lg">{agent?.avatar}</span>
                              <span className="text-sm font-medium">{agent?.name}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant={
                          proposal.status === 'approved' ? 'default' :
                          proposal.status === 'rejected' ? 'destructive' :
                          'outline'
                        }>
                          {proposal.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Godkjenning</span>
                          <span>{approvalPercentage.toFixed(0)}% / {proposal.requiredApproval}%</span>
                        </div>
                        <Progress value={approvalPercentage} className="h-2" />
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          {agents.map(a => {
                            const vote = proposal.votes.get(a.id);
                            return (
                              <div key={a.id} className="flex items-center gap-1">
                                <span className="text-lg">{a.avatar}</span>
                                {vote === 'approve' && <CheckCircle className="h-3 w-3 text-green-500" />}
                                {vote === 'reject' && <AlertCircle className="h-3 w-3 text-red-500" />}
                                {vote === 'abstain' && <Clock className="h-3 w-3 text-yellow-500" />}
                                {!vote && <Clock className="h-3 w-3 text-gray-400" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Oppgaver</h3>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ny oppgave
              </Button>
            </div>
            
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Ingen aktive oppgaver</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => (
                  <Card key={task.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={
                              task.priority === 'critical' ? 'destructive' :
                              task.priority === 'high' ? 'default' :
                              'secondary'
                            }>
                              {task.priority}
                            </Badge>
                            <Badge variant="outline">{task.status}</Badge>
                          </div>
                        </div>
                        <div className="flex -space-x-2">
                          {task.assignedTo.map(agentId => {
                            const agent = agents.find(a => a.id === agentId);
                            return agent ? (
                              <div key={agentId} className="text-lg border-2 border-background rounded-full bg-background">
                                {agent.avatar}
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}