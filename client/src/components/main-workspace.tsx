import { Button } from "@/components/ui/button";
import BrowserViewport from "./browser-viewport";
import WorkflowBuilder from "./workflow-builder";
import DataDashboard from "./data-dashboard";
import { SessionReplayPanel } from "./session-replay-panel";
import { DevBridgePanel } from "./devbridge-panel";
import { WorkOrdersPanel } from "./work-orders-panel";
import { PrivacyLedgerPanel } from "./privacy-ledger-panel";
import { AdrPanel } from "./adr-panel";
import { MultiAgentOrchestrator } from "./multi-agent-orchestrator";
import { QASuitePro } from "./qa-suite-pro";
import { SelectorStudioV2 } from "./selector-studio-v2";
import { WatchedWorkflows } from "./watched-workflows";
import { LeadDataVault } from "./lead-data-vault";
import { Marketplace } from "./marketplace";
import { PolicyGuard } from "./policy-guard";
import { CollaborativeMode } from "./collaborative-mode";
import { UserAuthentication } from "./user-authentication";
import { CommunityHub } from "./community-hub";
import { PluginDevelopment } from "./plugin-development";

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
    { id: "orchestrator", label: "Multi-Agent" },
    { id: "qa-suite", label: "QA Suite Pro" },
    { id: "selector", label: "Selector Studio" },
    { id: "watched", label: "Watched Workflows" },
    { id: "vault", label: "Lead Vault" },
    { id: "marketplace", label: "Marketplace" },
    { id: "policy", label: "Policy Guard" },
    { id: "collab", label: "Collaborative" },
    { id: "account", label: "Account" },
    { id: "community", label: "Community" },
    { id: "plugins", label: "Plugin Dev" },
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
        {activeTab === "orchestrator" && <MultiAgentOrchestrator workOrderId="wo-1" />}
        {activeTab === "qa-suite" && <QASuitePro previewUrl="https://example.com" />}
        {activeTab === "selector" && <SelectorStudioV2 domain="example.com" />}
        {activeTab === "watched" && <WatchedWorkflows />}
        {activeTab === "vault" && <LeadDataVault />}
        {activeTab === "marketplace" && <Marketplace />}
        {activeTab === "policy" && <PolicyGuard />}
        {activeTab === "collab" && <CollaborativeMode sessionId="session-1" />}
        {activeTab === "account" && <UserAuthentication />}
        {activeTab === "community" && <CommunityHub />}
        {activeTab === "plugins" && <PluginDevelopment />}
      </div>
    </div>
  );
}
