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
  Mic,
  Clock,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  const [browserInstance, setBrowserInstance] = useState<BrowserInstance | null>(null);
  const [activeTab, setActiveTab] = useState<BrowserTab | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
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
  const [showExtensionsAPI, setShowExtensionsAPI] = useState(false);
  const [showPWAManager, setShowPWAManager] = useState(false);
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
        setBrowserInstance({
          id: data.instanceId,
          tabs: [],
          activeTabId: ''
        });
        
        // Create initial tab
        await createNewTab(data.instanceId, 'https://www.google.com');
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
    onSuccess: () => {
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

  // Check if current page is bookmarked
  useEffect(() => {
    if (activeTab) {
      const isInBookmarks = bookmarks.some(b => b.url === activeTab.url);
      setIsBookmarked(isInBookmarks);
    }
  }, [activeTab, bookmarks]);
  
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
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 't') {
          e.preventDefault();
          handleNewTab();
        } else if (e.key === 'w') {
          e.preventDefault();
          handleCloseTab(activeTab?.id || '');
        } else if (e.key === 'l') {
          e.preventDefault();
          document.getElementById('url-input')?.focus();
        } else if (e.key === 'r') {
          e.preventDefault();
          handleReload();
        } else if (e.key === 'd') {
          e.preventDefault();
          handleBookmarkToggle();
        } else if (e.key === 'b' && e.shiftKey) {
          e.preventDefault();
          setShowBookmarks(!showBookmarks);
        } else if (e.key === 'n' && e.shiftKey) {
          e.preventDefault();
          handleToggleIncognito();
        } else if (e.key === 'h') {
          e.preventDefault();
          setShowHistory(!showHistory);
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
  }, [browserInstance, activeTab, showBookmarks, showHistory, showDevTools, isFullscreen, zoomLevel, showFindBar, showPasswords]);

  const createNewTab = async (instanceId: string, url: string) => {
    await createTabMutation.mutateAsync({ instanceId, url });
  };

  const handleNewTab = () => {
    if (browserInstance) {
      createNewTab(browserInstance.id, 'https://www.google.com');
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
        await createNewTab(browserInstance.id, 'https://www.google.com');
      } else {
        setBrowserInstance({
          ...browserInstance,
          tabs: remainingTabs,
          activeTabId: remainingTabs[0].id
        });
        setActiveTab(remainingTabs[0]);
        setUrlInput(remainingTabs[0].url);
      }
    } catch (error) {
      toast({
        title: 'Feil',
        description: 'Kunne ikke lukke fane',
        variant: 'destructive'
      });
    }
  };

  const handleTabSwitch = (tabId: string) => {
    const tab = browserInstance?.tabs.find(t => t.id === tabId);
    if (tab && browserInstance) {
      setActiveTab(tab);
      setUrlInput(tab.url);
      setBrowserInstance({
        ...browserInstance,
        activeTabId: tabId
      });
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

  const handleBack = () => {
    handleKeyboardShortcut.mutate('Alt+Left');
  };

  const handleForward = () => {
    handleKeyboardShortcut.mutate('Alt+Right');
  };

  const handleReload = () => {
    handleKeyboardShortcut.mutate('F5');
  };
  
  const handleBookmarkToggle = async () => {
    if (!activeTab || activeTab.url === 'about:blank') return;
    
    try {
      if (isBookmarked) {
        const bookmark = bookmarks.find(b => b.url === activeTab.url);
        if (bookmark) {
          await apiRequest('DELETE', `/api/bookmarks/${bookmark.id}`);
          setIsBookmarked(false);
          toast({
            title: 'Bokmerke fjernet',
            description: `${activeTab.title} ble fjernet fra bokmerker`,
          });
        }
      } else {
        await apiRequest('POST', '/api/bookmarks', {
          title: activeTab.title || activeTab.url,
          url: activeTab.url,
          favicon: activeTab.favicon
        });
        setIsBookmarked(true);
        toast({
          title: 'Bokmerke lagt til',
          description: `${activeTab.title} ble lagt til i bokmerker`,
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
    } catch (error) {
      toast({
        title: 'Feil',
        description: 'Kunne ikke oppdatere bokmerker',
        variant: 'destructive'
      });
    }
  };
  
  const handleBookmarkClick = (url: string) => {
    if (activeTab && browserInstance) {
      setUrlInput(url);
      navigateMutation.mutate({ tabId: activeTab.id, url });
    }
  };

  const handleStop = () => {
    handleKeyboardShortcut.mutate('Escape');
  };

  const handleHome = () => {
    if (activeTab) {
      navigateMutation.mutate({ tabId: activeTab.id, url: 'https://www.google.com' });
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
          <TabsTrigger value="browser" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Browser
          </TabsTrigger>
          <TabsTrigger value="vibecoding" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Vibecoding
          </TabsTrigger>
          <TabsTrigger value="agent-team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            AI Team
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="devbridge" className="flex items-center gap-2">
            <FileCode2 className="h-4 w-4" />
            DevBridge
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="ai-testing" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Testing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browser" className="flex-1 flex flex-col p-0 m-0">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBookmarkToggle}
                      title={isBookmarked ? "Fjern bokmerke (Ctrl+D)" : "Legg til bokmerke (Ctrl+D)"}
                      disabled={!activeTab || activeTab.url === 'about:blank'}
                    >
                      {isBookmarked ? (
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </Button>
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
                      <DropdownMenuItem onClick={() => setShowBookmarks(!showBookmarks)}>
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
                      <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                        <Settings className="mr-2 h-4 w-4" />
                        Innstillinger
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}

            {/* Browser Tabs Row */}
            {!isFullscreen && (
              <div className={`flex items-center border-b ${isIncognito ? 'bg-zinc-900 border-zinc-700' : 'bg-muted/20'} px-2 py-1`}>
                <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-thin">
                  {browserInstance && browserInstance.tabs.length > 0 ? (
                    browserInstance.tabs.map(tab => (
                      <div
                        key={tab.id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer min-w-[120px] max-w-[200px] group relative transition-all ${
                          activeTab?.id === tab.id 
                            ? 'bg-background border-t border-l border-r shadow-sm' 
                            : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
                        }`}
                        onClick={() => handleTabSwitch(tab.id)}
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
                        {tab.favicon ? (
                          <img src={tab.favicon} alt="" className="w-3 h-3 shrink-0" />
                        ) : (
                          <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                        )}
                        <span className="flex-1 text-xs truncate">
                          {tab.title || 'Ny fane'}
                        </span>
                        {tab.isLoading && (
                          <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                        )}
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
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground px-3 py-1">
                      Ingen faner åpne
                    </div>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 ml-1 shrink-0"
                  onClick={handleNewTab}
                  title="Ny fane (Ctrl+T)"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Tab Preview */}
            {hoveredTab && browserInstance && !isFullscreen && (
              <TabPreview
                tab={browserInstance.tabs.find(t => t.id === hoveredTab)!}
                position={hoverPosition}
                isActive={hoveredTab === activeTab?.id}
              />
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

            {/* Browser Viewport with sidebars */}
            <div className={`flex-1 relative bg-white`}>
              {/* Goal Tracker Sidebar - Left side */}
              {activeView === 'browser' && (
                <div className="absolute top-0 left-0 w-80 h-full border-r bg-card overflow-y-auto z-40">
                  <GoalTracker />
                </div>
              )}
              
              {/* Main Browser Content - Center */}
              <div className={`w-full h-full ${showDevTools ? 'flex' : ''} relative`}>
                <div className={`${showDevTools ? 'flex-1' : 'w-full h-full'} relative`}>
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
                
                {/* Developer Tools Panel */}
                {showDevTools && (
                  <div className="w-96 bg-card border-l flex flex-col">
                    <div className="p-3 border-b flex items-center justify-between">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Code2 className="w-4 h-4" />
                        Utviklerverktøy
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setShowDevTools(false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex-1 p-4 overflow-auto">
                      <div className="space-y-4 text-sm">
                        <div>
                          <p className="font-medium mb-2">Nåværende side</p>
                          <div className="space-y-1 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            <p><span className="font-medium">URL:</span> {activeTab?.url || 'N/A'}</p>
                            <p><span className="font-medium">Tittel:</span> {activeTab?.title || 'N/A'}</p>
                            <p><span className="font-medium">Status:</span> {activeTab?.isLoading ? 'Laster...' : 'Ferdig'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* AI Assistant Sidebar - Right side */}
              <div className="absolute top-0 right-0 w-[320px] h-full border-l bg-background flex flex-col z-40">
                <div className="h-[380px] border-b shadow-lg bg-gradient-to-b from-background to-muted/20">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-2 border-b bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Bot className="h-4 w-4 text-purple-500" />
                        AI Assistant
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-purple-500/20"
                        title="Speak Command"
                      >
                        <Mic className="h-3.5 w-3.5 text-purple-600" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <AIAssistant
                        currentUrl={activeTab?.url}
                        pageContent=""
                        onNavigate={(url) => {
                          if (activeTab) {
                            setUrlInput(url);
                            navigateMutation.mutate({ tabId: activeTab.id, url });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                {/* Workflow Suggestions */}
                <div className="flex-1 bg-muted/5 overflow-auto p-2">
                  <WorkflowSuggestions
                    currentUrl={activeTab?.url}
                    onSelectWorkflow={(workflow) => {
                      console.log('Selected workflow:', workflow);
                      // Handle workflow selection
                      toast({
                        title: "Workflow Started",
                        description: `Starting ${workflow.title}...`,
                      });
                    }}
                    maxSuggestions={3}
                  />
                </div>
              </div>
            </div>
        </TabsContent>

        {/* Workflow */}
        <TabsContent value="workflow" className="flex-1">
          <WorkflowManager />
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

        {/* Vibecoding Platform Tab */}
        <TabsContent value="vibecoding" className="flex-1 p-0">
          <VibePlatform />
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
      </div>
    </div>
  );
}