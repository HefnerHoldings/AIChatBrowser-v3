import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  CheckCircle2, 
  Code,
  Bug,
  Play,
  AlertCircle,
  Activity,
  ChevronRight,
  Settings,
  Brain,
  Users,
  Target,
  FileSearch,
  Wrench,
  TestTube,
  Lightbulb,
  GitBranch
} from 'lucide-react';

export function AITesting() {
  const [activeTest, setActiveTest] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="multi-agent" className="flex-1">
        <TabsList className="w-full">
          <TabsTrigger value="multi-agent" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Multi-Agent
          </TabsTrigger>
          <TabsTrigger value="qa-suite" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            QA Suite Pro
          </TabsTrigger>
          <TabsTrigger value="selector" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Selector Studio
          </TabsTrigger>
        </TabsList>

        {/* Multi-Agent Orchestration */}
        <TabsContent value="multi-agent" className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Multi-Agent Orchestration 2.0</h3>
              <Button size="sm">
                <Brain className="h-4 w-4 mr-2" />
                Konfigurer Agenter
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Planner Agent</h4>
                    <p className="text-sm text-muted-foreground">Strategi & planlegging</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Progress value={78} className="h-2" />
                  <p className="text-xs text-muted-foreground">78% effektivitet</p>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                    <Wrench className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Executor Agent</h4>
                    <p className="text-sm text-muted-foreground">Implementering</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Progress value={92} className="h-2" />
                  <p className="text-xs text-muted-foreground">92% suksessrate</p>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                    <Lightbulb className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Critic Agent</h4>
                    <p className="text-sm text-muted-foreground">Kvalitetskontroll</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Progress value={85} className="h-2" />
                  <p className="text-xs text-muted-foreground">85% nøyaktighet</p>
                </div>
              </Card>
            </div>

            <Card className="p-4">
              <h4 className="font-medium mb-3">Aktive Agent Oppgaver</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
                    <span className="text-sm">Analyserer nettside struktur...</span>
                  </div>
                  <Badge variant="secondary">Planner</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-600 animate-pulse" />
                    <span className="text-sm">Utfører data ekstraksjon...</span>
                  </div>
                  <Badge variant="secondary">Executor</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Verifiserer resultater</span>
                  </div>
                  <Badge variant="secondary">Critic</Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* QA Suite Pro */}
        <TabsContent value="qa-suite" className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">QA Suite Pro</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Konfigurasjon
                </Button>
                <Button size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Kjør Alle Tester
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-medium mb-3">Lighthouse Metrics</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Performance</span>
                      <span className="font-medium text-green-600">92</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Accessibility</span>
                      <span className="font-medium text-green-600">98</span>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Best Practices</span>
                      <span className="font-medium text-yellow-600">87</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>SEO</span>
                      <span className="font-medium text-green-600">100</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium mb-3">Test Resultater</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Visual Regression</span>
                    </div>
                    <span className="text-xs font-medium">Bestått</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Accessibility (axe-core)</span>
                    </div>
                    <span className="text-xs font-medium">Bestått</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Performance Test</span>
                    </div>
                    <span className="text-xs font-medium">1 Advarsel</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
                      <span className="text-sm">End-to-End Test</span>
                    </div>
                    <span className="text-xs font-medium">Kjører...</span>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4">
              <h4 className="font-medium mb-3">Testrapport</h4>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">42</p>
                  <p className="text-sm text-muted-foreground">Bestått</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">3</p>
                  <p className="text-sm text-muted-foreground">Feilet</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">5</p>
                  <p className="text-sm text-muted-foreground">Advarsler</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">2</p>
                  <p className="text-sm text-muted-foreground">Kjører</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Selector Studio */}
        <TabsContent value="selector" className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Selector Studio v2</h3>
              <Button size="sm">
                <TestTube className="h-4 w-4 mr-2" />
                Test Selector
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-medium mb-3">Selector Analyse</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded font-mono text-sm">
                    div.container &gt; ul.list-items &gt; li:nth-child(3)
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Stabilitet Score</span>
                      <Badge variant="default">92/100</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Spesifisitet</span>
                      <Badge variant="secondary">Høy</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ytelse</span>
                      <Badge variant="secondary">Rask</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Domene Læring</span>
                      <Badge variant="outline">E-commerce</Badge>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Alternative Selektorer:</p>
                    <div className="space-y-1">
                      <code className="block text-xs bg-muted p-1 rounded">[data-product-id="123"]</code>
                      <code className="block text-xs bg-muted p-1 rounded">.product-card:has(h3)</code>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium mb-3">Smart Selector Forslag</h4>
                <div className="space-y-2">
                  <div className="p-2 border rounded hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-xs font-mono">[aria-label="product"]</code>
                      <Badge variant="secondary" className="text-xs">98%</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Semantisk og tilgjengelig</p>
                  </div>
                  
                  <div className="p-2 border rounded hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-xs font-mono">article.product</code>
                      <Badge variant="secondary" className="text-xs">95%</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Enkel og stabil</p>
                  </div>
                  
                  <div className="p-2 border rounded hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-xs font-mono">#products &gt; *</code>
                      <Badge variant="secondary" className="text-xs">88%</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Fleksibel for dynamisk innhold</p>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                      <GitBranch className="h-4 w-4 mr-2" />
                      Generer XPath Alternativ
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4">
              <h4 className="font-medium mb-3">Test Resultater</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium">15 elementer funnet</p>
                  <p className="text-sm text-muted-foreground">Matcher forventet</p>
                </div>
                <div className="text-center">
                  <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-medium">1.2ms responstid</p>
                  <p className="text-sm text-muted-foreground">Rask utførelse</p>
                </div>
                <div className="text-center">
                  <Bug className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-medium">0 konflikter</p>
                  <p className="text-sm text-muted-foreground">Ingen overlapp</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}