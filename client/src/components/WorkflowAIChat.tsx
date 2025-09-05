import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, Mic, MicOff, Volume2, VolumeX, Bot, User,
  Sparkles, Loader2, ChevronDown, Settings, 
  MessageSquare, Headphones, Zap, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  workflow?: any;
  suggestions?: string[];
  isLoading?: boolean;
}

interface WorkflowAIChatProps {
  workflowId?: string;
  onWorkflowCreated?: (workflow: any) => void;
  className?: string;
}

export function WorkflowAIChat({ workflowId, onWorkflowCreated, className }: WorkflowAIChatProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hei! Jeg er din workflow-assistent. Beskriv hva du ønsker å automatisere, så hjelper jeg deg å lage en arbeidsflyt.',
      timestamp: new Date(),
      suggestions: [
        'Finn 100 potensielle kunder i mitt område',
        'Overvåk konkurrentpriser daglig',
        'Ekstraher data fra LinkedIn-profiler',
        'Test skjemaer på nettsiden min'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState<'text' | 'voice-to-text' | 'voice-to-voice'>('text');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Voice recognition setup
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'nb-NO';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        if (event.results[0].isFinal) {
          setInputValue(transcript);
          if (voiceMode === 'voice-to-voice') {
            handleSendMessage(transcript);
          }
        } else {
          setInputValue(transcript);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, [voiceMode]);
  
  // Auto-scroll to bottom when new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Create AI chat session mutation
  const createChatMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest('/api/workflows/ai-chat', 'POST', {
        workflowId: workflowId || null,
        message,
        context: {
          previousMessages: messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });
    },
    onSuccess: (data: any) => {
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        workflow: data.workflow,
        suggestions: data.suggestions
      };
      
      setMessages(prev => prev.map(m => 
        m.isLoading ? assistantMessage : m
      ));
      
      if (data.workflow && onWorkflowCreated) {
        onWorkflowCreated(data.workflow);
      }
      
      if (voiceMode === 'voice-to-voice' && synthRef.current && data.response) {
        speakMessage(data.response);
      }
    },
    onError: () => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke behandle forespørselen. Vennligst prøv igjen.',
        variant: 'destructive'
      });
      setMessages(prev => prev.filter(m => !m.isLoading));
    }
  });
  
  const handleSendMessage = (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;
    
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    
    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: 'Tenker...',
      timestamp: new Date(),
      isLoading: true
    };
    
    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputValue('');
    
    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const response = generateAIResponse(text);
      setMessages(prev => prev.map(m => 
        m.isLoading ? {
          ...m,
          content: response.content,
          workflow: response.workflow,
          suggestions: response.suggestions,
          isLoading: false
        } : m
      ));
      
      if (voiceMode === 'voice-to-voice' && synthRef.current) {
        speakMessage(response.content);
      }
    }, 1500);
  };
  
  const generateAIResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('finn') && (lowerMessage.includes('kunde') || lowerMessage.includes('lead'))) {
      return {
        content: 'Jeg forstår at du vil finne potensielle kunder. La meg lage en workflow for deg som:\n\n1. Søker etter bedrifter i din bransje\n2. Ekstraherer kontaktinformasjon\n3. Validerer e-postadresser\n4. Eksporterer til Excel\n\nSkal jeg sette opp dette for deg?',
        workflow: {
          name: 'Lead Generation Workflow',
          type: 'data-extraction',
          steps: [
            { type: 'navigate', name: 'Søk Google', config: { url: 'https://google.com' } },
            { type: 'extract', name: 'Ekstraher bedriftsinfo' },
            { type: 'extract', name: 'Finn kontaktdetaljer' },
            { type: 'wait', name: 'Vent', config: { duration: 1000 } }
          ]
        },
        suggestions: [
          'Ja, sett opp workflowen',
          'Legg til LinkedIn-søk også',
          'Kan du filtrere etter område?'
        ]
      };
    }
    
    if (lowerMessage.includes('overvåk') && lowerMessage.includes('pris')) {
      return {
        content: 'Jeg setter opp en prisovervåknings-workflow som:\n\n1. Sjekker spesifikke produktsider\n2. Ekstraherer prisinformasjon\n3. Sammenligner med tidligere priser\n4. Sender varsel ved endringer\n\nVil du at jeg skal kjøre denne daglig?',
        workflow: {
          name: 'Prisovervåkning',
          type: 'monitoring',
          steps: [
            { type: 'navigate', name: 'Gå til produktside' },
            { type: 'extract', name: 'Hent pris' },
            { type: 'condition', name: 'Sjekk prisendring' },
            { type: 'wait', name: 'Vent 24 timer', config: { duration: 86400000 } }
          ]
        },
        suggestions: [
          'Kjør hver time i stedet',
          'Legg til flere konkurrenter',
          'Send e-postvarsel'
        ]
      };
    }
    
    if (lowerMessage.includes('test') && lowerMessage.includes('skjema')) {
      return {
        content: 'Jeg lager en automatisk skjematesting-workflow:\n\n1. Navigerer til skjemasiden\n2. Fyller ut feltene med testdata\n3. Sender skjemaet\n4. Verifiserer at innsendingen fungerer\n\nHvor mange tester vil du kjøre?',
        workflow: {
          name: 'Skjematesting',
          type: 'form-filling',
          steps: [
            { type: 'navigate', name: 'Åpne skjema' },
            { type: 'fill', name: 'Fyll ut skjema' },
            { type: 'click', name: 'Send skjema' },
            { type: 'wait', name: 'Vent på bekreftelse', config: { duration: 2000 } }
          ]
        },
        suggestions: [
          'Kjør 10 tester',
          'Test med ulike datatyper',
          'Inkluder feilscenarier'
        ]
      };
    }
    
    return {
      content: 'Jeg kan hjelpe deg med det! Kan du gi meg litt mer detaljer om hva du ønsker å automatisere? For eksempel:\n\n• Hvilke nettsider skal jeg hente data fra?\n• Hvilken type informasjon trenger du?\n• Hvor ofte skal workflowen kjøre?',
      workflow: null,
      suggestions: [
        'Jeg vil scrape produktdata',
        'Trenger kontaktinformasjon fra bedrifter',
        'Overvåke sosiale medier'
      ]
    };
  };
  
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: 'Ikke støttet',
        description: 'Talegjenkjenning er ikke tilgjengelig i din nettleser.',
        variant: 'destructive'
      });
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };
  
  const speakMessage = (text: string) => {
    if (!synthRef.current) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'nb-NO';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };
  
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    handleSendMessage(suggestion);
  };
  
  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Workflow AI Assistent</CardTitle>
              <p className="text-xs text-muted-foreground">
                Beskriv hva du vil automatisere
              </p>
            </div>
          </div>
          
          {/* Voice Mode Selector */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={voiceMode === 'text' ? 'default' : 'outline'}
              onClick={() => setVoiceMode('text')}
              data-testid="button-text-mode"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={voiceMode === 'voice-to-text' ? 'default' : 'outline'}
              onClick={() => setVoiceMode('voice-to-text')}
              data-testid="button-voice-to-text"
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={voiceMode === 'voice-to-voice' ? 'default' : 'outline'}
              onClick={() => setVoiceMode('voice-to-voice')}
              data-testid="button-voice-to-voice"
            >
              <Headphones className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {/* Messages Area */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600">
                      <Bot className="w-4 h-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[70%] ${
                  message.role === 'user' ? 'order-1' : 'order-2'
                }`}>
                  <Card className={`p-3 ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-muted'
                  }`}>
                    {message.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Tenker...</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {message.workflow && (
                          <div className="mt-3 p-2 bg-background/10 rounded">
                            <div className="flex items-center gap-2 mb-2">
                              <Wand2 className="w-4 h-4" />
                              <span className="text-xs font-medium">
                                Foreslått Workflow
                              </span>
                            </div>
                            <div className="text-xs space-y-1">
                              <div>📋 {message.workflow.name}</div>
                              <div>⚙️ {message.workflow.steps?.length || 0} steg</div>
                            </div>
                            <Button 
                              size="sm" 
                              className="mt-2 w-full"
                              variant={message.role === 'user' ? 'secondary' : 'default'}
                              onClick={() => onWorkflowCreated && onWorkflowCreated(message.workflow)}
                              data-testid="button-create-workflow"
                            >
                              Opprett Workflow
                            </Button>
                          </div>
                        )}
                        
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs opacity-70">Forslag:</p>
                            {message.suggestions.map((suggestion, idx) => (
                              <Button
                                key={idx}
                                size="sm"
                                variant="outline"
                                className="text-xs w-full justify-start"
                                onClick={() => handleSuggestionClick(suggestion)}
                                data-testid={`button-suggestion-${idx}`}
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </Card>
                  <div className="text-xs text-muted-foreground mt-1 px-1">
                    {new Date(message.timestamp).toLocaleTimeString('nb-NO', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <Avatar className="w-8 h-8 order-2">
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
      
      {/* Input Area */}
      <CardFooter className="border-t p-4">
        <div className="flex items-center gap-2 w-full">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={
              voiceMode === 'voice-to-voice' 
                ? 'Trykk mikrofon for å snakke...'
                : 'Beskriv hva du vil automatisere...'
            }
            disabled={isRecording || isProcessing}
            className="flex-1"
            data-testid="input-message"
          />
          
          {voiceMode !== 'text' && (
            <Button
              size="icon"
              variant={isRecording ? 'destructive' : 'outline'}
              onClick={toggleRecording}
              disabled={isProcessing}
              data-testid="button-toggle-recording"
            >
              {isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          )}
          
          {isSpeaking && (
            <Button
              size="icon"
              variant="outline"
              onClick={stopSpeaking}
              data-testid="button-stop-speaking"
            >
              <VolumeX className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isProcessing}
            data-testid="button-send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mt-2 text-sm text-muted-foreground"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-red-500 rounded-full"
            />
            Lytter...
          </motion.div>
        )}
      </CardFooter>
    </Card>
  );
}