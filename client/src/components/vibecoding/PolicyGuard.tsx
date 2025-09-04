import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileCheck,
  Database,
  Globe,
  Key,
  Fingerprint,
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Activity,
  TrendingUp,
  AlertOctagon,
  Info,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

// Policy Types
interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: 'data' | 'network' | 'permissions' | 'authentication' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  rules: PolicyRule[];
  violationCount: number;
  lastChecked: Date;
}

interface PolicyRule {
  id: string;
  condition: string;
  action: 'allow' | 'deny' | 'warn' | 'log';
  parameters?: Record<string, any>;
  description: string;
}

interface PolicyViolation {
  id: string;
  policyId: string;
  policyName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  resource: string;
  timestamp: Date;
  resolved: boolean;
  details: string;
}

interface SecurityScan {
  id: string;
  status: 'idle' | 'scanning' | 'completed' | 'failed';
  progress: number;
  findings: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  startTime?: Date;
  endTime?: Date;
}

export function PolicyGuard() {
  const [policies, setPolicies] = useState<SecurityPolicy[]>([
    {
      id: '1',
      name: 'GDPR Datahåndtering',
      description: 'Sikrer at persondata håndteres i henhold til GDPR',
      category: 'compliance',
      severity: 'critical',
      enabled: true,
      rules: [
        {
          id: 'gdpr-1',
          condition: 'data.contains.personalInfo',
          action: 'warn',
          description: 'Varsler når personlig informasjon detekteres'
        },
        {
          id: 'gdpr-2',
          condition: 'data.export.eu',
          action: 'deny',
          description: 'Blokkerer eksport av data utenfor EU'
        }
      ],
      violationCount: 2,
      lastChecked: new Date()
    },
    {
      id: '2',
      name: 'API Sikkerhet',
      description: 'Kontrollerer API-tilgang og autentisering',
      category: 'authentication',
      severity: 'high',
      enabled: true,
      rules: [
        {
          id: 'api-1',
          condition: 'request.auth.missing',
          action: 'deny',
          description: 'Blokkerer uautentiserte forespørsler'
        },
        {
          id: 'api-2',
          condition: 'request.rate.exceeded',
          action: 'deny',
          parameters: { limit: 1000, window: '1h' },
          description: 'Rate limiting for API kall'
        }
      ],
      violationCount: 5,
      lastChecked: new Date()
    },
    {
      id: '3',
      name: 'Nettverkstilgang',
      description: 'Kontrollerer hvilke domener som kan kontaktes',
      category: 'network',
      severity: 'medium',
      enabled: true,
      rules: [
        {
          id: 'net-1',
          condition: 'domain.notInWhitelist',
          action: 'warn',
          description: 'Varsler ved tilgang til ukjente domener'
        },
        {
          id: 'net-2',
          condition: 'protocol.http',
          action: 'warn',
          description: 'Varsler ved usikker HTTP-tilkobling'
        }
      ],
      violationCount: 12,
      lastChecked: new Date()
    },
    {
      id: '4',
      name: 'Database Sikkerhet',
      description: 'Beskytter mot SQL injection og datalekkasjer',
      category: 'data',
      severity: 'critical',
      enabled: true,
      rules: [
        {
          id: 'db-1',
          condition: 'query.contains.sqlInjection',
          action: 'deny',
          description: 'Blokkerer potensielle SQL injections'
        },
        {
          id: 'db-2',
          condition: 'query.returnRows.exceeds',
          action: 'warn',
          parameters: { limit: 1000 },
          description: 'Varsler ved store datamengder'
        }
      ],
      violationCount: 0,
      lastChecked: new Date()
    }
  ]);

  const [violations, setViolations] = useState<PolicyViolation[]>([
    {
      id: '1',
      policyId: '1',
      policyName: 'GDPR Datahåndtering',
      severity: 'high',
      action: 'Data eksport blokkert',
      resource: '/api/export/users',
      timestamp: new Date(Date.now() - 3600000),
      resolved: false,
      details: 'Forsøk på å eksportere brukerdata til ikke-EU server'
    },
    {
      id: '2',
      policyId: '2',
      policyName: 'API Sikkerhet',
      severity: 'medium',
      action: 'Rate limit overskredet',
      resource: '/api/search',
      timestamp: new Date(Date.now() - 7200000),
      resolved: true,
      details: 'Klient overskred 1000 forespørsler per time'
    },
    {
      id: '3',
      policyId: '3',
      policyName: 'Nettverkstilgang',
      severity: 'low',
      action: 'Ukjent domene kontaktet',
      resource: 'analytics.third-party.com',
      timestamp: new Date(Date.now() - 10800000),
      resolved: false,
      details: 'Tredjepartsdomene ikke i whitelist'
    }
  ]);

  const [currentScan, setCurrentScan] = useState<SecurityScan>({
    id: '1',
    status: 'idle',
    progress: 0,
    findings: { critical: 0, high: 0, medium: 0, low: 0 }
  });

  const [simulationMode, setSimulationMode] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<SecurityPolicy | null>(null);

  // Start security scan
  const startScan = () => {
    setCurrentScan({
      ...currentScan,
      status: 'scanning',
      progress: 0,
      startTime: new Date()
    });

    // Simulate scanning progress
    const interval = setInterval(() => {
      setCurrentScan(prev => {
        if (prev.progress >= 100) {
          clearInterval(interval);
          return {
            ...prev,
            status: 'completed',
            progress: 100,
            endTime: new Date(),
            findings: {
              critical: Math.floor(Math.random() * 2),
              high: Math.floor(Math.random() * 5),
              medium: Math.floor(Math.random() * 10),
              low: Math.floor(Math.random() * 20)
            }
          };
        }
        return { ...prev, progress: prev.progress + 10 };
      });
    }, 500);
  };

  // Toggle policy
  const togglePolicy = (policyId: string) => {
    setPolicies(prev => prev.map(p => 
      p.id === policyId ? { ...p, enabled: !p.enabled } : p
    ));
  };

  // Resolve violation
  const resolveViolation = (violationId: string) => {
    setViolations(prev => prev.map(v =>
      v.id === violationId ? { ...v, resolved: true } : v
    ));
  };

  // Calculate security score
  const calculateSecurityScore = () => {
    const enabledPolicies = policies.filter(p => p.enabled).length;
    const totalPolicies = policies.length;
    const unresolvedViolations = violations.filter(v => !v.resolved).length;
    
    const policyScore = (enabledPolicies / totalPolicies) * 50;
    const violationScore = Math.max(0, 50 - (unresolvedViolations * 10));
    
    return Math.round(policyScore + violationScore);
  };

  const securityScore = calculateSecurityScore();

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Header & Overview */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Policy Guard</h2>
            <Badge variant="outline">
              Security Score: {securityScore}%
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={simulationMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSimulationMode(!simulationMode)}
            >
              {simulationMode ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              Simuleringsmodus
            </Button>
            <Button 
              size="sm"
              onClick={startScan}
              disabled={currentScan.status === 'scanning'}
            >
              {currentScan.status === 'scanning' ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Skanner... {currentScan.progress}%
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Skanning
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Security Score Visual */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Sikkerhetsnivå</span>
              <ShieldCheck className={`h-4 w-4 ${
                securityScore >= 80 ? 'text-green-600' :
                securityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
            <div className="text-2xl font-bold">{securityScore}%</div>
            <Progress value={securityScore} className="h-2 mt-2" />
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Aktive Policyer</span>
              <FileCheck className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold">
              {policies.filter(p => p.enabled).length}/{policies.length}
            </div>
            <span className="text-xs text-muted-foreground">
              {Math.round((policies.filter(p => p.enabled).length / policies.length) * 100)}% aktivert
            </span>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Uløste Brudd</span>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold">
              {violations.filter(v => !v.resolved).length}
            </div>
            <span className="text-xs text-muted-foreground">
              {violations.filter(v => !v.resolved && v.severity === 'critical').length} kritiske
            </span>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Siste Skanning</span>
              <Activity className="h-4 w-4 text-green-600" />
            </div>
            {currentScan.status === 'completed' && currentScan.endTime ? (
              <>
                <div className="text-sm font-medium">
                  {currentScan.findings.critical + currentScan.findings.high} problemer
                </div>
                <span className="text-xs text-muted-foreground">
                  {currentScan.endTime.toLocaleTimeString()}
                </span>
              </>
            ) : currentScan.status === 'scanning' ? (
              <div className="text-sm">Skanner...</div>
            ) : (
              <div className="text-sm text-muted-foreground">Ikke skannet</div>
            )}
          </Card>
        </div>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="policies" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="policies">
            <Shield className="h-4 w-4 mr-2" />
            Sikkerhetspolicyer
          </TabsTrigger>
          <TabsTrigger value="violations">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Brudd & Varsler
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Activity className="h-4 w-4 mr-2" />
            Overvåking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="flex-1">
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {policies.map((policy) => (
                <Card key={policy.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{policy.name}</h4>
                        <Badge variant="outline" className={getSeverityColor(policy.severity)}>
                          {policy.severity}
                        </Badge>
                        <Badge variant="secondary">{policy.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{policy.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={policy.enabled}
                        onCheckedChange={() => togglePolicy(policy.id)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPolicy(policy)}
                      >
                        Detaljer
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Regler: {policy.rules.length}</span>
                      <span className="text-muted-foreground">
                        Brudd: {policy.violationCount}
                      </span>
                      <span className="text-muted-foreground">
                        Sist sjekket: {policy.lastChecked.toLocaleTimeString()}
                      </span>
                    </div>

                    {policy.enabled && simulationMode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-2 border-t"
                      >
                        <div className="text-xs font-medium mb-2">Aktive Regler:</div>
                        {policy.rules.map(rule => (
                          <div key={rule.id} className="flex items-center gap-2 text-xs mb-1">
                            <Badge variant={rule.action === 'deny' ? 'destructive' : 'secondary'}>
                              {rule.action}
                            </Badge>
                            <span className="text-muted-foreground">{rule.description}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="violations" className="flex-1">
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {violations.map((violation) => (
                <motion.div
                  key={violation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card className={`p-4 ${violation.resolved ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {violation.resolved ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">{violation.policyName}</span>
                          <Badge variant="outline" className={getSeverityColor(violation.severity)}>
                            {violation.severity}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{violation.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">{violation.details}</p>
                      </div>
                      {!violation.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveViolation(violation.id)}
                        >
                          Løs
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Ressurs: {violation.resource}</span>
                      <span>{violation.timestamp.toLocaleString()}</span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="monitoring" className="flex-1">
          <div className="space-y-4">
            {/* Scan Results */}
            {currentScan.status === 'completed' && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Skanningsresultater</h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className={`p-3 rounded-lg border ${getSeverityColor('critical')}`}>
                    <div className="text-2xl font-bold">{currentScan.findings.critical}</div>
                    <div className="text-sm">Kritiske</div>
                  </div>
                  <div className={`p-3 rounded-lg border ${getSeverityColor('high')}`}>
                    <div className="text-2xl font-bold">{currentScan.findings.high}</div>
                    <div className="text-sm">Høye</div>
                  </div>
                  <div className={`p-3 rounded-lg border ${getSeverityColor('medium')}`}>
                    <div className="text-2xl font-bold">{currentScan.findings.medium}</div>
                    <div className="text-sm">Medium</div>
                  </div>
                  <div className={`p-3 rounded-lg border ${getSeverityColor('low')}`}>
                    <div className="text-2xl font-bold">{currentScan.findings.low}</div>
                    <div className="text-sm">Lave</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Real-time Activity */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Sanntidsaktivitet</h3>
                <Badge variant="secondary" className="animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
              <div className="space-y-2">
                {[
                  { time: '10:06:45', event: 'API autentisering godkjent', status: 'success' },
                  { time: '10:06:42', event: 'Rate limit sjekk utført', status: 'warning' },
                  { time: '10:06:38', event: 'Database query validert', status: 'success' },
                  { time: '10:06:35', event: 'Ukjent domene blokkert', status: 'error' }
                ].map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                    <div className={`h-2 w-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span>{activity.event}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Policy Details Modal */}
      <AnimatePresence>
        {selectedPolicy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={() => setSelectedPolicy(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px]"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">{selectedPolicy.name}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedPolicy(null)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {selectedPolicy.description}
                </p>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Policy Regler</h4>
                    <div className="space-y-2">
                      {selectedPolicy.rules.map(rule => (
                        <div key={rule.id} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <code className="text-xs">{rule.condition}</code>
                            <Badge variant={rule.action === 'deny' ? 'destructive' : 'secondary'}>
                              {rule.action}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{rule.description}</p>
                          {rule.parameters && (
                            <div className="mt-2 text-xs">
                              Parametere: {JSON.stringify(rule.parameters)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Policy Status</span>
                      <Badge variant={selectedPolicy.enabled ? 'default' : 'secondary'}>
                        {selectedPolicy.enabled ? 'Aktivert' : 'Deaktivert'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}