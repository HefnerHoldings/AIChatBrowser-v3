import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  Brain, 
  Eye,
  EyeOff,
  Activity,
  Lightbulb,
  Volume2,
  VolumeX,
  Headphones,
  MessageSquare,
  Sparkles,
  Zap,
  User,
  Copy,
  RefreshCw,
  Trash2,
  Download,
  Settings
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: {
    url?: string;
    pageTitle?: string;
    selectedText?: string;
  };
}

interface BrowserContext {
  url: string;
  title: string;
  selectedText?: string;
  viewport?: {
    width: number;
    height: number;
  };
}

interface ChatResponse {
  message: string;
}

interface TTSResponse {
  audioUrl: string;
}

interface STTResponse {
  text: string;
}

export function AIChatSidebar() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('default');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Hent chat-historikk
  const { data: sessions } = useQuery({
    queryKey: ['/api/ai-chat/sessions'],
    refetchInterval: false,
  });

  // Hent gjeldende nettleser-kontekst
  const { data: browserContext } = useQuery<BrowserContext>({
    queryKey: ['/api/browser-engine/context'],
    refetchInterval: 5000,
  });

  // Send melding til AI
  const sendMessage = useMutation({
    mutationFn: async (message: string): Promise<ChatResponse> => {
      const context = browserContext ? {
        url: browserContext.url,
        pageTitle: browserContext.title,
        selectedText: browserContext.selectedText,
      } : undefined;

      const response = await fetch('/api/ai-chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          message,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: (response: ChatResponse) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Auto-speak hvis aktivert
      if (autoSpeak && response.message) {
        speakText(response.message);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/ai-chat/sessions'] });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke sende melding til AI-assistenten',
        variant: 'destructive',
      });
    },
  });

  // Håndter innsending av melding
  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      context: browserContext ? {
        url: browserContext.url,
        pageTitle: browserContext.title,
      } : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    sendMessage.mutate(input);
    setInput('');
  };

  // Tale-til-tekst (STT)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result?.toString().split(',')[1];
          if (!base64) return;

          try {
            const response = await fetch('/api/ai-chat/speech-to-text', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ audio: base64 }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to convert speech to text');
            }
            
            const data: STTResponse = await response.json();
            
            if (data.text) {
              setInput(data.text);
            }
          } catch (error) {
            toast({
              title: 'Feil',
              description: 'Kunne ikke konvertere tale til tekst',
              variant: 'destructive',
            });
          }
        };
        reader.readAsDataURL(blob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Stopp opptak etter 30 sekunder
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 30000);

      // Lagre recorder for manuell stopp
      (window as any).currentRecorder = mediaRecorder;
    } catch (error) {
      toast({
        title: 'Feil',
        description: 'Kunne ikke starte opptak. Sjekk mikrofontilgang.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    const recorder = (window as any).currentRecorder;
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
      setIsRecording(false);
    }
  };

  // Tekst-til-tale (TTS)
  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);
      const response = await fetch('/api/ai-chat/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const data: TTSResponse = await response.json();

      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.onended = () => setIsSpeaking(false);
        audio.play();
      }
    } catch (error) {
      setIsSpeaking(false);
      toast({
        title: 'Feil',
        description: 'Kunne ikke spille av lyd',
        variant: 'destructive',
      });
    }
  };

  const stopSpeaking = () => {
    // Stopp alle lydavspillinger
    const audios = document.querySelectorAll('audio');
    audios.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    setIsSpeaking(false);
  };

  // Kopier melding
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Kopiert!',
      description: 'Meldingen er kopiert til utklippstavlen',
    });
  };

  // Tøm chat
  const clearChat = () => {
    setMessages([]);
    toast({
      title: 'Chat tømt',
      description: 'Alle meldinger er fjernet',
    });
  };

  // Last ned chat-historikk
  const downloadChat = () => {
    const chatData = {
      sessionId: currentSessionId,
      messages: messages,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${currentSessionId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-scroll til bunn
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">AI Assistent</h2>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-chat-settings">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={clearChat}>
                <Trash2 className="h-4 w-4 mr-2" />
                Tøm chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadChat}>
                <Download className="h-4 w-4 mr-2" />
                Last ned historikk
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="p-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-speak" className="text-sm">Auto-opplesning</Label>
                  <Switch
                    id="auto-speak"
                    checked={autoSpeak}
                    onCheckedChange={setAutoSpeak}
                  />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Kontekst-info */}
        {browserContext && browserContext.url && (
          <Card className="p-2 bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Analyserer: {browserContext.title || browserContext.url}
            </p>
          </Card>
        )}
      </div>


      {/* Meldinger */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Hei! Jeg er din AI-assistent</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Jeg kan hjelpe deg med å navigere nettet, analysere sider, 
              automatisere oppgaver og svare på spørsmål.
            </p>
            <div className="grid gap-2 w-full max-w-sm">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setInput("Hva kan du hjelpe meg med?")}
                className="justify-start"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Hva kan du gjøre?
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setInput("Analyser denne siden")}
                className="justify-start"
              >
                <Bot className="h-4 w-4 mr-2" />
                Analyser siden
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.context && message.context.url && (
                    <p className="text-xs opacity-70 mt-2">
                      📍 {message.context.pageTitle || message.context.url}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyMessage(message.content)}
                      data-testid={`button-copy-${message.id}`}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {message.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => speakText(message.content)}
                        data-testid={`button-speak-${message.id}`}
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {sendMessage.isPending && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input-område */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Skriv din melding her... (Shift+Enter for ny linje)"
              className="min-h-[60px] pr-10 resize-none"
              data-testid="input-chat-message"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-2 right-2 h-8 w-8"
              onClick={isRecording ? stopRecording : startRecording}
              data-testid="button-voice-input"
            >
              {isRecording ? (
                <MicOff className="h-4 w-4 text-destructive animate-pulse" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sendMessage.isPending}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
            
            {isSpeaking && (
              <Button
                variant="outline"
                size="icon"
                onClick={stopSpeaking}
                data-testid="button-stop-speaking"
              >
                <VolumeX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Raske handlinger */}
        <div className="flex gap-2 mt-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setInput("Analyser denne siden og gi meg et sammendrag");
              handleSend();
            }}
            className="text-xs"
          >
            Analyser side
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setInput("Finn alle kontaktdetaljer på denne siden");
              handleSend();
            }}
            className="text-xs"
          >
            Finn kontaktinfo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setInput("Lag en automatisering for denne oppgaven");
              handleSend();
            }}
            className="text-xs"
          >
            Automatiser
          </Button>
        </div>
      </div>
    </div>
  );
}