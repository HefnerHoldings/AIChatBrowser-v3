import { useState, useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  Panel,
  useReactFlow,
  MarkerType,
  NodeTypes,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import {
  Play,
  Pause,
  Square,
  Plus,
  Save,
  Upload,
  Download,
  Code,
  Bug,
  Zap,
  Database,
  Globe,
  Mail,
  Filter,
  GitBranch,
  Repeat,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Lock,
  Unlock,
  Settings,
  Sparkles,
  Workflow,
  ArrowRight,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  MousePointer,
  FormInput,
  Table,
  BarChart,
  MessageSquare,
  Bot,
  Terminal,
  Layers,
  Package,
  Send,
  Shield,
  Key,
  Cloud,
  HardDrive,
  Cpu,
  Activity,
  Link,
  Unlink,
  Share2,
  BookOpen,
  Lightbulb,
  Target,
  Crosshair,
  Navigation,
  MapPin,
  Flag,
  Bookmark,
  Hash,
  DollarSign,
  Percent,
  Calculator,
  Calendar,
  User,
  Users,
  Building,
  Briefcase,
  ShoppingCart,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  Image,
  Video,
  Music,
  Mic,
  Volume2,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Bluetooth,
  Cast,
  Smartphone,
  Monitor,
  Tv,
  Radio,
  Headphones,
  Camera,
  Printer,
  HelpCircle,
  Info,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsRight,
  MoreVertical,
  MoreHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Node Types
const NODE_TYPES = {
  TRIGGER: 'trigger',
  ACTION: 'action',
  CONDITION: 'condition',
  LOOP: 'loop',
  DATA: 'data',
  API: 'api',
  TRANSFORM: 'transform',
  OUTPUT: 'output',
  ERROR: 'error',
  COMMENT: 'comment',
};

// Node Categories
const NODE_CATEGORIES = [
  {
    name: 'Triggers',
    icon: Zap,
    color: 'text-yellow-500',
    nodes: [
      { type: NODE_TYPES.TRIGGER, subType: 'time', label: 'Schedule', icon: Clock, description: 'Run on schedule' },
      { type: NODE_TYPES.TRIGGER, subType: 'webhook', label: 'Webhook', icon: Globe, description: 'HTTP webhook trigger' },
      { type: NODE_TYPES.TRIGGER, subType: 'event', label: 'Event', icon: Zap, description: 'System event trigger' },
      { type: NODE_TYPES.TRIGGER, subType: 'manual', label: 'Manual', icon: MousePointer, description: 'Manual trigger' },
      { type: NODE_TYPES.TRIGGER, subType: 'file', label: 'File Watch', icon: FileText, description: 'Watch for file changes' },
      { type: NODE_TYPES.TRIGGER, subType: 'database', label: 'Database', icon: Database, description: 'Database change trigger' },
    ],
  },
  {
    name: 'Actions',
    icon: Play,
    color: 'text-blue-500',
    nodes: [
      { type: NODE_TYPES.ACTION, subType: 'http', label: 'HTTP Request', icon: Globe, description: 'Make HTTP request' },
      { type: NODE_TYPES.ACTION, subType: 'database', label: 'Database Query', icon: Database, description: 'Execute SQL query' },
      { type: NODE_TYPES.ACTION, subType: 'email', label: 'Send Email', icon: Mail, description: 'Send email notification' },
      { type: NODE_TYPES.ACTION, subType: 'file', label: 'File Operation', icon: FileText, description: 'Read/write files' },
      { type: NODE_TYPES.ACTION, subType: 'script', label: 'Run Script', icon: Terminal, description: 'Execute custom script' },
      { type: NODE_TYPES.ACTION, subType: 'ai', label: 'AI Assistant', icon: Bot, description: 'AI processing' },
      { type: NODE_TYPES.ACTION, subType: 'notification', label: 'Notification', icon: MessageSquare, description: 'Send notification' },
      { type: NODE_TYPES.ACTION, subType: 'form', label: 'Form Submit', icon: FormInput, description: 'Submit form data' },
    ],
  },
  {
    name: 'Logic',
    icon: GitBranch,
    color: 'text-purple-500',
    nodes: [
      { type: NODE_TYPES.CONDITION, subType: 'if', label: 'If/Else', icon: GitBranch, description: 'Conditional branching' },
      { type: NODE_TYPES.CONDITION, subType: 'switch', label: 'Switch', icon: GitBranch, description: 'Multiple conditions' },
      { type: NODE_TYPES.LOOP, subType: 'for', label: 'For Loop', icon: Repeat, description: 'Iterate n times' },
      { type: NODE_TYPES.LOOP, subType: 'while', label: 'While Loop', icon: RefreshCw, description: 'Loop while condition' },
      { type: NODE_TYPES.LOOP, subType: 'foreach', label: 'For Each', icon: Repeat, description: 'Iterate over items' },
      { type: NODE_TYPES.ERROR, subType: 'try', label: 'Try/Catch', icon: AlertCircle, description: 'Error handling' },
      { type: NODE_TYPES.ACTION, subType: 'wait', label: 'Wait', icon: Clock, description: 'Delay execution' },
      { type: NODE_TYPES.ACTION, subType: 'parallel', label: 'Parallel', icon: ChevronsRight, description: 'Run in parallel' },
    ],
  },
  {
    name: 'Data',
    icon: Database,
    color: 'text-green-500',
    nodes: [
      { type: NODE_TYPES.DATA, subType: 'variable', label: 'Variable', icon: Hash, description: 'Store value' },
      { type: NODE_TYPES.DATA, subType: 'constant', label: 'Constant', icon: Lock, description: 'Fixed value' },
      { type: NODE_TYPES.DATA, subType: 'array', label: 'Array', icon: Layers, description: 'List of values' },
      { type: NODE_TYPES.DATA, subType: 'object', label: 'Object', icon: Package, description: 'Key-value pairs' },
      { type: NODE_TYPES.TRANSFORM, subType: 'map', label: 'Map', icon: ArrowRight, description: 'Transform data' },
      { type: NODE_TYPES.TRANSFORM, subType: 'filter', label: 'Filter', icon: Filter, description: 'Filter data' },
      { type: NODE_TYPES.TRANSFORM, subType: 'reduce', label: 'Reduce', icon: Calculator, description: 'Aggregate data' },
      { type: NODE_TYPES.TRANSFORM, subType: 'merge', label: 'Merge', icon: Link, description: 'Combine data' },
    ],
  },
  {
    name: 'Integrations',
    icon: Layers,
    color: 'text-orange-500',
    nodes: [
      { type: NODE_TYPES.API, subType: 'rest', label: 'REST API', icon: Globe, description: 'REST API call' },
      { type: NODE_TYPES.API, subType: 'graphql', label: 'GraphQL', icon: Database, description: 'GraphQL query' },
      { type: NODE_TYPES.API, subType: 'websocket', label: 'WebSocket', icon: Wifi, description: 'WebSocket connection' },
      { type: NODE_TYPES.API, subType: 'oauth', label: 'OAuth', icon: Key, description: 'OAuth authentication' },
      { type: NODE_TYPES.API, subType: 'stripe', label: 'Stripe', icon: CreditCard, description: 'Payment processing' },
      { type: NODE_TYPES.API, subType: 'openai', label: 'OpenAI', icon: Bot, description: 'AI integration' },
      { type: NODE_TYPES.API, subType: 'twilio', label: 'Twilio', icon: MessageSquare, description: 'SMS/Voice' },
      { type: NODE_TYPES.API, subType: 'sendgrid', label: 'SendGrid', icon: Mail, description: 'Email service' },
    ],
  },
  {
    name: 'Output',
    icon: Send,
    color: 'text-red-500',
    nodes: [
      { type: NODE_TYPES.OUTPUT, subType: 'console', label: 'Console Log', icon: Terminal, description: 'Log to console' },
      { type: NODE_TYPES.OUTPUT, subType: 'file', label: 'Write File', icon: FileText, description: 'Save to file' },
      { type: NODE_TYPES.OUTPUT, subType: 'database', label: 'Save to DB', icon: Database, description: 'Store in database' },
      { type: NODE_TYPES.OUTPUT, subType: 'response', label: 'HTTP Response', icon: Send, description: 'Return response' },
      { type: NODE_TYPES.OUTPUT, subType: 'chart', label: 'Chart', icon: BarChart, description: 'Generate chart' },
      { type: NODE_TYPES.OUTPUT, subType: 'table', label: 'Table', icon: Table, description: 'Display table' },
      { type: NODE_TYPES.OUTPUT, subType: 'export', label: 'Export', icon: Download, description: 'Export data' },
      { type: NODE_TYPES.OUTPUT, subType: 'report', label: 'Report', icon: FileSpreadsheet, description: 'Generate report' },
    ],
  },
];

// Custom Node Component
function CustomNode({ data, selected }: { data: any; selected: boolean }) {
  const Icon = data.icon || Zap;
  const nodeColor = {
    [NODE_TYPES.TRIGGER]: 'bg-yellow-500',
    [NODE_TYPES.ACTION]: 'bg-blue-500',
    [NODE_TYPES.CONDITION]: 'bg-purple-500',
    [NODE_TYPES.LOOP]: 'bg-indigo-500',
    [NODE_TYPES.DATA]: 'bg-green-500',
    [NODE_TYPES.API]: 'bg-orange-500',
    [NODE_TYPES.TRANSFORM]: 'bg-teal-500',
    [NODE_TYPES.OUTPUT]: 'bg-red-500',
    [NODE_TYPES.ERROR]: 'bg-pink-500',
    [NODE_TYPES.COMMENT]: 'bg-gray-500',
  }[data.type] || 'bg-gray-500';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        px-4 py-2 rounded-lg shadow-lg border-2 
        ${selected ? 'border-blue-400 shadow-xl' : 'border-gray-300'}
        bg-white dark:bg-gray-800 min-w-[150px]
      `}
    >
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded ${nodeColor}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">{data.label}</div>
          {data.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {data.description}
            </div>
          )}
        </div>
      </div>
      {data.config && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {Object.entries(data.config).map(([key, value]: [string, any]) => (
              <div key={key} className="flex justify-between">
                <span>{key}:</span>
                <span className="font-mono">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.error && (
        <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {data.error}
        </div>
      )}
      {data.status && (
        <div className="mt-2 flex items-center gap-1">
          {data.status === 'running' && <Activity className="h-3 w-3 text-blue-500 animate-pulse" />}
          {data.status === 'success' && <CheckCircle className="h-3 w-3 text-green-500" />}
          {data.status === 'error' && <X className="h-3 w-3 text-red-500" />}
          <span className="text-xs">{data.status}</span>
        </div>
      )}
    </motion.div>
  );
}

// Node configuration panel
function NodeConfigPanel({ node, onUpdate, onClose }: { node: Node | null; onUpdate: (config: any) => void; onClose: () => void }) {
  const [config, setConfig] = useState(node?.data?.config || {});

  if (!node) return null;

  const updateConfig = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdate(newConfig);
  };

  return (
    <Sheet open={!!node} onOpenChange={() => onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Configure {node.data.label}</SheetTitle>
          <SheetDescription>
            Set up the parameters for this workflow node
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {/* Dynamic configuration based on node type */}
          {node.data.subType === 'time' && (
            <>
              <div>
                <Label>Schedule (Cron Expression)</Label>
                <Input
                  value={config.cron || ''}
                  onChange={(e) => updateConfig('cron', e.target.value)}
                  placeholder="0 * * * *"
                />
              </div>
              <div>
                <Label>Timezone</Label>
                <Select value={config.timezone || 'UTC'} onValueChange={(v) => updateConfig('timezone', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {node.data.subType === 'http' && (
            <>
              <div>
                <Label>URL</Label>
                <Input
                  value={config.url || ''}
                  onChange={(e) => updateConfig('url', e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                />
              </div>
              <div>
                <Label>Method</Label>
                <Select value={config.method || 'GET'} onValueChange={(v) => updateConfig('method', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Headers (JSON)</Label>
                <Textarea
                  value={config.headers || '{}'}
                  onChange={(e) => updateConfig('headers', e.target.value)}
                  placeholder='{"Content-Type": "application/json"}'
                  rows={3}
                />
              </div>
              {['POST', 'PUT', 'PATCH'].includes(config.method) && (
                <div>
                  <Label>Body (JSON)</Label>
                  <Textarea
                    value={config.body || '{}'}
                    onChange={(e) => updateConfig('body', e.target.value)}
                    placeholder='{"key": "value"}'
                    rows={4}
                  />
                </div>
              )}
            </>
          )}
          
          {node.data.subType === 'database' && (
            <>
              <div>
                <Label>Query</Label>
                <Textarea
                  value={config.query || ''}
                  onChange={(e) => updateConfig('query', e.target.value)}
                  placeholder="SELECT * FROM users WHERE active = true"
                  rows={4}
                />
              </div>
              <div>
                <Label>Database</Label>
                <Select value={config.database || 'default'} onValueChange={(v) => updateConfig('database', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Database</SelectItem>
                    <SelectItem value="postgres">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="mongodb">MongoDB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {node.data.subType === 'if' && (
            <>
              <div>
                <Label>Condition</Label>
                <Input
                  value={config.condition || ''}
                  onChange={(e) => updateConfig('condition', e.target.value)}
                  placeholder="{{variable}} > 10"
                />
              </div>
            </>
          )}
          
          {node.data.subType === 'for' && (
            <>
              <div>
                <Label>Start</Label>
                <Input
                  type="number"
                  value={config.start || 0}
                  onChange={(e) => updateConfig('start', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>End</Label>
                <Input
                  type="number"
                  value={config.end || 10}
                  onChange={(e) => updateConfig('end', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Step</Label>
                <Input
                  type="number"
                  value={config.step || 1}
                  onChange={(e) => updateConfig('step', parseInt(e.target.value))}
                />
              </div>
            </>
          )}
          
          {node.data.subType === 'variable' && (
            <>
              <div>
                <Label>Variable Name</Label>
                <Input
                  value={config.name || ''}
                  onChange={(e) => updateConfig('name', e.target.value)}
                  placeholder="myVariable"
                />
              </div>
              <div>
                <Label>Initial Value</Label>
                <Input
                  value={config.value || ''}
                  onChange={(e) => updateConfig('value', e.target.value)}
                  placeholder="Enter value"
                />
              </div>
            </>
          )}
          
          {/* Common fields */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={config.description || ''}
              onChange={(e) => updateConfig('description', e.target.value)}
              placeholder="What does this node do?"
              rows={2}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.enabled !== false}
              onCheckedChange={(checked) => updateConfig('enabled', checked)}
            />
            <Label>Enabled</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.debug || false}
              onCheckedChange={(checked) => updateConfig('debug', checked)}
            />
            <Label>Debug Mode</Label>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function VisualWorkflowBuilder() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [breakpoints, setBreakpoints] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Custom node types
  const nodeTypes = useMemo(
    () => ({
      custom: CustomNode,
    }),
    []
  );

  // Handle node changes
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  // Handle edge changes
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  // Handle new connections
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      const newEdge = {
        ...params,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        animated: true,
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Add new node
  const addNode = useCallback((nodeTemplate: any) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'custom',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        ...nodeTemplate,
        config: {},
        status: null,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, []);

  // Update node configuration
  const updateNodeConfig = useCallback((config: any) => {
    if (!selectedNode) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              config,
            },
          };
        }
        return node;
      })
    );
  }, [selectedNode]);

  // Toggle breakpoint
  const toggleBreakpoint = useCallback((nodeId: string) => {
    setBreakpoints((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Execute workflow
  const executeWorkflow = useCallback(async () => {
    setIsRunning(true);
    setIsPaused(false);
    setExecutionLog([]);
    setCurrentStep(null);
    
    // Find start nodes (triggers)
    const startNodes = nodes.filter((n) => n.data.type === NODE_TYPES.TRIGGER);
    
    if (startNodes.length === 0) {
      toast({
        title: 'No trigger found',
        description: 'Add a trigger node to start the workflow',
        variant: 'destructive',
      });
      setIsRunning(false);
      return;
    }
    
    // Simulate execution
    for (const startNode of startNodes) {
      await executeNode(startNode);
    }
    
    setIsRunning(false);
    setCurrentStep(null);
    toast({
      title: 'Workflow completed',
      description: 'The workflow has finished executing',
    });
  }, [nodes, edges]);

  // Execute single node
  const executeNode = async (node: Node) => {
    setCurrentStep(node.id);
    setExecutionLog((prev) => [...prev, `Executing: ${node.data.label}`]);
    
    // Update node status
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          return {
            ...n,
            data: {
              ...n.data,
              status: 'running',
            },
          };
        }
        return n;
      })
    );
    
    // Check for breakpoint
    if (breakpoints.has(node.id)) {
      setIsPaused(true);
      setExecutionLog((prev) => [...prev, `⏸ Breakpoint hit at ${node.data.label}`]);
      // Wait for resume
      await new Promise((resolve) => {
        const checkPaused = setInterval(() => {
          if (!isPaused) {
            clearInterval(checkPaused);
            resolve(undefined);
          }
        }, 100);
      });
    }
    
    // Simulate node execution
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Update node status to success
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          return {
            ...n,
            data: {
              ...n.data,
              status: 'success',
            },
          };
        }
        return n;
      })
    );
    
    // Find and execute connected nodes
    const connectedEdges = edges.filter((e) => e.source === node.id);
    for (const edge of connectedEdges) {
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (targetNode) {
        await executeNode(targetNode);
      }
    }
  };

  // Stop execution
  const stopExecution = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(null);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          status: null,
        },
      }))
    );
  }, []);

  // Resume execution
  const resumeExecution = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Export workflow
  const exportWorkflow = useCallback(() => {
    const workflow = {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.data.type,
        subType: n.data.subType,
        label: n.data.label,
        config: n.data.config,
        position: n.position,
      })),
      edges: edges.map((e) => ({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
      variables,
    };
    
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Workflow exported',
      description: 'The workflow has been downloaded as workflow.json',
    });
  }, [nodes, edges, variables]);

  // Import workflow
  const importWorkflow = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target?.result as string);
        
        // Import nodes
        const importedNodes = workflow.nodes.map((n: any) => ({
          id: n.id,
          type: 'custom',
          position: n.position,
          data: {
            type: n.type,
            subType: n.subType,
            label: n.label,
            config: n.config || {},
            icon: NODE_CATEGORIES.flatMap(c => c.nodes).find(node => 
              node.type === n.type && node.subType === n.subType
            )?.icon,
          },
        }));
        
        // Import edges
        const importedEdges = workflow.edges.map((e: any) => ({
          id: `edge_${Date.now()}_${Math.random()}`,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          animated: true,
        }));
        
        setNodes(importedNodes);
        setEdges(importedEdges);
        setVariables(workflow.variables || {});
        
        toast({
          title: 'Workflow imported',
          description: 'The workflow has been loaded successfully',
        });
      } catch (error) {
        toast({
          title: 'Import failed',
          description: 'Invalid workflow file',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  }, []);

  // Generate code from workflow
  const generateCode = useCallback(() => {
    let code = '// Generated workflow code\n\n';
    
    // Generate imports
    code += 'import { WorkflowEngine } from "@/lib/workflow-engine";\n\n';
    
    // Generate workflow function
    code += 'export async function runWorkflow(context: any) {\n';
    code += '  const engine = new WorkflowEngine();\n';
    code += '  const variables = {};\n\n';
    
    // Generate node code
    for (const node of nodes) {
      code += `  // ${node.data.label}\n`;
      code += `  await engine.execute("${node.data.type}", {\n`;
      code += `    subType: "${node.data.subType}",\n`;
      code += `    config: ${JSON.stringify(node.data.config, null, 4).split('\n').join('\n    ')},\n`;
      code += `  });\n\n`;
    }
    
    code += '  return variables;\n';
    code += '}\n';
    
    // Copy to clipboard
    navigator.clipboard.writeText(code);
    
    toast({
      title: 'Code generated',
      description: 'The workflow code has been copied to clipboard',
    });
  }, [nodes]);

  // Filter nodes based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return NODE_CATEGORIES;
    
    return NODE_CATEGORIES.map((category) => ({
      ...category,
      nodes: category.nodes.filter((node) =>
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.description.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    })).filter((category) => category.nodes.length > 0);
  }, [searchTerm]);

  return (
    <div className="w-full h-[calc(100vh-200px)] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex h-full">
        {/* Left Panel - Node Library */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Workflow Nodes
            </h3>
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {filteredCategories.map((category) => (
              <div key={category.name}>
                <div className="flex items-center gap-2 mb-2">
                  <category.icon className={`h-4 w-4 ${category.color}`} />
                  <span className="font-medium text-sm">{category.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {category.nodes.map((node) => (
                    <Button
                      key={`${node.type}-${node.subType}`}
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => addNode(node)}
                    >
                      <node.icon className="h-3 w-3 mr-1" />
                      <span className="truncate text-xs">{node.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Center - Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
            
            {/* Top Controls */}
            <Panel position="top-center" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
              <div className="flex items-center gap-2">
                {!isRunning ? (
                  <Button size="sm" onClick={executeWorkflow} className="gap-1">
                    <Play className="h-3 w-3" />
                    Run
                  </Button>
                ) : isPaused ? (
                  <Button size="sm" onClick={resumeExecution} className="gap-1">
                    <Play className="h-3 w-3" />
                    Resume
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setIsPaused(true)} className="gap-1">
                    <Pause className="h-3 w-3" />
                    Pause
                  </Button>
                )}
                
                {isRunning && (
                  <Button size="sm" variant="destructive" onClick={stopExecution} className="gap-1">
                    <Square className="h-3 w-3" />
                    Stop
                  </Button>
                )}
                
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                
                <Button size="sm" variant="outline" onClick={() => setShowDebug(!showDebug)} className="gap-1">
                  <Bug className="h-3 w-3" />
                  Debug
                </Button>
                
                <Button size="sm" variant="outline" onClick={generateCode} className="gap-1">
                  <Code className="h-3 w-3" />
                  Generate Code
                </Button>
                
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                
                <Button size="sm" variant="outline" onClick={exportWorkflow} className="gap-1">
                  <Download className="h-3 w-3" />
                  Export
                </Button>
                
                <label htmlFor="import-workflow">
                  <Button size="sm" variant="outline" className="gap-1" asChild>
                    <span>
                      <Upload className="h-3 w-3" />
                      Import
                    </span>
                  </Button>
                </label>
                <input
                  id="import-workflow"
                  type="file"
                  accept=".json"
                  onChange={importWorkflow}
                  className="hidden"
                />
              </div>
            </Panel>
          </ReactFlow>
        </div>
        
        {/* Right Panel - Debug/Logs */}
        {showDebug && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold">Debug Console</h3>
            </div>
            
            <Tabs defaultValue="logs" className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="logs">Logs</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
                <TabsTrigger value="breakpoints">Breakpoints</TabsTrigger>
              </TabsList>
              
              <TabsContent value="logs" className="px-4 overflow-y-auto max-h-[500px]">
                <div className="space-y-1">
                  {executionLog.map((log, index) => (
                    <div key={index} className="text-xs font-mono">
                      <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
                    </div>
                  ))}
                  {executionLog.length === 0 && (
                    <div className="text-sm text-gray-500">No logs yet</div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="variables" className="px-4">
                <div className="space-y-2">
                  {Object.entries(variables).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium">{key}:</span>
                      <span className="ml-2 font-mono text-gray-600 dark:text-gray-400">
                        {JSON.stringify(value)}
                      </span>
                    </div>
                  ))}
                  {Object.keys(variables).length === 0 && (
                    <div className="text-sm text-gray-500">No variables defined</div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="breakpoints" className="px-4">
                <div className="space-y-2">
                  {nodes.map((node) => (
                    <div key={node.id} className="flex items-center justify-between">
                      <span className="text-sm">{node.data.label}</span>
                      <Switch
                        checked={breakpoints.has(node.id)}
                        onCheckedChange={() => toggleBreakpoint(node.id)}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
      
      {/* Node Configuration Panel */}
      <NodeConfigPanel
        node={selectedNode}
        onUpdate={updateNodeConfig}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}

// Wrap with ReactFlowProvider
export default function VisualWorkflowBuilderWrapper() {
  return (
    <ReactFlowProvider>
      <Card className="w-full">
        <VisualWorkflowBuilder />
      </Card>
    </ReactFlowProvider>
  );
}