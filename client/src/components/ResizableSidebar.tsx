import { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResizableSidebarProps {
  side: 'left' | 'right';
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function ResizableSidebar({
  side,
  defaultWidth = 320,
  minWidth = 200,
  maxWidth = 600,
  collapsed,
  onCollapsedChange,
  children,
  className
}: ResizableSidebarProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isAtMinimum, setIsAtMinimum] = useState(false);
  const [showMinWarning, setShowMinWarning] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = side === 'left' 
        ? e.clientX 
        : window.innerWidth - e.clientX;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
        setIsAtMinimum(newWidth <= minWidth + 20);
        setShowMinWarning(false);
      } else if (newWidth < minWidth - 10) {
        // Show warning before collapse
        setShowMinWarning(true);
        setIsAtMinimum(true);
        // Add slight resistance before collapse
        setTimeout(() => {
          if (newWidth < minWidth - 30) {
            onCollapsedChange(true);
            setIsResizing(false);
            setShowMinWarning(false);
            setIsAtMinimum(false);
          }
        }, 100);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setShowMinWarning(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      // Persist width to localStorage
      localStorage.setItem(`sidebar-${side}-width`, width.toString());
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, side, minWidth, maxWidth, onCollapsedChange]);

  if (collapsed) {
    return null;
  }

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "absolute top-0 h-full bg-card flex flex-col z-40 transition-all duration-150",
        side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
        isAtMinimum && 'border-2 border-orange-500/50',
        showMinWarning && 'animate-pulse border-red-500/70 bg-red-50/5',
        className
      )}
      style={{ width: `${width}px` }}
    >
      {/* Minimum width warning indicator */}
      {showMinWarning && (
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 px-2 py-1 bg-red-500 text-white text-xs rounded-md whitespace-nowrap z-50",
          side === 'left' ? 'left-full ml-2' : 'right-full mr-2'
        )}>
          Minimum bredde nådd - slipp for å skjule
        </div>
      )}
      
      {/* Minimum width indicator bar */}
      {isAtMinimum && !showMinWarning && (
        <div className={cn(
          "absolute top-0 h-full w-1 bg-gradient-to-b from-orange-500/0 via-orange-500/50 to-orange-500/0",
          side === 'left' ? 'right-0' : 'left-0'
        )} />
      )}
      
      {children}
      
      {/* Resize Handle */}
      <div
        ref={resizeHandleRef}
        className={cn(
          "absolute top-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors",
          side === 'left' ? '-right-0.5' : '-left-0.5',
          isAtMinimum && 'bg-orange-500/20 hover:bg-orange-500/30',
          showMinWarning && 'bg-red-500/20 hover:bg-red-500/30'
        )}
        onMouseDown={() => setIsResizing(true)}
        title={isAtMinimum ? 'Minimum bredde nådd' : 'Dra for å endre størrelse'}
      >
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-8 flex items-center justify-center">
          <div className={cn(
            "w-0.5 h-full rounded transition-colors",
            isAtMinimum ? 'bg-orange-500' : 'bg-border',
            showMinWarning && 'bg-red-500 animate-pulse'
          )} />
        </div>
      </div>
    </div>
  );
}