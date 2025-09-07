import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bot,
  Brain,
  Sparkles,
  Send,
  Lightbulb,
  Code,
  Wand2,
  MessageSquare,
  Zap,
  Target
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AIAssistantProps {
  onSuggestion?: (suggestion: string) => void;
  context?: any;
}

export function AIAssistant({ onSuggestion, context }: AIAssistantProps) {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [isThinking, setIsThinking] = useState(false);
  
  const suggestions = [
    {
      title: 'Optimaliser workflow',
      description: 'Fjern unødvendige steg og forbedre ytelse',
      icon: <Zap className="h-4 w-4" />
    },
    {
      title: 'Legg til error handling',
      description: 'Håndter feil og edge cases bedre',
      icon: <Target className="h-4 w-4" />
    },
    {
      title: 'Parallelliser oppgaver',
      description: 'Kjør uavhengige oppgaver samtidig',
      icon: <Sparkles className="h-4 w-4" />
    }
  ];

  const templates = [
    {
      name: 'Lead Generation',
      description: 'Komplett workflow for å finne og kvalifisere leads',
      nodes: 12
    },
    {
      name: 'Price Monitor',
      description: 'Overvåk priser og få varsler ved endringer',
      nodes: 8
    },
    {
      name: 'Content Scraper',
      description: 'Ekstraher innhold fra nettsider',
      nodes: 6
    }
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    
    setIsThinking(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setIsThinking(false);
      toast({
        title: 'AI Forslag',
        description: 'Workflow optimalisert med AI'
      });
      if (onSuggestion) {
        onSuggestion(input);
      }
      setInput('');
    }, 2000);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Workflow Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="suggestions">Forslag</TabsTrigger>
            <TabsTrigger value="templates">Maler</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 mb-4">
              <div className="space-y-4">
                {/* Chat messages would go here */}
                <Card className="p-3 bg-muted">
                  <div className="flex items-start gap-2">
                    <Bot className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="text-sm">
                        Hei! Jeg er din AI workflow-assistent. Jeg kan hjelpe deg med:
                      </p>
                      <ul className="text-xs mt-2 space-y-1">
                        <li>• Bygge workflows fra naturlig språk</li>
                        <li>• Optimalisere eksisterende workflows</li>
                        <li>• Foreslå forbedringer</li>
                        <li>• Løse problemer</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            </ScrollArea>
            
            <div className="space-y-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Beskriv hva du ønsker å automatisere..."
                className="min-h-[100px]"
              />
              <Button 
                onClick={handleSend} 
                className="w-full"
                disabled={isThinking}
              >
                {isThinking ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-pulse" />
                    Tenker...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send til AI
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="flex-1">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {suggestions.map((suggestion, idx) => (
                  <Card 
                    key={idx}
                    className="p-3 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => {
                      if (onSuggestion) {
                        onSuggestion(suggestion.title);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded">
                        {suggestion.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{suggestion.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {suggestion.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="templates" className="flex-1">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {templates.map((template, idx) => (
                  <Card 
                    key={idx}
                    className="p-4 cursor-pointer hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant="secondary">
                        {template.nodes} noder
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                    <Button size="sm" className="w-full mt-3" variant="outline">
                      <Wand2 className="h-4 w-4 mr-2" />
                      Bruk mal
                    </Button>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}