import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Square, 
  Terminal, 
  Shield, 
  Cpu, 
  HardDrive,
  Network,
  Clock,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Layers,
  Box,
  Activity,
  Zap
} from 'lucide-react';

interface ResourceLimits {
  cpuMs: number;
  memoryMb: number;
  diskIoMb: number;
  networkMb: number;
  timeoutSec: number;
}

interface SandboxConfig {
  type: 'wasi' | 'local' | 'wsl2' | 'cloud';
  capabilities: string[];
  resourceLimits: ResourceLimits;
  networkPolicy: {
    allowedDomains: string[];
    blockList: string[];
  };
  isolation: 'strict' | 'moderate' | 'relaxed';
}

interface RuntimeProcess {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  startTime: Date;
  cpuUsage: number;
  memoryUsage: number;
  logs: string[];
}

export function SandboxRuntime() {
  const [activeRuntime, setActiveRuntime] = useState<'windows' | 'wasi' | 'cloud'>('windows');
  const [processes, setProcesses] = useState<RuntimeProcess[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [sandboxConfig, setSandboxConfig] = useState<SandboxConfig>({
    type: 'local',
    capabilities: ['fs.read', 'fs.write', 'network.fetch', 'process.spawn'],
    resourceLimits: {
      cpuMs: 60000,
      memoryMb: 256,
      diskIoMb: 100,
      networkMb: 50,
      timeoutSec: 300
    },
    networkPolicy: {
      allowedDomains: ['api.github.com', 'registry.npmjs.org', 'pypi.org'],
      blockList: []
    },
    isolation: 'strict'
  });

  const runtimeTypes = {
    windows: {
      name: 'Windows Sandbox',
      description: 'LocalSandbox.Win med job objects og low integrity',
      icon: <Box className="h-4 w-4" />,
      features: ['Full Node.js', 'Python 3.11', 'Git', 'NPM/Yarn'],
      limitations: ['Windows only', 'Requires admin for full isolation']
    },
    wasi: {
      name: 'WASI Sandbox',
      description: 'WebAssembly System Interface for sikker kjøring',
      icon: <Shield className="h-4 w-4" />,
      features: ['Cross-platform', 'Capability-based security', 'Resource isolation'],
      limitations: ['Limited syscalls', 'WASM performance overhead']
    },
    cloud: {
      name: 'Cloud Burst',
      description: 'Kjør tunge jobber i sky-sandboxes',
      icon: <Zap className="h-4 w-4" />,
      features: ['Unlimited resources', 'GPU support', 'Distributed execution'],
      limitations: ['Network latency', 'Costs per minute']
    }
  };

  const executeInSandbox = () => {
    setIsRunning(true);
    const newProcess: RuntimeProcess = {
      id: `proc-${Date.now()}`,
      name: 'npm install && npm run dev',
      status: 'running',
      startTime: new Date(),
      cpuUsage: 0,
      memoryUsage: 0,
      logs: ['Starting sandbox environment...', 'Installing dependencies...']
    };
    setProcesses([newProcess, ...processes]);

    // Simulate process execution
    setTimeout(() => {
      setProcesses(prev => prev.map(p => 
        p.id === newProcess.id 
          ? { ...p, status: 'completed', logs: [...p.logs, 'Build successful!'] }
          : p
      ));
      setIsRunning(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-500" />
            Sandbox Runtime
          </h2>
          <p className="text-muted-foreground mt-1">
            Sikker kjøring av kode med ressurskontroll og isolasjon
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Lock className="h-4 w-4 mr-2" />
            Security Policy
          </Button>
          <Button 
            onClick={executeInSandbox} 
            disabled={isRunning}
            className="bg-gradient-to-r from-blue-500 to-purple-500"
          >
            <Play className="h-4 w-4 mr-2" />
            Execute in Sandbox
          </Button>
        </div>
      </div>

      {/* Runtime Selection */}
      <Tabs value={activeRuntime} onValueChange={(v) => setActiveRuntime(v as any)}>
        <TabsList className="grid grid-cols-3 w-full">
          {Object.entries(runtimeTypes).map(([key, runtime]) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-2">
              {runtime.icon}
              {runtime.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(runtimeTypes).map(([key, runtime]) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {runtime.icon}
                  {runtime.name}
                </CardTitle>
                <CardDescription>{runtime.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Features
                    </h4>
                    <ul className="space-y-1">
                      {runtime.features.map((feature, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          • {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Limitations
                    </h4>
                    <ul className="space-y-1">
                      {runtime.limitations.map((limit, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          • {limit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Resource Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Resource Limits & Policies
          </CardTitle>
          <CardDescription>
            Konfigurasjon for sandbox ressursgrenser og sikkerhetspolicyer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Resource Limits */}
            <div className="space-y-3">
              <h4 className="font-semibold">Resource Quotas</h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    CPU Time
                  </span>
                  <Badge variant="secondary">{sandboxConfig.resourceLimits.cpuMs}ms</Badge>
                </div>
                <Progress value={35} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Memory
                  </span>
                  <Badge variant="secondary">{sandboxConfig.resourceLimits.memoryMb}MB</Badge>
                </div>
                <Progress value={60} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    Network I/O
                  </span>
                  <Badge variant="secondary">{sandboxConfig.resourceLimits.networkMb}MB</Badge>
                </div>
                <Progress value={20} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timeout
                  </span>
                  <Badge variant="secondary">{sandboxConfig.resourceLimits.timeoutSec}s</Badge>
                </div>
              </div>
            </div>

            {/* Capabilities */}
            <div className="space-y-3">
              <h4 className="font-semibold">Capabilities</h4>
              <div className="space-y-2">
                {sandboxConfig.capabilities.map((cap, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-mono">{cap}</span>
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Granted
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="pt-3">
                <h4 className="font-semibold mb-2">Network Policy</h4>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs font-mono mb-2">Allowed Domains:</p>
                  <div className="flex flex-wrap gap-1">
                    {sandboxConfig.networkPolicy.allowedDomains.map((domain, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {domain}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Monitor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Process Monitor
          </CardTitle>
          <CardDescription>
            Aktive prosesser i sandbox miljøet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Ingen aktive prosesser
            </div>
          ) : (
            <div className="space-y-3">
              {processes.map((process) => (
                <div key={process.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Terminal className="h-4 w-4" />
                      <span className="font-mono text-sm">{process.name}</span>
                    </div>
                    <Badge
                      variant={
                        process.status === 'running' ? 'default' :
                        process.status === 'completed' ? 'secondary' :
                        process.status === 'failed' ? 'destructive' : 'outline'
                      }
                    >
                      {process.status}
                    </Badge>
                  </div>
                  
                  {/* Process Logs */}
                  <div className="bg-secondary/30 rounded p-2 mt-2">
                    <div className="text-xs font-mono space-y-1">
                      {process.logs.map((log, i) => (
                        <div key={i} className="text-muted-foreground">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Alert */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Sandbox Security:</strong> All kode kjøres i isolert miljø med strenge ressursgrenser.
          Ingen direkte tilgang til host-systemet eller sensitiv data.
        </AlertDescription>
      </Alert>
    </div>
  );
}