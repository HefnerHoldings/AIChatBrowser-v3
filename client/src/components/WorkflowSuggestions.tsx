import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  TrendingUp,
  Clock,
  Target,
  Zap,
  RefreshCw,
  ArrowRight,
  Play,
  Bookmark,
  ChevronRight,
  Search,
  FileText,
  Mail,
  ShoppingCart,
  Calendar,
  Users,
  Globe,
  Database
} from 'lucide-react';

export interface WorkflowSuggestion {
  id: string;
  title: string;
  description: string;
  category: 'productivity' | 'research' | 'automation' | 'data' | 'communication' | 'shopping';
  icon: React.ReactNode;
  confidence: number;
  estimatedTime: string;
  triggers: string[];
  actions: string[];
  relevance: 'high' | 'medium' | 'low';
  lastUsed?: Date;
  usageCount: number;
}

interface WorkflowSuggestionsProps {
  currentUrl?: string;
  userActivity?: any[];
  onSelectWorkflow: (workflow: WorkflowSuggestion) => void;
  maxSuggestions?: number;
}

export function WorkflowSuggestions({
  currentUrl,
  userActivity = [],
  onSelectWorkflow,
  maxSuggestions = 4
}: WorkflowSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<WorkflowSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate contextual suggestions based on current activity
  useEffect(() => {
    // Only generate suggestions if we have a valid URL
    if (currentUrl && currentUrl !== 'about:blank') {
      generateSuggestions();
    }
  }, [currentUrl]);

  const generateSuggestions = () => {
    setLoading(true);
    
    // Analyze current context
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
        title: 'Research & Compile',
        description: 'Automatically gather and organize search results into a structured report',
        category: 'research',
        icon: <FileText className="h-4 w-4" />,
        confidence: 0.95,
        estimatedTime: '5-10 min',
        triggers: ['Search performed', 'Multiple tabs open'],
        actions: ['Extract content', 'Summarize findings', 'Create report'],
        relevance: 'high',
        usageCount: 342
      });
      
      contextualSuggestions.push({
        id: 'competitor-analysis',
        title: 'Competitor Analysis',
        description: 'Extract and compare data from multiple competitor websites',
        category: 'data',
        icon: <TrendingUp className="h-4 w-4" />,
        confidence: 0.88,
        estimatedTime: '15-20 min',
        triggers: ['Business search', 'Multiple domains'],
        actions: ['Scrape data', 'Compare features', 'Generate matrix'],
        relevance: 'medium',
        usageCount: 156
      });
    }
    
    // E-commerce suggestions
    if (isEcommerce) {
      contextualSuggestions.push({
        id: 'price-tracker',
        title: 'Price Tracker',
        description: 'Monitor price changes and get alerts when items drop in price',
        category: 'shopping',
        icon: <ShoppingCart className="h-4 w-4" />,
        confidence: 0.92,
        estimatedTime: '2 min setup',
        triggers: ['Product page viewed', 'Price detected'],
        actions: ['Track price', 'Set alert', 'Compare sellers'],
        relevance: 'high',
        usageCount: 523
      });
      
      contextualSuggestions.push({
        id: 'wholesale-finder',
        title: 'Find Wholesale Suppliers',
        description: 'Search for wholesale suppliers and compare bulk pricing',
        category: 'shopping',
        icon: <Search className="h-4 w-4" />,
        confidence: 0.85,
        estimatedTime: '10-15 min',
        triggers: ['Product search', 'Business context'],
        actions: ['Find suppliers', 'Compare prices', 'Contact vendors'],
        relevance: 'medium',
        usageCount: 89
      });
    }
    
    // Email suggestions
    if (isEmail) {
      contextualSuggestions.push({
        id: 'email-processor',
        title: 'Email Batch Processor',
        description: 'Automatically categorize, label, and respond to emails',
        category: 'communication',
        icon: <Mail className="h-4 w-4" />,
        confidence: 0.90,
        estimatedTime: '5 min',
        triggers: ['Email inbox open', 'Multiple unread'],
        actions: ['Categorize', 'Auto-respond', 'Archive'],
        relevance: 'high',
        usageCount: 278
      });
    }
    
    // Social media suggestions
    if (isSocialMedia) {
      contextualSuggestions.push({
        id: 'lead-extractor',
        title: 'Lead Extractor',
        description: 'Extract contact information from LinkedIn profiles',
        category: 'data',
        icon: <Users className="h-4 w-4" />,
        confidence: 0.87,
        estimatedTime: '10-15 min',
        triggers: ['LinkedIn profile', 'Search results'],
        actions: ['Extract contacts', 'Enrich data', 'Export CSV'],
        relevance: 'high',
        usageCount: 412
      });
    }
    
    // Generic productivity suggestions
    contextualSuggestions.push({
      id: 'daily-automation',
      title: 'Daily Routine Automation',
      description: 'Automate your daily web tasks in one click',
      category: 'automation',
      icon: <Zap className="h-4 w-4" />,
      confidence: 0.82,
      estimatedTime: '15 min setup',
      triggers: ['Morning routine', 'Repeated actions'],
      actions: ['Check sites', 'Gather updates', 'Send summary'],
      relevance: 'medium',
      usageCount: 198
    });
    
    contextualSuggestions.push({
      id: 'meeting-scheduler',
      title: 'Smart Meeting Scheduler',
      description: 'Find optimal meeting times across calendars',
      category: 'productivity',
      icon: <Calendar className="h-4 w-4" />,
      confidence: 0.79,
      estimatedTime: '3 min',
      triggers: ['Calendar access', 'Scheduling need'],
      actions: ['Check availability', 'Send invites', 'Add to calendar'],
      relevance: 'low',
      usageCount: 134
    });
    
    // Sort by relevance and confidence
    const sortedSuggestions = contextualSuggestions
      .sort((a, b) => {
        const relevanceScore = { high: 3, medium: 2, low: 1 };
        const scoreA = relevanceScore[a.relevance] * a.confidence;
        const scoreB = relevanceScore[b.relevance] * b.confidence;
        return scoreB - scoreA;
      })
      .slice(0, maxSuggestions);
    
    setTimeout(() => {
      setSuggestions(sortedSuggestions);
      setLoading(false);
    }, 300);
  };

  const getRelevanceColor = (relevance: string) => {
    switch (relevance) {
      case 'high': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'low': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'productivity': return 'bg-blue-500/10 text-blue-600';
      case 'research': return 'bg-purple-500/10 text-purple-600';
      case 'automation': return 'bg-orange-500/10 text-orange-600';
      case 'data': return 'bg-cyan-500/10 text-cyan-600';
      case 'communication': return 'bg-pink-500/10 text-pink-600';
      case 'shopping': return 'bg-green-500/10 text-green-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          Suggested Workflows
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={generateSuggestions}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Suggestion Cards */}
      <div className="grid gap-2">
        {suggestions.map((workflow) => (
          <Card 
            key={workflow.id} 
            className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] border-muted"
            onClick={() => onSelectWorkflow(workflow)}
          >
            <CardHeader className="p-3 pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  <div className={`p-1.5 rounded ${getCategoryColor(workflow.category)}`}>
                    {workflow.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold line-clamp-1">
                      {workflow.title}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5 line-clamp-2">
                      {workflow.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ml-2 ${getRelevanceColor(workflow.relevance)}`}
                >
                  {Math.round(workflow.confidence * 100)}%
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-3 pt-1">
              {/* Workflow Info */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {workflow.estimatedTime}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {workflow.actions.length} actions
                </span>
                {workflow.usageCount > 0 && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {workflow.usageCount} uses
                  </span>
                )}
              </div>
              
              {/* Action Tags */}
              <div className="flex flex-wrap gap-1 mb-2">
                {workflow.actions.slice(0, 3).map((action, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary" 
                    className="text-xs px-1.5 py-0"
                  >
                    {action}
                  </Badge>
                ))}
                {workflow.actions.length > 3 && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-1.5 py-0"
                  >
                    +{workflow.actions.length - 3} more
                  </Badge>
                )}
              </div>
              
              {/* Launch Button */}
              <div className="flex items-center justify-between mt-2">
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
                  Save
                </Button>
                <Button 
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectWorkflow(workflow);
                  }}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Start
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm">Analyzing context...</span>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && suggestions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-6 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No suggestions available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Start browsing to get personalized workflow recommendations
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}