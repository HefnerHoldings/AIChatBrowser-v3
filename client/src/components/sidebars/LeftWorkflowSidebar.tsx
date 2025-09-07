import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ChevronRight,
  ChevronDown,
  Layers,
  Bot,
  Mic,
  MicOff,
  Volume2,
  Brain,
  Eye,
  EyeOff,
  Play,
  Pause,
  Save,
  Upload,
  Download,
  Plus,
  Settings,
  Search,
  Filter,
  Clock,
  Calendar,
  MousePointer,
  Navigation,
  Type,
  FormInput,
  Database,
  GitBranch,
  Repeat,
  Timer,
  Globe,
  Building,
  Users,
  Mail,
  Phone,
  Sparkles,
  Target,
  Zap,
  Package,
  History,
  Lightbulb,
  Send,
  MessageSquare,
  Activity
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface LeftWorkflowSidebarProps {
  onOpenWorkflowBuilder?: () => void;
  onDragNodeStart?: (nodeType: string, nodeData: any) => void;
  onCommand?: (command: string) => void;
  onAISuggestion?: (suggestion: string) => void;
}

export function LeftWorkflowSidebar({
  onOpenWorkflowBuilder,
  onDragNodeStart,
  onCommand,
  onAISuggestion
}: LeftWorkflowSidebarProps) {
  const [activeSection, setActiveSection] = useState('workflow');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    workflow: true,
    ai: true,
    voice: false,
    learning: false,
    quickActions: true
  });

  // Node templates for drag-and-drop
  const nodeCategories = [
    {
      name: 'Triggers',
      color: 'green',
      nodes: [
        { type: 'trigger', label: 'Manuell Start', icon: MousePointer, data: { triggerType: 'manual' } },
        { type: 'trigger', label: 'Tidsplan', icon: Clock, data: { triggerType: 'schedule' } },
        { type: 'trigger', label: 'Event', icon: Calendar, data: { triggerType: 'event' } },
        { type: 'trigger', label: 'Side Lastet', icon: Globe, data: { triggerType: 'pageLoad' } }
      ]
    },
    {
      name: 'Actions',
      color: 'blue',
      nodes: [
        { type: 'action', label: 'Klikk', icon: MousePointer, data: { actionType: 'click' } },
        { type: 'action', label: 'Naviger', icon: Navigation, data: { actionType: 'navigate' } },
        { type: 'action', label: 'Fyll Skjema', icon: FormInput, data: { actionType: 'fill' } },
        { type: 'action', label: 'Skriv Tekst', icon: Type, data: { actionType: 'type' } }
      ]
    },
    {
      name: 'Data',
      color: 'amber',
      nodes: [
        { type: 'data', label: 'Ekstraher', icon: Database, data: { dataType: 'extract' } },
        { type: 'data', label: 'Filtrer', icon: Filter, data: { dataType: 'filter' } },
        { type: 'data', label: 'Transformer', icon: GitBranch, data: { dataType: 'transform' } },
        { type: 'data', label: 'Eksporter', icon: Download, data: { dataType: 'export' } }
      ]
    },
    {
      name: 'Logic',
      color: 'purple',
      nodes: [
        { type: 'logic', label: 'If/Else', icon: GitBranch, data: { logicType: 'condition' } },
        { type: 'logic', label: 'Loop', icon: Repeat, data: { logicType: 'loop' } },
        { type: 'logic', label: 'Vent', icon: Timer, data: { logicType: 'wait' } }
      ]
    },
    {
      name: 'Scrapers',
      color: 'red',
      nodes: [
        { type: 'scraper', label: 'Bedrift', icon: Building, data: { scraperType: 'company' } },
        { type: 'scraper', label: 'Kontakt', icon: Users, data: { scraperType: 'contact' } },
        { type: 'scraper', label: 'E-post', icon: Mail, data: { scraperType: 'email' } },
        { type: 'scraper', label: 'Telefon', icon: Phone, data: { scraperType: 'phone' } }
      ]
    }
  ];

  const quickActions = [
    { label: 'Start Recording', icon: Eye, action: 'startRecording' },
    { label: 'Save Workflow', icon: Save, action: 'saveWorkflow' },
    { label: 'Export Data', icon: Download, action: 'exportData' },
    { label: 'Import Template', icon: Upload, action: 'importTemplate' },
    { label: 'Run Workflow', icon: Play, action: 'runWorkflow' }
  ];

  const aiSuggestions = [
    'Legg til error handling i workflow',
    'Optimaliser data ekstrahering',
    'Bruk parallell prosessering',
    'Valider input før prosessering',
    'Legg til retry logikk'
  ];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleNodeDrag = (e: React.DragEvent, node: any) => {
    e.dataTransfer.setData('nodeType', node.type);
    e.dataTransfer.setData('label', node.label);
    e.dataTransfer.setData('data', JSON.stringify(node.data));
    if (onDragNodeStart) {
      onDragNodeStart(node.type, node.data);
    }
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    setIsVoiceActive(!isRecording);
    if (!isRecording) {
      toast({
        title: 'Voice kontroll aktivert',
        description: 'Snakk for å gi kommandoer'
      });
      // Simulate voice recognition
      setTimeout(() => {
        const command = 'Gå til finn.no og søk etter IT-konsulenter';
        setVoiceTranscript(command);
        if (onCommand) {
          onCommand(command);
        }
      }, 3000);
    }
  };

  const handleAISend = () => {
    if (!aiInput.trim()) return;
    
    toast({
      title: 'AI Assistant',
      description: 'Prosesserer forespørsel...'
    });
    
    if (onAISuggestion) {
      onAISuggestion(aiInput);
    }
    
    setAiInput('');
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'startRecording':
        setIsLearning(!isLearning);
        toast({
          title: isLearning ? 'Opptak stoppet' : 'Opptak startet',
          description: isLearning ? 'Handlinger lagret' : 'Registrerer handlinger...'
        });
        break;
      case 'saveWorkflow':
        toast({
          title: 'Workflow lagret',
          description: 'Workflow er lagret lokalt'
        });
        break;
      case 'exportData':
        toast({
          title: 'Data eksportert',
          description: 'Data er lastet ned som CSV'
        });
        break;
      case 'runWorkflow':
        toast({
          title: 'Workflow startet',
          description: 'Kjører workflow...'
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">Workflow Tools</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenWorkflowBuilder}
          >
            <Layers className="h-4 w-4 mr-1" />
            Builder
          </Button>
        </div>
        <div className="flex gap-1">
          <Badge variant={isVoiceActive ? 'default' : 'outline'}>
            {isVoiceActive ? 'Voice Aktiv' : 'Voice Av'}
          </Badge>
          <Badge variant={isLearning ? 'secondary' : 'outline'}>
            {isLearning ? 'Lærer' : 'Ikke lærer'}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Quick Actions */}
          <Collapsible
            open={expandedSections.quickActions}
            onOpenChange={() => toggleSection('quickActions')}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-accent p-2 rounded">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Quick Actions</span>
              </div>
              {expandedSections.quickActions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={idx}
                      size="sm"
                      variant="outline"
                      className="justify-start"
                      onClick={() => handleQuickAction(action.action)}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Workflow Nodes */}
          <Collapsible
            open={expandedSections.workflow}
            onOpenChange={() => toggleSection('workflow')}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-accent p-2 rounded">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="font-medium">Workflow Nodes</span>
              </div>
              {expandedSections.workflow ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-3">
                {nodeCategories.map((category) => (
                  <div key={category.name}>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      {category.name}
                    </h4>
                    <div className="grid grid-cols-2 gap-1">
                      {category.nodes.map((node, idx) => {
                        const Icon = node.icon;
                        return (
                          <Card
                            key={idx}
                            className={`p-2 cursor-move hover:shadow-md transition-all bg-${category.color}-500/10 border-${category.color}-500/20`}
                            draggable
                            onDragStart={(e) => handleNodeDrag(e, node)}
                          >
                            <div className="flex items-center gap-1">
                              <Icon className="h-3 w-3" />
                              <span className="text-xs truncate">{node.label}</span>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* AI Assistant */}
          <Collapsible
            open={expandedSections.ai}
            onOpenChange={() => toggleSection('ai')}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-accent p-2 rounded">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <span className="font-medium">AI Assistant</span>
              </div>
              {expandedSections.ai ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Beskriv hva du vil automatisere..."
                    className="min-h-[80px] text-sm"
                  />
                  <Button 
                    onClick={handleAISend}
                    className="w-full"
                    size="sm"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Send til AI
                  </Button>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">AI Forslag:</p>
                  {aiSuggestions.map((suggestion, idx) => (
                    <Card
                      key={idx}
                      className="p-2 cursor-pointer hover:bg-accent text-xs"
                      onClick={() => {
                        if (onAISuggestion) {
                          onAISuggestion(suggestion);
                        }
                      }}
                    >
                      <div className="flex items-start gap-1">
                        <Lightbulb className="h-3 w-3 mt-0.5 text-yellow-500" />
                        <span>{suggestion}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Voice Control */}
          <Collapsible
            open={expandedSections.voice}
            onOpenChange={() => toggleSection('voice')}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-accent p-2 rounded">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                <span className="font-medium">Voice Control</span>
              </div>
              {expandedSections.voice ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-3">
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    variant={isRecording ? 'destructive' : 'default'}
                    onClick={handleVoiceToggle}
                    className="rounded-full h-16 w-16"
                  >
                    {isRecording ? (
                      <MicOff className="h-6 w-6" />
                    ) : (
                      <Mic className="h-6 w-6" />
                    )}
                  </Button>
                </div>
                
                {isRecording && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3 w-3" />
                      <span className="text-xs">Lytter...</span>
                    </div>
                    <Progress value={75} className="h-1" />
                  </div>
                )}
                
                {voiceTranscript && (
                  <Card className="p-2 bg-primary/10">
                    <p className="text-xs">{voiceTranscript}</p>
                  </Card>
                )}
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Voice kommandoer:</p>
                  <p>• "Start workflow"</p>
                  <p>• "Gå til [nettside]"</p>
                  <p>• "Ekstraher data"</p>
                  <p>• "Lagre resultat"</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Learning System */}
          <Collapsible
            open={expandedSections.learning}
            onOpenChange={() => toggleSection('learning')}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-accent p-2 rounded">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span className="font-medium">Learning System</span>
              </div>
              {expandedSections.learning ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Auto-læring</span>
                  <Button
                    size="sm"
                    variant={isLearning ? 'destructive' : 'outline'}
                    onClick={() => setIsLearning(!isLearning)}
                  >
                    {isLearning ? (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Stopp
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Start
                      </>
                    )}
                  </Button>
                </div>
                
                {isLearning && (
                  <Card className="p-2 bg-red-500/10">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xs">Registrerer handlinger...</span>
                    </div>
                  </Card>
                )}
                
                <div className="space-y-1">
                  <p className="text-xs font-medium">Oppdagede mønstre:</p>
                  <Card className="p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Morgen rutine</span>
                      <Badge variant="outline" className="text-xs">92%</Badge>
                    </div>
                  </Card>
                  <Card className="p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Lead kvalifisering</span>
                      <Badge variant="outline" className="text-xs">85%</Badge>
                    </div>
                  </Card>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      {/* Footer Status */}
      <div className="p-3 border-t bg-muted/50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3" />
            <span>Status: Klar</span>
          </div>
          <Button size="sm" variant="ghost" className="h-6 px-2">
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}