import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Clock, Globe, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { BrowserHistory } from '@shared/schema';

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

export function SearchSuggestions({ 
  query, 
  isOpen, 
  onSelect, 
  onClose,
  anchorRef
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hent historikk for forslag
  const { data: history = [] } = useQuery<BrowserHistory[]>({
    queryKey: ['/api/browser-history'],
    enabled: isOpen && query.length > 0
  });

  // Generer forslag basert på søk
  const generatedSuggestions = useMemo(() => {
    if (!query || !isOpen) {
      return [];
    }

    const newSuggestions: Suggestion[] = [];
    const lowerQuery = query.toLowerCase();

    // Sjekk om det er en URL
    if (query.includes('.') || query.startsWith('http')) {
      // Hvis det ser ut som en URL, foreslå å navigere direkte
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
  
  // Update suggestions when generated suggestions change
  useEffect(() => {
    setSuggestions(generatedSuggestions);
    setSelectedIndex(-1);
  }, [generatedSuggestions]);

  // Håndter tastatursnarveier
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, suggestions, onSelect, onClose]);

  // Lukk ved klikk utenfor
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) &&
          anchorRef?.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen || suggestions.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'history':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'search':
        return <Search className="w-4 h-4 text-muted-foreground" />;
      case 'url':
        return <Globe className="w-4 h-4 text-muted-foreground" />;
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
      className="fixed bg-card border rounded-lg shadow-lg overflow-hidden z-50"
      style={{
        top: position.top ? `${position.top}px` : 'auto',
        left: position.left ? `${position.left}px` : 'auto',
        width: position.width ? `${position.width}px` : 'auto',
        maxHeight: '400px'
      }}
      data-testid="search-suggestions"
    >
      <div className="py-1">
        {suggestions.map((suggestion, index) => (
          <div
            key={`${suggestion.type}-${index}`}
            className={`
              flex items-center gap-3 px-3 py-2 cursor-pointer
              ${index === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'}
            `}
            onClick={() => onSelect(suggestion.url)}
            onMouseEnter={() => setSelectedIndex(index)}
            data-testid={`suggestion-${index}`}
          >
            {suggestion.favicon ? (
              <img src={suggestion.favicon} alt="" className="w-4 h-4" />
            ) : (
              getIcon(suggestion.type)
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{suggestion.text}</p>
              {suggestion.type === 'history' && (
                <p className="text-xs text-muted-foreground truncate">
                  {suggestion.url}
                </p>
              )}
            </div>
            {suggestion.type === 'history' && (
              <button
                className="opacity-0 hover:opacity-100 p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  // Fjern fra historikk (implementer senere)
                }}
                title="Fjern fra historikk"
                data-testid={`remove-history-${index}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
      
      {query.length > 0 && (
        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
          Bruk piltastene for å navigere, Enter for å velge
        </div>
      )}
    </div>
  );
}