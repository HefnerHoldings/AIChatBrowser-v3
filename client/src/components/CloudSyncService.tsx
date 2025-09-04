import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Cloud, 
  CloudOff,
  Loader2,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Download,
  Upload,
  Settings,
  Shield,
  Smartphone,
  Monitor,
  Tablet,
  HardDrive,
  Clock,
  Zap,
  Activity,
  Database,
  Key,
  FileText,
  Bookmark,
  History,
  User,
  Folder
} from 'lucide-react';

interface SyncStatus {
  isEnabled: boolean;
  lastSync: Date | null;
  isSyncing: boolean;
  syncProgress: number;
  conflicts: number;
  pendingChanges: number;
}

interface SyncedDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  lastSeen: Date;
  isActive: boolean;
  browser: string;
  os: string;
}

interface SyncSettings {
  bookmarks: boolean;
  history: boolean;
  passwords: boolean;
  extensions: boolean;
  settings: boolean;
  tabs: boolean;
  downloads: boolean;
  autoSync: boolean;
  syncInterval: number;
  conflictResolution: 'local' | 'remote' | 'manual';
}

interface BackupData {
  id: string;
  name: string;
  createdAt: Date;
  size: number;
  type: 'manual' | 'auto';
  items: {
    bookmarks: number;
    history: number;
    passwords: number;
    settings: number;
  };
}

