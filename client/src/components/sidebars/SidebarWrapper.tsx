import React, { useRef, useState, useEffect } from 'react';
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
import { SidebarRegistry, type SidebarType } from '@/lib/sidebar-registry';
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
  GitBranch,
  Shield,
  Settings,
  Zap,
  Palette,
  Globe,
  Terminal,
  Package,
  Plug2,
  Bot,
  GripVertical
} from 'lucide-react';

interface SidebarWrapperProps {
  side: 'left' | 'right';
  children: React.ReactNode;
}

export function SidebarWrapper({ side, children }: SidebarWrapperProps) {
  const { config, toggleSidebar, toggleMode, switchSidebar, resizeSidebar } = useSidebarManager();
  const isCollapsed = config[side].collapsed;
  const isFloating = config.mode === 'floating';
  const currentType = config[side].primary;
  const currentWidth = config[side].width || 320;
  
  // Determine width mode for responsive layout
  const getWidthMode = (width: number) => {
    if (width < 320) return 'compact';
    if (width < 450) return 'normal';
    return 'wide';
  };
  
  const widthMode = getWidthMode(currentWidth);
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(currentWidth);
  
  // Get available sidebar types from registry
  const availableSidebars = SidebarRegistry.getAll().map(s => s.id);
  
  // Icon mapping for sidebar types
  const sidebarIcons: Record<string, React.ReactNode> = {
    'lead-scraping': <FileSearch className="h-4 w-4" />,
    'developer': <Terminal className="h-4 w-4" />,
    'ai-assistant': <Bot className="h-4 w-4" />,
    'ai-chat': <MessageSquare className="h-4 w-4" />,
    'outreach': <Users className="h-4 w-4" />,
    'data-analytics': <LineChart className="h-4 w-4" />,
    'workflow': <Workflow className="h-4 w-4" />,
    'browser-tools': <Globe className="h-4 w-4" />,
    'security-privacy': <Shield className="h-4 w-4" />,
    'integrations': <Plug2 className="h-4 w-4" />,
    'quick-actions': <Zap className="h-4 w-4" />,
    'custom': <Palette className="h-4 w-4" />
  };
  
  // Sidebar display names
  const sidebarNames: Record<string, string> = {
    'lead-scraping': 'Lead Scraping',
    'developer': 'Developer Tools',
    'ai-assistant': 'AI Assistant',
    'ai-chat': 'AI Chat',
    'outreach': 'Outreach Engine',
    'data-analytics': 'Data Analytics',
    'workflow': 'Workflow Builder',
    'browser-tools': 'Browser Tools',
    'security-privacy': 'Security & Privacy',
    'integrations': 'Integrations',
    'quick-actions': 'Quick Actions',
    'custom': 'Custom'
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(currentWidth);
  };

  // Handle resize mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const diff = side === 'left' 
        ? e.clientX - startX 
        : startX - e.clientX;
      
      const newWidth = startWidth + diff;
      resizeSidebar(side, newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Prevent text selection during resize
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing, startX, startWidth, side, resizeSidebar]);

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "relative h-full transition-all duration-300",
        isFloating && !isCollapsed && "absolute top-0 z-50 shadow-2xl",
        side === 'left' ? 'left-0' : 'right-0',
        isCollapsed ? 'w-12' : ''
      )}
      style={{
        width: isCollapsed ? 48 : currentWidth,
        backgroundColor: isFloating ? 'var(--background)' : undefined
      }}
    >
      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          className={cn(
            "absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 transition-colors group",
            side === 'left' ? '-right-0.5' : '-left-0.5'
          )}
          onMouseDown={handleResizeStart}
        >
          <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-6 w-3 text-muted-foreground/50" />
          </div>
        </div>
      )}

      {/* Sidebar Content */}

      <div className={cn(
        "h-full flex flex-col",
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
          // Expanded State with header controls
          <>
            {/* Control Header Bar */}
            <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30 min-h-[48px]">
              {/* Left side - Sidebar type and name */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {sidebarIcons[currentType] || <Layers className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm font-medium truncate">
                  {sidebarNames[currentType] || currentType}
                </span>
              </div>
              
              {/* Right side - Control buttons */}
              <div className="flex items-center gap-1">
                {/* Sidebar Type Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Velg sidebar type"
                    >
                      <Layers className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={side === 'left' ? "start" : "end"}>
                    <DropdownMenuLabel>Velg Sidebar Type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availableSidebars.map((sidebarType: SidebarType) => (
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
                
                {/* Pin/Float Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMode}
                  className="h-7 w-7"
                  title={isFloating ? 'Pin sidebar' : 'Float sidebar'}
                >
                  {isFloating ? (
                    <PinOff className="h-3.5 w-3.5" />
                  ) : (
                    <Pin className="h-3.5 w-3.5" />
                  )}
                </Button>
                
                {/* Collapse Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleSidebar(side)}
                  className="h-7 w-7"
                  title="Kollaps sidebar"
                >
                  {side === 'left' ? (
                    <ChevronLeft className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Width Display - Only when resizing */}
            {isResizing && (
              <div className="absolute top-12 right-2 z-50 px-2 py-1 text-xs bg-popover border rounded shadow-md">
                {currentWidth}px
              </div>
            )}
            
            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden sidebar-responsive" data-width={widthMode}>
              {children}
            </div>
          </>
        )}
      </div>
    </div>
  );
}