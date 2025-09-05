import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, Brain, TrendingUp, Zap, Eye, FileText,
  ShoppingCart, Search, Lock, Image, Table, List,
  ArrowRight, Plus, CheckCircle, AlertCircle, RefreshCw,
  Clock, Target, Play, ChevronRight, Bookmark
} from 'lucide-react';
import { pageAnalyzer } from '@/lib/pageAnalyzer';

export interface WorkflowSuggestion {
  id: string;
  name: string;
  title?: string; // Alias for name for compatibility
  description: string;
  category?: 'productivity' | 'research' | 'automation' | 'data' | 'communication' | 'shopping';
  icon?: React.ReactNode;
  confidence: number;
  estimatedTime?: string;
  triggers?: string[];
  actions?: string[];
  relevance?: 'high' | 'medium' | 'low';
  lastUsed?: Date;
  usageCount?: number;
  tags: string[];
  steps: any[];
}

interface WorkflowSuggestionsProps {
  currentUrl?: string;
  pageContent?: string;
  userActivity?: any[];
  onSelectWorkflow?: (workflow: WorkflowSuggestion) => void;
  onSuggestionsChange?: (count: number) => void;
  maxSuggestions?: number;
  className?: string;
}

const suggestionIcons = {
  'form-automation': FileText,
  'table-extraction': Table,
  'list-extraction': List,
  'search-automation': Search,
  'login-automation': Lock,
  'price-monitoring': ShoppingCart,
  'article-extraction': FileText,
  'image-download': Image
};