export function CloudSyncService() {
  const { toast } = useToast();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isEnabled: false,
    lastSync: null,
    isSyncing: false,
    syncProgress: 0,
    conflicts: 0,
    pendingChanges: 0
  });

  const [syncedDevices, setSyncedDevices] = useState<SyncedDevice[]>([
    {
      id: 'device-1',
      name: 'Min Desktop',
      type: 'desktop',
      lastSeen: new Date(),
      isActive: true,
      browser: 'MadEasy Browser v2.0',
      os: 'Windows 11'
    },
    {
      id: 'device-2',
      name: 'Min iPhone',
      type: 'mobile',
      lastSeen: new Date(Date.now() - 3600000),
      isActive: false,
      browser: 'MadEasy Mobile v2.0',
      os: 'iOS 17'
    }
  ]);

  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    bookmarks: true,
    history: true,
    passwords: false,
    extensions: true,
    settings: true,
    tabs: false,
    downloads: false,
    autoSync: true,
    syncInterval: 15,
    conflictResolution: 'manual'
  });

  const [backups, setBackups] = useState<BackupData[]>([
    {
      id: 'backup-1',
      name: 'Automatisk backup',
      createdAt: new Date(Date.now() - 86400000),
      size: 2.5 * 1024 * 1024,
      type: 'auto',
      items: {
        bookmarks: 156,
        history: 1250,
        passwords: 45,
        settings: 1
      }
    }
  ]);

  const [cloudStorage, setCloudStorage] = useState({
    used: 125 * 1024 * 1024,
    total: 1024 * 1024 * 1024,
    trend: '+2.3 MB'
  });

  // Auto-sync timer
  useEffect(() => {
    if (syncStatus.isEnabled && syncSettings.autoSync) {
      const interval = setInterval(() => {
        handleSync();
      }, syncSettings.syncInterval * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [syncStatus.isEnabled, syncSettings.autoSync, syncSettings.syncInterval]);

  const handleSync = async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true, syncProgress: 0 }));

    // Simulate sync progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setSyncStatus(prev => ({ ...prev, syncProgress: i }));
    }

    setSyncStatus(prev => ({
      ...prev,
      isSyncing: false,
      lastSync: new Date(),
      pendingChanges: 0
    }));

    toast({
      title: 'Synkronisering fullført',
      description: 'Alle data er synkronisert til skyen',
    });
  };

  const handleBackup = async () => {
    const newBackup: BackupData = {
      id: `backup-${Date.now()}`,
      name: 'Manuell backup',
      createdAt: new Date(),
      size: Math.random() * 5 * 1024 * 1024,
      type: 'manual',
      items: {
        bookmarks: 156,
        history: 1250,
        passwords: 45,
        settings: 1
      }
    };

    setBackups(prev => [newBackup, ...prev]);
    
    toast({
      title: 'Backup opprettet',
      description: 'En ny backup av dine data er lagret',
    });
  };

  const handleRestore = async (backupId: string) => {
    const backup = backups.find(b => b.id === backupId);
    if (!backup) return;

    toast({
      title: 'Gjenoppretter data',
      description: `Gjenoppretter fra backup: ${backup.name}`,
    });

    // Simulate restore
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: 'Gjenoppretting fullført',
      description: 'Dine data er gjenopprettet fra backup',
    });
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${syncStatus.isEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                {syncStatus.isEnabled ? (
                  <Cloud className="h-6 w-6 text-green-600" />
                ) : (
                  <CloudOff className="h-6 w-6 text-gray-600" />
                )}
              </div>
              <div>
                <CardTitle>Cloud Sync</CardTitle>
                <CardDescription>
                  {syncStatus.isEnabled ? 'Synkronisering aktivert' : 'Synkronisering deaktivert'}
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={syncStatus.isEnabled}
              onCheckedChange={(checked) => 
                setSyncStatus(prev => ({ ...prev, isEnabled: checked }))
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Siste synk</p>
              <p className="text-lg font-semibold">
                {syncStatus.lastSync ? 
                  new Date(syncStatus.lastSync).toLocaleTimeString('no-NO', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : 
                  'Aldri'
                }
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Ventende endringer</p>
              <p className="text-lg font-semibold">{syncStatus.pendingChanges}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Konflikter</p>
              <p className="text-lg font-semibold text-amber-600">{syncStatus.conflicts}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Enheter</p>
              <p className="text-lg font-semibold">{syncedDevices.length}</p>
            </div>
          </div>

          {syncStatus.isSyncing && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Synkroniserer...</span>
                <span>{syncStatus.syncProgress}%</span>
              </div>
              <Progress value={syncStatus.syncProgress} />
            </div>
          )}

          {!syncStatus.isSyncing && syncStatus.isEnabled && (
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSync} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Synkroniser nå
              </Button>
              <Button variant="outline" size="sm" onClick={handleBackup}>
                <Download className="h-4 w-4 mr-2" />
                Lag backup
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="devices">Enheter</TabsTrigger>
          <TabsTrigger value="settings">Innstillinger</TabsTrigger>
          <TabsTrigger value="storage">Lagring</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synkroniserte enheter</CardTitle>
              <CardDescription>
                Administrer enheter som er koblet til din sky-konto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {syncedDevices.map((device) => (
                    <Card key={device.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getDeviceIcon(device.type)}
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {device.name}
                                {device.isActive && (
                                  <Badge variant="outline" className="text-green-600">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Aktiv
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {device.browser} • {device.os}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Sist sett: {new Date(device.lastSeen).toLocaleString('no-NO')}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synkroniseringsinnstillinger</CardTitle>
              <CardDescription>
                Velg hvilke data som skal synkroniseres
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4" />
                    <Label htmlFor="sync-bookmarks">Bokmerker</Label>
                  </div>
                  <Switch
                    id="sync-bookmarks"
                    checked={syncSettings.bookmarks}
                    onCheckedChange={(checked) =>
                      setSyncSettings(prev => ({ ...prev, bookmarks: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    <Label htmlFor="sync-history">Historikk</Label>
                  </div>
                  <Switch
                    id="sync-history"
                    checked={syncSettings.history}
                    onCheckedChange={(checked) =>
                      setSyncSettings(prev => ({ ...prev, history: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <Label htmlFor="sync-passwords">Passord</Label>
                  </div>
                  <Switch
                    id="sync-passwords"
                    checked={syncSettings.passwords}
                    onCheckedChange={(checked) =>
                      setSyncSettings(prev => ({ ...prev, passwords: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <Label htmlFor="sync-settings">Innstillinger</Label>
                  </div>
                  <Switch
                    id="sync-settings"
                    checked={syncSettings.settings}
                    onCheckedChange={(checked) =>
                      setSyncSettings(prev => ({ ...prev, settings: checked }))
                    }
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <Label htmlFor="auto-sync">Automatisk synkronisering</Label>
                  <Switch
                    id="auto-sync"
                    checked={syncSettings.autoSync}
                    onCheckedChange={(checked) =>
                      setSyncSettings(prev => ({ ...prev, autoSync: checked }))
                    }
                  />
                </div>

                {syncSettings.autoSync && (
                  <div className="space-y-2">
                    <Label>Synkroniseringsintervall</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={syncSettings.syncInterval}
                      onChange={(e) =>
                        setSyncSettings(prev => ({ 
                          ...prev, 
                          syncInterval: parseInt(e.target.value) 
                        }))
                      }
                    >
                      <option value={5}>Hvert 5. minutt</option>
                      <option value={15}>Hvert 15. minutt</option>
                      <option value={30}>Hvert 30. minutt</option>
                      <option value={60}>Hver time</option>
                    </select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sky-lagring</CardTitle>
              <CardDescription>
                Oversikt over lagringsplass i skyen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Brukt plass</span>
                    <span className="text-sm font-medium">
                      {formatBytes(cloudStorage.used)} / {formatBytes(cloudStorage.total)}
                    </span>
                  </div>
                  <Progress 
                    value={(cloudStorage.used / cloudStorage.total) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {cloudStorage.trend} siste uke
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bookmark className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Bokmerker</span>
                      </div>
                      <span className="text-sm font-medium">2.1 MB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Historikk</span>
                      </div>
                      <span className="text-sm font-medium">45.3 MB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">Passord</span>
                      </div>
                      <span className="text-sm font-medium">512 KB</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-gray-600" />
                        <span className="text-sm">Innstillinger</span>
                      </div>
                      <span className="text-sm font-medium">128 KB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-600" />
                        <span className="text-sm">Utvidelser</span>
                      </div>
                      <span className="text-sm font-medium">15.7 MB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">Annet</span>
                      </div>
                      <span className="text-sm font-medium">61.4 MB</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Backups</CardTitle>
                  <CardDescription>
                    Administrer og gjenopprett fra tidligere backups
                  </CardDescription>
                </div>
                <Button onClick={handleBackup}>
                  <Download className="h-4 w-4 mr-2" />
                  Ny backup
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {backups.map((backup) => (
                    <Card key={backup.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {backup.name}
                              {backup.type === 'auto' && (
                                <Badge variant="outline">Auto</Badge>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(backup.createdAt).toLocaleString('no-NO')} • {formatBytes(backup.size)}
                            </p>
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{backup.items.bookmarks} bokmerker</span>
                              <span>{backup.items.history} historikk</span>
                              <span>{backup.items.passwords} passord</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRestore(backup.id)}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Gjenopprett
                            </Button>
                            <Button variant="ghost" size="sm">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}