import { SidebarRegistry } from './sidebar-registry';
import { LeadScrapingSidebar } from '@/components/sidebars/LeadScrapingSidebar';
import { DataAnalyticsSidebar } from '@/components/sidebars/DataAnalyticsSidebar';
import { BrowserToolsSidebar } from '@/components/sidebars/BrowserToolsSidebar';
import { AIChatSidebar } from '@/components/sidebars/AIChatSidebar';
import { OutreachDashboard } from '@/components/sidebars/OutreachDashboard';
import { RightDeveloperSidebar } from '@/components/sidebars/RightDeveloperSidebar';
import { LeftWorkflowSidebar } from '@/components/sidebars/LeftWorkflowSidebar';

// Initialize and register all sidebars
export function initializeSidebars() {
  // Register Lead Scraping Sidebar
  SidebarRegistry.register({
    id: 'lead-scraping',
    name: 'Lead Scraping',
    description: 'Web scraping og lead generation verktøy',
    iconName: 'Search',
    component: LeadScrapingSidebar,
    category: 'data',
    features: ['Web scraping', 'Lead generation', 'Data extraction', 'Pattern matching'],
    shortcuts: ['Ctrl+Shift+S']
  });

  // Register Data Analytics Sidebar
  SidebarRegistry.register({
    id: 'data-analytics',
    name: 'Data Analytics',
    description: 'Analyser og visualiser innsamlede data',
    iconName: 'BarChart3',
    component: DataAnalyticsSidebar,
    category: 'data',
    features: ['Data visualization', 'Analytics', 'Exports', 'Reports'],
    shortcuts: ['Ctrl+Shift+D']
  });

  // Register Browser Tools Sidebar
  SidebarRegistry.register({
    id: 'browser-tools',
    name: 'Browser Tools',
    description: 'Browser historikk, bokmerker og verktøy',
    iconName: 'Globe',
    component: BrowserToolsSidebar,
    category: 'browser',
    features: ['History', 'Bookmarks', 'Downloads', 'Extensions'],
    shortcuts: ['Ctrl+Shift+B']
  });

  // Register AI Chat Sidebar
  SidebarRegistry.register({
    id: 'ai-chat',
    name: 'AI Chat',
    description: 'AI-assistent med voice kontroll og learning',
    iconName: 'Bot',
    component: AIChatSidebar,
    category: 'automation',
    features: ['AI Chat', 'Voice Control', 'Learning System', 'Voice Output'],
    shortcuts: ['Ctrl+Shift+A']
  });

  // Register Outreach Dashboard
  SidebarRegistry.register({
    id: 'outreach',
    name: 'Outreach Engine',
    description: 'Signal-drevet B2B kommunikasjon og kampanjer',
    iconName: 'Send',
    component: OutreachDashboard,
    category: 'automation',
    features: ['Signal Mining', 'Multi-channel', 'Campaign Management', 'Analytics'],
    shortcuts: ['Ctrl+Shift+O']
  });

  // Register Developer Sidebar
  SidebarRegistry.register({
    id: 'developer',
    name: 'Developer Tools',
    description: 'Kodegenerering, debugging og utviklingsverktøy',
    iconName: 'Terminal',
    component: RightDeveloperSidebar,
    category: 'development',
    features: ['Code Generation', 'Debugging', 'Testing', 'Documentation'],
    shortcuts: ['Ctrl+Shift+Dev']
  });

  // Register Workflow Sidebar
  SidebarRegistry.register({
    id: 'workflow',
    name: 'Workflow Builder',
    description: 'Visuell workflow editor med AI-assistanse',
    iconName: 'Workflow',
    component: LeftWorkflowSidebar,
    category: 'automation',
    features: ['Visual Editor', 'AI Suggestions', 'Voice Control', 'Templates'],
    shortcuts: ['Ctrl+Shift+W']
  });

  // Register AI Assistant Sidebar
  SidebarRegistry.register({
    id: 'ai-assistant',
    name: 'AI Assistant',
    description: 'Intelligent AI-assistent for alle oppgaver',
    iconName: 'Bot',
    component: AIChatSidebar, // Reuse AI Chat component for now
    category: 'automation',
    features: ['Smart Suggestions', 'Code Help', 'Task Automation', 'Learning'],
    shortcuts: ['Ctrl+Shift+I']
  });

  // Register Security & Privacy Sidebar
  SidebarRegistry.register({
    id: 'security-privacy',
    name: 'Security & Privacy',
    description: 'Sikkerhet, personvern og tilgangskontroll',
    iconName: 'Shield',
    component: BrowserToolsSidebar, // Placeholder - can create SecuritySidebar later
    category: 'browser',
    features: ['Privacy Controls', 'Security Scanning', 'Permissions', 'Audit Logs'],
    shortcuts: ['Ctrl+Shift+P']
  });

  // Register Integrations Sidebar
  SidebarRegistry.register({
    id: 'integrations',
    name: 'Integrations',
    description: 'Eksterne tjenester og API-integrasjoner',
    iconName: 'Plug2',
    component: DataAnalyticsSidebar, // Placeholder - can create IntegrationsSidebar later
    category: 'development',
    features: ['API Management', 'OAuth', 'Webhooks', 'Third-party Services'],
    shortcuts: ['Ctrl+Shift+G']
  });

  // Register Quick Actions Sidebar
  SidebarRegistry.register({
    id: 'quick-actions',
    name: 'Quick Actions',
    description: 'Raske handlinger og snarveier',
    iconName: 'Zap',
    component: BrowserToolsSidebar, // Placeholder - can create QuickActionsSidebar later
    category: 'automation',
    features: ['Shortcuts', 'Macros', 'Templates', 'Automation'],
    shortcuts: ['Ctrl+Shift+Q']
  });

  // Register Custom Sidebar
  SidebarRegistry.register({
    id: 'custom',
    name: 'Custom',
    description: 'Tilpassbar sidebar for egne verktøy',
    iconName: 'Palette',
    component: DataAnalyticsSidebar, // Placeholder - can create CustomSidebar later
    category: 'custom',
    features: ['Customizable', 'Plugins', 'User Scripts', 'Extensions'],
    shortcuts: ['Ctrl+Shift+C']
  });

  // Initialize presets
  SidebarRegistry.initializePresets();
}