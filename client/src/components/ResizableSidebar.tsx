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
      } else if (newWidth < minWidth) {
        onCollapsedChange(true);
        setIsResizing(false);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
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
        "absolute top-0 h-full bg-card flex flex-col z-40",
        side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
        className
      )}
      style={{ width: `${width}px` }}
    >
      {children}
      
      {/* Resize Handle */}
      <div
        ref={resizeHandleRef}
        className={cn(
          "absolute top-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors",
          side === 'left' ? '-right-0.5' : '-left-0.5'
        )}
        onMouseDown={() => setIsResizing(true)}
      >
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-8 flex items-center justify-center">
          <div className="w-0.5 h-full bg-border rounded" />
        </div>
      </div>
    </div>
  );
}