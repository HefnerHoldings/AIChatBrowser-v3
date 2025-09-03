import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain,
  Search,
  Shield,
  Wrench,
  Zap,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  GitBranch,
  Bot,
  Activity,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Agent {
  id: string;
  role: "planner" | "critic" | "executor" | "researcher" | "fixer";
  name: string;
  status: "idle" | "thinking" | "working" | "debating" | "complete" | "error";
  currentTask?: string;
  confidence: number;
  messages: AgentMessage[];
}

interface AgentMessage {
  id: string;
  timestamp: Date;
  role: string;
  intent: string;
  proposal?: string;
  asserts?: string[];
  evidence?: any;
  decision?: string;
}

interface TaskNode {
  id: string;
  name: string;
  dependencies: string[];
  status: "pending" | "running" | "success" | "failed" | "skipped";
  agent?: string;
  retries: number;
  maxRetries: number;
}

export function MultiAgentOrchestrator({ workOrderId }: { workOrderId?: string }) {
  const { toast } = useToast();
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [consensusRounds, setConsensusRounds] = useState(0);
  const [taskGraph, setTaskGraph] = useState<TaskNode[]>([]);
  
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: "planner",
      role: "planner",
      name: "Strategic Planner",
      status: "idle",
      confidence: 85,
      messages: []
    },
    {
      id: "critic",
      role: "critic",
      name: "Quality Critic",
      status: "idle",
      confidence: 90,
      messages: []
    },
    {
      id: "executor",
      role: "executor",
      name: "Task Executor",
      status: "idle",
      confidence: 95,
      messages: []
    },
    {
      id: "researcher",
      role: "researcher",
      name: "Data Researcher",
      status: "idle",
      confidence: 88,
      messages: []
    },
    {
      id: "fixer",
      role: "fixer",
      name: "Error Fixer",
      status: "idle",
      confidence: 92,
      messages: []
    }
  ]);

  const getAgentIcon = (role: string) => {
    switch (role) {
      case "planner": return <Brain className="h-4 w-4" />;
      case "critic": return <Shield className="h-4 w-4" />;
      case "executor": return <Zap className="h-4 w-4" />;
      case "researcher": return <Search className="h-4 w-4" />;
      case "fixer": return <Wrench className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "idle": return "secondary";
      case "thinking": return "outline";
      case "working": return "default";
      case "debating": return "destructive";
      case "complete": return "success";
      case "error": return "destructive";
      default: return "secondary";
    }
  };

  const startOrchestration = () => {
    setIsOrchestrating(true);
    
    // Simulate multi-agent workflow
    const workflow = [
      { id: "analyze", name: "Analyze requirements", dependencies: [], agent: "planner" },
      { id: "review", name: "Review approach", dependencies: ["analyze"], agent: "critic" },
      { id: "research", name: "Research data sources", dependencies: ["analyze"], agent: "researcher" },
      { id: "execute", name: "Execute tasks", dependencies: ["review", "research"], agent: "executor" },
      { id: "validate", name: "Validate results", dependencies: ["execute"], agent: "critic" },
      { id: "fix", name: "Fix issues", dependencies: ["validate"], agent: "fixer" },
    ];

    setTaskGraph(workflow.map(w => ({
      ...w,
      status: "pending",
      retries: 0,
      maxRetries: 3
    })));

    // Simulate agent consensus debate
    setTimeout(() => {
      setConsensusRounds(1);
      updateAgentStatus("planner", "thinking", "Analyzing work order requirements");
      updateAgentStatus("critic", "thinking", "Preparing quality criteria");
    }, 1000);

    setTimeout(() => {
      setConsensusRounds(2);
      updateAgentStatus("planner", "debating", "Proposing execution plan");
      updateAgentStatus("critic", "debating", "Evaluating risk factors");
    }, 3000);

    setTimeout(() => {
      setConsensusRounds(3);
      updateAgentStatus("planner", "complete", "Plan approved");
      updateAgentStatus("critic", "complete", "Quality gates defined");
      updateAgentStatus("executor", "working", "Starting task execution");
      setIsOrchestrating(false);
    }, 5000);
  };

  const updateAgentStatus = (agentId: string, status: Agent["status"], task?: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status, currentTask: task }
        : agent
    ));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Multi-Agent Orchestration 2.0
            </div>
            <Button 
              size="sm"
              onClick={startOrchestration}
              disabled={isOrchestrating}
            >
              {isOrchestrating ? (
                <>
                  <Clock className="h-3 w-3 mr-1 animate-spin" />
                  Orchestrating...
                </>
              ) : (
                <>
                  <GitBranch className="h-3 w-3 mr-1" />
                  Start Orchestration
                </>
              )}
            </Button>
          </CardTitle>
          <CardDescription>
            Specialized AI agents working together to complete complex tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="agents" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="consensus">Consensus</TabsTrigger>
              <TabsTrigger value="taskgraph">Task Graph</TabsTrigger>
            </TabsList>

            <TabsContent value="agents" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <Card key={agent.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getAgentIcon(agent.role)}
                          <div>
                            <div className="font-medium text-sm">{agent.name}</div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {agent.role}
                            </div>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(agent.status) as any}>
                          {agent.status}
                        </Badge>
                      </div>
                      
                      {agent.currentTask && (
                        <div className="text-xs text-muted-foreground mb-2">
                          {agent.currentTask}
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Confidence</span>
                          <span>{agent.confidence}%</span>
                        </div>
                        <Progress value={agent.confidence} className="h-1" />
                      </div>

                      {agent.status === "working" && (
                        <div className="absolute top-2 right-2">
                          <Activity className="h-3 w-3 text-primary animate-pulse" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="consensus" className="space-y-4">
              <Alert>
                <MessageSquare className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Consensus Protocol</div>
                    <div className="text-xs">
                      Planner and Critic agents engage in structured debate (max 3 rounds) to reach consensus.
                      Conflicts trigger human-in-the-loop intervention.
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Consensus Rounds</span>
                  <Badge>{consensusRounds}/3</Badge>
                </div>

                {consensusRounds > 0 && (
                  <ScrollArea className="h-[200px] border rounded p-3">
                    <div className="space-y-2 text-xs font-mono">
                      {consensusRounds >= 1 && (
                        <div className="flex items-start gap-2">
                          <Badge variant="outline">Round 1</Badge>
                          <div>
                            <div>Planner: Proposing workflow with 6 stages</div>
                            <div>Critic: Identified 2 risk factors</div>
                          </div>
                        </div>
                      )}
                      {consensusRounds >= 2 && (
                        <div className="flex items-start gap-2">
                          <Badge variant="outline">Round 2</Badge>
                          <div>
                            <div>Planner: Added mitigation steps</div>
                            <div>Critic: Approved with conditions</div>
                          </div>
                        </div>
                      )}
                      {consensusRounds >= 3 && (
                        <div className="flex items-start gap-2">
                          <Badge variant="outline">Round 3</Badge>
                          <div>
                            <div className="text-green-500">✓ Consensus reached</div>
                            <div>Proceeding with execution</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>

            <TabsContent value="taskgraph" className="space-y-4">
              <div className="space-y-2">
                {taskGraph.map((task, index) => (
                  <div key={task.id} className="flex items-center gap-3 p-2 border rounded">
                    <div className="text-xs text-muted-foreground w-8">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{task.name}</div>
                      {task.agent && (
                        <div className="text-xs text-muted-foreground">
                          Assigned to: {task.agent}
                        </div>
                      )}
                    </div>
                    <Badge variant={
                      task.status === "success" ? "default" :
                      task.status === "running" ? "secondary" :
                      task.status === "failed" ? "destructive" :
                      "outline"
                    }>
                      {task.status}
                    </Badge>
                    {task.dependencies.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <ArrowRight className="h-3 w-3 inline" />
                        {task.dependencies.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}