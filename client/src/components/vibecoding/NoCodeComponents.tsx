import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  FormInput,
  Table,
  BarChart,
  LineChart,
  PieChart,
  Database,
  Globe,
  Mail,
  CreditCard,
  Lock,
  User,
  Calendar,
  Upload,
  Image,
  Video,
  FileText,
  Hash,
  Toggle,
  Sliders,
  CheckSquare,
  Circle,
  Square,
  List,
  AlignLeft,
  Bold,
  Italic,
  Underline,
  Link,
  Code,
  Palette,
  Layout,
  Grid,
  Columns,
  Layers,
  Move,
  Copy,
  Trash2,
  Plus,
  Settings,
  Eye,
  EyeOff,
  Save,
  Download,
  Share2,
  Sparkles,
  Zap,
  Shield,
  Key,
  Wifi,
  Phone,
  MessageSquare,
  Bot,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  Play,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Star,
  Heart,
  ThumbsUp,
  Flag,
  Bookmark,
  MapPin,
  Navigation,
  Building,
  Briefcase,
  ShoppingCart,
  Package,
  Truck,
  DollarSign,
  Percent,
  Calculator,
  FileSpreadsheet,
  Printer,
  Mic,
  Volume2,
  Headphones,
  Camera,
  Monitor,
  Smartphone,
  HardDrive,
  Cloud,
  Server,
  Cpu,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart2,
  PieChart as PieChartIcon,
  Target,
  Award,
  Trophy,
  Medal,
  Certificate,
  Gift,
  Gem,
  Crown,
  Zap as Lightning,
  Flame,
  Droplet,
  Wind,
  Sun,
  Moon,
  CloudRain,
  Snowflake,
  Thermometer,
  Compass,
  Map,
  Globe2,
  Anchor,
  Plane,
  Train,
  Car,
  Bike,
  Ship,
  Rocket,
  Satellite,
  Wifi as WifiIcon,
  Radio,
  Tv,
  Gamepad2,
  Music,
  Film,
  Book,
  BookOpen,
  Newspaper,
  PenTool,
  Brush,
  Scissors,
  Paperclip,
  AtSign,
  Send,
  Inbox,
  Archive,
  FolderOpen,
  FilePlus,
  FileCheck,
  FileX,
  FileMinus,
  FileCode,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Github,
  Gitlab,
  Command,
  Terminal,
  Bug,
  Tool,
  Wrench,
  Hammer,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  X,
  Check,
  ChevronUp,
  ChevronsUp,
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CornerDownRight,
  RotateCw,
  RotateCcw,
  Maximize,
  Minimize,
  Maximize2,
  Minimize2,
  Expand,
  Shrink,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Component Types
export type ComponentType = 
  | 'form-input'
  | 'form-textarea'
  | 'form-select'
  | 'form-checkbox'
  | 'form-radio'
  | 'form-switch'
  | 'form-slider'
  | 'form-date'
  | 'form-file'
  | 'form-color'
  | 'data-table'
  | 'data-grid'
  | 'chart-line'
  | 'chart-bar'
  | 'chart-pie'
  | 'chart-area'
  | 'api-endpoint'
  | 'database-query'
  | 'auth-login'
  | 'auth-register'
  | 'auth-oauth'
  | 'payment-stripe'
  | 'payment-paypal'
  | 'email-sender'
  | 'email-template'
  | 'ui-button'
  | 'ui-card'
  | 'ui-modal'
  | 'ui-tabs'
  | 'ui-accordion'
  | 'ui-alert'
  | 'ui-badge'
  | 'ui-progress'
  | 'ui-avatar'
  | 'ui-breadcrumb'
  | 'ui-pagination'
  | 'ui-stepper'
  | 'ui-timeline'
  | 'ui-countdown'
  | 'ui-rating'
  | 'layout-container'
  | 'layout-grid'
  | 'layout-flex'
  | 'layout-sidebar'
  | 'layout-header'
  | 'layout-footer'
  | 'media-image'
  | 'media-video'
  | 'media-audio'
  | 'media-gallery'
  | 'media-carousel'
  | 'integration-webhook'
  | 'integration-websocket'
  | 'integration-rest'
  | 'integration-graphql'
  | 'integration-openai'
  | 'integration-twilio'
  | 'integration-sendgrid'
  | 'integration-aws'
  | 'integration-google'
  | 'integration-firebase';

