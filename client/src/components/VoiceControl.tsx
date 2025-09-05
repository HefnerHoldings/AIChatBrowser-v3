import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Mic, MicOff, Volume2, VolumeX, Settings, 
  Play, Pause, Square, Headphones, AudioLines,
  Zap, BrainCircuit, Languages, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceCommand {
  command: string;
  action: string;
  confidence: number;
  timestamp: Date;
}

interface VoiceControlProps {
  onCommand?: (command: VoiceCommand) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  className?: string;
}

export function VoiceControl({ onCommand, onTranscript, className }: VoiceControlProps) {
  const { toast } = useToast();
  
  // State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [voiceMode, setVoiceMode] = useState<'commands' | 'dictation' | 'conversation'>('conversation');
  const [language, setLanguage] = useState('nb-NO');
  const [volume, setVolume] = useState([1.0]);
  const [speechRate, setSpeechRate] = useState([1.0]);
  const [pitch, setPitch] = useState([1.0]);
  const [autoListen, setAutoListen] = useState(false);
  const [soundLevel, setSoundLevel] = useState(0);
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;
      recognitionRef.current.maxAlternatives = 3;
      
      recognitionRef.current.onstart = () => {
        console.log('Voice recognition started');
        setIsListening(true);
        startAudioAnalyzer();
      };
      
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscriptText = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          if (event.results[i].isFinal) {
            finalTranscriptText += transcript + ' ';
            
            // Process command if in command mode
            if (voiceMode === 'commands') {
              processCommand(transcript, confidence);
            }
            
            if (onTranscript) {
              onTranscript(transcript, true);
            }
          } else {
            interimTranscript += transcript;
            if (onTranscript) {
              onTranscript(transcript, false);
            }
          }
        }
        
        setCurrentTranscript(interimTranscript);
        if (finalTranscriptText) {
          setFinalTranscript(prev => prev + ' ' + finalTranscriptText);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Voice recognition error:', event.error);
        
        if (event.error === 'no-speech') {
          toast({
            title: 'Ingen tale oppdaget',
            description: 'Prøv å snakke tydeligere eller justere mikrofonen.',
          });
        } else if (event.error === 'not-allowed') {
          toast({
            title: 'Mikrofon ikke tillatt',
            description: 'Vennligst gi tilgang til mikrofonen.',
            variant: 'destructive'
          });
        }
        
        setIsListening(false);
        stopAudioAnalyzer();
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        stopAudioAnalyzer();
        
        if (autoListen) {
          setTimeout(() => startListening(), 500);
        }
      };
    }
    
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    
    return () => {
      stopListening();
      stopAudioAnalyzer();
    };
  }, [language, voiceMode, autoListen, onTranscript]);
  
  // Process voice commands
  const processCommand = (text: string, confidence: number) => {
    const lowerText = text.toLowerCase().trim();
    let action = '';
    
    // Norwegian commands
    const commandMap: Record<string, string> = {
      'åpne ny fane': 'new-tab',
      'lukk fane': 'close-tab',
      'gå tilbake': 'go-back',
      'gå fremover': 'go-forward',
      'oppdater': 'refresh',
      'rull ned': 'scroll-down',
      'rull opp': 'scroll-up',
      'søk etter': 'search',
      'lag workflow': 'create-workflow',
      'start workflow': 'start-workflow',
      'stopp workflow': 'stop-workflow',
      'eksporter data': 'export-data',
      'vis hjelp': 'show-help',
      'åpne innstillinger': 'open-settings'
    };
    
    for (const [cmd, act] of Object.entries(commandMap)) {
      if (lowerText.includes(cmd)) {
        action = act;
        break;
      }
    }
    
    if (action) {
      const command: VoiceCommand = {
        command: text,
        action,
        confidence,
        timestamp: new Date()
      };
      
      setCommandHistory(prev => [command, ...prev].slice(0, 10));
      
      if (onCommand) {
        onCommand(command);
      }
      
      // Give audio feedback
      speakText(`Utfører: ${text}`, true);
    }
  };
  
  // Start listening
  const startListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: 'Ikke støttet',
        description: 'Talegjenkjenning er ikke tilgjengelig i din nettleser.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      recognitionRef.current.lang = language;
      recognitionRef.current.start();
      setCurrentTranscript('');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
    }
  };
  
  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };
  
  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  // Text-to-speech
  const speakText = (text: string, isShort?: boolean) => {
    if (!synthRef.current) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.volume = volume[0];
    utterance.rate = speechRate[0];
    utterance.pitch = pitch[0];
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };
  
  // Stop speaking
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };
  
  // Audio analyzer for visual feedback
  const startAudioAnalyzer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      microphoneRef.current.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const animate = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setSoundLevel(average / 255);
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };
  
  const stopAudioAnalyzer = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setSoundLevel(0);
  };
  
  // Clear transcript
  const clearTranscript = () => {
    setCurrentTranscript('');
    setFinalTranscript('');
  };
  
  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Voice Control</CardTitle>
              <p className="text-xs text-muted-foreground">
                Snakk for å kontrollere browseren
              </p>
            </div>
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            data-testid="button-voice-settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Controls */}
        <div className="flex items-center justify-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              variant={isListening ? 'destructive' : 'default'}
              onClick={toggleListening}
              className="relative"
              data-testid="button-toggle-voice"
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5 mr-2" />
                  Stopp
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  Start
                </>
              )}
              
              {isListening && (
                <motion.div
                  className="absolute -inset-1 rounded-lg bg-red-500/20"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </Button>
          </motion.div>
          
          {isSpeaking && (
            <Button
              size="lg"
              variant="outline"
              onClick={stopSpeaking}
              data-testid="button-stop-speech"
            >
              <VolumeX className="w-5 h-5 mr-2" />
              Stopp Tale
            </Button>
          )}
        </div>
        
        {/* Audio Level Indicator */}
        {isListening && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AudioLines className="w-4 h-4 text-muted-foreground" />
              <Progress value={soundLevel * 100} className="flex-1" />
            </div>
          </div>
        )}
        
        {/* Voice Mode Selector */}
        <div className="flex items-center gap-2">
          <Badge
            variant={voiceMode === 'commands' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setVoiceMode('commands')}
            data-testid="badge-commands-mode"
          >
            <Zap className="w-3 h-3 mr-1" />
            Kommandoer
          </Badge>
          <Badge
            variant={voiceMode === 'dictation' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setVoiceMode('dictation')}
            data-testid="badge-dictation-mode"
          >
            <Languages className="w-3 h-3 mr-1" />
            Diktering
          </Badge>
          <Badge
            variant={voiceMode === 'conversation' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setVoiceMode('conversation')}
            data-testid="badge-conversation-mode"
          >
            <BrainCircuit className="w-3 h-3 mr-1" />
            Samtale
          </Badge>
        </div>
        
        {/* Transcript Display */}
        {(currentTranscript || finalTranscript) && (
          <div className="p-3 bg-muted rounded-lg space-y-2">
            {currentTranscript && (
              <div className="text-sm text-muted-foreground italic">
                {currentTranscript}
              </div>
            )}
            {finalTranscript && (
              <div className="text-sm">
                {finalTranscript}
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={clearTranscript}
              className="mt-2"
              data-testid="button-clear-transcript"
            >
              Tøm
            </Button>
          </div>
        )}
        
        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-4 border-t"
            >
              {/* Language Selection */}
              <div className="space-y-2">
                <Label>Språk</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nb-NO">Norsk</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="de-DE">Deutsch</SelectItem>
                    <SelectItem value="fr-FR">Français</SelectItem>
                    <SelectItem value="es-ES">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Auto Listen */}
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-listen">Auto-lytting</Label>
                <Switch
                  id="auto-listen"
                  checked={autoListen}
                  onCheckedChange={setAutoListen}
                  data-testid="switch-auto-listen"
                />
              </div>
              
              {/* Voice Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Volum: {Math.round(volume[0] * 100)}%</Label>
                  <Slider
                    value={volume}
                    onValueChange={setVolume}
                    max={1}
                    min={0}
                    step={0.1}
                    data-testid="slider-volume"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Hastighet: {speechRate[0]}x</Label>
                  <Slider
                    value={speechRate}
                    onValueChange={setSpeechRate}
                    max={2}
                    min={0.5}
                    step={0.1}
                    data-testid="slider-speed"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Tonehøyde: {pitch[0]}</Label>
                  <Slider
                    value={pitch}
                    onValueChange={setPitch}
                    max={2}
                    min={0.5}
                    step={0.1}
                    data-testid="slider-pitch"
                  />
                </div>
              </div>
              
              {/* Test Speech */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => speakText('Dette er en test av talesyntesen. Hører du meg tydelig?')}
                className="w-full"
                data-testid="button-test-speech"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Test Talesyntese
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Command History */}
        {commandHistory.length > 0 && voiceMode === 'commands' && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Siste kommandoer</Label>
            <div className="space-y-1">
              {commandHistory.slice(0, 3).map((cmd, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-muted rounded text-xs"
                  data-testid={`command-history-${idx}`}
                >
                  <span>{cmd.command}</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(cmd.confidence * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}