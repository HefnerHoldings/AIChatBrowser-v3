import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Target,
  CheckCircle2,
  Circle,
  ChevronRight,
  Trophy,
  Zap,
  TrendingUp,
  Clock,
  Sparkles,
  Flag,
  ArrowUp,
  Star,
  Gift,
  Award,
  Flame,
  Database,
  Users,
  Mail,
  FileText,
  Link,
  Search,
  Filter,
  Download,
  Plus,
  FolderOpen,
  ChevronDown,
  PlayCircle,
  PauseCircle,
  RefreshCw
} from 'lucide-react';

type WorkflowType = 'data-extraction' | 'form-filling' | 'research' | 'monitoring' | 'testing';

interface WorkflowMetrics {
  primary: { label: string; value: string | number; icon: any };
  secondary: { label: string; value: string | number; icon: any };
  tertiary: { label: string; value: string | number; icon: any };
}

interface WorkflowStep {
  id: string;
  title: string;
  completed: boolean;
  active?: boolean;
  metrics?: {
    found?: number;
    processed?: number;
    total?: number;
  };
}

interface Workflow {
  id: string;
  title: string;
  type: WorkflowType;
  status: 'active' | 'paused' | 'completed' | 'draft';
  progress: number;
  steps: WorkflowStep[];
  timeEstimate?: string;
  startedAt?: Date;
  metrics?: {
    leadsFound?: number;
    emailsValidated?: number;
    dataExtracted?: number;
    formsSubmitted?: number;
    pagesScanned?: number;
    testsRun?: number;
    testsPassed?: number;
  };
}

const WORKFLOW_TEMPLATES: Workflow[] = [
  {
    id: 'template-1',
    title: 'Find EU Cookware Wholesalers',
    type: 'data-extraction',
    status: 'draft',
    progress: 0,
    steps: [
      { id: '1', title: 'Search Google for wholesalers', completed: false },
      { id: '2', title: 'Extract contact details', completed: false },
      { id: '3', title: 'Validate email formats', completed: false },
      { id: '4', title: 'Export to XLSX', completed: false }
    ]
  },
  {
    id: 'template-2',
    title: 'LinkedIn Lead Generation',
    type: 'data-extraction',
    status: 'draft',
    progress: 0,
    steps: [
      { id: '1', title: 'Search LinkedIn profiles', completed: false },
      { id: '2', title: 'Extract profile data', completed: false },
      { id: '3', title: 'Find email addresses', completed: false },
      { id: '4', title: 'Enrich with company data', completed: false }
    ]
  },
  {
    id: 'template-3',
    title: 'Form Testing Automation',
    type: 'form-filling',
    status: 'draft',
    progress: 0,
    steps: [
      { id: '1', title: 'Map form fields', completed: false },
      { id: '2', title: 'Generate test data', completed: false },
      { id: '3', title: 'Submit test entries', completed: false },
      { id: '4', title: 'Verify submissions', completed: false }
    ]
  },
  {
    id: 'template-4',
    title: 'Price Monitoring',
    type: 'monitoring',
    status: 'draft',
    progress: 0,
    steps: [
      { id: '1', title: 'Set up product URLs', completed: false },
      { id: '2', title: 'Configure monitoring schedule', completed: false },
      { id: '3', title: 'Track price changes', completed: false },
      { id: '4', title: 'Send alerts on changes', completed: false }
    ]
  }
];

