import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Target, 
  Lightbulb,
  Zap,
  ChevronRight,
  ChevronLeft,
  Settings,
  Info,
  Play,
  Pause,
  RefreshCw,
  Filter,
  Download,
  Upload,
  Search,
  Globe,
  Database,
  FileText,
  Users,
  Shield,
  Clock,
  BarChart,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  ArrowRight,
  Layers,
  Cpu,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  userAnalytics, 
  UserInsight, 
  Recommendation,
  UserPattern 
} from '@/lib/intelligence/userBehaviorAnalytics';
import { 
  contextAssistant,
  SuggestedAction,
  Tool,
  SmartSuggestion
} from '@/lib/intelligence/contextAwareAssistant';
import { cn } from '@/lib/utils';

interface AdaptiveSidebarProps {
  side: 'left' | 'right';
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

interface SidebarSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  priority: number;
  visible: boolean;
  expanded: boolean;
  content: React.ReactNode;
  badge?: string | number;
  pulse?: boolean;
}

export function AdaptiveSidebar({ side, isOpen, onToggle, className }: AdaptiveSidebarProps) {
  const [sections, setSections] = useState<SidebarSection[]>([]);
  const [activeTab, setActiveTab] = useState('smart');
  const [insights, setInsights] = useState<UserInsight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedAction[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [patterns, setPatterns] = useState<UserPattern[]>([]);
  const [userIntent, setUserIntent] = useState('browsing');
  const [assistanceLevel, setAssistanceLevel] = useState<'minimal' | 'balanced' | 'proactive' | 'autonomous'>('balanced');

  // Update content based on user behavior and context
  useEffect(() => {
    const updateContent = () => {
      const profile = userAnalytics.getProfile();
      const context = contextAssistant.getContext();
      
      setInsights(userAnalytics.getInsights());
      setRecommendations(userAnalytics.getRecommendations());
      setSuggestions(contextAssistant.getSuggestions());
      setTools(contextAssistant.getTools());
      setPatterns(userAnalytics.getPatterns());
      setUserIntent(context.userIntent);
      
      // Update sections based on context
      updateSections(context, profile);
    };

    // Initial update
    updateContent();

    // Subscribe to updates
    const unsubscribeAnalytics = userAnalytics.subscribe((event) => {
      if (event.type === 'insight_generated' || event.type === 'pattern_detected') {
        updateContent();
      }
    });

    const unsubscribeAssistant = contextAssistant.subscribe((event) => {
      if (event.type === 'context_updated' || event.type === 'suggestion_created') {
        updateContent();
      }
    });

    // Periodic updates
    const interval = setInterval(updateContent, 30000);

    return () => {
      unsubscribeAnalytics();
      unsubscribeAssistant();
      clearInterval(interval);
    };
  }, []);

  const updateSections = (context: any, profile: any) => {
    if (side === 'left') {
      // Left sidebar: Tools and controls
      setSections([
        {
          id: 'quick-actions',
          title: 'Quick Actions',
          icon: <Zap className="h-4 w-4" />,
          priority: context.suggestedActions.length > 0 ? 10 : 5,
          visible: true,
          expanded: context.suggestedActions.length > 0,
          content: <QuickActionsContent suggestions={suggestions} />,
          badge: suggestions.filter(s => s.confidence > 0.8).length,
          pulse: suggestions.some(s => s.confidence > 0.9)
        },
        {
          id: 'active-tools',
          title: 'Active Tools',
          icon: <Cpu className="h-4 w-4" />,
          priority: 8,
          visible: true,
          expanded: tools.some(t => t.active),
          content: <ActiveToolsContent tools={tools} />,
          badge: tools.filter(t => t.active).length
        },
        {
          id: 'workflow-control',
          title: 'Workflow Control',
          icon: <Activity className="h-4 w-4" />,
          priority: context.currentWorkflow ? 9 : 3,
          visible: true,
          expanded: !!context.currentWorkflow,
          content: <WorkflowControlContent />,
          pulse: context.currentWorkflow && context.userIntent === 'workflow_execution'
        },
        {
          id: 'data-management',
          title: 'Data Management',
          icon: <Database className="h-4 w-4" />,
          priority: context.userIntent === 'collecting_data' ? 9 : 4,
          visible: true,
          expanded: context.userIntent === 'collecting_data',
          content: <DataManagementContent />
        },
        {
          id: 'navigation',
          title: 'Smart Navigation',
          icon: <Globe className="h-4 w-4" />,
          priority: 6,
          visible: profile.statistics.totalActions > 10,
          expanded: false,
          content: <NavigationContent domains={profile.preferences.domains} />
        }
      ]);
    } else {
      // Right sidebar: Insights and assistance
      setSections([
        {
          id: 'ai-assistant',
          title: 'AI Assistant',
          icon: <Brain className="h-4 w-4" />,
          priority: 10,
          visible: true,
          expanded: true,
          content: <AIAssistantContent 
            insights={insights}
            recommendations={recommendations}
            userIntent={userIntent}
            assistanceLevel={assistanceLevel}
            onAssistanceLevelChange={setAssistanceLevel}
          />,
          badge: insights.filter(i => i.impact === 'high').length,
          pulse: insights.some(i => i.impact === 'high' && i.actionable)
        },
        {
          id: 'patterns',
          title: 'Detected Patterns',
          icon: <TrendingUp className="h-4 w-4" />,
          priority: patterns.length > 0 ? 8 : 3,
          visible: patterns.length > 0,
          expanded: patterns.some(p => p.confidence > 0.8),
          content: <PatternsContent patterns={patterns} />,
          badge: patterns.filter(p => p.confidence > 0.8).length
        },
        {
          id: 'productivity',
          title: 'Productivity Stats',
          icon: <BarChart className="h-4 w-4" />,
          priority: 5,
          visible: profile.statistics.totalActions > 50,
          expanded: false,
          content: <ProductivityContent stats={profile.statistics} />
        },
        {
          id: 'learning',
          title: 'Learning Hub',
          icon: <Lightbulb className="h-4 w-4" />,
          priority: profile.preferences.expertise === 'beginner' ? 7 : 2,
          visible: true,
          expanded: profile.preferences.expertise === 'beginner',
          content: <LearningContent expertise={profile.preferences.expertise} />
        }
      ]);
    }
  };

  // Sort sections by priority
  const sortedSections = useMemo(() => 
    sections
      .filter(s => s.visible)
      .sort((a, b) => b.priority - a.priority),
    [sections]
  );

  return (
    <motion.div
      initial={false}
      animate={{ 
        width: isOpen ? 320 : 48,
        opacity: 1
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        "h-full bg-card border-r flex flex-col relative",
        className
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full border bg-background shadow-md"
      >
        {side === 'left' ? (
          isOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
        ) : (
          isOpen ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <motion.div
            animate={{ opacity: isOpen ? 1 : 0 }}
            className="flex items-center gap-2"
          >
            {side === 'left' ? (
              <>
                <Layers className="h-5 w-5 text-primary" />
                {isOpen && <span className="font-semibold">Smart Tools</span>}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-primary" />
                {isOpen && <span className="font-semibold">AI Insights</span>}
              </>
            )}
          </motion.div>
          
          {isOpen && (
            <Badge variant="secondary" className="text-xs">
              {assistanceLevel}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {isOpen ? (
          <div className="p-3 space-y-3">
            {side === 'right' ? (
              // Right sidebar uses tabs
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="smart">Smart</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                  <TabsTrigger value="stats">Stats</TabsTrigger>
                </TabsList>
                
                <TabsContent value="smart" className="mt-3 space-y-3">
                  {sortedSections
                    .filter(s => ['ai-assistant', 'patterns'].includes(s.id))
                    .map(section => (
                      <SidebarSectionComponent key={section.id} section={section} />
                    ))}
                </TabsContent>
                
                <TabsContent value="insights" className="mt-3 space-y-3">
                  {sortedSections
                    .filter(s => ['learning', 'productivity'].includes(s.id))
                    .map(section => (
                      <SidebarSectionComponent key={section.id} section={section} />
                    ))}
                </TabsContent>
                
                <TabsContent value="stats" className="mt-3">
                  <ProductivityContent stats={userAnalytics.getProfile().statistics} />
                </TabsContent>
              </Tabs>
            ) : (
              // Left sidebar shows sections directly
              sortedSections.map(section => (
                <SidebarSectionComponent key={section.id} section={section} />
              ))
            )}
          </div>
        ) : (
          // Collapsed view - show icons only
          <div className="p-2 space-y-2">
            {sortedSections.map(section => (
              <TooltipProvider key={section.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "relative w-full",
                        section.pulse && "animate-pulse"
                      )}
                    >
                      {section.icon}
                      {section.badge && Number(section.badge) > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                        >
                          {section.badge}
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side={side === 'left' ? 'right' : 'left'}>
                    <p>{section.title}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
}

// Section Component
function SidebarSectionComponent({ section }: { section: SidebarSection }) {
  const [isExpanded, setIsExpanded] = useState(section.expanded);

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      section.pulse && "ring-2 ring-primary ring-offset-2"
    )}>
      <div
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {section.icon}
          <span className="font-medium text-sm">{section.title}</span>
          {section.badge !== undefined && Number(section.badge) > 0 && (
            <Badge variant="secondary" className="ml-1">
              {section.badge}
            </Badge>
          )}
        </div>
        <ChevronRight className={cn(
          "h-4 w-4 transition-transform",
          isExpanded && "rotate-90"
        )} />
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Separator />
            <div className="p-3">
              {section.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// Content Components
function QuickActionsContent({ suggestions }: { suggestions: SuggestedAction[] }) {
  const topSuggestions = suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  if (topSuggestions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No suggestions available yet. Keep browsing to see personalized actions.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {topSuggestions.map(suggestion => (
        <motion.div
          key={suggestion.id}
          whileHover={{ x: 4 }}
          className="p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
          onClick={() => contextAssistant.executeSuggestion(suggestion.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">{suggestion.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {suggestion.description}
              </p>
            </div>
            <Badge variant={suggestion.confidence > 0.8 ? 'default' : 'secondary'}>
              {Math.round(suggestion.confidence * 100)}%
            </Badge>
          </div>
          {suggestion.estimatedTime && (
            <div className="flex items-center gap-1 mt-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                ~{suggestion.estimatedTime}s
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function ActiveToolsContent({ tools }: { tools: Tool[] }) {
  const activeTools = tools.filter(t => t.active);
  const availableTools = tools.filter(t => !t.active).slice(0, 3);

  return (
    <div className="space-y-3">
      {activeTools.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Active</p>
          {activeTools.map(tool => (
            <div key={tool.id} className="flex items-center justify-between p-2 rounded-lg bg-primary/10">
              <div className="flex items-center gap-2">
                <span>{tool.icon}</span>
                <span className="text-sm font-medium">{tool.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => console.log('Configure tool:', tool.id)}
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {availableTools.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Suggested</p>
          {availableTools.map(tool => (
            <div 
              key={tool.id} 
              className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
              onClick={() => contextAssistant.activateTool(tool.id)}
            >
              <div className="flex items-center gap-2">
                <span className="opacity-50">{tool.icon}</span>
                <div>
                  <p className="text-sm">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">{tool.description}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {Math.round(tool.relevance * 100)}%
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkflowControlContent() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Current Workflow</span>
        <Badge>Running</Badge>
      </div>
      
      <Progress value={67} className="h-2" />
      
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Pause className="h-3 w-3 mr-1" />
          Pause
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <RefreshCw className="h-3 w-3 mr-1" />
          Restart
        </Button>
      </div>
      
      <Separator />
      
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Next Steps</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span className="line-through text-muted-foreground">Search for leads</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Activity className="h-3 w-3 text-blue-500 animate-pulse" />
            <span>Extract contact info</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Circle className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Validate emails</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataManagementContent() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-2 text-center">
          <p className="text-2xl font-bold">523</p>
          <p className="text-xs text-muted-foreground">Records</p>
        </Card>
        <Card className="p-2 text-center">
          <p className="text-2xl font-bold">89%</p>
          <p className="text-xs text-muted-foreground">Valid</p>
        </Card>
      </div>
      
      <div className="space-y-2">
        <Button variant="outline" size="sm" className="w-full">
          <Filter className="h-3 w-3 mr-2" />
          Filter Data
        </Button>
        <Button variant="outline" size="sm" className="w-full">
          <Download className="h-3 w-3 mr-2" />
          Export CSV
        </Button>
        <Button variant="outline" size="sm" className="w-full">
          <Upload className="h-3 w-3 mr-2" />
          Import Data
        </Button>
      </div>
    </div>
  );
}

function NavigationContent({ domains }: { domains: string[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Frequently Visited</p>
      {domains.slice(0, 5).map(domain => (
        <div 
          key={domain}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
        >
          <Globe className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{domain}</span>
        </div>
      ))}
    </div>
  );
}

function AIAssistantContent({ 
  insights, 
  recommendations, 
  userIntent,
  assistanceLevel,
  onAssistanceLevelChange
}: any) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI Mode</span>
        </div>
        <select 
          value={assistanceLevel}
          onChange={(e) => {
            const level = e.target.value as any;
            onAssistanceLevelChange(level);
            contextAssistant.setAssistanceLevel(level);
          }}
          className="text-xs border rounded px-2 py-1 bg-background"
        >
          <option value="minimal">Minimal</option>
          <option value="balanced">Balanced</option>
          <option value="proactive">Proactive</option>
          <option value="autonomous">Autonomous</option>
        </select>
      </div>
      
      <div className="p-2 rounded-lg bg-muted">
        <p className="text-xs text-muted-foreground">Current Intent</p>
        <p className="text-sm font-medium capitalize">{userIntent.replace('_', ' ')}</p>
      </div>
      
      {insights.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Latest Insights</p>
          {insights.slice(0, 3).map((insight: UserInsight) => (
            <div key={insight.id} className="p-2 rounded-lg border">
              <div className="flex items-start gap-2">
                {insight.impact === 'high' ? (
                  <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                ) : (
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Recommendations</p>
          {recommendations.slice(0, 2).map((rec: Recommendation) => (
            <div 
              key={rec.id}
              className="p-2 rounded-lg bg-primary/5 hover:bg-primary/10 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm">{rec.title}</p>
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PatternsContent({ patterns }: { patterns: UserPattern[] }) {
  const topPatterns = patterns
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  return (
    <div className="space-y-2">
      {topPatterns.map(pattern => (
        <div key={pattern.id} className="p-2 rounded-lg border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium capitalize">
              {pattern.patternType} Pattern
            </span>
            <Badge variant="secondary" className="text-xs">
              {Math.round(pattern.confidence * 100)}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Detected {pattern.frequency} times
          </p>
          {pattern.predictions.nextAction && (
            <div className="mt-2 p-1 rounded bg-muted">
              <p className="text-xs">
                <span className="text-muted-foreground">Next likely:</span>{' '}
                {pattern.predictions.nextAction}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ProductivityContent({ stats }: any) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-2">
          <p className="text-xs text-muted-foreground">Success Rate</p>
          <p className="text-xl font-bold">
            {Math.round(stats.successRate * 100)}%
          </p>
        </Card>
        <Card className="p-2">
          <p className="text-xs text-muted-foreground">Avg Session</p>
          <p className="text-xl font-bold">
            {Math.round(stats.avgSessionDuration)}m
          </p>
        </Card>
      </div>
      
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Most Used Features</p>
        {stats.mostUsedFeatures.slice(0, 3).map((feature: any, index: number) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-xs">{feature.feature}</span>
            <Badge variant="outline" className="text-xs">
              {feature.count}
            </Badge>
          </div>
        ))}
      </div>
      
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Peak Activity Hours</p>
        <div className="flex gap-1">
          {Array.from({ length: 24 }, (_, i) => {
            const peak = stats.peakHours.find((p: any) => p.hour === i);
            const intensity = peak ? peak.activity / Math.max(...stats.peakHours.map((p: any) => p.activity)) : 0;
            
            return (
              <div
                key={i}
                className="flex-1 h-8 bg-muted rounded-sm relative"
                style={{
                  background: `linear-gradient(to top, hsl(var(--primary) / ${intensity}) 0%, hsl(var(--primary) / ${intensity}) ${intensity * 100}%, transparent ${intensity * 100}%)`
                }}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="w-full h-full" />
                    <TooltipContent>
                      <p className="text-xs">{i}:00 - {peak?.activity || 0} actions</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LearningContent({ expertise }: { expertise: string }) {
  const tips = {
    beginner: [
      'Use keyboard shortcuts to navigate faster',
      'Enable auto-suggestions for common tasks',
      'Try the workflow builder for repetitive tasks'
    ],
    intermediate: [
      'Combine multiple tools for complex workflows',
      'Use data extraction for bulk operations',
      'Set up custom automation rules'
    ],
    advanced: [
      'Create custom scripts for unique scenarios',
      'Use API integrations for external tools',
      'Build reusable workflow templates'
    ],
    expert: [
      'Optimize performance with parallel processing',
      'Develop custom extensions',
      'Share your workflows with the community'
    ]
  };

  const currentTips = tips[expertise as keyof typeof tips] || tips.intermediate;

  return (
    <div className="space-y-3">
      <div className="p-2 rounded-lg bg-muted">
        <p className="text-xs text-muted-foreground">Your Level</p>
        <p className="text-sm font-medium capitalize">{expertise}</p>
      </div>
      
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Tips for You</p>
        {currentTips.map((tip, index) => (
          <div key={index} className="flex items-start gap-2">
            <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5" />
            <p className="text-xs">{tip}</p>
          </div>
        ))}
      </div>
      
      <Button variant="outline" size="sm" className="w-full">
        <HelpCircle className="h-3 w-3 mr-2" />
        View Tutorials
      </Button>
    </div>
  );
}

// Circle icon component (not in lucide-react)
function Circle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}