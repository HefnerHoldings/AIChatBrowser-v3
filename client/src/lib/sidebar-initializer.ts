import { SidebarRegistry } from './sidebar-registry';
import { LeadScrapingSidebar } from '@/components/sidebars/LeadScrapingSidebar';
import { DataAnalyticsSidebar } from '@/components/sidebars/DataAnalyticsSidebar';
import { BrowserToolsSidebar } from '@/components/sidebars/BrowserToolsSidebar';
import { AIChatSidebar } from '@/components/sidebars/AIChatSidebar';
import { OutreachDashboard } from '@/components/sidebars/OutreachDashboard';

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

  // Initialize presets
  SidebarRegistry.initializePresets();
}