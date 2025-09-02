import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Workflow, AutomationTask, type InsertAutomationTask } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Edit, Plus, Send, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LeftSidebarProps {
  currentProjectId: string;
  currentTaskId: string;
  setCurrentTaskId: (id: string) => void;
}

export default function LeftSidebar({ currentProjectId, currentTaskId, setCurrentTaskId }: LeftSidebarProps) {
  const [goalInput, setGoalInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workflows = [] } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows", { projectId: currentProjectId }],
    enabled: !!currentProjectId,
  });

  const { data: currentTask } = useQuery<AutomationTask>({
    queryKey: ["/api/automation-tasks", currentTaskId],
    enabled: !!currentTaskId,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (goal: string) => {
      const taskData: InsertAutomationTask = {
        projectId: currentProjectId,
        name: goal.substring(0, 50) + (goal.length > 50 ? "..." : ""),
        goal,
        status: "pending",
        permissions: ["Browse", "Extract", "Export"],
        plan: {
          steps: [
            { name: "Analyze goal", estimated: "1m", status: "pending" },
            { name: "Create execution plan", estimated: "1m", status: "pending" },
            { name: "Execute automation", estimated: "5-10m", status: "pending" },
          ],
          permissions: ["Browse", "Extract", "Export"],
          riskLevel: "low"
        }
      };
      
      const response = await apiRequest("POST", "/api/automation-tasks", taskData);
      return response.json();
    },
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation-tasks"] });
      setCurrentTaskId(newTask.id);
      setGoalInput("");
      toast({
        title: "Task Created",
        description: "New automation task has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create automation task.",
        variant: "destructive",
      });
    },
  });

  const approvePlanMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/automation-tasks/${currentTaskId}/execute`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation-tasks"] });
      toast({
        title: "Plan Approved",
        description: "Automation execution has started.",
      });
    },
  });

  const handleSubmitGoal = () => {
    if (!goalInput.trim()) return;
    createTaskMutation.mutate(goalInput);
  };

  const getStatusDotClass = (status: string) => {
    switch (status) {
      case "completed": return "status-completed";
      case "running": return "status-running";
      case "failed": return "status-failed";
      default: return "status-pending";
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return "Just now";
  };

  return (
    <div className="w-80 border-r border-border bg-card/30 flex flex-col">
      {/* Chat Interface */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold mb-3 flex items-center">
          <MessageCircle className="w-4 h-4 mr-2 text-primary" />
          Goal Planning
        </h2>
        
        <div className="space-y-3 mb-4 max-h-32 overflow-y-auto">
          <div className="text-sm">
            <div className="bg-accent rounded-lg p-3">
              <strong>You:</strong> Find 150 relevant cookware wholesalers in EU, collect contact info, and export to XLSX
            </div>
          </div>
          <div className="text-sm">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <strong>MadEasy:</strong> I'll create a plan to search for cookware wholesalers across EU markets, extract contact information, validate data quality, and export results. This will require browser automation and data collection permissions.
            </div>
          </div>
        </div>
        
        <div className="relative">
          <Input
            placeholder="Describe your goal..."
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmitGoal()}
            className="pr-10"
            data-testid="input-goal"
          />
          <Button 
            size="sm" 
            variant="ghost" 
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={handleSubmitGoal}
            disabled={!goalInput.trim() || createTaskMutation.isPending}
            data-testid="button-submit-goal"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Current Plan */}
      {currentTask && (
        <div className="p-4 border-b border-border">
          <h3 className="font-medium mb-3 flex items-center justify-between">
            <span>Current Plan</span>
            <Button variant="ghost" size="sm" className="text-xs h-6">
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </h3>
          
          <div className="space-y-2">
            {currentTask.plan?.steps?.map((step: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <span className={`status-dot ${getStatusDotClass(step.status)} mr-2`}></span>
                  {step.name}
                </span>
                <span className="text-xs text-muted-foreground">{step.estimated}</span>
              </div>
            ))}
          </div>
          
          {currentTask.permissions && (
            <div className="mt-4 p-3 bg-accent/50 rounded-md">
              <div className="text-xs font-medium mb-2">Permissions Required:</div>
              <div className="flex flex-wrap gap-1">
                {currentTask.permissions.map((permission) => (
                  <Badge key={permission} variant="secondary" className="text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <Button 
            className="w-full mt-3" 
            size="sm"
            onClick={() => approvePlanMutation.mutate()}
            disabled={approvePlanMutation.isPending || currentTask.status === "running"}
            data-testid="button-approve-plan"
          >
            <Check className="w-4 h-4 mr-1" />
            {currentTask.status === "running" ? "Executing..." : "Approve Plan"}
          </Button>
        </div>
      )}
      
      {/* Workflow Library */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="font-medium mb-3 flex items-center justify-between">
          <span>Saved Workflows</span>
          <Button variant="ghost" size="sm" className="text-xs h-6">
            <Plus className="w-3 h-3 mr-1" />
            New
          </Button>
        </h3>
        
        <div className="space-y-2">
          {workflows.map((workflow) => (
            <div 
              key={workflow.id}
              className="p-3 bg-accent/30 rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
              data-testid={`workflow-${workflow.id}`}
            >
              <div className="font-medium text-sm">{workflow.name}</div>
              <div className="text-xs text-muted-foreground">
                {workflow.lastUsed ? `Last used ${formatTimeAgo(workflow.lastUsed)}` : 'Never used'}
              </div>
              <div className="flex items-center mt-2 text-xs gap-1">
                {workflow.tags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
