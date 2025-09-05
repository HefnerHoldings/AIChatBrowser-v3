import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  GripVertical, Plus, Trash2, Settings, Play, Pause, 
  Save, Copy, ChevronRight, ChevronDown, Code, 
  MousePointer, Type, Timer, GitBranch, RefreshCw,
  Globe, Database, Filter, Download, AlertTriangle
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  type: 'navigate' | 'extract' | 'click' | 'fill' | 'wait' | 'condition' | 'loop';
  name: string;
  config: any;
  selectors?: any;
  extractionRules?: any;
  validationRules?: any;
  errorHandling?: any;
  conditions?: any;
}

interface WorkflowBuilderProps {
  workflowId?: string;
  onClose?: () => void;
}

const stepTypeIcons = {
  navigate: Globe,
  extract: Database,
  click: MousePointer,
  fill: Type,
  wait: Timer,
  condition: GitBranch,
  loop: RefreshCw
};

const stepTypeLabels = {
  navigate: 'Navigate to URL',
  extract: 'Extract Data',
  click: 'Click Element',
  fill: 'Fill Form',
  wait: 'Wait',
  condition: 'Conditional',
  loop: 'Loop'
};

export function WorkflowBuilder({ workflowId, onClose }: WorkflowBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('steps');
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [draggedStep, setDraggedStep] = useState<number | null>(null);
  
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowType, setWorkflowType] = useState('data-extraction');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  
  // Load existing workflow if editing
  const { data: workflow } = useQuery({
    queryKey: ['/api/workflows', workflowId],
    enabled: !!workflowId
  });
  
  useEffect(() => {
    if (workflow) {
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description || '');
      setWorkflowType(workflow.type);
      // Load step configs if they exist
      if (workflow.steps && Array.isArray(workflow.steps)) {
        setSteps(workflow.steps.map((step: any, index: number) => ({
          id: `step-${index}`,
          type: step.type || 'navigate',
          name: step.name || `Step ${index + 1}`,
          config: step.config || {},
          selectors: step.selectors || {},
          extractionRules: step.extractionRules || {},
          validationRules: step.validationRules || {},
          errorHandling: step.errorHandling || {},
          conditions: step.conditions || {}
        })));
      }
    }
  }, [workflow]);
  
  // Save workflow mutation
  const saveWorkflowMutation = useMutation({
    mutationFn: async () => {
      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        type: workflowType,
        status: 'draft',
        steps: steps,
        config: {
          sources: [],
          selectors: {},
          schedule: null
        },
        metrics: {},
        tags: [],
        isTemplate: false,
        aiGenerated: false
      };
      
      if (workflowId) {
        return await apiRequest(`/api/workflows/${workflowId}`, 'PATCH', workflowData);
      } else {
        return await apiRequest('/api/workflows', 'POST', workflowData);
      }
    },
    onSuccess: () => {
      setHasUnsavedChanges(false);
      setLastAutoSave(new Date());
      toast({
        title: 'Workflow Saved',
        description: lastAutoSave ? 'Auto-saved successfully' : 'Your workflow has been saved successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      if (!lastAutoSave && onClose) onClose();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save workflow. Please try again.',
        variant: 'destructive'
      });
    }
  });
  
  // Track changes
  useEffect(() => {
    if (workflow && (workflowName !== workflow.name || 
                    workflowDescription !== (workflow.description || '') ||
                    workflowType !== workflow.type ||
                    JSON.stringify(steps) !== JSON.stringify(workflow.steps || []))) {
      setHasUnsavedChanges(true);
    }
  }, [workflowName, workflowDescription, workflowType, steps, workflow]);
  
  // Auto-save every 30 seconds
  useEffect(() => {
    if (!hasUnsavedChanges || !workflowId) {
      return;
    }
    
    const autoSaveInterval = setInterval(() => {
      saveWorkflowMutation.mutate();
    }, 30000); // 30 seconds
    
    return () => clearInterval(autoSaveInterval);
  }, [hasUnsavedChanges, workflowId, saveWorkflowMutation]);
  
  const addStep = (type: WorkflowStep['type']) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type,
      name: stepTypeLabels[type],
      config: {},
      selectors: {},
      extractionRules: {},
      validationRules: {},
      errorHandling: { retry: 3, onError: 'skip' },
      conditions: {}
    };
    setSteps([...steps, newStep]);
    setSelectedStep(newStep);
    setHasUnsavedChanges(true);
  };
  
  const removeStep = (stepId: string) => {
    setSteps(steps.filter(s => s.id !== stepId));
    if (selectedStep?.id === stepId) {
      setSelectedStep(null);
    }
    setHasUnsavedChanges(true);
  };
  
  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, ...updates } : s));
    if (selectedStep?.id === stepId) {
      setSelectedStep({ ...selectedStep, ...updates });
    }
  };
  
  const handleDragStart = (index: number) => {
    setDraggedStep(index);
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedStep === null || draggedStep === index) return;
    
    const newSteps = [...steps];
    const draggedItem = newSteps[draggedStep];
    newSteps.splice(draggedStep, 1);
    newSteps.splice(index, 0, draggedItem);
    setSteps(newSteps);
    setDraggedStep(index);
  };
  
  const handleDragEnd = () => {
    setDraggedStep(null);
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex-1">
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-xl font-semibold bg-transparent border-none focus:outline-none"
            placeholder="Workflow Name"
          />
          <Textarea
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
            className="mt-2 bg-transparent border-none focus:outline-none resize-none"
            placeholder="Add a description..."
            rows={2}
          />
        </div>
        <div className="flex gap-2 items-center">
          {lastAutoSave && (
            <span className="text-xs text-muted-foreground">
              Auto-lagret {lastAutoSave.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button onClick={() => saveWorkflowMutation.mutate()} disabled={saveWorkflowMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {hasUnsavedChanges ? 'Lagre endringer' : 'Lagret'}
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Steps */}
        <div className="w-1/3 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h3 className="font-semibold mb-3">Workflow Steps</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stepTypeLabels).map(([type, label]) => {
                const Icon = stepTypeIcons[type as keyof typeof stepTypeIcons];
                return (
                  <Button
                    key={type}
                    size="sm"
                    variant="outline"
                    onClick={() => addStep(type as WorkflowStep['type'])}
                    className="flex items-center gap-1"
                    data-testid={`button-add-step-${type}`}
                  >
                    <Icon className="w-3 h-3" />
                    <Plus className="w-3 h-3" />
                  </Button>
                );
              })}
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {steps.map((step, index) => {
                const Icon = stepTypeIcons[step.type];
                return (
                  <Card
                    key={step.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedStep(step)}
                    className={`cursor-pointer transition-colors ${
                      selectedStep?.id === step.id ? 'border-blue-500 bg-gray-800' : ''
                    }`}
                    data-testid={`card-step-${index}`}
                  >
                    <CardContent className="flex items-center p-3">
                      <GripVertical className="w-4 h-4 mr-2 text-gray-500" />
                      <Icon className="w-4 h-4 mr-2" />
                      <div className="flex-1">
                        <div className="font-medium">{step.name}</div>
                        <div className="text-xs text-gray-500">{step.type}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStep(step.id);
                        }}
                        data-testid={`button-remove-step-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
              
              {steps.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Add steps to build your workflow
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        {/* Right Panel - Configuration */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="w-full justify-start rounded-none border-b border-gray-800">
              <TabsTrigger value="steps">Step Configuration</TabsTrigger>
              <TabsTrigger value="sources">Data Sources</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="export">Export Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="steps" className="flex-1 p-4">
              {selectedStep ? (
                <StepConfiguration
                  step={selectedStep}
                  onUpdate={(updates) => updateStep(selectedStep.id, updates)}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Select a step to configure
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="sources" className="p-4">
              <DataSourcesConfiguration />
            </TabsContent>
            
            <TabsContent value="schedule" className="p-4">
              <ScheduleConfiguration />
            </TabsContent>
            
            <TabsContent value="export" className="p-4">
              <ExportConfiguration />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Step Configuration Component
function StepConfiguration({ step, onUpdate }: { step: WorkflowStep; onUpdate: (updates: Partial<WorkflowStep>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Step Name</label>
        <Input
          value={step.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Enter step name"
          data-testid="input-step-name"
        />
      </div>
      
      {step.type === 'navigate' && (
        <div>
          <label className="block text-sm font-medium mb-1">URL</label>
          <Input
            value={step.config.url || ''}
            onChange={(e) => onUpdate({ config: { ...step.config, url: e.target.value } })}
            placeholder="https://example.com"
            data-testid="input-navigate-url"
          />
        </div>
      )}
      
      {step.type === 'extract' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">CSS Selector</label>
            <Input
              value={step.selectors.main || ''}
              onChange={(e) => onUpdate({ selectors: { ...step.selectors, main: e.target.value } })}
              placeholder=".product-item"
              data-testid="input-extract-selector"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fields to Extract</label>
            <Textarea
              value={step.extractionRules.fields?.join('\n') || ''}
              onChange={(e) => onUpdate({ 
                extractionRules: { 
                  ...step.extractionRules, 
                  fields: e.target.value.split('\n').filter(Boolean) 
                } 
              })}
              placeholder="title&#10;price&#10;description"
              rows={4}
              data-testid="textarea-extract-fields"
            />
          </div>
        </>
      )}
      
      {step.type === 'click' && (
        <div>
          <label className="block text-sm font-medium mb-1">Element Selector</label>
          <Input
            value={step.selectors.target || ''}
            onChange={(e) => onUpdate({ selectors: { ...step.selectors, target: e.target.value } })}
            placeholder="button.submit"
            data-testid="input-click-selector"
          />
        </div>
      )}
      
      {step.type === 'fill' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Form Selector</label>
            <Input
              value={step.selectors.form || ''}
              onChange={(e) => onUpdate({ selectors: { ...step.selectors, form: e.target.value } })}
              placeholder="#contact-form"
              data-testid="input-fill-selector"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Field Values (JSON)</label>
            <Textarea
              value={JSON.stringify(step.config.values || {}, null, 2)}
              onChange={(e) => {
                try {
                  const values = JSON.parse(e.target.value);
                  onUpdate({ config: { ...step.config, values } });
                } catch {}
              }}
              placeholder='{"email": "test@example.com"}'
              rows={4}
              className="font-mono text-sm"
              data-testid="textarea-fill-values"
            />
          </div>
        </>
      )}
      
      {step.type === 'wait' && (
        <div>
          <label className="block text-sm font-medium mb-1">Wait Duration (ms)</label>
          <Input
            type="number"
            value={step.config.duration || 1000}
            onChange={(e) => onUpdate({ config: { ...step.config, duration: parseInt(e.target.value) } })}
            placeholder="1000"
            data-testid="input-wait-duration"
          />
        </div>
      )}
      
      {step.type === 'condition' && (
        <div>
          <label className="block text-sm font-medium mb-1">Condition (JavaScript)</label>
          <Textarea
            value={step.conditions.expression || ''}
            onChange={(e) => onUpdate({ conditions: { ...step.conditions, expression: e.target.value } })}
            placeholder="return data.price > 100"
            rows={4}
            className="font-mono text-sm"
            data-testid="textarea-condition-expression"
          />
        </div>
      )}
      
      {step.type === 'loop' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Loop Type</label>
            <Select
              value={step.config.loopType || 'forEach'}
              onValueChange={(value) => onUpdate({ config: { ...step.config, loopType: value } })}
            >
              <SelectTrigger data-testid="select-loop-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forEach">For Each Item</SelectItem>
                <SelectItem value="while">While Condition</SelectItem>
                <SelectItem value="times">Fixed Times</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {step.config.loopType === 'times' && (
            <div>
              <label className="block text-sm font-medium mb-1">Number of Iterations</label>
              <Input
                type="number"
                value={step.config.iterations || 1}
                onChange={(e) => onUpdate({ config: { ...step.config, iterations: parseInt(e.target.value) } })}
                data-testid="input-loop-iterations"
              />
            </div>
          )}
        </>
      )}
      
      <Separator />
      
      <div>
        <h4 className="font-medium mb-2">Error Handling</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium mb-1">On Error</label>
            <Select
              value={step.errorHandling?.onError || 'skip'}
              onValueChange={(value) => onUpdate({ errorHandling: { ...step.errorHandling, onError: value } })}
            >
              <SelectTrigger data-testid="select-error-handling">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skip">Skip Step</SelectItem>
                <SelectItem value="retry">Retry</SelectItem>
                <SelectItem value="fail">Fail Workflow</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {step.errorHandling?.onError === 'retry' && (
            <div>
              <label className="block text-sm font-medium mb-1">Max Retries</label>
              <Input
                type="number"
                value={step.errorHandling?.retry || 3}
                onChange={(e) => onUpdate({ errorHandling: { ...step.errorHandling, retry: parseInt(e.target.value) } })}
                data-testid="input-max-retries"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Data Sources Configuration Component  
function DataSourcesConfiguration() {
  const [sources, setSources] = useState<string[]>([]);
  const [newSource, setNewSource] = useState('');
  
  const addSource = () => {
    if (newSource && !sources.includes(newSource)) {
      setSources([...sources, newSource]);
      setNewSource('');
    }
  };
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Data Sources</h3>
        <p className="text-sm text-gray-500 mb-4">
          Add URLs or domains to scrape data from
        </p>
      </div>
      
      <div className="flex gap-2">
        <Input
          value={newSource}
          onChange={(e) => setNewSource(e.target.value)}
          placeholder="https://example.com"
          onKeyPress={(e) => e.key === 'Enter' && addSource()}
          data-testid="input-data-source"
        />
        <Button onClick={addSource} data-testid="button-add-source">
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>
      
      <div className="space-y-2">
        {sources.map((source, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-800 rounded" data-testid={`item-source-${index}`}>
            <span className="text-sm">{source}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSources(sources.filter((_, i) => i !== index))}
              data-testid={`button-remove-source-${index}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Schedule Configuration Component
function ScheduleConfiguration() {
  const [scheduleType, setScheduleType] = useState('manual');
  const [cronExpression, setCronExpression] = useState('0 0 * * *');
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Schedule</h3>
        <p className="text-sm text-gray-500 mb-4">
          Configure when this workflow should run automatically
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Schedule Type</label>
        <Select value={scheduleType} onValueChange={setScheduleType}>
          <SelectTrigger data-testid="select-schedule-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual Only</SelectItem>
            <SelectItem value="interval">At Interval</SelectItem>
            <SelectItem value="cron">Custom Schedule (Cron)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {scheduleType === 'interval' && (
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" placeholder="1" data-testid="input-interval-value" />
          <Select>
            <SelectTrigger data-testid="select-interval-unit">
              <SelectValue placeholder="hours" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
              <SelectItem value="weeks">Weeks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {scheduleType === 'cron' && (
        <div>
          <label className="block text-sm font-medium mb-1">Cron Expression</label>
          <Input
            value={cronExpression}
            onChange={(e) => setCronExpression(e.target.value)}
            placeholder="0 0 * * *"
            className="font-mono"
            data-testid="input-cron-expression"
          />
          <p className="text-xs text-gray-500 mt-1">
            Current: Daily at midnight
          </p>
        </div>
      )}
    </div>
  );
}

// Export Configuration Component
function ExportConfiguration() {
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportDestination, setExportDestination] = useState('download');
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Export Settings</h3>
        <p className="text-sm text-gray-500 mb-4">
          Configure how extracted data should be exported
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Export Format</label>
        <Select value={exportFormat} onValueChange={setExportFormat}>
          <SelectTrigger data-testid="select-export-format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="xml">XML</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Destination</label>
        <Select value={exportDestination} onValueChange={setExportDestination}>
          <SelectTrigger data-testid="select-export-destination">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="download">Download</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="api">API Webhook</SelectItem>
            <SelectItem value="cloud">Cloud Storage</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {exportDestination === 'email' && (
        <div>
          <label className="block text-sm font-medium mb-1">Email Address</label>
          <Input type="email" placeholder="user@example.com" data-testid="input-export-email" />
        </div>
      )}
      
      {exportDestination === 'api' && (
        <div>
          <label className="block text-sm font-medium mb-1">Webhook URL</label>
          <Input type="url" placeholder="https://api.example.com/webhook" data-testid="input-webhook-url" />
        </div>
      )}
    </div>
  );
}