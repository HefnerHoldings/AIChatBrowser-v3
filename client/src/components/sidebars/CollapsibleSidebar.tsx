import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CollapsibleSidebarProps {
  children: React.ReactNode;
  side?: 'left' | 'right';
  defaultCollapsed?: boolean;
  width?: string;
  collapsedWidth?: string;
  className?: string;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function CollapsibleSidebar({
  children,
  side = 'left',
  defaultCollapsed = false,
  width = 'w-80',
  collapsedWidth = 'w-12',
  className,
  onCollapsedChange
}: CollapsibleSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onCollapsedChange) {
      onCollapsedChange(newState);
    }
  };

  return (
    <div
      className={cn(
        'relative transition-all duration-300 flex-shrink-0',
        isCollapsed ? collapsedWidth : width,
        className
      )}
    >
      {/* Collapse Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'absolute top-4 z-10 h-6 w-6',
          side === 'left' ? 'right-2' : 'left-2'
        )}
        onClick={toggleCollapse}
      >
        {side === 'left' ? (
          isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />
        ) : (
          isCollapsed ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
        )}
      </Button>

      {/* Content */}
      <div
        className={cn(
          'h-full overflow-hidden transition-opacity duration-300',
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
      >
        {children}
      </div>

      {/* Collapsed State Icons */}
      {isCollapsed && (
        <div className="h-full flex flex-col items-center pt-16 gap-4">
          {/* You can add vertical icons here when collapsed */}
        </div>
      )}
    </div>
  );
}