import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Sparkles,
  Settings,
  Shield,
  Code2,
  Package,
  Lock,
  Zap,
  Cloud,
  Database,
  Globe,
  Users,
  AlertCircle,
  CheckCircle,
  Palette,
  Brain,
  Target,
  Layers,
  Save,
  Upload,
  Download,
  Copy,
  Share2,
  ChevronRight,
  Wand2,
  FileCode,
  Rocket,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Info,
  HelpCircle,
  TrendingUp,
  Trophy,
  Award,
  GitBranch,
  Terminal,
  Cpu,
  Server,
  Smartphone,
  Monitor,
  CircuitBoard,
  Workflow,
  TestTube,
  FileSearch,
  PenTool,
  Bot,
  Gauge,
  ShieldCheck,
  DollarSign,
  Clock,
  UserCheck,
  Building,
  Briefcase,
  GraduationCap,
  Lightbulb,
  Star,
  Heart,
  MessageSquare,
  Video,
  Mic,
  BarChart,
  LineChart,
  PieChart,
  Activity,
  Fingerprint,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  GitMerge,
  GitPullRequest,
  BugOff,
  Puzzle,
  PlayCircle,
  PauseCircle,
  StopCircle,
  FastForward,
  Rewind,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Bluetooth,
  Cast,
  Airplay,
  Navigation,
  MapPin,
  Compass,
  Map,
  Navigation2,
  Globe2,
  Plane,
  Train,
  Car,
  Ship,
  Anchor,
  Mountain,
  TreePine,
  Flower,
  Sun,
  Moon,
  CloudRain,
  CloudSnow,
  Wind,
  Droplets,
  Thermometer,
  Umbrella,
  Coffee,
  Pizza,
  Apple,
  Cherry,
  Grape,
  Banana
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';

interface VibeProfile {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Prosjekt metadata
  projectType: 'web' | 'mobile' | 'desktop' | 'api' | 'fullstack' | 'ai' | 'blockchain';
  targetAudience: string;
  businessGoals: string[];
  
  // Tech Stack
  stack: {
    frontend: string[];
    backend: string[];
    database: string[];
    devops: string[];
    ai: string[];
  };
  
  // Kvalitetskrav
  quality: {
    codeStyle: 'clean' | 'pragmatic' | 'experimental';
    testingLevel: 'none' | 'basic' | 'comprehensive' | 'extreme';
    documentation: 'minimal' | 'standard' | 'detailed';
    performance: number; // 0-100
    accessibility: number; // 0-100
    security: number; // 0-100
  };
  
  // Sikkerhetspolicyer
  security: {
    authentication: 'none' | 'basic' | 'oauth' | 'multi-factor';
    dataEncryption: boolean;
    apiRateLimiting: boolean;
    contentSecurity: boolean;
    auditLogging: boolean;
  };
  
  // Begrensninger og regler
  constraints: {
    budget: 'unlimited' | 'high' | 'medium' | 'low' | 'minimal';
    timeline: 'asap' | 'flexible' | 'strict';
    teamSize: number;
    complianceRequirements: string[];
  };
  
  // AI Agent preferanser
  agentConfig: {
    autonomyLevel: 'manual' | 'guided' | 'semi-auto' | 'full-auto';
    decisionMaking: 'conservative' | 'balanced' | 'aggressive';
    creativityLevel: number; // 0-100
    communicationStyle: 'technical' | 'balanced' | 'simple';
  };
  
  // Integrasjoner
  integrations: {
    github: boolean;
    openai: boolean;
    stripe: boolean;
    twilio: boolean;
    custom: string[];
  };
}

