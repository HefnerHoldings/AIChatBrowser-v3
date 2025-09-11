import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Info,
  Eye,
  Keyboard,
  Mouse,
  Volume2,
  Download
} from "lucide-react";

interface AccessibilityIssue {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    target: string;
    html: string;
    failureSummary: string;
  }>;
}

interface AccessibilityResult {
  id: string;
  url: string;
  timestamp: Date;
  standard: 'wcag2a' | 'wcag2aa' | 'wcag21aa';
  violations: AccessibilityIssue[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  score: number;
}

interface AccessibilityReportProps {
  results: any[];
}

export default function AccessibilityReport({ results }: AccessibilityReportProps) {
  const [selectedResult, setSelectedResult] = useState<AccessibilityResult | null>(null);
  const [filterImpact, setFilterImpact] = useState<string>('all');

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'destructive';
      case 'serious': return 'destructive';
      case 'moderate': return 'default';
      case 'minor': return 'secondary';
      default: return 'outline';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'critical': return <XCircle className="w-4 h-4" />;
      case 'serious': return <AlertTriangle className="w-4 h-4" />;
      case 'moderate': return <Info className="w-4 h-4" />;
      case 'minor': return <CheckCircle className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes('keyboard')) return <Keyboard className="w-4 h-4" />;
    if (category.includes('mouse') || category.includes('click')) return <Mouse className="w-4 h-4" />;
    if (category.includes('screen') || category.includes('visual')) return <Eye className="w-4 h-4" />;
    if (category.includes('audio') || category.includes('sound')) return <Volume2 className="w-4 h-4" />;
    return <Shield className="w-4 h-4" />;
  };

  // Mock data transformation
  const transformResult = (result: any): AccessibilityResult => {
    return {
      id: result.id,
      url: result.url,
      timestamp: result.timestamp,
      standard: 'wcag2aa',
      violations: [
        {
          id: 'color-contrast',
          impact: 'serious',
          description: 'Elementer må ha tilstrekkelig fargekontrast',
          help: 'Sørg for at fargekontrasten mellom forgrunns- og bakgrunnsfarger oppfyller WCAG 2 AA kontrastforhold-terskler',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
          nodes: [
            {
              target: '.button-secondary',
              html: '<button class="button-secondary">Klikk her</button>',
              failureSummary: 'Element har utilstrekkelig fargekontrast på 3.5:1'
            }
          ]
        },
        {
          id: 'image-alt',
          impact: 'critical',
          description: 'Bilder må ha alternativ tekst',
          help: 'Sørg for at <img> elementer har alternativ tekst eller en rolle på none eller presentation',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
          nodes: [
            {
              target: '#hero-image',
              html: '<img src="hero.jpg" id="hero-image">',
              failureSummary: 'Bilde mangler alt-attributt'
            }
          ]
        },
        {
          id: 'label',
          impact: 'moderate',
          description: 'Skjemaelementer må ha labels',
          help: 'Sørg for at hver skjemakontroll har en label',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/label',
          nodes: [
            {
              target: 'input[name="email"]',
              html: '<input type="email" name="email">',
              failureSummary: 'Input-element mangler tilknyttet label'
            }
          ]
        }
      ],
      passes: 42,
      incomplete: 3,
      inapplicable: 15,
      score: 75
    };
  };

  const exportReport = () => {
    if (!selectedResult) return;
    
    const report = {
      url: selectedResult.url,
      timestamp: selectedResult.timestamp,
      standard: selectedResult.standard,
      score: selectedResult.score,
      violations: selectedResult.violations,
      summary: {
        passes: selectedResult.passes,
        violations: selectedResult.violations.length,
        incomplete: selectedResult.incomplete,
        inapplicable: selectedResult.inapplicable
      }
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-report-${selectedResult.id}.json`;
    a.click();
  };

  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {/* Results List */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Tilgjengelighetstester</CardTitle>
          <CardDescription>WCAG Compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {results.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  Ingen tilgjengelighetstester tilgjengelig
                </div>
              ) : (
                results.map((result: any) => {
                  const transformed = transformResult(result);
                  
                  return (
                    <Card 
                      key={transformed.id}
                      className={`cursor-pointer transition-colors ${
                        selectedResult?.id === transformed.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedResult(transformed)}
                      data-testid={`card-a11y-result-${transformed.id}`}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="text-sm font-medium truncate">{transformed.url}</div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              <span className="text-lg font-bold">{transformed.score}%</span>
                            </div>
                            <Badge variant="outline">{transformed.standard.toUpperCase()}</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="destructive" className="text-xs">
                              {transformed.violations.length} feil
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {transformed.passes} OK
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(transformed.timestamp).toLocaleString('no-NO')}
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

      {/* Accessibility Report */}
      <Card className="col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tilgjengelighetsrapport</CardTitle>
              <CardDescription>
                {selectedResult ? selectedResult.url : 'Velg en test for å se rapport'}
              </CardDescription>
            </div>
            {selectedResult && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportReport}
                data-testid="button-export-report"
              >
                <Download className="w-4 h-4 mr-2" />
                Eksporter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedResult ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center">
                      <div className="text-3xl font-bold">{selectedResult.score}%</div>
                      <div className="text-sm text-muted-foreground">Total Score</div>
                      <Progress value={selectedResult.score} className="mt-2" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center">
                      <div className="text-3xl font-bold text-red-600">
                        {selectedResult.violations.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Brudd</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center">
                      <div className="text-3xl font-bold text-green-600">
                        {selectedResult.passes}
                      </div>
                      <div className="text-sm text-muted-foreground">Bestått</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center">
                      <div className="text-3xl font-bold text-yellow-600">
                        {selectedResult.incomplete}
                      </div>
                      <div className="text-sm text-muted-foreground">Ufullstendig</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filter */}
              <div className="flex gap-2">
                <Button
                  variant={filterImpact === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterImpact('all')}
                  data-testid="filter-all"
                >
                  Alle
                </Button>
                <Button
                  variant={filterImpact === 'critical' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterImpact('critical')}
                  data-testid="filter-critical"
                >
                  Kritisk
                </Button>
                <Button
                  variant={filterImpact === 'serious' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterImpact('serious')}
                  data-testid="filter-serious"
                >
                  Alvorlig
                </Button>
                <Button
                  variant={filterImpact === 'moderate' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterImpact('moderate')}
                  data-testid="filter-moderate"
                >
                  Moderat
                </Button>
                <Button
                  variant={filterImpact === 'minor' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterImpact('minor')}
                  data-testid="filter-minor"
                >
                  Mindre
                </Button>
              </div>

              {/* Violations */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {selectedResult.violations
                    .filter(v => filterImpact === 'all' || v.impact === filterImpact)
                    .map((violation, index) => (
                      <Card key={violation.id} data-testid={`violation-${violation.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2">
                              {getImpactIcon(violation.impact)}
                              <div>
                                <h4 className="font-medium">{violation.description}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {violation.help}
                                </p>
                              </div>
                            </div>
                            <Badge variant={getImpactColor(violation.impact) as any}>
                              {violation.impact}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {violation.nodes.map((node, nodeIndex) => (
                              <div 
                                key={nodeIndex}
                                className="border rounded-lg p-3 bg-muted/50"
                                data-testid={`node-${nodeIndex}`}
                              >
                                <div className="font-mono text-xs mb-2 text-muted-foreground">
                                  {node.target}
                                </div>
                                <div className="bg-black/5 dark:bg-white/5 p-2 rounded text-xs font-mono overflow-x-auto">
                                  {node.html}
                                </div>
                                <div className="text-sm text-red-600 mt-2">
                                  {node.failureSummary}
                                </div>
                              </div>
                            ))}
                            <a 
                              href={violation.helpUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                            >
                              Les mer om denne regelen
                              <Info className="w-3 h-3" />
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[500px] text-muted-foreground">
              Velg en tilgjengelighetstest fra listen for å se detaljert rapport
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}