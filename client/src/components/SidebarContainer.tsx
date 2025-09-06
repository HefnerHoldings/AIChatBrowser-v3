import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Settings, Maximize, Minimize, Layers } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';

interface SidebarContainerProps {
  children: React.ReactNode;
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
}

export function SidebarContainer({ children, leftSidebar, rightSidebar }: SidebarContainerProps) {
  const {
    config,
    updateMode,
    toggleLeftSidebar,
    toggleRightSidebar,
    updateSidebarWidth,
    updateGapSize,
    resetToDefaults,
  } = useSidebar();

  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const leftResizeRef = useRef<HTMLDivElement>(null);
  const rightResizeRef = useRef<HTMLDivElement>(null);

  // Håndter resize for venstre sidebar
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = Math.min(Math.max(200, e.clientX), 600);
        updateSidebarWidth('left', newWidth);
      }
      if (isResizingRight) {
        const newWidth = Math.min(Math.max(200, window.innerWidth - e.clientX), 600);
        updateSidebarWidth('right', newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizingLeft || isResizingRight) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight, updateSidebarWidth]);

  const containerStyle = config.mode === 'massive' ? {
    display: 'flex',
    gap: `${config.gapSize}px`,
    padding: `${config.gapSize}px`,
    height: '100%',
    backgroundColor: 'var(--background)',
  } : {
    position: 'relative' as const,
    height: '100%',
  };

  return (
    <>
      {/* Innstillinger kontroll */}
      <div className="fixed top-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="shadow-lg">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Sidemeny innstillinger</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <div className="px-2 py-2">
              <p className="text-sm font-medium mb-2">Visningsmodus</p>
              <DropdownMenuRadioGroup value={config.mode} onValueChange={(value) => updateMode(value as any)}>
                <DropdownMenuRadioItem value="massive">
                  <Maximize className="h-4 w-4 mr-2" />
                  Massiv (fast plass)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="overlay">
                  <Layers className="h-4 w-4 mr-2" />
                  Overlay (flytende)
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </div>

            <DropdownMenuSeparator />
            
            <div className="px-2 py-2">
              <p className="text-sm font-medium mb-2">Margin størrelse: {config.gapSize}px</p>
              <Slider
                value={[config.gapSize]}
                onValueChange={([value]) => updateGapSize(value)}
                min={0}
                max={20}
                step={2}
                className="w-full"
              />
            </div>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => toggleLeftSidebar()}>
              {config.leftSidebarOpen ? 'Skjul' : 'Vis'} venstre sidemeny
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleRightSidebar()}>
              {config.rightSidebarOpen ? 'Skjul' : 'Vis'} høyre sidemeny
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={resetToDefaults} className="text-destructive">
              Tilbakestill til standard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div style={containerStyle}>
        {/* Venstre sidebar */}
        <AnimatePresence>
          {config.leftSidebarOpen && leftSidebar && (
            <motion.div
              initial={{ x: -config.leftSidebarWidth, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -config.leftSidebarWidth, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={cn(
                "relative",
                config.mode === 'overlay' && "absolute left-0 top-0 h-full z-40"
              )}
              style={{
                width: config.leftSidebarWidth,
                ...(config.mode === 'overlay' && {
                  backdropFilter: 'blur(8px)',
                  backgroundColor: 'rgba(var(--background), 0.95)',
                })
              }}
            >
              <div className={cn(
                "h-full border-r",
                config.mode === 'overlay' && "shadow-xl"
              )}>
                {leftSidebar}
              </div>
              
              {/* Resize håndtak */}
              <div
                ref={leftResizeRef}
                onMouseDown={() => setIsResizingLeft(true)}
                className={cn(
                  "absolute right-0 top-0 w-1 h-full cursor-col-resize",
                  "hover:bg-primary/20 transition-colors",
                  isResizingLeft && "bg-primary/30"
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hovedinnhold */}
        <div className={cn(
          "flex-1 relative",
          config.mode === 'massive' && "min-w-0"
        )}>
          {children}
        </div>

        {/* Høyre sidebar */}
        <AnimatePresence>
          {config.rightSidebarOpen && rightSidebar && (
            <motion.div
              initial={{ x: config.rightSidebarWidth, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: config.rightSidebarWidth, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={cn(
                "relative",
                config.mode === 'overlay' && "absolute right-0 top-0 h-full z-40"
              )}
              style={{
                width: config.rightSidebarWidth,
                ...(config.mode === 'overlay' && {
                  backdropFilter: 'blur(8px)',
                  backgroundColor: 'rgba(var(--background), 0.95)',
                })
              }}
            >
              <div className={cn(
                "h-full border-l",
                config.mode === 'overlay' && "shadow-xl"
              )}>
                {rightSidebar}
              </div>
              
              {/* Resize håndtak */}
              <div
                ref={rightResizeRef}
                onMouseDown={() => setIsResizingRight(true)}
                className={cn(
                  "absolute left-0 top-0 w-1 h-full cursor-col-resize",
                  "hover:bg-primary/20 transition-colors",
                  isResizingRight && "bg-primary/30"
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}