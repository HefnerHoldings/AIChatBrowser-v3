import { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  WifiOff,
  Globe,
  Shield,
  Activity,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  Database,
  Cloud,
  Lock,
  Unlock,
  RefreshCw,
  Zap,
  BarChart2,
  Filter
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface NetworkRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  status: number;
  statusText: string;
  protocol: 'http/1.1' | 'http/2' | 'http/3' | 'websocket';
  size: number;
  time: number;
  type: string;
  headers: Record<string, string>;
  responseHeaders: Record<string, string>;
  body?: string;
  responseBody?: string;
  timestamp: number;
  cached: boolean;
  compressed: boolean;
  secure: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface WebSocketMessage {
  id: string;
  timestamp: number;
  direction: 'sent' | 'received';
  data: string;
  size: number;
  type: 'text' | 'binary' | 'ping' | 'pong' | 'close';
}

interface WebSocketConnection {
  id: string;
  url: string;
  state: 'connecting' | 'open' | 'closing' | 'closed';
  messages: WebSocketMessage[];
  startTime: number;
  endTime?: number;
  bytesSent: number;
  bytesReceived: number;
}

interface NetworkStats {
  totalRequests: number;
  totalSize: number;
  totalTime: number;
  cachedRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  bandwidth: {
    download: number;
    upload: number;
  };
  protocols: {
    http1: number;
    http2: number;
    http3: number;
    websocket: number;
  };
}

interface NetworkLayerProps {
  isOpen: boolean;
  onClose: () => void;
  tabId?: string;
}

export function NetworkLayer({ isOpen, onClose, tabId }: NetworkLayerProps) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [wsConnections, setWsConnections] = useState<WebSocketConnection[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null);
  const [selectedWs, setSelectedWs] = useState<WebSocketConnection | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(true);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [throttleEnabled, setThrottleEnabled] = useState(false);
  const [throttleSpeed, setThrottleSpeed] = useState('3g');
  const [stats, setStats] = useState<NetworkStats>({
    totalRequests: 0,
    totalSize: 0,
    totalTime: 0,
    cachedRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    bandwidth: { download: 0, upload: 0 },
    protocols: { http1: 0, http2: 0, http3: 0, websocket: 0 }
  });

  // Network throttling presets
  const throttlePresets = {
    'offline': { download: 0, upload: 0, latency: 0 },
    'slow-2g': { download: 50, upload: 20, latency: 2000 },
    '2g': { download: 250, upload: 50, latency: 1200 },
    '3g': { download: 750, upload: 250, latency: 200 },
    'fast-3g': { download: 1500, upload: 750, latency: 150 },
    '4g': { download: 4000, upload: 3000, latency: 70 },
    '5g': { download: 10000, upload: 5000, latency: 10 },
    'wifi': { download: 30000, upload: 15000, latency: 5 }
  };

  // Intercept and monitor network requests
  useEffect(() => {
    if (!isRecording || !isOpen) return;

    // Override fetch
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const startTime = performance.now();
      const [resource, config] = args;
      const url = typeof resource === 'string' ? resource : resource.url;
      const method = (config?.method || 'GET').toUpperCase();
      
      const requestId = `${Date.now()}-${Math.random()}`;
      const request: NetworkRequest = {
        id: requestId,
        url,
        method: method as NetworkRequest['method'],
        status: 0,
        statusText: 'Pending',
        protocol: 'http/1.1',
        size: 0,
        time: 0,
        type: 'fetch',
        headers: config?.headers || {},
        responseHeaders: {},
        body: config?.body ? JSON.stringify(config.body) : undefined,
        timestamp: Date.now(),
        cached: false,
        compressed: false,
        secure: url.startsWith('https'),
        priority: 'medium'
      };

      setRequests(prev => [...prev, request]);

      try {
        // Apply throttling if enabled
        if (throttleEnabled && throttlePresets[throttleSpeed]) {
          const preset = throttlePresets[throttleSpeed];
          await new Promise(resolve => setTimeout(resolve, preset.latency));
        }

        const response = await originalFetch.apply(this, args);
        const endTime = performance.now();
        
        // Clone response to read body
        const responseClone = response.clone();
        const responseText = await responseClone.text();
        
        // Update request with response data
        const updatedRequest: NetworkRequest = {
          ...request,
          status: response.status,
          statusText: response.statusText,
          time: endTime - startTime,
          size: responseText.length,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          responseBody: responseText,
          cached: response.headers.get('x-from-cache') === 'true',
          compressed: response.headers.get('content-encoding') === 'gzip'
        };

        setRequests(prev => prev.map(r => r.id === requestId ? updatedRequest : r));
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const updatedRequest: NetworkRequest = {
          ...request,
          status: 0,
          statusText: 'Failed',
          time: endTime - startTime
        };
        
        setRequests(prev => prev.map(r => r.id === requestId ? updatedRequest : r));
        throw error;
      }
    };

    // Override XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      
      let startTime: number;
      let requestData: NetworkRequest;
      
      xhr.open = function(...args) {
        const [method, url] = args;
        requestData = {
          id: `${Date.now()}-${Math.random()}`,
          url: url as string,
          method: method as NetworkRequest['method'],
          status: 0,
          statusText: 'Pending',
          protocol: 'http/1.1',
          size: 0,
          time: 0,
          type: 'xhr',
          headers: {},
          responseHeaders: {},
          timestamp: Date.now(),
          cached: false,
          compressed: false,
          secure: (url as string).startsWith('https'),
          priority: 'medium'
        };
        
        return originalOpen.apply(this, args);
      };
      
      xhr.send = function(body) {
        startTime = performance.now();
        
        if (body) {
          requestData.body = typeof body === 'string' ? body : JSON.stringify(body);
        }
        
        setRequests(prev => [...prev, requestData]);
        
        xhr.addEventListener('load', () => {
          const endTime = performance.now();
          const updatedRequest: NetworkRequest = {
            ...requestData,
            status: xhr.status,
            statusText: xhr.statusText,
            time: endTime - startTime,
            size: xhr.responseText.length,
            responseHeaders: xhr.getAllResponseHeaders().split('\n').reduce((acc, header) => {
              const [key, value] = header.split(':');
              if (key && value) acc[key.trim()] = value.trim();
              return acc;
            }, {} as Record<string, string>),
            responseBody: xhr.responseText
          };
          
          setRequests(prev => prev.map(r => r.id === requestData.id ? updatedRequest : r));
        });
        
        return originalSend.call(this, body);
      };
      
      return xhr;
    } as any;

    // WebSocket monitoring
    const originalWS = window.WebSocket;
    window.WebSocket = function(url: string, protocols?: string | string[]) {
      const ws = new originalWS(url, protocols);
      const connectionId = `${Date.now()}-${Math.random()}`;
      
      const connection: WebSocketConnection = {
        id: connectionId,
        url,
        state: 'connecting',
        messages: [],
        startTime: Date.now(),
        bytesSent: 0,
        bytesReceived: 0
      };
      
      setWsConnections(prev => [...prev, connection]);
      
      ws.addEventListener('open', () => {
        setWsConnections(prev => prev.map(c => 
          c.id === connectionId ? { ...c, state: 'open' } : c
        ));
      });
      
      ws.addEventListener('message', (event) => {
        const message: WebSocketMessage = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          direction: 'received',
          data: event.data,
          size: event.data.length,
          type: typeof event.data === 'string' ? 'text' : 'binary'
        };
        
        setWsConnections(prev => prev.map(c => 
          c.id === connectionId 
            ? { 
                ...c, 
                messages: [...c.messages, message],
                bytesReceived: c.bytesReceived + message.size 
              }
            : c
        ));
      });
      
      const originalSend = ws.send;
      ws.send = function(data) {
        const message: WebSocketMessage = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          direction: 'sent',
          data: typeof data === 'string' ? data : '[Binary Data]',
          size: typeof data === 'string' ? data.length : data.byteLength,
          type: typeof data === 'string' ? 'text' : 'binary'
        };
        
        setWsConnections(prev => prev.map(c => 
          c.id === connectionId 
            ? { 
                ...c, 
                messages: [...c.messages, message],
                bytesSent: c.bytesSent + message.size 
              }
            : c
        ));
        
        return originalSend.call(this, data);
      };
      
      ws.addEventListener('close', () => {
        setWsConnections(prev => prev.map(c => 
          c.id === connectionId 
            ? { ...c, state: 'closed', endTime: Date.now() } 
            : c
        ));
      });
      
      return ws;
    } as any;

    // Cleanup
    return () => {
      window.fetch = originalFetch;
      window.XMLHttpRequest = originalXHR;
      window.WebSocket = originalWS;
    };
  }, [isRecording, isOpen, throttleEnabled, throttleSpeed]);

  // Calculate statistics
  useEffect(() => {
    const newStats: NetworkStats = {
      totalRequests: requests.length,
      totalSize: requests.reduce((sum, r) => sum + r.size, 0),
      totalTime: requests.reduce((sum, r) => sum + r.time, 0),
      cachedRequests: requests.filter(r => r.cached).length,
      failedRequests: requests.filter(r => r.status === 0 || r.status >= 400).length,
      averageResponseTime: requests.length > 0 
        ? requests.reduce((sum, r) => sum + r.time, 0) / requests.length 
        : 0,
      bandwidth: {
        download: requests.reduce((sum, r) => sum + r.size, 0) / 1024,
        upload: requests.reduce((sum, r) => sum + (r.body?.length || 0), 0) / 1024
      },
      protocols: {
        http1: requests.filter(r => r.protocol === 'http/1.1').length,
        http2: requests.filter(r => r.protocol === 'http/2').length,
        http3: requests.filter(r => r.protocol === 'http/3').length,
        websocket: wsConnections.length
      }
    };
    
    setStats(newStats);
  }, [requests, wsConnections]);

  // Filter requests
  const filteredRequests = requests.filter(r => {
    if (showOnlyErrors && r.status < 400 && r.status !== 0) return false;
    if (searchQuery && !r.url.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    switch (filter) {
      case 'xhr': return r.type === 'xhr';
      case 'fetch': return r.type === 'fetch';
      case 'js': return r.url.endsWith('.js');
      case 'css': return r.url.endsWith('.css');
      case 'img': return /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(r.url);
      case 'media': return /\.(mp4|webm|ogg|mp3|wav)$/i.test(r.url);
      case 'ws': return false; // WebSocket filter shows ws tab
      default: return true;
    }
  });

  const clearRequests = () => {
    setRequests([]);
    setWsConnections([]);
    toast({
      title: 'Nettverkslogg tømt',
      description: 'Alle nettverksforespørsler er fjernet',
    });
  };

  const exportHAR = () => {
    const har = {
      log: {
        version: '1.2',
        creator: {
          name: 'MadEasy Browser',
          version: '1.0.0'
        },
        entries: requests.map(r => ({
          startedDateTime: new Date(r.timestamp).toISOString(),
          time: r.time,
          request: {
            method: r.method,
            url: r.url,
            headers: Object.entries(r.headers).map(([name, value]) => ({ name, value })),
            bodySize: r.body?.length || 0
          },
          response: {
            status: r.status,
            statusText: r.statusText,
            headers: Object.entries(r.responseHeaders).map(([name, value]) => ({ name, value })),
            content: {
              size: r.size,
              mimeType: r.responseHeaders['content-type'] || 'text/plain',
              text: r.responseBody
            }
          },
          cache: {
            beforeRequest: r.cached ? null : undefined,
            afterRequest: r.cached ? {} : undefined
          },
          timings: {
            send: 0,
            wait: r.time,
            receive: 0
          }
        }))
      }
    };
    
    const blob = new Blob([JSON.stringify(har, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-log-${Date.now()}.har`;
    a.click();
    
    toast({
      title: 'HAR fil eksportert',
      description: 'Nettverksloggen er lagret som HAR fil',
    });
  };

  const getStatusColor = (status: number) => {
    if (status === 0) return 'text-destructive';
    if (status < 300) return 'text-green-500';
    if (status < 400) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              Nettverkslag og protokoller
            </div>
            <div className="flex items-center gap-2">
              {isRecording ? (
                <Badge variant="destructive" className="animate-pulse">
                  <Activity className="w-3 h-3 mr-1" />
                  Opptak
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Activity className="w-3 h-3 mr-1" />
                  Stoppet
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Overvåk og analyser nettverksaktivitet, HTTP/HTTPS protokoller og WebSocket-tilkoblinger
          </DialogDescription>
        </DialogHeader>

        {/* Kontrollpanel */}
        <div className="flex items-center justify-between gap-4 pb-2 border-b">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isRecording ? 'destructive' : 'default'}
              onClick={() => setIsRecording(!isRecording)}
            >
              {isRecording ? (
                <>
                  <XCircle className="w-4 h-4 mr-1" />
                  Stopp
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 mr-1" />
                  Start
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={clearRequests}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Tøm
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={exportHAR}
            >
              <Download className="w-4 h-4 mr-1" />
              Eksporter HAR
            </Button>
            
            <div className="flex items-center gap-2 px-2 border-l">
              <Switch
                id="errors"
                checked={showOnlyErrors}
                onCheckedChange={setShowOnlyErrors}
              />
              <Label htmlFor="errors" className="text-sm">Kun feil</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="throttle"
                checked={throttleEnabled}
                onCheckedChange={setThrottleEnabled}
              />
              <Label htmlFor="throttle" className="text-sm">Throttle:</Label>
              <Select
                value={throttleSpeed}
                onValueChange={setThrottleSpeed}
                disabled={!throttleEnabled}
              >
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="slow-2g">Slow 2G</SelectItem>
                  <SelectItem value="2g">2G</SelectItem>
                  <SelectItem value="3g">3G</SelectItem>
                  <SelectItem value="fast-3g">Fast 3G</SelectItem>
                  <SelectItem value="4g">4G</SelectItem>
                  <SelectItem value="5g">5G</SelectItem>
                  <SelectItem value="wifi">WiFi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Input
              type="search"
              placeholder="Filtrer URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[200px] h-8"
            />
            
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="xhr">XHR</SelectItem>
                <SelectItem value="fetch">Fetch</SelectItem>
                <SelectItem value="js">JS</SelectItem>
                <SelectItem value="css">CSS</SelectItem>
                <SelectItem value="img">Bilder</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="ws">WebSocket</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistikk */}
        <div className="grid grid-cols-6 gap-2 py-2 border-b">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Forespørsler</p>
            <p className="text-lg font-semibold">{stats.totalRequests}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Overført</p>
            <p className="text-lg font-semibold">{formatSize(stats.totalSize)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Tid</p>
            <p className="text-lg font-semibold">{formatTime(stats.totalTime)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Cache</p>
            <p className="text-lg font-semibold">{stats.cachedRequests}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Feil</p>
            <p className="text-lg font-semibold text-destructive">{stats.failedRequests}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Gj.snitt</p>
            <p className="text-lg font-semibold">{formatTime(stats.averageResponseTime)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="requests" className="h-full flex flex-col">
            <TabsList className="grid w-fit grid-cols-3">
              <TabsTrigger value="requests">
                <Globe className="w-4 h-4 mr-2" />
                Forespørsler ({filteredRequests.length})
              </TabsTrigger>
              <TabsTrigger value="websocket">
                <Zap className="w-4 h-4 mr-2" />
                WebSocket ({wsConnections.length})
              </TabsTrigger>
              <TabsTrigger value="analysis">
                <BarChart2 className="w-4 h-4 mr-2" />
                Analyse
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="flex-1 overflow-hidden flex">
              <ScrollArea className="flex-1 border-r">
                <div className="p-2">
                  {filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`p-2 hover:bg-muted rounded cursor-pointer mb-1 ${
                        selectedRequest?.id === request.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedRequest(request)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {request.method}
                          </Badge>
                          <span className={`text-xs font-medium shrink-0 ${getStatusColor(request.status)}`}>
                            {request.status || '...'}
                          </span>
                          <p className="text-sm truncate">{request.url}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                          {request.cached && <Badge variant="secondary" className="text-xs">Cache</Badge>}
                          {request.secure && <Lock className="w-3 h-3" />}
                          <span>{formatSize(request.size)}</span>
                          <span>{formatTime(request.time)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              {selectedRequest && (
                <div className="w-[400px] p-4 overflow-auto">
                  <h3 className="font-semibold mb-3">Forespørselsdetaljer</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Generelt</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">URL:</span>
                          <span className="truncate ml-2" title={selectedRequest.url}>
                            {selectedRequest.url}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Metode:</span>
                          <span>{selectedRequest.method}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className={getStatusColor(selectedRequest.status)}>
                            {selectedRequest.status} {selectedRequest.statusText}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Protokoll:</span>
                          <span>{selectedRequest.protocol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tid:</span>
                          <span>{formatTime(selectedRequest.time)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Størrelse:</span>
                          <span>{formatSize(selectedRequest.size)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Request Headers</h4>
                      <div className="bg-muted p-2 rounded text-xs font-mono">
                        {Object.entries(selectedRequest.headers).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-primary">{key}:</span> {value}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Response Headers</h4>
                      <div className="bg-muted p-2 rounded text-xs font-mono">
                        {Object.entries(selectedRequest.responseHeaders).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-primary">{key}:</span> {value}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {selectedRequest.body && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Request Body</h4>
                        <ScrollArea className="h-[100px] bg-muted p-2 rounded">
                          <pre className="text-xs">{selectedRequest.body}</pre>
                        </ScrollArea>
                      </div>
                    )}
                    
                    {selectedRequest.responseBody && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Response Body</h4>
                        <ScrollArea className="h-[150px] bg-muted p-2 rounded">
                          <pre className="text-xs">{selectedRequest.responseBody}</pre>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="websocket" className="flex-1 overflow-hidden flex">
              <ScrollArea className="w-[300px] border-r">
                <div className="p-2">
                  {wsConnections.map((connection) => (
                    <div
                      key={connection.id}
                      className={`p-2 hover:bg-muted rounded cursor-pointer mb-1 ${
                        selectedWs?.id === connection.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedWs(connection)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm truncate">{connection.url}</p>
                        <Badge
                          variant={
                            connection.state === 'open' ? 'default' :
                            connection.state === 'closed' ? 'destructive' :
                            'secondary'
                          }
                          className="text-xs"
                        >
                          {connection.state}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{connection.messages.length} meldinger</span>
                        <span>
                          ↑ {formatSize(connection.bytesSent)} ↓ {formatSize(connection.bytesReceived)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              {selectedWs && (
                <div className="flex-1 flex flex-col">
                  <div className="p-3 border-b">
                    <h3 className="font-semibold">{selectedWs.url}</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Status: {selectedWs.state}</span>
                      <span>Meldinger: {selectedWs.messages.length}</span>
                      <span>Sendt: {formatSize(selectedWs.bytesSent)}</span>
                      <span>Mottatt: {formatSize(selectedWs.bytesReceived)}</span>
                    </div>
                  </div>
                  
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                      {selectedWs.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-2 rounded text-xs ${
                            message.direction === 'sent' 
                              ? 'bg-primary/10 ml-8' 
                              : 'bg-muted mr-8'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-xs">
                              {message.direction === 'sent' ? (
                                <><Upload className="w-3 h-3 mr-1" /> Sendt</>
                              ) : (
                                <><Download className="w-3 h-3 mr-1" /> Mottatt</>
                              )}
                            </Badge>
                            <span className="text-muted-foreground">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <pre className="mt-1 whitespace-pre-wrap break-all">
                            {message.data}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analysis" className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Protokollfordeling</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">HTTP/1.1</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(stats.protocols.http1 / stats.totalRequests) * 100} className="w-[100px]" />
                        <span className="text-sm">{stats.protocols.http1}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">HTTP/2</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(stats.protocols.http2 / stats.totalRequests) * 100} className="w-[100px]" />
                        <span className="text-sm">{stats.protocols.http2}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">HTTP/3</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(stats.protocols.http3 / stats.totalRequests) * 100} className="w-[100px]" />
                        <span className="text-sm">{stats.protocols.http3}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">WebSocket</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(stats.protocols.websocket / (stats.totalRequests + stats.protocols.websocket)) * 100} className="w-[100px]" />
                        <span className="text-sm">{stats.protocols.websocket}</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Båndbredde</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Nedlasting</span>
                        <span>{formatSize(stats.bandwidth.download * 1024)}</span>
                      </div>
                      <Progress value={Math.min(100, stats.bandwidth.download / 10)} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Opplasting</span>
                        <span>{formatSize(stats.bandwidth.upload * 1024)}</span>
                      </div>
                      <Progress value={Math.min(100, stats.bandwidth.upload / 10)} />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Cache-effektivitet</h3>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {stats.totalRequests > 0 
                          ? Math.round((stats.cachedRequests / stats.totalRequests) * 100)
                          : 0}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stats.cachedRequests} av {stats.totalRequests} fra cache
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Feilrate</h3>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${stats.failedRequests > 0 ? 'text-destructive' : 'text-green-500'}`}>
                        {stats.totalRequests > 0 
                          ? Math.round((stats.failedRequests / stats.totalRequests) * 100)
                          : 0}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stats.failedRequests} feilede forespørsler
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}