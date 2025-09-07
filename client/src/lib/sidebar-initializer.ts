import { SidebarRegistry } from './sidebar-registry';
import { LeadScrapingSidebar } from '@/components/sidebars/LeadScrapingSidebar';
import { DataAnalyticsSidebar } from '@/components/sidebars/DataAnalyticsSidebar';
import { BrowserToolsSidebar } from '@/components/sidebars/BrowserToolsSidebar';

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


  // Initialize presets
  SidebarRegistry.initializePresets();
}