export function GoalTracker() {
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow>({
    id: '1',
    title: 'Find 150 EU cookware wholesalers',
    type: 'data-extraction',
    status: 'active',
    progress: 67,
    timeEstimate: '2h 15m',
    startedAt: new Date(),
    steps: [
      { 
        id: '1', 
        title: 'Search Google for wholesalers', 
        completed: true,
        metrics: { found: 523, processed: 523, total: 523 }
      },
      { 
        id: '2', 
        title: 'Extract contact details', 
        completed: true,
        metrics: { found: 187, processed: 187, total: 187 }
      },
      { 
        id: '3', 
        title: 'Validate email formats', 
        completed: false, 
        active: true,
        metrics: { found: 0, processed: 89, total: 187 }
      },
      { 
        id: '4', 
        title: 'Export to XLSX', 
        completed: false,
        metrics: { found: 0, processed: 0, total: 0 }
      }
    ],
    metrics: {
      leadsFound: 89,
      emailsValidated: 73,
      dataExtracted: 187,
      pagesScanned: 523
    }
  });

  const [savedWorkflows, setSavedWorkflows] = useState<Workflow[]>([
    {
      id: '2',
      title: 'Monitor competitor prices',
      type: 'monitoring',
      status: 'paused',
      progress: 45,
      steps: [],
      metrics: {
        pagesScanned: 24,
        dataExtracted: 156
      }
    },
    {
      id: '3',
      title: 'Test registration forms',
      type: 'form-filling',
      status: 'completed',
      progress: 100,
      steps: [],
      metrics: {
        formsSubmitted: 50,
        testsRun: 50,
        testsPassed: 48
      }
    }
  ]);

  const [showCelebration, setShowCelebration] = useState(false);
  const [showWorkflowSelector, setShowWorkflowSelector] = useState(false);

  const getWorkflowMetrics = (workflow: Workflow): WorkflowMetrics => {
    switch (workflow.type) {
      case 'data-extraction':
        return {
          primary: {
            label: 'Leads Found',
            value: workflow.metrics?.leadsFound || 0,
            icon: Users
          },
          secondary: {
            label: 'Emails Validated',
            value: workflow.metrics?.emailsValidated || 0,
            icon: Mail
          },
          tertiary: {
            label: 'Pages Scanned',
            value: workflow.metrics?.pagesScanned || 0,
            icon: Search
          }
        };
      
      case 'form-filling':
        return {
          primary: {
            label: 'Forms Submitted',
            value: workflow.metrics?.formsSubmitted || 0,
            icon: FileText
          },
          secondary: {
            label: 'Success Rate',
            value: workflow.metrics?.testsRun ? 
              `${Math.round((workflow.metrics.testsPassed! / workflow.metrics.testsRun) * 100)}%` : '0%',
            icon: TrendingUp
          },
          tertiary: {
            label: 'Tests Passed',
            value: `${workflow.metrics?.testsPassed || 0}/${workflow.metrics?.testsRun || 0}`,
            icon: CheckCircle2
          }
        };
      
      case 'research':
        return {
          primary: {
            label: 'Sources Found',
            value: workflow.metrics?.pagesScanned || 0,
            icon: Search
          },
          secondary: {
            label: 'Data Points',
            value: workflow.metrics?.dataExtracted || 0,
            icon: Database
          },
          tertiary: {
            label: 'Relevance',
            value: '92%',
            icon: Target
          }
        };
      
      case 'monitoring':
        return {
          primary: {
            label: 'Items Tracked',
            value: workflow.metrics?.dataExtracted || 0,
            icon: Database
          },
          secondary: {
            label: 'Changes Detected',
            value: 12,
            icon: RefreshCw
          },
          tertiary: {
            label: 'Last Check',
            value: '5m ago',
            icon: Clock
          }
        };
      
      case 'testing':
        return {
          primary: {
            label: 'Tests Run',
            value: workflow.metrics?.testsRun || 0,
            icon: PlayCircle
          },
          secondary: {
            label: 'Pass Rate',
            value: workflow.metrics?.testsRun ? 
              `${Math.round((workflow.metrics.testsPassed! / workflow.metrics.testsRun) * 100)}%` : '0%',
            icon: CheckCircle2
          },
          tertiary: {
            label: 'Failures',
            value: (workflow.metrics?.testsRun || 0) - (workflow.metrics?.testsPassed || 0),
            icon: Flag
          }
        };
    }
  };

  const handleWorkflowSelect = (workflow: Workflow) => {
    setActiveWorkflow(workflow);
    setShowWorkflowSelector(false);
  };

  const handleCreateWorkflow = () => {
    const newWorkflow: Workflow = {
      id: `new-${Date.now()}`,
      title: 'New Workflow',
      type: 'data-extraction',
      status: 'draft',
      progress: 0,
      steps: [
        { id: '1', title: 'Configure search', completed: false },
        { id: '2', title: 'Set extraction rules', completed: false },
        { id: '3', title: 'Run workflow', completed: false }
      ],
      metrics: {}
    };
    setActiveWorkflow(newWorkflow);
    setSavedWorkflows([...savedWorkflows, newWorkflow]);
    setShowWorkflowSelector(false);
  };

  const handleStepComplete = (stepId: string) => {
    setActiveWorkflow(prev => ({
      ...prev,
      steps: prev.steps.map(step => {
        if (step.id === stepId) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
          return { ...step, completed: true, active: false };
        }
        if (prev.steps.findIndex(s => s.id === stepId) < prev.steps.findIndex(s => s.id === step.id) && 
            !step.completed) {
          return { ...step, active: true };
        }
        return step;
      })
    }));
  };

  const metrics = getWorkflowMetrics(activeWorkflow);
  const completedSteps = activeWorkflow.steps.filter(s => s.completed).length;
  const totalSteps = activeWorkflow.steps.length;

  // Simulate real-time updates
  useEffect(() => {
    if (activeWorkflow.status !== 'active') return;
    
    const interval = setInterval(() => {
      setActiveWorkflow(prev => {
        if (prev.type === 'data-extraction' && prev.metrics) {
          return {
            ...prev,
            metrics: {
              ...prev.metrics,
              leadsFound: Math.min((prev.metrics.leadsFound || 0) + Math.floor(Math.random() * 3), 150),
              emailsValidated: Math.min((prev.metrics.emailsValidated || 0) + Math.floor(Math.random() * 2), 150),
              pagesScanned: (prev.metrics.pagesScanned || 0) + Math.floor(Math.random() * 5)
            }
          };
        }
        return prev;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [activeWorkflow.status, activeWorkflow.type]);

  return (
    <div className="p-4 space-y-4">
      {/* Active Workflow Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-4 relative overflow-hidden">
          {/* Background gradient animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 animate-pulse" />
          
          <div className="relative">
            {/* Workflow Header with Selector */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"
                >
                  <Target className="h-5 w-5 text-white" />
                </motion.div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <DropdownMenu open={showWorkflowSelector} onOpenChange={setShowWorkflowSelector}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="p-0 h-auto font-semibold text-lg hover:bg-transparent">
                          {activeWorkflow.title}
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-80">
                        <DropdownMenuItem onClick={handleCreateWorkflow}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Workflow
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1 text-xs text-muted-foreground">Templates</div>
                        {WORKFLOW_TEMPLATES.map(template => (
                          <DropdownMenuItem 
                            key={template.id}
                            onClick={() => handleWorkflowSelect(template)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {template.title}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1 text-xs text-muted-foreground">Saved Workflows</div>
                        {savedWorkflows.map(workflow => (
                          <DropdownMenuItem 
                            key={workflow.id}
                            onClick={() => handleWorkflowSelect(workflow)}
                          >
                            <FolderOpen className="h-4 w-4 mr-2" />
                            <div className="flex-1">
                              <div>{workflow.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {workflow.status} • {workflow.progress}%
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Badge variant={
                      activeWorkflow.status === 'active' ? 'default' :
                      activeWorkflow.status === 'completed' ? 'secondary' :
                      activeWorkflow.status === 'paused' ? 'outline' :
                      'secondary'
                    }>
                      {activeWorkflow.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {activeWorkflow.timeEstimate && (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {activeWorkflow.timeEstimate}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-right"
              >
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {activeWorkflow.progress}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {completedSteps}/{totalSteps} steps
                </div>
              </motion.div>
            </div>

            {/* Animated Progress Bar */}
            <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-4">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${activeWorkflow.progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              {activeWorkflow.status === 'active' && (
                <motion.div
                  className="absolute right-0 top-0 h-full w-1 bg-white"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ right: `${100 - activeWorkflow.progress}%` }}
                />
              )}
            </div>

            {/* Steps with Metrics */}
            <div className="space-y-2">
              {activeWorkflow.steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 5 }}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                    step.completed ? 'bg-green-50 dark:bg-green-900/20' : 
                    step.active ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 
                    'hover:bg-muted/50'
                  }`}
                  onClick={() => !step.completed && handleStepComplete(step.id)}
                >
                  <motion.div
                    whileTap={{ scale: 0.8 }}
                    animate={step.active ? { scale: [1, 1.2, 1] } : {}}
                    transition={step.active ? { duration: 1, repeat: Infinity } : {}}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : step.active ? (
                      <div className="relative">
                        <Circle className="h-5 w-5 text-blue-600" />
                        <motion.div
                          className="absolute inset-0"
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Circle className="h-5 w-5 text-blue-600" />
                        </motion.div>
                      </div>
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </motion.div>
                  
                  <div className="flex-1">
                    <span className={`text-sm ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {step.title}
                    </span>
                    {step.metrics && ((step.metrics.found ?? 0) > 0 || (step.metrics.processed ?? 0) > 0) && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {(step.metrics.found ?? 0) > 0 && `Found: ${step.metrics.found}`}
                        {(step.metrics.processed ?? 0) > 0 && ` • Processed: ${step.metrics.processed}`}
                      </div>
                    )}
                  </div>
                  
                  {step.active && (
                    <motion.div
                      className="ml-auto"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Dynamic KPI Stats Based on Workflow Type */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Card className="p-3 text-center cursor-pointer hover:shadow-lg transition-shadow">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
            >
              <metrics.primary.icon className="h-6 w-6 text-blue-500 mx-auto mb-1" />
            </motion.div>
            <div className="text-2xl font-bold">{metrics.primary.value}</div>
            <div className="text-xs text-muted-foreground">{metrics.primary.label}</div>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Card className="p-3 text-center cursor-pointer hover:shadow-lg transition-shadow">
            <div className="relative">
              <metrics.secondary.icon className="h-6 w-6 text-purple-500 mx-auto mb-1" />
              {activeWorkflow.status === 'active' && (
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-3 w-3 text-purple-400" />
                </motion.div>
              )}
            </div>
            <div className="text-2xl font-bold">{metrics.secondary.value}</div>
            <div className="text-xs text-muted-foreground">{metrics.secondary.label}</div>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Card className="p-3 text-center cursor-pointer hover:shadow-lg transition-shadow">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <metrics.tertiary.icon className="h-6 w-6 text-green-500 mx-auto mb-1" />
            </motion.div>
            <div className="text-2xl font-bold">{metrics.tertiary.value}</div>
            <div className="text-xs text-muted-foreground">{metrics.tertiary.label}</div>
          </Card>
        </motion.div>
      </div>

      {/* Achievement Notifications */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Card className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <CheckCircle2 className="h-6 w-6" />
                </motion.div>
                <div>
                  <p className="font-semibold">Step Completed!</p>
                  <p className="text-sm opacity-90">Making progress on workflow</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workflow Control Actions */}
      <div className="flex gap-2">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
          <Button 
            variant="outline" 
            className="w-full" 
            size="sm"
            onClick={() => setActiveWorkflow(prev => ({
              ...prev,
              status: prev.status === 'active' ? 'paused' : 'active'
            }))}
          >
            {activeWorkflow.status === 'active' ? (
              <>
                <PauseCircle className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Resume
              </>
            )}
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
          <Button variant="outline" className="w-full" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
          <Button variant="outline" className="w-full" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </motion.div>
      </div>
    </div>
  );
}