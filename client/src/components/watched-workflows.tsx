import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock,
  Calendar,
  Bell,
  Eye,
  GitCompare,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Plus,
  Filter,
  TrendingUp,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WatchedWorkflow {
  id: string;
  name: string;
  playbook: string;
  schedule: {
    rrule: string;
    nextRun: Date;
    lastRun?: Date;
  };
  triggers: {
    type: "content" | "element" | "status" | "time";
    condition: string;
  }[];
  actions: {
    type: "run" | "notify" | "create-pr" | "alert";
    target?: string;
  }[];
  status: "active" | "paused" | "error";
  diffDetection: boolean;
  stats: {
    runs: number;
    successes: number;
    failures: number;
    changes: number;
  };
}

export function WatchedWorkflows() {
  const { toast } = useToast();
  const [selectedWorkflow, setSelectedWorkflow] = useState<WatchedWorkflow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [workflows, setWorkflows] = useState<WatchedWorkflow[]>([
    {
      id: "wf-1",
      name: "Weekly Lead Scraping",
      playbook: "leads_eu_wholesale",
      schedule: {
        rrule: "FREQ=WEEKLY;BYDAY=MO;BYHOUR=7",
        nextRun: new Date(Date.now() + 86400000),
        lastRun: new Date(Date.now() - 604800000)
      },
      triggers: [
        { type: "time", condition: "Every Monday 7:00 AM" },
        { type: "content", condition: "New suppliers added" }
      ],
      actions: [
        { type: "run", target: "playbook" },
        { type: "notify", target: "email" },
        { type: "create-pr", target: "github" }
      ],
      status: "active",
      diffDetection: true,
      stats: {
        runs: 12,
        successes: 11,
        failures: 1,
        changes: 34
      }
    },
    {
      id: "wf-2",
      name: "Price Monitor",
      playbook: "price_tracking",
      schedule: {
        rrule: "FREQ=DAILY;BYHOUR=9,15",
        nextRun: new Date(Date.now() + 3600000),
        lastRun: new Date(Date.now() - 21600000)
      },
      triggers: [
        { type: "element", condition: "Price change > 10%" },
        { type: "status", condition: "HTTP 404 detected" }
      ],
      actions: [
        { type: "alert", target: "slack" },
        { type: "run", target: "screenshot" }
      ],
      status: "active",
      diffDetection: true,
      stats: {
        runs: 48,
        successes: 46,
        failures: 2,
        changes: 127
      }
    }
  ]);

  const toggleWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.map(wf => 
      wf.id === workflowId 
        ? { ...wf, status: wf.status === "active" ? "paused" : "active" }
        : wf
    ));
    
    toast({
      title: "Workflow updated",
      description: "Workflow status has been changed",
    });
  };

  const formatNextRun = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      return `in ${Math.floor(hours / 24)} days`;
    } else if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    } else {
      return `in ${minutes}m`;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Watched Workflows & Scheduler
            </div>
            <Button 
              size="sm"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              New Workflow
            </Button>
          </CardTitle>
          <CardDescription>
            Automated playbook execution with scheduling and triggers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              <div className="space-y-3">
                {workflows.map((workflow) => (
                  <Card key={workflow.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{workflow.name}</span>
                            <Badge variant={workflow.status === "active" ? "default" : "secondary"}>
                              {workflow.status}
                            </Badge>
                            {workflow.diffDetection && (
                              <Badge variant="outline">
                                <GitCompare className="h-3 w-3 mr-1" />
                                Diff
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            Playbook: <code className="bg-muted px-1 rounded">{workflow.playbook}</code>
                          </div>

                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Next: {formatNextRun(workflow.schedule.nextRun)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {workflow.stats.runs} runs
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {Math.round((workflow.stats.successes / workflow.stats.runs) * 100)}% success
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-2">
                            {workflow.triggers.map((trigger, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {trigger.type}: {trigger.condition}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleWorkflow(workflow.id)}
                          >
                            {workflow.status === "active" ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <div className="grid grid-cols-7 gap-2 text-center">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div key={day} className="text-xs font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 28 }, (_, i) => (
                  <div 
                    key={i} 
                    className={`aspect-square border rounded p-1 text-xs ${
                      i === 7 || i === 14 || i === 21 ? "bg-primary/10 border-primary" : ""
                    }`}
                  >
                    <div className="font-medium">{i + 1}</div>
                    {(i === 7 || i === 14 || i === 21) && (
                      <div className="text-[10px] text-primary mt-1">
                        2 runs
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">RRULE Support</div>
                    <div className="text-xs">
                      Supports RFC 5545 recurrence rules for complex scheduling patterns
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">60</div>
                    <div className="text-xs text-muted-foreground">Total Runs</div>
                    <TrendingUp className="h-4 w-4 text-green-500 mt-2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">93%</div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                    <CheckCircle className="h-4 w-4 text-green-500 mt-2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">161</div>
                    <div className="text-xs text-muted-foreground">Changes Detected</div>
                    <GitCompare className="h-4 w-4 text-blue-500 mt-2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">2.3m</div>
                    <div className="text-xs text-muted-foreground">Avg Duration</div>
                    <Clock className="h-4 w-4 text-yellow-500 mt-2" />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium mb-3">Execution Timeline</div>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <div className="text-muted-foreground w-20">
                            {new Date(Date.now() - i * 86400000).toLocaleDateString()}
                          </div>
                          <div className="flex-1 bg-muted rounded h-6 relative">
                            <div 
                              className="absolute left-0 top-0 h-full bg-primary rounded"
                              style={{ width: `${80 + Math.random() * 20}%` }}
                            />
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {Math.floor(2 + Math.random() * 3)} runs
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}