// Component Categories
export const COMPONENT_CATEGORIES = [
  {
    name: 'Form Elements',
    icon: FormInput,
    color: 'text-blue-500',
    components: [
      { type: 'form-input', label: 'Text Input', icon: FormInput, description: 'Single line text input' },
      { type: 'form-textarea', label: 'Textarea', icon: AlignLeft, description: 'Multi-line text input' },
      { type: 'form-select', label: 'Select', icon: List, description: 'Dropdown selection' },
      { type: 'form-checkbox', label: 'Checkbox', icon: CheckSquare, description: 'Multiple choice' },
      { type: 'form-radio', label: 'Radio', icon: Circle, description: 'Single choice' },
      { type: 'form-switch', label: 'Switch', icon: Toggle, description: 'On/off toggle' },
      { type: 'form-slider', label: 'Slider', icon: Sliders, description: 'Range selection' },
      { type: 'form-date', label: 'Date Picker', icon: Calendar, description: 'Date selection' },
      { type: 'form-file', label: 'File Upload', icon: Upload, description: 'File upload' },
      { type: 'form-color', label: 'Color Picker', icon: Palette, description: 'Color selection' },
    ],
  },
  {
    name: 'Data Display',
    icon: Table,
    color: 'text-green-500',
    components: [
      { type: 'data-table', label: 'Data Table', icon: Table, description: 'Sortable data table' },
      { type: 'data-grid', label: 'Data Grid', icon: Grid, description: 'Grid view of data' },
      { type: 'chart-line', label: 'Line Chart', icon: LineChart, description: 'Line graph' },
      { type: 'chart-bar', label: 'Bar Chart', icon: BarChart, description: 'Bar graph' },
      { type: 'chart-pie', label: 'Pie Chart', icon: PieChartIcon, description: 'Pie chart' },
      { type: 'chart-area', label: 'Area Chart', icon: Activity, description: 'Area graph' },
    ],
  },
  {
    name: 'Authentication',
    icon: Lock,
    color: 'text-purple-500',
    components: [
      { type: 'auth-login', label: 'Login Form', icon: Lock, description: 'User login' },
      { type: 'auth-register', label: 'Register Form', icon: User, description: 'User registration' },
      { type: 'auth-oauth', label: 'OAuth Login', icon: Key, description: 'Social login' },
    ],
  },
  {
    name: 'Payment',
    icon: CreditCard,
    color: 'text-yellow-500',
    components: [
      { type: 'payment-stripe', label: 'Stripe Payment', icon: CreditCard, description: 'Stripe checkout' },
      { type: 'payment-paypal', label: 'PayPal Payment', icon: DollarSign, description: 'PayPal checkout' },
    ],
  },
  {
    name: 'Communication',
    icon: Mail,
    color: 'text-red-500',
    components: [
      { type: 'email-sender', label: 'Email Sender', icon: Mail, description: 'Send emails' },
      { type: 'email-template', label: 'Email Template', icon: FileText, description: 'Email design' },
    ],
  },
  {
    name: 'UI Components',
    icon: Layout,
    color: 'text-indigo-500',
    components: [
      { type: 'ui-button', label: 'Button', icon: Square, description: 'Clickable button' },
      { type: 'ui-card', label: 'Card', icon: Square, description: 'Content card' },
      { type: 'ui-modal', label: 'Modal', icon: Square, description: 'Dialog modal' },
      { type: 'ui-tabs', label: 'Tabs', icon: Layers, description: 'Tab navigation' },
      { type: 'ui-alert', label: 'Alert', icon: AlertCircle, description: 'Alert message' },
      { type: 'ui-badge', label: 'Badge', icon: Award, description: 'Status badge' },
      { type: 'ui-progress', label: 'Progress', icon: Activity, description: 'Progress bar' },
      { type: 'ui-rating', label: 'Rating', icon: Star, description: 'Star rating' },
    ],
  },
  {
    name: 'Layout',
    icon: Layout,
    color: 'text-teal-500',
    components: [
      { type: 'layout-container', label: 'Container', icon: Square, description: 'Content container' },
      { type: 'layout-grid', label: 'Grid', icon: Grid, description: 'Grid layout' },
      { type: 'layout-flex', label: 'Flex', icon: Columns, description: 'Flexible layout' },
      { type: 'layout-sidebar', label: 'Sidebar', icon: Layout, description: 'Side navigation' },
    ],
  },
  {
    name: 'Media',
    icon: Image,
    color: 'text-orange-500',
    components: [
      { type: 'media-image', label: 'Image', icon: Image, description: 'Display image' },
      { type: 'media-video', label: 'Video', icon: Video, description: 'Video player' },
      { type: 'media-gallery', label: 'Gallery', icon: Grid, description: 'Image gallery' },
      { type: 'media-carousel', label: 'Carousel', icon: ChevronsRight, description: 'Image slider' },
    ],
  },
  {
    name: 'Integrations',
    icon: Layers,
    color: 'text-pink-500',
    components: [
      { type: 'integration-webhook', label: 'Webhook', icon: Globe, description: 'HTTP webhook' },
      { type: 'integration-rest', label: 'REST API', icon: Globe, description: 'REST endpoint' },
      { type: 'integration-graphql', label: 'GraphQL', icon: Database, description: 'GraphQL query' },
      { type: 'integration-openai', label: 'OpenAI', icon: Bot, description: 'AI integration' },
      { type: 'integration-twilio', label: 'Twilio', icon: MessageSquare, description: 'SMS/Voice' },
      { type: 'integration-sendgrid', label: 'SendGrid', icon: Mail, description: 'Email service' },
    ],
  },
];

