import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Search, Clock, Globe, X, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { BrowserHistory } from '@shared/schema';
import { cn } from '@/lib/utils';

interface SearchSuggestionsProps {
  query: string;
  isOpen: boolean;
  onSelect: (url: string) => void;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

interface Suggestion {
  type: 'history' | 'search' | 'url';
  text: string;
  url: string;
  favicon?: string;
}

export const SearchSuggestions = memo(function SearchSuggestions({ 
  query, 
  isOpen, 
  onSelect, 
  onClose,
  anchorRef
}: SearchSuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(false);

  // Hent historikk for forslag med optimalisering
  const { data: history = [] } = useQuery<BrowserHistory[]>({
    queryKey: ['/api/browser-history'],
    enabled: isOpen && query.length > 0,
    staleTime: 60000, // Cache i 60 sekunder
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false
  });

  // Generer forslag basert på søk
  const suggestions = useMemo(() => {
    if (!query || !isOpen) {
      return [];
    }

    const newSuggestions: Suggestion[] = [];
    const lowerQuery = query.toLowerCase();

    // Sjekk om det er en URL
    if (query.includes('.') || query.startsWith('http')) {
      const url = query.startsWith('http') ? query : `https://${query}`;
      newSuggestions.push({
        type: 'url',
        text: url,
        url: url
      });
    }

    // Historikk-baserte forslag
    if (history && history.length > 0) {
      const matchingHistory = history
        .filter(item => 
          item.title.toLowerCase().includes(lowerQuery) || 
          item.url.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)
        .map(item => ({
          type: 'history' as const,
          text: item.title,
          url: item.url,
          favicon: item.favicon || undefined
        }));
      
      newSuggestions.push(...matchingHistory);
    }

    // Google søkeforslag (hvis ikke URL)
    if (!query.includes('.') && !query.startsWith('http')) {
      newSuggestions.push({
        type: 'search',
        text: `Søk på Google: ${query}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
      });
    }

    return newSuggestions;
  }, [query, history, isOpen]);

  // Reset selected index når query endres
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  // Håndter tastatursnarveier
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          onSelect(suggestions[selectedIndex].url);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, selectedIndex, suggestions, onSelect, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Lukk ved klikk utenfor
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) &&
          anchorRef?.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Forsinkelse for å unngå umiddelbar lukking
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  // Sett mounted ref
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  if (!isOpen || suggestions.length === 0) return null;

  const getIcon = (type: string, index: number) => {
    const isActive = index === selectedIndex || index === hoveredIndex;
    const iconClass = cn(
      "w-4 h-4 transition-all duration-200",
      isActive ? "text-primary scale-110" : "text-muted-foreground"
    );
    
    switch (type) {
      case 'history':
        return <Clock className={iconClass} />;
      case 'search':
        return <Search className={iconClass} />;
      case 'url':
        return <Globe className={iconClass} />;
      default:
        return null;
    }
  };

  // Beregn posisjon basert på anchor element
  const getPosition = () => {
    if (!anchorRef?.current) return {};
    
    const rect = anchorRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width
    };
  };

  const position = getPosition();

  return (
    <div
      ref={containerRef}
      className="fixed bg-card/95 backdrop-blur-md border rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200"
      style={{
        top: position.top ? `${position.top}px` : 'auto',
        left: position.left ? `${position.left}px` : 'auto',
        width: position.width ? `${position.width}px` : 'auto',
        maxHeight: '400px'
      }}
      data-testid="search-suggestions"
    >
      <div className="py-1">
        {suggestions.map((suggestion, index) => {
          const isSelected = index === selectedIndex;
          const isHovered = index === hoveredIndex;
          
          return (
            <div
              key={`${suggestion.type}-${index}`}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 cursor-pointer group",
                "transition-all duration-200 ease-out",
                isSelected && "bg-accent",
                !isSelected && "hover:bg-accent/50",
                (isSelected || isHovered) && "px-4"
              )}
              onClick={() => onSelect(suggestion.url)}
              onMouseEnter={() => {
                setHoveredIndex(index);
                setSelectedIndex(index);
              }}
              onMouseLeave={() => setHoveredIndex(-1)}
              data-testid={`suggestion-${index}`}
            >
              <div className={cn(
                "flex items-center justify-center transition-all duration-200",
                (isSelected || isHovered) && "animate-pulse-subtle"
              )}>
                {suggestion.favicon ? (
                  <img 
                    src={suggestion.favicon} 
                    alt="" 
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      (isSelected || isHovered) && "scale-110"
                    )}
                  />
                ) : (
                  getIcon(suggestion.type, index)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm truncate transition-all duration-200",
                  (isSelected || isHovered) && "font-medium translate-x-1"
                )}>
                  {suggestion.text}
                </p>
                {suggestion.type === 'history' && (
                  <p className={cn(
                    "text-xs text-muted-foreground truncate transition-all duration-200",
                    (isSelected || isHovered) && "text-muted-foreground/80"
                  )}>
                    {suggestion.url}
                  </p>
                )}
              </div>
              
              {/* Animated arrow indicator */}
              <ArrowRight className={cn(
                "w-4 h-4 text-primary transition-all duration-200",
                (isSelected || isHovered) ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
              )} />
              {suggestion.type === 'history' && (
                <button
                  className={cn(
                    "p-1 rounded transition-all duration-200",
                    "opacity-0 group-hover:opacity-100",
                    "hover:bg-destructive/20 hover:text-destructive"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Fjern fra historikk (implementer senere)
                  }}
                  title="Fjern fra historikk"
                  data-testid={`remove-history-${index}`}
                >
                  <X className="w-3 h-3 transition-transform duration-200 hover:scale-125" />
                </button>
              )}
              
              {/* Hover highlight effect */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 pointer-events-none",
                "transition-opacity duration-200",
                (isSelected || isHovered) ? "opacity-100" : "opacity-0"
              )} />
            </div>
          );
        })}
      </div>
      
      {query.length > 0 && (
        <div className="border-t px-3 py-2 text-xs text-muted-foreground bg-muted/30 animate-in fade-in duration-300">
          <span className="opacity-75">Bruk piltastene for å navigere, Enter for å velge</span>
        </div>
      )}
    </div>
  );
});