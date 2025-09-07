import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  Mic,
  MicOff,
  Volume2,
  Send,
  Sparkles,
  Brain,
  Eye,
  EyeOff,
  Settings,
  Download,
  Upload,
  Play,
  Pause,
  Square,
  RefreshCw,
  Save,
  FolderOpen,
  Plus,
  Trash2,
  ChevronRight,
  Users,
  Building,
  Phone,
  Mail,
  Globe,
  Search,
  Filter,
  Database,
  FileText,
  Zap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Import components
import VisualWorkflowCanvas from './VisualCanvas';
import { NodeLibrary } from './NodeLibrary';
import { VoiceInterface } from './VoiceInterface';
import { AIAssistant } from './AIAssistant';
import { LeadManager } from './LeadManager';
import { LearningSystem } from './LearningSystem';

// Types
interface Workflow {
  id: string;
  name: string;
  nodes: any[];
  edges: any[];
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'paused' | 'completed';
}

interface Lead {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  website: string;
  score: number;
  source: string;
  createdAt: Date;
}

interface ExecutionLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  nodeId?: string;
}

export function WorkflowBuilder() {
  // State management
  const [activeTab, setActiveTab] = useState('builder');
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [recordedActions, setRecordedActions] = useState<any[]>([]);
  const [learnedPatterns, setLearnedPatterns] = useState<any[]>([]);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Effects
  useEffect(() => {
    // Load saved workflows
    const saved = localStorage.getItem('workflows');
    if (saved) {
      const workflows = JSON.parse(saved);
      if (workflows.length > 0) {
        setCurrentWorkflow(workflows[0]);
      }
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom of chat
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handlers
  const handleWorkflowChange = (nodes: any[], edges: any[]) => {
    if (currentWorkflow) {
      setCurrentWorkflow({
        ...currentWorkflow,
        nodes,
        edges,
        updatedAt: new Date()
      });
    }
  };

  const handleExecute = async () => {
    if (!currentWorkflow) {
      toast({
        title: 'Ingen workflow',
        description: 'Vennligst opprett en workflow først',
        variant: 'destructive'
      });
      return;
    }

    setIsExecuting(true);
    addLog('info', 'Starter workflow eksekusjon...');

    // Simulate workflow execution
    try {
      // Execute each node in sequence
      for (const node of currentWorkflow.nodes) {
        addLog('info', `Kjører node: ${node.data.label}`, node.id);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate data extraction for scraper nodes
        if (node.type === 'scraper') {
          const mockLeads = generateMockLeads(5);
          setLeads(prev => [...prev, ...mockLeads]);
          addLog('success', `Ekstraherte ${mockLeads.length} leads`, node.id);
        }
      }
      
      addLog('success', 'Workflow fullført!');
      toast({
        title: 'Workflow fullført',
        description: `Ekstraherte ${leads.length} leads totalt`
      });
    } catch (error) {
      addLog('error', `Feil under eksekusjon: ${error}`);
      toast({
        title: 'Eksekusjon feilet',
        description: 'Se logger for detaljer',
        variant: 'destructive'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStop = () => {
    setIsExecuting(false);
    addLog('warning', 'Workflow stoppet av bruker');
  };

  const addLog = (level: ExecutionLog['level'], message: string, nodeId?: string) => {
    setExecutionLogs(prev => [...prev, {
      id: `log-${Date.now()}`,
      timestamp: new Date(),
      level,
      message,
      nodeId
    }]);
  };

  const generateMockLeads = (count: number): Lead[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `lead-${Date.now()}-${i}`,
      company: `Bedrift ${Math.floor(Math.random() * 1000)}`,
      contact: `Kontakt Person ${i + 1}`,
      email: `kontakt${i + 1}@example.no`,
      phone: `+47 ${Math.floor(Math.random() * 90000000 + 10000000)}`,
      website: `https://example${i + 1}.no`,
      score: Math.floor(Math.random() * 100),
      source: 'Workflow Scraper',
      createdAt: new Date()
    }));
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    // Add user message
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    }]);

    // Simulate AI response
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Jeg forstår at du vil ${userInput}. La meg hjelpe deg med det...`,
        timestamp: new Date()
      }]);

      // Generate AI suggestions
      setAiSuggestions([
        'Legg til en filter node for bedre resultater',
        'Prøv å bruke LinkedIn scraper for kontaktinfo',
        'Sett opp en loop for å sjekke flere sider'
      ]);
    }, 1000);

    setUserInput('');
  };

  const handleVoiceCommand = (command: string) => {
    addLog('info', `Voice command: ${command}`);
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      role: 'voice',
      content: command,
      timestamp: new Date()
    }]);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast({
        title: 'Opptak startet',
        description: 'Snakk for å gi kommandoer'
      });
    } else {
      toast({
        title: 'Opptak stoppet',
        description: 'Voice kommandoer pauset'
      });
    }
  };

  const toggleLearning = () => {
    setIsLearning(!isLearning);
    if (!isLearning) {
      toast({
        title: 'Learning mode aktivert',
        description: 'AI observerer dine handlinger'
      });
    } else {
      toast({
        title: 'Learning mode deaktivert',
        description: 'AI har lagret mønstrene'
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Workflow Builder</h1>
              <p className="text-sm text-muted-foreground">
                Visuell automatisering med AI-assistanse
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Status indicators */}
            <Badge variant={isExecuting ? 'default' : 'outline'}>
              {isExecuting ? 'Kjører' : 'Inaktiv'}
            </Badge>
            <Badge variant={isRecording ? 'destructive' : 'outline'}>
              {isRecording ? 'Opptak' : 'Voice av'}
            </Badge>
            <Badge variant={isLearning ? 'secondary' : 'outline'}>
              {isLearning ? 'Lærer' : 'Observerer ikke'}
            </Badge>
            
            <Separator orientation="vertical" className="h-6 mx-2" />
            
            {/* Control buttons */}
            <Button
              size="sm"
              variant={isExecuting ? 'destructive' : 'default'}
              onClick={isExecuting ? handleStop : handleExecute}
            >
              {isExecuting ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stopp
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Kjør
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              variant={isRecording ? 'destructive' : 'outline'}
              onClick={toggleRecording}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              size="sm"
              variant={isLearning ? 'secondary' : 'outline'}
              onClick={toggleLearning}
            >
              {isLearning ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Left sidebar - Node Library */}
        <div className="w-64 border-r bg-muted/10">
          <NodeLibrary />
        </div>

        {/* Center - Canvas and tabs */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b">
              <TabsTrigger value="builder">Visual Builder</TabsTrigger>
              <TabsTrigger value="ai">AI Assistant</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger value="logs">Logger</TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="flex-1 m-0">
              <VisualWorkflowCanvas
                onWorkflowChange={handleWorkflowChange}
                onExecute={handleExecute}
                isExecuting={isExecuting}
                aiSuggestions={aiSuggestions}
              />
            </TabsContent>

            <TabsContent value="ai" className="flex-1 m-0 p-4">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    AI Workflow Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ScrollArea className="flex-1 mb-4">
                    <div className="space-y-4 pr-4">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : msg.role === 'voice'
                                ? 'bg-purple-500/20'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {msg.timestamp.toLocaleTimeString('nb-NO')}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Input
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Spør AI om workflow hjelp..."
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leads" className="flex-1 m-0 p-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Ekstraherte Leads ({leads.length})
                    </span>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Eksporter
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {leads.map((lead) => (
                        <Card key={lead.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{lead.company}</p>
                              <p className="text-sm text-muted-foreground">{lead.contact}</p>
                              <div className="flex gap-4 mt-1">
                                <span className="text-xs flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {lead.email}
                                </span>
                                <span className="text-xs flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {lead.phone}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">Score: {lead.score}</Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {lead.source}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="flex-1 m-0 p-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Eksekusjonslogger</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-1 font-mono text-xs">
                      {executionLogs.map((log) => (
                        <div
                          key={log.id}
                          className={`flex items-start gap-2 p-1 ${
                            log.level === 'error' ? 'text-red-500' :
                            log.level === 'warning' ? 'text-yellow-500' :
                            log.level === 'success' ? 'text-green-500' :
                            'text-muted-foreground'
                          }`}
                        >
                          <span className="opacity-50">
                            {log.timestamp.toLocaleTimeString('nb-NO')}
                          </span>
                          <span className="font-semibold uppercase">
                            [{log.level}]
                          </span>
                          <span>{log.message}</span>
                          {log.nodeId && (
                            <span className="opacity-50">({log.nodeId})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right sidebar - AI & Learning */}
        <div className="w-80 border-l bg-muted/10 p-4">
          <div className="space-y-4">
            {/* AI Suggestions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  AI Forslag
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {aiSuggestions.map((suggestion, idx) => (
                  <Card key={idx} className="p-2 cursor-pointer hover:bg-accent">
                    <p className="text-xs">{suggestion}</p>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Learning Status */}
            {isLearning && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    Lærer fra dine handlinger
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-xs">
                      <p className="font-medium mb-1">Observerte mønstre:</p>
                      <ul className="space-y-1 ml-2">
                        <li>• Du navigerer ofte til Proff.no</li>
                        <li>• Du ekstraherer alltid e-post og telefon</li>
                        <li>• Du filtrerer på Oslo-området</li>
                      </ul>
                    </div>
                    <Button size="sm" variant="outline" className="w-full">
                      Lag workflow fra mønster
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Statistikk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Noder</span>
                  <span className="font-medium">
                    {currentWorkflow?.nodes.length || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Koblinger</span>
                  <span className="font-medium">
                    {currentWorkflow?.edges.length || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Leads</span>
                  <span className="font-medium">{leads.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kjøringer</span>
                  <span className="font-medium">0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}