// Type definitions for Electron API
interface ElectronAPI {
  // Browser control
  navigate: (url: string) => Promise<{ success: boolean; url?: string; title?: string; screenshot?: string; error?: string }>;
  goBack: () => Promise<{ success: boolean; url?: string; error?: string }>;
  goForward: () => Promise<{ success: boolean; url?: string; error?: string }>;
  refresh: () => Promise<{ success: boolean; url?: string; error?: string }>;
  screenshot: () => Promise<{ success: boolean; screenshot?: string; error?: string }>;
  
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
}

interface Window {
  electronAPI?: ElectronAPI;
}