const defaultProfile: VibeProfile = {
  id: '',
  name: 'Nytt Prosjekt',
  description: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  projectType: 'fullstack',
  targetAudience: '',
  businessGoals: [],
  stack: {
    frontend: ['React', 'TypeScript', 'Tailwind'],
    backend: ['Node.js', 'Express'],
    database: ['PostgreSQL'],
    devops: ['Docker', 'GitHub Actions'],
    ai: ['OpenAI GPT-5']
  },
  quality: {
    codeStyle: 'clean',
    testingLevel: 'comprehensive',
    documentation: 'standard',
    performance: 80,
    accessibility: 85,
    security: 90
  },
  security: {
    authentication: 'oauth',
    dataEncryption: true,
    apiRateLimiting: true,
    contentSecurity: true,
    auditLogging: false
  },
  constraints: {
    budget: 'medium',
    timeline: 'flexible',
    teamSize: 1,
    complianceRequirements: []
  },
  agentConfig: {
    autonomyLevel: 'semi-auto',
    decisionMaking: 'balanced',
    creativityLevel: 70,
    communicationStyle: 'balanced'
  },
  integrations: {
    github: true,
    openai: true,
    stripe: false,
    twilio: false,
    custom: []
  }
};

// Project Templates
const projectTemplates: VibeProfile[] = [
  {
    ...defaultProfile,
    id: 'template-saas',
    name: 'SaaS Platform',
    description: 'Modern SaaS application with subscription billing',
    projectType: 'fullstack',
    targetAudience: 'Business customers',
    businessGoals: ['Recurring revenue', 'Scalability', 'User retention'],
    stack: {
      frontend: ['React', 'TypeScript', 'Tailwind', 'Framer Motion'],
      backend: ['Node.js', 'Express', 'GraphQL', 'Prisma'],
      database: ['PostgreSQL', 'Redis'],
      devops: ['Docker', 'Kubernetes', 'AWS', 'GitHub Actions'],
      ai: ['OpenAI GPT-4', 'Embeddings']
    },
    quality: {
      codeStyle: 'clean',
      testingLevel: 'comprehensive',
      documentation: 'detailed',
      performance: 90,
      accessibility: 95,
      security: 95
    },
    security: {
      authentication: 'multi-factor',
      dataEncryption: true,
      apiRateLimiting: true,
      contentSecurity: true,
      auditLogging: true
    },
    integrations: {
      github: true,
      openai: true,
      stripe: true,
      twilio: true,
      custom: ['Slack', 'Zapier', 'Segment']
    }
  },
  {
    ...defaultProfile,
    id: 'template-ecommerce',
    name: 'E-Commerce Store',
    description: 'Online shopping platform with payment processing',
    projectType: 'fullstack',
    targetAudience: 'Online shoppers',
    businessGoals: ['Increase sales', 'Customer experience', 'Inventory management'],
    stack: {
      frontend: ['Next.js', 'TypeScript', 'Tailwind', 'SWR'],
      backend: ['Node.js', 'NestJS', 'REST API'],
      database: ['PostgreSQL', 'Elasticsearch'],
      devops: ['Vercel', 'Cloudflare', 'GitHub Actions'],
      ai: ['Recommendation engine', 'Chat support']
    },
    integrations: {
      github: true,
      openai: false,
      stripe: true,
      twilio: true,
      custom: ['Shopify', 'PayPal', 'FedEx', 'Analytics']
    }
  },
  {
    ...defaultProfile,
    id: 'template-ai-app',
    name: 'AI-Powered Application',
    description: 'Application leveraging AI for core functionality',
    projectType: 'ai',
    targetAudience: 'Tech-savvy users',
    businessGoals: ['Innovation', 'Automation', 'User engagement'],
    stack: {
      frontend: ['React', 'TypeScript', 'Tailwind', 'Recharts'],
      backend: ['Python', 'FastAPI', 'Celery'],
      database: ['PostgreSQL', 'Pinecone', 'Redis'],
      devops: ['Docker', 'Railway', 'GitHub Actions'],
      ai: ['OpenAI GPT-4', 'DALL-E 3', 'Whisper', 'LangChain', 'Embeddings']
    },
    integrations: {
      github: true,
      openai: true,
      stripe: false,
      twilio: false,
      custom: ['Hugging Face', 'Replicate', 'Stability AI']
    }
  },
  {
    ...defaultProfile,
    id: 'template-mobile',
    name: 'Mobile Application',
    description: 'Cross-platform mobile app',
    projectType: 'mobile',
    targetAudience: 'Mobile users',
    businessGoals: ['User engagement', 'App store ranking', 'Retention'],
    stack: {
      frontend: ['React Native', 'TypeScript', 'Expo'],
      backend: ['Node.js', 'Express', 'GraphQL'],
      database: ['PostgreSQL', 'Firebase'],
      devops: ['EAS Build', 'CodePush', 'GitHub Actions'],
      ai: ['ML Kit', 'TensorFlow Lite']
    },
    integrations: {
      github: true,
      openai: false,
      stripe: true,
      twilio: true,
      custom: ['Push notifications', 'Analytics', 'Crash reporting']
    }
  },
  {
    ...defaultProfile,
    id: 'template-startup-mvp',
    name: 'Startup MVP',
    description: 'Minimal viable product for quick validation',
    projectType: 'fullstack',
    targetAudience: 'Early adopters',
    businessGoals: ['Market validation', 'User feedback', 'Fast iteration'],
    stack: {
      frontend: ['Next.js', 'TypeScript', 'Tailwind'],
      backend: ['Node.js', 'Prisma', 'tRPC'],
      database: ['PostgreSQL'],
      devops: ['Vercel', 'PlanetScale'],
      ai: ['OpenAI GPT-3.5']
    },
    constraints: {
      budget: 'minimal',
      timeline: 'asap',
      teamSize: 1,
      complianceRequirements: []
    },
    quality: {
      codeStyle: 'pragmatic',
      testingLevel: 'basic',
      documentation: 'minimal',
      performance: 70,
      accessibility: 70,
      security: 75
    }
  }
];

