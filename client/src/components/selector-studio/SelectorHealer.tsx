import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Wrench,
  RefreshCw,
  Clock,
  Zap
} from "lucide-react";

interface SelectorHealerProps {
  brokenSelectors: any[];
}

export default function SelectorHealer({ brokenSelectors }: SelectorHealerProps) {
  const [healingResults, setHealingResults] = useState<any[]>([]);
  const [isHealing, setIsHealing] = useState(false);
  const [selectedSelector, setSelectedSelector] = useState<any>(null);

  const startHealing = async (selector: any) => {
    setIsHealing(true);
    setSelectedSelector(selector);
    
    // Simulate healing process
    setTimeout(() => {
      const result = {
        original: selector.selector,
        healed: generateHealedSelector(selector),
        confidence: Math.floor(Math.random() * 30) + 70,
        alternatives: generateAlternatives(selector),
        changes: [
          'Endret klasse fra .btn-primary til .button-primary',
          'La til fallback ID selector',
          'Fjernet ustabil indeks-basert selector'
        ],
        tested: true,
        elementsFound: 1
      };
      
      setHealingResults([...healingResults, result]);
      setIsHealing(false);
    }, 2000);
  };

  const generateHealedSelector = (selector: any) => {
    // Mock healed selector generation
    const healedOptions = [
      `[data-test="${selector.id}"]`,
      `#${selector.id}-button`,
      `.new-${selector.type}-class`,
      `button[aria-label="${selector.type}"]`
    ];
    return healedOptions[Math.floor(Math.random() * healedOptions.length)];
  };

  const generateAlternatives = (selector: any) => {
    return [
      {
        selector: `[data-testid="${selector.id}"]`,
        confidence: 95,
        type: 'data-attribute'
      },
      {
        selector: `#element-${selector.id}`,
        confidence: 85,
        type: 'id'
      },
      {
        selector: `.container .${selector.type}`,
        confidence: 70,
        type: 'class'
      }
    ];
  };

  const applyHealing = (healedSelector: string, originalId: string) => {
    // Apply the healed selector
    console.log(`Applying healed selector: ${healedSelector} for ${originalId}`);
  };

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {/* Broken Selectors List */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Ødelagte Selectors</CardTitle>
          <CardDescription>{brokenSelectors.length} selectors trenger reparasjon</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {brokenSelectors.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
                  <p>Ingen ødelagte selectors!</p>
                  <p className="text-xs mt-1">Alle selectors fungerer som forventet</p>
                </div>
              ) : (
                brokenSelectors.map((selector: any) => (
                  <Card 
                    key={selector.id}
                    className={`cursor-pointer transition-colors ${
                      selectedSelector?.id === selector.id ? 'border-primary' : ''
                    }`}
                    onClick={() => setSelectedSelector(selector)}
                    data-testid={`broken-selector-${selector.id}`}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="destructive">Ødelagt</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(selector.lastUsed || Date.now()).toLocaleDateString('no-NO')}
                          </span>
                        </div>
                        <code className="text-xs font-mono block truncate">
                          {selector.selector}
                        </code>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3 text-yellow-600" />
                          <span className="text-xs">Feilet på {selector.url}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          {brokenSelectors.length > 0 && (
            <Button 
              className="w-full mt-4" 
              variant="default"
              onClick={() => brokenSelectors.forEach(s => startHealing(s))}
              data-testid="button-heal-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Reparer Alle
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Healing Process */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Selector Reparasjon</CardTitle>
          <CardDescription>
            {selectedSelector ? 'AI-drevet selector healing' : 'Velg en ødelagt selector for å starte'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isHealing ? (
            <div className="flex flex-col items-center justify-center h-[500px]">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="mt-4 text-muted-foreground">Analyserer og reparerer selector...</p>
              <Progress value={66} className="w-64 mt-4" />
            </div>
          ) : selectedSelector ? (
            <div className="space-y-4">
              {/* Original Selector Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    Original Selector
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="text-sm font-mono block p-3 bg-red-50 dark:bg-red-900/20 rounded">
                    {selectedSelector.selector}
                  </code>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span>Feilet: Element ikke funnet</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Sist fungerte: {new Date(Date.now() - 86400000).toLocaleDateString('no-NO')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Healing Results */}
              {healingResults.find(r => r.original === selectedSelector.selector) ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Reparert Selector
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <code className="text-sm font-mono block p-3 bg-green-50 dark:bg-green-900/20 rounded">
                        {healingResults.find(r => r.original === selectedSelector.selector)?.healed}
                      </code>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            Konfidens: {healingResults.find(r => r.original === selectedSelector.selector)?.confidence}%
                          </Badge>
                          <Badge variant="outline">
                            {healingResults.find(r => r.original === selectedSelector.selector)?.elementsFound} element funnet
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => applyHealing(
                            healingResults.find(r => r.original === selectedSelector.selector)?.healed,
                            selectedSelector.id
                          )}
                          data-testid="button-apply-healing"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Bruk
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Changes Made */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Endringer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {healingResults.find(r => r.original === selectedSelector.selector)?.changes.map((change: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Wrench className="w-4 h-4 text-blue-600 mt-0.5" />
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Alternative Suggestions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Alternative Selectors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {healingResults.find(r => r.original === selectedSelector.selector)?.alternatives.map((alt: any, index: number) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-2 border rounded"
                            data-testid={`alternative-${index}`}
                          >
                            <div className="flex-1">
                              <code className="text-xs font-mono">{alt.selector}</code>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{alt.type}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  Konfidens: {alt.confidence}%
                                </span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" data-testid={`button-use-alt-${index}`}>
                              Bruk
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Button 
                    size="lg"
                    onClick={() => startHealing(selectedSelector)}
                    data-testid="button-start-healing"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Reparasjon
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
              <Wrench className="w-12 h-12 mb-4" />
              <p>Velg en ødelagt selector fra listen for å starte reparasjon</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}