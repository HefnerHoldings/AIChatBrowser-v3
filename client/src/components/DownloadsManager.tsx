import { Download, X, FileDown, CheckCircle, XCircle, Loader2, Trash2, FolderOpen, Search, Filter, RefreshCw, Pause, Play, XSquare, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Download as DownloadType } from '@shared/schema';

interface DownloadsManagerProps {
  onDownloadClick?: (download: DownloadType) => void;
  onClose?: () => void;
}

export function DownloadsManager({ onDownloadClick, onClose }: DownloadsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [showClearDialog, setShowClearDialog] = useState(false);
  const { toast } = useToast();

  // Fetch downloads with polling for active downloads
  const { data: response, refetch } = useQuery<{downloads: DownloadType[], total: number}>({
    queryKey: ['/api/downloads', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/downloads?${params}`);
      return response.json();
    },
    refetchInterval: (query) => {
      // Poll every 1 second if there are active downloads
      const data = query.state.data;
      if (data?.downloads?.some((d: DownloadType) => d.status === 'downloading' || d.status === 'pending')) {
        return 1000;
      }
      return false;
    },
  });

  const downloads = response?.downloads || [];

  // Cancel download mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/downloads/${id}/cancel`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/downloads'] });
      toast({
        title: 'Nedlasting avbrutt',
        description: 'Nedlastingen ble avbrutt.',
      });
    },
  });

  // Retry download mutation
  const retryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/downloads/${id}/retry`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/downloads'] });
      toast({
        title: 'Prøver på nytt',
        description: 'Starter nedlastingen på nytt.',
      });
    },
  });

  // Delete download mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/downloads/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/downloads'] });
    },
  });

  // Clear completed downloads mutation
  const clearCompletedMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/downloads/clear-completed', 'DELETE');
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/downloads'] });
      toast({
        title: 'Fullførte nedlastinger fjernet',
        description: `${data.cleared} nedlastinger ble fjernet fra listen.`,
      });
      setShowClearDialog(false);
    },
  });

  // Filter and sort downloads
  const filteredDownloads = useMemo(() => {
    let filtered = [...downloads];

    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.filename.toLowerCase().includes(search) ||
        d.url.toLowerCase().includes(search)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.filename.localeCompare(b.filename);
        case 'size':
          return (b.size || 0) - (a.size || 0);
        case 'date':
        default:
          return new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime();
      }
    });

    return filtered;
  }, [downloads, searchQuery, sortBy]);

  // Count active downloads
  const activeDownloads = downloads.filter(d => 
    d.status === 'downloading' || d.status === 'pending'
  );

  const completedDownloads = downloads.filter(d => d.status === 'completed');

  // Show notification when download completes
  useEffect(() => {
    const checkCompleted = () => {
      downloads.forEach(download => {
        if (download.status === 'completed' && download.completedAt) {
          const completedTime = new Date(download.completedAt).getTime();
          const now = Date.now();
          // If completed within last 2 seconds, show notification
          if (now - completedTime < 2000) {
            toast({
              title: 'Nedlasting fullført',
              description: `${download.filename} er lastet ned.`,
              action: (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDownloadClick?.(download)}
                >
                  Åpne
                </Button>
              ),
            });
          }
        }
      });
    };
    
    checkCompleted();
  }, [downloads, toast, onDownloadClick]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" data-testid="icon-completed" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" data-testid="icon-failed" />;
      case 'downloading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" data-testid="icon-downloading" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" data-testid="icon-pending" />;
      case 'cancelled':
        return <XSquare className="w-4 h-4 text-orange-500" data-testid="icon-cancelled" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Ukjent størrelse';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Fullført';
      case 'failed':
        return 'Mislyktes';
      case 'downloading':
        return 'Laster ned...';
      case 'pending':
        return 'Venter...';
      case 'cancelled':
        return 'Avbrutt';
      default:
        return status;
    }
  };

  const getFileTypeIcon = (mimeType: string | null) => {
    if (!mimeType) return <FileDown className="w-8 h-8 text-gray-400" />;
    
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('video')) return '🎬';
    if (mimeType.includes('audio')) return '🎵';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation')) return '📑';
    
    return <FileDown className="w-8 h-8 text-gray-400" />;
  };

  return (
    <div className="w-[600px] h-[500px] flex flex-col bg-background border rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Nedlastinger</h3>
          <div className="flex items-center gap-2">
            {activeDownloads.length > 0 && (
              <span className="text-sm text-muted-foreground" data-testid="text-active-count">
                {activeDownloads.length} aktive
              </span>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                title="Lukk"
                data-testid="button-close"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk nedlastinger..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              data-testid="input-search"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="downloading">Aktive</SelectItem>
              <SelectItem value="completed">Fullført</SelectItem>
              <SelectItem value="failed">Mislyktes</SelectItem>
              <SelectItem value="cancelled">Avbrutt</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[120px]" data-testid="select-sort">
              <SelectValue placeholder="Sorter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Dato</SelectItem>
              <SelectItem value="name">Navn</SelectItem>
              <SelectItem value="size">Størrelse</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" data-testid="button-more-actions">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => refetch()}
                data-testid="menu-refresh"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Oppdater
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowClearDialog(true)}
                disabled={completedDownloads.length === 0}
                data-testid="menu-clear-completed"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Fjern fullførte
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Downloads list */}
      <ScrollArea className="flex-1">
        {filteredDownloads.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Download className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{searchQuery ? 'Ingen nedlastinger funnet' : 'Ingen nedlastinger'}</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredDownloads.map((download) => (
              <div
                key={download.id}
                className={cn(
                  "p-3 rounded-lg border bg-card transition-colors group",
                  download.status === 'completed' && "hover:bg-accent/50 cursor-pointer"
                )}
                onClick={() => download.status === 'completed' && onDownloadClick?.(download)}
                data-testid={`download-item-${download.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-1">{getFileTypeIcon(download.mimeType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" title={download.filename}>
                          {download.filename}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          {getStatusIcon(download.status)}
                          <span>{getStatusText(download.status)}</span>
                          <span>•</span>
                          <span>{formatFileSize(download.size)}</span>
                          {download.startedAt && (
                            <>
                              <span>•</span>
                              <span>
                                {formatDistanceToNow(new Date(download.startedAt), { 
                                  addSuffix: true,
                                  locale: nb 
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {download.status === 'downloading' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelMutation.mutate(download.id);
                            }}
                            title="Avbryt"
                            data-testid={`button-cancel-${download.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {download.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              retryMutation.mutate(download.id);
                            }}
                            title="Prøv på nytt"
                            data-testid={`button-retry-${download.id}`}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {download.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Open in folder functionality would be here
                              toast({
                                title: 'Åpne i mappe',
                                description: 'Denne funksjonen er ikke tilgjengelig i nettlesermodus.',
                              });
                            }}
                            title="Vis i mappe"
                            data-testid={`button-folder-${download.id}`}
                          >
                            <FolderOpen className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(download.id);
                          }}
                          title="Fjern fra liste"
                          data-testid={`button-delete-${download.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Progress bar for downloading */}
                    {download.status === 'downloading' && (
                      <div className="mt-2">
                        <Progress value={download.progress || 0} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{download.progress}%</span>
                          {download.size && (
                            <span>
                              {formatFileSize(Math.floor((download.size * (download.progress || 0)) / 100))} 
                              {' av '}
                              {formatFileSize(download.size)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Error message for failed downloads */}
                    {download.status === 'failed' && download.error && (
                      <p className="text-xs text-red-500 mt-1">{download.error}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Clear completed dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fjern fullførte nedlastinger?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette vil fjerne {completedDownloads.length} fullførte nedlastinger fra listen. 
              Filene vil ikke bli slettet fra disken.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => clearCompletedMutation.mutate()}
              data-testid="button-confirm-clear"
            >
              Fjern
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}