import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DownloadsManager } from '@/components/DownloadsManager';
import { SearchSuggestions } from '@/components/SearchSuggestions';
import { HistoryPanel } from '@/components/HistoryPanel';
import { TabPreview } from '@/components/TabPreview';
import { FindBar } from '@/components/FindBar';
import { PasswordManager } from '@/components/PasswordManager';
import { ReaderMode } from '@/components/ReaderMode';
import { SessionRestore } from '@/components/SessionRestore';
import { TabGroups } from '@/components/TabGroups';
import { BookmarksPanel } from '@/components/BookmarksPanel';
import { MediaControls } from '@/components/MediaControls';
import { Extensions } from '@/components/Extensions';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { WebView } from '@/components/WebView';
import { NetworkLayer } from '@/components/NetworkLayer';
import { SecuritySandbox } from '@/components/SecuritySandbox';
import { WebAPIs } from '@/components/WebAPIs';
import { RenderingEngine } from '@/components/RenderingEngine';
import { AIAssistant } from '@/components/AIAssistant';
import { WorkflowSuggestions } from '@/components/WorkflowSuggestions';
import { ExtensionsAPI } from '@/components/ExtensionsAPI';
import { ContentScriptInjector } from '@/components/ContentScriptInjector';
import { PWAManager } from '@/components/PWAManager';
import { WorkflowManager } from '@/components/WorkflowManager';
import { AITesting } from '@/components/AITesting';
import { GoalTracker } from '@/components/GoalTracker';
import { MultiAgentTeam } from '@/components/vibecoding/MultiAgentTeam';
import { VibePlatform } from '@/components/vibecoding/VibePlatform';
import { Marketplace } from '@/components/vibecoding/Marketplace';
import { OutreachHub } from '@/components/outreach/OutreachHub';
import { ProductivityInsights } from '@/components/ProductivityInsights';
import { WorkflowBuilder } from '@/components/WorkflowBuilder/WorkflowBuilder';
import { AdaptiveSidebar } from '@/components/AdaptiveSidebar';
import { WorkflowAIChat } from '@/components/WorkflowAIChat';
import { VoiceControl } from '@/components/VoiceControl';
import { ActionRecorder } from '@/components/ActionRecorder';
import { ResizableSidebar } from '@/components/ResizableSidebar';
import { RightSidebarTools } from '@/components/RightSidebarTools';
import { DynamicSidebar } from '@/components/sidebars/DynamicSidebar';
import { useSidebarManager } from '@/contexts/SidebarManagerContext';
import { SidebarWrapper } from '@/components/sidebars/SidebarWrapper';
import { LeftWorkflowSidebar } from '@/components/sidebars/LeftWorkflowSidebar';
import { RightDeveloperSidebar } from '@/components/sidebars/RightDeveloperSidebar';
import { CollapsibleSidebar } from '@/components/sidebars/CollapsibleSidebar';
import { BrowserStartPage } from '@/components/BrowserStartPage';
import { MadEasyLogo } from '@/components/MadEasyLogo';
import { SidebarContainer } from '@/components/SidebarContainer';
import { AIChatOverlay } from '@/components/AIChatOverlay';
import { DraggableToolPanel } from '@/components/DraggableToolPanel';
import { useSidebar } from '@/contexts/SidebarContext';
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  X, 
  Plus, 
  Home,
  Globe,
  Shield,
  Loader2,
  Search,
  Star,
  StarOff,
  Copy,
  ExternalLink,
  ChevronDown,
  Bookmark as BookmarkIcon,
  Key,
  BookOpen,
  Folder,
  History,
  Settings,
  User,
  EyeOff,
  Eye,
  Code2,
  Maximize2,
  Minimize2,
  Printer,
  ZoomIn,
  ZoomOut,
  Search as SearchIcon,
  Volume2,
  Puzzle,
  Activity,
  Wifi,
  Code,
  Monitor as MonitorIcon,
  CheckCircle,
  Layers,
  Database,
  FileCode2,
  Bot,
  Package,
  Sparkles,
  Users,
  ShoppingBag,
  Send,
  Mic,
  Clock,
  Calendar,
  Target,
  Trophy,
  Video,
  ChevronLeft,
  ChevronRight,
  Brain
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

interface BrowserInstance {
  id: string;
  tabs: BrowserTab[];
  activeTabId: string;
}

interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  folder?: string;
  position: number;
  createdAt: Date;
}

interface HistoryItem {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  visitCount: number;
  lastVisited: Date;
  createdAt: Date;
}

