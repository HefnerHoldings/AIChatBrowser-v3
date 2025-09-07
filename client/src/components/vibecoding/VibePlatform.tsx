import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { VibeProfilerV3 } from './VibeProfilerV3';
import { SandboxRuntime } from './SandboxRuntime';
import { EditorRunner } from './EditorRunner';
import { Marketplace } from './Marketplace';
import { PolicyGuard } from './PolicyGuard';
import { CollaborativeMode } from './CollaborativeMode';
import { QASuite } from './QASuite';
import { MultiAgentOrchestrator } from './MultiAgentOrchestrator';
import { GoalTracker } from './GoalTracker';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings,
  Code2,
  Shield,
  Terminal,
  Play,
  Sparkles,
  ShoppingBag,
  Shield as ShieldIcon,
  Users,
  TestTube2,
  Brain,
  Target,
  Activity,
  Zap,
  Award,
  TrendingUp,
  Star,
  Rocket,
  Globe,
  Bot,
  Layers,
  ChevronRight,
  Bell,
  CircleDot
} from 'lucide-react';

export function VibePlatform() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projectStats, setProjectStats] = useState({
    linesOfCode: 12450,
    tasksCompleted: 47,
    activeAgents: 5,
    qualityScore: 92,
    deploymentReady: true
  });
  
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'AI-teamet fullførte kodegjennomgang', type: 'success' },
    { id: 2, message: 'Ny versjon av Marketplace tilgjengelig', type: 'info' }
  ]);

  const [platformHealth, setPlatformHealth] = useState({
    editor: 'active',
    agents: 'active',
    sandbox: 'idle',
    qa: 'running'
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setProjectStats(prev => ({
        ...prev,
        linesOfCode: prev.linesOfCode + Math.floor(Math.random() * 10),
        qualityScore: Math.min(100, prev.qualityScore + (Math.random() > 0.5 ? 1 : 0))
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-purple-950/5">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        {/* Enhanced Header */}
        <div className="border-b px-4 py-3 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-emerald-500/10 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-6 w-6 text-purple-500" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                  Vibecoding Platform V3.00
                </h1>
                <span className="text-xs text-muted-foreground">
                  Komplett utviklingsøkosystem med AI-orkestrering
                </span>
              </div>
            </div>
            
            {/* Live Status Indicators */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {Object.entries(platformHealth).map(([key, status]) => (
                  <div key={key} className="flex items-center gap-1">
                    <CircleDot 
                      className={`h-3 w-3 ${
                        status === 'active' ? 'text-green-500 animate-pulse' :
                        status === 'running' ? 'text-blue-500 animate-pulse' :
                        status === 'idle' ? 'text-gray-400' :
                        'text-yellow-500'
                      }`}
                    />
                    <span className="text-xs capitalize">{key}</span>
                  </div>
                ))}
              </div>
              
              <Button size="sm" variant="ghost" className="relative">
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </Button>
              
              <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-500">
                <Rocket className="h-4 w-4 mr-1" />
                Deploy
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <TabsList className="w-full justify-start rounded-none px-4 bg-secondary/20 border-b">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Editor & Runner
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Agents
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="sandbox" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sandbox
          </TabsTrigger>
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Vibe Profiles
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="policy" className="flex items-center gap-2">
            <ShieldIcon className="h-4 w-4" />
            Policy
          </TabsTrigger>
          <TabsTrigger value="collab" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Collab
          </TabsTrigger>
          <TabsTrigger value="qa" className="flex items-center gap-2">
            <TestTube2 className="h-4 w-4" />
            QA Suite
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab - NEW */}
        <TabsContent value="dashboard" className="flex-1 m-0 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Kodelinjer</p>
                      <p className="text-2xl font-bold">{projectStats.linesOfCode.toLocaleString()}</p>
                    </div>
                    <Code2 className="h-8 w-8 text-purple-500 opacity-50" />
                  </div>
                  <div className="mt-2">
                    <Progress value={75} className="h-1" />
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Oppgaver</p>
                      <p className="text-2xl font-bold">{projectStats.tasksCompleted}</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-500 opacity-50" />
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    +5 i dag
                  </Badge>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">AI Agenter</p>
                      <p className="text-2xl font-bold">{projectStats.activeAgents}</p>
                    </div>
                    <Bot className="h-8 w-8 text-green-500 opacity-50" />
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-2 rounded-full ${
                          i < projectStats.activeAgents ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                        }`}
                      />
                    ))}
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Kvalitet</p>
                      <p className="text-2xl font-bold">{projectStats.qualityScore}%</p>
                    </div>
                    <Award className="h-8 w-8 text-amber-500 opacity-50" />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(projectStats.qualityScore / 20)
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Deploy Status</p>
                      <p className="text-lg font-bold">Klar</p>
                    </div>
                    <Rocket className="h-8 w-8 text-emerald-500 opacity-50" />
                  </div>
                  <Badge 
                    variant="outline" 
                    className="mt-2 border-emerald-500/50 text-emerald-500"
                  >
                    Production Ready
                  </Badge>
                </Card>
              </motion.div>
            </div>

            {/* Recent Activity & AI Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Siste Aktivitet
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: Brain, text: 'AI-team fullførte kodegjennomgang', time: '2 min siden', color: 'text-purple-500' },
                    { icon: Code2, text: 'Deployed ny versjon til staging', time: '15 min siden', color: 'text-blue-500' },
                    { icon: Shield, text: 'Security scan passed (100%)', time: '1 time siden', color: 'text-green-500' },
                    { icon: Users, text: 'Sarah joined collaborative session', time: '2 timer siden', color: 'text-amber-500' }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 p-2 rounded hover:bg-secondary/50 transition-colors"
                    >
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                      <div className="flex-1">
                        <p className="text-sm">{item.text}</p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  AI Anbefalinger
                </h3>
                <div className="space-y-3">
                  {[
                    { 
                      title: 'Optimaliser database queries',
                      desc: 'Funnet 3 N+1 query problemer',
                      impact: 'high',
                      action: 'Fix nå'
                    },
                    { 
                      title: 'Refactor authentication module',
                      desc: 'Forenkle med 40% mindre kode',
                      impact: 'medium',
                      action: 'Planlegg'
                    },
                    { 
                      title: 'Add error boundaries',
                      desc: 'Forbedre UX med graceful failures',
                      impact: 'low',
                      action: 'Vurder'
                    }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-3 rounded-lg border bg-secondary/20 hover:bg-secondary/40 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                        </div>
                        <Badge 
                          variant={item.impact === 'high' ? 'destructive' : item.impact === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {item.action}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Project Timeline */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Prosjekt Timeline
              </h3>
              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-blue-500 to-green-500" />
                <div className="space-y-6">
                  {[
                    { date: 'I dag', event: 'Sprint 5 fullført', status: 'completed' },
                    { date: 'I morgen', event: 'Deploy til production', status: 'upcoming' },
                    { date: 'Neste uke', event: 'User testing fase', status: 'planned' },
                    { date: 'Neste måned', event: 'V2.0 lansering', status: 'planned' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div 
                        className={`w-4 h-4 rounded-full border-2 ${
                          item.status === 'completed' ? 'bg-green-500 border-green-500' :
                          item.status === 'upcoming' ? 'bg-blue-500 border-blue-500 animate-pulse' :
                          'bg-gray-500 border-gray-500'
                        }`}
                      />
                      <div>
                        <p className="font-medium">{item.event}</p>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="editor" className="flex-1 m-0">
          <EditorRunner />
        </TabsContent>

        <TabsContent value="agents" className="flex-1 m-0 overflow-auto">
          <MultiAgentOrchestrator />
        </TabsContent>

        <TabsContent value="goals" className="flex-1 m-0 overflow-auto">
          <GoalTracker />
        </TabsContent>

        <TabsContent value="sandbox" className="flex-1 m-0 overflow-auto">
          <SandboxRuntime />
        </TabsContent>

        <TabsContent value="profiles" className="flex-1 m-0 overflow-auto">
          <VibeProfilerV3 />
        </TabsContent>

        <TabsContent value="marketplace" className="flex-1 m-0 overflow-auto">
          <Marketplace />
        </TabsContent>

        <TabsContent value="policy" className="flex-1 m-0 overflow-auto">
          <PolicyGuard />
        </TabsContent>

        <TabsContent value="collab" className="flex-1 m-0 overflow-auto">
          <CollaborativeMode />
        </TabsContent>

        <TabsContent value="qa" className="flex-1 m-0 overflow-auto">
          <QASuite />
        </TabsContent>
      </Tabs>

      {/* Status Bar */}
      <div className="border-t px-4 py-1 bg-secondary/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3 text-green-500" />
            Connected
          </span>
          <span className="text-muted-foreground">
            <Layers className="h-3 w-3 inline mr-1" />
            5 active sessions
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">Performance: Excellent</span>
          <span className="text-muted-foreground">v3.00.1</span>
        </div>
      </div>
    </div>
  );
}