// AI Recommendation Engine
const getAIRecommendations = (profile: VibeProfile) => {
  const recommendations = [];
  
  // Performance recommendations
  if (profile.quality.performance < 80) {
    recommendations.push({
      type: 'performance',
      title: 'Performance Optimization',
      description: 'Consider implementing caching, CDN, and code splitting',
      priority: 'high',
      impact: 'high',
      suggestions: ['Add Redis caching', 'Use Cloudflare CDN', 'Implement lazy loading']
    });
  }
  
  // Security recommendations
  if (!profile.security.dataEncryption) {
    recommendations.push({
      type: 'security',
      title: 'Enable Data Encryption',
      description: 'Encrypt sensitive data at rest and in transit',
      priority: 'critical',
      impact: 'critical',
      suggestions: ['Use HTTPS everywhere', 'Encrypt database', 'Use secure cookies']
    });
  }
  
  // Stack recommendations based on project type
  if (profile.projectType === 'ai' && !profile.stack.ai.some(t => t.includes('LangChain'))) {
    recommendations.push({
      type: 'stack',
      title: 'Add LangChain',
      description: 'LangChain simplifies AI application development',
      priority: 'medium',
      impact: 'high',
      suggestions: ['Integrate LangChain for prompt management', 'Use chains for complex workflows']
    });
  }
  
  // Testing recommendations
  if (profile.quality.testingLevel === 'none' || profile.quality.testingLevel === 'basic') {
    recommendations.push({
      type: 'quality',
      title: 'Improve Test Coverage',
      description: 'Add comprehensive testing to reduce bugs',
      priority: 'high',
      impact: 'high',
      suggestions: ['Add unit tests', 'Implement integration tests', 'Set up E2E testing']
    });
  }
  
  return recommendations;
};