export default function Browser() {
  const { toast } = useToast();
  const { config, toggleSidebar, toggleMode } = useSidebarManager();
  const queryClient = useQueryClient();
  const [browserInstance, setBrowserInstance] = useState<BrowserInstance | null>(null);
  const [activeTab, setActiveTab] = useState<BrowserTab | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [showBookmarksPanel, setShowBookmarksPanel] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [currentPageBookmark, setCurrentPageBookmark] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [detectedFormData, setDetectedFormData] = useState<{username: string, password: string, domain: string} | null>(null);
  const [showReaderMode, setShowReaderMode] = useState(false);
  const [showMediaControls, setShowMediaControls] = useState(false);
  const [showExtensions, setShowExtensions] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [showNetworkLayer, setShowNetworkLayer] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showWebAPIs, setShowWebAPIs] = useState(false);
  const [showRenderingEngine, setShowRenderingEngine] = useState(false);
  const [showTabGroups, setShowTabGroups] = useState(false);
  const [tabGroups, setTabGroups] = useState<any[]>([]);
  const [showDevTools, setShowDevTools] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenBar, setShowFullscreenBar] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showFindBar, setShowFindBar] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [activeView, setActiveView] = useState('browser');
  const [showProductivityInsights, setShowProductivityInsights] = useState(false);
  const [showExtensionsAPI, setShowExtensionsAPI] = useState(false);
  const [showPWAManager, setShowPWAManager] = useState(false);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [showWorkflowChat, setShowWorkflowChat] = useState(false);
  const [showVoiceControl, setShowVoiceControl] = useState(false);
  const [showActionRecorder, setShowActionRecorder] = useState(false);
  const [rightToolsCollapsed, setRightToolsCollapsed] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [pageContent, setPageContent] = useState<string>('');
  const [suggestionsCount, setSuggestionsCount] = useState(0);
  
  // Check if current URL is bookmarked
  const checkBookmarkStatus = async (url: string) => {
    try {
      const response = await apiRequest(`/api/bookmarks/check?url=${encodeURIComponent(url)}`);
      setIsBookmarked(response.isBookmarked);
      setCurrentPageBookmark(response.bookmark);
    } catch (error) {
      console.error('Failed to check bookmark status:', error);
    }
  };
  
  // Toggle bookmark for current page
  const toggleBookmark = async () => {
    if (!activeTab) return;
    
    try {
      if (isBookmarked && currentPageBookmark) {
        // Remove bookmark
        await apiRequest(`/api/bookmarks/${currentPageBookmark.id}`, {
          method: 'DELETE',
        });
        setIsBookmarked(false);
        setCurrentPageBookmark(null);
        toast({ title: 'Bokmerke fjernet' });
      } else {
        // Add bookmark
        const bookmark = await apiRequest('/api/bookmarks', {
          method: 'POST',
          body: JSON.stringify({
            title: activeTab.title || 'Untitled',
            url: activeTab.url,
            favicon: activeTab.favicon,
          }),
        });
        setIsBookmarked(true);
        setCurrentPageBookmark(bookmark);
        toast({ title: 'Bokmerke lagt til' });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
    } catch (error) {
      toast({ title: 'Kunne ikke oppdatere bokmerke', variant: 'destructive' });
    }
  };
  
  // Initialize panel states from localStorage
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(() => {
    const saved = localStorage.getItem('workflowPanelCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(() => {
    const saved = localStorage.getItem('developerPanelCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [aiAssistantCollapsed, setAiAssistantCollapsed] = useState(() => {
    const saved = localStorage.getItem('aiAssistantCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('leftSidebarWidth');
    return saved ? parseInt(saved) : 320;
  });
  const [rightSidebarWidth, setRightSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('rightSidebarWidth');
    return saved ? parseInt(saved) : 380;
  });
  
  // Save panel states to localStorage when they change
  useEffect(() => {
    localStorage.setItem('workflowPanelCollapsed', JSON.stringify(leftPanelCollapsed));
  }, [leftPanelCollapsed]);
  
  useEffect(() => {
    localStorage.setItem('developerPanelCollapsed', JSON.stringify(rightPanelCollapsed));
  }, [rightPanelCollapsed]);
  
  useEffect(() => {
    localStorage.setItem('aiAssistantCollapsed', JSON.stringify(aiAssistantCollapsed));
  }, [aiAssistantCollapsed]);

  useEffect(() => {
    localStorage.setItem('leftSidebarWidth', leftSidebarWidth.toString());
  }, [leftSidebarWidth]);

  useEffect(() => {
    localStorage.setItem('rightSidebarWidth', rightSidebarWidth.toString());
  }, [rightSidebarWidth]);
  
  // Keyboard shortcuts for panels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Alt key is pressed
      if (!e.altKey) return;
      
      switch(e.key.toLowerCase()) {
        case 'w':
          e.preventDefault();
          setLeftPanelCollapsed((prev: boolean) => !prev);
          break;
        case 'd':
          e.preventDefault();
          setRightPanelCollapsed((prev: boolean) => !prev);
          break;
        case 'a':
          e.preventDefault();
          setAiAssistantCollapsed((prev: boolean) => !prev);
          break;
        case 't':
          e.preventDefault();
          setRightToolsCollapsed((prev: boolean) => !prev);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const addressBarRef = useRef<HTMLDivElement>(null);
  
  // Fetch bookmarks
  const { data: bookmarks = [], refetch: refetchBookmarks } = useQuery<Bookmark[]>({
    queryKey: ['/api/bookmarks'],
  });
  
  // Fetch history
  const { data: history = [] } = useQuery<HistoryItem[]>({
    queryKey: ['/api/browser-history'],
  });

  // Initialize browser instance
  const initBrowser = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        'POST',
        '/api/browser-engine/instance',
        {
          type: 'chromium',
          isIncognito: isIncognito
        }
      );
      return response.json();
    },
    onSuccess: async (data) => {
      if (data.instanceId) {
        // Store browser instance ID for WebView to use with proxy
        localStorage.setItem('browserInstanceId', data.instanceId);
        
        setBrowserInstance({
          id: data.instanceId,
          tabs: [],
          activeTabId: ''
        });
        
        // Create initial tab with start page
        await createNewTab(data.instanceId, 'about:home');
      }
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke starte nettleser',
        variant: 'destructive'
      });
    }
  });

  // Create new tab
  const createTabMutation = useMutation({
    mutationFn: async ({ instanceId, url }: { instanceId: string; url: string }) => {
      const response = await apiRequest(
        'POST',
        '/api/browser-engine/tab/new',
        {
          instanceId,
          url: url || 'about:blank',
          background: false
        }
      );
      return response.json();
    },
    onSuccess: (data) => {
      if (browserInstance) {
        const newTab: BrowserTab = {
          id: data.tab.id,
          title: data.tab.title || 'Ny fane',
          url: data.tab.url || 'about:blank',
          isLoading: false,
          canGoBack: false,
          canGoForward: false
        };
        
        setBrowserInstance({
          ...browserInstance,
          tabs: [...browserInstance.tabs, newTab],
          activeTabId: newTab.id
        });
        
        setActiveTab(newTab);
        setUrlInput(newTab.url);
      }
    }
  });

  // Navigate to URL
  const navigateMutation = useMutation({
    mutationFn: async ({ tabId, url }: { tabId: string; url: string }) => {
      if (!browserInstance) return;
      
      setIsNavigating(true);
      
      const response = await apiRequest(
        'POST',
        `/api/browser-engine/instance/${browserInstance.id}/tab/${tabId}/navigate`,
        { url }
      );
      return response.json();
    },
    onSuccess: async (data) => {
      setIsNavigating(false);
      
      // Update tab URL
      if (activeTab && browserInstance) {
        const updatedTab = { ...activeTab, url: urlInput, isLoading: false };
        setActiveTab(updatedTab);
        
        const updatedTabs = browserInstance.tabs.map(tab => 
          tab.id === activeTab.id ? updatedTab : tab
        );
        
        setBrowserInstance({
          ...browserInstance,
          tabs: updatedTabs
        });
        
        // Extract page content for smart workflow recognition
        try {
          const response = await apiRequest(
            'GET',
            `/api/browser-engine/instance/${browserInstance.id}/tab/${activeTab.id}/content`
          );
          const contentData = await response.json();
          if (contentData?.content) {
            setPageContent(contentData.content);
          }
        } catch (error) {
          console.log('Could not extract page content');
          // Use simulated content if extraction fails
          setPageContent(`<html><body><h1>${updatedTab.title || 'Page'}</h1></body></html>`);
        }
      }
    },
    onError: () => {
      setIsNavigating(false);
      toast({
        title: 'Navigasjonsfeil',
        description: 'Kunne ikke navigere til URL',
        variant: 'destructive'
      });
    }
  });

  // Handle keyboard shortcut
  const handleKeyboardShortcut = useMutation({
    mutationFn: async (shortcut: string) => {
      if (!browserInstance || !activeTab) return;
      
      const response = await apiRequest(
        'POST',
        '/api/browser-engine/keyboard-shortcut',
        {
          instanceId: browserInstance.id,
          shortcut,
          tabId: activeTab.id
        }
      );
      return response.json();
    }
  });

  // Initialize browser on mount
  useEffect(() => {
    if (!browserInstance) {
      initBrowser.mutate();
    }
  }, []);

  // Check if current page is bookmarked when URL changes
  useEffect(() => {
    if (activeTab?.url && activeTab.url !== 'about:home' && activeTab.url !== 'about:blank') {
      checkBookmarkStatus(activeTab.url);
    } else {
      setIsBookmarked(false);
      setCurrentPageBookmark(null);
    }
  }, [activeTab?.url]);
  
  // Add to history when navigating (not in incognito mode)
  useEffect(() => {
    if (activeTab && activeTab.url && activeTab.url !== 'about:blank' && !isIncognito) {
      apiRequest('POST', '/api/browser-history', {
        title: activeTab.title || activeTab.url,
        url: activeTab.url,
        favicon: activeTab.favicon
      }).catch(console.error);
    }
  }, [activeTab?.url, isIncognito]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Navigation shortcuts
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleBack();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleForward();
      } else if (e.altKey && e.key === 'Home') {
        e.preventDefault();
        handleHome();
      } else if (e.key === 'F5') {
        e.preventDefault();
        handleReload(e.shiftKey); // Shift+F5 for hard reload
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        handleReload(e.shiftKey); // Ctrl+Shift+R for hard reload
      }
      // Other shortcuts
      else if (e.ctrlKey || e.metaKey) {
        if (e.key === 't' && !e.shiftKey) {
          e.preventDefault();
          handleNewTab();
        } else if (e.key === 'w' && !e.shiftKey) {
          e.preventDefault();
          handleCloseTab(activeTab?.id || '');
        } else if (e.key === 't' && e.shiftKey) {
          e.preventDefault();
          handleRestoreClosedTab();
        } else if (e.key === 'l') {
          e.preventDefault();
          document.getElementById('url-input')?.focus();
        } else if (e.key === 'd') {
          e.preventDefault();
          toggleBookmark();
        } else if (e.key === 'b' && e.shiftKey) {
          e.preventDefault();
          setShowBookmarksPanel(!showBookmarksPanel);
        } else if (e.key === 'n' && e.shiftKey) {
          e.preventDefault();
          handleToggleIncognito();
        } else if (e.key === 'h') {
          e.preventDefault();
          setShowHistory(!showHistory);
        }
      } else if (e.key === 'Tab' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        // Switch to previous tab
        if (browserInstance && browserInstance.tabs.length > 1) {
          const currentIndex = browserInstance.tabs.findIndex(t => t.id === activeTab?.id);
          const prevIndex = currentIndex === 0 ? browserInstance.tabs.length - 1 : currentIndex - 1;
          handleTabSwitch(browserInstance.tabs[prevIndex].id);
        }
      } else if (e.key === 'Tab' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // Switch to next tab
        if (browserInstance && browserInstance.tabs.length > 1) {
          const currentIndex = browserInstance.tabs.findIndex(t => t.id === activeTab?.id);
          const nextIndex = (currentIndex + 1) % browserInstance.tabs.length;
          handleTabSwitch(browserInstance.tabs[nextIndex].id);
        }
      } else if (e.key === 'F12') {
        e.preventDefault();
        setShowDevTools(!showDevTools);
      } else if (e.key === 'F11') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        handleZoomIn();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleZoomReset();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowFindBar(!showFindBar);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [browserInstance, activeTab, showBookmarksPanel, showHistory, showDevTools, isFullscreen, zoomLevel, showFindBar, showPasswords, toggleBookmark]);

  const createNewTab = async (instanceId: string, url: string) => {
    await createTabMutation.mutateAsync({ instanceId, url });
  };

  const handleNewTab = () => {
    if (browserInstance) {
      createNewTab(browserInstance.id, 'about:home');
    }
  };

  const handleCloseTab = async (tabId: string) => {
    if (!browserInstance) return;
    
    try {
      const closedTab = browserInstance.tabs.find(tab => tab.id === tabId);
      if (closedTab) {
        const recentlyClosed = JSON.parse(localStorage.getItem('recently_closed_tabs') || '[]');
        recentlyClosed.unshift({
          id: closedTab.id,
          title: closedTab.title,
          url: closedTab.url,
          favicon: closedTab.favicon
        });
        localStorage.setItem('recently_closed_tabs', JSON.stringify(recentlyClosed.slice(0, 10)));
      }
      
      await apiRequest(
        'DELETE',
        `/api/browser-engine/instance/${browserInstance.id}/tab/${tabId}`
      );
      
      const remainingTabs = browserInstance.tabs.filter(tab => tab.id !== tabId);
      
      if (remainingTabs.length === 0) {
        await createNewTab(browserInstance.id, 'about:home');
      } else {
        setBrowserInstance({
          ...browserInstance,
          tabs: remainingTabs,
          activeTabId: remainingTabs[0].id
        });
        setActiveTab(remainingTabs[0]);
        setUrlInput(remainingTabs[0].url);
      }
      
      // Invalidate cache to ensure UI consistency
      queryClient.invalidateQueries({ queryKey: ['/api/browser-engine/instance'] });
    } catch (error) {
      toast({
        title: 'Feil',
        description: 'Kunne ikke lukke fane',
        variant: 'destructive'
      });
    }
  };

  const handleTabSwitch = async (tabId: string) => {
    const tab = browserInstance?.tabs.find(t => t.id === tabId);
    if (tab && browserInstance) {
      // Update active tab state
      setActiveTab(tab);
      setUrlInput(tab.url);
      setBrowserInstance({
        ...browserInstance,
        activeTabId: tabId
      });
      
      // Note: Tab switching is handled on frontend only since we're using simulated browser
      // The actual browser instance would maintain its own tab state
      
      // Update browser history for new tab
      if (tab.url && tab.url !== 'about:blank' && !isIncognito) {
        apiRequest('POST', '/api/browser-history', {
          title: tab.title || tab.url,
          url: tab.url,
          favicon: tab.favicon
        }).catch(console.error);
      }
      
      // Check if bookmarked
      const isInBookmarks = bookmarks.some(b => b.url === tab.url);
      setIsBookmarked(isInBookmarks);
      
      // Invalidate cache to ensure UI consistency
      queryClient.invalidateQueries({ queryKey: ['/api/browser-engine/instance'] });
    }
  };

  const handleNavigate = () => {
    if (!activeTab || !urlInput) return;
    
    let url = urlInput;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    navigateMutation.mutate({ tabId: activeTab.id, url });
  };

  const handleBack = async () => {
    if (!browserInstance || !activeTab || !activeTab.canGoBack) return;
    
    try {
      setIsNavigating(true);
      
      const response = await apiRequest('POST', '/api/browser-engine/tab/navigate-back', {
        instanceId: browserInstance.id,
        tabId: activeTab.id
      });
      
      const data = await response.json();
      
      if (data.success && data.tab) {
        // Update tab with new state from backend
        const updatedTab = {
          ...activeTab,
          url: data.tab.url,
          title: data.tab.title || data.tab.url,
          canGoBack: data.tab.canGoBack,
          canGoForward: data.tab.canGoForward,
          isLoading: false
        };
        
        setActiveTab(updatedTab);
        setUrlInput(updatedTab.url);
        
        const updatedTabs = browserInstance.tabs.map(tab => 
          tab.id === activeTab.id ? updatedTab : tab
        );
        setBrowserInstance({
          ...browserInstance,
          tabs: updatedTabs
        });
        
        // Invalidate query cache after navigation
        queryClient.invalidateQueries({ queryKey: ['/api/browser-engine/instance'] });
      }
    } catch (error) {
      console.error('Failed to go back:', error);
      toast({
        title: 'Navigation Error',
        description: 'Failed to navigate back',
        variant: 'destructive'
      });
    } finally {
      setIsNavigating(false);
    }
  };

  const handleForward = async () => {
    if (!browserInstance || !activeTab || !activeTab.canGoForward) return;
    
    try {
      setIsNavigating(true);
      
      const response = await apiRequest('POST', '/api/browser-engine/tab/navigate-forward', {
        instanceId: browserInstance.id,
        tabId: activeTab.id
      });
      
      const data = await response.json();
      
      if (data.success && data.tab) {
        // Update tab with new state from backend
        const updatedTab = {
          ...activeTab,
          url: data.tab.url,
          title: data.tab.title || data.tab.url,
          canGoBack: data.tab.canGoBack,
          canGoForward: data.tab.canGoForward,
          isLoading: false
        };
        
        setActiveTab(updatedTab);
        setUrlInput(updatedTab.url);
        
        const updatedTabs = browserInstance.tabs.map(tab => 
          tab.id === activeTab.id ? updatedTab : tab
        );
        setBrowserInstance({
          ...browserInstance,
          tabs: updatedTabs
        });
        
        // Invalidate query cache after navigation
        queryClient.invalidateQueries({ queryKey: ['/api/browser-engine/instance'] });
      }
    } catch (error) {
      console.error('Failed to go forward:', error);
      toast({
        title: 'Navigation Error',
        description: 'Failed to navigate forward',
        variant: 'destructive'
      });
    } finally {
      setIsNavigating(false);
    }
  };

  const handleReload = async (hard: boolean = false) => {
    if (!browserInstance || !activeTab) return;
    
    try {
      setIsNavigating(true);
      
      // Set loading state
      const loadingTab = { ...activeTab, isLoading: true };
      setActiveTab(loadingTab);
      
      const updatedTabs = browserInstance.tabs.map(tab => 
        tab.id === activeTab.id ? loadingTab : tab
      );
      setBrowserInstance({
        ...browserInstance,
        tabs: updatedTabs
      });
      
      const response = await apiRequest('POST', '/api/browser-engine/tab/reload', {
        instanceId: browserInstance.id,
        tabId: activeTab.id,
        hard
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update tab state after reload
        const reloadedTab = { 
          ...activeTab, 
          isLoading: false,
          canGoBack: data.tab?.canGoBack || activeTab.canGoBack,
          canGoForward: data.tab?.canGoForward || activeTab.canGoForward
        };
        setActiveTab(reloadedTab);
        
        const finalTabs = browserInstance.tabs.map(tab => 
          tab.id === activeTab.id ? reloadedTab : tab
        );
        setBrowserInstance({
          ...browserInstance,
          tabs: finalTabs
        });
        
        // Invalidate query cache after reload
        queryClient.invalidateQueries({ queryKey: ['/api/browser-engine/instance'] });
        
        toast({
          title: 'Page refreshed',
          description: `${activeTab.title || activeTab.url} was reloaded`
        });
      }
    } catch (error) {
      console.error('Failed to reload:', error);
      toast({
        title: 'Reload Error',
        description: 'Failed to reload page',
        variant: 'destructive'
      });
    } finally {
      setIsNavigating(false);
    }
  };
  
  const handleBookmarkClick = (url: string) => {
    if (activeTab && browserInstance) {
      setUrlInput(url);
      navigateMutation.mutate({ tabId: activeTab.id, url });
    }
  };

  const handleStop = async () => {
    if (!browserInstance || !activeTab) return;
    
    try {
      setIsNavigating(false);
      
      // Call stop API
      const response = await apiRequest('POST', '/api/browser-engine/tab/stop', {
        instanceId: browserInstance.id,
        tabId: activeTab.id
      });
      
      const data = await response.json();
      
      if (data.success && data.tab) {
        // Update tab with state from backend
        const stoppedTab = { 
          ...activeTab, 
          isLoading: false,
          canGoBack: data.tab.canGoBack,
          canGoForward: data.tab.canGoForward
        };
        setActiveTab(stoppedTab);
        
        const updatedTabs = browserInstance.tabs.map(tab => 
          tab.id === activeTab.id ? stoppedTab : tab
        );
        setBrowserInstance({
          ...browserInstance,
          tabs: updatedTabs
        });
        
        // Invalidate query cache after stop
        queryClient.invalidateQueries({ queryKey: ['/api/browser-engine/instance'] });
      }
    } catch (error) {
      console.error('Failed to stop loading:', error);
      toast({
        title: 'Stop Error',
        description: 'Failed to stop page loading',
        variant: 'destructive'
      });
    } finally {
      // Ensure loading state is cleared even on error
      setIsNavigating(false);
    }
  };

  const handleRefresh = () => {
    if (activeTab && browserInstance) {
      handleReload();
    }
  };
  
  // Duplicate current tab
  const handleDuplicateTab = async (tabId: string) => {
    if (!browserInstance) return;
    
    try {
      const response = await apiRequest('POST', '/api/browser-engine/tab/duplicate', {
        instanceId: browserInstance.id,
        tabId
      });
      
      const data = await response.json();
      const newTab: BrowserTab = {
        id: data.tab.id,
        title: data.tab.title || 'Ny fane',
        url: data.tab.url,
        favicon: data.tab.favicon,
        isLoading: false,
        canGoBack: false,
        canGoForward: false
      };
      
      setBrowserInstance({
        ...browserInstance,
        tabs: [...browserInstance.tabs, newTab],
        activeTabId: newTab.id
      });
      
      setActiveTab(newTab);
      setUrlInput(newTab.url);
      
      toast({
        title: 'Fane duplisert',
        description: 'Ny fane opprettet med samme URL'
      });
    } catch (error) {
      toast({
        title: 'Feil',
        description: 'Kunne ikke duplisere fane',
        variant: 'destructive'
      });
    }
  };
  
  // Close other tabs
  const handleCloseOtherTabs = async (tabId: string) => {
    if (!browserInstance) return;
    
    try {
      await apiRequest('POST', '/api/browser-engine/tab/close-others', {
        instanceId: browserInstance.id,
        tabId
      });
      
      const tab = browserInstance.tabs.find(t => t.id === tabId);
      if (tab) {
        setBrowserInstance({
          ...browserInstance,
          tabs: [tab],
          activeTabId: tab.id
        });
        setActiveTab(tab);
        setUrlInput(tab.url);
      }
      
      toast({
        title: 'Faner lukket',
        description: 'Alle andre faner er lukket'
      });
    } catch (error) {
      toast({
        title: 'Feil',
        description: 'Kunne ikke lukke andre faner',
        variant: 'destructive'
      });
    }
  };
  
  // Restore recently closed tab
  const handleRestoreClosedTab = () => {
    const recentlyClosed = JSON.parse(localStorage.getItem('recently_closed_tabs') || '[]');
    if (recentlyClosed.length > 0 && browserInstance) {
      const tabToRestore = recentlyClosed[0];
      createNewTab(browserInstance.id, tabToRestore.url);
      
      // Remove from recently closed
      recentlyClosed.shift();
      localStorage.setItem('recently_closed_tabs', JSON.stringify(recentlyClosed));
      
      toast({
        title: 'Fane gjenåpnet',
        description: `Gjenåpnet: ${tabToRestore.title || tabToRestore.url}`
      });
    } else {
      toast({
        title: 'Ingen lukkede faner',
        description: 'Ingen nylig lukkede faner å gjenåpne',
        variant: 'default'
      });
    }
  };

  const handleHome = async () => {
    if (!activeTab || !browserInstance) return;
    
    try {
      const homeUrl = 'about:home';
      setUrlInput(homeUrl);
      setIsNavigating(true);
      
      const response = await apiRequest(
        'POST',
        `/api/browser-engine/instance/${browserInstance.id}/tab/${activeTab.id}/navigate`,
        { url: homeUrl }
      );
      
      const data = await response.json();
      
      if (data.success) {
        const updatedTab = { 
          ...activeTab, 
          url: homeUrl, 
          title: 'Ny fane',
          canGoBack: true, // Can go back after navigating to home
          canGoForward: false // Clear forward history
        };
        
        setActiveTab(updatedTab);
        
        const updatedTabs = browserInstance.tabs.map(tab => 
          tab.id === activeTab.id ? updatedTab : tab
        );
        setBrowserInstance({
          ...browserInstance,
          tabs: updatedTabs
        });
        
        // Invalidate query cache after navigation
        queryClient.invalidateQueries({ queryKey: ['/api/browser-engine/instance'] });
      }
    } catch (error) {
      console.error('Failed to navigate home:', error);
      toast({
        title: 'Navigation Error',
        description: 'Failed to navigate to home',
        variant: 'destructive'
      });
    } finally {
      setIsNavigating(false);
    }
  };
  
  const handleToggleIncognito = async () => {
    const newIncognitoState = !isIncognito;
    setIsIncognito(newIncognitoState);
    
    if (browserInstance) {
      await apiRequest('DELETE', `/api/browser-engine/instance/${browserInstance.id}`);
      setBrowserInstance(null);
      setActiveTab(null);
      
      setTimeout(() => {
        initBrowser.mutate();
      }, 100);
    }
    
    toast({
      title: newIncognitoState ? 'Inkognitomodus aktivert' : 'Inkognitomodus deaktivert',
      description: newIncognitoState 
        ? 'Nettleserhistorikk vil ikke bli lagret' 
        : 'Normal nettlesing gjenopptatt'
    });
  };
  
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      toast({
        title: 'Fullskjerm aktivert',
        description: 'Trykk F11 eller Esc for å avslutte',
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  const handlePrint = () => {
    if (iframeRef.current && activeTab) {
      try {
        const printWindow = window.open(activeTab.url, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      } catch (error) {
        toast({
          title: 'Kunne ikke skrive ut',
          description: 'Prøv å laste siden på nytt',
          variant: 'destructive'
        });
      }
    }
  };
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  useEffect(() => {
    if (!isFullscreen) return;
    
    let timeout: NodeJS.Timeout;
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 50) {
        setShowFullscreenBar(true);
        clearTimeout(timeout);
        timeout = setTimeout(() => setShowFullscreenBar(false), 3000);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isFullscreen]);
  
  const handleZoomIn = () => {
    setZoomLevel(prev => {
      const newZoom = Math.min(prev + 10, 200);
      toast({
        title: `Zoom ${newZoom}%`,
        description: 'Trykk Ctrl+0 for å tilbakestille',
      });
      return newZoom;
    });
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 10, 50);
      toast({
        title: `Zoom ${newZoom}%`,
        description: 'Trykk Ctrl+0 for å tilbakestille',
      });
      return newZoom;
    });
  };
  
  const handleZoomReset = () => {
    setZoomLevel(100);
    toast({
      title: 'Zoom tilbakestilt',
      description: 'Zoom er satt til 100%',
    });
  };
  
  const handleFind = (query: string, direction?: 'next' | 'prev') => {
    toast({
      title: 'Søker...',
      description: `Søker etter "${query}"${direction ? ` (${direction === 'next' ? 'neste' : 'forrige'})` : ''}`,
    });
  };

  return (
    <div className={`relative h-screen ${isIncognito ? 'bg-zinc-900' : 'bg-background'}`}>
      {/* Main Content Area */}
      <div className="h-full flex flex-col">
        {/* Main Navigation Tabs */}
        <Tabs value={activeView} onValueChange={setActiveView} className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none justify-start px-4 bg-card">
          <MadEasyLogo size="small" className="mr-3" />
          
          {/* Browser - standalone */}
          <TabsTrigger value="browser" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Browser
          </TabsTrigger>
          
          {/* Development dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={["vibecoding", "devbridge", "agent-team"].includes(activeView) ? "secondary" : "ghost"}
                size="sm"
                className="flex items-center gap-2 h-9"
              >
                <Code2 className="h-4 w-4" />
                Utvikling
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setActiveView("vibecoding")}>
                <Sparkles className="mr-2 h-4 w-4" />
                Vibecoding Platform
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView("devbridge")}>
                <FileCode2 className="mr-2 h-4 w-4" />
                DevBridge
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView("agent-team")}>
                <Users className="mr-2 h-4 w-4" />
                AI Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Business dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={["marketplace", "outreach", "workflow", "productivity"].includes(activeView) ? "secondary" : "ghost"}
                size="sm"
                className="flex items-center gap-2 h-9"
              >
                <Target className="h-4 w-4" />
                Forretning
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setActiveView("marketplace")}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Marketplace
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView("outreach")}>
                <Send className="mr-2 h-4 w-4" />
                Outreach & Leads
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView("workflow")}>
                <Layers className="mr-2 h-4 w-4" />
                Workflow
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView("productivity")}>
                <Brain className="mr-2 h-4 w-4" />
                Produktivitet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Data & Analytics dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={["data", "privacy", "ai-testing"].includes(activeView) ? "secondary" : "ghost"}
                size="sm"
                className="flex items-center gap-2 h-9"
              >
                <Database className="h-4 w-4" />
                Data & Analyse
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setActiveView("data")}>
                <Database className="mr-2 h-4 w-4" />
                Data Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView("privacy")}>
                <Shield className="mr-2 h-4 w-4" />
                Privacy & Sikkerhet
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView("ai-testing")}>
                <Bot className="mr-2 h-4 w-4" />
                AI Testing
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Spacer to push tools to the right */}
          <div className="flex-1" />
          
          {/* Tools and settings in top bar */}
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-2 h-9"
            onClick={() => setShowExtensionsAPI(!showExtensionsAPI)}
          >
            <Puzzle className="h-4 w-4" />
            Verktøy
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2 h-9">
                <Settings className="h-4 w-4" />
                Innstillinger
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                <User className="mr-2 h-4 w-4" />
                Min Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                <Settings className="mr-2 h-4 w-4" />
                System innstillinger
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowHistory(true)}>
                <History className="mr-2 h-4 w-4" />
                Historikk
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBookmarksPanel(!showBookmarksPanel)}>
                <BookmarkIcon className="mr-2 h-4 w-4" />
                Bokmerker
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowPasswords(true)}>
                <Key className="mr-2 h-4 w-4" />
                Passord
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TabsList>

        <TabsContent value="browser" className="flex-1 flex flex-col p-0 m-0">
            {/* Browser Tabs Row */}
            {!isFullscreen && (
              <div className={`flex items-center border-b ${isIncognito ? 'bg-zinc-900 border-zinc-700' : 'bg-muted/20'} px-2 py-1`}>
                <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-thin">
                  {browserInstance && browserInstance.tabs.length > 0 ? (
                    <>
                      {browserInstance.tabs.map(tab => (
                        <DropdownMenu key={tab.id}>
                          <DropdownMenuTrigger asChild>
                            <div
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer min-w-[120px] max-w-[200px] group relative transition-all ${
                                activeTab?.id === tab.id 
                                  ? 'bg-background border-t border-l border-r shadow-sm' 
                                  : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
                              }`}
                              onClick={() => handleTabSwitch(tab.id)}
                              onContextMenu={(e) => e.preventDefault()}
                              onMouseEnter={(e) => {
                                if (hoverTimeout) clearTimeout(hoverTimeout);
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoverTimeout(setTimeout(() => {
                                  setHoveredTab(tab.id);
                                  setHoverPosition({ x: rect.left, y: rect.bottom });
                                }, 500));
                              }}
                              onMouseLeave={() => {
                                if (hoverTimeout) clearTimeout(hoverTimeout);
                                setHoveredTab(null);
                              }}
                            >
                              {/* Security indicator */}
                              {tab.url.startsWith('https://') ? (
                                <Shield className="w-3 h-3 text-green-500 shrink-0" title="Sikker tilkobling" />
                              ) : tab.url.startsWith('http://') ? (
                                <Shield className="w-3 h-3 text-yellow-500 shrink-0" title="Ikke sikker" />
                              ) : null}
                              
                              {/* Favicon */}
                              {tab.favicon ? (
                                <img src={tab.favicon} alt="" className="w-3 h-3 shrink-0" />
                              ) : (
                                <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                              )}
                              
                              <span className="flex-1 text-xs truncate">
                                {tab.title || 'Ny fane'}
                              </span>
                              
                              {/* Loading indicator */}
                              {tab.isLoading && (
                                <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                              )}
                              
                              {/* Close button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCloseTab(tab.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => handleDuplicateTab(tab.id)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Dupliser fane
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                window.open(tab.url, '_blank');
                              }}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Åpne i nytt vindu
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleCloseOtherTabs(tab.id)}>
                              <X className="mr-2 h-4 w-4" />
                              Lukk andre faner
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCloseTab(tab.id)}>
                              <X className="mr-2 h-4 w-4" />
                              Lukk fane
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ))}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-1 shrink-0"
                        onClick={handleNewTab}
                        title="Ny fane (Ctrl+T)"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground px-3 py-1">
                      Ingen faner åpne
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab Preview */}
            {hoveredTab && browserInstance && !isFullscreen && (() => {
              const tab = browserInstance.tabs.find(t => t.id === hoveredTab);
              return tab ? (
                <TabPreview
                  tab={tab}
                  position={hoverPosition}
                  isActive={hoveredTab === activeTab?.id}
                />
              ) : null;
            })()}

            {/* Navigation Bar */}
            {!isFullscreen && (
              <div className={`border-b ${isIncognito ? 'bg-zinc-800 border-zinc-700' : 'bg-card'}`}>
                <div className="flex items-center gap-2 px-3 py-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    disabled={!activeTab?.canGoBack}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleForward}
                    disabled={!activeTab?.canGoForward}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={isNavigating ? handleStop : handleReload}
                  >
                    {isNavigating ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <RotateCw className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleHome}
                  >
                    <Home className="h-4 w-4" />
                  </Button>

                  {/* URL Bar */}
                  <div 
                    ref={addressBarRef}
                    className="flex-1 relative flex items-center"
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  >
                    <Input
                      id="url-input"
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleNavigate();
                        }
                      }}
                      placeholder="Søk eller skriv inn adresse"
                      className={`pr-10 ${isIncognito ? 'bg-zinc-700 border-zinc-600 text-zinc-100' : ''}`}
                      data-testid="url-input"
                    />
                    {isIncognito && (
                      <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 bg-zinc-600 rounded text-xs text-zinc-200">
                        <EyeOff className="h-3 w-3" />
                        Inkognito
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={handleNavigate}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                    {showSuggestions && urlInput && (
                      <SearchSuggestions
                        query={urlInput}
                        isOpen={showSuggestions}
                        onClose={() => setShowSuggestions(false)}
                        anchorRef={addressBarRef}
                        onSelect={(url) => {
                          setUrlInput(url);
                          handleNavigate();
                          setShowSuggestions(false);
                        }}
                      />
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {/* Mode Toggle Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMode}
                      title={config.mode === 'massive' ? 'Bytt til floating modus' : 'Bytt til massive modus'}
                      className={config.mode === 'floating' ? 'bg-accent' : ''}
                    >
                      {config.mode === 'massive' ? (
                        <Maximize2 className="h-4 w-4" />
                      ) : (
                        <Minimize2 className="h-4 w-4" />
                      )}
                    </Button>
                    
                    {/* Sidebar Layout Selector */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Sidebar layouts"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Sidebar Oppsett</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => {
                            if (!config.left.collapsed) toggleSidebar('left');
                            if (!config.right.collapsed) toggleSidebar('right');
                          }}
                        >
                          <EyeOff className="mr-2 h-4 w-4" />
                          Skjul alle sidebars
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            if (config.left.collapsed) toggleSidebar('left');
                            if (!config.right.collapsed) toggleSidebar('right');
                          }}
                        >
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Kun venstre sidebar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            if (!config.left.collapsed) toggleSidebar('left');
                            if (config.right.collapsed) toggleSidebar('right');
                          }}
                        >
                          <ChevronRight className="mr-2 h-4 w-4" />
                          Kun høyre sidebar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            if (config.left.collapsed) toggleSidebar('left');
                            if (config.right.collapsed) toggleSidebar('right');
                          }}
                        >
                          <Layers className="mr-2 h-4 w-4" />
                          Begge sidebars
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowExtensionsAPI(!showExtensionsAPI)}
                      title="Extensions"
                    >
                      <Puzzle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPWAManager(!showPWAManager)}
                      title="PWA Manager"
                    >
                      <Package className="h-4 w-4" />
                    </Button>
                    
                    {/* Right Sidebar Toggle - Developer Tools */}
                    <Button
                      variant={showDevTools ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setShowDevTools(!showDevTools)}
                      title="Developer sidebar (høyre)"
                    >
                      <Code2 className="h-4 w-4" />
                    </Button>
                    
                    {/* Tools Panel Toggle Button */}
                    <Button
                      variant={!rightToolsCollapsed ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setRightToolsCollapsed(!rightToolsCollapsed)}
                      title="AI Assistent (Alt+T)"
                      data-testid="button-tools-panel"
                    >
                      <Bot className="h-4 w-4" />
                    </Button>
                    
                    <DownloadsManager />
                  </div>

                  {/* Browser Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleNewTab}>
                        <Plus className="mr-2 h-4 w-4" />
                        Ny fane
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowHistory(true)}>
                        <History className="mr-2 h-4 w-4" />
                        Historikk
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowBookmarksPanel(!showBookmarksPanel)}>
                        <BookmarkIcon className="mr-2 h-4 w-4" />
                        Bokmerker
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowPasswords(true)}>
                        <Key className="mr-2 h-4 w-4" />
                        Passord
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowDevTools(!showDevTools)}>
                        <Code2 className="mr-2 h-4 w-4" />
                        {showDevTools ? 'Skjul' : 'Vis'} utviklerverktøy
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleToggleFullscreen}>
                        {isFullscreen ? (
                          <>
                            <Minimize2 className="mr-2 h-4 w-4" />
                            Avslutt fullskjerm
                          </>
                        ) : (
                          <>
                            <Maximize2 className="mr-2 h-4 w-4" />
                            Fullskjerm
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleToggleIncognito}>
                        {isIncognito ? (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Avslutt inkognito
                          </>
                        ) : (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Ny inkognito-vindu
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                        <User className="mr-2 h-4 w-4" />
                        Min Profil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                        <Settings className="mr-2 h-4 w-4" />
                        Innstillinger
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
                
            {/* Bookmarks bar */}
            {!isFullscreen && showBookmarks && bookmarks.length > 0 && (
              <div className="flex items-center bg-accent/30 border-b border-border px-3 py-1 gap-2 overflow-x-auto">
                {bookmarks.map(bookmark => (
                  <Button
                    key={bookmark.id}
                    variant="ghost"
                    size="sm"
                    className="px-2 py-1 text-xs h-7 min-w-0 flex items-center gap-1"
                    onClick={() => handleBookmarkClick(bookmark.url)}
                    title={bookmark.url}
                    data-testid={`bookmark-${bookmark.id}`}
                  >
                    {bookmark.favicon && (
                      <img src={bookmark.favicon} alt="" className="w-3 h-3" />
                    )}
                    <span className="truncate max-w-[120px]">{bookmark.title}</span>
                  </Button>
                ))}
              </div>
            )}

            {/* Browser Viewport with integrated sidebars */}
            <div className={`flex-1 h-full ${config.mode === 'massive' ? 'flex' : 'relative'} bg-muted/5`}>
              {/* Left Dynamic Sidebar */}
              <SidebarWrapper side="left">
                <DynamicSidebar
                  side="left"
                  primary={config.left.primary}
                  secondary={config.left.secondary}
                  mode={config.left.mode}
                  onOpenWorkflowBuilder={() => setShowWorkflowBuilder(true)}
                    onCommand={(command) => {
                      // Execute browser commands from voice
                      if (command.toLowerCase().includes('gå til')) {
                        const url = command.replace(/gå til/i, '').trim();
                        if (activeTab) {
                          navigateMutation.mutate({ tabId: activeTab.id, url });
                        }
                      }
                      toast({
                        title: 'Voice kommando',
                        description: command
                      });
                    }}
                    onAISuggestion={(suggestion) => {
                      toast({
                        title: 'AI forslag',
                        description: suggestion
                      });
                    }}
                />
              </SidebarWrapper>

              {/* Main Browser Content */}
              <div className={`${config.mode === 'massive' ? 'flex-1' : 'w-full h-full'} relative bg-background`}>
                  {activeTab ? (
                  <>
                    {isNavigating && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <p className="text-sm text-muted-foreground">Laster...</p>
                        </div>
                      </div>
                    )}
                    <div
                      className="w-full h-full origin-top-left"
                      style={{ 
                        transform: `scale(${zoomLevel / 100})`,
                        width: `${100 * (100 / zoomLevel)}%`,
                        height: `${100 * (100 / zoomLevel)}%`
                      }}
                    >
                      {activeTab.url === 'about:home' ? (
                        <BrowserStartPage
                          onNavigate={(url) => {
                            setUrlInput(url);
                            if (browserInstance && activeTab) {
                              navigateMutation.mutate({ tabId: activeTab.id, url });
                            }
                          }}
                          onStartWorkflow={() => {
                            setShowWorkflowBuilder(true);
                          }}
                          onOpenSettings={() => {
                            window.location.href = '/settings';
                          }}
                        />
                      ) : (
                        <WebView
                          url={activeTab.url}
                          onUrlChange={(newUrl) => {
                            setUrlInput(newUrl);
                            if (browserInstance) {
                              const updatedTabs = browserInstance.tabs.map(tab => 
                                tab.id === activeTab.id ? { ...tab, url: newUrl } : tab
                              );
                              setBrowserInstance({
                                ...browserInstance,
                                tabs: updatedTabs
                              });
                            }
                          }}
                          onTitleChange={(newTitle) => {
                            if (browserInstance) {
                              const updatedTabs = browserInstance.tabs.map(tab => 
                                tab.id === activeTab.id ? { ...tab, title: newTitle } : tab
                              );
                              setBrowserInstance({
                                ...browserInstance,
                                tabs: updatedTabs
                              });
                              setActiveTab(prev => prev ? { ...prev, title: newTitle } : null);
                            }
                          }}
                          onLoadStart={() => {
                            setIsNavigating(true);
                          }}
                          onLoadEnd={() => {
                            setIsNavigating(false);
                          }}
                          onError={(error) => {
                            toast({
                              title: 'Innlastingsfeil',
                              description: error,
                              variant: 'destructive'
                            });
                          }}
                          isActive={true}
                          tabId={activeTab.id}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">Ingen fane åpen</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Trykk Ctrl+T for å åpne en ny fane
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Dynamic Sidebar */}
              <SidebarWrapper side="right">
                <DynamicSidebar
                  side="right"
                  primary={config.right.primary}
                  secondary={config.right.secondary}
                  mode={config.right.mode}
                  onExportData={(format) => {
                      // Export browser data
                      const browserData = {
                        url: activeTab?.url,
                        title: activeTab?.title,
                        timestamp: new Date().toISOString()
                      };
                      toast({
                        title: 'Eksporterer browser data',
                        description: `Format: ${format}`
                      });
                    }}
                    onRefreshData={() => {
                      // Refresh current page
                      if (activeTab) {
                        handleReload();
                      }
                    }}
                    onCodeGenerate={(type) => {
                      // Generate code based on current page
                      if (type === 'scraper' && activeTab) {
                        toast({
                          title: 'Genererer scraper kode',
                          description: `For: ${activeTab.url}`
                        });
                      }
                    }}
                />
              </SidebarWrapper>
            </div>
        </TabsContent>

        {/* Workflow */}
        <TabsContent value="workflow" className="flex-1">
          <div className="h-full flex">
            {/* Left Sidebar */}
            <CollapsibleSidebar
              side="left"
              width="w-80"
              defaultCollapsed={false}
            >
              <LeftWorkflowSidebar
                onOpenWorkflowBuilder={() => setShowWorkflowBuilder(true)}
                onCommand={(command) => {
                  toast({
                    title: 'Voice kommando',
                    description: command
                  });
                }}
                onAISuggestion={(suggestion) => {
                  toast({
                    title: 'AI forslag',
                    description: suggestion
                  });
                }}
              />
            </CollapsibleSidebar>
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h2 className="text-2xl font-bold">Workflow Automatisering</h2>
                  <p className="text-muted-foreground">Bygg kraftige workflows med visuell editor, AI-assistanse og voice kontroll</p>
                </div>
                <Button
                  onClick={() => setShowWorkflowBuilder(true)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Åpne Visual Workflow Builder
                </Button>
              </div>
              <div className="flex-1">
                <WorkflowManager />
              </div>
            </div>
            
            {/* Right Sidebar */}
            <CollapsibleSidebar
              side="right"
              width="w-96"
              defaultCollapsed={false}
            >
              <RightDeveloperSidebar
                onExportData={(format) => {
                  toast({
                    title: 'Eksporterer data',
                    description: `Format: ${format}`
                  });
                }}
                onRefreshData={() => {
                  toast({
                    title: 'Oppdaterer',
                    description: 'Henter siste data...'
                  });
                }}
                onCodeGenerate={(type) => {
                  toast({
                    title: 'Genererer kode',
                    description: `Type: ${type}`
                  });
                }}
              />
            </CollapsibleSidebar>
          </div>
        </TabsContent>

        <TabsContent value="data" className="flex-1">
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Database className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg font-medium">Data Dashboard</p>
              <p className="text-sm mt-2">Se og analyser innsamlede data</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="session" className="flex-1">
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <History className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg font-medium">Session Replay</p>
              <p className="text-sm mt-2">Spill av og analyser tidligere økter</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="devbridge" className="flex-1">
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileCode2 className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg font-medium">DevBridge</p>
              <p className="text-sm mt-2">Integrer med eksterne utviklingsverktøy</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="work-orders" className="flex-1">
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg font-medium">Work Orders</p>
              <p className="text-sm mt-2">Administrer arbeidsordre og oppgaver</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="flex-1">
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Shield className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg font-medium">Privacy</p>
              <p className="text-sm mt-2">Personvern og sikkerhet innstillinger</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="adr-risk" className="flex-1">
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Activity className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg font-medium">ADR & Risk</p>
              <p className="text-sm mt-2">Architecture Decision Records og risikovurdering</p>
            </div>
          </div>
        </TabsContent>

        {/* AI & Testing */}
        <TabsContent value="ai-testing" className="flex-1">
          <AITesting />
        </TabsContent>

        {/* Productivity Insights */}
        <TabsContent value="productivity" className="flex-1 p-0">
          <ProductivityInsights />
        </TabsContent>

        {/* Vibecoding Platform Tab */}
        <TabsContent value="vibecoding" className="flex-1 p-0">
          <VibePlatform />
        </TabsContent>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="flex-1 p-0">
          <Marketplace />
        </TabsContent>

        {/* Outreach Tab */}
        <TabsContent value="outreach" className="flex-1 p-0">
          <OutreachHub />
        </TabsContent>

        {/* Agent Team Tab */}
        <TabsContent value="agent-team" className="flex-1 p-0">
          <MultiAgentTeam />
        </TabsContent>

      </Tabs>
      
      {/* Floating panels */}
      {showHistory && (
        <HistoryPanel 
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          onNavigate={(url) => {
            if (activeTab) {
              setUrlInput(url);
              navigateMutation.mutate({ tabId: activeTab.id, url });
            }
          }}
        />
      )}

      {showPasswords && (
        <div className="fixed top-0 right-0 w-96 h-full bg-background border-l shadow-lg z-50">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold">Passordbehandling</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPasswords(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <PasswordManager
            currentDomain={activeTab?.url ? new URL(activeTab.url).hostname : undefined}
            onAutoFill={(username, password) => {
              // Handle autofill
              toast({
                title: 'Autofyll aktivert',
                description: 'Passord fylt ut i skjema',
              });
            }}
          />
        </div>
      )}


      {showExtensionsAPI && (
        <div className="fixed top-0 right-0 w-96 h-full bg-background border-l shadow-lg z-50">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold">Extensions API</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowExtensionsAPI(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ExtensionsAPI />
        </div>
      )}

      {showPWAManager && (
        <div className="fixed top-0 right-0 w-[500px] h-full bg-background border-l shadow-lg z-50">
          <PWAManager onClose={() => setShowPWAManager(false)} />
        </div>
      )}


      {/* Workflow Builder Modal */}
      {showWorkflowBuilder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg w-full max-w-7xl h-[90vh] overflow-hidden">
            <div className="relative h-full">
              <Button
                className="absolute top-4 right-4 z-10"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowWorkflowBuilder(false);
                  setSelectedWorkflowId(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <WorkflowBuilder />
            </div>
          </div>
        </div>
      )}



      {showFindBar && (
        <FindBar
          isOpen={showFindBar}
          onClose={() => setShowFindBar(false)}
          onFind={handleFind}
        />
      )}

      {showReaderMode && activeTab && (
        <ReaderMode
          url={activeTab.url}
          title={activeTab.title}
          isOpen={showReaderMode}
          onClose={() => setShowReaderMode(false)}
        />
      )}

      {showMediaControls && (
        <MediaControls isOpen={showMediaControls} onClose={() => setShowMediaControls(false)} />
      )}

      {showExtensions && (
        <Extensions isOpen={showExtensions} onClose={() => setShowExtensions(false)} />
      )}

      {showPerformance && (
        <PerformanceMonitor isOpen={showPerformance} onClose={() => setShowPerformance(false)} />
      )}

      {showNetworkLayer && (
        <NetworkLayer
          isOpen={showNetworkLayer}
          onClose={() => setShowNetworkLayer(false)}
        />
      )}

      {showSecurity && (
        <SecuritySandbox
          isOpen={showSecurity}
          onClose={() => setShowSecurity(false)}
        />
      )}

      {showWebAPIs && (
        <WebAPIs
          isOpen={showWebAPIs}
          onClose={() => setShowWebAPIs(false)}
        />
      )}

      {showRenderingEngine && (
        <RenderingEngine
          isOpen={showRenderingEngine}
          onClose={() => setShowRenderingEngine(false)}
        />
      )}
      
      {/* AI Chat Overlay - vises kun hvis ikke i sidemenyene */}
      <AIChatOverlay />
      </div>
    </div>
  );
}