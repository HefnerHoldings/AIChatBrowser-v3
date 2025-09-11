import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Chrome,
  Globe,
  Smartphone,
  Monitor,
  Zap
} from "lucide-react";

interface StabilityAnalyzerProps {
  selectors: any[];
  onAnalyze: (selector: string) => void;
}

export default function StabilityAnalyzer({ selectors, onAnalyze }: StabilityAnalyzerProps) {
  const [selectedSelector, setSelectedSelector] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAnalysis = async (selector: any) => {
    setIsAnalyzing(true);
    setSelectedSelector(selector);
    
    // Simulate analysis
    setTimeout(() => {
      setAnalysisResult({
        selector: selector.selector,
        type: selector.type,
        score: {
          overall: 85,
          uniqueness: 95,
          resilience: 80,
          performance: 90,
          maintainability: 75,
          crossBrowser: 88,
          confidence: 82
        },
        elements: 1,
        warnings: [
          'Selector bruker klassenavn som kan endres',
          'Vurder å legge til data-test attributt'
        ],
        suggestions: [
          'Bruk ID selector for bedre ytelse',
          'Legg til fallback selector'
        ],
        browserCompatibility: {
          chrome: true,
          firefox: true,
          safari: true,
          edge: true
        },
        resilience: {
          withoutClasses: true,
          withoutAttributes: false,
          withDynamicContent: true
        },
        metadata: {
          depth: 3,
          specificity: 21,
          complexity: 45,
          attributes: ['class', 'id'],
          pseudoClasses: [':hover', ':focus']
        }
      });
      setIsAnalyzing(false);
    }, 1500);
    
    onAnalyze(selector.selector);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: 'secondary' as const, label: 'Stabil' };
    if (score >= 60) return { variant: 'outline' as const, label: 'Moderat' };
    return { variant: 'destructive' as const, label: 'Ustabil' };
  };

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {/* Selector List */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Selectors</CardTitle>
          <CardDescription>Velg for stabilitetsanalyse</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {selectors.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  Ingen selectors tilgjengelig
                </div>
              ) : (
                selectors.map((selector: any) => (
                  <Card 
                    key={selector.id}
                    className={`cursor-pointer transition-colors ${
                      selectedSelector?.id === selector.id ? 'border-primary' : ''
                    }`}
                    onClick={() => runAnalysis(selector)}
                    data-testid={`selector-card-${selector.id}`}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{selector.type}</Badge>
                          {selector.score && (
                            <span className={`font-bold ${getScoreColor(selector.score)}`}>
                              {selector.score}%
                            </span>
                          )}
                        </div>
                        <code className="text-xs font-mono block truncate">
                          {selector.selector}
                        </code>
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant={
                              selector.status === 'active' ? 'secondary' :
                              selector.status === 'broken' ? 'destructive' : 'outline'
                            }
                          >
                            {selector.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {selector.url}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Stabilitetsanalyse</CardTitle>
          <CardDescription>
            {selectedSelector ? 'Analyserer selector stabilitet' : 'Velg en selector for analyse'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-[500px]">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">Analyserer selector...</p>
            </div>
          ) : analysisResult ? (
            <div className="space-y-4">
              {/* Overall Score */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Total Stabilitet</h3>
                  <Badge {...getScoreBadge(analysisResult.score.overall)}>
                    {getScoreBadge(analysisResult.score.overall).label}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`text-4xl font-bold ${getScoreColor(analysisResult.score.overall)}`}>
                    {analysisResult.score.overall}%
                  </div>
                  <Progress value={analysisResult.score.overall} className="flex-1" />
                </div>
              </div>

              {/* Detailed Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Score Komponenter</h4>
                  {Object.entries(analysisResult.score).map(([key, value]: [string, any]) => {
                    if (key === 'overall') return null;
                    return (
                      <div key={key} className="flex items-center justify-between" data-testid={`score-${key}`}>
                        <span className="text-sm capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div className="flex items-center gap-2">
                          <Progress value={value} className="w-20" />
                          <span className="text-sm font-medium w-10 text-right">{value}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Nettleser Kompatibilitet</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Chrome className="w-4 h-4" />
                      <span className="text-sm">Chrome</span>
                      {analysisResult.browserCompatibility.chrome ? (
                        <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 ml-auto" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Globe className="w-4 h-4" />
                      <span className="text-sm">Firefox</span>
                      {analysisResult.browserCompatibility.firefox ? (
                        <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 ml-auto" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Monitor className="w-4 h-4" />
                      <span className="text-sm">Safari</span>
                      {analysisResult.browserCompatibility.safari ? (
                        <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 ml-auto" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Globe className="w-4 h-4" />
                      <span className="text-sm">Edge</span>
                      {analysisResult.browserCompatibility.edge ? (
                        <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 ml-auto" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Warnings & Suggestions */}
              <div className="grid grid-cols-2 gap-4">
                {analysisResult.warnings.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        Advarsler
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisResult.warnings.map((warning: string, index: number) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-yellow-600 mt-0.5">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {analysisResult.suggestions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-600" />
                        Forslag
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisResult.suggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Metadata */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Selector Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Dybde:</span>
                      <span className="ml-2 font-medium">{analysisResult.metadata.depth}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Spesifisitet:</span>
                      <span className="ml-2 font-medium">{analysisResult.metadata.specificity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Kompleksitet:</span>
                      <span className="ml-2 font-medium">{analysisResult.metadata.complexity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Elementer:</span>
                      <span className="ml-2 font-medium">{analysisResult.elements}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Attributter:</span>
                      <span className="ml-2 font-medium">{analysisResult.metadata.attributes.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pseudo:</span>
                      <span className="ml-2 font-medium">{analysisResult.metadata.pseudoClasses.join(', ')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
              <Shield className="w-12 h-12 mb-4" />
              <p>Velg en selector fra listen for å analysere stabilitet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}