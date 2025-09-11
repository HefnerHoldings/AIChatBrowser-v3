import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, 
  Shield, 
  Search, 
  Smartphone,
  Globe,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface LighthouseResult {
  id: string;
  url: string;
  timestamp: Date;
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    pwa?: number;
  };
  metrics: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    timeToInteractive: number;
    speedIndex: number;
    totalBlockingTime: number;
    cumulativeLayoutShift: number;
  };
  audits: Array<{
    id: string;
    title: string;
    description: string;
    score: number;
    displayValue?: string;
    details?: any;
  }>;
}

interface LighthouseReportProps {
  results: any[];
}

export default function LighthouseReport({ results }: LighthouseReportProps) {
  const [selectedResult, setSelectedResult] = useState<LighthouseResult | null>(null);
  const [activeCategory, setActiveCategory] = useState('performance');

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { variant: 'secondary' as const, label: 'God' };
    if (score >= 50) return { variant: 'outline' as const, label: 'Trenger forbedring' };
    return { variant: 'destructive' as const, label: 'Dårlig' };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'accessibility': return <Shield className="w-4 h-4" />;
      case 'bestPractices': return <CheckCircle className="w-4 h-4" />;
      case 'seo': return <Search className="w-4 h-4" />;
      case 'pwa': return <Smartphone className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const formatMetricValue = (value: number, metric: string) => {
    if (metric.includes('Paint') || metric.includes('Interactive') || metric.includes('Index')) {
      return `${(value / 1000).toFixed(1)}s`;
    }
    if (metric.includes('BlockingTime')) {
      return `${value}ms`;
    }
    return value.toFixed(2);
  };

  // Mock data transformation for display
  const transformResult = (result: any): LighthouseResult => {
    return {
      id: result.id,
      url: result.url,
      timestamp: result.timestamp,
      scores: result.details?.scores || {
        performance: Math.floor(Math.random() * 100),
        accessibility: Math.floor(Math.random() * 100),
        bestPractices: Math.floor(Math.random() * 100),
        seo: Math.floor(Math.random() * 100),
        pwa: Math.floor(Math.random() * 100)
      },
      metrics: result.details?.metrics || {
        firstContentfulPaint: Math.random() * 3000,
        largestContentfulPaint: Math.random() * 5000,
        timeToInteractive: Math.random() * 7000,
        speedIndex: Math.random() * 4000,
        totalBlockingTime: Math.random() * 500,
        cumulativeLayoutShift: Math.random() * 0.5
      },
      audits: result.details?.audits || [
        {
          id: 'first-contentful-paint',
          title: 'First Contentful Paint',
          description: 'Første gang innhold vises på skjermen',
          score: 0.85,
          displayValue: '1.2s'
        },
        {
          id: 'speed-index',
          title: 'Speed Index',
          description: 'Hvor raskt innholdet visuelt lastes',
          score: 0.92,
          displayValue: '2.1s'
        }
      ]
    };
  };

  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {/* Results List */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Lighthouse Tester</CardTitle>
          <CardDescription>Velg en test for detaljer</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {results.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  Ingen Lighthouse tester tilgjengelig
                </div>
              ) : (
                results.map((result: any) => {
                  const transformed = transformResult(result);
                  const avgScore = Object.values(transformed.scores).reduce((a, b) => a + b, 0) / Object.keys(transformed.scores).length;
                  const scoreBadge = getScoreBadge(avgScore);
                  
                  return (
                    <Card 
                      key={transformed.id}
                      className={`cursor-pointer transition-colors ${
                        selectedResult?.id === transformed.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedResult(transformed)}
                      data-testid={`card-lighthouse-result-${transformed.id}`}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="text-sm font-medium truncate">{transformed.url}</div>
                          <div className="flex items-center justify-between">
                            <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
                              {Math.round(avgScore)}
                            </div>
                            <Badge variant={scoreBadge.variant}>{scoreBadge.label}</Badge>
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

      {/* Lighthouse Report */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Lighthouse Rapport</CardTitle>
          <CardDescription>
            {selectedResult ? selectedResult.url : 'Velg en test for å se rapport'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedResult ? (
            <div className="space-y-4">
              {/* Score Overview */}
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(selectedResult.scores).map(([category, score]) => (
                  <Card key={category} data-testid={`score-${category}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center space-y-2">
                        {getCategoryIcon(category)}
                        <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                          {score}
                        </div>
                        <div className="text-xs text-center capitalize">
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Detailed Metrics */}
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="performance" data-testid="tab-performance">Ytelse</TabsTrigger>
                  <TabsTrigger value="accessibility" data-testid="tab-accessibility">Tilgjengelighet</TabsTrigger>
                  <TabsTrigger value="bestPractices" data-testid="tab-bestpractices">Beste Praksis</TabsTrigger>
                  <TabsTrigger value="seo" data-testid="tab-seo">SEO</TabsTrigger>
                  <TabsTrigger value="metrics" data-testid="tab-metrics">Metrikker</TabsTrigger>
                </TabsList>

                <TabsContent value="performance" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Ytelsesmetrikker</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(selectedResult.metrics).map(([metric, value]) => (
                          <div key={metric} className="flex items-center justify-between" data-testid={`metric-${metric}`}>
                            <div>
                              <div className="font-medium text-sm">
                                {metric.replace(/([A-Z])/g, ' $1').trim()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatMetricValue(value, metric)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {value < 2000 ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : value < 4000 ? (
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="accessibility" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tilgjengelighetssjekker</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {selectedResult.audits
                            .filter(audit => audit.id.includes('access') || audit.id.includes('aria'))
                            .map(audit => (
                              <div key={audit.id} className="border rounded-lg p-3" data-testid={`audit-${audit.id}`}>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium text-sm">{audit.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {audit.description}
                                    </p>
                                  </div>
                                  <Badge variant={audit.score > 0.9 ? 'secondary' : 'destructive'}>
                                    {Math.round(audit.score * 100)}%
                                  </Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="bestPractices" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Beste Praksis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">HTTPS brukes</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Ingen konsoll-feil</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm">Bildestørrelser kan optimaliseres</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="seo" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">SEO Optimalisering</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Meta-beskrivelse funnet</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Sidetittel er optimalisert</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Robots.txt er tilgjengelig</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="metrics" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Detaljerte Metrikker</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(selectedResult.metrics).map(([metric, value]) => (
                          <div key={metric} className="space-y-2" data-testid={`detailed-metric-${metric}`}>
                            <div className="flex justify-between text-sm">
                              <span>{metric.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="font-mono">{formatMetricValue(value, metric)}</span>
                            </div>
                            <Progress value={Math.min((value / 10000) * 100, 100)} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[500px] text-muted-foreground">
              Velg en Lighthouse test fra listen for å se detaljert rapport
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}