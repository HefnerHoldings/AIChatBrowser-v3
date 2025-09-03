import { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Eye,
  EyeOff,
  Camera,
  Mic,
  MapPin,
  Bell,
  FileText,
  Database,
  Cpu,
  HardDrive,
  Cloud,
  Key,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  AlertOctagon,
  Monitor,
  Fingerprint,
  Globe,
  Zap,
  Activity,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';

interface Permission {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  granted: boolean;
  required: boolean;
  risk: 'low' | 'medium' | 'high';
}

interface SecurityPolicy {
  id: string;
  name: string;
  enabled: boolean;
  level: 'strict' | 'balanced' | 'relaxed';
  rules: string[];
}

interface ProcessInfo {
  id: string;
  name: string;
  type: 'main' | 'renderer' | 'plugin' | 'extension' | 'worker';
  pid: number;
  memory: number;
  cpu: number;
  sandboxed: boolean;
  permissions: string[];
  origin?: string;
  status: 'active' | 'suspended' | 'crashed';
}

interface SecurityEvent {
  id: string;
  timestamp: number;
  type: 'blocked' | 'allowed' | 'warning' | 'violation';
  category: 'csp' | 'cors' | 'permission' | 'certificate' | 'mixed-content' | 'xss' | 'injection';
  message: string;
  url?: string;
  details?: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

interface CSPDirective {
  directive: string;
  value: string;
  enabled: boolean;
  description: string;
}

interface SecuritySandboxProps {
  isOpen: boolean;
  onClose: () => void;
  tabId?: string;
  url?: string;
}

export function SecuritySandbox({ isOpen, onClose, tabId, url }: SecuritySandboxProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'camera',
      name: 'Kamera',
      description: 'Tillat tilgang til kamera',
      icon: <Camera className="w-4 h-4" />,
      granted: false,
      required: false,
      risk: 'high'
    },
    {
      id: 'microphone',
      name: 'Mikrofon',
      description: 'Tillat tilgang til mikrofon',
      icon: <Mic className="w-4 h-4" />,
      granted: false,
      required: false,
      risk: 'high'
    },
    {
      id: 'location',
      name: 'Posisjon',
      description: 'Tillat tilgang til geografisk posisjon',
      icon: <MapPin className="w-4 h-4" />,
      granted: false,
      required: false,
      risk: 'high'
    },
    {
      id: 'notifications',
      name: 'Varsler',
      description: 'Tillat å sende varsler',
      icon: <Bell className="w-4 h-4" />,
      granted: false,
      required: false,
      risk: 'low'
    },
    {
      id: 'clipboard',
      name: 'Utklippstavle',
      description: 'Tillat tilgang til utklippstavle',
      icon: <FileText className="w-4 h-4" />,
      granted: false,
      required: false,
      risk: 'medium'
    },
    {
      id: 'storage',
      name: 'Lagring',
      description: 'Tillat lokal lagring av data',
      icon: <Database className="w-4 h-4" />,
      granted: true,
      required: true,
      risk: 'low'
    }
  ]);

  const [processes, setProcesses] = useState<ProcessInfo[]>([
    {
      id: 'main-1',
      name: 'Browser Main Process',
      type: 'main',
      pid: 1234,
      memory: 125.4,
      cpu: 2.1,
      sandboxed: false,
      permissions: ['all'],
      status: 'active'
    },
    {
      id: 'renderer-1',
      name: 'Tab: ' + (url || 'about:blank'),
      type: 'renderer',
      pid: 5678,
      memory: 85.2,
      cpu: 0.8,
      sandboxed: true,
      permissions: ['storage', 'network'],
      origin: url,
      status: 'active'
    }
  ]);

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [policies, setPolicies] = useState<SecurityPolicy[]>([
    {
      id: 'csp',
      name: 'Content Security Policy',
      enabled: true,
      level: 'balanced',
      rules: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https:",
        "frame-src 'none'"
      ]
    },
    {
      id: 'cors',
      name: 'Cross-Origin Resource Sharing',
      enabled: true,
      level: 'strict',
      rules: [
        'Blokker cross-origin forespørsler uten CORS headers',
        'Valider Access-Control-Allow-Origin',
        'Håndhev preflight requests'
      ]
    },
    {
      id: 'mixed-content',
      name: 'Mixed Content Blocking',
      enabled: true,
      level: 'strict',
      rules: [
        'Blokker HTTP ressurser på HTTPS sider',
        'Oppgrader HTTP forespørsler til HTTPS når mulig'
      ]
    }
  ]);

  const [cspDirectives, setCspDirectives] = useState<CSPDirective[]>([
    {
      directive: 'default-src',
      value: "'self'",
      enabled: true,
      description: 'Standard kilde for alle ressurser'
    },
    {
      directive: 'script-src',
      value: "'self' 'unsafe-inline'",
      enabled: true,
      description: 'Kilder for JavaScript'
    },
    {
      directive: 'style-src',
      value: "'self' 'unsafe-inline'",
      enabled: true,
      description: 'Kilder for CSS stilark'
    },
    {
      directive: 'img-src',
      value: "'self' data: https:",
      enabled: true,
      description: 'Kilder for bilder'
    },
    {
      directive: 'connect-src',
      value: "'self' https:",
      enabled: true,
      description: 'Kilder for AJAX, WebSocket og EventSource'
    },
    {
      directive: 'frame-src',
      value: "'none'",
      enabled: true,
      description: 'Kilder for iframes'
    },
    {
      directive: 'worker-src',
      value: "'self'",
      enabled: true,
      description: 'Kilder for Web Workers'
    },
    {
      directive: 'object-src',
      value: "'none'",
      enabled: true,
      description: 'Kilder for plugins'
    }
  ]);

  const [sandboxLevel, setSandboxLevel] = useState<'strict' | 'balanced' | 'relaxed'>('balanced');
  const [httpsOnly, setHttpsOnly] = useState(false);
  const [blockThirdPartyCookies, setBlockThirdPartyCookies] = useState(true);
  const [doNotTrack, setDoNotTrack] = useState(true);
  const [blockFingerprinting, setBlockFingerprinting] = useState(true);

  // Monitor security events
  useEffect(() => {
    if (!isOpen) return;

    const monitorSecurity = () => {
      // Simulate security events
      const events: SecurityEvent[] = [
        {
          id: `event-${Date.now()}-1`,
          timestamp: Date.now(),
          type: 'blocked',
          category: 'mixed-content',
          message: 'Blokkerte HTTP ressurs på HTTPS side',
          url: 'http://example.com/script.js',
          severity: 'warning'
        },
        {
          id: `event-${Date.now()}-2`,
          timestamp: Date.now(),
          type: 'warning',
          category: 'csp',
          message: 'CSP violation: inline-script blokkert',
          url: url,
          severity: 'warning',
          details: {
            directive: 'script-src',
            blocked: 'inline'
          }
        }
      ];

      setSecurityEvents(prev => [...events, ...prev].slice(0, 100));
    };

    // Monitor CSP violations
    const handleCSPViolation = (e: SecurityPolicyViolationEvent) => {
      const event: SecurityEvent = {
        id: `csp-${Date.now()}`,
        timestamp: Date.now(),
        type: 'violation',
        category: 'csp',
        message: `CSP violation: ${e.violatedDirective}`,
        url: e.blockedURI,
        severity: 'error',
        details: {
          directive: e.violatedDirective,
          originalPolicy: e.originalPolicy,
          blockedURI: e.blockedURI,
          lineNumber: e.lineNumber,
          columnNumber: e.columnNumber
        }
      };

      setSecurityEvents(prev => [event, ...prev].slice(0, 100));
    };

    // Set up event listeners
    document.addEventListener('securitypolicyviolation', handleCSPViolation);
    const interval = setInterval(monitorSecurity, 10000);

    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation);
      clearInterval(interval);
    };
  }, [isOpen, url]);

  // Check permission status
  useEffect(() => {
    const checkPermissions = async () => {
      if (!navigator.permissions) return;

      try {
        // Check camera permission
        const camera = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissions(prev => prev.map(p => 
          p.id === 'camera' ? { ...p, granted: camera.state === 'granted' } : p
        ));

        // Check microphone permission
        const microphone = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissions(prev => prev.map(p => 
          p.id === 'microphone' ? { ...p, granted: microphone.state === 'granted' } : p
        ));

        // Check location permission
        const location = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setPermissions(prev => prev.map(p => 
          p.id === 'location' ? { ...p, granted: location.state === 'granted' } : p
        ));

        // Check notifications permission
        if ('Notification' in window) {
          setPermissions(prev => prev.map(p => 
            p.id === 'notifications' ? { ...p, granted: Notification.permission === 'granted' } : p
          ));
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    };

    if (isOpen) {
      checkPermissions();
    }
  }, [isOpen]);

  const togglePermission = async (permissionId: string) => {
    const permission = permissions.find(p => p.id === permissionId);
    if (!permission) return;

    if (!permission.granted) {
      // Request permission
      try {
        switch (permissionId) {
          case 'camera':
            await navigator.mediaDevices.getUserMedia({ video: true });
            break;
          case 'microphone':
            await navigator.mediaDevices.getUserMedia({ audio: true });
            break;
          case 'location':
            await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            break;
          case 'notifications':
            await Notification.requestPermission();
            break;
        }

        setPermissions(prev => prev.map(p => 
          p.id === permissionId ? { ...p, granted: true } : p
        ));

        toast({
          title: 'Tillatelse gitt',
          description: `${permission.name} tilgang er aktivert`,
        });

        // Log security event
        const event: SecurityEvent = {
          id: `perm-${Date.now()}`,
          timestamp: Date.now(),
          type: 'allowed',
          category: 'permission',
          message: `Tillatelse gitt: ${permission.name}`,
          severity: 'info'
        };
        setSecurityEvents(prev => [event, ...prev].slice(0, 100));

      } catch (error) {
        toast({
          title: 'Tillatelse nektet',
          description: `Kunne ikke aktivere ${permission.name}`,
          variant: 'destructive'
        });
      }
    } else {
      // Revoke permission (simulated)
      setPermissions(prev => prev.map(p => 
        p.id === permissionId ? { ...p, granted: false } : p
      ));

      toast({
        title: 'Tillatelse fjernet',
        description: `${permission.name} tilgang er deaktivert`,
      });

      // Log security event
      const event: SecurityEvent = {
        id: `perm-${Date.now()}`,
        timestamp: Date.now(),
        type: 'blocked',
        category: 'permission',
        message: `Tillatelse fjernet: ${permission.name}`,
        severity: 'info'
      };
      setSecurityEvents(prev => [event, ...prev].slice(0, 100));
    }
  };

  const updateSandboxLevel = (level: 'strict' | 'balanced' | 'relaxed') => {
    setSandboxLevel(level);
    
    // Update CSP based on level
    switch (level) {
      case 'strict':
        setCspDirectives(prev => prev.map(d => ({
          ...d,
          value: d.directive === 'default-src' ? "'self'" :
                 d.directive === 'script-src' ? "'self'" :
                 d.directive === 'style-src' ? "'self'" :
                 d.directive === 'frame-src' ? "'none'" :
                 d.directive === 'object-src' ? "'none'" :
                 d.value,
          enabled: true
        })));
        setHttpsOnly(true);
        setBlockThirdPartyCookies(true);
        setDoNotTrack(true);
        setBlockFingerprinting(true);
        break;
      case 'balanced':
        setCspDirectives(prev => prev.map(d => ({
          ...d,
          value: d.directive === 'script-src' ? "'self' 'unsafe-inline'" :
                 d.directive === 'style-src' ? "'self' 'unsafe-inline'" :
                 d.value,
          enabled: true
        })));
        setHttpsOnly(false);
        setBlockThirdPartyCookies(true);
        setDoNotTrack(true);
        setBlockFingerprinting(false);
        break;
      case 'relaxed':
        setCspDirectives(prev => prev.map(d => ({
          ...d,
          enabled: d.directive !== 'frame-src' && d.directive !== 'object-src'
        })));
        setHttpsOnly(false);
        setBlockThirdPartyCookies(false);
        setDoNotTrack(false);
        setBlockFingerprinting(false);
        break;
    }

    toast({
      title: 'Sikkerhetsnivå oppdatert',
      description: `Sandboxing satt til ${level} modus`,
    });

    // Log security event
    const event: SecurityEvent = {
      id: `sandbox-${Date.now()}`,
      timestamp: Date.now(),
      type: 'allowed',
      category: 'csp',
      message: `Sikkerhetsnivå endret til: ${level}`,
      severity: 'info'
    };
    setSecurityEvents(prev => [event, ...prev].slice(0, 100));
  };

  const generateCSPHeader = () => {
    const enabledDirectives = cspDirectives
      .filter(d => d.enabled)
      .map(d => `${d.directive} ${d.value}`)
      .join('; ');
    
    return `Content-Security-Policy: ${enabledDirectives}`;
  };

  const clearSecurityEvents = () => {
    setSecurityEvents([]);
    toast({
      title: 'Sikkerhetslogg tømt',
      description: 'Alle sikkerhetshendelser er fjernet',
    });
  };

  const terminateProcess = (processId: string) => {
    setProcesses(prev => prev.map(p => 
      p.id === processId ? { ...p, status: 'crashed' as const } : p
    ));
    
    toast({
      title: 'Prosess terminert',
      description: `Prosess ${processId} er stoppet`,
      variant: 'destructive'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'blocked': return <ShieldAlert className="w-4 h-4" />;
      case 'allowed': return <ShieldCheck className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'violation': return <AlertOctagon className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Sikkerhet og Sandboxing
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={sandboxLevel === 'strict' ? 'destructive' : sandboxLevel === 'balanced' ? 'default' : 'secondary'}>
                {sandboxLevel === 'strict' ? 'Streng' : sandboxLevel === 'balanced' ? 'Balansert' : 'Avslappet'} sikkerhet
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Administrer sikkerhetspolicyer, tillatelser og sandboxing for nettleseren
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Oversikt</TabsTrigger>
              <TabsTrigger value="permissions">Tillatelser</TabsTrigger>
              <TabsTrigger value="sandbox">Sandboxing</TabsTrigger>
              <TabsTrigger value="csp">CSP</TabsTrigger>
              <TabsTrigger value="events">Hendelser</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      Sikkerhetsstatus
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sikkerhetsnivå</span>
                      <Select value={sandboxLevel} onValueChange={(v) => updateSandboxLevel(v as any)}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="strict">Streng</SelectItem>
                          <SelectItem value="balanced">Balansert</SelectItem>
                          <SelectItem value="relaxed">Avslappet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="https-only" className="text-sm">Kun HTTPS</Label>
                        <Switch
                          id="https-only"
                          checked={httpsOnly}
                          onCheckedChange={setHttpsOnly}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="third-party" className="text-sm">Blokker tredjeparts cookies</Label>
                        <Switch
                          id="third-party"
                          checked={blockThirdPartyCookies}
                          onCheckedChange={setBlockThirdPartyCookies}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="dnt" className="text-sm">Do Not Track</Label>
                        <Switch
                          id="dnt"
                          checked={doNotTrack}
                          onCheckedChange={setDoNotTrack}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="fingerprint" className="text-sm">Blokker fingerprinting</Label>
                        <Switch
                          id="fingerprint"
                          checked={blockFingerprinting}
                          onCheckedChange={setBlockFingerprinting}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Prosessisolering
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {processes.map(process => (
                          <div key={process.id} className="p-2 border rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={process.status === 'active' ? 'default' : 'destructive'}>
                                  {process.type}
                                </Badge>
                                <span className="text-sm font-medium">{process.name}</span>
                              </div>
                              {process.sandboxed && (
                                <Badge variant="outline" className="text-xs">
                                  <Lock className="w-3 h-3 mr-1" />
                                  Sandboxed
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>PID: {process.pid}</span>
                              <span>RAM: {process.memory.toFixed(1)} MB</span>
                              <span>CPU: {process.cpu.toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {process.permissions.map(perm => (
                                <Badge key={perm} variant="secondary" className="text-xs">
                                  {perm}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Siste sikkerhetshendelser
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {securityEvents.slice(0, 5).map(event => (
                          <div key={event.id} className="flex items-start gap-2 p-2 border rounded">
                            <div className={getSeverityColor(event.severity)}>
                              {getEventIcon(event.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{event.message}</p>
                              {event.url && (
                                <p className="text-xs text-muted-foreground truncate">{event.url}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      Aktive policyer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {policies.map(policy => (
                        <div key={policy.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            {policy.enabled ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm font-medium">{policy.name}</span>
                          </div>
                          <Badge variant={policy.enabled ? 'default' : 'secondary'}>
                            {policy.level}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Tillatelser</AlertTitle>
                  <AlertDescription>
                    Administrer hvilke tillatelser nettsteder kan be om og bruke
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  {permissions.map(permission => (
                    <Card key={permission.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {permission.icon}
                            <CardTitle className="text-base">{permission.name}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              permission.risk === 'high' ? 'destructive' :
                              permission.risk === 'medium' ? 'default' :
                              'secondary'
                            }>
                              {permission.risk === 'high' ? 'Høy' :
                               permission.risk === 'medium' ? 'Medium' :
                               'Lav'} risiko
                            </Badge>
                            <Switch
                              checked={permission.granted}
                              onCheckedChange={() => togglePermission(permission.id)}
                              disabled={permission.required}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {permission.description}
                        </p>
                        {permission.required && (
                          <p className="text-xs text-muted-foreground mt-2">
                            <Info className="w-3 h-3 inline mr-1" />
                            Påkrevd for grunnleggende funksjonalitet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sandbox" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Sandboxing</AlertTitle>
                  <AlertDescription>
                    Isoler og begrens nettsider for å beskytte systemet ditt
                  </AlertDescription>
                </Alert>

                <Card>
                  <CardHeader>
                    <CardTitle>Sandbox-innstillinger</CardTitle>
                    <CardDescription>
                      Konfigurer hvordan nettsider isoleres fra hverandre og systemet
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Card className={`cursor-pointer ${sandboxLevel === 'strict' ? 'ring-2 ring-primary' : ''}`}
                            onClick={() => updateSandboxLevel('strict')}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" />
                            Streng
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground">
                            Maksimal sikkerhet. Begrenser alle farlige operasjoner.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className={`cursor-pointer ${sandboxLevel === 'balanced' ? 'ring-2 ring-primary' : ''}`}
                            onClick={() => updateSandboxLevel('balanced')}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Balansert
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground">
                            God balanse mellom sikkerhet og funksjonalitet.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className={`cursor-pointer ${sandboxLevel === 'relaxed' ? 'ring-2 ring-primary' : ''}`}
                            onClick={() => updateSandboxLevel('relaxed')}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <ShieldOff className="w-4 h-4" />
                            Avslappet
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground">
                            Minimal begrensning. Tillater mest mulig funksjonalitet.
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Sandbox-attributter</h4>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked />
                          <span className="text-sm">allow-scripts</span>
                          <span className="text-xs text-muted-foreground">- Tillat JavaScript</span>
                        </Label>
                        <Label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked />
                          <span className="text-sm">allow-same-origin</span>
                          <span className="text-xs text-muted-foreground">- Tillat samme opprinnelse</span>
                        </Label>
                        <Label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked />
                          <span className="text-sm">allow-forms</span>
                          <span className="text-xs text-muted-foreground">- Tillat skjemaer</span>
                        </Label>
                        <Label className="flex items-center gap-2">
                          <input type="checkbox" />
                          <span className="text-sm">allow-popups</span>
                          <span className="text-xs text-muted-foreground">- Tillat popup-vinduer</span>
                        </Label>
                        <Label className="flex items-center gap-2">
                          <input type="checkbox" />
                          <span className="text-sm">allow-top-navigation</span>
                          <span className="text-xs text-muted-foreground">- Tillat navigering i toppvindu</span>
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Prosessisolering</CardTitle>
                    <CardDescription>
                      Hver fane kjører i sin egen isolerte prosess
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {processes.map(process => (
                        <div key={process.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Monitor className="w-4 h-4" />
                            <div>
                              <p className="text-sm font-medium">{process.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>PID: {process.pid}</span>
                                {process.sandboxed && (
                                  <Badge variant="outline" className="text-xs">
                                    <Lock className="w-3 h-3 mr-1" />
                                    Isolert
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right text-xs">
                              <p>{process.memory.toFixed(1)} MB</p>
                              <p className="text-muted-foreground">{process.cpu.toFixed(1)}% CPU</p>
                            </div>
                            {process.type === 'renderer' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => terminateProcess(process.id)}
                                disabled={process.status === 'crashed'}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="csp" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>Content Security Policy</AlertTitle>
                  <AlertDescription>
                    Definer hvilke ressurser som kan lastes og kjøres
                  </AlertDescription>
                </Alert>

                <Card>
                  <CardHeader>
                    <CardTitle>CSP Direktiver</CardTitle>
                    <CardDescription>
                      Konfigurer Content Security Policy regler
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {cspDirectives.map((directive, index) => (
                      <div key={directive.directive} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Switch
                          checked={directive.enabled}
                          onCheckedChange={(checked) => {
                            setCspDirectives(prev => prev.map((d, i) => 
                              i === index ? { ...d, enabled: checked } : d
                            ));
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-medium">{directive.directive}</code>
                            <code className="text-sm text-muted-foreground">{directive.value}</code>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {directive.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Generert CSP Header</CardTitle>
                    <CardDescription>
                      Kopier denne headeren for bruk i din webserver
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 bg-muted rounded-lg">
                      <code className="text-xs break-all">{generateCSPHeader()}</code>
                    </div>
                    <Button
                      className="mt-3"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(generateCSPHeader());
                        toast({
                          title: 'Kopiert',
                          description: 'CSP header kopiert til utklippstavle',
                        });
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Kopier CSP Header
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="events" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Alert className="flex-1">
                    <Activity className="h-4 w-4" />
                    <AlertTitle>Sikkerhetshendelser</AlertTitle>
                    <AlertDescription>
                      Overvåk og analyser sikkerhetshendelser i sanntid
                    </AlertDescription>
                  </Alert>
                  <Button variant="outline" onClick={clearSecurityEvents}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tøm logg
                  </Button>
                </div>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {securityEvents.map(event => (
                      <Card key={event.id}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 ${getSeverityColor(event.severity)}`}>
                              {getEventIcon(event.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium">{event.message}</p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(event.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              {event.url && (
                                <p className="text-xs text-muted-foreground truncate mb-1">
                                  URL: {event.url}
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {event.category}
                                </Badge>
                                <Badge
                                  variant={
                                    event.severity === 'critical' || event.severity === 'error' ? 'destructive' :
                                    event.severity === 'warning' ? 'default' :
                                    'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {event.severity}
                                </Badge>
                              </div>
                              {event.details && (
                                <Accordion type="single" collapsible className="mt-2">
                                  <AccordionItem value="details" className="border-none">
                                    <AccordionTrigger className="py-1 text-xs">
                                      Vis detaljer
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <pre className="text-xs bg-muted p-2 rounded">
                                        {JSON.stringify(event.details, null, 2)}
                                      </pre>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}