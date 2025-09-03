import { useState, useEffect } from 'react';
import { format, isToday, isYesterday, startOfDay, isSameDay } from 'date-fns';
import { nb } from 'date-fns/locale';
import { X, Clock, Search, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { BrowserHistory } from '@shared/schema';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
}

interface GroupedHistory {
  date: Date;
  label: string;
  items: BrowserHistory[];
}

export function HistoryPanel({ isOpen, onClose, onNavigate }: HistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Hent historikk
  const { data: history = [], refetch } = useQuery<BrowserHistory[]>({
    queryKey: ['/api/browser-history'],
  });

  // Slett all historikk
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/browser-history', 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/browser-history'] });
    },
  });

  // Filtrer historikk basert på søk
  const filteredHistory = history.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(query) || 
           item.url.toLowerCase().includes(query);
  });

  // Grupper historikk etter dato
  const groupedHistory = filteredHistory.reduce((groups: GroupedHistory[], item) => {
    const itemDate = new Date(item.lastVisited || item.createdAt);
    const dateKey = startOfDay(itemDate);
    
    let group = groups.find(g => isSameDay(g.date, dateKey));
    
    if (!group) {
      let label = '';
      if (isToday(dateKey)) {
        label = 'I dag';
      } else if (isYesterday(dateKey)) {
        label = 'I går';
      } else {
        label = format(dateKey, 'EEEE d. MMMM', { locale: nb });
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

  // Sorter elementer innenfor hver gruppe
  groupedHistory.forEach(group => {
    group.items.sort((a, b) => {
      const aTime = new Date(a.lastVisited || a.createdAt).getTime();
      const bTime = new Date(b.lastVisited || b.createdAt).getTime();
      return bTime - aTime;
    });
  });

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-card border-l shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Historikk
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Søkefelt */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søk i historikk..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Historikkliste */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {groupedHistory.length === 0 ? (
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
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.url);
                          onClose();
                        }}
                        className="w-full text-left p-2 rounded-md hover:bg-accent group transition-colors"
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
                                <span className="text-xs text-muted-foreground">
                                  {item.visitCount} besøk
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
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

      {/* Footer med slett-knapp */}
      {history.length > 0 && (
        <div className="border-t p-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              if (confirm('Er du sikker på at du vil slette all historikk?')) {
                clearHistoryMutation.mutate();
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Slett all historikk
          </Button>
        </div>
      )}
    </div>
  );
}