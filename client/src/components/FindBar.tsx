import { useState, useEffect, useRef } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FindBarProps {
  isOpen: boolean;
  onClose: () => void;
  onFind: (query: string, direction?: 'next' | 'prev') => void;
}

export function FindBar({ isOpen, onClose, onFind }: FindBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        if (e.shiftKey) {
          handleFindPrevious();
        } else {
          handleFindNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchQuery]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value) {
      onFind(value);
      // In a real implementation, this would get actual match counts
      setTotalMatches(5); // Mock value
      setCurrentMatch(1);
    } else {
      setTotalMatches(0);
      setCurrentMatch(0);
    }
  };

  const handleFindNext = () => {
    if (searchQuery) {
      onFind(searchQuery, 'next');
      setCurrentMatch(prev => (prev < totalMatches ? prev + 1 : 1));
    }
  };

  const handleFindPrevious = () => {
    if (searchQuery) {
      onFind(searchQuery, 'prev');
      setCurrentMatch(prev => (prev > 1 ? prev - 1 : totalMatches));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-12 right-4 z-50 bg-card border rounded-lg shadow-lg p-2 flex items-center gap-2 min-w-[380px] animate-in slide-in-from-top duration-200">
      <div className="flex-1 flex items-center gap-2">
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Finn på siden..."
          className="h-8 flex-1"
          autoFocus
        />
        {searchQuery && totalMatches > 0 && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {currentMatch} av {totalMatches}
          </span>
        )}
        {searchQuery && totalMatches === 0 && (
          <span className="text-xs text-muted-foreground">
            Ingen treff
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleFindPrevious}
          disabled={!searchQuery || totalMatches === 0}
          title="Forrige (Shift+Enter)"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleFindNext}
          disabled={!searchQuery || totalMatches === 0}
          title="Neste (Enter)"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
          title="Lukk (Esc)"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}