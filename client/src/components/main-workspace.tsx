import { Button } from "@/components/ui/button";
import BrowserViewport from "./browser-viewport";
import WorkflowBuilder from "./workflow-builder";
import DataDashboard from "./data-dashboard";

interface MainWorkspaceProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentTaskId: string;
}

export default function MainWorkspace({ activeTab, setActiveTab, currentTaskId }: MainWorkspaceProps) {
  const tabs = [
    { id: "browser", label: "Browser View" },
    { id: "workflow", label: "Workflow Editor" },
    { id: "data", label: "Data Dashboard" },
    { id: "dev", label: "Dev Console" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Workspace Tabs */}
      <div className="border-b border-border bg-card/30">
        <div className="flex items-center px-4">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              className={`px-4 py-3 rounded-none border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === "browser" && <BrowserViewport currentTaskId={currentTaskId} />}
        {activeTab === "workflow" && <WorkflowBuilder />}
        {activeTab === "data" && <DataDashboard currentTaskId={currentTaskId} />}
        {activeTab === "dev" && (
          <div className="p-4 h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <h3 className="text-lg font-medium mb-2">Dev Console</h3>
              <p>Development tools and debugging interface coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
