import { Download, X, FileDown, CheckCircle, XCircle, Loader2, Trash2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import type { Download as DownloadType } from '@shared/schema';

interface DownloadsManagerProps {
  onDownloadClick?: (download: DownloadType) => void;
}

export function DownloadsManager({ onDownloadClick }: DownloadsManagerProps) {
  // Hent nedlastinger fra API
  const { data: downloads = [] } = useQuery<DownloadType[]>({
    queryKey: ['/api/downloads'],
    // Polling deaktivert - kan aktiveres ved behov
    // refetchInterval: 30000, // Oppdater hvert 30. sekund hvis nødvendig
  });

  // Slett nedlasting mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/downloads/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/downloads'] });
    },
  });

  // Tell aktive nedlastinger
  const activeDownloads = downloads.filter(d => 
    d.status === 'downloading' || d.status === 'pending'
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'downloading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'pending':
        return <FileDown className="w-4 h-4 text-gray-500" />;
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title="Nedlastinger"
          data-testid="button-downloads"
        >
          <Download className="h-4 w-4" />
          {activeDownloads.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
              {activeDownloads.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 p-0" align="end">
        <div className="border-b p-3">
          <h3 className="font-semibold">Nedlastinger</h3>
        </div>
        
        <ScrollArea className="h-[400px]">
          {downloads.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Download className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Ingen nedlastinger</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {downloads.map((download) => (
                <div
                  key={download.id}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() => download.status === 'completed' && onDownloadClick?.(download)}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(download.status)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" title={download.filename}>
                        {download.filename}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{formatFileSize(download.size)}</span>
                        <span>•</span>
                        <span>{getStatusText(download.status)}</span>
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
                      
                      {download.status === 'downloading' && (
                        <div className="mt-2">
                          <Progress value={download.progress || 0} className="h-1" />
                          <span className="text-xs text-muted-foreground">
                            {download.progress}%
                          </span>
                        </div>
                      )}
                      
                      {download.status === 'failed' && download.error && (
                        <p className="text-xs text-red-500 mt-1">{download.error}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {download.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Åpne i filutforsker (krever Electron)
                          }}
                          title="Vis i mappe"
                          data-testid={`button-open-folder-${download.id}`}
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
                        data-testid={`button-delete-download-${download.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {downloads.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                downloads.forEach(d => deleteMutation.mutate(d.id));
              }}
              data-testid="button-clear-downloads"
            >
              Tøm nedlastingsliste
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}