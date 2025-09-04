import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  History, 
  Download, 
  Plus,
  GripVertical,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  component?: React.ReactNode;
  active: boolean;
}

interface LeftSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  bookmarks?: any[];
  history?: any[];
  downloads?: any[];
  onBookmarkClick?: (url: string) => void;
  onHistoryClick?: (url: string) => void;
  className?: string;
}

export function LeftSidebar({
  isOpen,
  onToggle,
  bookmarks = [],
  history = [],
  downloads = [],
  onBookmarkClick,
  onHistoryClick,
  className
}: LeftSidebarProps) {
  const [activeTools, setActiveTools] = useState<string[]>(['bookmarks', 'history']);
  const [draggedTool, setDraggedTool] = useState<string | null>(null);
  const [tools, setTools] = useState<Tool[]>([
    { 
      id: 'bookmarks', 
      name: 'Bokmerker', 
      icon: <Bookmark className="h-4 w-4" />,
      active: true
    },
    { 
      id: 'history', 
      name: 'Historikk', 
      icon: <History className="h-4 w-4" />,
      active: true
    },
    { 
      id: 'downloads', 
      name: 'Nedlastinger', 
      icon: <Download className="h-4 w-4" />,
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
    setTools(tools.map(tool => 
      tool.id === toolId ? { ...tool, active: !tool.active } : tool
    ));
  };

  const renderToolContent = (toolId: string) => {
    switch (toolId) {
      case 'bookmarks':
        return (
          <div className="space-y-1 p-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
              Bokmerker
            </h3>
            {bookmarks.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2 py-2">
                Ingen bokmerker
              </p>
            ) : (
              bookmarks.map(bookmark => (
                <button
                  key={bookmark.id}
                  onClick={() => onBookmarkClick?.(bookmark.url)}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-accent/50 transition-colors group"
                  data-testid={`bookmark-${bookmark.id}`}
                >
                  <div className="flex items-center gap-2">
                    {bookmark.favicon && (
                      <img src={bookmark.favicon} alt="" className="w-4 h-4" />
                    )}
                    <span className="text-sm truncate flex-1">
                      {bookmark.title}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        );
      case 'history':
        return (
          <div className="space-y-1 p-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
              Historikk
            </h3>
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2 py-2">
                Ingen historikk
              </p>
            ) : (
              history.slice(0, 20).map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => onHistoryClick?.(item.url)}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-accent/50 transition-colors"
                  data-testid={`history-${item.id}`}
                >
                  <div className="flex items-center gap-2">
                    {item.favicon && (
                      <img src={item.favicon} alt="" className="w-4 h-4" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {new Date(item.lastVisited).toLocaleDateString('nb-NO')}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        );
      case 'downloads':
        return (
          <div className="space-y-1 p-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
              Nedlastinger
            </h3>
            {downloads.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2 py-2">
                Ingen nedlastinger
              </p>
            ) : (
              <p className="text-xs text-muted-foreground px-2 py-2">
                {downloads.length} nedlastinger
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn(
          "fixed left-2 top-20 z-40 bg-card/80 backdrop-blur-sm border shadow-sm",
          isOpen && "left-[252px]"
        )}
        data-testid="toggle-left-sidebar"
      >
        {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {/* Sidebar Panel */}
      <div
        className={cn(
          "fixed left-0 top-16 bottom-0 w-64 z-30",
          "bg-background/60 backdrop-blur-xl border-r",
          "shadow-2xl transition-transform duration-300",
          "glass-panel",
          !isOpen && "-translate-x-full",
          className
        )}
      >
        <ScrollArea className="h-full">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Verktøy</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  // Åpne verktøyskonfigurasjon
                }}
                data-testid="add-tool"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Tools */}
            <div className="space-y-2">
              {tools.map((tool, index) => (
                <div key={tool.id}>
                  {tool.active && (
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, tool.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, tool.id)}
                      className={cn(
                        "rounded-lg bg-card/50 backdrop-blur-sm border",
                        "transition-all duration-200",
                        draggedTool === tool.id && "opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-2 px-3 py-2 cursor-move">
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
                      {renderToolContent(tool.id)}
                    </div>
                  )}
                  {index < tools.length - 1 && tool.active && <div className="h-2" />}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}