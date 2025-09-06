// Type definitions for Electron API - MadEasy V3.00
interface ElectronAPI {
  // Browser control
  navigate: (url: string) => Promise<{ success: boolean; url?: string; title?: string; screenshot?: string; error?: string }>;
  goBack: () => Promise<{ success: boolean; url?: string; error?: string }>;
  goForward: () => Promise<{ success: boolean; url?: string; error?: string }>;
  refresh: () => Promise<{ success: boolean; url?: string; error?: string }>;
  screenshot: () => Promise<{ success: boolean; screenshot?: string; error?: string }>;
  back: () => Promise<void>;
  forward: () => Promise<void>;
  reload: () => Promise<void>;
  stop: () => Promise<void>;
  
  // CORS-free fetching
  fetchWithoutCORS: (url: string, options?: any) => Promise<any>;
  executeJS: (code: string) => Promise<any>;
  
  // Automation
  extractData: (selector: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
  fillForm: (formData: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
  click: (selector: string) => Promise<{ success: boolean; url?: string; error?: string }>;
  waitForSelector: (selector: string, timeout?: number) => Promise<{ success: boolean; error?: string }>;
  executeScript: (script: string) => Promise<{ success: boolean; result?: any; error?: string }>;
  
  // Workflow
  executeWorkflow: (workflow: any) => Promise<{ success: boolean; results?: any[]; error?: string }>;
  
  // Events
  onNavigated: (callback: (data: any) => void) => void;
  onDataExtracted: (callback: (data: any) => void) => void;
  onMenuCommand: (callback: (event: any, command: string) => void) => void;
  
  // Vibecoding Platform API
  vibeProfiler: {
    save: (profile: any) => Promise<void>;
    load: () => Promise<any>;
    getTemplates: () => Promise<any[]>;
  };
  
  // Multi-Agent communication
  agentMessage: {
    send: (agentId: string, message: any) => Promise<void>;
    onMessage: (callback: (event: any, data: any) => void) => void;
    getAgentStatus: (agentId: string) => Promise<any>;
  };
  
  // Marketplace API
  marketplace: {
    searchPlaybooks: (query: string) => Promise<any[]>;
    installPlaybook: (id: string) => Promise<void>;
    publishPlaybook: (playbook: any) => Promise<void>;
  };
  
  // System info
  platform: string;
  isElectron: boolean;
  version: string;
}

interface Window {
  electronAPI?: ElectronAPI;
}