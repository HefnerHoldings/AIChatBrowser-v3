import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Puzzle, 
  Upload, 
  Settings, 
  Shield, 
  Zap, 
  Code, 
  Globe,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Download,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Terminal,
  FileJson,
  Package,
  Activity,
  Database,
  MessageSquare,
  Layers,
  Cpu,
  HardDrive
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Manifest V3 Types
interface ManifestV3 {
  manifest_version: 3;
  name: string;
  version: string;
  description?: string;
  icons?: {
    [key: string]: string;
  };
  action?: {
    default_popup?: string;
    default_icon?: string | { [key: string]: string };
    default_title?: string;
  };
  background?: {
    service_worker?: string;
    type?: 'module';
  };
  content_scripts?: ContentScript[];
  permissions?: string[];
  host_permissions?: string[];
  optional_permissions?: string[];
  web_accessible_resources?: WebAccessibleResource[];
  content_security_policy?: {
    extension_pages?: string;
    sandbox?: string;
  };
}

interface ContentScript {
  matches: string[];
  js?: string[];
  css?: string[];
  run_at?: 'document_start' | 'document_end' | 'document_idle';
  all_frames?: boolean;
  match_about_blank?: boolean;
  world?: 'ISOLATED' | 'MAIN';
}

interface WebAccessibleResource {
  resources: string[];
  matches?: string[];
  extension_ids?: string[];
  use_dynamic_url?: boolean;
}

interface Extension {
  id: string;
  manifest: ManifestV3;
  enabled: boolean;
  installDate: Date;
  updateDate: Date;
  path: string;
  permissions: {
    granted: string[];
    optional: string[];
  };
  state: 'enabled' | 'disabled' | 'loading' | 'error';
  errorMessage?: string;
  statistics?: {
    messagesSent: number;
    messagesReceived: number;
    storageUsed: number;
    cpuTime: number;
    memoryUsage: number;
  };
}

interface ExtensionsAPIProps {
  onClose?: () => void;
}

