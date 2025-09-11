import { useState, useEffect, useCallback } from 'react';
import { format, isToday, isYesterday, startOfDay, isSameDay, subDays } from 'date-fns';
import { nb } from 'date-fns/locale';
import { X, Clock, Search, Trash2, ExternalLink, Trash, Loader2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { BrowserHistory } from '@shared/schema';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
}

interface HistoryResponse {
  items: BrowserHistory[];
  total: number;
  limit: number;
  offset: number;
}

interface GroupedHistory {
  date: Date;
  label: string;
  items: BrowserHistory[];
}

export function HistoryPanel({ isOpen, onClose, onNavigate }: HistoryPanelProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Fetch history with pagination and search
  const { 
    data: historyResponse, 
    isLoading,
    isFetching,
    refetch 
  } = useQuery<HistoryResponse>({
    queryKey: ['/api/browser-history', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: '200',
        offset: '0',
        ...(searchQuery && { search: searchQuery })
      });
      const response = await fetch(`/api/browser-history?${params}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      return response.json();
    },
    enabled: isOpen,
  });

  const history = historyResponse?.items || [];

  // Delete single history item
  const deleteHistoryItem = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/browser-history/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/browser-history'] });
      toast({
        title: "Historikkoppføring slettet",
        description: "Oppføringen ble fjernet fra historikken",
      });
    },
    onError: () => {
      toast({
        title: "Feil",
        description: "Kunne ikke slette historikkoppføringen",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDeletingId(null);
    }
  });

  // Clear all history
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/browser-history', 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/browser-history'] });
      setShowClearDialog(false);
      toast({
        title: "Historikk slettet",
        description: "All nettleserhistorikk har blitt slettet",
      });
    },
    onError: () => {
      toast({
        title: "Feil",
        description: "Kunne ikke slette historikken",
        variant: "destructive",
      });
    }
  });

  // Group history by date
  const groupedHistory = history.reduce((groups: GroupedHistory[], item) => {
    const itemDate = new Date(item.lastVisited || item.createdAt);
    const dateKey = startOfDay(itemDate);
    
    let group = groups.find(g => isSameDay(g.date, dateKey));
    
    if (!group) {
      let label = '';
      const now = new Date();
      const daysAgo = Math.floor((now.getTime() - dateKey.getTime()) / (1000 * 60 * 60 * 24));
      
      if (isToday(dateKey)) {
        label = 'I dag';
      } else if (isYesterday(dateKey)) {
        label = 'I går';
      } else if (daysAgo <= 7) {
        label = format(dateKey, 'EEEE', { locale: nb });
      } else if (daysAgo <= 30) {
        label = format(dateKey, 'd. MMMM', { locale: nb });
      } else {
        label = format(dateKey, 'd. MMMM yyyy', { locale: nb });
      }
      
      group = {
        date: dateKey,
        label,
        items: []
      };
      groups.push(group);
    }
    
    group.items.push(item);
    return groups;
  }, []).sort((a, b) => b.date.getTime() - a.date.getTime());

  // Sort items within each group
  groupedHistory.forEach(group => {
    group.items.sort((a, b) => {
      const aTime = new Date(a.lastVisited || a.createdAt).getTime();
      const bTime = new Date(b.lastVisited || b.createdAt).getTime();
      return bTime - aTime;
    });
  });

  // Handle delete with optimistic UI
  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    deleteHistoryItem.mutate(id);
  }, [deleteHistoryItem]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed top-0 right-0 h-full w-96 bg-card border-l shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Historikk
              {historyResponse && (
                <span className="text-sm text-muted-foreground">
                  ({historyResponse.total})
                </span>
              )}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
              data-testid="button-close-history"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search field */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Søk i historikk..."
              className="pl-9 h-9"
              data-testid="input-search-history"
            />
            {isFetching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {/* History list */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : groupedHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{searchQuery ? 'Ingen treff' : 'Ingen historikk ennå'}</p>
                <p className="text-sm mt-1">
                  {searchQuery ? 'Prøv et annet søkeord' : 'Besøkte sider vil vises her'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedHistory.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 sticky top-0 bg-card py-1">
                      {group.label}
                    </h3>
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className={`group relative transition-all ${
                            deletingId === item.id ? 'opacity-50' : ''
                          }`}
                        >
                          <button
                            onClick={() => {
                              onNavigate(item.url);
                              onClose();
                            }}
                            disabled={deletingId === item.id}
                            className="w-full text-left p-2 pr-8 rounded-md hover:bg-accent transition-colors"
                            data-testid={`history-item-${item.id}`}
                          >
                            <div className="flex items-start gap-2">
                              {item.favicon ? (
                                <img 
                                  src={item.favicon} 
                                  alt="" 
                                  className="w-4 h-4 mt-0.5 shrink-0" 
                                />
                              ) : (
                                <ExternalLink className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {item.title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.url}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(item.lastVisited || item.createdAt), 'HH:mm', { locale: nb })}
                                  </span>
                                  {item.visitCount && item.visitCount > 1 && (
                                    <span className="text-xs bg-secondary px-1.5 py-0.5 rounded-full text-secondary-foreground">
                                      {item.visitCount} besøk
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                          
                          {/* Delete button */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                data-testid={`button-delete-history-${item.id}`}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => handleDelete(e, item.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Slett
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                    {groupIndex < groupedHistory.length - 1 && (
                      <Separator className="mt-3" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with clear button */}
        {history.length > 0 && (
          <div className="border-t p-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowClearDialog(true)}
              data-testid="button-clear-all-history"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Slett all historikk
            </Button>
          </div>
        )}
      </div>

      {/* Clear all confirmation dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette vil permanent slette all nettleserhistorikk. Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearHistoryMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Slett all historikk
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}