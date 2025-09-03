import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cpu,
  Zap,
  Monitor,
  Layers,
  Activity,
  Gauge,
  Image,
  Type,
  Brush,
  Box,
  Grid,
  Move,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  RotateCw,
  Settings,
  Sliders,
  Palette,
  FileImage,
  Film,
  Square,
  Circle,
  Triangle,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface RenderLayer {
  id: string;
  name: string;
  type: 'paint' | 'composite' | 'layout' | 'style';
  visible: boolean;
  gpu: boolean;
  size: number;
  paintCount: number;
  compositeCount: number;
  children: RenderLayer[];
}

interface FrameMetrics {
  fps: number;
  frameTime: number;
  jank: number;
  dropped: number;
  vsync: boolean;
  targetFps: number;
}

interface GPUMetrics {
  enabled: boolean;
  memory: number;
  utilization: number;
  temperature: number;
  vendor: string;
  renderer: string;
  webgl: boolean;
  webgl2: boolean;
  webgpu: boolean;
}

interface CSSMetrics {
  rules: number;
  selectors: number;
  declarations: number;
  mediaQueries: number;
  animations: number;
  transitions: number;
  customProperties: number;
  parseTime: number;
}

interface LayoutMetrics {
  reflows: number;
  repaints: number;
  composites: number;
  layoutTime: number;
  paintTime: number;
  compositeTime: number;
}

interface FontMetrics {
  loaded: number;
  pending: number;
  failed: number;
  families: string[];
  size: number;
}

interface ImageMetrics {
  loaded: number;
  pending: number;
  failed: number;
  decoded: number;
  cached: number;
  totalSize: number;
  formats: Record<string, number>;
}

interface RenderingEngineProps {
  isOpen: boolean;
  onClose: () => void;
  tabId?: string;
  url?: string;
}

