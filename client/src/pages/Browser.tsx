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
  Wifi
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
  const [showBookmarks, setShowBookmarks] = useState(true);
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
      // Lagre lukket fane for senere gjenoppretting
      const closedTab = browserInstance.tabs.find(tab => tab.id === tabId);
      if (closedTab) {
        const recentlyClosed = JSON.parse(localStorage.getItem('recently_closed_tabs') || '[]');
        recentlyClosed.unshift({
          id: closedTab.id,
          title: closedTab.title,
          url: closedTab.url,
          favicon: closedTab.favicon
        });
        // Behold maks 10 nylig lukkede faner
        localStorage.setItem('recently_closed_tabs', JSON.stringify(recentlyClosed.slice(0, 10)));
      }
      
      await apiRequest(
        'DELETE',
        `/api/browser-engine/instance/${browserInstance.id}/tab/${tabId}`
      );
      
      const remainingTabs = browserInstance.tabs.filter(tab => tab.id !== tabId);
      
      if (remainingTabs.length === 0) {
        // Create new tab if closing last one
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
        // Remove bookmark
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
        // Add bookmark
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
    
    // Re-initialize browser with new incognito state
    if (browserInstance) {
      // Close current instance
      await apiRequest('DELETE', `/api/browser-engine/instance/${browserInstance.id}`);
      setBrowserInstance(null);
      setActiveTab(null);
      
      // Create new instance with incognito mode
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
  
  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  // Show/hide fullscreen bar on mouse move
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
    // In a real implementation, this would search the iframe content
    // For now, we'll just show a toast
    toast({
      title: 'Søker...',
      description: `Søker etter "${query}"${direction ? ` (${direction === 'next' ? 'neste' : 'forrige'})` : ''}`,
    });
  };

  return (
    <div className={`flex ${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen'} ${isIncognito ? 'bg-zinc-900' : 'bg-background'}`}>
      {/* Tab Groups Panel */}
      {showTabGroups && browserInstance && !isFullscreen && (
        <TabGroups
          tabs={browserInstance.tabs.map(tab => ({
            ...tab,
            groupId: undefined
          }))}
          groups={tabGroups}
          activeTabId={activeTab?.id}
          onGroupCreate={(group) => {
            const newGroup = {
              ...group,
              id: `group-${Date.now()}`,
              tabs: []
            };
            setTabGroups(prev => [...prev, newGroup]);
          }}
          onGroupUpdate={(groupId, updates) => {
            setTabGroups(prev => prev.map(g => 
              g.id === groupId ? { ...g, ...updates } : g
            ));
          }}
          onGroupDelete={(groupId) => {
            setTabGroups(prev => prev.filter(g => g.id !== groupId));
          }}
          onTabMove={(tabId, groupId) => {
            toast({
              title: 'Fane flyttet',
              description: groupId ? 'Fane lagt til gruppe' : 'Fane fjernet fra gruppe',
            });
          }}
          onTabSwitch={handleTabSwitch}
          onTabClose={handleCloseTab}
        />
      )}
      
      <div className="flex-1 flex flex-col">
      {/* Fullscreen Navigation Bar */}
      {isFullscreen && showFullscreenBar && (
        <div className="absolute top-0 left-0 right-0 bg-card/95 backdrop-blur border-b z-50 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 p-2">
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
              onClick={handleReload}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <div className="flex-1 mx-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleNavigate();
                  }
                }}
                className="h-8"
                placeholder="Søk eller skriv inn adresse"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFullscreen}
              title="Avslutt fullskjerm (F11)"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Incognito Indicator */}
      {isIncognito && (
        <div className="bg-purple-900 text-white px-3 py-1 text-xs flex items-center gap-2">
          <EyeOff className="w-3 h-3" />
          <span>Du er i inkognitomodus - Historikk og cookies vil ikke bli lagret</span>
        </div>
      )}
      
      {/* Browser Header */}
      {!isFullscreen && (
      <div className={`border-b ${isIncognito ? 'bg-zinc-800 border-zinc-700' : 'bg-card'}`}>
        {/* Tab Bar */}
        <div className={`flex items-center gap-1 p-1 min-h-[40px] ${isIncognito ? 'bg-zinc-700' : 'bg-muted/50'}`}>
          {browserInstance?.tabs.map((tab) => (
            <div
              key={tab.id}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer
                max-w-[200px] group relative
                ${tab.id === activeTab?.id 
                  ? isIncognito 
                    ? 'bg-zinc-800 border-t border-l border-r border-zinc-600 text-white' 
                    : 'bg-card border-t border-l border-r' 
                  : isIncognito 
                    ? 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'
                    : 'bg-muted hover:bg-muted/80'
                }
              `}
              onClick={() => handleTabSwitch(tab.id)}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const timeout = setTimeout(() => {
                  setHoveredTab(tab.id);
                  setHoverPosition({ 
                    x: rect.left + rect.width / 2 - 160, 
                    y: rect.bottom 
                  });
                }, 500);
                setHoverTimeout(timeout);
              }}
              onMouseLeave={() => {
                if (hoverTimeout) {
                  clearTimeout(hoverTimeout);
                  setHoverTimeout(null);
                }
                setHoveredTab(null);
              }}
            >
              {tab.favicon ? (
                <img src={tab.favicon} alt="" className="w-4 h-4" />
              ) : (
                <Globe className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-sm truncate flex-1">
                {tab.title || 'Ny fane'}
              </span>
              {tab.isLoading && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTab(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 rounded p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={handleNewTab}
            className="flex items-center justify-center w-8 h-8 hover:bg-accent rounded-lg transition-colors ml-1"
            title="Åpne ny fane (Ctrl+T)"
            data-testid="button-new-tab"
          >
            <Plus className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {/* Navigation Bar */}
        <div className={`flex items-center gap-2 p-2 ${isIncognito ? 'bg-zinc-800' : ''}`}>
          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              disabled={!activeTab?.canGoBack}
              title="Tilbake (Alt+←)"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleForward}
              disabled={!activeTab?.canGoForward}
              title="Fremover (Alt+→)"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={isNavigating ? handleStop : handleReload}
              title={isNavigating ? "Stopp (Esc)" : "Last på nytt (Ctrl+R)"}
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
              title="Hjem"
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>

          {/* Address Bar */}
          <div className="flex-1 flex items-center gap-2">
            <div ref={addressBarRef} className="relative flex-1 flex items-center">
              {activeTab?.url?.startsWith('https://') && (
                <Shield className="absolute left-3 h-4 w-4 text-green-600" />
              )}
              <Input
                id="url-input"
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setShowSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => setShowSuggestions(urlInput.length > 0)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !showSuggestions) {
                    handleNavigate();
                  }
                }}
                placeholder="Skriv inn URL eller søk..."
                className={`${activeTab?.url?.startsWith('https://') ? 'pl-10' : 'pl-3'} pr-10`}
              />
              {isNavigating ? (
                <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Search 
                  className="absolute right-3 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={handleNavigate}
                />
              )}
              
              {/* Search Suggestions */}
              <SearchSuggestions
                query={urlInput}
                isOpen={showSuggestions}
                onSelect={(url) => {
                  setUrlInput(url);
                  setShowSuggestions(false);
                  if (activeTab) {
                    navigateMutation.mutate({ tabId: activeTab.id, url });
                  }
                }}
                onClose={() => setShowSuggestions(false)}
                anchorRef={addressBarRef}
              />
            </div>
          </div>
          
          {/* Bookmark controls */}
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
              onClick={() => setShowBookmarks(!showBookmarks)}
              title="Vis/skjul bokmerker (Ctrl+Shift+B)"
            >
              <BookmarkIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTabGroups(!showTabGroups)}
              title="Fanegrupper"
            >
              <Folder className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowReaderMode(true)}
              title="Lesemodus"
              disabled={!activeTab?.url || activeTab.url === 'about:blank'}
            >
              <BookOpen className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMediaControls(true)}
              title="Mediakontroller"
              disabled={!activeTab?.url || activeTab.url === 'about:blank'}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowExtensions(true)}
              title="Utvidelser"
            >
              <Puzzle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPerformance(true)}
              title="Ytelsesovervåking"
            >
              <Activity className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNetworkLayer(true)}
              title="Nettverkslag"
            >
              <Wifi className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSecurity(true)}
              title="Sikkerhet"
            >
              <Shield className="h-4 w-4" />
            </Button>
            <SessionRestore
              currentTabs={browserInstance?.tabs.map(tab => ({
                id: tab.id,
                title: tab.title,
                url: tab.url,
                favicon: tab.favicon
              })) || []}
              onRestoreSession={(session) => {
                // Gjenopprett alle faner fra økten
                session.tabs.forEach((tab, index) => {
                  if (index === 0 && activeTab) {
                    // Bruk eksisterende fane for første URL
                    navigateMutation.mutate({ tabId: activeTab.id, url: tab.url });
                  } else {
                    // Opprett nye faner for resten
                    apiRequest(
                      '/api/browser-engine/tab/create',
                      'POST',
                      {
                        instanceId: browserInstance?.id,
                        url: tab.url
                      }
                    );
                  }
                });
                toast({
                  title: 'Økt gjenopprettet',
                  description: `${session.tabs.length} ${session.tabs.length === 1 ? 'fane' : 'faner'} ble gjenopprettet`,
                });
              }}
            />
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
              <DropdownMenuItem 
                onClick={() => {
                  if (activeTab?.id) {
                    apiRequest(
                      'POST',
                      '/api/browser-engine/tab/duplicate',
                      {
                        instanceId: browserInstance?.id,
                        tabId: activeTab.id
                      }
                    );
                  }
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Dupliser fane
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Star className="mr-2 h-4 w-4" />
                Bokmerker
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowHistory(true)}>
                <History className="mr-2 h-4 w-4" />
                Historikk
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowPasswords(true)}>
                <Key className="mr-2 h-4 w-4" />
                Passord
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDevTools(!showDevTools)}>
                <Code2 className="mr-2 h-4 w-4" />
                {showDevTools ? 'Skjul' : 'Vis'} utviklerverktøy (F12)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleFullscreen}>
                {isFullscreen ? (
                  <>
                    <Minimize2 className="mr-2 h-4 w-4" />
                    Avslutt fullskjerm (F11)
                  </>
                ) : (
                  <>
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Fullskjerm (F11)
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Skriv ut (Ctrl+P)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowFindBar(true)}>
                <SearchIcon className="mr-2 h-4 w-4" />
                Finn på siden (Ctrl+F)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleZoomIn}>
                <ZoomIn className="mr-2 h-4 w-4" />
                Zoom inn (Ctrl++)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleZoomOut}>
                <ZoomOut className="mr-2 h-4 w-4" />
                Zoom ut (Ctrl+-)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleZoomReset}>
                <span className="mr-2 text-xs font-mono w-4 text-center">100</span>
                Tilbakestill zoom (Ctrl+0)
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ExternalLink className="mr-2 h-4 w-4" />
                Åpne i nytt vindu
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
              <DropdownMenuItem 
                onClick={() => window.location.href = '/settings'}
              >
                <Settings className="mr-2 h-4 w-4" />
                Innstillinger
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={async () => {
                  // Simuler nedlasting for testing
                  await apiRequest('/api/downloads', 'POST', {
                    filename: 'test-dokument.pdf',
                    url: activeTab?.url || 'https://example.com/test.pdf',
                    size: 1024 * 1024 * 2, // 2MB
                    mimeType: 'application/pdf',
                    status: 'downloading'
                  });
                  toast({
                    title: 'Nedlasting startet',
                    description: 'test-dokument.pdf laster ned...'
                  });
                  
                  // Simuler fullført nedlasting etter 3 sekunder
                  setTimeout(async () => {
                    const downloads = await queryClient.fetchQuery<any[]>({
                      queryKey: ['/api/downloads']
                    });
                    const testDownload = downloads?.find(d => d.filename === 'test-dokument.pdf');
                    if (testDownload) {
                      await apiRequest(`/api/downloads/${testDownload.id}`, 'PATCH', {
                        status: 'completed'
                      });
                    }
                  }, 3000);
                }}
              >
                <Loader2 className="mr-2 h-4 w-4" />
                Test nedlasting
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Bookmarks bar */}
        {showBookmarks && bookmarks.length > 0 && (
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
      </div>
      )}

      {/* Browser Viewport */}
      <div className={`flex-1 ${showDevTools ? 'flex' : ''} relative bg-white`}>
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
                <div>
                  <p className="font-medium mb-2">Console</p>
                  <div className="bg-zinc-900 text-zinc-300 p-3 rounded font-mono text-xs h-32 overflow-auto">
                    <p className="text-zinc-500">// Console output vil vises her</p>
                    <p className="text-blue-400">[Info] Side lastet</p>
                    <p className="text-yellow-400">[Warning] Mixed content</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium mb-2">Nettverk</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between p-1 hover:bg-muted rounded">
                      <span>document</span>
                      <span className="text-green-600">200 OK</span>
                    </div>
                    <div className="flex justify-between p-1 hover:bg-muted rounded">
                      <span>style.css</span>
                      <span className="text-green-600">200 OK</span>
                    </div>
                    <div className="flex justify-between p-1 hover:bg-muted rounded">
                      <span>script.js</span>
                      <span className="text-green-600">200 OK</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-medium mb-2">Ytelse</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Lastetid: 1.23s</p>
                    <p>DOM klar: 0.45s</p>
                    <p>Ressurser: 15</p>
                    <p>Størrelse: 2.1 MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t bg-card px-3 py-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {activeTab ? (
              <>
                {isNavigating ? 'Laster...' : 'Klar'}
                {' • '}
                {activeTab.url}
              </>
            ) : (
              'Ingen fane åpen'
            )}
          </span>
          <div className="flex items-center gap-3">
            {zoomLevel !== 100 && (
              <button 
                onClick={handleZoomReset}
                className="hover:text-foreground cursor-pointer"
                title="Klikk for å tilbakestille zoom"
              >
                Zoom: {zoomLevel}%
              </button>
            )}
            <span>
              {browserInstance?.tabs.length || 0} {browserInstance?.tabs.length === 1 ? 'fane' : 'faner'}
            </span>
          </div>
        </div>
      </div>
      
      {/* History Panel */}
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

      {/* Password Manager */}
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
              // Inject auto-fill script into active tab
              if (activeTab && browserInstance) {
                const autoFillScript = `
                  (function() {
                    // Find all password fields
                    const passwordFields = document.querySelectorAll('input[type="password"]');
                    if (passwordFields.length > 0) {
                      passwordFields[0].value = '${password.replace(/'/g, "\\'")}';
                      
                      // Try to find username field
                      const passwordField = passwordFields[0];
                      const form = passwordField.closest('form');
                      
                      if (form) {
                        // Look for username input in same form
                        const usernameFields = form.querySelectorAll(
                          'input[type="text"], input[type="email"], input[name*="user"], input[name*="email"], input[name*="login"]'
                        );
                        
                        if (usernameFields.length > 0) {
                          usernameFields[0].value = '${username.replace(/'/g, "\\'")}';
                        }
                      } else {
                        // Try to find username field near password field
                        const allInputs = document.querySelectorAll('input[type="text"], input[type="email"]');
                        for (let input of allInputs) {
                          const rect1 = input.getBoundingClientRect();
                          const rect2 = passwordField.getBoundingClientRect();
                          const distance = Math.sqrt(
                            Math.pow(rect1.left - rect2.left, 2) + 
                            Math.pow(rect1.top - rect2.top, 2)
                          );
                          
                          // If input is within 200 pixels of password field, assume it's the username
                          if (distance < 200) {
                            input.value = '${username.replace(/'/g, "\\'")}';
                            break;
                          }
                        }
                      }
                      
                      // Trigger input events
                      passwordFields[0].dispatchEvent(new Event('input', { bubbles: true }));
                      passwordFields[0].dispatchEvent(new Event('change', { bubbles: true }));
                    }
                  })();
                `;
                
                apiRequest(
                  'POST',
                  '/api/browser-engine/tab/execute',
                  {
                    instanceId: browserInstance.id,
                    tabId: activeTab.id,
                    script: autoFillScript
                  }
                );
              }
            }}
          />
        </div>
      )}

      {/* Password Save Dialog */}
      {detectedFormData && (
        <div className="fixed bottom-4 right-4 w-96 p-4 bg-background border rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2 mb-3">
            <Key className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">Lagre passord?</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Vil du lagre passordet for {detectedFormData.username} på {detectedFormData.domain}?
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetectedFormData(null)}
            >
              Nei takk
            </Button>
            <Button
              size="sm"
              onClick={() => {
                // Save the password
                apiRequest(
                  '/api/saved-passwords',
                  'POST',
                  {
                    domain: detectedFormData.domain,
                    username: detectedFormData.username,
                    password: detectedFormData.password,
                    title: `${detectedFormData.username} på ${detectedFormData.domain}`,
                    favicon: activeTab?.favicon
                  }
                ).then(() => {
                  toast({
                    title: 'Passord lagret',
                    description: 'Passordet er trygt lagret i nettleseren',
                  });
                  setDetectedFormData(null);
                });
              }}
            >
              Lagre passord
            </Button>
          </div>
        </div>
      )}
      
      
      {/* Tab Preview */}
      {hoveredTab && browserInstance && (
        <TabPreview
          tab={browserInstance.tabs.find(t => t.id === hoveredTab)!}
          isActive={activeTab?.id === hoveredTab}
          position={hoverPosition}
        />
      )}
      
      {/* Find Bar */}
      <FindBar
        isOpen={showFindBar}
        onClose={() => setShowFindBar(false)}
        onFind={handleFind}
      />
      
      {/* Reader Mode */}
      <ReaderMode
        isOpen={showReaderMode}
        onClose={() => setShowReaderMode(false)}
        url={activeTab?.url || ''}
        title={activeTab?.title || ''}
      />
      
      {/* Media Controls */}
      <MediaControls
        isOpen={showMediaControls}
        onClose={() => setShowMediaControls(false)}
        currentTab={activeTab ? { url: activeTab.url, title: activeTab.title } : undefined}
      />
      
      {/* Extensions */}
      <Extensions
        isOpen={showExtensions}
        onClose={() => setShowExtensions(false)}
      />
      
      {/* Performance Monitor */}
      <PerformanceMonitor
        isOpen={showPerformance}
        onClose={() => setShowPerformance(false)}
        currentTab={activeTab ? { id: activeTab.id, title: activeTab.title, url: activeTab.url } : undefined}
      />
      
      {/* Network Layer */}
      <NetworkLayer
        isOpen={showNetworkLayer}
        onClose={() => setShowNetworkLayer(false)}
        tabId={activeTab?.id}
      />
      
      {/* Security Sandbox */}
      <SecuritySandbox
        isOpen={showSecurity}
        onClose={() => setShowSecurity(false)}
        tabId={activeTab?.id}
        url={activeTab?.url}
      />
      </div>
    </div>
  );
}