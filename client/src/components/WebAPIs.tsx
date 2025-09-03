import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Code,
  Database,
  HardDrive,
  Globe,
  Cpu,
  Wifi,
  MapPin,
  Camera,
  Mic,
  Video,
  FileText,
  Terminal,
  Zap,
  Activity,
  Clock,
  Package,
  Server,
  Cloud,
  Play,
  Pause,
  Square,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Layers,
  Monitor,
  Smartphone,
  Volume2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface DOMNode {
  id: string;
  tagName: string;
  className?: string;
  textContent?: string;
  attributes: Record<string, string>;
  children: DOMNode[];
  parentId?: string;
}

interface StorageItem {
  key: string;
  value: string;
  size: number;
  type: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'cookie';
  domain?: string;
  expires?: number;
}

interface WebWorker {
  id: string;
  name: string;
  type: 'dedicated' | 'shared' | 'service';
  status: 'active' | 'idle' | 'terminated';
  scriptUrl: string;
  memory: number;
  cpu: number;
  messages: number;
}

interface ConsoleLog {
  id: string;
  timestamp: number;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
  stack?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  description: string;
  category: 'timing' | 'resource' | 'paint' | 'layout';
}

interface MediaDevice {
  id: string;
  kind: 'videoinput' | 'audioinput' | 'audiooutput';
  label: string;
  active: boolean;
}

interface WebAPIsProps {
  isOpen: boolean;
  onClose: () => void;
  tabId?: string;
  url?: string;
}

