import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type SidebarMode = 'massive' | 'overlay';
export type SidebarPosition = 'left' | 'right' | 'stacked';
export type ToolPlacement = {
  toolId: string;
  position: SidebarPosition;
  order: number;
};

interface SidebarConfig {
  mode: SidebarMode;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  toolPlacements: ToolPlacement[];
  showAIChatOverlay: boolean;
  gapSize: number;
}

interface SidebarContextType {
  config: SidebarConfig;
  updateMode: (mode: SidebarMode) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  updateSidebarWidth: (side: 'left' | 'right', width: number) => void;
  moveToolToPosition: (toolId: string, position: SidebarPosition, order: number) => void;
  toggleAIChatOverlay: () => void;
  updateGapSize: (size: number) => void;
  resetToDefaults: () => void;
}

const defaultConfig: SidebarConfig = {
  mode: 'massive',
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  leftSidebarWidth: 320,
  rightSidebarWidth: 320,
  toolPlacements: [],
  showAIChatOverlay: false,
  gapSize: 8,
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SidebarConfig>(() => {
    const saved = localStorage.getItem('sidebarConfig');
    return saved ? JSON.parse(saved) : defaultConfig;
  });

  // Lagre konfigurasjon til localStorage ved endringer
  useEffect(() => {
    localStorage.setItem('sidebarConfig', JSON.stringify(config));
  }, [config]);

  const updateMode = (mode: SidebarMode) => {
    setConfig(prev => ({ ...prev, mode }));
  };

  const toggleLeftSidebar = () => {
    setConfig(prev => ({ ...prev, leftSidebarOpen: !prev.leftSidebarOpen }));
  };

  const toggleRightSidebar = () => {
    setConfig(prev => ({ ...prev, rightSidebarOpen: !prev.rightSidebarOpen }));
  };

  const updateSidebarWidth = (side: 'left' | 'right', width: number) => {
    const key = side === 'left' ? 'leftSidebarWidth' : 'rightSidebarWidth';
    setConfig(prev => ({ ...prev, [key]: width }));
  };

  const moveToolToPosition = (toolId: string, position: SidebarPosition, order: number) => {
    setConfig(prev => {
      const newPlacements = prev.toolPlacements.filter(p => p.toolId !== toolId);
      newPlacements.push({ toolId, position, order });
      return { ...prev, toolPlacements: newPlacements };
    });
  };

  const toggleAIChatOverlay = () => {
    setConfig(prev => ({ ...prev, showAIChatOverlay: !prev.showAIChatOverlay }));
  };

  const updateGapSize = (size: number) => {
    setConfig(prev => ({ ...prev, gapSize: size }));
  };

  const resetToDefaults = () => {
    setConfig(defaultConfig);
    localStorage.removeItem('sidebarConfig');
  };

  return (
    <SidebarContext.Provider
      value={{
        config,
        updateMode,
        toggleLeftSidebar,
        toggleRightSidebar,
        updateSidebarWidth,
        moveToolToPosition,
        toggleAIChatOverlay,
        updateGapSize,
        resetToDefaults,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar må brukes innenfor SidebarProvider');
  }
  return context;
};