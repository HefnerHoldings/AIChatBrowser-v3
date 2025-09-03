import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
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
  Copy,
  ExternalLink,
  ChevronDown
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

export default function Browser() {
  const { toast } = useToast();
  const [browserInstance, setBrowserInstance] = useState<BrowserInstance | null>(null);
  const [activeTab, setActiveTab] = useState<BrowserTab | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize browser instance
  const initBrowser = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        'POST',
        '/api/browser-engine/instance',
        {
          type: 'chromium',
          isIncognito: false
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
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [browserInstance, activeTab]);

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

  const handleStop = () => {
    handleKeyboardShortcut.mutate('Escape');
  };

  const handleHome = () => {
    if (activeTab) {
      navigateMutation.mutate({ tabId: activeTab.id, url: 'https://www.google.com' });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Browser Header */}
      <div className="border-b bg-card">
        {/* Tab Bar */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 min-h-[40px]">
          {browserInstance?.tabs.map((tab) => (
            <div
              key={tab.id}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer
                max-w-[200px] group relative
                ${tab.id === activeTab?.id 
                  ? 'bg-card border-t border-l border-r' 
                  : 'bg-muted hover:bg-muted/80'
                }
              `}
              onClick={() => handleTabSwitch(tab.id)}
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
            className="p-1.5 hover:bg-muted rounded"
            title="Ny fane (Ctrl+T)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center gap-2 p-2">
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
            <div className="relative flex-1 flex items-center">
              {activeTab?.url?.startsWith('https://') && (
                <Shield className="absolute left-3 h-4 w-4 text-green-600" />
              )}
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
            </div>
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
              <DropdownMenuItem>
                <ExternalLink className="mr-2 h-4 w-4" />
                Åpne i nytt vindu
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Browser Viewport */}
      <div className="flex-1 relative bg-white">
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
            <iframe
              ref={iframeRef}
              src={activeTab.url}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              title="Browser viewport"
            />
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
          <span>
            {browserInstance?.tabs.length || 0} {browserInstance?.tabs.length === 1 ? 'fane' : 'faner'}
          </span>
        </div>
      </div>
    </div>
  );
}