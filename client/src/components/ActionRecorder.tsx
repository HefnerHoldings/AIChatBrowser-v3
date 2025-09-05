import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Circle, Square, Play, Pause, RotateCcw, Save, 
  MousePointer, Keyboard, Navigation, FormInput, 
  Clock, Sparkles, Wand2, ChevronRight, Eye,
  FileText, Target, Zap, Bot, Video, VideoOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RecordedAction {
  id: string;
  timestamp: Date;
  type: 'click' | 'input' | 'navigate' | 'scroll' | 'hover' | 'form-submit' | 'select' | 'wait';
  target: {
    selector?: string;
    tagName?: string;
    className?: string;
    id?: string;
    text?: string;
    href?: string;
    value?: any;
  };
  data?: any;
  position?: { x: number; y: number };
  url?: string;
  duration?: number;
}

interface WorkflowSuggestion {
  name: string;
  description: string;
  steps: any[];
  confidence: number;
  patterns: string[];
}

interface ActionRecorderProps {
  onWorkflowGenerated?: (workflow: any) => void;
  className?: string;
}

export function ActionRecorder({ onWorkflowGenerated, className }: ActionRecorderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedActions, setRecordedActions] = useState<RecordedAction[]>([]);
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [workflowSuggestions, setWorkflowSuggestions] = useState<WorkflowSuggestion[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentUrl, setCurrentUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  
  // Refs
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const actionIdCounter = useRef(0);
  
  // Start recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
    
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording, isPaused]);
  
  // Event listeners for recording
  useEffect(() => {
    if (!isRecording || isPaused) return;
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      recordAction({
        type: 'click',
        target: extractTargetInfo(target),
        position: { x: e.clientX, y: e.clientY }
      });
    };
    
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      recordAction({
        type: 'input',
        target: extractTargetInfo(target),
        data: { value: target.value, type: target.type }
      });
    };
    
    const handleSubmit = (e: Event) => {
      const target = e.target as HTMLFormElement;
      recordAction({
        type: 'form-submit',
        target: extractTargetInfo(target),
        data: extractFormData(target)
      });
    };
    
    const handleNavigation = () => {
      recordAction({
        type: 'navigate',
        url: window.location.href,
        target: { href: window.location.href }
      });
    };
    
    const handleScroll = () => {
      recordAction({
        type: 'scroll',
        data: {
          scrollX: window.scrollX,
          scrollY: window.scrollY
        }
      });
    };
    
    // Add event listeners
    document.addEventListener('click', handleClick, true);
    document.addEventListener('input', handleInput, true);
    document.addEventListener('submit', handleSubmit, true);
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('scroll', handleScroll);
    
    // Initial URL
    setCurrentUrl(window.location.href);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('input', handleInput, true);
      document.removeEventListener('submit', handleSubmit, true);
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isRecording, isPaused]);
  
  // Record an action
  const recordAction = (action: Partial<RecordedAction>) => {
    const newAction: RecordedAction = {
      id: `action-${actionIdCounter.current++}`,
      timestamp: new Date(),
      type: action.type || 'click',
      target: action.target || {},
      ...action
    };
    
    setRecordedActions(prev => [...prev, newAction]);
  };
  
  // Extract target element information
  const extractTargetInfo = (element: HTMLElement) => {
    return {
      selector: generateSelector(element),
      tagName: element.tagName?.toLowerCase(),
      className: element.className,
      id: element.id,
      text: element.textContent?.substring(0, 50),
      href: (element as HTMLAnchorElement).href,
      value: (element as HTMLInputElement).value
    };
  };
  
  // Generate CSS selector for element
  const generateSelector = (element: HTMLElement): string => {
    if (element.id) return `#${element.id}`;
    
    let path: string[] = [];
    let current: HTMLElement | null = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.className) {
        const classes = current.className.split(' ').filter(c => c).join('.');
        if (classes) selector += `.${classes}`;
      }
      
      const siblings = current.parentElement?.children;
      if (siblings && siblings.length > 1) {
        const index = Array.from(siblings).indexOf(current);
        if (index > 0) selector += `:nth-child(${index + 1})`;
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  };
  
  // Extract form data
  const extractFormData = (form: HTMLFormElement) => {
    const formData = new FormData(form);
    const data: Record<string, any> = {};
    
    formData.forEach((value, key) => {
      if (data[key]) {
        if (!Array.isArray(data[key])) {
          data[key] = [data[key]];
        }
        data[key].push(value);
      } else {
        data[key] = value;
      }
    });
    
    return data;
  };
  
  // Start recording
  const startRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setRecordedActions([]);
    setRecordingTime(0);
    setSelectedActions(new Set());
    setWorkflowSuggestions([]);
    actionIdCounter.current = 0;
    
    toast({
      title: 'Opptak startet',
      description: 'Utfør handlingene du vil automatisere',
    });
  };
  
  // Stop recording
  const stopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    
    if (recordedActions.length > 0) {
      analyzeActions();
    }
    
    toast({
      title: 'Opptak stoppet',
      description: `${recordedActions.length} handlinger registrert`,
    });
  };
  
  // Pause/resume recording
  const togglePause = () => {
    setIsPaused(!isPaused);
  };
  
  // Clear recording
  const clearRecording = () => {
    setRecordedActions([]);
    setSelectedActions(new Set());
    setWorkflowSuggestions([]);
    setRecordingTime(0);
  };
  
  // Analyze recorded actions with AI
  const analyzeActions = async () => {
    setAiAnalyzing(true);
    setShowAnalysis(true);
    
    // Simulate AI analysis (replace with actual API call)
    setTimeout(() => {
      const suggestions = generateWorkflowSuggestions(recordedActions);
      setWorkflowSuggestions(suggestions);
      setAiAnalyzing(false);
    }, 2000);
  };
  
  // Generate workflow suggestions based on actions
  const generateWorkflowSuggestions = (actions: RecordedAction[]): WorkflowSuggestion[] => {
    const suggestions: WorkflowSuggestion[] = [];
    
    // Analyze patterns
    const hasFormInput = actions.some(a => a.type === 'input' || a.type === 'form-submit');
    const hasNavigation = actions.some(a => a.type === 'navigate');
    const hasRepetitiveClicks = detectRepetitivePattern(actions);
    const hasDataExtraction = detectDataExtractionPattern(actions);
    
    // Generate suggestions based on patterns
    if (hasFormInput && hasNavigation) {
      suggestions.push({
        name: 'Form Submission Workflow',
        description: 'Automatisk utfylling og innsending av skjema',
        steps: convertToWorkflowSteps(actions.filter(a => 
          ['navigate', 'input', 'click', 'form-submit'].includes(a.type)
        )),
        confidence: 0.9,
        patterns: ['form-filling', 'navigation']
      });
    }
    
    if (hasRepetitiveClicks) {
      suggestions.push({
        name: 'Repetitive Task Automation',
        description: 'Automatiser repeterende klikk og handlinger',
        steps: convertToWorkflowSteps(actions),
        confidence: 0.85,
        patterns: ['repetitive-actions', 'loops']
      });
    }
    
    if (hasDataExtraction) {
      suggestions.push({
        name: 'Data Extraction Workflow',
        description: 'Ekstraher data fra websider automatisk',
        steps: [
          { type: 'navigate', config: { url: actions[0].url } },
          { type: 'extract', selectors: extractSelectors(actions) },
          { type: 'export', format: 'csv' }
        ],
        confidence: 0.8,
        patterns: ['data-extraction', 'scraping']
      });
    }
    
    // Always provide a generic suggestion
    suggestions.push({
      name: 'Custom Workflow',
      description: 'Tilpasset workflow basert på dine handlinger',
      steps: convertToWorkflowSteps(actions),
      confidence: 0.7,
      patterns: ['custom']
    });
    
    return suggestions;
  };
  
  // Detect repetitive patterns
  const detectRepetitivePattern = (actions: RecordedAction[]): boolean => {
    if (actions.length < 6) return false;
    
    const clickActions = actions.filter(a => a.type === 'click');
    if (clickActions.length < 3) return false;
    
    // Check for similar selectors
    const selectors = clickActions.map(a => a.target.selector);
    const selectorCounts = selectors.reduce((acc, sel) => {
      const base = sel?.split(':')[0] || '';
      acc[base] = (acc[base] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.values(selectorCounts).some(count => count >= 3);
  };
  
  // Detect data extraction pattern
  const detectDataExtractionPattern = (actions: RecordedAction[]): boolean => {
    const clicks = actions.filter(a => a.type === 'click');
    const hasTableClicks = clicks.some(a => 
      a.target.tagName === 'td' || a.target.tagName === 'tr'
    );
    const hasListClicks = clicks.some(a => 
      a.target.tagName === 'li' || a.target.className?.includes('item')
    );
    
    return hasTableClicks || hasListClicks;
  };
  
  // Extract selectors from actions
  const extractSelectors = (actions: RecordedAction[]) => {
    const selectors = actions
      .filter(a => a.type === 'click')
      .map(a => a.target.selector)
      .filter(Boolean);
    
    return [...new Set(selectors)];
  };
  
  // Convert actions to workflow steps
  const convertToWorkflowSteps = (actions: RecordedAction[]) => {
    return actions.map(action => {
      switch (action.type) {
        case 'navigate':
          return {
            type: 'navigate',
            name: 'Gå til side',
            config: { url: action.url || action.target.href }
          };
        case 'click':
          return {
            type: 'click',
            name: 'Klikk element',
            selectors: { target: action.target.selector }
          };
        case 'input':
          return {
            type: 'fill',
            name: 'Fyll ut felt',
            selectors: { field: action.target.selector },
            config: { value: action.data?.value }
          };
        case 'form-submit':
          return {
            type: 'fill',
            name: 'Send skjema',
            selectors: { form: action.target.selector },
            config: { values: action.data }
          };
        case 'wait':
          return {
            type: 'wait',
            name: 'Vent',
            config: { duration: action.duration || 1000 }
          };
        default:
          return {
            type: action.type,
            name: action.type,
            config: action.data
          };
      }
    });
  };
  
  // Create workflow from suggestion
  const createWorkflow = (suggestion: WorkflowSuggestion) => {
    const workflow = {
      name: suggestion.name,
      description: suggestion.description,
      type: 'automated',
      steps: suggestion.steps,
      metadata: {
        recordedAt: new Date(),
        actionsCount: recordedActions.length,
        confidence: suggestion.confidence,
        patterns: suggestion.patterns
      }
    };
    
    if (onWorkflowGenerated) {
      onWorkflowGenerated(workflow);
    }
    
    toast({
      title: 'Workflow opprettet',
      description: `"${suggestion.name}" er klar til bruk`,
    });
  };
  
  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get action icon
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'click': return MousePointer;
      case 'input': return Keyboard;
      case 'navigate': return Navigation;
      case 'form-submit': return FormInput;
      case 'scroll': return ChevronRight;
      default: return Circle;
    }
  };
  
  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg">
              {isRecording ? (
                <Video className="w-5 h-5 text-white" />
              ) : (
                <VideoOff className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Action Recorder</CardTitle>
              <p className="text-xs text-muted-foreground">
                Ta opp handlinger og generer workflows
              </p>
            </div>
          </div>
          
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              <Circle className="w-2 h-2 mr-1 fill-current" />
              {formatTime(recordingTime)}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center justify-center gap-2">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              className="bg-red-500 hover:bg-red-600"
              data-testid="button-start-recording"
            >
              <Circle className="w-4 h-4 mr-2 fill-current" />
              Start opptak
            </Button>
          ) : (
            <>
              <Button
                onClick={stopRecording}
                variant="default"
                data-testid="button-stop-recording"
              >
                <Square className="w-4 h-4 mr-2" />
                Stopp
              </Button>
              <Button
                onClick={togglePause}
                variant="outline"
                data-testid="button-pause-recording"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Fortsett
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
            </>
          )}
          
          {recordedActions.length > 0 && !isRecording && (
            <Button
              onClick={clearRecording}
              variant="outline"
              data-testid="button-clear-recording"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Tøm
            </Button>
          )}
        </div>
        
        {/* Recorded Actions */}
        {recordedActions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">
                Registrerte handlinger ({recordedActions.length})
              </Label>
              {!isRecording && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  data-testid="button-toggle-preview"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  {showPreview ? 'Skjul' : 'Vis'}
                </Button>
              )}
            </div>
            
            {showPreview && (
              <ScrollArea className="h-48 w-full rounded-md border p-2">
                <div className="space-y-1">
                  {recordedActions.map((action, index) => {
                    const Icon = getActionIcon(action.type);
                    return (
                      <motion.div
                        key={action.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                        onClick={() => {
                          const newSelected = new Set(selectedActions);
                          if (newSelected.has(action.id)) {
                            newSelected.delete(action.id);
                          } else {
                            newSelected.add(action.id);
                          }
                          setSelectedActions(newSelected);
                        }}
                        data-testid={`action-item-${index}`}
                      >
                        <Icon className="w-3 h-3 text-muted-foreground" />
                        <div className="flex-1 text-xs">
                          <div className="font-medium">{action.type}</div>
                          {action.target.text && (
                            <div className="text-muted-foreground truncate">
                              {action.target.text}
                            </div>
                          )}
                        </div>
                        {selectedActions.has(action.id) && (
                          <Badge variant="secondary" className="text-xs">
                            Valgt
                          </Badge>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
        
        {/* AI Analysis */}
        {recordedActions.length > 0 && !isRecording && (
          <div className="space-y-2">
            <Button
              onClick={analyzeActions}
              disabled={aiAnalyzing}
              className="w-full"
              variant={showAnalysis ? 'secondary' : 'default'}
              data-testid="button-analyze"
            >
              {aiAnalyzing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                  </motion.div>
                  Analyserer...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 mr-2" />
                  Analyser med AI
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Workflow Suggestions */}
        <AnimatePresence>
          {showAnalysis && workflowSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <Label className="text-sm">Foreslåtte workflows</Label>
              {workflowSuggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 border rounded-lg space-y-2"
                  data-testid={`suggestion-${index}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{suggestion.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {suggestion.description}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(suggestion.confidence * 100)}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {suggestion.patterns.map(pattern => (
                        <Badge key={pattern} variant="secondary" className="text-xs">
                          {pattern}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {suggestion.steps.length} steg
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => createWorkflow(suggestion)}
                    className="w-full"
                    data-testid={`button-create-workflow-${index}`}
                  >
                    <Wand2 className="w-3 h-3 mr-1" />
                    Opprett workflow
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}