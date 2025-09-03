import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Gauge,
  Eye,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Camera,
  Terminal,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  Activity,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LighthouseMetrics {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
}

interface QAProfile {
  id: string;
  name: string;
  domain: string;
  lighthouseMin: LighthouseMetrics;
  axeBlockLevels: string[];
  routes: string[];
  forms: string[];
  visualRegressionBaseline?: string;
  consoleGates: {
    errors: boolean;
    warnings: boolean;
    maxErrors: number;
  };
}

interface TestResult {
  id: string;
  timestamp: Date;
  profile: string;
  url: string;
  lighthouse: LighthouseMetrics;
  lighthouseDiff?: LighthouseMetrics;
  axeViolations: number;
  consoleErrors: number;
  visualDelta?: number;
  status: "pass" | "fail" | "warning";
}

export function QASuitePro({ previewUrl }: { previewUrl?: string }) {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<QAProfile>({
    id: "default",
    name: "Default Profile",
    domain: "*",
    lighthouseMin: {
      performance: 85,
      accessibility: 90,
      bestPractices: 85,
      seo: 85,
      pwa: 50
    },
    axeBlockLevels: ["critical", "serious"],
    routes: ["/", "/contact", "/about"],
    forms: ["contact-form", "newsletter"],
    consoleGates: {
      errors: true,
      warnings: false,
      maxErrors: 0
    }
  });

  const [testResults, setTestResults] = useState<TestResult>({
    id: "test-1",
    timestamp: new Date(),
    profile: "default",
    url: previewUrl || "https://example.com",
    lighthouse: {
      performance: 92,
      accessibility: 95,
      bestPractices: 88,
      seo: 90,
      pwa: 65
    },
    lighthouseDiff: {
      performance: 5,
      accessibility: 2,
      bestPractices: -3,
      seo: 0,
      pwa: 10
    },
    axeViolations: 2,
    consoleErrors: 0,
    visualDelta: 2.3,
    status: "pass"
  });

  const runQASuite = async () => {
    setIsRunning(true);
    
    toast({
      title: "QA Suite Started",
      description: "Running comprehensive quality checks...",
    });

    // Simulate QA tests
    setTimeout(() => {
      setIsRunning(false);
      toast({
        title: "QA Suite Complete",
        description: "All quality checks have been completed",
      });
    }, 5000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getDiffIcon = (diff: number) => {
    if (diff > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (diff < 0) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return null;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              QA Suite Pro
            </div>
            <Button 
              size="sm"
              onClick={runQASuite}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <Activity className="h-3 w-3 mr-1 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Zap className="h-3 w-3 mr-1" />
                  Run QA Suite
                </>
              )}
            </Button>
          </CardTitle>
          <CardDescription>
            Lighthouse, Axe-core, visual regression, and console error detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="lighthouse" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="lighthouse">Lighthouse</TabsTrigger>
              <TabsTrigger value="accessibility">A11y</TabsTrigger>
              <TabsTrigger value="visual">Visual</TabsTrigger>
              <TabsTrigger value="console">Console</TabsTrigger>
            </TabsList>

            <TabsContent value="lighthouse" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(testResults.lighthouse).map(([metric, score]) => (
                  <div key={metric} className="text-center space-y-2">
                    <div className="relative">
                      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                        {score}
                      </div>
                      {testResults.lighthouseDiff && (
                        <div className="absolute -top-2 -right-2">
                          {getDiffIcon(testResults.lighthouseDiff[metric as keyof LighthouseMetrics])}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {metric === "pwa" ? "PWA" : metric}
                    </div>
                    <Progress 
                      value={score} 
                      className="h-1"
                    />
                    {testResults.lighthouseDiff && (
                      <div className={`text-xs ${
                        testResults.lighthouseDiff[metric as keyof LighthouseMetrics] > 0 
                          ? "text-green-500" 
                          : testResults.lighthouseDiff[metric as keyof LighthouseMetrics] < 0 
                          ? "text-red-500" 
                          : "text-muted-foreground"
                      }`}>
                        {testResults.lighthouseDiff[metric as keyof LighthouseMetrics] > 0 ? "+" : ""}
                        {testResults.lighthouseDiff[metric as keyof LighthouseMetrics]}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Alert>
                <BarChart3 className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Performance Metrics</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>LCP: 2.1s</div>
                      <div>TBT: 120ms</div>
                      <div>CLS: 0.02</div>
                      <div>FCP: 1.3s</div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Device Profiles</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm">
                    <Monitor className="h-3 w-3 mr-1" />
                    Desktop
                  </Button>
                  <Button variant="outline" size="sm">
                    <Smartphone className="h-3 w-3 mr-1" />
                    Mobile
                  </Button>
                  <Button variant="outline" size="sm">
                    <Globe className="h-3 w-3 mr-1" />
                    3G Slow
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="accessibility" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Axe-core Violations</span>
                  <Badge variant={testResults.axeViolations > 0 ? "destructive" : "default"}>
                    {testResults.axeViolations} issues
                  </Badge>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    WCAG AA compliance check passed with {testResults.accessibility}% score
                  </AlertDescription>
                </Alert>

                <ScrollArea className="h-[200px] border rounded p-3">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Badge variant="destructive">Critical</Badge>
                      <div className="text-sm">
                        <div className="font-medium">Missing alt text</div>
                        <div className="text-xs text-muted-foreground">
                          Images must have alternate text
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="destructive">Serious</Badge>
                      <div className="text-sm">
                        <div className="font-medium">Low contrast ratio</div>
                        <div className="text-xs text-muted-foreground">
                          Text color contrast is 3.2:1 (minimum 4.5:1)
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="visual" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Visual Regression</span>
                  <Badge variant={testResults.visualDelta && testResults.visualDelta > 5 ? "destructive" : "default"}>
                    {testResults.visualDelta}% delta
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Card>
                    <CardContent className="p-2">
                      <div className="aspect-video bg-muted rounded flex items-center justify-center">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="text-xs text-center mt-1">Baseline</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2">
                      <div className="aspect-video bg-muted rounded flex items-center justify-center">
                        <Eye className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="text-xs text-center mt-1">Current</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2">
                      <div className="aspect-video bg-muted rounded flex items-center justify-center">
                        <Activity className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="text-xs text-center mt-1">Diff</div>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <Camera className="h-4 w-4" />
                  <AlertDescription>
                    Screenshots captured for 3 routes at 1920x1080 resolution
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="console" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Console Errors</span>
                  <div className="flex gap-2">
                    <Badge variant="destructive">
                      {testResults.consoleErrors} errors
                    </Badge>
                    <Badge variant="outline">
                      12 warnings
                    </Badge>
                  </div>
                </div>

                <ScrollArea className="h-[200px] border rounded bg-black p-3">
                  <div className="font-mono text-xs space-y-1">
                    <div className="text-green-400">✓ Build successful</div>
                    <div className="text-green-400">✓ No runtime errors</div>
                    <div className="text-yellow-400">⚠ Unused variable 'config'</div>
                    <div className="text-yellow-400">⚠ React Hook useEffect missing dependency</div>
                    <div className="text-green-400">✓ All tests passed</div>
                  </div>
                </ScrollArea>

                <Alert>
                  <Terminal className="h-4 w-4" />
                  <AlertDescription>
                    Console gate: Max 0 errors allowed (currently {testResults.consoleErrors})
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}