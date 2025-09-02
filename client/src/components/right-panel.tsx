import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ActivityLog, ExtractedLead } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Crosshair, Download, FileText, Pause } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RightPanelProps {
  currentTaskId: string;
}

export default function RightPanel({ currentTaskId }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState("activity");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activityLogs = [] } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs", { taskId: currentTaskId }],
    enabled: !!currentTaskId,
  });

  const { data: extractedLeads = [] } = useQuery<ExtractedLead[]>({
    queryKey: ["/api/extracted-leads", { taskId: currentTaskId }],
    enabled: !!currentTaskId,
  });

  const pauseTaskMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/automation-tasks/${currentTaskId}/pause`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation-tasks"] });
      toast({
        title: "Task Paused",
        description: "Automation has been paused successfully.",
      });
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/export-leads/${currentTaskId}`, { format: "csv" }),
    onSuccess: () => {
      toast({
        title: "Export Started",
        description: "Data export has been initiated.",
      });
    },
  });

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "search": return "🔍";
      case "extract": return "📊";
      case "navigate": return "🧭";
      case "validate": return "✅";
      case "export": return "📁";
      default: return "🔄";
    }
  };

  const tabs = [
    { id: "activity", label: "Activity" },
    { id: "data", label: "Data" },
    { id: "logs", label: "Logs" },
  ];

  return (
    <div className="w-80 border-l border-border bg-card/30 flex flex-col">
      {/* Panel Tabs */}
      <div className="border-b border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              className={`flex-1 rounded-none py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`panel-tab-${tab.id}`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "activity" && (
          <div className="p-4">
            <h3 className="font-medium mb-4">Execution Timeline</h3>
            
            <div className="space-y-4">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/20 border-2 border-primary rounded-full flex items-center justify-center text-xs">
                    {getActivityIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{log.action}</div>
                    {log.details && (
                      <div className="text-xs text-muted-foreground">
                        {typeof log.details === 'object' 
                          ? Object.entries(log.details as Record<string, any>).map(([key, value]) => 
                              `${key}: ${value}`
                            ).join(", ")
                          : String(log.details)
                        }
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {formatTimeAgo(log.timestamp)}
                    </div>
                    
                    {log.type === "extract" && log.details && (
                      <div className="mt-2 bg-accent/50 rounded p-2">
                        <div className="text-xs space-y-1">
                          {Object.entries((log.details as any).extracted || {}).map(([key, value]) => (
                            <div key={key}>✓ {key}: {value as any}/24</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Quick Stats */}
            <div className="mt-6 p-3 bg-accent/50 rounded-md">
              <div className="text-sm font-medium mb-2">Session Stats</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Pages visited:</span>
                  <span>{activityLogs.filter(log => log.type === "navigate").length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data points:</span>
                  <span>{extractedLeads.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Success rate:</span>
                  <span className="text-green-400">
                    {activityLogs.length > 0 
                      ? Math.round((activityLogs.filter(log => log.status === "success").length / activityLogs.length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Runtime:</span>
                  <span>2m 14s</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "data" && (
          <div className="p-4">
            <h3 className="font-medium mb-4">Extracted Data</h3>
            
            <div className="space-y-3">
              {extractedLeads.map((lead) => (
                <div key={lead.id} className="p-3 bg-accent/30 rounded-md">
                  <div className="font-medium text-sm">{lead.company}</div>
                  <div className="text-xs text-muted-foreground space-y-1 mt-1">
                    {lead.website && <div>🌐 {lead.website}</div>}
                    {lead.email && <div>📧 {lead.email}</div>}
                    {lead.phone && <div>📞 {lead.phone}</div>}
                    {lead.country && <div>🌍 {lead.country}</div>}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant={lead.validated ? "default" : "secondary"} className="text-xs">
                      Score: {lead.score || 0}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {formatTimeAgo(lead.extractedAt)}
                    </div>
                  </div>
                </div>
              ))}
              
              {extractedLeads.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-sm">No data extracted yet</div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === "logs" && (
          <div className="p-4">
            <h3 className="font-medium mb-4">System Logs</h3>
            
            <div className="font-mono text-xs space-y-1 bg-accent/20 p-3 rounded-md">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-2">
                  <span className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={log.status === "success" ? "text-green-400" : log.status === "error" ? "text-red-400" : "text-yellow-400"}>
                    [{log.status.toUpperCase()}]
                  </span>
                  <span>{log.action}</span>
                </div>
              ))}
              
              {activityLogs.length === 0 && (
                <div className="text-muted-foreground">No logs available</div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="border-t border-border p-4">
        <div className="space-y-2">
          <Button 
            variant="secondary" 
            className="w-full justify-start" 
            size="sm"
            onClick={() => pauseTaskMutation.mutate()}
            disabled={pauseTaskMutation.isPending}
            data-testid="button-pause"
          >
            <Pause className="w-4 h-4 mr-2" />
            Pause Execution
          </Button>
          <Button 
            variant="secondary" 
            className="w-full justify-start" 
            size="sm"
            onClick={() => exportDataMutation.mutate()}
            disabled={exportDataMutation.isPending}
            data-testid="button-export"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Current Data
          </Button>
          <Button 
            variant="secondary" 
            className="w-full justify-start" 
            size="sm"
            data-testid="button-report"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>
    </div>
  );
}