export function VibeProfilerV3() {
  const [profile, setProfile] = useState<VibeProfile>(defaultProfile);
  const [templates, setTemplates] = useState<VibeProfile[]>(projectTemplates);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [wizardStep, setWizardStep] = useState(0);
  const [isWizardMode, setIsWizardMode] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [profileHistory, setProfileHistory] = useState<VibeProfile[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'yaml' | 'toml'>('json');
  
  // Wizard steps configuration
  const wizardSteps = [
    { title: 'Project Basics', icon: Rocket, description: 'Name and type' },
    { title: 'Tech Stack', icon: Layers, description: 'Choose technologies' },
    { title: 'Quality Standards', icon: Trophy, description: 'Set quality bar' },
    { title: 'Security', icon: Shield, description: 'Security requirements' },
    { title: 'AI Configuration', icon: Bot, description: 'AI agent settings' },
    { title: 'Constraints', icon: Target, description: 'Budget and timeline' },
    { title: 'Review', icon: CheckCircle, description: 'Review and save' }
  ];
  
  // Calculate profile completeness
  const profileCompleteness = useMemo(() => {
    let complete = 0;
    let total = 0;
    
    // Check basic fields
    if (profile.name) complete++;
    total++;
    if (profile.description) complete++;
    total++;
    if (profile.targetAudience) complete++;
    total++;
    if (profile.businessGoals.length > 0) complete++;
    total++;
    
    // Check stack
    if (profile.stack.frontend.length > 0) complete++;
    total++;
    if (profile.stack.backend.length > 0) complete++;
    total++;
    
    // Check quality settings
    if (profile.quality.codeStyle) complete++;
    total++;
    if (profile.quality.testingLevel !== 'none') complete++;
    total++;
    
    return Math.round((complete / total) * 100);
  }, [profile]);
  
  // Update AI recommendations when profile changes
  useEffect(() => {
    const recommendations = getAIRecommendations(profile);
    setAiRecommendations(recommendations);
  }, [profile]);

  // Last inn profil hvis Electron er tilgjengelig
  useEffect(() => {
    if (window.electronAPI?.vibeProfiler) {
      loadProfile();
      loadTemplates();
    }
  }, []);

  const loadProfile = async () => {
    if (!window.electronAPI?.vibeProfiler) return;
    
    setIsLoading(true);
    try {
      const savedProfile = await window.electronAPI.vibeProfiler.load();
      if (savedProfile) {
        setProfile(savedProfile);
        toast({
          title: 'Profil lastet',
          description: 'Din Vibe-profil er lastet inn'
        });
      }
    } catch (error) {
      console.error('Feil ved lasting av profil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    if (!window.electronAPI?.vibeProfiler) return;
    
    try {
      const templates = await window.electronAPI.vibeProfiler.getTemplates();
      setTemplates(templates || []);
    } catch (error) {
      console.error('Feil ved lasting av maler:', error);
    }
  };

  const saveProfile = async () => {
    if (!window.electronAPI?.vibeProfiler) {
      // Lagre lokalt hvis ikke i Electron
      localStorage.setItem('vibeProfile', JSON.stringify(profile));
      toast({
        title: 'Profil lagret lokalt',
        description: 'Din Vibe-profil er lagret i nettleseren'
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await window.electronAPI.vibeProfiler.save(profile);
      toast({
        title: 'Profil lagret',
        description: 'Din Vibe-profil er lagret'
      });
    } catch (error) {
      toast({
        title: 'Feil',
        description: 'Kunne ikke lagre profilen',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStackChange = (category: keyof typeof profile.stack, value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(Boolean);
    setProfile(prev => ({
      ...prev,
      stack: {
        ...prev.stack,
        [category]: items
      }
    }));
  };

  const handleQualityChange = (key: keyof typeof profile.quality, value: any) => {
    setProfile(prev => ({
      ...prev,
      quality: {
        ...prev.quality,
        [key]: value
      }
    }));
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Vibe Profiler v3</CardTitle>
              <CardDescription>
                Definer prosjektets DNA og kvalitetskrav
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadProfile}>
              <Upload className="h-4 w-4 mr-2" />
              Last inn
            </Button>
            <Button size="sm" onClick={saveProfile} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              Lagre profil
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="stack">Tech Stack</TabsTrigger>
            <TabsTrigger value="quality">Kvalitet</TabsTrigger>
            <TabsTrigger value="security">Sikkerhet</TabsTrigger>
            <TabsTrigger value="agents">AI Agenter</TabsTrigger>
            <TabsTrigger value="constraints">Regler</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prosjektnavn</Label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Mitt fantastiske prosjekt"
                />
              </div>
              <div className="space-y-2">
                <Label>Prosjekttype</Label>
                <Select
                  value={profile.projectType}
                  onValueChange={(value: any) => setProfile(prev => ({ ...prev, projectType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web">Web App</SelectItem>
                    <SelectItem value="mobile">Mobil App</SelectItem>
                    <SelectItem value="desktop">Desktop App</SelectItem>
                    <SelectItem value="api">API/Backend</SelectItem>
                    <SelectItem value="fullstack">Fullstack</SelectItem>
                    <SelectItem value="ai">AI/ML Prosjekt</SelectItem>
                    <SelectItem value="blockchain">Blockchain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Beskrivelse</Label>
              <Textarea
                value={profile.description}
                onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Beskriv prosjektets visjon og mål..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Målgruppe</Label>
              <Input
                value={profile.targetAudience}
                onChange={(e) => setProfile(prev => ({ ...prev, targetAudience: e.target.value }))}
                placeholder="Hvem er brukerne? (f.eks. utviklere, bedrifter, forbrukere)"
              />
            </div>

            <div className="space-y-2">
              <Label>Forretningsmål (kommaseparert)</Label>
              <Input
                value={profile.businessGoals.join(', ')}
                onChange={(e) => setProfile(prev => ({ 
                  ...prev, 
                  businessGoals: e.target.value.split(',').map(g => g.trim()).filter(Boolean)
                }))}
                placeholder="Øke salg, forbedre effektivitet, redusere kostnader..."
              />
            </div>
          </TabsContent>

          <TabsContent value="stack" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Frontend
                </Label>
                <Input
                  value={profile.stack.frontend.join(', ')}
                  onChange={(e) => handleStackChange('frontend', e.target.value)}
                  placeholder="React, Vue, Angular, Svelte..."
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Backend
                </Label>
                <Input
                  value={profile.stack.backend.join(', ')}
                  onChange={(e) => handleStackChange('backend', e.target.value)}
                  placeholder="Node.js, Python, Go, Rust..."
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Database
                </Label>
                <Input
                  value={profile.stack.database.join(', ')}
                  onChange={(e) => handleStackChange('database', e.target.value)}
                  placeholder="PostgreSQL, MongoDB, Redis..."
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Cloud className="h-4 w-4" />
                  DevOps
                </Label>
                <Input
                  value={profile.stack.devops.join(', ')}
                  onChange={(e) => handleStackChange('devops', e.target.value)}
                  placeholder="Docker, Kubernetes, CI/CD..."
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI/ML
                </Label>
                <Input
                  value={profile.stack.ai.join(', ')}
                  onChange={(e) => handleStackChange('ai', e.target.value)}
                  placeholder="OpenAI, TensorFlow, PyTorch..."
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quality" className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Kodestil</Label>
                <Select
                  value={profile.quality.codeStyle}
                  onValueChange={(value: any) => handleQualityChange('codeStyle', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clean">Clean Code</SelectItem>
                    <SelectItem value="pragmatic">Pragmatisk</SelectItem>
                    <SelectItem value="experimental">Eksperimentell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Testing-nivå</Label>
                <Select
                  value={profile.quality.testingLevel}
                  onValueChange={(value: any) => handleQualityChange('testingLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ingen</SelectItem>
                    <SelectItem value="basic">Grunnleggende</SelectItem>
                    <SelectItem value="comprehensive">Omfattende</SelectItem>
                    <SelectItem value="extreme">Ekstrem (TDD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Ytelse</Label>
                  <span className="text-sm text-muted-foreground">{profile.quality.performance}%</span>
                </div>
                <Slider
                  value={[profile.quality.performance]}
                  onValueChange={([value]) => handleQualityChange('performance', value)}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Tilgjengelighet</Label>
                  <span className="text-sm text-muted-foreground">{profile.quality.accessibility}%</span>
                </div>
                <Slider
                  value={[profile.quality.accessibility]}
                  onValueChange={([value]) => handleQualityChange('accessibility', value)}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Sikkerhet</Label>
                  <span className="text-sm text-muted-foreground">{profile.quality.security}%</span>
                </div>
                <Slider
                  value={[profile.quality.security]}
                  onValueChange={([value]) => handleQualityChange('security', value)}
                  max={100}
                  step={5}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Autentisering</Label>
                <Select
                  value={profile.security.authentication}
                  onValueChange={(value: any) => setProfile(prev => ({
                    ...prev,
                    security: { ...prev.security, authentication: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ingen</SelectItem>
                    <SelectItem value="basic">Grunnleggende</SelectItem>
                    <SelectItem value="oauth">OAuth 2.0</SelectItem>
                    <SelectItem value="multi-factor">Multi-faktor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'dataEncryption', label: 'Data-kryptering', icon: Lock },
                  { key: 'apiRateLimiting', label: 'API Rate Limiting', icon: Shield },
                  { key: 'contentSecurity', label: 'Content Security Policy', icon: Shield },
                  { key: 'auditLogging', label: 'Audit Logging', icon: AlertCircle }
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </Label>
                    <Switch
                      checked={profile.security[key as keyof typeof profile.security] as boolean}
                      onCheckedChange={(checked) => setProfile(prev => ({
                        ...prev,
                        security: { ...prev.security, [key]: checked }
                      }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Autonomi-nivå</Label>
                <Select
                  value={profile.agentConfig.autonomyLevel}
                  onValueChange={(value: any) => setProfile(prev => ({
                    ...prev,
                    agentConfig: { ...prev.agentConfig, autonomyLevel: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manuell kontroll</SelectItem>
                    <SelectItem value="guided">Veiledet</SelectItem>
                    <SelectItem value="semi-auto">Semi-automatisk</SelectItem>
                    <SelectItem value="full-auto">Fullt automatisk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Beslutningsstil</Label>
                <Select
                  value={profile.agentConfig.decisionMaking}
                  onValueChange={(value: any) => setProfile(prev => ({
                    ...prev,
                    agentConfig: { ...prev.agentConfig, decisionMaking: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Konservativ</SelectItem>
                    <SelectItem value="balanced">Balansert</SelectItem>
                    <SelectItem value="aggressive">Aggressiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Kreativitetsnivå</Label>
                  <span className="text-sm text-muted-foreground">{profile.agentConfig.creativityLevel}%</span>
                </div>
                <Slider
                  value={[profile.agentConfig.creativityLevel]}
                  onValueChange={([value]) => setProfile(prev => ({
                    ...prev,
                    agentConfig: { ...prev.agentConfig, creativityLevel: value }
                  }))}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Kommunikasjonsstil</Label>
                <Select
                  value={profile.agentConfig.communicationStyle}
                  onValueChange={(value: any) => setProfile(prev => ({
                    ...prev,
                    agentConfig: { ...prev.agentConfig, communicationStyle: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Teknisk</SelectItem>
                    <SelectItem value="balanced">Balansert</SelectItem>
                    <SelectItem value="simple">Enkel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="constraints" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budsjett</Label>
                <Select
                  value={profile.constraints.budget}
                  onValueChange={(value: any) => setProfile(prev => ({
                    ...prev,
                    constraints: { ...prev.constraints, budget: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unlimited">Ubegrenset</SelectItem>
                    <SelectItem value="high">Høyt</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Lavt</SelectItem>
                    <SelectItem value="minimal">Minimalt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tidslinje</Label>
                <Select
                  value={profile.constraints.timeline}
                  onValueChange={(value: any) => setProfile(prev => ({
                    ...prev,
                    constraints: { ...prev.constraints, timeline: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asap">ASAP</SelectItem>
                    <SelectItem value="flexible">Fleksibel</SelectItem>
                    <SelectItem value="strict">Streng deadline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Teamstørrelse</Label>
              <Input
                type="number"
                value={profile.constraints.teamSize}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  constraints: { ...prev.constraints, teamSize: parseInt(e.target.value) || 1 }
                }))}
                min={1}
                max={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Compliance-krav (kommaseparert)</Label>
              <Input
                value={profile.constraints.complianceRequirements.join(', ')}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  constraints: { 
                    ...prev.constraints, 
                    complianceRequirements: e.target.value.split(',').map(r => r.trim()).filter(Boolean)
                  }
                }))}
                placeholder="GDPR, HIPAA, PCI-DSS, SOC2..."
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Profilsammendrag */}
        <div className="mt-8 p-4 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-lg border">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Profilsammendrag
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Layers className="h-3 w-3 mr-1" />
                {profile.projectType}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                Team: {profile.constraints.teamSize}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Zap className="h-3 w-3 mr-1" />
                {profile.agentConfig.autonomyLevel}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Shield className="h-3 w-3 mr-1" />
                {profile.security.authentication}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}