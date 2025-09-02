import { Button } from "@/components/ui/button";
import BrowserViewport from "./browser-viewport";
import WorkflowBuilder from "./workflow-builder";
import DataDashboard from "./data-dashboard";
import { SessionReplayPanel } from "./session-replay-panel";
import { DevBridgePanel } from "./devbridge-panel";
import { WorkOrdersPanel } from "./work-orders-panel";
import { PrivacyLedgerPanel } from "./privacy-ledger-panel";
import { AdrPanel } from "./adr-panel";

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
    { id: "session-replay", label: "Session Replay" },
    { id: "devbridge", label: "DevBridge" },
    { id: "work-orders", label: "Work Orders" },
    { id: "privacy", label: "Privacy" },
    { id: "adr", label: "ADR & Risk" },
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
      <div className="flex-1 overflow-auto">
        {activeTab === "browser" && <BrowserViewport currentTaskId={currentTaskId} />}
        {activeTab === "workflow" && <WorkflowBuilder />}
        {activeTab === "data" && <DataDashboard currentTaskId={currentTaskId} />}
        {activeTab === "session-replay" && <SessionReplayPanel projectId="project-1" />}
        {activeTab === "devbridge" && <DevBridgePanel />}
        {activeTab === "work-orders" && <WorkOrdersPanel projectId="project-1" />}
        {activeTab === "privacy" && <PrivacyLedgerPanel sessionId="session-1" />}
        {activeTab === "adr" && <AdrPanel projectId="project-1" />}
      </div>
    </div>
  );
}
