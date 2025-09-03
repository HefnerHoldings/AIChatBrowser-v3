import { useState, useEffect, useRef } from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TabPreviewProps {
  tab: {
    id: string;
    title: string;
    url: string;
    favicon?: string;
    isLoading?: boolean;
  };
  isActive: boolean;
  position: { x: number; y: number };
}

export function TabPreview({ tab, isActive, position }: TabPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (previewRef.current) {
      const rect = previewRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newX = position.x;
      let newY = position.y + 10;
      
      // Juster posisjon hvis preview går utenfor viewport
      if (rect.right > viewportWidth) {
        newX = viewportWidth - rect.width - 10;
      }
      if (newX < 10) {
        newX = 10;
      }
      if (rect.bottom > viewportHeight) {
        newY = position.y - rect.height - 40;
      }
      
      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [position]);

  // Forkortet URL for visning
  const displayUrl = tab.url.replace(/^https?:\/\/(www\.)?/, '').substring(0, 50);

  return (
    <Card
      ref={previewRef}
      className="fixed z-50 p-3 shadow-xl border bg-popover w-80 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-100"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      <div className="space-y-2">
        {/* Header med favicon og tittel */}
        <div className="flex items-start gap-2">
          {tab.favicon ? (
            <img 
              src={tab.favicon} 
              alt="" 
              className="w-5 h-5 mt-0.5 shrink-0" 
            />
          ) : (
            <Globe className="w-5 h-5 mt-0.5 shrink-0 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {tab.title || 'Ingen tittel'}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {displayUrl}
            </p>
          </div>
        </div>

        {/* Preview innhold */}
        <div className="bg-muted rounded-md h-40 flex items-center justify-center relative overflow-hidden">
          {tab.isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Laster...</p>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-background/50 to-background flex flex-col items-center justify-center">
              <Globe className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground mt-2">Forhåndsvisning</p>
            </div>
          )}
          
          {/* Status badge */}
          {isActive && (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-md">
              Aktiv
            </div>
          )}
        </div>
        
        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{tab.isLoading ? 'Laster side...' : 'Klar'}</span>
          <span className="truncate max-w-[150px]">{tab.url.split('/')[2]}</span>
        </div>
      </div>
    </Card>
  );
}