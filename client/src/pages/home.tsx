import { useState } from "react";
import TopNavigation from "@/components/top-navigation";
import LeftSidebar from "@/components/left-sidebar";
import MainWorkspace from "@/components/main-workspace";
import RightPanel from "@/components/right-panel";
import StatusBar from "@/components/status-bar";

export default function Home() {
  const [activeTab, setActiveTab] = useState("browser");
  const [currentProjectId, setCurrentProjectId] = useState("project-1");
  const [currentTaskId, setCurrentTaskId] = useState("task-1");
  const [autonomyLevel, setAutonomyLevel] = useState(2);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <TopNavigation 
        currentProjectId={currentProjectId}
        setCurrentProjectId={setCurrentProjectId}
        autonomyLevel={autonomyLevel}
        setAutonomyLevel={setAutonomyLevel}
      />
      
      <div className="flex h-[calc(100vh-64px)]">
        <LeftSidebar 
          currentProjectId={currentProjectId}
          currentTaskId={currentTaskId}
          setCurrentTaskId={setCurrentTaskId}
        />
        
        <MainWorkspace 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentTaskId={currentTaskId}
        />
        
        <RightPanel 
          currentTaskId={currentTaskId}
        />
      </div>
      
      <StatusBar 
        currentTaskId={currentTaskId}
      />
    </div>
  );
}
