import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { 
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Settings,
  Eye,
  Play,
  Pause,
  RefreshCw,
  Info,
  Zap,
  Globe,
  Key,
  UserCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PolicyRule {
  id: string;
  name: string;
  domain: string;
  scope: string[];
  actions: string[];
  risk: "low" | "medium" | "high" | "critical";
  status: "active" | "warning" | "blocked";
  enforced: boolean;
  violations: number;
}

interface PolicyEvaluation {
  action: string;
  domain: string;
  risk: string;
  allowed: boolean;
  reason?: string;
  alternatives?: string[];
}

export function PolicyGuard() {
  const { toast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);
  const [testAction, setTestAction] = useState("");
  const [testDomain, setTestDomain] = useState("");
  
  const [policies] = useState<PolicyRule[]>([
    {
      id: "policy-1",
      name: "Read-only on banking sites",
      domain: "*.bank.com",
      scope: ["read"],
      actions: ["navigate", "screenshot", "extract"],
      risk: "critical",
      status: "active",
      enforced: true,
      violations: 0
    },
    {
      id: "policy-2",
      name: "Form submission restrictions",
      domain: "*",
      scope: ["write"],
      actions: ["submit_form"],
      risk: "high",
      status: "warning",
      enforced: false,
      violations: 3
    },
    {
      id: "policy-3",
      name: "Download limits",
      domain: "*",
      scope: ["download"],
      actions: ["download_file"],
      risk: "medium",
      status: "active",
      enforced: true,
      violations: 0
    },
    {
      id: "policy-4",
      name: "API rate limiting",
      domain: "api.*",
      scope: ["network"],
      actions: ["api_call"],
      risk: "low",
      status: "active",
      enforced: true,
      violations: 0
    }
  ]);

  const [evaluationHistory] = useState<PolicyEvaluation[]>([
    {
      action: "submit_form",
      domain: "example.com",
      risk: "high",
      allowed: false,
      reason: "Form submission requires explicit user approval"
    },
    {
      action: "screenshot",
      domain: "public-site.com",
      risk: "low",
      allowed: true
    },
    {
      action: "download_file",
      domain: "trusted-source.org",
      risk: "medium",
      allowed: true,
      alternatives: ["View in browser", "Save to cloud"]
    }
  ]);

  const runSimulation = () => {
    if (!testAction || !testDomain) {
      toast({
        title: "Missing information",
        description: "Please provide both action and domain for simulation",
        variant: "destructive"
      });
      return;
    }

    setIsSimulating(true);
    
    // Simulate policy evaluation
    setTimeout(() => {
      setIsSimulating(false);
      toast({
        title: "Simulation complete",
        description: `Action '${testAction}' on '${testDomain}' evaluated`,
      });
    }, 2000);
  };

  const togglePolicy = (policyId: string) => {
    toast({
      title: "Policy updated",
      description: "Policy enforcement status has been changed",
    });
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "critical": return <Badge variant="destructive">Critical</Badge>;
      case "high": return <Badge className="bg-orange-500">High</Badge>;
      case "medium": return <Badge className="bg-yellow-500">Medium</Badge>;
      case "low": return <Badge className="bg-green-500">Low</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "warning": return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case "blocked": return <XCircle className="h-3 w-3 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Policy Guard
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="simulation-mode" className="text-sm">
                  Simulation Mode
                </Label>
                <Switch
                  id="simulation-mode"
                  checked={simulationMode}
                  onCheckedChange={setSimulationMode}
                />
              </div>
              <Button size="sm" variant="outline">
                <FileText className="h-3 w-3 mr-1" />
                Export Policies
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Rule engine for evaluating actions against security policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="policies" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="policies">Policies</TabsTrigger>
              <TabsTrigger value="simulator">Simulator</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="policies" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {simulationMode ? (
                    <span className="text-yellow-600">
                      Simulation mode active - policies will log but not block
                    </span>
                  ) : (
                    <span>Policies are actively enforced</span>
                  )}
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {policies.map((policy) => (
                  <Card key={policy.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(policy.status)}
                            <span className="font-medium">{policy.name}</span>
                            {getRiskBadge(policy.risk)}
                            {policy.violations > 0 && (
                              <Badge variant="outline">
                                {policy.violations} violations
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              Domain: <code className="bg-muted px-1 rounded">{policy.domain}</code>
                            </div>
                            <div className="flex items-center gap-1">
                              <Key className="h-3 w-3" />
                              Scope: {policy.scope.join(", ")}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {policy.actions.map((action, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={policy.enforced}
                            onCheckedChange={() => togglePolicy(policy.id)}
                          />
                          <Button size="sm" variant="ghost">
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="simulator" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="text-sm font-medium">Policy Dry Run</div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Action</Label>
                        <Input 
                          placeholder="e.g., submit_form, download_file"
                          value={testAction}
                          onChange={(e) => setTestAction(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Domain</Label>
                        <Input 
                          placeholder="e.g., example.com"
                          value={testDomain}
                          onChange={(e) => setTestDomain(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Additional Context (YAML)</Label>
                      <Textarea 
                        placeholder="scopes: [read, write]&#10;user: admin&#10;risk_tolerance: medium"
                        className="font-mono text-sm h-24"
                      />
                    </div>

                    <Button 
                      onClick={runSimulation}
                      disabled={isSimulating}
                      className="w-full"
                    >
                      {isSimulating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Simulating...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Run Simulation
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {testAction && testDomain && !isSimulating && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Evaluation Result</span>
                        <Badge className="bg-green-500">Allowed</Badge>
                      </div>
                      
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Action '{testAction}' on '{testDomain}' is permitted under current policies
                        </AlertDescription>
                      </Alert>

                      <div className="text-xs text-muted-foreground">
                        <div>Matched policies: 2</div>
                        <div>Risk level: Medium</div>
                        <div>Required scopes: read, write</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Evaluation History</span>
                <Button size="sm" variant="outline">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {evaluationHistory.map((evaluation, index) => (
                    <Card key={index}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {evaluation.allowed ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500" />
                              )}
                              <code className="text-xs bg-muted px-1 rounded">
                                {evaluation.action}
                              </code>
                              <span className="text-xs text-muted-foreground">on</span>
                              <code className="text-xs bg-muted px-1 rounded">
                                {evaluation.domain}
                              </code>
                            </div>
                            {evaluation.reason && (
                              <div className="text-xs text-muted-foreground">
                                {evaluation.reason}
                              </div>
                            )}
                            {evaluation.alternatives && (
                              <div className="text-xs">
                                Alternatives: {evaluation.alternatives.join(", ")}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline">{evaluation.risk}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Enforcement Mode</div>
                        <div className="text-xs text-muted-foreground">
                          How strictly policies are enforced
                        </div>
                      </div>
                      <Badge>Strict</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Default Risk Tolerance</div>
                        <div className="text-xs text-muted-foreground">
                          Maximum acceptable risk level
                        </div>
                      </div>
                      <Badge className="bg-yellow-500">Medium</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Human-in-the-Loop</div>
                        <div className="text-xs text-muted-foreground">
                          Require approval for high-risk actions
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Audit Logging</div>
                        <div className="text-xs text-muted-foreground">
                          Log all policy evaluations
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Policy changes require admin approval and are logged in the audit trail
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}