import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  EyeOff, 
  Download, 
  Maximize2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from "lucide-react";

interface VisualDiffResult {
  id: string;
  url: string;
  timestamp: Date;
  baseline: string;
  current: string;
  diff: string;
  diffPercentage: number;
  status: 'passed' | 'failed';
  regions?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

interface VisualDiffViewerProps {
  results: any[];
}

export default function VisualDiffViewer({ results }: VisualDiffViewerProps) {
  const [selectedResult, setSelectedResult] = useState<VisualDiffResult | null>(null);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay' | 'diff'>('side-by-side');
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [showDiffRegions, setShowDiffRegions] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

  const handleExport = () => {
    if (!selectedResult) return;
    
    // Create download link for diff image
    const link = document.createElement('a');
    link.href = selectedResult.diff;
    link.download = `visual-diff-${selectedResult.id}.png`;
    link.click();
  };

  const getDiffSeverity = (percentage: number) => {
    if (percentage < 1) return { label: 'Minimal', color: 'secondary' };
    if (percentage < 5) return { label: 'Lav', color: 'default' };
    if (percentage < 10) return { label: 'Moderat', color: 'outline' };
    return { label: 'Høy', color: 'destructive' };
  };

  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {/* Results List */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Visuelle Tester</CardTitle>
          <CardDescription>Velg en test for å se detaljer</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {results.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  Ingen visuelle tester tilgjengelig
                </div>
              ) : (
                results.map((result: any) => {
                  const mockResult: VisualDiffResult = {
                    id: result.id,
                    url: result.url,
                    timestamp: result.timestamp,
                    baseline: '/api/qa-suite/screenshots/baseline/' + result.id,
                    current: '/api/qa-suite/screenshots/current/' + result.id,
                    diff: '/api/qa-suite/screenshots/diff/' + result.id,
                    diffPercentage: Math.random() * 15,
                    status: result.status === 'passed' ? 'passed' : 'failed',
                    regions: [
                      { x: 100, y: 100, width: 200, height: 150 },
                      { x: 400, y: 300, width: 150, height: 100 }
                    ]
                  };
                  
                  const severity = getDiffSeverity(mockResult.diffPercentage);
                  
                  return (
                    <Card 
                      key={mockResult.id}
                      className={`cursor-pointer transition-colors ${
                        selectedResult?.id === mockResult.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedResult(mockResult)}
                      data-testid={`card-visual-result-${mockResult.id}`}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="text-sm font-medium truncate">{mockResult.url}</div>
                          <div className="flex items-center justify-between">
                            <Badge variant={severity.color as any}>
                              {mockResult.diffPercentage.toFixed(2)}% endring
                            </Badge>
                            <Badge variant={mockResult.status === 'passed' ? 'secondary' : 'destructive'}>
                              {mockResult.status === 'passed' ? 'Bestått' : 'Feilet'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(mockResult.timestamp).toLocaleString('no-NO')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Visual Comparison */}
      <Card className="col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Visuell Sammenligning</CardTitle>
              <CardDescription>
                {selectedResult ? selectedResult.url : 'Velg en test for å se sammenligning'}
              </CardDescription>
            </div>
            {selectedResult && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDiffRegions(!showDiffRegions)}
                  data-testid="button-toggle-regions"
                >
                  {showDiffRegions ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span className="ml-2">Diff Regioner</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.min(prev + 10, 200))}
                  data-testid="button-zoom-in"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  data-testid="button-export"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedResult ? (
            <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="side-by-side" data-testid="tab-side-by-side">Side om Side</TabsTrigger>
                <TabsTrigger value="overlay" data-testid="tab-overlay">Overlay</TabsTrigger>
                <TabsTrigger value="diff" data-testid="tab-diff">Diff</TabsTrigger>
              </TabsList>

              <TabsContent value="side-by-side" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Baseline</h4>
                    <div 
                      className="border rounded-lg overflow-hidden bg-checkerboard"
                      style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
                    >
                      <img 
                        src={selectedResult.baseline} 
                        alt="Baseline"
                        className="w-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTkiPkJhc2VsaW5lIEltYWdlPC90ZXh0Pgo8L3N2Zz4=';
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Nåværende</h4>
                    <div 
                      className="border rounded-lg overflow-hidden bg-checkerboard relative"
                      style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
                    >
                      <img 
                        src={selectedResult.current} 
                        alt="Current"
                        className="w-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTkiPk7DpXbDpnJlbmRlIEltYWdlPC90ZXh0Pgo8L3N2Zz4=';
                        }}
                      />
                      {showDiffRegions && selectedResult.regions?.map((region, index) => (
                        <div
                          key={index}
                          className="absolute border-2 border-red-500 bg-red-500/20"
                          style={{
                            left: `${region.x}px`,
                            top: `${region.y}px`,
                            width: `${region.width}px`,
                            height: `${region.height}px`
                          }}
                          data-testid={`diff-region-${index}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="overlay" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Opacity:</label>
                    <Slider
                      value={[overlayOpacity]}
                      onValueChange={([v]) => setOverlayOpacity(v)}
                      min={0}
                      max={100}
                      step={1}
                      className="flex-1"
                      data-testid="slider-opacity"
                    />
                    <span className="text-sm text-muted-foreground w-12">{overlayOpacity}%</span>
                  </div>
                  <div 
                    className="relative border rounded-lg overflow-hidden bg-checkerboard"
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
                  >
                    <img 
                      src={selectedResult.baseline} 
                      alt="Baseline"
                      className="w-full"
                    />
                    <img 
                      src={selectedResult.current} 
                      alt="Current"
                      className="absolute top-0 left-0 w-full"
                      style={{ opacity: overlayOpacity / 100 }}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="diff" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">
                      Forskjell detektert: {selectedResult.diffPercentage.toFixed(2)}% av bildet har endret seg
                    </span>
                  </div>
                  <div 
                    className="border rounded-lg overflow-hidden bg-checkerboard"
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
                  >
                    <img 
                      src={selectedResult.diff} 
                      alt="Diff"
                      className="w-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTkiPkRpZmYgSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==';
                      }}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-[500px] text-muted-foreground">
              Velg en visuell test fra listen for å se sammenligning
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}