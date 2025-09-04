import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TestTube2,
  Activity,
  Gauge,
  Eye,
  Accessibility,
  Shield,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Play,
  Pause,
  RotateCw,
  Download,
  Upload,
  Filter,
  TrendingUp,
  TrendingDown,
  Camera,
  FileText,
  Target,
  Timer,
  Layers,
  Package,
  Cpu
} from 'lucide-react';

// Types
interface LighthouseScore {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
}

interface LighthouseMetric {
  name: string;
  value: string | number;
  score: 'good' | 'needs-improvement' | 'poor';
  description: string;
}

interface VisualDiff {
  id: string;
  timestamp: Date;
  baseline: string;
  current: string;
  diffPercentage: number;
  status: 'passed' | 'failed' | 'warning';
  affectedElements: string[];
}

interface AccessibilityIssue {
  id: string;
  rule: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  element: string;
  description: string;
  howToFix: string;
  wcagLevel: string;
}

interface TestResult {
  id: string;
  name: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'accessibility';
  status: 'passed' | 'failed' | 'skipped' | 'running';
  duration: number;
  error?: string;
  coverage?: number;
  timestamp: Date;
}

interface TestSuite {
  id: string;
  name: string;
  tests: TestResult[];
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  coverage: number;
  duration: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

export function QASuite() {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [lighthouseScore, setLighthouseScore] = useState<LighthouseScore>({
    performance: 92,
    accessibility: 88,
    bestPractices: 95,
    seo: 90,
    pwa: 75
  });

  const [performanceMetrics] = useState<LighthouseMetric[]>([
    {
      name: 'First Contentful Paint',
      value: '0.8s',
      score: 'good',
      description: 'Tid før første innhold vises'
    },
    {
      name: 'Largest Contentful Paint',
      value: '1.2s',
      score: 'good',
      description: 'Tid før største innhold vises'
    },
    {
      name: 'Total Blocking Time',
      value: '150ms',
      score: 'needs-improvement',
      description: 'Total tid hovedtråden er blokkert'
    },
    {
      name: 'Cumulative Layout Shift',
      value: 0.05,
      score: 'good',
      description: 'Visuell stabilitet'
    },
    {
      name: 'Speed Index',
      value: '1.8s',
      score: 'good',
      description: 'Hvor raskt innhold vises'
    }
  ]);

  const [visualDiffs] = useState<VisualDiff[]>([
    {
      id: '1',
      timestamp: new Date(),
      baseline: '/api/placeholder/200/150',
      current: '/api/placeholder/200/150',
      diffPercentage: 0.5,
      status: 'passed',
      affectedElements: []
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 3600000),
      baseline: '/api/placeholder/200/150',
      current: '/api/placeholder/200/150',
      diffPercentage: 5.2,
      status: 'warning',
      affectedElements: ['header', 'navigation']
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 7200000),
      baseline: '/api/placeholder/200/150',
      current: '/api/placeholder/200/150',
      diffPercentage: 12.8,
      status: 'failed',
      affectedElements: ['main-content', 'sidebar', 'footer']
    }
  ]);

  const [accessibilityIssues] = useState<AccessibilityIssue[]>([
    {
      id: '1',
      rule: 'color-contrast',
      severity: 'serious',
      element: 'button.primary',
      description: 'Tekst har ikke tilstrekkelig kontrast mot bakgrunn',
      howToFix: 'Øk kontrasten til minst 4.5:1 for normal tekst',
      wcagLevel: 'AA'
    },
    {
      id: '2',
      rule: 'image-alt',
      severity: 'critical',
      element: 'img#hero-image',
      description: 'Bilde mangler alt-tekst',
      howToFix: 'Legg til beskrivende alt-tekst for bildet',
      wcagLevel: 'A'
    },
    {
      id: '3',
      rule: 'label',
      severity: 'moderate',
      element: 'input#search',
      description: 'Skjemafelt mangler label',
      howToFix: 'Legg til en label eller aria-label',
      wcagLevel: 'A'
    }
  ]);

  const [testSuites] = useState<TestSuite[]>([
    {
      id: '1',
      name: 'Unit Tests',
      tests: [],
      totalPassed: 245,
      totalFailed: 3,
      totalSkipped: 5,
      coverage: 87,
      duration: 4.2,
      status: 'completed'
    },
    {
      id: '2',
      name: 'Integration Tests',
      tests: [],
      totalPassed: 68,
      totalFailed: 1,
      totalSkipped: 2,
      coverage: 72,
      duration: 12.5,
      status: 'completed'
    },
    {
      id: '3',
      name: 'E2E Tests',
      tests: [],
      totalPassed: 15,
      totalFailed: 0,
      totalSkipped: 1,
      coverage: 0,
      duration: 45.3,
      status: 'running'
    }
  ]);

  const [scanProgress, setScanProgress] = useState(0);

  // Simulate test run
  const runTests = () => {
    setIsRunning(true);
    setScanProgress(0);
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  // Get metric color
  const getMetricColor = (score: string) => {
    switch (score) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-orange-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'serious': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'minor': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TestTube2 className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">QA Suite Pro</h2>
            <Badge variant="secondary">
              <Activity className="h-3 w-3 mr-1" />
              Lighthouse Integrated
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import Report
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
            <Button 
              onClick={runTests}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Running... {scanProgress}%
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Full Suite
                </>
              )}
            </Button>
          </div>
        </div>

        {isRunning && (
          <div className="mt-3">
            <Progress value={scanProgress} className="h-2" />
          </div>
        )}
      </Card>

      {/* Lighthouse Scores */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Lighthouse Scores
          </h3>
          <Badge variant="outline">
            Sist oppdatert: {new Date().toLocaleTimeString()}
          </Badge>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {Object.entries(lighthouseScore).map(([key, score]) => (
            <div key={key} className="text-center">
              <div className={`relative w-24 h-24 mx-auto mb-2`}>
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(score / 100) * 226} 226`}
                    className={score >= 90 ? 'text-green-600' : score >= 50 ? 'text-orange-600' : 'text-red-600'}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{score}</span>
                </div>
              </div>
              <div className="text-sm font-medium capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="performance" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance">
            <Zap className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="visual">
            <Eye className="h-4 w-4 mr-2" />
            Visual Testing
          </TabsTrigger>
          <TabsTrigger value="accessibility">
            <Accessibility className="h-4 w-4 mr-2" />
            Accessibility
          </TabsTrigger>
          <TabsTrigger value="tests">
            <TestTube2 className="h-4 w-4 mr-2" />
            Test Results
          </TabsTrigger>
          <TabsTrigger value="coverage">
            <Layers className="h-4 w-4 mr-2" />
            Coverage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="flex-1">
          <div className="grid grid-cols-2 gap-4">
            {/* Metrics */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Core Web Vitals</h3>
              <div className="space-y-3">
                {performanceMetrics.map(metric => (
                  <div key={metric.name} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{metric.name}</span>
                      <Badge variant="outline" className={getMetricColor(metric.score)}>
                        {metric.value}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                    <div className="mt-2">
                      <Progress 
                        value={metric.score === 'good' ? 100 : metric.score === 'needs-improvement' ? 60 : 30}
                        className="h-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Device Comparison */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Device Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Desktop</div>
                      <div className="text-xs text-muted-foreground">Chrome 120</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">95</div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Mobile</div>
                      <div className="text-xs text-muted-foreground">4G Network</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">78</div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Optimeringsforslag</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Reduser JavaScript bundle størrelse</li>
                    <li>• Implementer lazy loading for bilder</li>
                    <li>• Aktiver tekst kompresjon</li>
                    <li>• Optimaliser kritisk rendering path</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="visual" className="flex-1">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {visualDiffs.map(diff => (
                <Card key={diff.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={
                      diff.status === 'passed' ? 'default' :
                      diff.status === 'warning' ? 'secondary' : 'destructive'
                    }>
                      {diff.status === 'passed' ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : diff.status === 'warning' ? (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {diff.diffPercentage}% diff
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {diff.timestamp.toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Baseline</div>
                      <div className="aspect-video bg-muted rounded border" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Current</div>
                      <div className="aspect-video bg-muted rounded border" />
                    </div>
                  </div>

                  {diff.affectedElements.length > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Affected:</span>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {diff.affectedElements.map(el => (
                          <Badge key={el} variant="outline" className="text-xs">
                            {el}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Visual Regression Settings</h3>
                <Button size="sm" variant="outline">
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Baseline
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium mb-1">Threshold</div>
                  <div className="text-muted-foreground">0.1%</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium mb-1">Viewports</div>
                  <div className="text-muted-foreground">Desktop, Tablet, Mobile</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium mb-1">Anti-aliasing</div>
                  <div className="text-muted-foreground">Enabled</div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accessibility" className="flex-1">
          <ScrollArea className="h-[450px]">
            <div className="space-y-3 pr-4">
              {accessibilityIssues.map(issue => (
                <Card key={issue.id} className={`p-4 border ${getSeverityColor(issue.severity)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">{issue.rule}</span>
                        <Badge variant="outline" className="text-xs">
                          WCAG {issue.wcagLevel}
                        </Badge>
                      </div>
                      <p className="text-sm">{issue.description}</p>
                    </div>
                    <Badge variant="outline" className={getSeverityColor(issue.severity)}>
                      {issue.severity}
                    </Badge>
                  </div>

                  <div className="mt-3 p-2 bg-background rounded">
                    <div className="text-xs font-mono text-muted-foreground mb-1">
                      Element: {issue.element}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Løsning:</span> {issue.howToFix}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="tests" className="flex-1">
          <div className="space-y-4">
            {testSuites.map(suite => (
              <Card key={suite.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{suite.name}</h3>
                    {suite.status === 'running' && (
                      <Badge variant="default" className="animate-pulse">
                        <Activity className="h-3 w-3 mr-1 animate-spin" />
                        Running
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>{suite.totalPassed}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>{suite.totalFailed}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span>{suite.totalSkipped}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <span>{suite.duration}s</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Success Rate</div>
                    <Progress 
                      value={(suite.totalPassed / (suite.totalPassed + suite.totalFailed + suite.totalSkipped)) * 100}
                      className="h-2"
                    />
                  </div>
                  {suite.coverage > 0 && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Coverage: {suite.coverage}%</div>
                      <Progress value={suite.coverage} className="h-2" />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="coverage" className="flex-1">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Code Coverage Report</h3>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">87%</div>
                <div className="text-sm text-muted-foreground">Statements</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">82%</div>
                <div className="text-sm text-muted-foreground">Branches</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">75%</div>
                <div className="text-sm text-muted-foreground">Functions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">89%</div>
                <div className="text-sm text-muted-foreground">Lines</div>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { file: 'src/components/', coverage: 92 },
                { file: 'src/utils/', coverage: 88 },
                { file: 'src/services/', coverage: 76 },
                { file: 'src/hooks/', coverage: 84 },
                { file: 'src/pages/', coverage: 69 }
              ].map(item => (
                <div key={item.file} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm font-mono">{item.file}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={item.coverage} className="w-32 h-2" />
                    <span className={`text-sm font-medium ${
                      item.coverage >= 80 ? 'text-green-600' : 
                      item.coverage >= 60 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {item.coverage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}