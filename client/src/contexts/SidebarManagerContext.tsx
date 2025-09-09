import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SidebarType, SidebarLayout, SidebarPreset } from '@/lib/sidebar-registry';

interface CustomSidebar {
  id: string;
  name: string;
  icon: ReactNode;
  widgets: SidebarWidget[];
  layout: 'vertical' | 'grid' | 'tabs';
}

interface SidebarWidget {
  id: string;
  type: 'chat' | 'list' | 'form' | 'chart' | 'tree' | 'custom';
  title: string;
  component: React.ComponentType<any>;
  settings?: Record<string, any>;
}

interface SidebarConfig {
  mode: 'massive' | 'floating';
  left: SidebarLayout;
  right: SidebarLayout;
  floating?: {
    id: string;
    type: SidebarType;
    position: { x: number; y: number };
  }[];
  customSidebars?: CustomSidebar[];
}

interface SidebarManagerContextType {
  config: SidebarConfig;
  switchSidebar: (side: 'left' | 'right', type: SidebarType) => void;
  toggleSidebar: (side: 'left' | 'right') => void;
  toggleMode: () => void;
  mergeSidebars: (side: 'left' | 'right', types: SidebarType[], mode: 'split' | 'tabs' | 'accordion') => void;
  applyPreset: (preset: SidebarPreset) => void;
  createCustomSidebar: (sidebar: CustomSidebar) => void;
  floatSidebar: (type: SidebarType, position: { x: number; y: number }) => void;
  saveSidebarLayout: (name: string) => void;
  loadSidebarLayout: (name: string) => void;
  resizeSidebar: (side: 'left' | 'right', width: number) => void;
}

const SidebarManagerContext = createContext<SidebarManagerContextType | undefined>(undefined);

export function SidebarManagerProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SidebarConfig>({
    mode: 'massive',
    left: {
      side: 'left',
      primary: 'ai-chat',
      mode: 'single',
      collapsed: false,
      width: 320 // Default width
    },
    right: {
      side: 'right',
      primary: 'data-analytics',
      mode: 'single',
      collapsed: false,
      width: 320 // Default width
    },
    floating: [],
    customSidebars: []
  });

  const switchSidebar = useCallback((side: 'left' | 'right', type: SidebarType) => {
    setConfig(prev => ({
      ...prev,
      [side]: {
        ...prev[side],
        primary: type,
        secondary: undefined,
        mode: 'single'
      }
    }));
  }, []);

  const toggleSidebar = useCallback((side: 'left' | 'right') => {
    setConfig(prev => ({
      ...prev,
      [side]: {
        ...prev[side],
        collapsed: !prev[side].collapsed
      }
    }));
  }, []);

  const toggleMode = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      mode: prev.mode === 'massive' ? 'floating' : 'massive'
    }));
  }, []);

  const mergeSidebars = useCallback((
    side: 'left' | 'right', 
    types: SidebarType[], 
    mode: 'split' | 'tabs' | 'accordion'
  ) => {
    if (types.length === 0) return;
    
    setConfig(prev => ({
      ...prev,
      [side]: {
        ...prev[side],
        primary: types[0],
        secondary: types.slice(1),
        mode
      }
    }));
  }, []);

  const applyPreset = useCallback((preset: SidebarPreset) => {
    setConfig(prev => ({
      ...prev,
      left: preset.left,
      right: preset.right
    }));
  }, []);

  const createCustomSidebar = useCallback((sidebar: CustomSidebar) => {
    setConfig(prev => ({
      ...prev,
      customSidebars: [...(prev.customSidebars || []), sidebar]
    }));
  }, []);

  const floatSidebar = useCallback((type: SidebarType, position: { x: number; y: number }) => {
    const id = `floating-${Date.now()}`;
    setConfig(prev => ({
      ...prev,
      floating: [...(prev.floating || []), { id, type, position }]
    }));
  }, []);

  const saveSidebarLayout = useCallback((name: string) => {
    const layouts = JSON.parse(localStorage.getItem('sidebarLayouts') || '{}');
    layouts[name] = config;
    localStorage.setItem('sidebarLayouts', JSON.stringify(layouts));
  }, [config]);

  const loadSidebarLayout = useCallback((name: string) => {
    const layouts = JSON.parse(localStorage.getItem('sidebarLayouts') || '{}');
    if (layouts[name]) {
      setConfig(layouts[name]);
    }
  }, []);

  const resizeSidebar = useCallback((side: 'left' | 'right', width: number) => {
    // Ensure minimum width
    const MIN_WIDTH = 240;
    const MAX_WIDTH = 600;
    const constrainedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));
    
    setConfig(prev => ({
      ...prev,
      [side]: {
        ...prev[side],
        width: constrainedWidth
      }
    }));
    
    // Save to localStorage for persistence
    const widths = JSON.parse(localStorage.getItem('sidebarWidths') || '{}');
    widths[side] = constrainedWidth;
    localStorage.setItem('sidebarWidths', JSON.stringify(widths));
  }, []);

  return (
    <SidebarManagerContext.Provider 
      value={{
        config,
        switchSidebar,
        toggleSidebar,
        toggleMode,
        mergeSidebars,
        applyPreset,
        createCustomSidebar,
        floatSidebar,
        saveSidebarLayout,
        loadSidebarLayout,
        resizeSidebar
      }}
    >
      {children}
    </SidebarManagerContext.Provider>
  );
}

export function useSidebarManager() {
  const context = useContext(SidebarManagerContext);
  if (!context) {
    throw new Error('useSidebarManager must be used within SidebarManagerProvider');
  }
  return context;
}