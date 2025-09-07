import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebarManager } from '@/contexts/SidebarManagerContext';
import { cn } from '@/lib/utils';
import { getSidebarRegistry } from '@/lib/sidebar-registry';
import { 
  ChevronLeft, 
  ChevronRight,
  Pin,
  PinOff,
  Maximize2,
  Minimize2,
  Layers,
  MessageSquare,
  Workflow,
  Database,
  Code2,
  FileSearch,
  Users,
  LineChart,
  GitBranch
} from 'lucide-react';

interface SidebarWrapperProps {
  side: 'left' | 'right';
  children: React.ReactNode;
}

export function SidebarWrapper({ side, children }: SidebarWrapperProps) {
  const { config, toggleSidebar, toggleMode, switchSidebar } = useSidebarManager();
  const isCollapsed = config[side].collapsed;
  const isFloating = config.mode === 'floating';
  const currentType = config[side].primary;
  
  // Get available sidebar types from registry
  const registry = getSidebarRegistry();
  const availableSidebars = Array.from(registry.keys());
  
  // Icon mapping for sidebar types
  const sidebarIcons: Record<string, React.ReactNode> = {
    'ai-chat': <MessageSquare className="h-4 w-4" />,
    'workflow-builder': <Workflow className="h-4 w-4" />,
    'data-analytics': <Database className="h-4 w-4" />,
    'developer-tools': <Code2 className="h-4 w-4" />,
    'content-extractor': <FileSearch className="h-4 w-4" />,
    'team-collaboration': <Users className="h-4 w-4" />,
    'performance-monitor': <LineChart className="h-4 w-4" />,
    'version-control': <GitBranch className="h-4 w-4" />
  };
  
  // Sidebar display names
  const sidebarNames: Record<string, string> = {
    'ai-chat': 'AI Chat',
    'workflow-builder': 'Workflow Builder',
    'data-analytics': 'Data Analytics',
    'developer-tools': 'Developer Tools',
    'content-extractor': 'Content Extractor',
    'team-collaboration': 'Team Collaboration',
    'performance-monitor': 'Performance Monitor',
    'version-control': 'Version Control'
  };

  return (
    <div
      className={cn(
        "relative h-full transition-all duration-300",
        isFloating && !isCollapsed && "absolute top-0 z-50 shadow-2xl",
        side === 'left' ? 'left-0' : 'right-0',
        isCollapsed ? 'w-12' : 'w-80'
      )}
      style={{
        backgroundColor: isFloating ? 'var(--background)' : undefined
      }}
    >
      {/* Collapse/Expand Button - Always Visible */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => toggleSidebar(side)}
        className={cn(
          "absolute top-2 z-50 h-8 w-8 rounded-full bg-background/95 backdrop-blur border shadow-md",
          side === 'left' 
            ? (isCollapsed ? 'left-14' : 'right-2')
            : (isCollapsed ? 'right-14' : 'left-2')
        )}
        title={isCollapsed ? 'Ekspander sidebar' : 'Kollaps sidebar'}
      >
        {side === 'left' ? (
          isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
        ) : (
          isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {/* Control Buttons - Only when expanded */}
      {!isCollapsed && (
        <>
          {/* Sidebar Type Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute top-2 z-50 h-8 w-8 rounded-full bg-background/95 backdrop-blur border shadow-md",
                  side === 'left' ? 'right-[88px]' : 'left-[88px]'
                )}
                title="Velg sidebar type"
              >
                <Layers className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={side === 'left' ? 'start' : 'end'}>
              <DropdownMenuLabel>Velg Sidebar Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableSidebars.map((sidebarType) => (
                <DropdownMenuItem
                  key={sidebarType}
                  onClick={() => switchSidebar(side, sidebarType)}
                  className={cn(
                    "flex items-center gap-2",
                    currentType === sidebarType && "bg-accent"
                  )}
                >
                  {sidebarIcons[sidebarType] || <Layers className="h-4 w-4" />}
                  <span>{sidebarNames[sidebarType] || sidebarType}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Mode Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMode}
            className={cn(
              "absolute top-2 z-50 h-8 w-8 rounded-full bg-background/95 backdrop-blur border shadow-md",
              side === 'left' ? 'right-12' : 'left-12'
            )}
            title={isFloating ? 'Bytt til massive modus' : 'Bytt til floating modus'}
          >
            {isFloating ? (
              <PinOff className="h-4 w-4" />
            ) : (
              <Pin className="h-4 w-4" />
            )}
          </Button>
        </>
      )}

      {/* Sidebar Content */}
      <div className={cn(
        "h-full",
        isCollapsed && "overflow-hidden"
      )}>
        {isCollapsed ? (
          // Collapsed State - Show icon bar
          <div className="flex flex-col items-center py-4 gap-2">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center" title={sidebarNames[currentType] || currentType}>
              {sidebarIcons[currentType] || <span className="text-xs font-bold">{side === 'left' ? 'L' : 'R'}</span>}
            </div>
            <div className="h-px w-6 bg-border" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleSidebar(side)}
              className="h-8 w-8"
              title="Ekspander sidebar"
            >
              {side === 'left' ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          // Expanded State - Show full content
          children
        )}
      </div>
    </div>
  );
}