export function WebAPIs({ isOpen, onClose, tabId, url }: WebAPIsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dom');
  const [domTree, setDomTree] = useState<DOMNode | null>(null);
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
  const [workers, setWorkers] = useState<WebWorker[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [mediaDevices, setMediaDevices] = useState<MediaDevice[]>([]);
  
  // JavaScript engine settings
  const [jsEnabled, setJsEnabled] = useState(true);
  const [webGLEnabled, setWebGLEnabled] = useState(true);
  const [wasmEnabled, setWasmEnabled] = useState(true);
  const [webWorkersEnabled, setWebWorkersEnabled] = useState(true);
  const [serviceWorkersEnabled, setServiceWorkersEnabled] = useState(true);
  
  // Console settings
  const [consoleFilter, setConsoleFilter] = useState('all');
  const [preserveLogs, setPreserveLogs] = useState(false);
  
  // DOM manipulation
  const [selectedNode, setSelectedNode] = useState<DOMNode | null>(null);
  const [jsCode, setJsCode] = useState('');
  const [cssCode, setCssCode] = useState('');

  // Initialize DOM tree
  useEffect(() => {
    if (!isOpen) return;

    // Sample DOM tree
    const sampleDom: DOMNode = {
      id: 'root',
      tagName: 'html',
      attributes: { lang: 'no' },
      children: [
        {
          id: 'head',
          tagName: 'head',
          attributes: {},
          children: [
            {
              id: 'title',
              tagName: 'title',
              textContent: 'MadEasy Browser',
              attributes: {},
              children: []
            }
          ]
        },
        {
          id: 'body',
          tagName: 'body',
          attributes: { class: 'dark' },
          children: [
            {
              id: 'main',
              tagName: 'main',
              attributes: { id: 'app' },
              children: []
            }
          ]
        }
      ]
    };
    
    setDomTree(sampleDom);
  }, [isOpen]);

  // Initialize storage items
  useEffect(() => {
    if (!isOpen) return;

    const fetchStorageData = () => {
      const items: StorageItem[] = [];
      
      // Get localStorage items
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key) || '';
            items.push({
              key,
              value,
              size: new Blob([value]).size,
              type: 'localStorage'
            });
          }
        }
      } catch (error) {
        console.error('Error reading localStorage:', error);
      }
      
      // Get sessionStorage items
      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            const value = sessionStorage.getItem(key) || '';
            items.push({
              key,
              value,
              size: new Blob([value]).size,
              type: 'sessionStorage'
            });
          }
        }
      } catch (error) {
        console.error('Error reading sessionStorage:', error);
      }
      
      // Get cookies
      try {
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
          const [key, value] = cookie.trim().split('=');
          if (key) {
            items.push({
              key,
              value: value || '',
              size: new Blob([cookie]).size,
              type: 'cookie',
              domain: window.location.hostname
            });
          }
        });
      } catch (error) {
        console.error('Error reading cookies:', error);
      }
      
      setStorageItems(items);
    };

    fetchStorageData();
    
    // Monitor storage changes
    const handleStorageChange = (e: StorageEvent) => {
      fetchStorageData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isOpen]);

  // Monitor console logs
  useEffect(() => {
    if (!isOpen) return;

    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalDebug = console.debug;

    const captureLog = (level: ConsoleLog['level'], ...args: any[]) => {
      const log: ConsoleLog = {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        level,
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '),
        source: url
      };
      
      if (level === 'error' && args[0] instanceof Error) {
        log.stack = args[0].stack;
      }
      
      setConsoleLogs(prev => [log, ...prev].slice(0, preserveLogs ? 1000 : 100));
    };

    console.log = (...args) => {
      originalLog(...args);
      captureLog('log', ...args);
    };
    
    console.info = (...args) => {
      originalInfo(...args);
      captureLog('info', ...args);
    };
    
    console.warn = (...args) => {
      originalWarn(...args);
      captureLog('warn', ...args);
    };
    
    console.error = (...args) => {
      originalError(...args);
      captureLog('error', ...args);
    };
    
    console.debug = (...args) => {
      originalDebug(...args);
      captureLog('debug', ...args);
    };

    // Cleanup
    return () => {
      console.log = originalLog;
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
      console.debug = originalDebug;
    };
  }, [isOpen, url, preserveLogs]);

  // Monitor performance
  useEffect(() => {
    if (!isOpen || !window.performance) return;

    const updatePerformanceMetrics = () => {
      const metrics: PerformanceMetric[] = [];
      
      // Navigation timing
      const navTiming = performance.timing;
      if (navTiming) {
        metrics.push({
          name: 'DOM Content Loaded',
          value: navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart,
          unit: 'ms',
          description: 'Time to parse and execute DOM content',
          category: 'timing'
        });
        
        metrics.push({
          name: 'Load Event',
          value: navTiming.loadEventEnd - navTiming.loadEventStart,
          unit: 'ms',
          description: 'Time for the load event',
          category: 'timing'
        });
      }
      
      // Paint timing
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        metrics.push({
          name: entry.name,
          value: entry.startTime,
          unit: 'ms',
          description: `Time to ${entry.name}`,
          category: 'paint'
        });
      });
      
      // Memory usage (if available)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        metrics.push({
          name: 'JS Heap Size',
          value: memory.usedJSHeapSize / 1048576,
          unit: 'MB',
          description: 'JavaScript heap memory usage',
          category: 'resource'
        });
      }
      
      setPerformanceMetrics(metrics);
    };

    updatePerformanceMetrics();
    const interval = setInterval(updatePerformanceMetrics, 2000);
    
    return () => clearInterval(interval);
  }, [isOpen]);

  // Get media devices
  useEffect(() => {
    if (!isOpen || !navigator.mediaDevices) return;

    const updateMediaDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mediaList: MediaDevice[] = devices.map(device => ({
          id: device.deviceId,
          kind: device.kind as MediaDevice['kind'],
          label: device.label || `${device.kind} ${device.deviceId.slice(0, 8)}`,
          active: false
        }));
        setMediaDevices(mediaList);
      } catch (error) {
        console.error('Error enumerating media devices:', error);
      }
    };

    updateMediaDevices();
    navigator.mediaDevices.addEventListener('devicechange', updateMediaDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', updateMediaDevices);
    };
  }, [isOpen]);

  // Execute JavaScript code
  const executeJavaScript = () => {
    if (!jsCode) return;
    
    try {
      // Create a sandboxed execution context
      const result = new Function(jsCode)();
      
      console.log('Executed:', result);
      
      toast({
        title: 'JavaScript kjørt',
        description: 'Koden ble utført vellykket',
      });
    } catch (error: any) {
      console.error('Execution error:', error);
      
      toast({
        title: 'JavaScript feil',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // Apply CSS styles
  const applyCSS = () => {
    if (!cssCode) return;
    
    try {
      // Create a style element
      const styleElement = document.createElement('style');
      styleElement.textContent = cssCode;
      document.head.appendChild(styleElement);
      
      toast({
        title: 'CSS anvendt',
        description: 'Stilene ble lagt til',
      });
    } catch (error: any) {
      toast({
        title: 'CSS feil',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // Clear storage
  const clearStorage = (type: 'localStorage' | 'sessionStorage' | 'cookie' | 'all') => {
    try {
      switch (type) {
        case 'localStorage':
          localStorage.clear();
          break;
        case 'sessionStorage':
          sessionStorage.clear();
          break;
        case 'cookie':
          document.cookie.split(';').forEach(cookie => {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          });
          break;
        case 'all':
          localStorage.clear();
          sessionStorage.clear();
          document.cookie.split(';').forEach(cookie => {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          });
          break;
      }
      
      toast({
        title: 'Lagring tømt',
        description: `${type === 'all' ? 'All' : type} lagring er tømt`,
      });
      
      // Refresh storage items
      setStorageItems([]);
    } catch (error: any) {
      toast({
        title: 'Feil ved tømming',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // Clear console
  const clearConsole = () => {
    setConsoleLogs([]);
    console.clear();
    
    toast({
      title: 'Konsoll tømt',
      description: 'Alle konsollmeldinger er fjernet',
    });
  };

  // Register service worker
  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator && serviceWorkersEnabled) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        toast({
          title: 'Service Worker registrert',
          description: 'Service Worker er aktiv',
        });
        
        // Add to workers list
        const worker: WebWorker = {
          id: `sw-${Date.now()}`,
          name: 'Service Worker',
          type: 'service',
          status: 'active',
          scriptUrl: '/sw.js',
          memory: 0,
          cpu: 0,
          messages: 0
        };
        
        setWorkers(prev => [...prev, worker]);
      } catch (error: any) {
        toast({
          title: 'Service Worker feil',
          description: error.message,
          variant: 'destructive'
        });
      }
    }
  };

  // Create web worker
  const createWebWorker = () => {
    if (!webWorkersEnabled) {
      toast({
        title: 'Web Workers deaktivert',
        description: 'Aktiver Web Workers for å bruke denne funksjonen',
        variant: 'destructive'
      });
      return;
    }
    
    // Create a simple worker
    const workerCode = `
      self.addEventListener('message', (e) => {
        const result = e.data * 2;
        self.postMessage(result);
      });
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    
    const workerId = `worker-${Date.now()}`;
    
    const workerInfo: WebWorker = {
      id: workerId,
      name: 'Dedicated Worker',
      type: 'dedicated',
      status: 'active',
      scriptUrl: workerUrl,
      memory: 0,
      cpu: 0,
      messages: 0
    };
    
    setWorkers(prev => [...prev, workerInfo]);
    
    // Test the worker
    worker.postMessage(21);
    worker.onmessage = (e) => {
      console.log('Worker result:', e.data);
      
      setWorkers(prev => prev.map(w => 
        w.id === workerId ? { ...w, messages: w.messages + 1 } : w
      ));
    };
    
    toast({
      title: 'Web Worker opprettet',
      description: 'Ny dedicated worker er aktiv',
    });
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug': return <Settings className="w-4 h-4 text-gray-500" />;
      default: return <Terminal className="w-4 h-4" />;
    }
  };

  const getStorageIcon = (type: string) => {
    switch (type) {
      case 'localStorage': return <HardDrive className="w-4 h-4" />;
      case 'sessionStorage': return <Database className="w-4 h-4" />;
      case 'indexedDB': return <Server className="w-4 h-4" />;
      case 'cookie': return <FileText className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const renderDOMTree = (node: DOMNode, depth = 0): React.ReactNode => {
    return (
      <div key={node.id} style={{ marginLeft: depth * 20 }}>
        <div
          className={`p-1 hover:bg-muted rounded cursor-pointer text-sm font-mono ${
            selectedNode?.id === node.id ? 'bg-muted' : ''
          }`}
          onClick={() => setSelectedNode(node)}
        >
          <span className="text-primary">&lt;{node.tagName}</span>
          {Object.entries(node.attributes).map(([key, value]) => (
            <span key={key}>
              {' '}
              <span className="text-blue-500">{key}</span>=
              <span className="text-green-500">"{value}"</span>
            </span>
          ))}
          <span className="text-primary">&gt;</span>
          {node.textContent && (
            <span className="text-muted-foreground ml-1">{node.textContent}</span>
          )}
          {node.children.length === 0 && !node.textContent && (
            <span className="text-primary">&lt;/{node.tagName}&gt;</span>
          )}
        </div>
        {node.children.length > 0 && (
          <>
            <div>
              {node.children.map(child => renderDOMTree(child, depth + 1))}
            </div>
            <div style={{ marginLeft: depth * 20 }} className="text-sm font-mono">
              <span className="text-primary">&lt;/{node.tagName}&gt;</span>
            </div>
          </>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Web API-er og JavaScript
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={jsEnabled ? 'default' : 'destructive'}>
                JavaScript {jsEnabled ? 'På' : 'Av'}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Administrer DOM, JavaScript engine, storage API-er og web workers
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="dom">DOM</TabsTrigger>
              <TabsTrigger value="console">Konsoll</TabsTrigger>
              <TabsTrigger value="storage">Lagring</TabsTrigger>
              <TabsTrigger value="workers">Workers</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="performance">Ytelse</TabsTrigger>
            </TabsList>

            <TabsContent value="dom" className="flex-1 overflow-hidden flex">
              <div className="w-1/2 border-r pr-4 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">DOM Tre</h3>
                  <Button size="sm" variant="outline" onClick={() => setDomTree(null)}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Oppdater
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  {domTree && renderDOMTree(domTree)}
                </ScrollArea>
              </div>
              
              <div className="w-1/2 pl-4 flex flex-col">
                <Tabs defaultValue="js" className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="js">JavaScript</TabsTrigger>
                    <TabsTrigger value="css">CSS</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="js" className="flex-1 flex flex-col">
                    <Textarea
                      placeholder="Skriv JavaScript kode her..."
                      value={jsCode}
                      onChange={(e) => setJsCode(e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                    <Button
                      className="mt-2"
                      onClick={executeJavaScript}
                      disabled={!jsEnabled}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Kjør JavaScript
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="css" className="flex-1 flex flex-col">
                    <Textarea
                      placeholder="Skriv CSS stiler her..."
                      value={cssCode}
                      onChange={(e) => setCssCode(e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                    <Button className="mt-2" onClick={applyCSS}>
                      <Play className="w-4 h-4 mr-2" />
                      Bruk CSS
                    </Button>
                  </TabsContent>
                </Tabs>
                
                {selectedNode && (
                  <Card className="mt-4">
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Valgt element</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-1">
                      <div>Tag: <code>{selectedNode.tagName}</code></div>
                      <div>ID: <code>{selectedNode.id}</code></div>
                      {selectedNode.className && (
                        <div>Class: <code>{selectedNode.className}</code></div>
                      )}
                      <div>Attributter: {Object.keys(selectedNode.attributes).join(', ') || 'ingen'}</div>
                      <div>Barn: {selectedNode.children.length}</div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="console" className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between gap-2 pb-2 border-b">
                <div className="flex items-center gap-2">
                  <Select value={consoleFilter} onValueChange={setConsoleFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="log">Log</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Advarsel</SelectItem>
                      <SelectItem value="error">Feil</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      id="preserve"
                      checked={preserveLogs}
                      onCheckedChange={setPreserveLogs}
                    />
                    <Label htmlFor="preserve" className="text-sm">Bevar logger</Label>
                  </div>
                </div>
                
                <Button size="sm" variant="outline" onClick={clearConsole}>
                  <XCircle className="w-4 h-4 mr-1" />
                  Tøm
                </Button>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {consoleLogs
                    .filter(log => consoleFilter === 'all' || log.level === consoleFilter)
                    .map(log => (
                      <div
                        key={log.id}
                        className={`flex items-start gap-2 p-2 rounded font-mono text-xs ${
                          log.level === 'error' ? 'bg-red-500/10' :
                          log.level === 'warn' ? 'bg-yellow-500/10' :
                          'hover:bg-muted'
                        }`}
                      >
                        <div className="shrink-0">{getLogIcon(log.level)}</div>
                        <div className="flex-1 min-w-0">
                          <pre className="whitespace-pre-wrap break-all">{log.message}</pre>
                          {log.stack && (
                            <pre className="text-xs text-muted-foreground mt-1">{log.stack}</pre>
                          )}
                        </div>
                        <div className="shrink-0 text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="storage" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Lagrings API-er</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => clearStorage('localStorage')}>
                      Tøm localStorage
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => clearStorage('sessionStorage')}>
                      Tøm sessionStorage
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => clearStorage('cookie')}>
                      Tøm cookies
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Lagringskvote</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Brukt</span>
                          <span>{(storageItems.reduce((sum, item) => sum + item.size, 0) / 1024).toFixed(2)} KB</span>
                        </div>
                        <Progress value={30} />
                        <p className="text-xs text-muted-foreground">
                          30% av kvote brukt
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Lagringstyper</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <HardDrive className="w-4 h-4" />
                            localStorage
                          </span>
                          <Badge>{storageItems.filter(i => i.type === 'localStorage').length}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            sessionStorage
                          </span>
                          <Badge>{storageItems.filter(i => i.type === 'sessionStorage').length}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Cookies
                          </span>
                          <Badge>{storageItems.filter(i => i.type === 'cookie').length}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {storageItems.map((item, index) => (
                      <Card key={`${item.type}-${item.key}-${index}`}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <div className="shrink-0">{getStorageIcon(item.type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <code className="text-sm font-medium">{item.key}</code>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{item.type}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {(item.size / 1024).toFixed(2)} KB
                                  </span>
                                </div>
                              </div>
                              <pre className="text-xs text-muted-foreground truncate">
                                {item.value}
                              </pre>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="workers" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Web Workers</h3>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={createWebWorker}>
                      <Plus className="w-4 h-4 mr-1" />
                      Ny Worker
                    </Button>
                    <Button size="sm" onClick={registerServiceWorker}>
                      <Cloud className="w-4 h-4 mr-1" />
                      Service Worker
                    </Button>
                  </div>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Worker innstillinger</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="workers" className="text-sm">Web Workers</Label>
                        <Switch
                          id="workers"
                          checked={webWorkersEnabled}
                          onCheckedChange={setWebWorkersEnabled}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="service" className="text-sm">Service Workers</Label>
                        <Switch
                          id="service"
                          checked={serviceWorkersEnabled}
                          onCheckedChange={setServiceWorkersEnabled}
                        />
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-4">
                  {workers.map(worker => (
                    <Card key={worker.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Cpu className="w-4 h-4" />
                            {worker.name}
                          </CardTitle>
                          <Badge variant={worker.status === 'active' ? 'default' : 'secondary'}>
                            {worker.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1">
                        <div>Type: {worker.type}</div>
                        <div>Script: <code>{worker.scriptUrl}</code></div>
                        <div>Meldinger: {worker.messages}</div>
                        <div>RAM: {worker.memory.toFixed(1)} MB</div>
                        <div>CPU: {worker.cpu.toFixed(1)}%</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <Alert>
                  <Camera className="h-4 w-4" />
                  <AlertTitle>Media API-er</AlertTitle>
                  <AlertDescription>
                    Administrer kamera, mikrofon og andre mediaenheter
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        WebRTC
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Button size="sm" className="w-full">
                          Start videoanrop
                        </Button>
                        <Button size="sm" variant="outline" className="w-full">
                          Skjermdeling
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        Web Audio
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Button size="sm" className="w-full">
                          Analyser lyd
                        </Button>
                        <Button size="sm" variant="outline" className="w-full">
                          Syntetiser
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Geolocation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              toast({
                                title: 'Posisjon funnet',
                                description: `Lat: ${pos.coords.latitude}, Lng: ${pos.coords.longitude}`,
                              });
                            },
                            (err) => {
                              toast({
                                title: 'Posisjon feil',
                                description: err.message,
                                variant: 'destructive'
                              });
                            }
                          );
                        }}
                      >
                        Hent posisjon
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Mediaenheter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {mediaDevices.map(device => (
                        <div key={device.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            {device.kind === 'videoinput' ? <Camera className="w-4 h-4" /> :
                             device.kind === 'audioinput' ? <Mic className="w-4 h-4" /> :
                             <Volume2 className="w-4 h-4" />}
                            <span className="text-sm">{device.label}</span>
                          </div>
                          <Badge variant={device.active ? 'default' : 'secondary'}>
                            {device.kind}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertTitle>Performance API</AlertTitle>
                  <AlertDescription>
                    Overvåk og analyser nettsidens ytelse
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-4">
                  {performanceMetrics.map((metric, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{metric.name}</CardTitle>
                          <Badge variant="outline">{metric.category}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {metric.value.toFixed(2)} {metric.unit}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {metric.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">JavaScript Engine</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="js-engine" className="text-sm">JavaScript</Label>
                        <Switch
                          id="js-engine"
                          checked={jsEnabled}
                          onCheckedChange={setJsEnabled}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="webgl" className="text-sm">WebGL</Label>
                        <Switch
                          id="webgl"
                          checked={webGLEnabled}
                          onCheckedChange={setWebGLEnabled}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="wasm" className="text-sm">WebAssembly</Label>
                        <Switch
                          id="wasm"
                          checked={wasmEnabled}
                          onCheckedChange={setWasmEnabled}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add Plus import
function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}