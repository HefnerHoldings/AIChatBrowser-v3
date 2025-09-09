import { ComponentType } from 'react';

export type SidebarType = 
  | 'lead-scraping'
  | 'developer'
  | 'ai-assistant'
  | 'ai-chat'
  | 'outreach'
  | 'data-analytics'
  | 'workflow'
  | 'browser-tools'
  | 'security-privacy'
  | 'integrations'
  | 'quick-actions'
  | 'custom';

export interface SidebarDefinition {
  id: SidebarType;
  name: string;
  description: string;
  iconName: string; // Use string instead of React component
  component: ComponentType<any>;
  category: 'data' | 'development' | 'automation' | 'browser' | 'custom';
  features: string[];
  shortcuts?: string[];
}

export interface SidebarLayout {
  side: 'left' | 'right';
  primary: SidebarType;
  secondary?: SidebarType[];
  mode: 'single' | 'split' | 'tabs' | 'accordion';
  collapsed?: boolean;
  width?: number; // Width in pixels
}

export interface SidebarPreset {
  id: string;
  name: string;
  iconName: string; // Use string instead of React component
  description: string;
  left: SidebarLayout;
  right: SidebarLayout;
}

class SidebarRegistryClass {
  private sidebars: Map<SidebarType, SidebarDefinition> = new Map();
  private presets: Map<string, SidebarPreset> = new Map();

  register(sidebar: SidebarDefinition) {
    this.sidebars.set(sidebar.id, sidebar);
  }

  get(id: SidebarType): SidebarDefinition | undefined {
    return this.sidebars.get(id);
  }

  getAll(): SidebarDefinition[] {
    return Array.from(this.sidebars.values());
  }

  getByCategory(category: string): SidebarDefinition[] {
    return this.getAll().filter(s => s.category === category);
  }

  registerPreset(preset: SidebarPreset) {
    this.presets.set(preset.id, preset);
  }

  getPreset(id: string): SidebarPreset | undefined {
    return this.presets.get(id);
  }

  getAllPresets(): SidebarPreset[] {
    return Array.from(this.presets.values());
  }

  // Default presets
  initializePresets() {
    this.registerPreset({
      id: 'scraping-mode',
      name: 'Scraping Mode',
      iconName: 'Search',
      description: 'Optimert for web scraping og lead generation',
      left: {
        side: 'left',
        primary: 'lead-scraping',
        mode: 'single'
      },
      right: {
        side: 'right',
        primary: 'data-analytics',
        mode: 'single'
      }
    });

    this.registerPreset({
      id: 'dev-mode',
      name: 'Developer Mode',
      iconName: 'Code2',
      description: 'Full utviklingsmiljø med AI-assistanse',
      left: {
        side: 'left',
        primary: 'developer',
        mode: 'single'
      },
      right: {
        side: 'right',
        primary: 'ai-assistant',
        mode: 'single'
      }
    });

    this.registerPreset({
      id: 'automation',
      name: 'Automation',
      iconName: 'Layers',
      description: 'Workflow automatisering og browser kontroll',
      left: {
        side: 'left',
        primary: 'workflow',
        mode: 'single'
      },
      right: {
        side: 'right',
        primary: 'browser-tools',
        mode: 'single'
      }
    });

    this.registerPreset({
      id: 'research',
      name: 'Research Mode',
      iconName: 'Bot',
      description: 'AI-drevet research og data analyse',
      left: {
        side: 'left',
        primary: 'ai-assistant',
        mode: 'single'
      },
      right: {
        side: 'right',
        primary: 'lead-scraping',
        secondary: ['data-analytics'],
        mode: 'tabs'
      }
    });
  }
}

export const SidebarRegistry = new SidebarRegistryClass();

// Initialize presets on creation
SidebarRegistry.initializePresets();