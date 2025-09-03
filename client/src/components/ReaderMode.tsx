import { useState, useEffect } from 'react';
import { X, BookOpen, Minus, Plus, Settings, Type, Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ReaderModeProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  content?: string;
}

export function ReaderMode({ isOpen, onClose, url, title, content }: ReaderModeProps) {
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [lineHeight, setLineHeight] = useState(1.6);
  const [maxWidth, setMaxWidth] = useState(700);
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [articleContent, setArticleContent] = useState(content || '');
  const [isLoading, setIsLoading] = useState(!content);
  
  // Hent artikkelinnhold hvis ikke allerede tilgjengelig
  useEffect(() => {
    if (!content && isOpen) {
      // Simuler innholdshenting
      setIsLoading(true);
      setTimeout(() => {
        setArticleContent(`
          <h1>Eksempel artikkel</h1>
          <p>Dette er et eksempel på en artikkel i lesemodus. Lesemodus gjør det enklere å lese innhold ved å fjerne distraksjoner som annonser, sidekolonner og andre elementer.</p>
          
          <h2>Fordeler med lesemodus</h2>
          <p>Lesemodus gir deg en ren og fokusert leseopplevelse. Du kan justere skriftstørrelse, skrifttype, linjehøyde og tema etter dine preferanser.</p>
          
          <h3>Tilpasning av visning</h3>
          <p>Med kontrollene øverst kan du:</p>
          <ul>
            <li>Endre skriftstørrelse for bedre lesbarhet</li>
            <li>Velge mellom forskjellige skrifttyper</li>
            <li>Justere linjehøyde for optimal leseflyt</li>
            <li>Bytte mellom lys, mørk og sepia-tema</li>
            <li>Tilpasse tekstbredden</li>
          </ul>
          
          <p>Alle disse innstillingene huskes for fremtidig bruk, slik at du alltid får den beste leseopplevelsen tilpasset dine preferanser.</p>
          
          <h2>Automatisk innholdsgjenkjenning</h2>
          <p>Lesemodus bruker avanserte algoritmer for å identifisere hovedinnholdet på en nettside. Den fjerner automatisk:</p>
          <ul>
            <li>Annonser og bannere</li>
            <li>Navigasjonsmeny og sidekolonner</li>
            <li>Kommentarfelt og sosiale medier-widgets</li>
            <li>Popup-vinduer og flytende elementer</li>
          </ul>
          
          <p>Resultatet er en ren artikkel som er lett å lese og konsentrere seg om.</p>
        `);
        setIsLoading(false);
      }, 500);
    }
  }, [content, isOpen]);
  
  const getThemeStyles = () => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-900 text-gray-100';
      case 'sepia':
        return 'bg-amber-50 text-amber-900';
      default:
        return 'bg-white text-gray-900';
    }
  };
  
  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case 'serif':
        return 'font-serif';
      case 'mono':
        return 'font-mono';
      default:
        return 'font-sans';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className={`border-b p-3 flex items-center justify-between ${getThemeStyles()}`}>
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5" />
          <div>
            <h1 className="font-semibold text-lg">{title || 'Lesemodus'}</h1>
            <p className="text-sm opacity-70">{new URL(url).hostname}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Font size controls */}
          <div className="flex items-center gap-1 border rounded-lg px-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setFontSize(Math.max(12, fontSize - 2))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm min-w-[3ch] text-center">{fontSize}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setFontSize(Math.min(32, fontSize + 2))}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Settings popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Skrifttype</label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans-serif">Sans-serif</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="mono">Monospace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Linjehøyde: {lineHeight.toFixed(1)}
                  </label>
                  <Slider
                    value={[lineHeight]}
                    onValueChange={([value]) => setLineHeight(value)}
                    min={1}
                    max={2.5}
                    step={0.1}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Tekstbredde: {maxWidth}px
                  </label>
                  <Slider
                    value={[maxWidth]}
                    onValueChange={([value]) => setMaxWidth(value)}
                    min={400}
                    max={1200}
                    step={50}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Tema</label>
                  <div className="flex gap-2">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => setTheme('light')}
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Lys
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => setTheme('dark')}
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Mørk
                    </Button>
                    <Button
                      variant={theme === 'sepia' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => setTheme('sepia')}
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      Sepia
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <ScrollArea className={`flex-1 ${getThemeStyles()}`}>
        <div className="flex justify-center p-8">
          <article 
            className={`prose ${theme === 'dark' ? 'prose-invert' : ''} ${getFontFamilyClass()}`}
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
              maxWidth: `${maxWidth}px`,
              width: '100%'
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                  <p>Forbereder lesemodus...</p>
                </div>
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: articleContent }} />
            )}
          </article>
        </div>
      </ScrollArea>
    </div>
  );
}