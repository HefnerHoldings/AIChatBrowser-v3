import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
  Zap
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export function AIChatSidebar() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hei! Jeg er din AI-assistent. Hvordan kan jeg hjelpe deg i dag?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Simuler AI-svar
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `Jeg forstår at du vil: "${inputText}". La meg hjelpe deg med det...`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Start opptak
      setVoiceTranscript('Lytter...');
      setTimeout(() => {
        setVoiceTranscript('Start ny workflow med data scraping');
        setIsRecording(false);
      }, 3000);
    } else {
      // Stopp opptak
      setVoiceTranscript('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            GPT-5
          </Badge>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          {/* Voice Control Button */}
          <Button
            size="sm"
            variant={isRecording ? 'destructive' : 'outline'}
            onClick={handleVoiceToggle}
            className="flex-1"
          >
            {isRecording ? (
              <>
                <MicOff className="h-4 w-4 mr-1" />
                Stopp
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-1" />
                Voice
              </>
            )}
          </Button>

          {/* Learning Toggle */}
          <Button
            size="sm"
            variant={isLearning ? 'default' : 'outline'}
            onClick={() => setIsLearning(!isLearning)}
            className="flex-1"
          >
            {isLearning ? (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Lærer
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-1" />
                Learn
              </>
            )}
          </Button>

          {/* Voice Output Toggle */}
          <Button
            size="icon"
            variant={voiceEnabled ? 'default' : 'outline'}
            onClick={() => setVoiceEnabled(!voiceEnabled)}
          >
            {voiceEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Voice Transcript */}
        {isRecording && voiceTranscript && (
          <Card className="mt-2 p-2 bg-primary/10">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs">{voiceTranscript}</span>
            </div>
          </Card>
        )}

        {/* Learning Status */}
        {isLearning && (
          <Card className="mt-2 p-2 bg-green-500/10">
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-green-500 animate-pulse" />
              <span className="text-xs">Registrerer handlinger og lærer mønstre...</span>
            </div>
          </Card>
        )}
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`max-w-[80%] p-3 ${
                message.sender === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}>
                <div className="flex items-start gap-2">
                  {message.sender === 'ai' && (
                    <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="space-y-1">
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString('nb-NO', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* AI Suggestions */}
      <div className="p-3 border-t bg-muted/30">
        <p className="text-xs font-medium mb-2 text-muted-foreground">Forslag:</p>
        <div className="flex flex-wrap gap-1">
          {[
            'Start workflow',
            'Ekstraher data',
            'Analyser side',
            'Generer rapport'
          ].map((suggestion) => (
            <Badge
              key={suggestion}
              variant="secondary"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
              onClick={() => setInputText(suggestion)}
            >
              <Lightbulb className="h-3 w-3 mr-1" />
              {suggestion}
            </Badge>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Skriv din melding her... (Shift+Enter for ny linje)"
            className="min-h-[60px] resize-none"
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleVoiceToggle}
              className={isRecording ? 'bg-red-500 text-white' : ''}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-muted/50 border-t">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-green-500" />
              <span>Online</span>
            </div>
            {isLearning && (
              <div className="flex items-center gap-1">
                <Brain className="h-3 w-3 text-purple-500 animate-pulse" />
                <span>Lærer</span>
              </div>
            )}
            {voiceEnabled && (
              <div className="flex items-center gap-1">
                <Headphones className="h-3 w-3 text-blue-500" />
                <span>Voice</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-5 px-2 text-xs">
            <Zap className="h-3 w-3 mr-1" />
            Hurtig
          </Button>
        </div>
      </div>
    </div>
  );
}