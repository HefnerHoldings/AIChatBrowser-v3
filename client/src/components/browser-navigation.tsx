import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Bookmark,
  Star,
  Search,
  Shield,
  Lock,
  Globe,
  Menu,
  Download,
  Settings,
  History,
  X,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface BrowserTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isSecure: boolean;
}

interface BookmarkItem {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  folder?: string;
  createdAt: Date;
}

interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visitedAt: Date;
  visitCount: number;
}

export function BrowserNavigation() {
  const { toast } = useToast();
  const urlInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTabId, setActiveTabId] = useState("tab-1");
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: "tab-1",
      url: "https://www.madeasy.com",
      title: "MadEasy Browser - Home",
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      isSecure: true
    }
  ]);
  
  const [bookmarks] = useState<BookmarkItem[]>([
    {
      id: "bm-1",
      url: "https://github.com",
      title: "GitHub",
      folder: "Development",
      createdAt: new Date()
    },
    {
      id: "bm-2",
      url: "https://stackoverflow.com",
      title: "Stack Overflow",
      folder: "Development",
      createdAt: new Date()
    }
  ]);
  
  const [history] = useState<HistoryItem[]>([
    {
      id: "h-1",
      url: "https://www.google.com",
      title: "Google",
      visitedAt: new Date(Date.now() - 3600000),
      visitCount: 23
    },
    {
      id: "h-2",
      url: "https://www.github.com",
      title: "GitHub",
      visitedAt: new Date(Date.now() - 7200000),
      visitCount: 15
    }
  ]);
  
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const handleNavigate = async () => {
    if (!urlInput.trim()) return;
    
    // Add https:// if not present
    let url = urlInput;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    
    // Check if running in Electron
    if (window.electronAPI) {
      // Use Electron API for real browser navigation
      const result = await window.electronAPI.navigate(url);
      if (result.success && result.url) {
        setTabs(prev => prev.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, url: result.url || url, title: result.title || "Untitled", isLoading: false, isSecure: result.url?.startsWith("https") || false }
            : tab
        ));
        setUrlInput(result.url || url);
      }
    } else {
      // Use Puppeteer API for headless browser
      try {
        // Initialize browser if needed
        await fetch('/api/browser/init', { method: 'POST' });
        
        // Navigate to URL
        const response = await fetch('/api/browser/navigate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        
        const result = await response.json();
        if (result.success) {
          setTabs(prev => prev.map(tab => 
            tab.id === activeTabId 
              ? { ...tab, url: result.url, title: result.title, isLoading: false, isSecure: result.url.startsWith("https") }
              : tab
          ));
          setUrlInput(result.url);
          
          // Display screenshot if available
          if (result.screenshot) {
            // We could display this in the viewport
            console.log('Screenshot available:', result.screenshot.substring(0, 50) + '...');
          }
        }
      } catch (error) {
        console.error('Navigation error:', error);
        toast({
          title: "Navigation failed",
          description: "Could not navigate to the URL",
          variant: "destructive"
        });
      }
    }
    
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, url, isLoading: false, title: url }
        : tab
    ));
    
    // Simulate page load
    setTimeout(() => {
      setTabs(prev => prev.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, isLoading: false, title: new URL(url).hostname }
          : tab
      ));
      toast({
        title: "Page loaded",
        description: `Navigated to ${url}`,
      });
    }, 1000);
  };

  const handleBack = () => {
    toast({
      title: "Navigating back",
      description: "Going to previous page",
    });
  };

  const handleForward = () => {
    toast({
      title: "Navigating forward",
      description: "Going to next page",
    });
  };

  const handleRefresh = () => {
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, isLoading: true }
        : tab
    ));
    
    setTimeout(() => {
      setTabs(prev => prev.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, isLoading: false }
          : tab
      ));
      toast({
        title: "Page refreshed",
        description: "The page has been reloaded",
      });
    }, 500);
  };

  const handleHome = () => {
    setUrlInput("https://www.madeasy.com");
    handleNavigate();
  };

  const handleAddBookmark = () => {
    toast({
      title: "Bookmark added",
      description: `Added ${activeTab.title} to bookmarks`,
    });
  };

  const handleNewTab = () => {
    const newTab: BrowserTab = {
      id: `tab-${Date.now()}`,
      url: "about:blank",
      title: "New Tab",
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      isSecure: true
    };
    
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setUrlInput("");
  };

  const handleCloseTab = (tabId: string) => {
    if (tabs.length === 1) {
      toast({
        title: "Cannot close",
        description: "Cannot close the last tab",
        variant: "destructive"
      });
      return;
    }
    
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    
    if (activeTabId === tabId) {
      const newActiveTab = newTabs[Math.max(0, tabIndex - 1)];
      setActiveTabId(newActiveTab.id);
      setUrlInput(newActiveTab.url);
    }
  };

  return (
    <div className="space-y-2">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 bg-card/50 p-1 rounded-lg">
        <ScrollArea className="flex-1">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center gap-1 px-3 py-1.5 rounded cursor-pointer ${
                  activeTabId === tab.id ? "bg-background" : "hover:bg-card"
                }`}
                onClick={() => {
                  setActiveTabId(tab.id);
                  setUrlInput(tab.url);
                }}
              >
                {tab.isLoading ? (
                  <RotateCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Globe className="h-3 w-3" />
                )}
                <span className="text-xs max-w-[150px] truncate">{tab.title}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-destructive/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(tab.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Button size="sm" variant="ghost" onClick={handleNewTab}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Navigation Bar */}
      <Card>
        <CardContent className="p-2">
          <div className="flex items-center gap-2">
            {/* Navigation Buttons */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleBack}
                disabled={!activeTab.canGoBack}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleForward}
                disabled={!activeTab.canGoForward}
                data-testid="button-forward"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefresh}
                data-testid="button-refresh"
              >
                {activeTab.isLoading ? (
                  <X className="h-4 w-4" />
                ) : (
                  <RotateCw className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleHome}
                data-testid="button-home"
              >
                <Home className="h-4 w-4" />
              </Button>
            </div>

            {/* URL Bar */}
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {activeTab.isSecure ? (
                  <Lock className="h-3 w-3 text-green-500" />
                ) : (
                  <Shield className="h-3 w-3 text-yellow-500" />
                )}
              </div>
              <Input
                ref={urlInputRef}
                className="pl-8 pr-10 h-8 text-sm"
                placeholder="Enter URL or search..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleNavigate()}
                data-testid="input-url"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={handleNavigate}
              >
                <Search className="h-3 w-3" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAddBookmark}
                data-testid="button-bookmark"
              >
                <Star className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowBookmarks(!showBookmarks)}
                data-testid="button-bookmarks-menu"
              >
                <Bookmark className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowHistory(!showHistory)}
                data-testid="button-history"
              >
                <History className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                data-testid="button-downloads"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                data-testid="button-settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                data-testid="button-menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookmarks Panel */}
      {showBookmarks && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Bookmarks</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowBookmarks(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <ScrollArea className="h-[200px]">
              <div className="space-y-1">
                {bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => {
                      setUrlInput(bookmark.url);
                      handleNavigate();
                      setShowBookmarks(false);
                    }}
                  >
                    <Globe className="h-3 w-3" />
                    <div className="flex-1">
                      <div className="text-sm">{bookmark.title}</div>
                      <div className="text-xs text-muted-foreground">{bookmark.url}</div>
                    </div>
                    {bookmark.folder && (
                      <Badge variant="secondary" className="text-xs">
                        {bookmark.folder}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* History Panel */}
      {showHistory && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">History</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowHistory(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <ScrollArea className="h-[200px]">
              <div className="space-y-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => {
                      setUrlInput(item.url);
                      handleNavigate();
                      setShowHistory(false);
                    }}
                  >
                    <Globe className="h-3 w-3" />
                    <div className="flex-1">
                      <div className="text-sm">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.url} • Visited {item.visitCount} times
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.visitedAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}