import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import TestRunner from "@/components/qa/TestRunner";
import VisualDiffViewer from "@/components/qa/VisualDiffViewer";
import LighthouseReport from "@/components/qa/LighthouseReport";
import AccessibilityReport from "@/components/qa/AccessibilityReport";
import TestScheduler from "@/components/qa/TestScheduler";
import TestHistory from "@/components/qa/TestHistory";
import { 
  PlayCircle, 
  PauseCircle, 
  RotateCcw, 
  Calendar,
  BarChart3,
  Eye,
  Shield,
  Zap,
  History,
  Settings
} from "lucide-react";

interface TestSuite {
  id: string;
  name: string;
  description?: string;
  urls: string[];
  tests: {
    lighthouse?: any;
    visualRegression?: any;
    accessibility?: any;
  };
  schedule?: string;
  lastRun?: Date;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

interface TestResult {
  id: string;
  testType: string;
  status: string;
  url: string;
  timestamp: Date;
  duration: number;
  score?: number;
  details: any;
  errors?: string[];
  warnings?: string[];
  suggestions?: string[];
}

export default function QASuiteDashboard() {
  const { toast } = useToast();
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isRunning, setIsRunning] = useState(false);

  // Fetch test suites
  const { data: testSuites = [], isLoading: suitesLoading } = useQuery({
    queryKey: ['/api/qa-suite/suites'],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch test results
  const { data: testResults = [], isLoading: resultsLoading } = useQuery({
    queryKey: ['/api/qa-suite/results'],
    refetchInterval: isRunning ? 1000 : 5000 // Faster refresh when running
  });

  // Run test suite mutation
  const runTestSuite = useMutation({
    mutationFn: async (suiteId: string) => {
      const response = await fetch(`/api/qa-suite/suites/${suiteId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to run test suite');
      return response.json();
    },
    onSuccess: () => {
      setIsRunning(true);
      toast({
        title: "Test kjører",
        description: "QA-testen har startet og kjører nå..."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/qa-suite/results'] });
    },
    onError: (error) => {
      toast({
        title: "Feil",
        description: "Kunne ikke starte testen",
        variant: "destructive"
      });
    }
  });

  // Stop test suite
  const stopTestSuite = useMutation({
    mutationFn: async (suiteId: string) => {
      const response = await fetch(`/api/qa-suite/suites/${suiteId}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to stop test suite');
      return response.json();
    },
    onSuccess: () => {
      setIsRunning(false);
      toast({
        title: "Test stoppet",
        description: "QA-testen ble stoppet"
      });
    }
  });

  // WebSocket for real-time updates
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:5000/ws/qa-suite`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'test-update') {
        queryClient.invalidateQueries({ queryKey: ['/api/qa-suite/results'] });
      }
      
      if (data.type === 'test-complete') {
        setIsRunning(false);
        toast({
          title: "Test fullført",
          description: `Test suite "${data.suiteName}" er ferdig`,
          variant: data.status === 'passed' ? 'default' : 'destructive'
        });
      }
    };

    return () => ws.close();
  }, []);

  // Calculate statistics
  const stats = {
    totalTests: testResults.length,
    passed: testResults.filter((r: TestResult) => r.status === 'passed').length,
    failed: testResults.filter((r: TestResult) => r.status === 'failed').length,
    avgScore: testResults.reduce((acc: number, r: TestResult) => acc + (r.score || 0), 0) / (testResults.length || 1)
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">QA Suite Pro</h1>
            <p className="text-muted-foreground">Omfattende testing og kvalitetssikring</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isRunning ? "destructive" : "default"}
              size="sm"
              onClick={() => {
                if (selectedSuite) {
                  isRunning ? stopTestSuite.mutate(selectedSuite.id) : runTestSuite.mutate(selectedSuite.id);
                }
              }}
              disabled={!selectedSuite}
              data-testid="button-toggle-test"
            >
              {isRunning ? (
                <>
                  <PauseCircle className="w-4 h-4 mr-2" />
                  Stopp Test
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Kjør Test
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" data-testid="button-schedule">
              <Calendar className="w-4 h-4 mr-2" />
              Planlegg
            </Button>
            <Button variant="outline" size="sm" data-testid="button-settings">
              <Settings className="w-4 h-4 mr-2" />
              Innstillinger
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Oversikt
            </TabsTrigger>
            <TabsTrigger value="runner" data-testid="tab-runner">
              <PlayCircle className="w-4 h-4 mr-2" />
              Test Runner
            </TabsTrigger>
            <TabsTrigger value="visual" data-testid="tab-visual">
              <Eye className="w-4 h-4 mr-2" />
              Visuell
            </TabsTrigger>
            <TabsTrigger value="lighthouse" data-testid="tab-lighthouse">
              <Zap className="w-4 h-4 mr-2" />
              Lighthouse
            </TabsTrigger>
            <TabsTrigger value="accessibility" data-testid="tab-accessibility">
              <Shield className="w-4 h-4 mr-2" />
              Tilgjengelighet
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="w-4 h-4 mr-2" />
              Historikk
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="h-full mt-4">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Totale Tester</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-tests">{stats.totalTests}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Bestått</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600" data-testid="text-passed">{stats.passed}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Feilet</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600" data-testid="text-failed">{stats.failed}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Gj.snitt Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-avg-score">
                    {Math.round(stats.avgScore)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Test Suites</CardTitle>
                  <CardDescription>Velg en test suite å kjøre</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {suitesLoading ? (
                        <div>Laster...</div>
                      ) : (
                        testSuites.map((suite: TestSuite) => (
                          <Card 
                            key={suite.id}
                            className={`cursor-pointer transition-colors ${
                              selectedSuite?.id === suite.id ? 'border-primary' : ''
                            }`}
                            onClick={() => setSelectedSuite(suite)}
                            data-testid={`card-suite-${suite.id}`}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold">{suite.name}</h4>
                                  <p className="text-sm text-muted-foreground">{suite.description}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline">{suite.urls.length} URLs</Badge>
                                    {suite.schedule && (
                                      <Badge variant="secondary">Planlagt</Badge>
                                    )}
                                  </div>
                                </div>
                                <Badge
                                  variant={
                                    suite.status === 'running' ? 'default' :
                                    suite.status === 'completed' ? 'secondary' :
                                    suite.status === 'failed' ? 'destructive' : 'outline'
                                  }
                                >
                                  {suite.status}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Siste Resultater</CardTitle>
                  <CardDescription>Nylige test-kjøringer</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {resultsLoading ? (
                        <div>Laster...</div>
                      ) : (
                        testResults.slice(0, 10).map((result: TestResult) => (
                          <Card key={result.id} data-testid={`card-result-${result.id}`}>
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold text-sm">{result.testType}</h4>
                                  <p className="text-xs text-muted-foreground">{result.url}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {result.score !== undefined && (
                                      <Badge variant="outline">{result.score}%</Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {result.duration}ms
                                    </span>
                                  </div>
                                </div>
                                <Badge
                                  variant={
                                    result.status === 'passed' ? 'secondary' :
                                    result.status === 'failed' ? 'destructive' : 'outline'
                                  }
                                >
                                  {result.status}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="runner" className="h-full mt-4">
            <TestRunner 
              suite={selectedSuite}
              isRunning={isRunning}
              onStart={() => selectedSuite && runTestSuite.mutate(selectedSuite.id)}
              onStop={() => selectedSuite && stopTestSuite.mutate(selectedSuite.id)}
            />
          </TabsContent>

          <TabsContent value="visual" className="h-full mt-4">
            <VisualDiffViewer results={testResults.filter((r: TestResult) => r.testType === 'visual-regression')} />
          </TabsContent>

          <TabsContent value="lighthouse" className="h-full mt-4">
            <LighthouseReport results={testResults.filter((r: TestResult) => r.testType === 'lighthouse')} />
          </TabsContent>

          <TabsContent value="accessibility" className="h-full mt-4">
            <AccessibilityReport results={testResults.filter((r: TestResult) => r.testType === 'accessibility')} />
          </TabsContent>

          <TabsContent value="history" className="h-full mt-4">
            <TestHistory results={testResults} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}