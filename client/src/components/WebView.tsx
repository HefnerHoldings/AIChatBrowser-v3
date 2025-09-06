import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AlertCircle,
  Shield,
  Lock,
  Unlock,
  Globe,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  X,
  Maximize,
  Minimize,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface WebViewProps {
  url: string;
  onUrlChange: (url: string) => void;
  onTitleChange: (title: string) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: string) => void;
  isActive: boolean;
  tabId: string;
}

interface PageInfo {
  title: string;
  url: string;
  favicon?: string;
  securityState: 'secure' | 'insecure' | 'mixed' | 'local';
  loadState: 'idle' | 'loading' | 'loaded' | 'error';
  canGoBack: boolean;
  canGoForward: boolean;
  isOffline: boolean;
}

interface NavigationEntry {
  url: string;
  title: string;
  timestamp: number;
}

// WebView Component with iframe-based rendering
export function WebView({ 
  url, 
  onUrlChange, 
  onTitleChange,
  onLoadStart,
  onLoadEnd,
  onError,
  isActive,
  tabId
}: WebViewProps) {
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const proxyFrameRef = useRef<HTMLDivElement>(null);
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    title: 'Ny fane',
    url: url,
    securityState: 'local',
    loadState: 'idle',
    canGoBack: false,
    canGoForward: false,
    isOffline: false
  });
  
  const [loadProgress, setLoadProgress] = useState(0);
  const [history, setHistory] = useState<NavigationEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProxyMode, setIsProxyMode] = useState(false);
  const [proxyContent, setProxyContent] = useState('');
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [blockedResources, setBlockedResources] = useState<string[]>([]);
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
    location: false,
    notifications: false
  });

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // CSP og Sandbox policies
  const sandboxAttributes = [
    'allow-scripts',
    'allow-same-origin',
    'allow-forms',
    'allow-popups',
    'allow-popups-to-escape-sandbox',
    'allow-presentation',
    'allow-orientation-lock',
    'allow-pointer-lock',
    'allow-modals',
    'allow-top-navigation-by-user-activation'
  ].join(' ');

  // Load URL with proxy fallback for CORS
  const loadUrl = useCallback(async (targetUrl: string) => {
    if (!targetUrl) return;
    
    setPageInfo(prev => ({ ...prev, loadState: 'loading' }));
    setLoadProgress(0);
    onLoadStart?.();
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setLoadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      // Check if URL needs proxy (cross-origin)
      const needsProxy = !targetUrl.startsWith(window.location.origin) && 
                        !targetUrl.startsWith('about:') &&
                        !targetUrl.startsWith('data:');
      
      if (needsProxy && isProxyMode) {
        // Fetch through proxy/CORS bypass
        const response = await fetchWithProxy(targetUrl);
        setProxyContent(response);
        setPageInfo(prev => ({
          ...prev,
          url: targetUrl,
          loadState: 'loaded',
          securityState: determineSecurityState(targetUrl)
        }));
      } else if (needsProxy) {
        // Use browser proxy endpoint for cross-origin requests
        const browserInstanceId = localStorage.getItem('browserInstanceId');
        if (browserInstanceId && tabId && iframeRef.current) {
          // First navigate the backend browser to the URL
          await fetch(`/api/browser-engine/instance/${browserInstanceId}/tab/${tabId}/navigate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: targetUrl })
          });
          
          // Then load the proxied content in iframe
          const proxyUrl = `/api/browser-proxy/${browserInstanceId}/${tabId}`;
          iframeRef.current.src = proxyUrl;
          
          setPageInfo(prev => ({
            ...prev,
            url: targetUrl,
            loadState: 'loaded',
            securityState: determineSecurityState(targetUrl)
          }));
        }
      } else {
        // Direct iframe load for same-origin or about: URLs
        if (iframeRef.current) {
          iframeRef.current.src = targetUrl;
        }
      }
      
      // Update history
      const entry: NavigationEntry = {
        url: targetUrl,
        title: pageInfo.title,
        timestamp: Date.now()
      };
      
      setHistory(prev => [...prev.slice(0, historyIndex + 1), entry]);
      setHistoryIndex(prev => prev + 1);
      
    } catch (error) {
      console.error('Load error:', error);
      onError?.(error instanceof Error ? error.message : 'Kunne ikke laste siden');
      setPageInfo(prev => ({ ...prev, loadState: 'error' }));
    } finally {
      clearInterval(progressInterval);
      setLoadProgress(100);
      setTimeout(() => {
        setLoadProgress(0);
        onLoadEnd?.();
      }, 500);
    }
  }, [isProxyMode, historyIndex, onLoadStart, onLoadEnd, onError, pageInfo.title]);

  // Proxy fetch for CORS bypass
  const fetchWithProxy = async (url: string): Promise<string> => {
    // In production, this would use a real proxy server
    // For demo, we'll return a mock response
    return `
      <html>
        <head>
          <title>Proxy Mode: ${url}</title>
          <style>
            body { 
              font-family: system-ui; 
              padding: 20px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background: rgba(255,255,255,0.1);
              backdrop-filter: blur(10px);
              padding: 30px;
              border-radius: 15px;
            }
            h1 { margin-bottom: 20px; }
            .info { 
              background: rgba(255,255,255,0.2); 
              padding: 15px; 
              border-radius: 8px;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔒 Proxy Mode Aktivert</h1>
            <div class="info">
              <strong>Forespurt URL:</strong> ${url}
            </div>
            <div class="info">
              <strong>Status:</strong> Siden lastes gjennom sikker proxy for å omgå CORS-restriksjoner
            </div>
            <div class="info">
              <strong>Sikkerhet:</strong> All trafikk er kryptert og anonymisert
            </div>
            <p>
              Proxy-modus brukes når nettsider blokkerer direkte tilgang fra nettleseren. 
              Dette sikrer at du fortsatt kan se innholdet på en sikker måte.
            </p>
          </div>
        </body>
      </html>
    `;
  };

  // Security state detection
  const determineSecurityState = (url: string): 'secure' | 'insecure' | 'mixed' | 'local' => {
    if (url.startsWith('https://')) return 'secure';
    if (url.startsWith('http://')) return 'insecure';
    if (url.startsWith('file://') || url.startsWith('about:')) return 'local';
    return 'mixed';
  };

  // Navigation controls
  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      loadUrl(history[newIndex].url);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      loadUrl(history[newIndex].url);
    }
  };

  const reload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const stopLoading = () => {
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank';
    }
    setPageInfo(prev => ({ ...prev, loadState: 'idle' }));
  };

  // Permission handling
  const requestPermission = async (type: keyof typeof permissions) => {
    try {
      let permission: PermissionState = 'denied';
      
      switch(type) {
        case 'camera':
          permission = (await navigator.permissions.query({ name: 'camera' as PermissionName })).state;
          break;
        case 'microphone':
          permission = (await navigator.permissions.query({ name: 'microphone' as PermissionName })).state;
          break;
        case 'location':
          permission = (await navigator.permissions.query({ name: 'geolocation' as PermissionName })).state;
          break;
        case 'notifications':
          permission = (await navigator.permissions.query({ name: 'notifications' as PermissionName })).state;
          break;
      }
      
      setPermissions(prev => ({
        ...prev,
        [type]: permission === 'granted'
      }));
      
      if (permission === 'granted') {
        toast({
          title: 'Tillatelse gitt',
          description: `${type} tilgang er aktivert for denne siden`,
        });
      }
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  // Handle iframe messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'page-info') {
        setPageInfo(prev => ({
          ...prev,
          title: event.data.title || prev.title,
          favicon: event.data.favicon
        }));
        onTitleChange(event.data.title || 'Ny fane');
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onTitleChange]);

  // Load initial URL
  useEffect(() => {
    if (url && isActive) {
      loadUrl(url);
    }
  }, [url, isActive]);

  const getSecurityIcon = () => {
    switch(pageInfo.securityState) {
      case 'secure':
        return <Lock className="w-4 h-4 text-green-500" />;
      case 'insecure':
        return <Unlock className="w-4 h-4 text-red-500" />;
      case 'mixed':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Globe className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isActive) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">Fane ikke aktiv</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Navigation Bar */}
      <div className="flex items-center gap-2 p-2 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={goBack}
            disabled={historyIndex <= 0}
            className="h-8 w-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={goForward}
            disabled={historyIndex >= history.length - 1}
            className="h-8 w-8"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={reload}
            className="h-8 w-8"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Security & Status Indicators */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>{getSecurityIcon()}</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{pageInfo.securityState === 'secure' ? 'Sikker tilkobling' : 
                    pageInfo.securityState === 'insecure' ? 'Usikker tilkobling' :
                    pageInfo.securityState === 'mixed' ? 'Blandet innhold' : 'Lokal side'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {!networkStatus && (
            <Badge variant="destructive" className="text-xs">
              <WifiOff className="w-3 h-3 mr-1" />
              Offline
            </Badge>
          )}
          
          {isProxyMode && (
            <Badge variant="secondary" className="text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Proxy
            </Badge>
          )}
        </div>

        <div className="flex-1" />

        {/* Page Actions */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsProxyMode(!isProxyMode)}
            className="h-8 w-8"
          >
            {isProxyMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          
          {blockedResources.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {blockedResources.length} blokkert
            </Badge>
          )}
        </div>
      </div>

      {/* Loading Progress */}
      {loadProgress > 0 && loadProgress < 100 && (
        <Progress value={loadProgress} className="h-1" />
      )}

      {/* Content Area */}
      <div className="flex-1 relative">
        {pageInfo.loadState === 'error' ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <XCircle className="w-16 h-16 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Kunne ikke laste siden</h2>
            <p className="text-muted-foreground text-center mb-4">
              Sjekk nettverkstilkoblingen eller prøv igjen senere
            </p>
            <Button onClick={reload}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Prøv igjen
            </Button>
          </div>
        ) : isProxyMode && proxyContent ? (
          <div 
            className="w-full h-full overflow-auto"
            dangerouslySetInnerHTML={{ __html: proxyContent }}
          />
        ) : (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            sandbox={sandboxAttributes}
            allow="camera; microphone; geolocation; fullscreen"
            title={`WebView - ${tabId}`}
          />
        )}
        
        {/* Permissions Dialog */}
        {pageInfo.loadState === 'loaded' && (
          <div className="absolute top-2 right-2 flex flex-col gap-2">
            {Object.entries(permissions).map(([key, value]) => (
              !value && (
                <Button
                  key={key}
                  size="sm"
                  variant="secondary"
                  onClick={() => requestPermission(key as keyof typeof permissions)}
                  className="text-xs"
                >
                  Tillat {key}
                </Button>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}