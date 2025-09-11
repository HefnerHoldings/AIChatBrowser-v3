import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Bot, Activity, Brain, Shield, Search, Wrench, Settings, Play, Pause, RefreshCw } from 'lucide-react';
import AgentCard from './AgentCard';
import MessageFlow from './MessageFlow';
import TaskPipeline from './TaskPipeline';
import ConsensusPanel from './ConsensusPanel';
import KnowledgeExplorer from './KnowledgeExplorer';
import AgentConfig from './AgentConfig';

export interface Agent {
  id: string;
  type: 'planner' | 'critic' | 'executor' | 'researcher' | 'fixer';
  status: 'idle' | 'thinking' | 'working' | 'validating' | 'waiting' | 'error';
  currentTask?: any;
  metrics: {
    tasksCompleted: number;
    tasksFailed: number;
    averageTime: number;
    successRate: number;
  };
  capabilities: string[];
  confidence: number;
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification' | 'consensus';
  content: any;
  timestamp: Date;
}

export interface AgentTask {
  id: string;
  type: string;
  description: string;
  priority: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  assignedAgent?: string;
  dependencies?: string[];
  result?: any;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

const AgentDashboard = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [consensusRequests, setConsensusRequests] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/agents`);
    
    ws.onopen = () => {
      setIsConnected(true);
      toast({
        title: "Connected to Agent Orchestrator",
        description: "Real-time agent monitoring active",
      });
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onclose = () => {
      setIsConnected(false);
      toast({
        title: "Disconnected from Agent Orchestrator",
        description: "Attempting to reconnect...",
        variant: "destructive",
      });
    };

    wsRef.current = ws;

    // Initial data fetch
    fetchAgents();
    fetchTasks();

    return () => {
      ws.close();
    };
  }, []);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'agent-update':
        setAgents(prev => prev.map(a => 
          a.id === data.agent.id ? data.agent : a
        ));
        break;
      case 'message':
        setMessages(prev => [data.message, ...prev].slice(0, 100));
        break;
      case 'task-update':
        setTasks(prev => prev.map(t => 
          t.id === data.task.id ? data.task : t
        ));
        break;
      case 'consensus-request':
        setConsensusRequests(prev => [...prev, data.request]);
        break;
      case 'agents-list':
        setAgents(data.agents);
        break;
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/agents/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const createTask = async (task: Partial<AgentTask>) => {
    try {
      const response = await fetch('/api/agents/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      
      if (response.ok) {
        const newTask = await response.json();
        toast({
          title: "Task Created",
          description: `Task ${newTask.id} has been created and queued`,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const pauseAgent = async (agentId: string) => {
    try {
      await fetch(`/api/agents/${agentId}/pause`, { method: 'POST' });
      toast({
        title: "Agent Paused",
        description: `Agent ${agentId} has been paused`,
      });
    } catch (error) {
      toast({
        title: "Failed to pause agent",
        variant: "destructive",
      });
    }
  };

  const resumeAgent = async (agentId: string) => {
    try {
      await fetch(`/api/agents/${agentId}/resume`, { method: 'POST' });
      toast({
        title: "Agent Resumed",
        description: `Agent ${agentId} has been resumed`,
      });
    } catch (error) {
      toast({
        title: "Failed to resume agent",
        variant: "destructive",
      });
    }
  };

  const resetAgent = async (agentId: string) => {
    try {
      await fetch(`/api/agents/${agentId}/reset`, { method: 'POST' });
      toast({
        title: "Agent Reset",
        description: `Agent ${agentId} has been reset`,
      });
    } catch (error) {
      toast({
        title: "Failed to reset agent",
        variant: "destructive",
      });
    }
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'planner': return <Brain className="w-5 h-5" />;
      case 'critic': return <Shield className="w-5 h-5" />;
      case 'executor': return <Bot className="w-5 h-5" />;
      case 'researcher': return <Search className="w-5 h-5" />;
      case 'fixer': return <Wrench className="w-5 h-5" />;
      default: return <Bot className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-gray-500';
      case 'thinking': return 'bg-yellow-500';
      case 'working': return 'bg-blue-500';
      case 'validating': return 'bg-purple-500';
      case 'waiting': return 'bg-orange-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Calculate overall system metrics
  const systemMetrics = agents.reduce((acc, agent) => ({
    totalTasks: acc.totalTasks + agent.metrics.tasksCompleted + agent.metrics.tasksFailed,
    completedTasks: acc.completedTasks + agent.metrics.tasksCompleted,
    failedTasks: acc.failedTasks + agent.metrics.tasksFailed,
    avgSuccessRate: agents.length > 0 ? 
      agents.reduce((sum, a) => sum + a.metrics.successRate, 0) / agents.length : 0
  }), { totalTasks: 0, completedTasks: 0, failedTasks: 0, avgSuccessRate: 0 });

  return (
    <div className="h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Multi-Agent Orchestrator 2.0
            </h1>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAgents()}
              data-testid="button-refresh-agents"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedAgent(null)}
              data-testid="button-agent-settings"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <Card>
            <CardContent className="p-3">
              <div className="text-sm text-muted-foreground">Total Tasks</div>
              <div className="text-2xl font-bold">{systemMetrics.totalTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-sm text-muted-foreground">Completed</div>
              <div className="text-2xl font-bold text-green-600">
                {systemMetrics.completedTasks}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-sm text-muted-foreground">Failed</div>
              <div className="text-2xl font-bold text-red-600">
                {systemMetrics.failedTasks}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-sm text-muted-foreground">Success Rate</div>
              <div className="text-2xl font-bold">
                {systemMetrics.avgSuccessRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full">
          <TabsList className="ml-4">
            <TabsTrigger value="overview" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-messages">
              Message Flow
            </TabsTrigger>
            <TabsTrigger value="tasks" data-testid="tab-tasks">
              Task Pipeline
            </TabsTrigger>
            <TabsTrigger value="consensus" data-testid="tab-consensus">
              Consensus
            </TabsTrigger>
            <TabsTrigger value="knowledge" data-testid="tab-knowledge">
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger value="config" data-testid="tab-config">
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-4 h-[calc(100%-3rem)] overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {agents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onPause={() => pauseAgent(agent.id)}
                  onResume={() => resumeAgent(agent.id)}
                  onReset={() => resetAgent(agent.id)}
                  onSelect={() => setSelectedAgent(agent.id)}
                />
              ))}
            </div>

            {/* Active Tasks */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Active Tasks</h2>
              <div className="space-y-2">
                {tasks
                  .filter(t => t.status === 'in-progress')
                  .map(task => (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{task.description}</div>
                            <div className="text-sm text-muted-foreground">
                              Assigned to: {task.assignedAgent || 'Unassigned'}
                            </div>
                          </div>
                          <Badge>{task.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="p-4 h-[calc(100%-3rem)]">
            <MessageFlow messages={messages} agents={agents} />
          </TabsContent>

          <TabsContent value="tasks" className="p-4 h-[calc(100%-3rem)]">
            <TaskPipeline 
              tasks={tasks}
              agents={agents}
              onCreateTask={createTask}
            />
          </TabsContent>

          <TabsContent value="consensus" className="p-4 h-[calc(100%-3rem)]">
            <ConsensusPanel 
              requests={consensusRequests}
              agents={agents}
            />
          </TabsContent>

          <TabsContent value="knowledge" className="p-4 h-[calc(100%-3rem)]">
            <KnowledgeExplorer agents={agents} />
          </TabsContent>

          <TabsContent value="config" className="p-4 h-[calc(100%-3rem)]">
            <AgentConfig 
              agents={agents}
              selectedAgent={selectedAgent}
              onUpdate={fetchAgents}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentDashboard;