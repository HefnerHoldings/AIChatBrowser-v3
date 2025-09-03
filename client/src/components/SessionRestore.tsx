import { useState, useEffect } from 'react';
import { RotateCcw, Save, Clock, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent, 
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';

interface TabSession {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

interface BrowserSession {
  id: string;
  tabs: TabSession[];
  timestamp: Date;
  name?: string;
  autoSaved?: boolean;
}

interface SessionRestoreProps {
  currentTabs?: TabSession[];
  onRestoreSession: (session: BrowserSession) => void;
}

export function SessionRestore({ currentTabs = [], onRestoreSession }: SessionRestoreProps) {
  const [savedSessions, setSavedSessions] = useState<BrowserSession[]>([]);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');

  // Hent lagrede økter fra localStorage
  useEffect(() => {
    const loadSessions = () => {
      const stored = localStorage.getItem('browser_sessions');
      if (stored) {
        const sessions = JSON.parse(stored) as BrowserSession[];
        setSavedSessions(sessions.map(s => ({
          ...s,
          timestamp: new Date(s.timestamp)
        })));
      }
    };
    
    loadSessions();
    
    // Auto-lagring hver 30 sekunder hvis det er åpne faner
    const autoSaveInterval = setInterval(() => {
      if (currentTabs.length > 0) {
        autoSaveSession();
      }
    }, 30000);
    
    return () => clearInterval(autoSaveInterval);
  }, [currentTabs]);

  // Auto-lagre nåværende økt
  const autoSaveSession = () => {
    if (currentTabs.length === 0) return;
    
    const autoSaveSession: BrowserSession = {
      id: 'autosave',
      tabs: currentTabs,
      timestamp: new Date(),
      name: 'Autolagret økt',
      autoSaved: true
    };
    
    setSavedSessions(prev => {
      const filtered = prev.filter(s => s.id !== 'autosave');
      const updated = [autoSaveSession, ...filtered].slice(0, 20); // Behold maks 20 økter
      localStorage.setItem('browser_sessions', JSON.stringify(updated));
      return updated;
    });
    
    setLastAutoSave(new Date());
  };

  // Manuelt lagre økt
  const saveCurrentSession = () => {
    if (currentTabs.length === 0) return;
    
    const newSession: BrowserSession = {
      id: Date.now().toString(),
      tabs: currentTabs,
      timestamp: new Date(),
      name: sessionName || `Økt med ${currentTabs.length} faner`
    };
    
    setSavedSessions(prev => {
      const updated = [newSession, ...prev].slice(0, 20);
      localStorage.setItem('browser_sessions', JSON.stringify(updated));
      return updated;
    });
    
    setSessionName('');
    setIsDialogOpen(false);
  };

  // Slett økt
  const deleteSession = (sessionId: string) => {
    setSavedSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      localStorage.setItem('browser_sessions', JSON.stringify(updated));
      return updated;
    });
  };

  // Gjenopprett økt
  const handleRestoreSession = (session: BrowserSession) => {
    onRestoreSession(session);
    setIsDialogOpen(false);
  };

  // Finn siste lukkede faner (for "gjenåpne lukket fane" funksjon)
  const getRecentlyClosedTabs = () => {
    const stored = localStorage.getItem('recently_closed_tabs');
    if (stored) {
      return JSON.parse(stored) as TabSession[];
    }
    return [];
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Øktbehandling"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Øktbehandling</DialogTitle>
          <DialogDescription>
            Lagre og gjenopprett nettleserøkter med alle åpne faner
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lagre nåværende økt */}
          {currentTabs.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Nåværende økt
                </h3>
                <div className="flex items-center gap-2">
                  {lastAutoSave && (
                    <span className="text-xs text-muted-foreground">
                      Autolagret {formatDistanceToNow(lastAutoSave, { 
                        addSuffix: true, 
                        locale: nb 
                      })}
                    </span>
                  )}
                  <Button
                    size="sm"
                    onClick={() => {
                      const name = prompt('Gi økten et navn:');
                      if (name) {
                        setSessionName(name);
                        saveCurrentSession();
                      }
                    }}
                  >
                    Lagre økt
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {currentTabs.length} {currentTabs.length === 1 ? 'fane' : 'faner'} åpne
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {currentTabs.slice(0, 5).map((tab, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tab.title.substring(0, 20)}
                    {tab.title.length > 20 && '...'}
                  </Badge>
                ))}
                {currentTabs.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{currentTabs.length - 5} mer
                  </Badge>
                )}
              </div>
            </Card>
          )}

          {/* Lagrede økter */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Lagrede økter
            </h3>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {savedSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <RotateCcw className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Ingen lagrede økter</p>
                    <p className="text-sm mt-1">Lagre din nåværende økt for å kunne gjenopprette den senere</p>
                  </div>
                ) : (
                  savedSessions.map((session) => (
                    <Card key={session.id} className="p-3 hover:bg-accent/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {session.name || `Økt ${session.id}`}
                            </span>
                            {session.autoSaved && (
                              <Badge variant="outline" className="text-xs">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Auto
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {session.tabs.length} {session.tabs.length === 1 ? 'fane' : 'faner'} • 
                            {' '}Lagret {formatDistanceToNow(session.timestamp, { 
                              addSuffix: true, 
                              locale: nb 
                            })}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {session.tabs.slice(0, 3).map((tab, idx) => (
                              <div key={idx} className="flex items-center gap-1 text-xs bg-secondary rounded px-2 py-1">
                                {tab.favicon && (
                                  <img src={tab.favicon} alt="" className="w-3 h-3" />
                                )}
                                <span className="truncate max-w-[150px]">
                                  {tab.title}
                                </span>
                              </div>
                            ))}
                            {session.tabs.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{session.tabs.length - 3} mer
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreSession(session)}
                          >
                            Gjenopprett
                          </Button>
                          {!session.autoSaved && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteSession(session.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Nylig lukkede faner */}
          {getRecentlyClosedTabs().length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Nylig lukkede faner</h3>
              <div className="space-y-1">
                {getRecentlyClosedTabs().slice(0, 5).map((tab, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    onClick={() => {
                      // Gjenåpne enkelt fane
                      onRestoreSession({
                        id: `closed-${idx}`,
                        tabs: [tab],
                        timestamp: new Date()
                      });
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {tab.favicon && (
                        <img src={tab.favicon} alt="" className="w-4 h-4" />
                      )}
                      <span className="truncate">{tab.title}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}