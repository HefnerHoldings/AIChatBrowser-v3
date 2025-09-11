import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  PlayCircle, 
  PauseCircle, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  Globe,
  Zap
} from "lucide-react";

interface TestStep {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  details?: any;
}

interface TestRunnerProps {
  suite: any;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
}

export default function TestRunner({ suite, isRunning, onStart, onStop }: TestRunnerProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (suite) {
      // Initialize steps based on suite configuration
      const testSteps: TestStep[] = [];
      
      if (suite.tests?.lighthouse) {
        testSteps.push({
          id: 'lighthouse',
          name: 'Lighthouse Analyse',
          type: 'lighthouse',
          status: 'pending'
        });
      }
      
      if (suite.tests?.visualRegression) {
        testSteps.push({
          id: 'visual',
          name: 'Visuell Regresjon',
          type: 'visual-regression',
          status: 'pending'
        });
      }
      
      if (suite.tests?.accessibility) {
        testSteps.push({
          id: 'accessibility',
          name: 'Tilgjengelighetstest',
          type: 'accessibility',
          status: 'pending'
        });
      }

      // Add URL-specific steps
      suite.urls?.forEach((url: string, index: number) => {
        testSteps.push({
          id: `url-${index}`,
          name: `Test URL: ${url}`,
          type: 'functional',
          status: 'pending'
        });
      });

      setSteps(testSteps);
    }
  }, [suite]);

  useEffect(() => {
    if (isRunning && steps.length > 0) {
      // Simulate test execution
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < steps.length - 1) {
            // Update current step status
            setSteps(currentSteps => {
              const updated = [...currentSteps];
              if (updated[prev]) {
                updated[prev].status = 'passed';
                updated[prev].duration = Math.floor(Math.random() * 3000) + 1000;
              }
              if (updated[prev + 1]) {
                updated[prev + 1].status = 'running';
              }
              return updated;
            });
            
            // Add log entry
            setLogs(prevLogs => [...prevLogs, `✓ Fullført: ${steps[prev]?.name}`]);
            
            return prev + 1;
          } else {
            // All steps completed
            clearInterval(interval);
            return prev;
          }
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isRunning, steps]);

  useEffect(() => {
    // Update progress
    const completed = steps.filter(s => s.status === 'passed' || s.status === 'failed').length;
    setProgress((completed / (steps.length || 1)) * 100);
  }, [steps]);

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      case 'skipped':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'lighthouse':
        return <Zap className="w-4 h-4" />;
      case 'functional':
        return <Globe className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (!suite) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Velg en test suite for å starte testing
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {/* Test Configuration */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Test Konfigurasjon</CardTitle>
          <CardDescription>{suite.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">URLs å teste</label>
              <div className="mt-2 space-y-1">
                {suite.urls?.map((url: string, index: number) => (
                  <div key={index} className="text-sm text-muted-foreground truncate" data-testid={`text-url-${index}`}>
                    {url}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium">Aktive Tester</label>
              <div className="mt-2 space-y-2">
                {suite.tests?.lighthouse && (
                  <Badge variant="secondary" data-testid="badge-lighthouse">Lighthouse</Badge>
                )}
                {suite.tests?.visualRegression && (
                  <Badge variant="secondary" data-testid="badge-visual">Visuell Regresjon</Badge>
                )}
                {suite.tests?.accessibility && (
                  <Badge variant="secondary" data-testid="badge-accessibility">Tilgjengelighet</Badge>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                onClick={onStart}
                disabled={isRunning}
                data-testid="button-start-test"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Start Test
              </Button>
              <Button 
                className="flex-1" 
                variant="destructive"
                onClick={onStop}
                disabled={!isRunning}
                data-testid="button-stop-test"
              >
                <PauseCircle className="w-4 h-4 mr-2" />
                Stopp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Progress */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Test Fremgang</CardTitle>
          <CardDescription>
            {isRunning ? 'Kjører tester...' : 'Klar til å starte'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Fremgang</span>
                <span data-testid="text-progress">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <ScrollArea className="h-[400px] border rounded-lg p-3">
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div 
                    key={step.id}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      step.status === 'running' ? 'bg-primary/10' : ''
                    }`}
                    data-testid={`step-${step.id}`}
                  >
                    {getStepIcon(step.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getStepTypeIcon(step.type)}
                        <span className="text-sm font-medium truncate">{step.name}</span>
                      </div>
                      {step.duration && (
                        <span className="text-xs text-muted-foreground">
                          {step.duration}ms
                        </span>
                      )}
                      {step.error && (
                        <div className="text-xs text-red-600 mt-1">{step.error}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Test Logs */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Test Logger</CardTitle>
          <CardDescription>Sanntids test output</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] border rounded-lg bg-black/5 dark:bg-white/5 p-3">
            <div className="font-mono text-xs space-y-1">
              {logs.length === 0 ? (
                <div className="text-muted-foreground">Venter på test start...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-muted-foreground" data-testid={`log-${index}`}>
                    <span className="text-primary">[{new Date().toLocaleTimeString()}]</span> {log}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}