export function ExtensionsAPI({ onClose }: ExtensionsAPIProps) {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [selectedExtension, setSelectedExtension] = useState<Extension | null>(null);
  const [activeTab, setActiveTab] = useState('installed');
  const [devMode, setDevMode] = useState(false);
  const [showPermissions, setShowPermissions] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<Array<{
    timestamp: Date;
    extensionId: string;
    type: 'info' | 'warning' | 'error';
    message: string;
  }>>([]);

  // Message Passing System
  const messageChannel = useRef(new Map<string, MessagePort>());
  const [messages, setMessages] = useState<Array<{
    from: string;
    to: string;
    data: any;
    timestamp: Date;
  }>>([]);

  // Extension Storage API
  const extensionStorage = useRef(new Map<string, Map<string, any>>());

  // Initialize Extensions System
  useEffect(() => {
    initializeExtensionsAPI();
    return () => cleanupExtensions();
  }, []);

  const initializeExtensionsAPI = () => {
    // Set up global chrome object for extensions
    if (typeof window !== 'undefined' && !(window as any).chrome) {
      (window as any).chrome = {
        runtime: createRuntimeAPI(),
        storage: createStorageAPI(),
        tabs: createTabsAPI(),
        windows: createWindowsAPI(),
        webNavigation: createWebNavigationAPI(),
        contextMenus: createContextMenusAPI(),
        notifications: createNotificationsAPI(),
        alarms: createAlarmsAPI(),
        cookies: createCookiesAPI(),
        downloads: createDownloadsAPI(),
      } as any;
    }

    // Load installed extensions
    loadInstalledExtensions();
  };

  const createRuntimeAPI = () => ({
    onMessage: {
      addListener: (callback: Function) => {
        // Register message listener
      }
    },
    sendMessage: (extensionId: string, message: any, callback?: Function) => {
      // Send message to extension
      const msg = {
        from: 'browser',
        to: extensionId,
        data: message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, msg]);
      callback?.({ success: true });
    },
    getManifest: () => selectedExtension?.manifest,
    id: 'browser-runtime',
    lastError: null as any
  });

  const createStorageAPI = () => ({
    local: {
      get: (keys: string | string[], callback: Function) => {
        const extId = selectedExtension?.id;
        if (!extId) return;
        
        const storage = extensionStorage.current.get(extId) || new Map();
        const result: any = {};
        
        if (typeof keys === 'string') {
          result[keys] = storage.get(keys);
        } else {
          keys.forEach(key => {
            result[key] = storage.get(key);
          });
        }
        
        callback(result);
      },
      set: (items: Record<string, any>, callback?: Function) => {
        const extId = selectedExtension?.id;
        if (!extId) return;
        
        if (!extensionStorage.current.has(extId)) {
          extensionStorage.current.set(extId, new Map());
        }
        
        const storage = extensionStorage.current.get(extId)!;
        Object.entries(items).forEach(([key, value]) => {
          storage.set(key, value);
        });
        
        callback?.();
      },
      remove: (keys: string | string[], callback?: Function) => {
        const extId = selectedExtension?.id;
        if (!extId) return;
        
        const storage = extensionStorage.current.get(extId);
        if (!storage) return;
        
        if (typeof keys === 'string') {
          storage.delete(keys);
        } else {
          keys.forEach(key => storage.delete(key));
        }
        
        callback?.();
      },
      clear: (callback?: Function) => {
        const extId = selectedExtension?.id;
        if (!extId) return;
        
        extensionStorage.current.set(extId, new Map());
        callback?.();
      }
    },
    sync: {
      // Similar to local but with sync capabilities
      get: () => {},
      set: () => {},
      remove: () => {},
      clear: () => {}
    },
    managed: {
      // Read-only storage from enterprise policies
      get: () => {}
    }
  });

  const createTabsAPI = () => ({
    query: (queryInfo: any, callback: Function) => {
      // Query tabs based on criteria
      callback([
        {
          id: 1,
          windowId: 1,
          url: 'https://example.com',
          title: 'Example Page',
          active: true,
          pinned: false,
          incognito: false
        }
      ]);
    },
    create: (createProperties: any, callback?: Function) => {
      // Create new tab
      callback?.({ id: Date.now(), ...createProperties });
    },
    update: (tabId: number, updateProperties: any, callback?: Function) => {
      // Update tab properties
      callback?.({ id: tabId, ...updateProperties });
    },
    remove: (tabIds: number | number[], callback?: Function) => {
      // Remove tabs
      callback?.();
    },
    sendMessage: (tabId: number, message: any, callback?: Function) => {
      // Send message to content script in tab
      callback?.({ success: true });
    }
  });

  const createWindowsAPI = () => ({
    create: () => {},
    update: () => {},
    remove: () => {},
    get: () => {},
    getCurrent: () => {},
    getAll: () => {}
  });

  const createWebNavigationAPI = () => ({
    onCommitted: { addListener: () => {} },
    onCompleted: { addListener: () => {} },
    onBeforeNavigate: { addListener: () => {} },
    onDOMContentLoaded: { addListener: () => {} },
    onErrorOccurred: { addListener: () => {} }
  });

  const createContextMenusAPI = () => ({
    create: () => {},
    update: () => {},
    remove: () => {},
    removeAll: () => {}
  });

  const createNotificationsAPI = () => ({
    create: () => {},
    update: () => {},
    clear: () => {},
    getAll: () => {}
  });

  const createAlarmsAPI = () => ({
    create: () => {},
    get: () => {},
    getAll: () => {},
    clear: () => {},
    clearAll: () => {}
  });

  const createCookiesAPI = () => ({
    get: () => {},
    getAll: () => {},
    set: () => {},
    remove: () => {}
  });

  const createDownloadsAPI = () => ({
    download: () => {},
    search: () => {},
    pause: () => {},
    resume: () => {},
    cancel: () => {}
  });

  const loadInstalledExtensions = async () => {
    // Simulate loading extensions
    const mockExtensions: Extension[] = [
      {
        id: 'adblock-plus',
        manifest: {
          manifest_version: 3,
          name: 'AdBlock Plus',
          version: '3.14.0',
          description: 'Block annoying ads and trackers',
          permissions: ['webRequest', 'webRequestBlocking', 'tabs'],
          host_permissions: ['<all_urls>'],
          icons: {
            '16': 'icon16.png',
            '48': 'icon48.png',
            '128': 'icon128.png'
          }
        },
        enabled: true,
        installDate: new Date('2024-01-15'),
        updateDate: new Date('2024-03-20'),
        path: '/extensions/adblock-plus',
        permissions: {
          granted: ['webRequest', 'tabs'],
          optional: ['history', 'bookmarks']
        },
        state: 'enabled',
        statistics: {
          messagesSent: 1250,
          messagesReceived: 890,
          storageUsed: 2048,
          cpuTime: 125,
          memoryUsage: 15360
        }
      },
      {
        id: 'password-manager',
        manifest: {
          manifest_version: 3,
          name: 'Secure Password Manager',
          version: '2.5.1',
          description: 'Manage your passwords securely',
          permissions: ['storage', 'tabs', 'clipboardWrite'],
          host_permissions: ['https://*/*', 'http://*/*']
        },
        enabled: true,
        installDate: new Date('2024-02-10'),
        updateDate: new Date('2024-03-18'),
        path: '/extensions/password-manager',
        permissions: {
          granted: ['storage', 'tabs'],
          optional: ['notifications']
        },
        state: 'enabled',
        statistics: {
          messagesSent: 450,
          messagesReceived: 380,
          storageUsed: 5120,
          cpuTime: 45,
          memoryUsage: 8192
        }
      }
    ];

    setExtensions(mockExtensions);
  };

  const installExtension = async (file: File) => {
    setLoading(true);
    try {
      // Parse manifest.json
      const manifestText = await file.text();
      const manifest = JSON.parse(manifestText) as ManifestV3;
      
      // Validate manifest
      if (manifest.manifest_version !== 3) {
        throw new Error('Only Manifest V3 extensions are supported');
      }
      
      // Create extension object
      const newExtension: Extension = {
        id: `ext-${Date.now()}`,
        manifest,
        enabled: false,
        installDate: new Date(),
        updateDate: new Date(),
        path: `/extensions/${manifest.name.toLowerCase().replace(/\s+/g, '-')}`,
        permissions: {
          granted: [],
          optional: manifest.optional_permissions || []
        },
        state: 'disabled'
      };
      
      setExtensions(prev => [...prev, newExtension]);
      
      addLog('info', newExtension.id, `Extension "${manifest.name}" installed successfully`);
    } catch (error) {
      addLog('error', 'system', `Failed to install extension: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleExtension = (extensionId: string) => {
    setExtensions(prev => prev.map(ext => {
      if (ext.id === extensionId) {
        const newEnabled = !ext.enabled;
        addLog(
          newEnabled ? 'info' : 'warning',
          extensionId,
          `Extension ${newEnabled ? 'enabled' : 'disabled'}`
        );
        return {
          ...ext,
          enabled: newEnabled,
          state: newEnabled ? 'enabled' : 'disabled'
        };
      }
      return ext;
    }));
  };

  const removeExtension = (extensionId: string) => {
    setExtensions(prev => prev.filter(ext => ext.id !== extensionId));
    addLog('info', extensionId, 'Extension removed');
  };

  const addLog = (type: 'info' | 'warning' | 'error', extensionId: string, message: string) => {
    setLogs(prev => [...prev, {
      timestamp: new Date(),
      extensionId,
      type,
      message
    }].slice(-100)); // Keep last 100 logs
  };

  const cleanupExtensions = () => {
    // Cleanup message channels
    messageChannel.current.forEach(port => port.close());
    messageChannel.current.clear();
    
    // Clear storage
    extensionStorage.current.clear();
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Puzzle className="h-5 w-5" />
            Browser Extensions API
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <Switch
                checked={devMode}
                onCheckedChange={setDevMode}
                id="dev-mode"
              />
              <label htmlFor="dev-mode" className="text-sm">Developer Mode</label>
            </div>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="installed">Installed</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="developer">Developer</TabsTrigger>
          </TabsList>

          <TabsContent value="installed" className="flex-1 overflow-auto">
            <div className="space-y-4">
              {devMode && (
                <div className="flex gap-2">
                  <Input
                    ref={fileInputRef as any}
                    type="file"
                    accept=".json,.zip,.crx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) installExtension(file);
                    }}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Load Unpacked
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Pack Extension
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Update All
                  </Button>
                </div>
              )}

              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {extensions.map(ext => (
                    <Card key={ext.id} className={cn(
                      "p-4",
                      !ext.enabled && "opacity-60"
                    )}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Puzzle className="h-5 w-5" />
                            <h3 className="font-semibold">{ext.manifest.name}</h3>
                            <Badge variant="outline">{ext.manifest.version}</Badge>
                            {ext.state === 'error' && (
                              <Badge variant="destructive">Error</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {ext.manifest.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>ID: {ext.id}</span>
                            <span>Installed: {ext.installDate.toLocaleDateString()}</span>
                            {ext.statistics && (
                              <>
                                <span className="flex items-center gap-1">
                                  <HardDrive className="h-3 w-3" />
                                  {(ext.statistics.storageUsed / 1024).toFixed(1)} KB
                                </span>
                                <span className="flex items-center gap-1">
                                  <Cpu className="h-3 w-3" />
                                  {ext.statistics.cpuTime}ms
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={ext.enabled}
                            onCheckedChange={() => toggleExtension(ext.id)}
                          />
                          {devMode && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setSelectedExtension(ext)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeExtension(ext.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="flex-1 overflow-auto">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {extensions.map(ext => (
                  <Card key={ext.id} className="p-4">
                    <div className="mb-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {ext.manifest.name}
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {ext.manifest.permissions && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Required Permissions</h4>
                          <div className="flex flex-wrap gap-2">
                            {ext.manifest.permissions.map(perm => (
                              <Badge key={perm} variant="default" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {ext.manifest.host_permissions && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Host Permissions</h4>
                          <div className="flex flex-wrap gap-2">
                            {ext.manifest.host_permissions.map(perm => (
                              <Badge key={perm} variant="secondary" className="text-xs">
                                <Globe className="h-3 w-3 mr-1" />
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {ext.manifest.optional_permissions && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Optional Permissions</h4>
                          <div className="flex flex-wrap gap-2">
                            {ext.manifest.optional_permissions.map(perm => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {ext.permissions.granted.includes(perm) ? (
                                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                                ) : (
                                  <Lock className="h-3 w-3 mr-1" />
                                )}
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="messages" className="flex-1 overflow-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Extension Messages</h3>
                <Badge variant="outline">{messages.length} messages</Badge>
              </div>
              
              <ScrollArea className="h-[450px]">
                <div className="space-y-2">
                  {messages.map((msg, idx) => (
                    <Card key={idx} className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-xs font-medium">{msg.from}</span>
                          <span className="text-xs text-muted-foreground">→</span>
                          <span className="text-xs font-medium">{msg.to}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(msg.data, null, 2)}
                      </pre>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="developer" className="flex-1 overflow-auto">
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Extension Logs
                </h3>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-1 font-mono text-xs">
                    {logs.map((log, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-start gap-2 p-1",
                          log.type === 'error' && "text-red-500",
                          log.type === 'warning' && "text-yellow-500"
                        )}
                      >
                        <span className="text-muted-foreground">
                          [{log.timestamp.toLocaleTimeString()}]
                        </span>
                        <span className="font-medium">{log.extensionId}:</span>
                        <span>{log.message}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Storage Inspector
                </h3>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {Array.from(extensionStorage.current.entries()).map(([extId, storage]) => (
                      <div key={extId}>
                        <h4 className="text-sm font-medium mb-1">{extId}</h4>
                        <div className="bg-muted p-2 rounded">
                          <pre className="text-xs">
                            {JSON.stringify(Object.fromEntries(storage), null, 2)}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}