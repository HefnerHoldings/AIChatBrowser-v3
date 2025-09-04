import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Copy,
  Download,
  Upload,
  FileText,
  Merge,
  GitBranch,
  ArrowUpDown,
  Server,
  Smartphone,
  Shield,
  Activity,
  Zap,
  RefreshCw
} from 'lucide-react';

interface SyncConflict {
  id: string;
  type: 'bookmark' | 'history' | 'setting' | 'password';
  localValue: any;
  remoteValue: any;
  localTimestamp: Date;
  remoteTimestamp: Date;
  description: string;
}

interface SyncOperation {
  id: string;
  type: 'upload' | 'download' | 'merge';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  itemType: string;
  itemCount: number;
  progress: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
}

interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  dataTransferred: number;
  avgSyncTime: number;
  lastSyncDuration: number;
  conflictsResolved: number;
  itemsSynced: {
    bookmarks: number;
    history: number;
    passwords: number;
    settings: number;
  };
}

export function SyncEngine() {
  const { toast } = useToast();
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [operations, setOperations] = useState<SyncOperation[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  const [conflictResolution, setConflictResolution] = useState<'local' | 'remote' | 'merge'>('local');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  
  const [metrics, setMetrics] = useState<SyncMetrics>({
    totalSyncs: 124,
    successfulSyncs: 118,
    failedSyncs: 6,
    dataTransferred: 256 * 1024 * 1024,
    avgSyncTime: 2.4,
    lastSyncDuration: 1.8,
    conflictsResolved: 23,
    itemsSynced: {
      bookmarks: 1250,
      history: 8420,
      passwords: 145,
      settings: 52
    }
  });

  // Simulate sync conflicts
  useEffect(() => {
    const mockConflicts: SyncConflict[] = [
      {
        id: 'conflict-1',
        type: 'bookmark',
        localValue: { title: 'GitHub - Local', url: 'https://github.com' },
        remoteValue: { title: 'GitHub - Remote', url: 'https://github.com' },
        localTimestamp: new Date(Date.now() - 3600000),
        remoteTimestamp: new Date(Date.now() - 1800000),
        description: 'Bokmerketittel er endret på begge enheter'
      },
      {
        id: 'conflict-2',
        type: 'setting',
        localValue: { theme: 'dark', autoplay: true },
        remoteValue: { theme: 'light', autoplay: false },
        localTimestamp: new Date(Date.now() - 7200000),
        remoteTimestamp: new Date(Date.now() - 5400000),
        description: 'Innstillinger er endret på flere enheter'
      }
    ];
    setConflicts(mockConflicts);
  }, []);

  const startSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncProgress(0);

    // Create new operation
    const operation: SyncOperation = {
      id: `op-${Date.now()}`,
      type: 'merge',
      status: 'in_progress',
      itemType: 'all',
      itemCount: 1500,
      progress: 0,
      startTime: new Date()
    };

    setOperations(prev => [operation, ...prev]);

    // Simulate sync progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setSyncProgress(i);
      
      // Update operation progress
      setOperations(prev => prev.map(op => 
        op.id === operation.id 
          ? { ...op, progress: i }
          : op
      ));
    }

    // Complete sync
    setOperations(prev => prev.map(op => 
      op.id === operation.id 
        ? { ...op, status: 'completed', progress: 100, endTime: new Date() }
        : op
    ));

    setIsSyncing(false);
    setSyncProgress(100);

    // Update metrics
    setMetrics(prev => ({
      ...prev,
      totalSyncs: prev.totalSyncs + 1,
      successfulSyncs: prev.successfulSyncs + 1,
      lastSyncDuration: 2.1
    }));

    toast({
      title: 'Synkronisering fullført',
      description: '1,500 elementer synkronisert',
    });
  }, [toast]);

  const resolveConflict = async (conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    // Remove resolved conflict
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
    setSelectedConflict(null);

    // Update metrics
    setMetrics(prev => ({
      ...prev,
      conflictsResolved: prev.conflictsResolved + 1
    }));

    toast({
      title: 'Konflikt løst',
      description: `Brukte ${resolution === 'local' ? 'lokal' : resolution === 'remote' ? 'ekstern' : 'sammenslått'} versjon`,
    });
  };

  const retryOperation = async (operationId: string) => {
    const operation = operations.find(op => op.id === operationId);
    if (!operation) return;

    // Update operation status
    setOperations(prev => prev.map(op => 
      op.id === operationId 
        ? { ...op, status: 'in_progress', progress: 0, error: undefined }
        : op
    ));

    // Simulate retry
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setOperations(prev => prev.map(op => 
        op.id === operationId 
          ? { ...op, progress: i }
          : op
      ));
    }

    setOperations(prev => prev.map(op => 
      op.id === operationId 
        ? { ...op, status: 'completed', progress: 100, endTime: new Date() }
        : op
    ));

    toast({
      title: 'Operasjon fullført',
      description: 'Synkronisering prøvd på nytt og fullført',
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <Upload className="h-4 w-4" />;
      case 'download':
        return <Download className="h-4 w-4" />;
      case 'merge':
        return <Merge className="h-4 w-4" />;
      default:
        return <ArrowUpDown className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-green-600">Fullført</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="text-blue-600">Pågår</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-600">Mislykket</Badge>;
      default:
        return <Badge variant="outline">Venter</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Sync Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Synkroniseringsmotor</CardTitle>
              <CardDescription>
                Håndter datasynkronisering og konfliktløsning
              </CardDescription>
            </div>
            <Button 
              onClick={startSync} 
              disabled={isSyncing}
              size="lg"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Synkroniserer...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start synkronisering
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {isSyncing && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Synkroniserer data...</span>
                <span>{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle>Synkroniseringskonflikter oppdaget</AlertTitle>
          <AlertDescription>
            {conflicts.length} konflikt{conflicts.length > 1 ? 'er' : ''} krever manuell løsning
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conflicts Section */}
        <Card>
          <CardHeader>
            <CardTitle>Konflikter ({conflicts.length})</CardTitle>
            <CardDescription>
              Løs konflikter mellom lokale og eksterne versjoner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {conflicts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                    <p>Ingen konflikter å løse</p>
                  </div>
                ) : (
                  conflicts.map((conflict) => (
                    <Card key={conflict.id} className="cursor-pointer hover:bg-muted/50">
                      <CardContent 
                        className="p-3"
                        onClick={() => setSelectedConflict(conflict)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <GitBranch className="h-4 w-4 mt-1 text-amber-600" />
                            <div>
                              <p className="font-medium text-sm">
                                {conflict.type.charAt(0).toUpperCase() + conflict.type.slice(1)} konflikt
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {conflict.description}
                              </p>
                              <div className="flex gap-4 mt-2 text-xs">
                                <span className="flex items-center gap-1">
                                  <Smartphone className="h-3 w-3" />
                                  Lokal: {new Date(conflict.localTimestamp).toLocaleTimeString('no-NO')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Server className="h-3 w-3" />
                                  Ekstern: {new Date(conflict.remoteTimestamp).toLocaleTimeString('no-NO')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Løs
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Operations History */}
        <Card>
          <CardHeader>
            <CardTitle>Operasjoner</CardTitle>
            <CardDescription>
              Nylige synkroniseringsoperasjoner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {operations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2" />
                    <p>Ingen operasjoner ennå</p>
                  </div>
                ) : (
                  operations.map((operation) => (
                    <Card key={operation.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getOperationIcon(operation.type)}
                            <div>
                              <p className="font-medium text-sm flex items-center gap-2">
                                {operation.itemCount} {operation.itemType}
                                {getStatusBadge(operation.status)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(operation.startTime).toLocaleString('no-NO')}
                              </p>
                            </div>
                          </div>
                          {operation.status === 'failed' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => retryOperation(operation.id)}
                            >
                              Prøv igjen
                            </Button>
                          )}
                        </div>
                        {operation.status === 'in_progress' && (
                          <Progress value={operation.progress} className="mt-2 h-1" />
                        )}
                        {operation.error && (
                          <p className="text-xs text-red-600 mt-2">{operation.error}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Sync Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Synkroniseringsstatistikk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Totalt synkronisert</p>
              <p className="text-2xl font-bold">{metrics.totalSyncs}</p>
              <p className="text-xs text-green-600">
                {Math.round((metrics.successfulSyncs / metrics.totalSyncs) * 100)}% suksessrate
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data overført</p>
              <p className="text-2xl font-bold">{formatBytes(metrics.dataTransferred)}</p>
              <p className="text-xs text-muted-foreground">Totalt</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gjennomsnittlig tid</p>
              <p className="text-2xl font-bold">{metrics.avgSyncTime}s</p>
              <p className="text-xs text-muted-foreground">Siste: {metrics.lastSyncDuration}s</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Konflikter løst</p>
              <p className="text-2xl font-bold">{metrics.conflictsResolved}</p>
              <p className="text-xs text-amber-600">{conflicts.length} venter</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Bokmerker</p>
              <p className="text-lg font-semibold">{metrics.itemsSynced.bookmarks}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Historikk</p>
              <p className="text-lg font-semibold">{metrics.itemsSynced.history}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Passord</p>
              <p className="text-lg font-semibold">{metrics.itemsSynced.passwords}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Innstillinger</p>
              <p className="text-lg font-semibold">{metrics.itemsSynced.settings}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conflict Resolution Dialog */}
      <Dialog open={!!selectedConflict} onOpenChange={() => setSelectedConflict(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Løs synkroniseringskonflikt</DialogTitle>
            <DialogDescription>
              Velg hvilken versjon som skal beholdes
            </DialogDescription>
          </DialogHeader>
          
          {selectedConflict && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className={conflictResolution === 'local' ? 'border-blue-500' : ''}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Lokal versjon
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(selectedConflict.localTimestamp).toLocaleString('no-NO')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(selectedConflict.localValue, null, 2)}
                    </pre>
                  </CardContent>
                </Card>

                <Card className={conflictResolution === 'remote' ? 'border-blue-500' : ''}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      Ekstern versjon
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(selectedConflict.remoteTimestamp).toLocaleString('no-NO')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(selectedConflict.remoteValue, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </div>

              <RadioGroup 
                value={conflictResolution} 
                onValueChange={(value) => setConflictResolution(value as any)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="local" id="local" />
                  <Label htmlFor="local">Bruk lokal versjon</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="remote" id="remote" />
                  <Label htmlFor="remote">Bruk ekstern versjon</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="merge" id="merge" />
                  <Label htmlFor="merge">Slå sammen begge versjoner</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedConflict(null)}>
              Avbryt
            </Button>
            <Button onClick={() => selectedConflict && resolveConflict(selectedConflict.id, conflictResolution)}>
              Løs konflikt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}