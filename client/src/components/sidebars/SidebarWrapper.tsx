import React from 'react';
import { Button } from '@/components/ui/button';
import { useSidebarManager } from '@/contexts/SidebarManagerContext';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight,
  Pin,
  PinOff,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface SidebarWrapperProps {
  side: 'left' | 'right';
  children: React.ReactNode;
}

export function SidebarWrapper({ side, children }: SidebarWrapperProps) {
  const { config, toggleSidebar, toggleMode } = useSidebarManager();
  const isCollapsed = config[side].collapsed;
  const isFloating = config.mode === 'floating';

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

      {/* Mode Toggle Button - Only when expanded */}
      {!isCollapsed && (
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
      )}

      {/* Sidebar Content */}
      <div className={cn(
        "h-full",
        isCollapsed && "overflow-hidden"
      )}>
        {isCollapsed ? (
          // Collapsed State - Show icon bar
          <div className="flex flex-col items-center py-4 gap-2">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold">{side === 'left' ? 'L' : 'R'}</span>
            </div>
            <div className="h-px w-6 bg-border" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleSidebar(side)}
              className="h-8 w-8"
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