// Component Configuration
export interface ComponentConfig {
  id: string;
  type: ComponentType;
  label: string;
  properties: Record<string, any>;
  validation?: Record<string, any>;
  styling?: Record<string, any>;
  events?: Record<string, string>;
  data?: any;
  children?: string[];
  parent?: string;
}

// Component Builder Interface
interface ComponentBuilderProps {
  component: ComponentConfig;
  onUpdate: (config: ComponentConfig) => void;
  onDelete: () => void;
  isSelected: boolean;
  onSelect: () => void;
}

// Individual Component Builder
function ComponentBuilder({ component, onUpdate, onDelete, isSelected, onSelect }: ComponentBuilderProps) {
  const updateProperty = (key: string, value: any) => {
    onUpdate({
      ...component,
      properties: {
        ...component.properties,
        [key]: value,
      },
    });
  };

  const updateValidation = (key: string, value: any) => {
    onUpdate({
      ...component,
      validation: {
        ...component.validation,
        [key]: value,
      },
    });
  };

  const updateStyling = (key: string, value: any) => {
    onUpdate({
      ...component,
      styling: {
        ...component.styling,
        [key]: value,
      },
    });
  };

  // Render preview based on component type
  const renderPreview = () => {
    switch (component.type) {
      case 'form-input':
        return (
          <div className="space-y-2">
            <Label>{component.properties.label || 'Input Label'}</Label>
            <Input
              type={component.properties.type || 'text'}
              placeholder={component.properties.placeholder || 'Enter text...'}
              disabled={component.properties.disabled}
              required={component.validation?.required}
            />
            {component.properties.helperText && (
              <p className="text-sm text-gray-500">{component.properties.helperText}</p>
            )}
          </div>
        );
      
      case 'form-textarea':
        return (
          <div className="space-y-2">
            <Label>{component.properties.label || 'Textarea Label'}</Label>
            <Textarea
              placeholder={component.properties.placeholder || 'Enter text...'}
              disabled={component.properties.disabled}
              required={component.validation?.required}
              rows={component.properties.rows || 4}
            />
          </div>
        );
      
      case 'form-select':
        return (
          <div className="space-y-2">
            <Label>{component.properties.label || 'Select Label'}</Label>
            <Select disabled={component.properties.disabled}>
              <SelectTrigger>
                <SelectValue placeholder={component.properties.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {(component.properties.options || ['Option 1', 'Option 2', 'Option 3']).map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      case 'form-checkbox':
        return (
          <div className="space-y-2">
            <Label>{component.properties.label || 'Checkbox Group'}</Label>
            <div className="space-y-2">
              {(component.properties.options || ['Option 1', 'Option 2', 'Option 3']).map((option: string) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox disabled={component.properties.disabled} />
                  <Label>{option}</Label>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'form-radio':
        return (
          <div className="space-y-2">
            <Label>{component.properties.label || 'Radio Group'}</Label>
            <RadioGroup disabled={component.properties.disabled}>
              {(component.properties.options || ['Option 1', 'Option 2', 'Option 3']).map((option: string) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} />
                  <Label>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      
      case 'form-switch':
        return (
          <div className="flex items-center space-x-2">
            <Switch disabled={component.properties.disabled} />
            <Label>{component.properties.label || 'Toggle Switch'}</Label>
          </div>
        );
      
      case 'form-slider':
        return (
          <div className="space-y-2">
            <Label>{component.properties.label || 'Slider'}</Label>
            <Slider
              disabled={component.properties.disabled}
              min={component.properties.min || 0}
              max={component.properties.max || 100}
              step={component.properties.step || 1}
              defaultValue={[component.properties.defaultValue || 50]}
            />
          </div>
        );
      
      case 'ui-button':
        return (
          <Button
            variant={component.properties.variant || 'default'}
            size={component.properties.size || 'default'}
            disabled={component.properties.disabled}
          >
            {component.properties.label || 'Button'}
          </Button>
        );
      
      case 'ui-card':
        return (
          <Card>
            <CardHeader>
              <CardTitle>{component.properties.title || 'Card Title'}</CardTitle>
              <CardDescription>{component.properties.description || 'Card description'}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{component.properties.content || 'Card content goes here'}</p>
            </CardContent>
          </Card>
        );
      
      case 'ui-alert':
        return (
          <div className={`p-4 rounded-lg border ${
            component.properties.variant === 'destructive' ? 'bg-red-50 border-red-200' :
            component.properties.variant === 'warning' ? 'bg-yellow-50 border-yellow-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex">
              <AlertCircle className="h-4 w-4 mr-2" />
              <div>
                <h4 className="font-medium">{component.properties.title || 'Alert Title'}</h4>
                <p className="text-sm mt-1">{component.properties.description || 'Alert description'}</p>
              </div>
            </div>
          </div>
        );
      
      case 'ui-badge':
        return (
          <Badge variant={component.properties.variant || 'default'}>
            {component.properties.label || 'Badge'}
          </Badge>
        );
      
      case 'ui-progress':
        return (
          <div className="space-y-2">
            <Label>{component.properties.label || 'Progress'}</Label>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${component.properties.value || 50}%` }}
              />
            </div>
          </div>
        );
      
      case 'ui-rating':
        return (
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= (component.properties.value || 3)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        );
      
      case 'data-table':
        const sampleData = component.data || [
          { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Pending' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' },
        ];
        return (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(sampleData[0] || {}).map((key) => (
                    <th key={key} className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleData.slice(0, 3).map((row: any, index: number) => (
                  <tr key={index} className="border-t">
                    {Object.values(row).map((value: any, i: number) => (
                      <td key={i} className="px-4 py-2 text-sm text-gray-900">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'chart-line':
        const lineData = component.data || [
          { name: 'Jan', value: 400 },
          { name: 'Feb', value: 300 },
          { name: 'Mar', value: 600 },
          { name: 'Apr', value: 800 },
          { name: 'May', value: 500 },
        ];
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'chart-bar':
        const barData = component.data || [
          { name: 'A', value: 400 },
          { name: 'B', value: 300 },
          { name: 'C', value: 600 },
          { name: 'D', value: 800 },
        ];
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'chart-pie':
        const pieData = component.data || [
          { name: 'Group A', value: 400 },
          { name: 'Group B', value: 300 },
          { name: 'Group C', value: 300 },
          { name: 'Group D', value: 200 },
        ];
        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        );
      
      default:
        return (
          <div className="p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-sm text-gray-600">Component Preview</p>
            <p className="font-medium">{component.label}</p>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        border-2 rounded-lg p-4 cursor-pointer transition-all
        ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}
      `}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-medium">{component.label}</h4>
          <p className="text-sm text-gray-500">{component.type}</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
      
      <div className="border rounded-lg p-4 bg-white">
        {renderPreview()}
      </div>
    </motion.div>
  );
}

// Property Editor Panel
function PropertyEditor({ component, onUpdate }: { component: ComponentConfig | null; onUpdate: (config: ComponentConfig) => void }) {
  if (!component) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Settings className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>Select a component to edit its properties</p>
      </div>
    );
  }

  const updateProperty = (key: string, value: any) => {
    onUpdate({
      ...component,
      properties: {
        ...component.properties,
        [key]: value,
      },
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <Label>Component Label</Label>
        <Input
          value={component.label}
          onChange={(e) => onUpdate({ ...component, label: e.target.value })}
        />
      </div>
      
      <Separator />
      
      <div>
        <h4 className="font-medium mb-2">Properties</h4>
        <div className="space-y-3">
          {/* Dynamic properties based on component type */}
          {component.type.startsWith('form-') && (
            <>
              <div>
                <Label>Field Label</Label>
                <Input
                  value={component.properties.label || ''}
                  onChange={(e) => updateProperty('label', e.target.value)}
                />
              </div>
              <div>
                <Label>Placeholder</Label>
                <Input
                  value={component.properties.placeholder || ''}
                  onChange={(e) => updateProperty('placeholder', e.target.value)}
                />
              </div>
              <div>
                <Label>Helper Text</Label>
                <Input
                  value={component.properties.helperText || ''}
                  onChange={(e) => updateProperty('helperText', e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={component.properties.disabled || false}
                  onCheckedChange={(checked) => updateProperty('disabled', checked)}
                />
                <Label>Disabled</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={component.validation?.required || false}
                  onCheckedChange={(checked) =>
                    onUpdate({
                      ...component,
                      validation: { ...component.validation, required: checked },
                    })
                  }
                />
                <Label>Required</Label>
              </div>
            </>
          )}
          
          {(component.type === 'form-select' || component.type === 'form-checkbox' || component.type === 'form-radio') && (
            <div>
              <Label>Options (one per line)</Label>
              <Textarea
                value={(component.properties.options || []).join('\n')}
                onChange={(e) => updateProperty('options', e.target.value.split('\n').filter(Boolean))}
                rows={4}
              />
            </div>
          )}
          
          {component.type === 'form-slider' && (
            <>
              <div>
                <Label>Min Value</Label>
                <Input
                  type="number"
                  value={component.properties.min || 0}
                  onChange={(e) => updateProperty('min', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Max Value</Label>
                <Input
                  type="number"
                  value={component.properties.max || 100}
                  onChange={(e) => updateProperty('max', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Step</Label>
                <Input
                  type="number"
                  value={component.properties.step || 1}
                  onChange={(e) => updateProperty('step', parseInt(e.target.value))}
                />
              </div>
            </>
          )}
          
          {component.type === 'ui-button' && (
            <>
              <div>
                <Label>Button Text</Label>
                <Input
                  value={component.properties.label || ''}
                  onChange={(e) => updateProperty('label', e.target.value)}
                />
              </div>
              <div>
                <Label>Variant</Label>
                <Select
                  value={component.properties.variant || 'default'}
                  onValueChange={(value) => updateProperty('variant', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="destructive">Destructive</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="ghost">Ghost</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Size</Label>
                <Select
                  value={component.properties.size || 'default'}
                  onValueChange={(value) => updateProperty('size', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h4 className="font-medium mb-2">Styling</h4>
        <div className="space-y-3">
          <div>
            <Label>Custom CSS Classes</Label>
            <Input
              value={component.styling?.className || ''}
              onChange={(e) =>
                onUpdate({
                  ...component,
                  styling: { ...component.styling, className: e.target.value },
                })
              }
              placeholder="e.g., mt-4 text-blue-500"
            />
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h4 className="font-medium mb-2">Events</h4>
        <div className="space-y-3">
          <div>
            <Label>On Click</Label>
            <Input
              value={component.events?.onClick || ''}
              onChange={(e) =>
                onUpdate({
                  ...component,
                  events: { ...component.events, onClick: e.target.value },
                })
              }
              placeholder="e.g., handleClick"
            />
          </div>
          {component.type.startsWith('form-') && (
            <div>
              <Label>On Change</Label>
              <Input
                value={component.events?.onChange || ''}
                onChange={(e) =>
                  onUpdate({
                    ...component,
                    events: { ...component.events, onChange: e.target.value },
                  })
                }
                placeholder="e.g., handleChange"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main No-Code Components Builder
export function NoCodeComponents() {
  const [components, setComponents] = useState<ComponentConfig[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<ComponentConfig | null>(null);
  const [activeTab, setActiveTab] = useState('design');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Add component
  const addComponent = (type: ComponentType, label: string) => {
    const newComponent: ComponentConfig = {
      id: `component_${Date.now()}`,
      type,
      label,
      properties: {},
      validation: {},
      styling: {},
      events: {},
      data: null,
    };
    setComponents([...components, newComponent]);
  };

  // Update component
  const updateComponent = (updatedComponent: ComponentConfig) => {
    setComponents(components.map((c) => (c.id === updatedComponent.id ? updatedComponent : c)));
    if (selectedComponent?.id === updatedComponent.id) {
      setSelectedComponent(updatedComponent);
    }
  };

  // Delete component
  const deleteComponent = (id: string) => {
    setComponents(components.filter((c) => c.id !== id));
    if (selectedComponent?.id === id) {
      setSelectedComponent(null);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = components.findIndex((c) => c.id === active.id);
      const newIndex = components.findIndex((c) => c.id === over?.id);
      setComponents(arrayMove(components, oldIndex, newIndex));
    }
  };

  // Generate code
  const generateCode = () => {
    let code = `import React from 'react';\n`;
    code += `import { useState } from 'react';\n`;
    code += `import { Button, Input, Select, Card, Label } from '@/components/ui';\n\n`;
    
    code += `export function GeneratedForm() {\n`;
    code += `  const [formData, setFormData] = useState({});\n\n`;
    
    code += `  const handleSubmit = (e) => {\n`;
    code += `    e.preventDefault();\n`;
    code += `    console.log('Form submitted:', formData);\n`;
    code += `  };\n\n`;
    
    code += `  return (\n`;
    code += `    <form onSubmit={handleSubmit} className="space-y-4">\n`;
    
    components.forEach((component) => {
      if (component.type === 'form-input') {
        code += `      <div>\n`;
        code += `        <Label>${component.properties.label || 'Label'}</Label>\n`;
        code += `        <Input\n`;
        code += `          type="${component.properties.type || 'text'}"\n`;
        code += `          placeholder="${component.properties.placeholder || ''}"\n`;
        code += `          onChange={(e) => setFormData({...formData, ${component.id}: e.target.value})}\n`;
        if (component.validation?.required) {
          code += `          required\n`;
        }
        code += `        />\n`;
        code += `      </div>\n`;
      } else if (component.type === 'ui-button') {
        code += `      <Button type="submit">${component.properties.label || 'Submit'}</Button>\n`;
      }
    });
    
    code += `    </form>\n`;
    code += `  );\n`;
    code += `}\n`;
    
    setGeneratedCode(code);
    setActiveTab('code');
    
    // Copy to clipboard
    navigator.clipboard.writeText(code);
    toast({
      title: 'Code generated',
      description: 'The code has been copied to your clipboard',
    });
  };

  // Export configuration
  const exportConfig = () => {
    const config = {
      components,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'form-config.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Configuration exported',
      description: 'The configuration has been downloaded',
    });
  };

  // Import configuration
  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        setComponents(config.components || []);
        toast({
          title: 'Configuration imported',
          description: 'The configuration has been loaded',
        });
      } catch (error) {
        toast({
          title: 'Import failed',
          description: 'Invalid configuration file',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  // Filter components
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return COMPONENT_CATEGORIES;
    
    return COMPONENT_CATEGORIES.map((category) => ({
      ...category,
      components: category.components.filter((comp) =>
        comp.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.description.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    })).filter((category) => category.components.length > 0);
  }, [searchTerm]);

  return (
    <Card className="w-full h-[calc(100vh-200px)]">
      <div className="flex h-full">
        {/* Left Panel - Component Library */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Components Library
            </h3>
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search components..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100%-120px)]">
            <div className="p-4 space-y-4">
              {filteredCategories.map((category) => (
                <div key={category.name}>
                  <div className="flex items-center gap-2 mb-2">
                    <category.icon className={`h-4 w-4 ${category.color}`} />
                    <span className="font-medium text-sm">{category.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {category.components.map((comp) => (
                      <Button
                        key={comp.type}
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        onClick={() => addComponent(comp.type, comp.label)}
                      >
                        <comp.icon className="h-3 w-3 mr-1" />
                        <span className="truncate text-xs">{comp.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        {/* Center - Canvas */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="design">Design</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="code">Code</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={generateCode}>
                    <Code className="h-4 w-4 mr-1" />
                    Generate Code
                  </Button>
                  <Button size="sm" variant="outline" onClick={exportConfig}>
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <label htmlFor="import-config">
                    <Button size="sm" variant="outline" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-1" />
                        Import
                      </span>
                    </Button>
                  </label>
                  <input
                    id="import-config"
                    type="file"
                    accept=".json"
                    onChange={importConfig}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'design' && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={components.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {components.length === 0 ? (
                        <div className="text-center py-12">
                          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-500">
                            Drag components from the library to start building
                          </p>
                        </div>
                      ) : (
                        components.map((component) => (
                          <ComponentBuilder
                            key={component.id}
                            component={component}
                            onUpdate={updateComponent}
                            onDelete={() => deleteComponent(component.id)}
                            isSelected={selectedComponent?.id === component.id}
                            onSelect={() => setSelectedComponent(component)}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
              
              {activeTab === 'preview' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Form Preview</h3>
                  <form className="space-y-4">
                    {components.map((component) => (
                      <div key={component.id}>
                        {/* Render actual components for preview */}
                        {component.type === 'form-input' && (
                          <div className="space-y-2">
                            <Label>{component.properties.label}</Label>
                            <Input
                              type={component.properties.type || 'text'}
                              placeholder={component.properties.placeholder}
                              required={component.validation?.required}
                            />
                          </div>
                        )}
                        {component.type === 'ui-button' && (
                          <Button type="submit">{component.properties.label || 'Submit'}</Button>
                        )}
                        {/* Add more component types as needed */}
                      </div>
                    ))}
                  </form>
                </div>
              )}
              
              {activeTab === 'code' && (
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-semibold">Generated Code</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCode);
                        toast({
                          title: 'Copied to clipboard',
                          description: 'The code has been copied to your clipboard',
                        });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-sm text-gray-300 overflow-x-auto">
                    <code>{generatedCode || '// Click "Generate Code" to create the code'}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Panel - Properties */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold">Properties</h3>
          </div>
          <PropertyEditor component={selectedComponent} onUpdate={updateComponent} />
        </div>
      </div>
    </Card>
  );
}