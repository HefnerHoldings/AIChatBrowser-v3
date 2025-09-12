import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useCredits } from '@/hooks/useCredits';
import { 
  Zap, 
  Brain, 
  AlertTriangle, 
  Info,
  Sparkles,
  Gauge,
  DollarSign,
  Clock,
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  creditCost: number;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'basic' | 'standard' | 'premium';
  capabilities: string[];
  recommended?: boolean;
  new?: boolean;
}

const models: AIModel[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Rask og kostnadseffektiv for enkle oppgaver',
    creditCost: 1,
    speed: 'fast',
    quality: 'basic',
    capabilities: [
      'Tekstgenerering',
      'Enkel analyse',
      'Grunnleggende chat'
    ]
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Avansert modell for komplekse oppgaver',
    creditCost: 25,
    speed: 'medium',
    quality: 'premium',
    recommended: true,
    capabilities: [
      'Avansert resonnering',
      'Kodeanalyse',
      'Kreativ skriving',
      'Multimodal forståelse'
    ]
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    description: 'Balansert ytelse og kvalitet',
    creditCost: 10,
    speed: 'medium',
    quality: 'standard',
    new: true,
    capabilities: [
      'Lang kontekst',
      'Detaljert analyse',
      'Nøyaktig faktasjekking'
    ]
  },
  {
    id: 'llama-3',
    name: 'Llama 3',
    description: 'Open source alternativ med god ytelse',
    creditCost: 5,
    speed: 'fast',
    quality: 'standard',
    capabilities: [
      'Multilingual',
      'Kodegenerering',
      'Instruksjonsfølging'
    ]
  }
];

interface AIModelSelectorProps {
  selectedModel?: string;
  onModelSelect: (modelId: string) => void;
  showCreditWarning?: boolean;
}

export function AIModelSelector({ 
  selectedModel = 'gpt-4o-mini', 
  onModelSelect,
  showCreditWarning = true 
}: AIModelSelectorProps) {
  const { balance } = useCredits();
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);

  const selected = models.find(m => m.id === selectedModel) || models[0];
  const hasEnoughCredits = (cost: number) => (balance || 0) >= cost;

  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case 'fast':
        return <Gauge className="h-3 w-3 text-green-500" />;
      case 'medium':
        return <Gauge className="h-3 w-3 text-yellow-500" />;
      case 'slow':
        return <Gauge className="h-3 w-3 text-orange-500" />;
      default:
        return null;
    }
  };

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case 'basic':
        return <Badge variant="secondary">Grunnleggende</Badge>;
      case 'standard':
        return <Badge variant="secondary">Standard</Badge>;
      case 'premium':
        return <Badge variant="default">Premium</Badge>;
      default:
        return null;
    }
  };

  const handleModelSelect = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (model && !hasEnoughCredits(model.creditCost)) {
      // Show fallback suggestion
      const affordableModels = models.filter(m => hasEnoughCredits(m.creditCost));
      if (affordableModels.length > 0) {
        const suggested = affordableModels[0];
        if (window.confirm(
          `Du har ikke nok kreditter for ${model.name} (${model.creditCost} kreditter).\n\n` +
          `Vil du bruke ${suggested.name} i stedet? (${suggested.creditCost} kreditt)`
        )) {
          onModelSelect(suggested.id);
          return;
        }
      }
      return;
    }
    onModelSelect(modelId);
  };

  return (
    <Card data-testid="ai-model-selector">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Velg AI-modell
        </CardTitle>
        <CardDescription>
          Velg modellen som passer best for din oppgave
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Balance Display */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Din saldo:</span>
          </div>
          <Badge variant="secondary" className="font-bold">
            {balance?.toLocaleString('nb-NO') || 0} kreditter
          </Badge>
        </div>

        <Separator />

        {/* Model Selection */}
        <RadioGroup value={selectedModel} onValueChange={handleModelSelect}>
          <div className="space-y-3">
            {models.map((model, index) => {
              const sufficient = hasEnoughCredits(model.creditCost);
              
              return (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onMouseEnter={() => setHoveredModel(model.id)}
                  onMouseLeave={() => setHoveredModel(null)}
                >
                  <Label 
                    htmlFor={model.id}
                    className={`block cursor-pointer ${!sufficient ? 'opacity-50' : ''}`}
                    data-testid={`model-option-${model.id}`}
                  >
                    <Card className={`p-4 transition-all ${
                      selectedModel === model.id ? 'border-primary' : ''
                    } ${hoveredModel === model.id ? 'shadow-md' : ''}`}>
                      <div className="flex items-start gap-3">
                        <RadioGroupItem 
                          value={model.id} 
                          id={model.id}
                          disabled={!sufficient}
                        />
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{model.name}</span>
                              {model.recommended && (
                                <Badge variant="default" className="text-xs">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Anbefalt
                                </Badge>
                              )}
                              {model.new && (
                                <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500">
                                  Ny
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {getSpeedIcon(model.speed)}
                              {getQualityBadge(model.quality)}
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {model.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {model.capabilities.slice(0, 2).map((cap, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {cap}
                                </Badge>
                              ))}
                              {model.capabilities.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{model.capabilities.length - 2}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Zap className={`h-4 w-4 ${
                                sufficient ? 'text-primary' : 'text-destructive'
                              }`} />
                              <span className={`font-bold ${
                                sufficient ? 'text-primary' : 'text-destructive'
                              }`} data-testid={`credit-cost-${model.id}`}>
                                {model.creditCost} {model.creditCost === 1 ? 'kreditt' : 'kreditter'}
                              </span>
                            </div>
                          </div>
                          
                          {!sufficient && (
                            <Alert className="py-2">
                              <AlertTriangle className="h-3 w-3" />
                              <AlertDescription className="text-xs">
                                Ikke nok kreditter for denne modellen
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Label>
                </motion.div>
              );
            })}
          </div>
        </RadioGroup>

        {/* Credit Warning */}
        {showCreditWarning && balance !== undefined && balance < 10 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Du har lite kreditter igjen. Vurder å kjøpe flere for uavbrutt bruk.
            </AlertDescription>
          </Alert>
        )}

        {/* Selected Model Info */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Valgt modell:</span>
            <span className="text-sm">{selected.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Kostnad per melding:</span>
            <Badge variant="secondary">
              {selected.creditCost} {selected.creditCost === 1 ? 'kreditt' : 'kreditter'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}