import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, Volume2, Mic, Brain, Zap, 
  TrendingUp, Heart, Sparkles, RefreshCw
} from 'lucide-react';
import { adaptiveSpeech } from '@/lib/adaptiveSpeech';

interface SpeechSettingsProps {
  className?: string;
  onClose?: () => void;
}

export function SpeechSettings({ className = '', onClose }: SpeechSettingsProps) {
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(0.85);
  const [pauseDuration, setPauseDuration] = useState(300);
  const [emotionalResponse, setEmotionalResponse] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  
  useEffect(() => {
    // Load saved preferences
    const prefs = localStorage.getItem('adaptiveSpeechPrefs');
    if (prefs) {
      const parsed = JSON.parse(prefs);
      setSpeed(parsed.preferredSpeed || 1.0);
      setPitch(parsed.preferredPitch || 1.0);
      setVolume(parsed.preferredVolume || 0.85);
      setPauseDuration(parsed.pauseDuration || 300);
      setEmotionalResponse(parsed.enableEmotionalResponse !== false);
    }
    
    // Get analytics
    const stats = adaptiveSpeech.getAnalytics();
    setAnalytics(stats);
  }, []);
  
  const saveSettings = () => {
    adaptiveSpeech.saveUserPreferences({
      preferredSpeed: speed,
      preferredPitch: pitch,
      preferredVolume: volume,
      pauseDuration,
      enableEmotionalResponse: emotionalResponse
    });
    
    if (onClose) {
      onClose();
    }
  };
  
  const resetSettings = () => {
    setSpeed(1.0);
    setPitch(1.0);
    setVolume(0.85);
    setPauseDuration(300);
    setEmotionalResponse(true);
  };
  
  const testVoice = () => {
    adaptiveSpeech.speak(
      'Dette er en test av dine stemmeinnstillinger. Juster hastighet, tonehøyde og volum for best mulig opplevelse.',
      {
        type: 'information',
        urgency: 'low',
        complexity: 'simple',
        responseLength: 'short'
      }
    );
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-500" />
            <div>
              <CardTitle>Adaptive Stemmeinnstillinger</CardTitle>
              <CardDescription className="text-xs">
                Tilpass AI-stemmens respons til dine preferanser
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-purple-500/10">
            <Brain className="h-3 w-3 mr-1" />
            Smart tilpasning
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Speed Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Talehastighet</Label>
            <span className="text-xs text-muted-foreground">{(speed * 100).toFixed(0)}%</span>
          </div>
          <Slider
            value={[speed]}
            onValueChange={(value) => setSpeed(value[0])}
            min={0.5}
            max={1.5}
            step={0.05}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Sakte</span>
            <span>Normal</span>
            <span>Rask</span>
          </div>
        </div>
        
        {/* Pitch Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Tonehøyde</Label>
            <span className="text-xs text-muted-foreground">{(pitch * 100).toFixed(0)}%</span>
          </div>
          <Slider
            value={[pitch]}
            onValueChange={(value) => setPitch(value[0])}
            min={0.5}
            max={1.5}
            step={0.05}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Dyp</span>
            <span>Normal</span>
            <span>Lys</span>
          </div>
        </div>
        
        {/* Volume Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Volum</Label>
            <span className="text-xs text-muted-foreground">{(volume * 100).toFixed(0)}%</span>
          </div>
          <Slider
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            min={0.1}
            max={1.0}
            step={0.05}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <Volume2 className="h-3 w-3" />
            <span>50%</span>
            <Volume2 className="h-3 w-3 text-purple-500" />
          </div>
        </div>
        
        {/* Pause Duration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Pause mellom setninger</Label>
            <span className="text-xs text-muted-foreground">{pauseDuration}ms</span>
          </div>
          <Slider
            value={[pauseDuration]}
            onValueChange={(value) => setPauseDuration(value[0])}
            min={100}
            max={1000}
            step={50}
            className="w-full"
          />
        </div>
        
        {/* Emotional Response */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Emosjonell tilpasning</Label>
            <p className="text-xs text-muted-foreground">
              Tilpass stemme basert på din sinnstilstand
            </p>
          </div>
          <Switch
            checked={emotionalResponse}
            onCheckedChange={setEmotionalResponse}
          />
        </div>
        
        {/* Analytics Display */}
        {analytics && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Bruksstatistikk
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Vanlig type</p>
                <p className="text-sm font-medium capitalize">{analytics.mostCommonType}</p>
              </div>
              <div className="bg-muted rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Snitt kompleksitet</p>
                <p className="text-sm font-medium">{analytics.avgComplexity.toFixed(1)}/3</p>
              </div>
              <div className="bg-muted rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Responslengde</p>
                <p className="text-sm font-medium capitalize">{analytics.avgResponseLength}</p>
              </div>
              <div className="bg-muted rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Totalt antall</p>
                <p className="text-sm font-medium">{analytics.totalSpeechEvents}</p>
              </div>
            </div>
            
            {/* Recent Emotions */}
            {analytics.recentEmotions && analytics.recentEmotions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">Nylige følelser</p>
                <div className="flex gap-1">
                  {analytics.recentEmotions.map((emotion: any, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {emotion.emotion === 'happy' ? '😊' : 
                       emotion.emotion === 'sad' ? '😔' : 
                       emotion.emotion === 'confused' ? '😕' : 
                       emotion.emotion === 'angry' ? '😤' : '😐'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={testVoice}
            className="flex-1"
          >
            <Mic className="h-4 w-4 mr-1" />
            Test stemme
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetSettings}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Tilbakestill
          </Button>
          <Button
            size="sm"
            onClick={saveSettings}
            className="flex-1 bg-purple-500 hover:bg-purple-600"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Lagre
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}