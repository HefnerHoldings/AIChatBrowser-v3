import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  WifiOff,
  Wifi,
  Cloud,
  CloudOff,
  Bell,
  BellOff,
  RefreshCw,
  HardDrive,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info,
  Smartphone,
  Monitor,
  Loader2,
  Share2,
  Home,
  Settings,
  Database,
  Zap,
  Shield,
  Activity,
  BarChart3,
  Package,
  ArrowDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface PWAManagerProps {
  onClose?: () => void;
}

interface CacheStats {
  totalSize: number;
  staticSize: number;
  dynamicSize: number;
  itemCount: number;
  lastUpdated: Date;
}

interface SyncStatus {
  pending: number;
  completed: number;
  failed: number;
  lastSync: Date | null;
}

export function PWAManager({ onClose }: PWAManagerProps) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    totalSize: 0,
    staticSize: 0,
    dynamicSize: 0,
    itemCount: 0,
    lastUpdated: new Date()
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    pending: 0,
    completed: 0,
    failed: 0,
    lastSync: null
  });
  const [activeTab, setActiveTab] = useState('status');
  const [isLoading, setIsLoading] = useState(false);
  
  const deferredPrompt = useRef<any>(null);
  const swRegistration = useRef<ServiceWorkerRegistration | null>(null);

  // Check if app is installed
  useEffect(() => {
    // Check if running in standalone mode
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                               (window.navigator as any).standalone ||
                               document.referrer.includes('android-app://');
    setIsStandalone(isInStandaloneMode);
    
    // Check if installed
    if ('getInstalledRelatedApps' in navigator) {
      (navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
        setIsInstalled(apps.length > 0);
      });
    }
    
    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setShowInstallPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      deferredPrompt.current = null;
      toast({
        title: "App Installed!",
        description: "MadEasy Browser has been installed successfully",
      });
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast({
        title: "Back Online",
        description: "Connection restored",
      });
      
      // Trigger background sync
      if (syncEnabled && registration) {
        registration.sync.register('sync-data');
      }
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      toast({
        title: "Offline Mode",
        description: "You're now working offline. Changes will sync when reconnected.",
        variant: "destructive"
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncEnabled, registration]);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      swRegistration.current = reg;
      setRegistration(reg);
      
      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              toast({
                title: "Update Available",
                description: "A new version of the app is available",
                action: (
                  <Button onClick={handleUpdate} size="sm">
                    Update
                  </Button>
                ),
              });
            }
          });
        }
      });
      
      // Check push permission
      if ('PushManager' in window) {
        const permission = await Notification.requestPermission();
        setPushEnabled(permission === 'granted');
      }
      
      // Check background sync support
      if ('sync' in reg) {
        setSyncEnabled(true);
      }
      
      // Get cache stats
      updateCacheStats();
      
      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      toast({
        title: "Installation Started",
        description: "Adding MadEasy Browser to your device",
      });
    }
    
    deferredPrompt.current = null;
    setShowInstallPrompt(false);
  };

  const handleUpdate = async () => {
    if (!registration?.waiting) return;
    
    // Tell SW to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Reload once the new SW is active
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  };

  const updateCacheStats = async () => {
    if (!navigator.storage || !navigator.storage.estimate) {
      return;
    }
    
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      
      // Get cache details
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        let itemCount = 0;
        
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const requests = await cache.keys();
          itemCount += requests.length;
        }
        
        setCacheStats({
          totalSize: usage,
          staticSize: usage * 0.3, // Estimate
          dynamicSize: usage * 0.7, // Estimate
          itemCount,
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error);
    }
  };

  const clearCache = async () => {
    setIsLoading(true);
    
    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Re-register service worker to cache essential files
      if (registration) {
        await registration.update();
      }
      
      await updateCacheStats();
      
      toast({
        title: "Cache Cleared",
        description: "All cached data has been removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const enablePushNotifications = async () => {
    if (!registration) return;
    
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            'YOUR_PUBLIC_VAPID_KEY' // Replace with actual VAPID key
          )
        });
        
        // Send subscription to server
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });
        
        setPushEnabled(true);
        toast({
          title: "Notifications Enabled",
          description: "You'll receive push notifications",
        });
      } else {
        setPushEnabled(false);
        toast({
          title: "Permission Denied",
          description: "Push notifications require permission",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
    }
  };

  const disablePushNotifications = async () => {
    if (!registration) return;
    
    try {
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notify server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      }
      
      setPushEnabled(false);
      toast({
        title: "Notifications Disabled",
        description: "Push notifications have been turned off",
      });
    } catch (error) {
      console.error('Failed to disable push notifications:', error);
    }
  };

  const triggerSync = async () => {
    if (!registration || !syncEnabled) return;
    
    try {
      await registration.sync.register('sync-data');
      
      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date()
      }));
      
      toast({
        title: "Sync Triggered",
        description: "Background sync has been initiated",
      });
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      toast({
        title: "Sync Failed",
        description: "Unable to start background sync",
        variant: "destructive"
      });
    }
  };

  const shareApp = async () => {
    const shareData = {
      title: 'MadEasy Browser',
      text: 'Check out MadEasy Browser - AI-Powered Autonomous Web Browser',
      url: window.location.origin
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Shared Successfully",
          description: "Thanks for sharing MadEasy Browser!",
        });
      } else {
        // Fallback - copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link Copied",
          description: "Share link copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            PWA Manager
            {isOffline && (
              <Badge variant="destructive" className="ml-2">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {updateAvailable && (
              <Button
                size="sm"
                variant="default"
                onClick={handleUpdate}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Update
              </Button>
            )}
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
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="offline">Offline</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="flex-1 overflow-auto">
            <div className="space-y-4">
              {/* Installation Status */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    {isStandalone ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                    Installation Status
                  </h3>
                  {isInstalled ? (
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Installed
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not Installed</Badge>
                  )}
                </div>
                
                {!isInstalled && showInstallPrompt && (
                  <Alert className="mb-3">
                    <Download className="h-4 w-4" />
                    <AlertDescription>
                      Install MadEasy Browser for offline access and better performance
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  {!isInstalled && (
                    <Button
                      onClick={handleInstall}
                      disabled={!showInstallPrompt}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Install App
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={shareApp}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Share App
                  </Button>
                </div>
                
                <div className="mt-3 text-xs text-muted-foreground">
                  {isStandalone ? 
                    "Running in standalone mode" : 
                    "Running in browser mode"}
                </div>
              </div>

              {/* Connection Status */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    {isOffline ? <CloudOff className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}
                    Connection Status
                  </h3>
                  <Badge variant={isOffline ? "destructive" : "default"}>
                    {isOffline ? "Offline" : "Online"}
                  </Badge>
                </div>
                
                {isOffline && (
                  <Alert className="mb-3" variant="destructive">
                    <WifiOff className="h-4 w-4" />
                    <AlertDescription>
                      You're offline. Some features may be limited.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Network Type:</span>
                    <span>{(navigator as any).connection?.effectiveType || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Save Data:</span>
                    <span>{(navigator as any).connection?.saveData ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Downlink:</span>
                    <span>{(navigator as any).connection?.downlink || 'Unknown'} Mbps</span>
                  </div>
                </div>
              </div>

              {/* Service Worker Status */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Service Worker
                  </h3>
                  {registration ? (
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not Registered</Badge>
                  )}
                </div>
                
                {registration && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Scope:</span>
                      <span className="font-mono text-xs">{registration.scope}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">State:</span>
                      <span>{registration.active?.state || 'Unknown'}</span>
                    </div>
                    {updateAvailable && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          An update is available. Click Update to refresh.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="offline" className="flex-1 overflow-auto">
            <div className="space-y-4">
              {/* Cache Storage */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Cache Storage
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearCache}
                    disabled={isLoading}
                    className="flex items-center gap-1"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Clear
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span>Total Size</span>
                      <span className="font-medium">{formatBytes(cacheStats.totalSize)}</span>
                    </div>
                    <Progress value={Math.min((cacheStats.totalSize / (100 * 1024 * 1024)) * 100, 100)} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 rounded bg-muted">
                      <div className="text-muted-foreground">Static Cache</div>
                      <div className="font-medium">{formatBytes(cacheStats.staticSize)}</div>
                    </div>
                    <div className="p-2 rounded bg-muted">
                      <div className="text-muted-foreground">Dynamic Cache</div>
                      <div className="font-medium">{formatBytes(cacheStats.dynamicSize)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cached Items:</span>
                    <span>{cacheStats.itemCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{cacheStats.lastUpdated.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Background Sync */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Background Sync
                  </h3>
                  <Switch
                    checked={syncEnabled}
                    disabled={!registration}
                    onCheckedChange={setSyncEnabled}
                  />
                </div>
                
                {syncEnabled && (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-2 rounded bg-muted">
                        <div className="text-2xl font-bold">{syncStatus.pending}</div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted">
                        <div className="text-2xl font-bold text-green-500">{syncStatus.completed}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted">
                        <div className="text-2xl font-bold text-red-500">{syncStatus.failed}</div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-muted-foreground">Last Sync:</span>
                      <span>{syncStatus.lastSync?.toLocaleTimeString() || 'Never'}</span>
                    </div>
                    
                    <Button
                      onClick={triggerSync}
                      className="w-full"
                      size="sm"
                      variant="outline"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Now
                    </Button>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="flex-1 overflow-auto">
            <div className="space-y-4">
              {/* Push Notifications */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Push Notifications
                  </h3>
                  <Switch
                    checked={pushEnabled}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        enablePushNotifications();
                      } else {
                        disablePushNotifications();
                      }
                    }}
                  />
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Receive notifications even when the app is closed
                </p>
                
                {pushEnabled && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded border">
                      <Label htmlFor="news" className="text-sm">News & Updates</Label>
                      <Switch id="news" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded border">
                      <Label htmlFor="security" className="text-sm">Security Alerts</Label>
                      <Switch id="security" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded border">
                      <Label htmlFor="sync" className="text-sm">Sync Status</Label>
                      <Switch id="sync" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded border">
                      <Label htmlFor="ai" className="text-sm">AI Assistant</Label>
                      <Switch id="ai" defaultChecked />
                    </div>
                  </div>
                )}
              </div>

              {/* Notification History */}
              <div className="p-4 rounded-lg border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Notifications
                </h3>
                
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    <div className="p-2 rounded border">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">Update Available</p>
                          <p className="text-xs text-muted-foreground">New features and improvements</p>
                        </div>
                        <span className="text-xs text-muted-foreground">2h ago</span>
                      </div>
                    </div>
                    
                    <div className="p-2 rounded border">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">Sync Complete</p>
                          <p className="text-xs text-muted-foreground">All data synchronized</p>
                        </div>
                        <span className="text-xs text-muted-foreground">5h ago</span>
                      </div>
                    </div>
                    
                    <div className="p-2 rounded border">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">Offline Mode</p>
                          <p className="text-xs text-muted-foreground">Working offline, changes will sync</p>
                        </div>
                        <span className="text-xs text-muted-foreground">1d ago</span>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="flex-1 overflow-auto">
            <div className="space-y-4">
              {/* Permissions */}
              <div className="p-4 rounded-lg border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Permissions
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Notifications</span>
                    <Badge variant={Notification.permission === 'granted' ? 'default' : 'secondary'}>
                      {Notification.permission}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Storage</span>
                    <Badge variant="default">Granted</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Background Sync</span>
                    <Badge variant={syncEnabled ? 'default' : 'secondary'}>
                      {syncEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Persistent Storage</span>
                    <Badge variant="secondary">Not Requested</Badge>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={async () => {
                    if (navigator.storage && navigator.storage.persist) {
                      const isPersisted = await navigator.storage.persist();
                      toast({
                        title: isPersisted ? "Storage Persisted" : "Storage Not Persisted",
                        description: isPersisted ? 
                          "Your data will be kept even under storage pressure" :
                          "Unable to persist storage",
                      });
                    }
                  }}
                >
                  Request Persistent Storage
                </Button>
              </div>

              {/* Debug Info */}
              <div className="p-4 rounded-lg border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Debug Information
                </h3>
                
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-2 bg-muted rounded">
                    <div className="text-muted-foreground">User Agent</div>
                    <div className="break-all">{navigator.userAgent}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-muted rounded">
                      <div className="text-muted-foreground">Platform</div>
                      <div>{navigator.platform}</div>
                    </div>
                    
                    <div className="p-2 bg-muted rounded">
                      <div className="text-muted-foreground">Language</div>
                      <div>{navigator.language}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-muted rounded">
                      <div className="text-muted-foreground">Cookies</div>
                      <div>{navigator.cookieEnabled ? 'Enabled' : 'Disabled'}</div>
                    </div>
                    
                    <div className="p-2 bg-muted rounded">
                      <div className="text-muted-foreground">Do Not Track</div>
                      <div>{(navigator as any).doNotTrack || 'Not Set'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}