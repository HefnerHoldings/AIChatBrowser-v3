import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Headphones,
  Activity,
  Zap,
  Bot,
  MessageSquare
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface VoiceInterfaceProps {
  onCommand?: (command: string) => void;
  isActive?: boolean;
}

export function VoiceInterface({ onCommand, isActive = false }: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [voiceHistory, setVoiceHistory] = useState<Array<{
    id: string;
    type: 'input' | 'output';
    text: string;
    timestamp: Date;
  }>>([]);

  // Simulate voice level animation
  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        setVoiceLevel(Math.random() * 100);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setVoiceLevel(0);
    }
  }, [isListening]);

  const startListening = () => {
    setIsListening(true);
    toast({
      title: 'Lytter...',
      description: 'Snakk nå for å gi kommandoer'
    });

    // Simulate voice recognition
    setTimeout(() => {
      const command = 'Gå til finn.no og søk etter IT-konsulenter';
      setTranscript(command);
      addToHistory('input', command);
      if (onCommand) {
        onCommand(command);
      }
      stopListening();
    }, 3000);
  };

  const stopListening = () => {
    setIsListening(false);
    setTranscript('');
  };

  const speak = (text: string) => {
    setIsSpeaking(true);
    addToHistory('output', text);
    
    // Simulate TTS
    setTimeout(() => {
      setIsSpeaking(false);
    }, 2000);
  };

  const addToHistory = (type: 'input' | 'output', text: string) => {
    setVoiceHistory(prev => [...prev, {
      id: `voice-${Date.now()}`,
      type,
      text,
      timestamp: new Date()
    }]);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Voice Interface
          </span>
          <Badge variant={isActive ? 'default' : 'outline'}>
            {isActive ? 'Aktiv' : 'Inaktiv'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Voice Controls */}
        <div className="flex justify-center gap-4 mb-6">
          <Button
            size="lg"
            variant={isListening ? 'destructive' : 'default'}
            onClick={isListening ? stopListening : startListening}
            className="rounded-full h-20 w-20"
          >
            {isListening ? (
              <MicOff className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
          
          <Button
            size="lg"
            variant={isSpeaking ? 'secondary' : 'outline'}
            onClick={() => speak('Hei, jeg er din AI-assistent')}
            className="rounded-full h-20 w-20"
          >
            {isSpeaking ? (
              <Volume2 className="h-8 w-8" />
            ) : (
              <VolumeX className="h-8 w-8" />
            )}
          </Button>
        </div>

        {/* Voice Level Indicator */}
        {isListening && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm">Lydnivå</span>
            </div>
            <Progress value={voiceLevel} className="h-2" />
          </div>
        )}

        {/* Current Transcript */}
        {transcript && (
          <Card className="mb-6 p-4 bg-primary/10">
            <p className="text-sm font-medium mb-1">Gjenkjent tekst:</p>
            <p className="text-lg">{transcript}</p>
          </Card>
        )}

        {/* Voice History */}
        <div className="flex-1">
          <h4 className="font-medium text-sm mb-3">Voice Historikk</h4>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {voiceHistory.map((item) => (
                <Card
                  key={item.id}
                  className={`p-3 ${
                    item.type === 'input' 
                      ? 'bg-blue-500/10 border-blue-500/20' 
                      : 'bg-green-500/10 border-green-500/20'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {item.type === 'input' ? (
                      <Mic className="h-4 w-4 mt-0.5" />
                    ) : (
                      <Volume2 className="h-4 w-4 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{item.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.timestamp.toLocaleTimeString('nb-NO')}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Voice Commands */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs font-medium mb-2">Eksempel kommandoer:</p>
          <div className="space-y-1">
            <p className="text-xs">• "Start workflow"</p>
            <p className="text-xs">• "Gå til finn.no"</p>
            <p className="text-xs">• "Ekstraher kontaktinfo"</p>
            <p className="text-xs">• "Eksporter til Excel"</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}