import { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  Gauge,
  Timer,
  Database,
  Globe,
  FileText,
  Image,
  Code,
  Battery,
  Thermometer,
  MonitorSpeaker,
  Package,
  RefreshCw,
  Play,
  Pause,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface TabMetrics {
  id: string;
  title: string;
  url: string;
  memoryUsage: number;
  cpuUsage: number;
  networkRequests: number;
  jsHeapSize: number;
  domNodes: number;
  loadTime: number;
  fps: number;
  status: 'idle' | 'loading' | 'active';
}

interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  status: number;
  size: number;
  time: number;
  type: string;
  cached: boolean;
}

interface PerformanceMetric {
  timestamp: number;
  cpu: number;
  memory: number;
  network: number;
  fps: number;
  battery?: number;
}

interface ResourceBreakdown {
  type: string;
  count: number;
  size: number;
  percentage: number;
  color: string;
}

interface PerformanceMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab?: {
    id: string;
    title: string;
    url: string;
  };
}

export function PerformanceMonitor({ isOpen, onClose, currentTab }: PerformanceMonitorProps) {
  const { toast } = useToast();
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [updateInterval, setUpdateInterval] = useState('1000');
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('5m');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Metrics data
  const [overallMetrics, setOverallMetrics] = useState({
    cpuUsage: 42,
    memoryUsage: 2456, // MB
    memoryTotal: 8192, // MB
    networkSpeed: 12.5, // Mbps
    activeConnections: 8,
    fps: 60,
    batteryLevel: 85,
    temperature: 45, // Celsius
    cacheSize: 256, // MB
    storageUsed: 1024 // MB
  });

  const [tabMetrics, setTabMetrics] = useState<TabMetrics[]>([
    {
      id: '1',
      title: 'YouTube - Video',
      url: 'youtube.com',
      memoryUsage: 512,
      cpuUsage: 25,
      networkRequests: 42,
      jsHeapSize: 128,
      domNodes: 1250,
      loadTime: 1.2,
      fps: 60,
      status: 'active'
    },
    {
      id: '2',
      title: 'Gmail - Innboks',
      url: 'gmail.com',
      memoryUsage: 256,
      cpuUsage: 8,
      networkRequests: 18,
      jsHeapSize: 64,
      domNodes: 850,
      loadTime: 0.8,
      fps: 60,
      status: 'idle'
    },
    {
      id: '3',
      title: 'GitHub - Prosjekt',
      url: 'github.com',
      memoryUsage: 384,
      cpuUsage: 12,
      networkRequests: 28,
      jsHeapSize: 96,
      domNodes: 2100,
      loadTime: 1.5,
      fps: 60,
      status: 'idle'
    }
  ]);

  const [performanceHistory, setPerformanceHistory] = useState<PerformanceMetric[]>([
    { timestamp: Date.now() - 300000, cpu: 38, memory: 2200, network: 10.2, fps: 60, battery: 90 },
    { timestamp: Date.now() - 240000, cpu: 42, memory: 2300, network: 12.5, fps: 60, battery: 89 },
    { timestamp: Date.now() - 180000, cpu: 35, memory: 2250, network: 8.8, fps: 59, battery: 88 },
    { timestamp: Date.now() - 120000, cpu: 48, memory: 2400, network: 15.3, fps: 58, battery: 87 },
    { timestamp: Date.now() - 60000, cpu: 40, memory: 2350, network: 11.2, fps: 60, battery: 86 },
    { timestamp: Date.now(), cpu: 42, memory: 2456, network: 12.5, fps: 60, battery: 85 }
  ]);

  const [networkRequests, setNetworkRequests] = useState<NetworkRequest[]>([
    {
      id: '1',
      url: 'api.youtube.com/watch',
      method: 'GET',
      status: 200,
      size: 1024,
      time: 125,
      type: 'xhr',
      cached: false
    },
    {
      id: '2',
      url: 'fonts.googleapis.com/css',
      method: 'GET',
      status: 304,
      size: 0,
      time: 15,
      type: 'stylesheet',
      cached: true
    },
    {
      id: '3',
      url: 'cdn.jsdelivr.net/npm/react',
      method: 'GET',
      status: 200,
      size: 128000,
      time: 45,
      type: 'script',
      cached: false
    }
  ]);

  const [resourceBreakdown] = useState<ResourceBreakdown[]>([
    { type: 'JavaScript', count: 24, size: 2.4, percentage: 35, color: '#f7df1e' },
    { type: 'Bilder', count: 48, size: 4.8, percentage: 30, color: '#4CAF50' },
    { type: 'CSS', count: 12, size: 0.8, percentage: 15, color: '#264de4' },
    { type: 'Fonter', count: 6, size: 0.4, percentage: 10, color: '#FF6B6B' },
    { type: 'Annet', count: 15, size: 0.6, percentage: 10, color: '#9E9E9E' }
  ]);

  // Simuler sanntidsoppdateringer
  useEffect(() => {
    if (!isOpen || !isMonitoring) return;

    const interval = setInterval(() => {
      // Oppdater overall metrics
      setOverallMetrics(prev => ({
        ...prev,
        cpuUsage: Math.max(0, Math.min(100, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(1024, Math.min(prev.memoryTotal * 0.9, prev.memoryUsage + (Math.random() - 0.5) * 100)),
        networkSpeed: Math.max(0, prev.networkSpeed + (Math.random() - 0.5) * 2),
        fps: Math.max(30, Math.min(60, Math.round(prev.fps + (Math.random() - 0.5) * 5))),
        batteryLevel: Math.max(0, Math.min(100, prev.batteryLevel - 0.1))
      }));

      // Oppdater historie
      setPerformanceHistory(prev => {
        const newMetric = {
          timestamp: Date.now(),
          cpu: overallMetrics.cpuUsage,
          memory: overallMetrics.memoryUsage,
          network: overallMetrics.networkSpeed,
          fps: overallMetrics.fps,
          battery: overallMetrics.batteryLevel
        };
        return [...prev.slice(-59), newMetric];
      });
    }, parseInt(updateInterval));

    return () => clearInterval(interval);
  }, [isOpen, isMonitoring, updateInterval, overallMetrics]);

  const handleStartMonitoring = () => {
    setIsMonitoring(true);
    toast({
      title: 'Overvåking startet',
      description: 'Ytelsesovervåking er aktivert',
    });
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
    toast({
      title: 'Overvåking stoppet',
      description: 'Ytelsesovervåking er deaktivert',
    });
  };

  const handleOptimizeTab = (tab: TabMetrics) => {
    toast({
      title: 'Optimaliserer fane',
      description: `Frigjør ressurser for ${tab.title}...`,
    });
    
    setTabMetrics(prev => prev.map(t => 
      t.id === tab.id 
        ? { ...t, memoryUsage: t.memoryUsage * 0.7, cpuUsage: t.cpuUsage * 0.5 }
        : t
    ));
  };

  const handleClearCache = () => {
    toast({
      title: 'Cache tømt',
      description: '256 MB frigjort',
    });
    setOverallMetrics(prev => ({ ...prev, cacheSize: 0 }));
  };

  const getPerformanceScore = () => {
    const cpuScore = (100 - overallMetrics.cpuUsage) / 100;
    const memoryScore = 1 - (overallMetrics.memoryUsage / overallMetrics.memoryTotal);
    const fpsScore = overallMetrics.fps / 60;
    return Math.round((cpuScore + memoryScore + fpsScore) / 3 * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'loading':
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Ytelsesovervåking
          </DialogTitle>
          <DialogDescription>
            Overvåk og optimaliser nettleserens ytelse i sanntid
          </DialogDescription>
        </DialogHeader>

        {/* Hovedmetrikker */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Ytelsesscore</span>
              </div>
              <span className={`text-2xl font-bold ${getScoreColor(getPerformanceScore())}`}>
                {getPerformanceScore()}
              </span>
            </div>
            <Progress value={getPerformanceScore()} className="h-2" />
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">CPU</span>
              </div>
              <span className="text-lg font-semibold">{overallMetrics.cpuUsage.toFixed(1)}%</span>
            </div>
            <Progress value={overallMetrics.cpuUsage} className="h-2" />
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Minne</span>
              </div>
              <span className="text-lg font-semibold">
                {(overallMetrics.memoryUsage / 1024).toFixed(1)} GB
              </span>
            </div>
            <Progress value={(overallMetrics.memoryUsage / overallMetrics.memoryTotal) * 100} className="h-2" />
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Nettverk</span>
              </div>
              <span className="text-lg font-semibold">{overallMetrics.networkSpeed.toFixed(1)} Mbps</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{overallMetrics.activeConnections} aktive</span>
            </div>
          </Card>
        </div>

        {/* Kontroller */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            {isMonitoring ? (
              <Button size="sm" variant="destructive" onClick={handleStopMonitoring}>
                <Pause className="w-4 h-4 mr-2" />
                Stopp overvåking
              </Button>
            ) : (
              <Button size="sm" onClick={handleStartMonitoring}>
                <Play className="w-4 h-4 mr-2" />
                Start overvåking
              </Button>
            )}
            
            <Select value={updateInterval} onValueChange={setUpdateInterval}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="500">Oppdater: 0.5s</SelectItem>
                <SelectItem value="1000">Oppdater: 1s</SelectItem>
                <SelectItem value="2000">Oppdater: 2s</SelectItem>
                <SelectItem value="5000">Oppdater: 5s</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Siste 1 min</SelectItem>
                <SelectItem value="5m">Siste 5 min</SelectItem>
                <SelectItem value="15m">Siste 15 min</SelectItem>
                <SelectItem value="1h">Siste time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="advanced"
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
            />
            <Label htmlFor="advanced" className="text-sm">Avansert visning</Label>
          </div>
        </div>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Oversikt
            </TabsTrigger>
            <TabsTrigger value="tabs">
              <Globe className="w-4 h-4 mr-2" />
              Faner
            </TabsTrigger>
            <TabsTrigger value="network">
              <Wifi className="w-4 h-4 mr-2" />
              Nettverk
            </TabsTrigger>
            <TabsTrigger value="resources">
              <Package className="w-4 h-4 mr-2" />
              Ressurser
            </TabsTrigger>
            <TabsTrigger value="system">
              <Cpu className="w-4 h-4 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Ytelsesgrafer */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Ytelseshistorikk</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTime}
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis />
                  <Area type="monotone" dataKey="cpu" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="CPU %" />
                  <Area type="monotone" dataKey="memory" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} name="Minne MB" />
                  <Area type="monotone" dataKey="network" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} name="Nettverk Mbps" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {showAdvanced && (
              <Card className="p-4">
                <h3 className="font-semibold mb-4">FPS og batteribruk</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={performanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatTime}
                      domain={['dataMin', 'dataMax']}
                    />
                    <YAxis />
                    <Line type="monotone" dataKey="fps" stroke="#ff7300" name="FPS" />
                    <Line type="monotone" dataKey="battery" stroke="#00c49f" name="Batteri %" />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tabs" className="space-y-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {tabMetrics.map((tab) => (
                  <Card key={tab.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(tab.status)}
                          <h3 className="font-semibold">{tab.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {tab.url}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 mt-3">
                          <div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <HardDrive className="w-3 h-3" />
                              Minne
                            </div>
                            <p className="font-medium">{tab.memoryUsage} MB</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Cpu className="w-3 h-3" />
                              CPU
                            </div>
                            <p className="font-medium">{tab.cpuUsage}%</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              Lastetid
                            </div>
                            <p className="font-medium">{tab.loadTime}s</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Gauge className="w-3 h-3" />
                              FPS
                            </div>
                            <p className="font-medium">{tab.fps}</p>
                          </div>
                        </div>

                        {showAdvanced && (
                          <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                            <div className="text-xs">
                              <span className="text-muted-foreground">JS Heap:</span>
                              <span className="ml-1 font-medium">{tab.jsHeapSize} MB</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-muted-foreground">DOM noder:</span>
                              <span className="ml-1 font-medium">{tab.domNodes}</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-muted-foreground">Forespørsler:</span>
                              <span className="ml-1 font-medium">{tab.networkRequests}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOptimizeTab(tab)}
                      >
                        <Zap className="w-4 h-4 mr-1" />
                        Optimaliser
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Nettverksaktivitet</h3>
                <Badge variant="secondary">
                  {networkRequests.length} forespørsler
                </Badge>
              </div>
              
              <ScrollArea className="h-[350px]">
                <div className="space-y-2 pr-4">
                  {networkRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-3">
                        <Badge variant={request.cached ? 'secondary' : 'default'} className="text-xs">
                          {request.method}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium truncate max-w-[400px]">
                            {request.url}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className={request.status === 200 ? 'text-green-500' : 'text-yellow-500'}>
                              {request.status}
                            </span>
                            <span>{formatBytes(request.size)}</span>
                            <span>{request.time}ms</span>
                            {request.cached && <Badge variant="outline" className="text-xs">Cache</Badge>}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">{request.type}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Ressursfordeling</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={resourceBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.type} ${entry.percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {resourceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-4">Ressursdetaljer</h3>
                <div className="space-y-3">
                  {resourceBreakdown.map((resource) => (
                    <div key={resource.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ backgroundColor: resource.color }}
                        />
                        <span className="text-sm">{resource.type}</span>
                      </div>
                      <div className="text-sm text-right">
                        <p className="font-medium">{resource.count} filer</p>
                        <p className="text-muted-foreground">{resource.size} MB</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Lagring og cache</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Browser cache</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{overallMetrics.cacheSize} MB</span>
                    <Button size="sm" variant="outline" onClick={handleClearCache}>
                      Tøm
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Lokal lagring</span>
                  </div>
                  <span className="text-sm font-medium">{overallMetrics.storageUsed} MB</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Systemressurser</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">CPU temperatur</span>
                    </div>
                    <span className="text-sm font-medium">{overallMetrics.temperature}°C</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Battery className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Batterinivå</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={overallMetrics.batteryLevel} className="w-20 h-2" />
                      <span className="text-sm font-medium">{overallMetrics.batteryLevel}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MonitorSpeaker className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">GPU bruk</span>
                    </div>
                    <span className="text-sm font-medium">24%</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-4">Optimaliseringstips</h3>
                <div className="space-y-2">
                  {overallMetrics.cpuUsage > 70 && (
                    <div className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                      <span>Høy CPU-bruk detektert. Vurder å lukke unødvendige faner.</span>
                    </div>
                  )}
                  {(overallMetrics.memoryUsage / overallMetrics.memoryTotal) > 0.8 && (
                    <div className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                      <span>Lite ledig minne. Tøm cache eller restart nettleseren.</span>
                    </div>
                  )}
                  {tabMetrics.length > 20 && (
                    <div className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                      <span>Mange åpne faner. Bruk fanegrupper for bedre organisering.</span>
                    </div>
                  )}
                  {overallMetrics.cpuUsage < 70 && (overallMetrics.memoryUsage / overallMetrics.memoryTotal) < 0.8 && (
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Systemet kjører optimalt!</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Hurtighandlinger</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  toast({ title: 'Minneoptimalisering', description: 'Frigjør ubrukt minne...' });
                }}>
                  <HardDrive className="w-4 h-4 mr-2" />
                  Frigjør minne
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  toast({ title: 'Nettverksoptimalisering', description: 'Optimaliserer tilkoblinger...' });
                }}>
                  <Wifi className="w-4 h-4 mr-2" />
                  Optimaliser nettverk
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  toast({ title: 'GPU-akselerasjon', description: 'Aktiverer maskinvareakselerasjon...' });
                }}>
                  <MonitorSpeaker className="w-4 h-4 mr-2" />
                  GPU-akselerasjon
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Eksporter rapport
          </Button>
          <Button variant="outline" onClick={onClose}>
            Lukk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}