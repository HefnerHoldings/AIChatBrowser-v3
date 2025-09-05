import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Brain,
  MessageSquare,
  Sparkles,
  FileText,
  Shield,
  Search,
  Zap,
  Eye,
  EyeOff,
  Lightbulb,
  Target,
  Wand2,
  Bot,
  RefreshCw,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  AlertCircle,
  TrendingUp,
  Lock,
  Unlock,
  Languages,
  BookOpen,
  PenTool,
  Calculator,
  Globe,
  History,
  ChevronRight,
  Loader2,
  Cpu,
  Gauge,
  BarChart3,
  Activity,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIAssistantProps {
  currentUrl?: string;
  pageContent?: string;
  onNavigate?: (url: string) => void;
  onFormFill?: (data: any) => void;
  onSearch?: (query: string) => void;
}

interface AIResponse {
  id: string;
  type: 'summary' | 'suggestion' | 'command' | 'translation' | 'analysis' | 'form-fill';
  content: string;
  confidence: number;
  metadata?: any;
  timestamp: Date;
}

interface SmartSuggestion {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  priority: number;
}

export function AIAssistant({
  currentUrl,
  pageContent,
  onNavigate,
  onFormFill,
  onSearch
}: AIAssistantProps) {
  const [activeMode, setActiveMode] = useState<'chat' | 'summary' | 'assist' | 'analyze'>('chat');
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoComplete, setAutoComplete] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognition = useRef<any>(null);
  const speechSynthesis = useRef<SpeechSynthesisUtterance | null>(null);

  // AI Model Stats
  const [modelStats, setModelStats] = useState({
    tokensUsed: 0,
    responseTime: 0,
    accuracy: 95,
    model: 'GPT-4 Turbo',
    temperature: 0.7,
    maxTokens: 2048
  });

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      speechRecognition.current = new SpeechRecognition();
      speechRecognition.current.continuous = false;
      speechRecognition.current.interimResults = true;
      
      speechRecognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
      
      speechRecognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      speechRecognition.current.onend = () => {
        setIsListening(false);
      };
    }
    
    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.current = new SpeechSynthesisUtterance();
      speechSynthesis.current.rate = 1;
      speechSynthesis.current.pitch = 1;
      speechSynthesis.current.volume = 1;
    }
  }, []);

  // Generate Smart Suggestions based on page content
  useEffect(() => {
    if (pageContent && currentUrl) {
      generateSmartSuggestions();
    }
  }, [pageContent, currentUrl]);

  // Auto-scroll to latest message (only within the chat container)
  useEffect(() => {
    // Only scroll if there are messages and the ref exists
    if (messages.length > 0 && messagesEndRef.current) {
      // Scroll within the parent scroll container instead of the whole page
      const scrollContainer = messagesEndRef.current.closest('.overflow-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const generateSmartSuggestions = () => {
    const suggestions: SmartSuggestion[] = [];
    
    // Analyze page content for suggestions
    if (pageContent) {
      // Check for forms
      if (pageContent.includes('<form') || pageContent.includes('input')) {
        suggestions.push({
          id: 'auto-fill',
          title: 'Auto-fill Form',
          description: 'Let AI complete this form for you',
          icon: <PenTool className="h-4 w-4" />,
          action: () => handleAutoFill(),
          priority: 1
        });
      }
      
      // Check for articles/long text
      if (pageContent.length > 5000) {
        suggestions.push({
          id: 'summarize',
          title: 'Summarize Page',
          description: 'Get a quick summary of this content',
          icon: <FileText className="h-4 w-4" />,
          action: () => handleSummarize(),
          priority: 2
        });
      }
      
      // Check for foreign language
      if (/[^\x00-\x7F]/.test(pageContent)) {
        suggestions.push({
          id: 'translate',
          title: 'Translate Page',
          description: 'Translate content to your language',
          icon: <Languages className="h-4 w-4" />,
          action: () => handleTranslate(),
          priority: 3
        });
      }
      
      // Shopping assistance
      if (pageContent.includes('price') || pageContent.includes('cart') || pageContent.includes('buy')) {
        suggestions.push({
          id: 'shopping',
          title: 'Shopping Assistant',
          description: 'Compare prices and find deals',
          icon: <TrendingUp className="h-4 w-4" />,
          action: () => handleShoppingAssist(),
          priority: 4
        });
      }
      
      // Privacy check
      if (pageContent.includes('cookie') || pageContent.includes('privacy') || pageContent.includes('tracking')) {
        suggestions.push({
          id: 'privacy',
          title: 'Privacy Analysis',
          description: 'Check privacy practices',
          icon: <Shield className="h-4 w-4" />,
          action: () => handlePrivacyCheck(),
          priority: 5
        });
      }
    }
    
    setSuggestions(suggestions.sort((a, b) => a.priority - b.priority));
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = {
      role: 'user' as const,
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    
    try {
      // Simulate AI processing
      const response = await processAIRequest(input, pageContent || '');
      
      const assistantMessage = {
        role: 'assistant' as const,
        content: response.content,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update model stats
      setModelStats(prev => ({
        ...prev,
        tokensUsed: prev.tokensUsed + Math.floor(Math.random() * 500) + 100,
        responseTime: Math.random() * 2000 + 500
      }));
      
      // Speak response if voice enabled
      if (voiceEnabled && speechSynthesis.current) {
        speechSynthesis.current.text = response.content;
        window.speechSynthesis.speak(speechSynthesis.current);
      }
    } catch (error) {
      console.error('AI processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processAIRequest = async (query: string, content: string): Promise<AIResponse> => {
    // Simulate AI processing with different response types
    return new Promise((resolve) => {
      setTimeout(() => {
        const responses = [
          {
            id: Date.now().toString(),
            type: 'command' as const,
            content: `I understand you want to ${query}. Let me help you with that.`,
            confidence: 0.95,
            timestamp: new Date()
          },
          {
            id: Date.now().toString(),
            type: 'analysis' as const,
            content: `Based on my analysis of the page, here's what I found...`,
            confidence: 0.92,
            timestamp: new Date()
          },
          {
            id: Date.now().toString(),
            type: 'suggestion' as const,
            content: `Here's a suggestion that might help you...`,
            confidence: 0.88,
            timestamp: new Date()
          }
        ];
        
        resolve(responses[Math.floor(Math.random() * responses.length)]);
      }, 1500);
    });
  };

  const handleSummarize = async () => {
    setIsProcessing(true);
    setActiveMode('summary');
    
    try {
      // Simulate summarization
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockSummary = `
        Key Points:
        • This page contains important information about ${currentUrl}
        • The main topics covered include technology, innovation, and user experience
        • There are ${Math.floor(Math.random() * 10) + 5} key sections with valuable insights
        • The content is suitable for general audiences
        • Reading time: approximately ${Math.floor(Math.random() * 10) + 3} minutes
        
        Main Takeaways:
        1. Focus on user-centric design principles
        2. Importance of privacy and security
        3. Latest trends in web development
        4. Best practices for content creation
      `;
      setSummary(mockSummary);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoFill = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate form detection and filling
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const formData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        address: '123 Main St, City, State 12345',
        company: 'Tech Corp',
        message: 'This form has been auto-filled by AI Assistant'
      };
      
      onFormFill?.(formData);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I\'ve auto-filled the form with appropriate information. Please review before submitting.',
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranslate = async () => {
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Page translation initiated. The content is being translated to your preferred language.',
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShoppingAssist = () => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Shopping Assistant activated! I can help you compare prices, find coupons, and track price history.',
      timestamp: new Date()
    }]);
  };

  const handlePrivacyCheck = () => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Privacy analysis complete. This site uses cookies and may track your activity. Enable privacy mode for enhanced protection.',
      timestamp: new Date()
    }]);
  };

  const toggleVoice = () => {
    if (isListening) {
      speechRecognition.current?.stop();
    } else {
      speechRecognition.current?.start();
      setIsListening(true);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const executeCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Navigation commands
    if (lowerCommand.includes('go to') || lowerCommand.includes('navigate to')) {
      const url = command.replace(/(go to|navigate to)/i, '').trim();
      onNavigate?.(url);
    }
    // Search commands
    else if (lowerCommand.includes('search for')) {
      const query = command.replace(/search for/i, '').trim();
      onSearch?.(query);
    }
    // Page commands
    else if (lowerCommand.includes('refresh') || lowerCommand.includes('reload')) {
      window.location.reload();
    }
    else if (lowerCommand.includes('go back')) {
      window.history.back();
    }
    else if (lowerCommand.includes('go forward')) {
      window.history.forward();
    }
  };

  return (
    <Card className="w-full h-full flex flex-col bg-background/95 backdrop-blur">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Assistant
            <Badge variant="outline" className="ml-2">
              {modelStats.model}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPrivacyMode(!privacyMode)}
              className={cn(privacyMode && "text-primary")}
            >
              {privacyMode ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={cn(voiceEnabled && "text-primary")}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Model Stats Bar */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Gauge className="h-3 w-3" />
            <span>{modelStats.accuracy}% accuracy</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            <span>{modelStats.responseTime.toFixed(0)}ms</span>
          </div>
          <div className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            <span>{modelStats.tokensUsed} tokens</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
        <Tabs value={activeMode} onValueChange={setActiveMode as any} className="flex-1 flex flex-col">
          <div className="px-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="chat">
                <MessageSquare className="h-4 w-4 mr-1" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="summary">
                <FileText className="h-4 w-4 mr-1" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="assist">
                <Wand2 className="h-4 w-4 mr-1" />
                Assist
              </TabsTrigger>
              <TabsTrigger value="analyze">
                <BarChart3 className="h-4 w-4 mr-1" />
                Analyze
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
            {/* Smart Suggestions */}
            {suggestions.length > 0 && (
              <div className="px-6 py-3 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Smart Suggestions</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 3).map(suggestion => (
                    <Button
                      key={suggestion.id}
                      variant="secondary"
                      size="sm"
                      onClick={suggestion.action}
                      className="flex items-center gap-1"
                    >
                      {suggestion.icon}
                      {suggestion.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <ScrollArea className="flex-1 px-6">
              <div className="py-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Hi! I'm your AI browsing assistant. Ask me anything or try one of the suggestions above.
                    </p>
                  </div>
                ) : (
                  messages.map((message, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex gap-3",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-3",
                          message.role === 'user' 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          {message.role === 'assistant' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(message.content, idx.toString())}
                            >
                              {copied === idx.toString() ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="px-6 py-4 border-t">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder={isListening ? "Listening..." : "Ask me anything..."}
                    className={cn(
                      "pr-10",
                      isListening && "border-primary"
                    )}
                    disabled={isProcessing}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={toggleVoice}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4 text-red-500" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button onClick={handleSendMessage} disabled={isProcessing || !input.trim()}>
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInput('Summarize this page')}
                  className="text-xs"
                >
                  Summarize
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInput('Explain this to me')}
                  className="text-xs"
                >
                  Explain
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInput('What can I do here?')}
                  className="text-xs"
                >
                  Help
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInput('Find similar pages')}
                  className="text-xs"
                >
                  Similar
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="summary" className="flex-1 overflow-auto p-6">
            {summary ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Page Summary</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSummarize}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans">{summary}</pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Get an AI-powered summary of this page
                </p>
                <Button onClick={handleSummarize} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Summary...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Summary
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="assist" className="flex-1 overflow-auto p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Smart Features</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <PenTool className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Auto-Complete Forms</p>
                        <p className="text-xs text-muted-foreground">
                          Automatically fill forms with your information
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={autoComplete}
                      onCheckedChange={setAutoComplete}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Languages className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Smart Translation</p>
                        <p className="text-xs text-muted-foreground">
                          Translate pages to your preferred language
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Eye className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Reading Mode</p>
                        <p className="text-xs text-muted-foreground">
                          Distraction-free reading experience
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Privacy Shield</p>
                        <p className="text-xs text-muted-foreground">
                          Block trackers and protect your data
                        </p>
                      </div>
                    </div>
                    <Switch checked={privacyMode} onCheckedChange={setPrivacyMode} />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="justify-start">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculator
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Dictionary
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <Globe className="h-4 w-4 mr-2" />
                    Translate
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analyze" className="flex-1 overflow-auto p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Page Analysis</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Content Quality</span>
                      <span className="text-sm text-muted-foreground">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Readability Score</span>
                      <span className="text-sm text-muted-foreground">92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Privacy Score</span>
                      <span className="text-sm text-muted-foreground">78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Trust Score</span>
                      <span className="text-sm text-muted-foreground">90%</span>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold mb-3">Insights</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>This page has strong security measures</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <span>Some third-party cookies detected</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Content is well-structured and accessible</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5" />
                    <span>Similar content found on 3 other sites</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}