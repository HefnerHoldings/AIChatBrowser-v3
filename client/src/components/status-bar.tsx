import { useQuery } from "@tanstack/react-query";
import { AutomationTask } from "@shared/schema";

interface StatusBarProps {
  currentTaskId: string;
}

export default function StatusBar({ currentTaskId }: StatusBarProps) {
  const { data: currentTask } = useQuery<AutomationTask>({
    queryKey: ["/api/automation-tasks", currentTaskId],
    enabled: !!currentTaskId,
  });

  const getStatusDotClass = (status: string) => {
    switch (status) {
      case "running": return "status-running";
      case "completed": return "status-completed";
      case "failed": return "status-failed";
      default: return "status-pending";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "running": return "Automation Active";
      case "completed": return "Task Completed";
      case "failed": return "Task Failed";
      case "paused": return "Task Paused";
      default: return "Ready";
    }
  };

  return (
    <div className="border-t border-border bg-card/50 px-6 py-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <span className={`status-dot ${getStatusDotClass(currentTask?.status || "pending")} mr-2`}></span>
            <span>{getStatusText(currentTask?.status || "pending")}</span>
          </span>
          <span className="text-muted-foreground">Domain: google.com</span>
          <span className="text-muted-foreground">Memory: 142MB</span>
          {currentTask?.progress !== undefined && (
            <span className="text-muted-foreground">Progress: {currentTask.progress}%</span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-muted-foreground">Atlas v1.2.0</span>
          <span className="text-muted-foreground">Connected</span>
        </div>
      </div>
    </div>
  );
}
