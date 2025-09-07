import React from 'react';
import { SidebarType } from '@/lib/sidebar-registry';
import { LeftWorkflowSidebar } from './LeftWorkflowSidebar';
import { RightDeveloperSidebar } from './RightDeveloperSidebar';
import { LeadScrapingSidebar } from './LeadScrapingSidebar';
import { DataAnalyticsSidebar } from './DataAnalyticsSidebar';
import { BrowserToolsSidebar } from './BrowserToolsSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SidebarSwitcher } from './SidebarSwitcher';
import { 
  Search, 
  Code2, 
  Bot, 
  BarChart3, 
  Layers, 
  Globe, 
  Shield, 
  Package,
  Zap
} from 'lucide-react';

interface DynamicSidebarProps {
  side: 'left' | 'right';
  primary: SidebarType;
  secondary?: SidebarType[];
  mode: 'single' | 'split' | 'tabs' | 'accordion';
  onOpenWorkflowBuilder?: () => void;
  onCommand?: (command: string) => void;
  onAISuggestion?: (suggestion: string) => void;
  onExportData?: (format: string) => void;
  onRefreshData?: () => void;
  onCodeGenerate?: (type: string) => void;
}

export function DynamicSidebar({
  side,
  primary,
  secondary = [],
  mode,
  onOpenWorkflowBuilder,
  onCommand,
  onAISuggestion,
  onExportData,
  onRefreshData,
  onCodeGenerate
}: DynamicSidebarProps) {
  
  const renderSidebar = (type: SidebarType) => {
    switch (type) {
      case 'workflow':
        return (
          <LeftWorkflowSidebar
            onOpenWorkflowBuilder={onOpenWorkflowBuilder}
            onCommand={onCommand}
            onAISuggestion={onAISuggestion}
          />
        );
      case 'developer':
        return (
          <RightDeveloperSidebar
            onExportData={onExportData}
            onRefreshData={onRefreshData}
            onCodeGenerate={onCodeGenerate}
          />
        );
      case 'lead-scraping':
        return <LeadScrapingSidebar />;
      case 'data-analytics':
        return <DataAnalyticsSidebar />;
      case 'browser-tools':
        return <BrowserToolsSidebar />;
      case 'ai-assistant':
        // For now, reuse LeftWorkflowSidebar as it has AI chat
        return (
          <LeftWorkflowSidebar
            onOpenWorkflowBuilder={onOpenWorkflowBuilder}
            onCommand={onCommand}
            onAISuggestion={onAISuggestion}
          />
        );
      case 'security-privacy':
        // Placeholder - can create SecurityPrivacySidebar later
        return <BrowserToolsSidebar />;
      case 'integrations':
        // Placeholder - can create IntegrationsSidebar later
        return <DataAnalyticsSidebar />;
      case 'quick-actions':
        // Placeholder - can create QuickActionsSidebar later
        return <BrowserToolsSidebar />;
      default:
        return <div className="p-4">Custom sidebar kommer snart...</div>;
    }
  };

  const getSidebarIcon = (type: SidebarType) => {
    switch (type) {
      case 'lead-scraping': return <Search className="h-4 w-4" />;
      case 'developer': return <Code2 className="h-4 w-4" />;
      case 'ai-assistant': return <Bot className="h-4 w-4" />;
      case 'data-analytics': return <BarChart3 className="h-4 w-4" />;
      case 'workflow': return <Layers className="h-4 w-4" />;
      case 'browser-tools': return <Globe className="h-4 w-4" />;
      case 'security-privacy': return <Shield className="h-4 w-4" />;
      case 'integrations': return <Package className="h-4 w-4" />;
      case 'quick-actions': return <Zap className="h-4 w-4" />;
      default: return null;
    }
  };

  const getSidebarName = (type: SidebarType) => {
    switch (type) {
      case 'lead-scraping': return 'Lead Scraping';
      case 'developer': return 'Developer';
      case 'ai-assistant': return 'AI Assistant';
      case 'data-analytics': return 'Data Analytics';
      case 'workflow': return 'Workflow';
      case 'browser-tools': return 'Browser Tools';
      case 'security-privacy': return 'Security';
      case 'integrations': return 'Integrations';
      case 'quick-actions': return 'Quick Actions';
      default: return 'Custom';
    }
  };

  // Single sidebar mode
  if (mode === 'single' || secondary.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-2 border-b">
          <SidebarSwitcher side={side} currentType={primary} />
        </div>
        <div className="flex-1 overflow-hidden">
          {renderSidebar(primary)}
        </div>
      </div>
    );
  }

  // Split mode - show multiple sidebars side by side
  if (mode === 'split') {
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-2 border-b">
          <SidebarSwitcher side={side} currentType={primary} />
        </div>
        <ResizablePanelGroup direction="vertical" className="flex-1">
          <ResizablePanel defaultSize={50}>
            {renderSidebar(primary)}
          </ResizablePanel>
          {secondary.map((type, idx) => (
            <React.Fragment key={type}>
              <ResizableHandle />
              <ResizablePanel defaultSize={50 / (secondary.length)}>
                {renderSidebar(type)}
              </ResizablePanel>
            </React.Fragment>
          ))}
        </ResizablePanelGroup>
      </div>
    );
  }

  // Tabs mode - show sidebars as tabs
  if (mode === 'tabs') {
    const allSidebars = [primary, ...secondary];
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-2 border-b">
          <SidebarSwitcher side={side} currentType={primary} />
        </div>
        <Tabs defaultValue={primary} className="flex-1 flex flex-col">
          <TabsList className="mx-3 mt-3">
            {allSidebars.map(type => (
              <TabsTrigger key={type} value={type} className="flex items-center gap-1">
                {getSidebarIcon(type)}
                <span className="text-xs">{getSidebarName(type)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {allSidebars.map(type => (
            <TabsContent key={type} value={type} className="flex-1 overflow-hidden">
              {renderSidebar(type)}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  }

  // Accordion mode - show sidebars as collapsible sections
  if (mode === 'accordion') {
    const allSidebars = [primary, ...secondary];
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-2 border-b">
          <SidebarSwitcher side={side} currentType={primary} />
        </div>
        <Accordion type="single" defaultValue={primary} className="flex-1 overflow-auto">
          {allSidebars.map(type => (
            <AccordionItem key={type} value={type}>
              <AccordionTrigger className="px-3">
                <div className="flex items-center gap-2">
                  {getSidebarIcon(type)}
                  <span>{getSidebarName(type)}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0">
                <div className="h-96">
                  {renderSidebar(type)}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  }

  return null;
}