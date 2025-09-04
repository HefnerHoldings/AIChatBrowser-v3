import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCw,
  X,
  Plus,
  Home,
  Globe,
  Shield,
  Loader2,
  Search,
  Star,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchSuggestions } from '@/components/SearchSuggestions';
import { DownloadsManager } from '@/components/DownloadsManager';
import { cn } from '@/lib/utils';

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

interface BrowserUIProps {
  tabs: BrowserTab[];
  activeTab: BrowserTab | null;
  urlInput: string;
  isNavigating: boolean;
  isBookmarked: boolean;
  showSuggestions: boolean;
  isIncognito: boolean;
  onUrlChange: (url: string) => void;
  onNavigate: () => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onStop: () => void;
  onHome: () => void;
  onNewTab: () => void;
  onCloseTab: (tabId: string) => void;
  onTabSelect: (tabId: string) => void;
  onBookmarkToggle: () => void;
  onSuggestionSelect: (url: string) => void;
  onSuggestionsClose: () => void;
  onMenuAction: (action: string) => void;
  addressBarRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

export function BrowserUI({
  tabs,
  activeTab,
  urlInput,
  isNavigating,
  isBookmarked,
  showSuggestions,
  isIncognito,
  onUrlChange,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onStop,
  onHome,
  onNewTab,
  onCloseTab,
  onTabSelect,
  onBookmarkToggle,
  onSuggestionSelect,
  onSuggestionsClose,
  onMenuAction,
  addressBarRef,
  className
}: BrowserUIProps) {
  return (
    <div className={cn("border-b", className)}>
      {/* Tab Bar */}
      <div className="flex items-center bg-muted/30 px-2 pt-2">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            className={cn(
              "group flex items-center gap-2 px-3 py-2 mr-1 rounded-t-lg cursor-pointer transition-colors min-w-0 max-w-[240px]",
              activeTab?.id === tab.id 
                ? "bg-background border-t border-l border-r" 
                : "bg-muted/50 hover:bg-muted/70"
            )}
            data-testid={`tab-${tab.id}`}
          >
            {tab.favicon ? (
              <img src={tab.favicon} alt="" className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className="text-sm truncate flex-1">
              {tab.title || 'Ny fane'}
            </span>
            {tab.isLoading && (
              <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 rounded p-0.5 flex-shrink-0"
              data-testid={`close-tab-${tab.id}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          onClick={onNewTab}
          className="flex items-center justify-center w-8 h-8 hover:bg-accent rounded-lg transition-colors ml-1"
          title="Åpne ny fane (Ctrl+T)"
          data-testid="button-new-tab"
        >
          <Plus className="w-4 h-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>

      {/* Navigation Bar */}
      <div className={cn(
        "flex items-center gap-2 p-2",
        isIncognito && "bg-zinc-800"
      )}>
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            disabled={!activeTab?.canGoBack}
            title="Tilbake (Alt+←)"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onForward}
            disabled={!activeTab?.canGoForward}
            title="Fremover (Alt+→)"
            data-testid="button-forward"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={isNavigating ? onStop : onReload}
            title={isNavigating ? "Stopp (Esc)" : "Last på nytt (Ctrl+R)"}
            data-testid="button-reload"
          >
            {isNavigating ? (
              <X className="h-4 w-4" />
            ) : (
              <RotateCw className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onHome}
            title="Hjem"
            data-testid="button-home"
          >
            <Home className="h-4 w-4" />
          </Button>
        </div>

        {/* Address Bar */}
        <div className="flex-1 flex items-center gap-2">
          <div ref={addressBarRef} className="relative flex-1 flex items-center">
            {activeTab?.url?.startsWith('https://') && (
              <Shield className="absolute left-3 h-4 w-4 text-green-600" />
            )}
            <Input
              id="url-input"
              type="text"
              value={urlInput}
              onChange={(e) => {
                onUrlChange(e.target.value);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onNavigate();
                }
              }}
              placeholder="Skriv inn URL eller søk..."
              className={cn(
                activeTab?.url?.startsWith('https://') ? 'pl-10' : 'pl-3',
                'pr-10'
              )}
              data-testid="input-url"
            />
            {isNavigating ? (
              <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Search 
                className="absolute right-3 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={onNavigate}
              />
            )}
            
            {/* Search Suggestions */}
            <SearchSuggestions
              query={urlInput}
              isOpen={showSuggestions}
              onSelect={onSuggestionSelect}
              onClose={onSuggestionsClose}
              anchorRef={addressBarRef}
            />
          </div>
        </div>
        
        {/* Action controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBookmarkToggle}
            title={isBookmarked ? "Fjern bokmerke (Ctrl+D)" : "Legg til bokmerke (Ctrl+D)"}
            disabled={!activeTab || activeTab.url === 'about:blank'}
            data-testid="button-bookmark"
          >
            {isBookmarked ? (
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            ) : (
              <Star className="h-4 w-4" />
            )}
          </Button>
          <DownloadsManager />
          
          {/* Browser Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-menu">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onMenuAction('new-tab')}>
                <Plus className="mr-2 h-4 w-4" />
                Ny fane
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMenuAction('duplicate-tab')}>
                Dupliser fane
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onMenuAction('bookmarks')}>
                Bokmerker
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMenuAction('history')}>
                Historikk
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMenuAction('downloads')}>
                Nedlastinger
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onMenuAction('find')}>
                Finn på siden (Ctrl+F)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMenuAction('print')}>
                Skriv ut (Ctrl+P)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onMenuAction('devtools')}>
                Utviklerverktøy (F12)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMenuAction('settings')}>
                Innstillinger
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}