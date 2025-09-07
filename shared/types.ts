// Chat-relaterte typer
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  context?: ChatContext;
}

export interface ChatContext {
  url?: string;
  pageTitle?: string;
  selectedText?: string;
  pageContent?: string;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Browser-relaterte typer  
export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isActive: boolean;
  isLoading: boolean;
  screenshot?: string;
}

export interface BrowserContext {
  url: string;
  title: string;
  selectedText?: string;
  viewport: {
    width: number;
    height: number;
  };
}

// Workflow-relaterte typer
export interface WorkflowStep {
  action: string;
  target: string;
  value?: string;
  description?: string;
}

export interface WorkflowSuggestion {
  name: string;
  description: string;
  steps: WorkflowStep[];
}

// AI-analyse typer
export interface PageAnalysis {
  summary: string;
  keyPoints: string[];
  contacts: ContactInfo[];
  actionableItems: string[];
}

export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  role?: string;
}

// Voice-relaterte typer
export interface VoiceSettings {
  enabled: boolean;
  autoSpeak: boolean;
  voice: "nova" | "alloy" | "echo" | "fable" | "onyx" | "shimmer";
  language: "no" | "en";
}

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
}