export function WorkflowSuggestions({ 
  currentUrl = '', 
  pageContent = '', 
  userActivity = [],
  onSelectWorkflow,
  onSuggestionsChange,
  maxSuggestions = 4,
  className = ''
}: WorkflowSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<WorkflowSuggestion[]>([]);
  const [pageAnalysis, setPageAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');
  
  // Analyze page content when it changes
  useEffect(() => {
    if ((pageContent && currentUrl) || (currentUrl && currentUrl !== 'about:blank')) {
      analyzePageContent();
    }
  }, [pageContent, currentUrl]);
  
  const analyzePageContent = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate async operation for realistic feel
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (pageContent) {
        // Analyze the actual page content if provided
        const analysis = pageAnalyzer.analyzeContent(pageContent, currentUrl);
        setPageAnalysis(analysis);
        
        // Generate workflow suggestions based on page analysis
        const workflowSuggestions = pageAnalyzer.generateWorkflowSuggestions(analysis);
        
        // Enhance suggestions with additional metadata
        const enhancedSuggestions = workflowSuggestions.map((suggestion: any) => ({
          ...suggestion,
          title: suggestion.name, // Add title alias for compatibility
          estimatedTime: `${suggestion.steps.length * 2} min`,
          usageCount: Math.floor(Math.random() * 500),
          actions: suggestion.steps.map((s: any) => s.name)
        }));
        
        const finalSuggestions = enhancedSuggestions.slice(0, maxSuggestions);
        setSuggestions(finalSuggestions);
        // Notify parent about suggestion count
        if (onSuggestionsChange) {
          onSuggestionsChange(finalSuggestions.length);
        }
      } else {
        // Use existing logic for URL-based suggestions
        generateContextualSuggestions();
      }
      
      // Auto-select first suggestion if available
      if (suggestions.length > 0 && !selectedSuggestion) {
        setSelectedSuggestion(suggestions[0].id);
      }
    } catch (error) {
      console.error('Error analyzing page:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const generateContextualSuggestions = () => {
    // Analyze current context from URL only
    const urlDomain = currentUrl ? new URL(currentUrl).hostname : '';
    const isSearchEngine = urlDomain.includes('google') || urlDomain.includes('bing');
    const isEcommerce = urlDomain.includes('amazon') || urlDomain.includes('ebay');
    const isSocialMedia = urlDomain.includes('linkedin') || urlDomain.includes('twitter');
    const isEmail = urlDomain.includes('gmail') || urlDomain.includes('outlook');
    
    const contextualSuggestions: WorkflowSuggestion[] = [];
    
    // Search-based suggestions
    if (isSearchEngine) {
      contextualSuggestions.push({
        id: 'research-compile',
        name: 'Forskning & Sammenstilling',
        title: 'Forskning & Sammenstilling',
        description: 'Automatisk samle og organisere søkeresultater i en strukturert rapport',
        category: 'research',
        icon: <FileText className="h-4 w-4" />,
        confidence: 0.95,
        estimatedTime: '5-10 min',
        triggers: ['Søk utført', 'Flere faner åpne'],
        actions: ['Ekstraher innhold', 'Oppsummer funn', 'Lag rapport'],
        relevance: 'high',
        usageCount: 342,
        tags: ['research', 'data', 'report'],
        steps: []
      });
    }
    
    const finalSuggestions = contextualSuggestions.slice(0, maxSuggestions);
    setSuggestions(finalSuggestions);
    // Notify parent about suggestion count
    if (onSuggestionsChange) {
      onSuggestionsChange(finalSuggestions.length);
    }
  };
  
  const handleSelectWorkflow = (workflow: WorkflowSuggestion) => {
    if (onSelectWorkflow) {
      onSelectWorkflow(workflow);
    }
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.8) return 'text-blue-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-gray-600';
  };
  
  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'Høy sikkerhet';
    if (confidence >= 0.8) return 'God match';
    if (confidence >= 0.7) return 'Mulig match';
    return 'Lav sikkerhet';
  };
  
  const getRelevanceColor = (relevance: string) => {
    switch (relevance) {
      case 'high': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'low': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };
  
  return (
    <Card className={`${className} overflow-hidden`}>
      <CardHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Smart Workflow-gjenkjenning</CardTitle>
              <CardDescription className="text-xs">
                AI analyserer siden og foreslår relevante workflows
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={analyzePageContent}
          >
            <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {isAnalyzing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-2 h-2 bg-purple-600 rounded-full"
              />
              <span className="text-sm text-muted-foreground">Analyserer sideinnhold...</span>
            </div>
            <Progress value={33} className="h-2" />
          </div>
        ) : suggestions.length > 0 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="suggestions">
                <Zap className="w-4 h-4 mr-1" />
                Forslag ({suggestions.length})
              </TabsTrigger>
              <TabsTrigger value="analysis">
                <Eye className="w-4 h-4 mr-1" />
                Analyse
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="suggestions" className="space-y-3">
              <ScrollArea className="h-[400px] pr-3">
                <AnimatePresence mode="wait">
                  {suggestions.map((suggestion, index) => {
                    const Icon = suggestionIcons[suggestion.id as keyof typeof suggestionIcons] || Sparkles;
                    const isSelected = selectedSuggestion === suggestion.id;
                    
                    return (
                      <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card 
                          className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
                            isSelected ? 'ring-2 ring-purple-500' : ''
                          }`}
                          onClick={() => setSelectedSuggestion(suggestion.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="w-5 h-5 text-purple-600" />
                                <CardTitle className="text-sm font-medium">
                                  {suggestion.name || suggestion.title}
                                </CardTitle>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                                  {Math.round(suggestion.confidence * 100)}%
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {getConfidenceLabel(suggestion.confidence)}
                                </Badge>
                              </div>
                            </div>
                            <CardDescription className="text-xs mt-2">
                              {suggestion.description}
                            </CardDescription>
                          </CardHeader>
                          
                          {isSelected && (
                            <CardContent className="pt-0 pb-3">
                              <div className="space-y-2">
                                {/* Workflow Info */}
                                {suggestion.estimatedTime && (
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {suggestion.estimatedTime}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Target className="h-3 w-3" />
                                      {suggestion.steps.length} steg
                                    </span>
                                    {suggestion.usageCount > 0 && (
                                      <span className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        {suggestion.usageCount} bruk
                                      </span>
                                    )}
                                  </div>
                                )}
                                
                                {/* Tags */}
                                <div className="flex flex-wrap gap-1">
                                  {suggestion.tags.map((tag: string) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex items-center justify-between mt-3">
                                  <Button 
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Add to bookmarks/favorites
                                    }}
                                  >
                                    <Bookmark className="h-3 w-3 mr-1" />
                                    Lagre
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="h-7 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectWorkflow(suggestion);
                                    }}
                                  >
                                    <Play className="h-3 w-3 mr-1" />
                                    Start
                                    <ChevronRight className="h-3 w-3 ml-0.5" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="analysis" className="space-y-4">
              {pageAnalysis && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Elementer funnet</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {pageAnalysis.elements.map((element: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <Badge variant="outline">{element.count}</Badge>
                          <span className="text-xs capitalize">{element.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Mønstre identifisert</h4>
                    <div className="flex flex-wrap gap-1">
                      {pageAnalysis.patterns.map((pattern: string) => (
                        <Badge key={pattern} variant="secondary" className="text-xs">
                          {pattern.replace(/-/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Mulige handlinger</h4>
                    <ul className="space-y-1">
                      {pageAnalysis.suggestedActions.map((action: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ArrowRight className="w-3 h-3" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Ingen workflow-forslag tilgjengelig
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Naviger til en nettside for å få intelligente forslag
            </p>
          </div>
        )}
      </CardContent>
      
      {suggestions.length > 0 && (
        <CardFooter className="bg-muted/50 py-2 px-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-muted-foreground">
                {suggestions.length} relevante workflows funnet
              </span>
            </div>
            {pageAnalysis && (
              <Badge variant="outline" className="text-xs">
                {pageAnalysis.elements.length} elementer analysert
              </Badge>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}