export function RenderingEngine({ isOpen, onClose, tabId, url }: RenderingEngineProps) {
  const { toast } = useToast();
  const animationFrameRef = useRef<number>();
  
  const [activeTab, setActiveTab] = useState('gpu');
  const [layers, setLayers] = useState<RenderLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<RenderLayer | null>(null);
  
  // GPU Settings
  const [gpuEnabled, setGpuEnabled] = useState(true);
  const [webglEnabled, setWebglEnabled] = useState(true);
  const [webgpuEnabled, setWebgpuEnabled] = useState(false);
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);
  const [gpuRasterization, setGpuRasterization] = useState(true);
  
  // Rendering Settings
  const [antialiasing, setAntialiasing] = useState(true);
  const [vsyncEnabled, setVsyncEnabled] = useState(true);
  const [targetFps, setTargetFps] = useState([60]);
  const [qualityLevel, setQualityLevel] = useState('high');
  const [textRendering, setTextRendering] = useState('optimizeLegibility');
  const [imageRendering, setImageRendering] = useState('auto');
  
  // Performance Settings
  const [lazyLoading, setLazyLoading] = useState(true);
  const [imageDecoding, setImageDecoding] = useState('async');
  const [fontDisplay, setFontDisplay] = useState('swap');
  const [willChange, setWillChange] = useState(true);
  const [contentVisibility, setContentVisibility] = useState(true);
  
  // Metrics
  const [frameMetrics, setFrameMetrics] = useState<FrameMetrics>({
    fps: 60,
    frameTime: 16.67,
    jank: 0,
    dropped: 0,
    vsync: true,
    targetFps: 60
  });
  
  const [gpuMetrics, setGpuMetrics] = useState<GPUMetrics>({
    enabled: true,
    memory: 512,
    utilization: 45,
    temperature: 65,
    vendor: 'NVIDIA',
    renderer: 'GeForce RTX 3080',
    webgl: true,
    webgl2: true,
    webgpu: false
  });
  
  const [cssMetrics, setCssMetrics] = useState<CSSMetrics>({
    rules: 1234,
    selectors: 5678,
    declarations: 9012,
    mediaQueries: 12,
    animations: 8,
    transitions: 24,
    customProperties: 156,
    parseTime: 23.5
  });
  
  const [layoutMetrics, setLayoutMetrics] = useState<LayoutMetrics>({
    reflows: 5,
    repaints: 12,
    composites: 18,
    layoutTime: 8.3,
    paintTime: 12.7,
    compositeTime: 3.2
  });
  
  const [fontMetrics, setFontMetrics] = useState<FontMetrics>({
    loaded: 5,
    pending: 0,
    failed: 0,
    families: ['Inter', 'Roboto', 'Arial', 'Helvetica', 'sans-serif'],
    size: 256
  });
  
  const [imageMetrics, setImageMetrics] = useState<ImageMetrics>({
    loaded: 24,
    pending: 2,
    failed: 0,
    decoded: 22,
    cached: 18,
    totalSize: 8.5,
    formats: {
      jpg: 12,
      png: 8,
      webp: 4,
      svg: 2
    }
  });

  // Monitor frame rate
  useEffect(() => {
    if (!isOpen) return;
    
    let lastTime = performance.now();
    let frames = 0;
    let fps = 60;
    let jank = 0;
    let dropped = 0;
    
    const measureFrame = (currentTime: DOMHighResTimeStamp) => {
      frames++;
      
      const deltaTime = currentTime - lastTime;
      
      // Calculate FPS every second
      if (deltaTime >= 1000) {
        fps = Math.round((frames * 1000) / deltaTime);
        const frameTime = deltaTime / frames;
        
        // Detect jank (frames over 50ms)
        if (frameTime > 50) {
          jank++;
        }
        
        // Detect dropped frames
        if (fps < targetFps[0] * 0.95) {
          dropped += Math.round(targetFps[0] - fps);
        }
        
        setFrameMetrics({
          fps,
          frameTime: Math.round(frameTime * 100) / 100,
          jank,
          dropped,
          vsync: vsyncEnabled,
          targetFps: targetFps[0]
        });
        
        frames = 0;
        lastTime = currentTime;
      }
      
      animationFrameRef.current = requestAnimationFrame(measureFrame);
    };
    
    animationFrameRef.current = requestAnimationFrame(measureFrame);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, targetFps, vsyncEnabled]);

  // Initialize render layers
  useEffect(() => {
    if (!isOpen) return;
    
    // Sample render layer tree
    const sampleLayers: RenderLayer[] = [
      {
        id: 'root',
        name: 'Document Root',
        type: 'composite',
        visible: true,
        gpu: true,
        size: 1920 * 1080 * 4,
        paintCount: 1,
        compositeCount: 60,
        children: [
          {
            id: 'header',
            name: 'Header',
            type: 'paint',
            visible: true,
            gpu: false,
            size: 1920 * 100 * 4,
            paintCount: 2,
            compositeCount: 10,
            children: []
          },
          {
            id: 'content',
            name: 'Main Content',
            type: 'layout',
            visible: true,
            gpu: true,
            size: 1920 * 800 * 4,
            paintCount: 5,
            compositeCount: 30,
            children: [
              {
                id: 'video',
                name: 'Video Player',
                type: 'composite',
                visible: true,
                gpu: true,
                size: 1280 * 720 * 4,
                paintCount: 0,
                compositeCount: 60,
                children: []
              },
              {
                id: 'sidebar',
                name: 'Sidebar',
                type: 'paint',
                visible: true,
                gpu: false,
                size: 300 * 800 * 4,
                paintCount: 3,
                compositeCount: 15,
                children: []
              }
            ]
          },
          {
            id: 'footer',
            name: 'Footer',
            type: 'style',
            visible: true,
            gpu: false,
            size: 1920 * 180 * 4,
            paintCount: 1,
            compositeCount: 5,
            children: []
          }
        ]
      }
    ];
    
    setLayers(sampleLayers);
  }, [isOpen]);

  // Monitor GPU metrics
  useEffect(() => {
    if (!isOpen || !gpuEnabled) return;
    
    const updateGPUMetrics = () => {
      // Check WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          
          setGpuMetrics(prev => ({
            ...prev,
            vendor: vendor || 'Unknown',
            renderer: renderer || 'Unknown'
          }));
        }
      }
      
      // Simulate GPU metrics
      setGpuMetrics(prev => ({
        ...prev,
        memory: Math.round(300 + Math.random() * 400),
        utilization: Math.round(30 + Math.random() * 40),
        temperature: Math.round(60 + Math.random() * 15)
      }));
    };
    
    updateGPUMetrics();
    const interval = setInterval(updateGPUMetrics, 2000);
    
    return () => clearInterval(interval);
  }, [isOpen, gpuEnabled]);

  // Monitor layout metrics
  useEffect(() => {
    if (!isOpen) return;
    
    let reflows = 0;
    let repaints = 0;
    
    // Create a ResizeObserver to detect layout changes
    const resizeObserver = new ResizeObserver(() => {
      reflows++;
      setLayoutMetrics(prev => ({
        ...prev,
        reflows: prev.reflows + 1
      }));
    });
    
    // Observe body element
    if (document.body) {
      resizeObserver.observe(document.body);
    }
    
    // Monitor paint events (simulated)
    const paintInterval = setInterval(() => {
      repaints = Math.round(Math.random() * 5);
      setLayoutMetrics(prev => ({
        ...prev,
        repaints: prev.repaints + repaints,
        composites: prev.composites + Math.round(repaints * 1.5),
        layoutTime: Math.random() * 15,
        paintTime: Math.random() * 20,
        compositeTime: Math.random() * 5
      }));
    }, 1000);
    
    return () => {
      resizeObserver.disconnect();
      clearInterval(paintInterval);
    };
  }, [isOpen]);

  const toggleGPU = () => {
    setGpuEnabled(!gpuEnabled);
    
    toast({
      title: gpuEnabled ? 'GPU deaktivert' : 'GPU aktivert',
      description: gpuEnabled ? 
        'Hardware akselerasjon er slått av' : 
        'Hardware akselerasjon er aktivert',
    });
  };

  const resetMetrics = () => {
    setLayoutMetrics({
      reflows: 0,
      repaints: 0,
      composites: 0,
      layoutTime: 0,
      paintTime: 0,
      compositeTime: 0
    });
    
    setFrameMetrics(prev => ({
      ...prev,
      jank: 0,
      dropped: 0
    }));
    
    toast({
      title: 'Metrikker tilbakestilt',
      description: 'Alle ytelses-metrikker er nullstilt',
    });
  };

  const forceRepaint = () => {
    // Force a repaint
    document.body.style.display = 'none';
    document.body.offsetHeight; // Trigger reflow
    document.body.style.display = '';
    
    setLayoutMetrics(prev => ({
      ...prev,
      repaints: prev.repaints + 1,
      reflows: prev.reflows + 1
    }));
    
    toast({
      title: 'Tvungen repaint',
      description: 'Hele siden er tegnet på nytt',
    });
  };

  const captureRenderingSnapshot = () => {
    const snapshot = {
      timestamp: Date.now(),
      frame: frameMetrics,
      gpu: gpuMetrics,
      css: cssMetrics,
      layout: layoutMetrics,
      fonts: fontMetrics,
      images: imageMetrics,
      settings: {
        gpu: gpuEnabled,
        webgl: webglEnabled,
        vsync: vsyncEnabled,
        targetFps: targetFps[0],
        quality: qualityLevel
      }
    };
    
    console.log('Rendering Snapshot:', snapshot);
    
    toast({
      title: 'Snapshot tatt',
      description: 'Rendering snapshot lagret i konsollen',
    });
  };

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'composite': return <Layers className="w-4 h-4" />;
      case 'paint': return <Brush className="w-4 h-4" />;
      case 'layout': return <Grid className="w-4 h-4" />;
      case 'style': return <Palette className="w-4 h-4" />;
      default: return <Box className="w-4 h-4" />;
    }
  };

  const renderLayerTree = (layer: RenderLayer, depth = 0): React.ReactNode => {
    return (
      <div key={layer.id} style={{ marginLeft: depth * 20 }}>
        <div
          className={`flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer ${
            selectedLayer?.id === layer.id ? 'bg-muted' : ''
          }`}
          onClick={() => setSelectedLayer(layer)}
        >
          {getLayerIcon(layer.type)}
          <span className="text-sm font-medium">{layer.name}</span>
          {layer.gpu && <Badge variant="outline" className="text-xs">GPU</Badge>}
          {!layer.visible && <EyeOff className="w-3 h-3 text-muted-foreground" />}
        </div>
        {layer.children.length > 0 && (
          <div>
            {layer.children.map(child => renderLayerTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Rendering Motor
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className={`w-4 h-4 ${getFPSColor(frameMetrics.fps)}`} />
                <span className={`text-lg font-bold ${getFPSColor(frameMetrics.fps)}`}>
                  {frameMetrics.fps} FPS
                </span>
              </div>
              <Badge variant={gpuEnabled ? 'default' : 'secondary'}>
                GPU {gpuEnabled ? 'På' : 'Av'}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Administrer GPU akselerasjon, rendering ytelse og visuell kvalitet
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="gpu">GPU</TabsTrigger>
              <TabsTrigger value="layers">Lag</TabsTrigger>
              <TabsTrigger value="css">CSS</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="metrics">Metrikker</TabsTrigger>
            </TabsList>

            <TabsContent value="gpu" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">GPU Akselerasjon</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={toggleGPU}>
                      <Zap className="w-4 h-4 mr-1" />
                      {gpuEnabled ? 'Deaktiver' : 'Aktiver'} GPU
                    </Button>
                    <Button size="sm" variant="outline" onClick={captureRenderingSnapshot}>
                      <Camera className="w-4 h-4 mr-1" />
                      Snapshot
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">GPU Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Leverandør</span>
                        <span className="font-mono">{gpuMetrics.vendor}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Renderer</span>
                        <span className="font-mono text-xs">{gpuMetrics.renderer}</span>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Minne</span>
                          <span>{gpuMetrics.memory} MB</span>
                        </div>
                        <Progress value={gpuMetrics.memory / 8192 * 100} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Utnyttelse</span>
                          <span>{gpuMetrics.utilization}%</span>
                        </div>
                        <Progress value={gpuMetrics.utilization} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Temperatur</span>
                          <span>{gpuMetrics.temperature}°C</span>
                        </div>
                        <Progress 
                          value={gpuMetrics.temperature / 100 * 100} 
                          className={gpuMetrics.temperature > 80 ? 'bg-red-100' : ''}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">API Støtte</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="webgl" className="text-sm">WebGL</Label>
                        <Switch
                          id="webgl"
                          checked={webglEnabled}
                          onCheckedChange={setWebglEnabled}
                          disabled={!gpuEnabled}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="webgl2" className="text-sm">WebGL 2.0</Label>
                        <Switch
                          id="webgl2"
                          checked={webglEnabled}
                          onCheckedChange={setWebglEnabled}
                          disabled={!gpuEnabled}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="webgpu" className="text-sm">WebGPU</Label>
                        <Switch
                          id="webgpu"
                          checked={webgpuEnabled}
                          onCheckedChange={setWebgpuEnabled}
                          disabled={!gpuEnabled}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <Label htmlFor="hw-accel" className="text-sm">Hardware Akselerasjon</Label>
                        <Switch
                          id="hw-accel"
                          checked={hardwareAcceleration}
                          onCheckedChange={setHardwareAcceleration}
                          disabled={!gpuEnabled}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="gpu-raster" className="text-sm">GPU Rasterisering</Label>
                        <Switch
                          id="gpu-raster"
                          checked={gpuRasterization}
                          onCheckedChange={setGpuRasterization}
                          disabled={!gpuEnabled}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertTitle>Rendering Innstillinger</AlertTitle>
                  <AlertDescription>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Kvalitetsnivå</Label>
                          <Select value={qualityLevel} onValueChange={setQualityLevel}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Lav</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">Høy</SelectItem>
                              <SelectItem value="ultra">Ultra</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="aa" className="text-sm">Antialiasing</Label>
                          <Switch
                            id="aa"
                            checked={antialiasing}
                            onCheckedChange={setAntialiasing}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="vsync" className="text-sm">V-Sync</Label>
                          <Switch
                            id="vsync"
                            checked={vsyncEnabled}
                            onCheckedChange={setVsyncEnabled}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Mål FPS: {targetFps[0]}</Label>
                          <Slider
                            value={targetFps}
                            onValueChange={setTargetFps}
                            min={30}
                            max={144}
                            step={1}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm">Tekst Rendering</Label>
                          <Select value={textRendering} onValueChange={setTextRendering}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto</SelectItem>
                              <SelectItem value="optimizeSpeed">Hastighet</SelectItem>
                              <SelectItem value="optimizeLegibility">Lesbarhet</SelectItem>
                              <SelectItem value="geometricPrecision">Presisjon</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm">Bilde Rendering</Label>
                          <Select value={imageRendering} onValueChange={setImageRendering}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto</SelectItem>
                              <SelectItem value="crisp-edges">Skarpe kanter</SelectItem>
                              <SelectItem value="pixelated">Pikselert</SelectItem>
                              <SelectItem value="smooth">Jevn</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="layers" className="flex-1 overflow-hidden flex">
              <div className="w-1/2 border-r pr-4 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Render Lag</h3>
                  <Button size="sm" variant="outline" onClick={forceRepaint}>
                    <RotateCw className="w-4 h-4 mr-1" />
                    Repaint
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  {layers.map(layer => renderLayerTree(layer))}
                </ScrollArea>
              </div>
              
              <div className="w-1/2 pl-4">
                {selectedLayer ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        {getLayerIcon(selectedLayer.type)}
                        {selectedLayer.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <Badge variant="outline" className="ml-2">{selectedLayer.type}</Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">GPU:</span>
                          <Badge variant={selectedLayer.gpu ? 'default' : 'secondary'} className="ml-2">
                            {selectedLayer.gpu ? 'Ja' : 'Nei'}
                          </Badge>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Størrelse</span>
                          <span>{(selectedLayer.size / 1048576).toFixed(2)} MB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Paint Count</span>
                          <span>{selectedLayer.paintCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Composite Count</span>
                          <span>{selectedLayer.compositeCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Barn lag</span>
                          <span>{selectedLayer.children.length}</span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Button className="w-full" size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          {selectedLayer.visible ? 'Skjul' : 'Vis'} Lag
                        </Button>
                        <Button className="w-full" size="sm" variant="outline">
                          <Zap className="w-4 h-4 mr-2" />
                          {selectedLayer.gpu ? 'Deaktiver' : 'Aktiver'} GPU
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Ingen lag valgt</AlertTitle>
                    <AlertDescription>
                      Velg et render lag fra treet for å se detaljer
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="css" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>CSS Metrikker</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{cssMetrics.rules}</div>
                        <div className="text-xs text-muted-foreground">CSS Regler</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{cssMetrics.selectors}</div>
                        <div className="text-xs text-muted-foreground">Selektorer</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{cssMetrics.declarations}</div>
                        <div className="text-xs text-muted-foreground">Deklarasjoner</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{cssMetrics.parseTime.toFixed(1)}ms</div>
                        <div className="text-xs text-muted-foreground">Parse tid</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Film className="w-4 h-4" />
                        Animasjoner
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{cssMetrics.animations}</div>
                      <Progress value={cssMetrics.animations * 10} className="mt-2" />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Move className="w-4 h-4" />
                        Transisjoner
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{cssMetrics.transitions}</div>
                      <Progress value={cssMetrics.transitions * 4} className="mt-2" />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sliders className="w-4 h-4" />
                        Custom Properties
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{cssMetrics.customProperties}</div>
                      <Progress value={cssMetrics.customProperties / 2} className="mt-2" />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="layout" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Layout Ytelse</h3>
                  <Button size="sm" variant="outline" onClick={resetMetrics}>
                    <RotateCw className="w-4 h-4 mr-1" />
                    Nullstill
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Reflows</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-yellow-500">
                        {layoutMetrics.reflows}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Layout recalculations
                      </p>
                      <div className="mt-2 text-xs">
                        Tid: {layoutMetrics.layoutTime.toFixed(2)}ms
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Repaints</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-500">
                        {layoutMetrics.repaints}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Paint invalidations
                      </p>
                      <div className="mt-2 text-xs">
                        Tid: {layoutMetrics.paintTime.toFixed(2)}ms
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Composites</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-500">
                        {layoutMetrics.composites}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Layer compositing
                      </p>
                      <div className="mt-2 text-xs">
                        Tid: {layoutMetrics.compositeTime.toFixed(2)}ms
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Ytelsestips</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 space-y-1 text-xs">
                      <li>• Unngå layout thrashing ved å batch DOM endringer</li>
                      <li>• Bruk transform og opacity for animasjoner</li>
                      <li>• Aktiver will-change for elementer som skal animeres</li>
                      <li>• Bruk CSS containment for isolerte komponenter</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Optimalisering</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="lazy" className="text-sm">Lazy Loading</Label>
                      <Switch
                        id="lazy"
                        checked={lazyLoading}
                        onCheckedChange={setLazyLoading}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="will-change" className="text-sm">Will-change</Label>
                      <Switch
                        id="will-change"
                        checked={willChange}
                        onCheckedChange={setWillChange}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="content-vis" className="text-sm">Content Visibility</Label>
                      <Switch
                        id="content-vis"
                        checked={contentVisibility}
                        onCheckedChange={setContentVisibility}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="media" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Fonter
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Lastet</span>
                          <Badge variant="default">{fontMetrics.loaded}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Venter</span>
                          <Badge variant="secondary">{fontMetrics.pending}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Feilet</span>
                          <Badge variant="destructive">{fontMetrics.failed}</Badge>
                        </div>
                        <Separator />
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Familier:</div>
                          <div className="text-xs text-muted-foreground">
                            {fontMetrics.families.join(', ')}
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total størrelse</span>
                          <span>{fontMetrics.size} KB</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Bilder
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Lastet</span>
                          <Badge variant="default">{imageMetrics.loaded}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Venter</span>
                          <Badge variant="secondary">{imageMetrics.pending}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Dekodet</span>
                          <Badge>{imageMetrics.decoded}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Cachet</span>
                          <Badge variant="outline">{imageMetrics.cached}</Badge>
                        </div>
                        <Separator />
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Formater:</div>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            {Object.entries(imageMetrics.formats).map(([format, count]) => (
                              <div key={format} className="flex justify-between">
                                <span className="text-muted-foreground">{format}:</span>
                                <span>{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total størrelse</span>
                          <span>{imageMetrics.totalSize.toFixed(1)} MB</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <FileImage className="h-4 w-4" />
                  <AlertTitle>Media Optimalisering</AlertTitle>
                  <AlertDescription>
                    <div className="mt-3 space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Bilde dekoding</Label>
                        <Select value={imageDecoding} onValueChange={setImageDecoding}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sync">Synkron</SelectItem>
                            <SelectItem value="async">Asynkron</SelectItem>
                            <SelectItem value="auto">Auto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm">Font Display</Label>
                        <Select value={fontDisplay} onValueChange={setFontDisplay}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto</SelectItem>
                            <SelectItem value="block">Block</SelectItem>
                            <SelectItem value="swap">Swap</SelectItem>
                            <SelectItem value="fallback">Fallback</SelectItem>
                            <SelectItem value="optional">Optional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Frame Metrikker</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4" />
                          <span className="text-sm font-medium">Frame Rate</span>
                        </div>
                        <div className={`text-4xl font-bold ${getFPSColor(frameMetrics.fps)}`}>
                          {frameMetrics.fps} FPS
                        </div>
                        <Progress 
                          value={frameMetrics.fps / targetFps[0] * 100} 
                          className="mt-2"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          Mål: {targetFps[0]} FPS
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">Frame Time</span>
                        </div>
                        <div className="text-4xl font-bold">
                          {frameMetrics.frameTime.toFixed(2)}ms
                        </div>
                        <Progress 
                          value={Math.min(100, (16.67 / frameMetrics.frameTime) * 100)} 
                          className="mt-2"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          Ideelt: 16.67ms (60 FPS)
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xl font-bold text-yellow-500">{frameMetrics.jank}</div>
                        <div className="text-xs text-muted-foreground">Jank frames</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-red-500">{frameMetrics.dropped}</div>
                        <div className="text-xs text-muted-foreground">Dropped frames</div>
                      </div>
                      <div>
                        <Badge variant={frameMetrics.vsync ? 'default' : 'secondary'}>
                          V-Sync {frameMetrics.vsync ? 'På' : 'Av'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: TrendingUp, label: 'Gjennomsnitt FPS', value: '58.2', color: 'text-green-500' },
                    { icon: TrendingDown, label: 'Minimum FPS', value: '45', color: 'text-yellow-500' },
                    { icon: BarChart3, label: 'Stabilitet', value: '92%', color: 'text-blue-500' }
                  ].map((metric, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <metric.icon className={`w-4 h-4 ${metric.color}`} />
                          <span className={`text-2xl font-bold ${metric.color}`}>
                            {metric.value}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {metric.label}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add Camera icon component
function Camera(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

// Add Clock icon
function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}