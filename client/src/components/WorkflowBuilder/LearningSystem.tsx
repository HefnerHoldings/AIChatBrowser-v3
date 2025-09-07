import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Eye,
  EyeOff,
  Activity,
  TrendingUp,
  Repeat,
  GitBranch,
  Target,
  Lightbulb,
  History,
  Save,
  Play,
  BarChart,
  MousePointer,
  Navigation,
  FormInput,
  Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Pattern {
  id: string;
  name: string;
  type: 'sequence' | 'time-based' | 'conditional';
  occurrences: number;
  confidence: number;
  actions: string[];
  lastSeen: Date;
}

interface RecordedAction {
  id: string;
  type: string;
  target: string;
  value?: string;
  timestamp: Date;
  url: string;
}

interface LearningSystemProps {
  isActive?: boolean;
  onPatternDetected?: (pattern: Pattern) => void;
  onSaveAsWorkflow?: (actions: RecordedAction[]) => void;
}

export function LearningSystem({ 
  isActive = false, 
  onPatternDetected, 
  onSaveAsWorkflow 
}: LearningSystemProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedActions, setRecordedActions] = useState<RecordedAction[]>([]);
  const [detectedPatterns, setDetectedPatterns] = useState<Pattern[]>([]);
  const [activeTab, setActiveTab] = useState('recording');
  const [autoLearn, setAutoLearn] = useState(true);

  // Mock patterns for demo
  const mockPatterns: Pattern[] = [
    {
      id: '1',
      name: 'Morgen rutine',
      type: 'time-based',
      occurrences: 15,
      confidence: 92,
      actions: ['Åpne finn.no', 'Søk IT-jobber', 'Sortér på dato'],
      lastSeen: new Date()
    },
    {
      id: '2',
      name: 'Lead kvalifisering',
      type: 'sequence',
      occurrences: 8,
      confidence: 85,
      actions: ['Søk bedrift', 'Sjekk Proff.no', 'Kopier kontaktinfo'],
      lastSeen: new Date()
    },
    {
      id: '3',
      name: 'Pris overvåking',
      type: 'conditional',
      occurrences: 5,
      confidence: 78,
      actions: ['Sjekk pris', 'Sammenlign med forrige', 'Send varsel hvis lavere'],
      lastSeen: new Date()
    }
  ];

  // Simulate action recording
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        const newAction: RecordedAction = {
          id: `action-${Date.now()}`,
          type: ['click', 'navigate', 'fill', 'scroll'][Math.floor(Math.random() * 4)],
          target: `#element-${Math.floor(Math.random() * 100)}`,
          value: Math.random() > 0.5 ? `value-${Math.floor(Math.random() * 100)}` : undefined,
          timestamp: new Date(),
          url: `https://example.com/page-${Math.floor(Math.random() * 10)}`
        };
        setRecordedActions(prev => [...prev, newAction]);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  // Pattern detection simulation
  useEffect(() => {
    if (recordedActions.length > 5 && recordedActions.length % 5 === 0) {
      const newPattern: Pattern = {
        id: `pattern-${Date.now()}`,
        name: `Mønster ${detectedPatterns.length + 1}`,
        type: 'sequence',
        occurrences: 1,
        confidence: Math.floor(Math.random() * 30 + 70),
        actions: recordedActions.slice(-5).map(a => `${a.type} på ${a.target}`),
        lastSeen: new Date()
      };
      setDetectedPatterns(prev => [...prev, newPattern]);
      
      if (onPatternDetected) {
        onPatternDetected(newPattern);
      }
      
      toast({
        title: 'Nytt mønster oppdaget!',
        description: `AI har identifisert et repeterende mønster i dine handlinger`
      });
    }
  }, [recordedActions, detectedPatterns, onPatternDetected]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast({
        title: 'Opptak startet',
        description: 'AI observerer og lærer fra dine handlinger'
      });
    } else {
      toast({
        title: 'Opptak stoppet',
        description: `${recordedActions.length} handlinger registrert`
      });
    }
  };

  const saveAsWorkflow = () => {
    if (recordedActions.length === 0) {
      toast({
        title: 'Ingen handlinger',
        description: 'Start opptak først for å registrere handlinger',
        variant: 'destructive'
      });
      return;
    }

    if (onSaveAsWorkflow) {
      onSaveAsWorkflow(recordedActions);
    }
    
    toast({
      title: 'Workflow opprettet',
      description: `Workflow med ${recordedActions.length} steg er lagret`
    });
  };

  const clearRecording = () => {
    setRecordedActions([]);
    toast({
      title: 'Opptak tømt',
      description: 'Alle registrerte handlinger er slettet'
    });
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'click': return <MousePointer className="h-3 w-3" />;
      case 'navigate': return <Navigation className="h-3 w-3" />;
      case 'fill': return <FormInput className="h-3 w-3" />;
      case 'scroll': return <Activity className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const getPatternIcon = (type: Pattern['type']) => {
    switch (type) {
      case 'sequence': return <GitBranch className="h-4 w-4" />;
      case 'time-based': return <Clock className="h-4 w-4" />;
      case 'conditional': return <Target className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Learning System
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Auto-læring</span>
            <Switch
              checked={autoLearn}
              onCheckedChange={setAutoLearn}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recording">Opptak</TabsTrigger>
            <TabsTrigger value="patterns">Mønstre</TabsTrigger>
            <TabsTrigger value="insights">Innsikt</TabsTrigger>
          </TabsList>

          <TabsContent value="recording" className="flex-1 flex flex-col">
            {/* Recording Controls */}
            <div className="flex justify-center gap-3 mb-4">
              <Button
                variant={isRecording ? 'destructive' : 'default'}
                onClick={toggleRecording}
                className="w-32"
              >
                {isRecording ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Stopp
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Start opptak
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={clearRecording}>
                Tøm
              </Button>
              <Button variant="outline" onClick={saveAsWorkflow}>
                <Save className="h-4 w-4 mr-2" />
                Lagre workflow
              </Button>
            </div>

            {/* Recording Status */}
            {isRecording && (
              <Card className="mb-4 p-3 bg-red-500/10 border-red-500/20">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Opptak pågår...</span>
                  <Badge variant="outline" className="ml-auto">
                    {recordedActions.length} handlinger
                  </Badge>
                </div>
              </Card>
            )}

            {/* Recorded Actions */}
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {recordedActions.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Start opptak for å registrere handlinger
                    </p>
                  </div>
                ) : (
                  recordedActions.map((action, idx) => (
                    <Card key={action.id} className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                          {idx + 1}
                        </div>
                        {getActionIcon(action.type)}
                        <div className="flex-1">
                          <p className="text-sm font-medium capitalize">{action.type}</p>
                          <p className="text-xs text-muted-foreground">{action.target}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {action.timestamp.toLocaleTimeString('nb-NO')}
                        </p>
                      </div>
                      {action.value && (
                        <p className="text-xs mt-1 ml-8 text-muted-foreground">
                          Verdi: {action.value}
                        </p>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="patterns" className="flex-1">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {(detectedPatterns.length > 0 ? detectedPatterns : mockPatterns).map((pattern) => (
                  <Card key={pattern.id} className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getPatternIcon(pattern.type)}
                        <div>
                          <p className="font-medium">{pattern.name}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {pattern.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-500">
                          {pattern.confidence}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          konfidens
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1 mb-3">
                      {pattern.actions.slice(0, 3).map((action, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground">
                          {idx + 1}. {action}
                        </p>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Sett {pattern.occurrences} ganger
                      </span>
                      <Button size="sm" variant="outline">
                        <Play className="h-3 w-3 mr-1" />
                        Lag workflow
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="insights" className="flex-1">
            <div className="space-y-4">
              {/* Usage Stats */}
              <Card className="p-3">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  Bruksmønster
                </h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Klikk</span>
                      <span>45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Navigasjon</span>
                      <span>30%</span>
                    </div>
                    <Progress value={30} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Form-fylling</span>
                      <span>25%</span>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>
                </div>
              </Card>

              {/* Suggestions */}
              <Card className="p-3">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  AI Anbefalinger
                </h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <p className="font-medium">• Automatiser morgenrutinen</p>
                    <p className="text-xs text-muted-foreground">
                      Du sjekker de samme 5 sidene hver morgen
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">• Bruk keyboard shortcuts</p>
                    <p className="text-xs text-muted-foreground">
                      Spar 30% tid med hurtigtaster
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">• Batch lignende oppgaver</p>
                    <p className="text-xs text-muted-foreground">
                      Grupper lead-kvalifisering for effektivitet
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}