import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Shield, 
  Activity,
  Code2,
  Wifi,
  Monitor as MonitorIcon,
  Puzzle,
  Key,
  Volume2,
  BookOpen,
  GripVertical,
  X,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  active: boolean;
  component?: React.ReactNode;
}

interface RightSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onToolToggle: (toolId: string, active: boolean) => void;
  activeTools?: string[];
  className?: string;
}

export function RightSidebar({
  isOpen,
  onToggle,
  onToolToggle,
  activeTools = [],
  className
}: RightSidebarProps) {
  const [draggedTool, setDraggedTool] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tools, setTools] = useState<Tool[]>([
    { 
      id: 'security', 
      name: 'Sikkerhet', 
      icon: <Shield className="h-4 w-4" />,
      description: 'Sikkerhetssandbox og tillatelser',
      active: false
    },
    { 
      id: 'performance', 
      name: 'Ytelse', 
      icon: <Activity className="h-4 w-4" />,
      description: 'Ytelsesovervåking og statistikk',
      active: true
    },
    { 
      id: 'devtools', 
      name: 'Utviklerverktøy', 
      icon: <Code2 className="h-4 w-4" />,
      description: 'Inspeksjon og feilsøking',
      active: false
    },
    { 
      id: 'network', 
      name: 'Nettverk', 
      icon: <Wifi className="h-4 w-4" />,
      description: 'Nettverksovervåking og analyse',
      active: false
    },
    { 
      id: 'webapis', 
      name: 'Web APIer', 
      icon: <MonitorIcon className="h-4 w-4" />,
      description: 'Web API-tilgang og konfigurasjon',
      active: false
    },
    { 
      id: 'extensions', 
      name: 'Utvidelser', 
      icon: <Puzzle className="h-4 w-4" />,
      description: 'Administrer nettleserutvidelser',
      active: false
    },
    { 
      id: 'passwords', 
      name: 'Passord', 
      icon: <Key className="h-4 w-4" />,
      description: 'Passordadministrasjon',
      active: false
    },
    { 
      id: 'media', 
      name: 'Media', 
      icon: <Volume2 className="h-4 w-4" />,
      description: 'Mediakontroller og innstillinger',
      active: false
    },
    { 
      id: 'reader', 
      name: 'Lesemodus', 
      icon: <BookOpen className="h-4 w-4" />,
      description: 'Forenklet lesevisning',
      active: false
    }
  ]);

  const handleDragStart = (e: React.DragEvent, toolId: string) => {
    setDraggedTool(toolId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTool || draggedTool === targetId) return;

    const draggedIndex = tools.findIndex(t => t.id === draggedTool);
    const targetIndex = tools.findIndex(t => t.id === targetId);

    const newTools = [...tools];
    const [removed] = newTools.splice(draggedIndex, 1);
    newTools.splice(targetIndex, 0, removed);

    setTools(newTools);
    setDraggedTool(null);
  };

  const toggleTool = (toolId: string) => {
    const newTools = tools.map(tool => 
      tool.id === toolId ? { ...tool, active: !tool.active } : tool
    );
    setTools(newTools);
    
    const tool = newTools.find(t => t.id === toolId);
    if (tool) {
      onToolToggle(toolId, tool.active);
    }
  };

  const activatedTools = tools.filter(t => t.active);
  const availableTools = tools.filter(t => !t.active);

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn(
          "fixed right-2 top-20 z-40 bg-card/80 backdrop-blur-sm border shadow-sm",
          isOpen && "right-[252px]"
        )}
        data-testid="toggle-right-sidebar"
      >
        {isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Sidebar Panel */}
      <div
        className={cn(
          "fixed right-0 top-16 bottom-0 w-64 z-30",
          "bg-background/60 backdrop-blur-xl border-l",
          "shadow-2xl transition-transform duration-300",
          "glass-panel",
          !isOpen && "translate-x-full",
          className
        )}
      >
        <ScrollArea className="h-full">
          <div className="p-4">
            {/* Header with Settings */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Avanserte verktøy</h2>
              <div className="flex gap-1">
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      data-testid="tool-settings"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Verktøyinnstillinger</DialogTitle>
                      <DialogDescription>
                        Aktiver eller deaktiver verktøy
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      {tools.map(tool => (
                        <div 
                          key={tool.id} 
                          className="flex items-center justify-between space-x-2"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            {tool.icon}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{tool.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {tool.description}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={tool.active}
                            onCheckedChange={() => toggleTool(tool.id)}
                            data-testid={`toggle-${tool.id}`}
                          />
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    // Åpne verktøysmarked
                  }}
                  data-testid="add-advanced-tool"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Active Tools */}
            <div className="space-y-2">
              {activatedTools.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-2">
                    Ingen aktive verktøy
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    className="text-xs"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Konfigurer verktøy
                  </Button>
                </div>
              ) : (
                activatedTools.map((tool, index) => (
                  <div key={tool.id}>
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, tool.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, tool.id)}
                      className={cn(
                        "rounded-lg bg-card/50 backdrop-blur-sm border",
                        "transition-all duration-200 cursor-move",
                        draggedTool === tool.id && "opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-2 px-3 py-2">
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                        {tool.icon}
                        <span className="text-sm flex-1">{tool.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => toggleTool(tool.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <Separator />
                      <div className="p-3">
                        <p className="text-xs text-muted-foreground">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                    {index < activatedTools.length - 1 && <div className="h-2" />}
                  </div>
                ))
              )}
            </div>

            {/* Available Tools Count */}
            {availableTools.length > 0 && (
              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                  {availableTools.length} verktøy tilgjengelig
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}