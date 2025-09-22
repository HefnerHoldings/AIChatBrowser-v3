import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, Globe, Sparkles, Zap, BookOpen, Star, 
  Clock, TrendingUp, Shield, Rocket, Bot, 
  Workflow, Video, Mic, FileText, Calendar,
  Users, Settings, HelpCircle, ChevronRight,
  Play, Database, Code2, Layers, Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MadEasyLogo } from '@/components/MadEasyLogo';

interface QuickAction {
  icon: React.ElementType;
  title: string;
  description: string;
  action: () => void;
  color: string;
}

interface RecentSite {
  title: string;
  url: string;
  favicon?: string;
  visits: number;
}

interface SuggestedWorkflow {
  title: string;
  description: string;
  icon: React.ElementType;
  steps: number;
}

export function BrowserStartPage({ 
  onNavigate,
  onStartWorkflow,
  onOpenSettings
}: {
  onNavigate: (url: string) => void;
  onStartWorkflow?: () => void;
  onOpenSettings?: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const quickActions: QuickAction[] = [
    {
      icon: Workflow,
      title: 'Multi-Agent Orchestration',
      description: 'AI-agenter som samarbeider',
      action: () => onStartWorkflow?.(),
      color: 'from-purple-500/60 to-pink-500/60'
    },
    {
      icon: Bot,
      title: 'QA Suite Pro',
      description: 'Lighthouse & Visual Testing',
      action: () => {},
      color: 'from-blue-500/60 to-cyan-500/60'
    },
    {
      icon: Video,
      title: 'Vibecoding Platform',
      description: 'Gamified Development',
      action: () => {},
      color: 'from-red-500/60 to-orange-500/60'
    },
    {
      icon: Mic,
      title: 'Collaborative Mode',
      description: 'Real-time samarbeid',
      action: () => {},
      color: 'from-green-500/60 to-emerald-500/60'
    }
  ];
  
  const recentSites: RecentSite[] = [
    { title: 'Google', url: 'https://google.com', visits: 42 },
    { title: 'GitHub', url: 'https://github.com', visits: 38 },
    { title: 'YouTube', url: 'https://youtube.com', visits: 25 },
    { title: 'LinkedIn', url: 'https://linkedin.com', visits: 18 },
    { title: 'Stack Overflow', url: 'https://stackoverflow.com', visits: 15 },
    { title: 'Twitter', url: 'https://twitter.com', visits: 12 }
  ];
  
  const suggestedWorkflows: SuggestedWorkflow[] = [
    {
      title: 'Multi-Agent Workflow',
      description: 'AI-agenter samarbeider om komplekse oppgaver',
      icon: Database,
      steps: 8
    },
    {
      title: 'QA Testing Suite',
      description: 'Automatisk testing med Lighthouse',
      icon: FileText,
      steps: 6
    },
    {
      title: 'Outreach Campaign',
      description: 'Multi-channel markedsføring',
      icon: Calendar,
      steps: 10
    },
    {
      title: 'Watched Workflows',
      description: 'Overvåk og automatiser endringer',
      icon: TrendingUp,
      steps: 5
    }
  ];
  
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Check if it's a URL
      if (searchQuery.includes('.') || searchQuery.startsWith('http')) {
        onNavigate(searchQuery.startsWith('http') ? searchQuery : `https://${searchQuery}`);
      } else {
        // Search on Google
        onNavigate(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
      }
    }
  };
  
  return (
    <div className="h-full overflow-auto relative z-10">
      {/* Subtle AI Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Soft gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />
        
        {/* Very subtle AI glow - only 2 stationary orbs with minimal opacity */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary/[0.03] to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-tl from-primary/[0.02] to-transparent rounded-full blur-3xl" />
        
        {/* Minimal grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                             linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px)`,
            backgroundSize: '100px 100px'
          }}
        />
        
        {/* Soft vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </div>
      
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12 relative">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8 py-8"
        >
          {/* Animated Logo */}
          <div className="flex justify-center mb-6">
            <MadEasyLogo size="xlarge" animated={true} showText={true} />
          </div>
          
          <p className="text-muted-foreground/60 text-sm font-light max-w-2xl mx-auto leading-relaxed">
            MadEasy Browser V3.00 - Den mest avanserte AI-drevne nettleseren med komplett cross-platform støtte, multi-agent orkestrering, og enterprise-klar automatisering
          </p>
          
          {/* Feature badges - clean and minimal */}
          <div className="flex justify-center gap-2 flex-wrap">
            <Badge variant="outline" className="px-2.5 py-0.5 text-[10px] border-border/30">
              <Sparkles className="h-2.5 w-2.5 mr-1 text-primary/50" />
              Multi-Agent AI
            </Badge>
            <Badge variant="outline" className="px-2.5 py-0.5 text-[10px] border-border/30">
              <Shield className="h-2.5 w-2.5 mr-1 text-primary/50" />
              Enterprise Security
            </Badge>
            <Badge variant="outline" className="px-2.5 py-0.5 text-[10px] border-border/30">
              <Workflow className="h-2.5 w-2.5 mr-1 text-primary/50" />
              Vibecoding Platform
            </Badge>
            <Badge variant="outline" className="px-2.5 py-0.5 text-[10px] border-border/30">
              <Zap className="h-2.5 w-2.5 mr-1 text-primary/50" />
              8 Plattformer
            </Badge>
            <Badge variant="outline" className="px-2.5 py-0.5 text-[10px] border-border/30">
              <Bot className="h-2.5 w-2.5 mr-1 text-primary/50" />
              QA Suite Pro
            </Badge>
            <Badge variant="outline" className="px-2.5 py-0.5 text-[10px] border-border/30">
              <Users className="h-2.5 w-2.5 mr-1 text-primary/50" />
              Collaboration
            </Badge>
          </div>
          
          {/* Search Bar - clean and simple */}
          <div className="max-w-2xl mx-auto relative">
            <Input
              type="text"
              placeholder="Søk på nettet eller skriv inn URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="h-12 pl-12 pr-4 text-base shadow-sm bg-card/50 backdrop-blur-sm border border-border/50 relative"
              data-testid="startpage-search"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 text-xs bg-primary/5 hover:bg-primary/10 border border-border/30"
              disabled={!searchQuery.trim()}
              data-testid="startpage-search-button"
            >
              Søk
            </Button>
          </div>
        </motion.div>
        
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full"
        >
          <h2 className="text-xs font-light mb-6 flex items-center gap-2 text-foreground/50 uppercase tracking-widest">
            <Zap className="h-3 w-3 text-yellow-500/50" />
            Hurtighandlinger
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-all duration-300 hover:border-border/50 h-full bg-card/20 border border-border/20 group rounded-xl"
                    onClick={action.action}
                    data-testid={`quick-action-${index}`}
                  >
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.color} opacity-70 group-hover:opacity-90 flex items-center justify-center mb-4 transition-all duration-300`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-light text-sm mb-2 text-foreground/80">{action.title}</h3>
                      <p className="text-xs text-muted-foreground/60 line-clamp-2 leading-relaxed">{action.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
        
        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          {/* Recent Sites */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="h-full">
              <h3 className="flex items-center gap-2 text-xs font-light text-foreground/50 uppercase tracking-widest mb-4">
                <Clock className="h-3 w-3 text-primary/50" />
                Nylig besøkt
              </h3>
              <Card className="overflow-hidden bg-card/20 border border-border/20 rounded-xl">
                <CardContent className="p-4">
                  <ScrollArea className="h-[320px]">
                  <div className="space-y-2">
                    {recentSites.map((site, index) => (
                      <motion.div
                        key={site.url}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.03 }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-auto py-2 px-3 hover:bg-accent/30 rounded-lg transition-all duration-300"
                          onClick={() => onNavigate(site.url)}
                          data-testid={`recent-site-${index}`}
                        >
                          <Globe className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                          <div className="flex-1 text-left min-w-0">
                            <div className="font-normal text-xs truncate text-foreground/80">{site.title}</div>
                            <div className="text-[10px] text-muted-foreground/50 truncate">{site.url}</div>
                          </div>
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 text-foreground/50">
                            {site.visits}
                          </Badge>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </motion.div>
          
          {/* Suggested Workflows */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="h-full">
              <h3 className="flex items-center gap-2 text-xs font-light text-foreground/50 uppercase tracking-widest mb-4">
                <Sparkles className="h-3 w-3 text-purple-500/50" />
                Foreslåtte workflows
              </h3>
              <Card className="overflow-hidden bg-card/20 border border-border/20 rounded-xl">
                <CardContent className="p-4">
                  <ScrollArea className="h-[320px]">
                  <div className="space-y-3">
                    {suggestedWorkflows.map((workflow, index) => {
                      const Icon = workflow.icon;
                      return (
                        <motion.div
                          key={workflow.title}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.03 }}
                          whileHover={{ x: 3 }}
                          className="p-3 rounded-xl border border-border/10 hover:border-border/30 hover:bg-accent/20 cursor-pointer transition-all duration-300"
                          onClick={() => onStartWorkflow?.()}
                          data-testid={`workflow-suggestion-${index}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10">
                              <Icon className="h-3 w-3 text-purple-500/70" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-normal text-xs mb-1 text-foreground/80">{workflow.title}</h4>
                              <p className="text-[10px] text-muted-foreground/60 mb-2 line-clamp-2">
                                {workflow.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5 border-border/30 text-foreground/60">
                                  {workflow.steps} steg
                                </Badge>
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </motion.div>
          
          {/* Tips & Features */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1"
          >
            <div className="h-full">
              <h3 className="flex items-center gap-2 text-xs font-light text-foreground/50 uppercase tracking-widest mb-4">
                <HelpCircle className="h-3 w-3 text-blue-500/50" />
                Tips & funksjoner
              </h3>
              <Card className="overflow-hidden bg-card/20 border border-border/20 rounded-xl">
                <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/10">
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded-full bg-blue-500/10">
                        <Rocket className="h-2.5 w-2.5 text-blue-500/60" />
                      </div>
                      <div className="flex-1">
                        <p className="font-normal text-[11px] mb-0.5 text-foreground/70">V3.00 Features</p>
                        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                          Multi-Agent AI • QA Suite Pro • Vibecoding • 8 Plattformer
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/10">
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded-full bg-green-500/10">
                        <Shield className="h-2.5 w-2.5 text-green-500/60" />
                      </div>
                      <div className="flex-1">
                        <p className="font-normal text-[11px] mb-0.5 text-foreground/70">Enterprise Security</p>
                        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                          Windows Defender • Site Isolation • Certificate Pinning
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/10">
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded-full bg-purple-500/10">
                        <Target className="h-2.5 w-2.5 text-purple-500/60" />
                      </div>
                      <div className="flex-1">
                        <p className="font-normal text-[11px] mb-0.5 text-foreground/70">Vibecoding Platform</p>
                        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                          Gamified development med AI-recommendations og goal tracking
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/5 to-red-500/5 border border-orange-500/10">
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded-full bg-orange-500/10">
                        <Code2 className="h-2.5 w-2.5 text-orange-500/60" />
                      </div>
                      <div className="flex-1">
                        <p className="font-normal text-[11px] mb-0.5 text-foreground/70">Cross-Platform</p>
                        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                          Windows • macOS • Linux • iOS • Android • Tauri • Extensions
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 h-7 text-[11px] hover:bg-accent/30 border border-border/20"
                    onClick={() => onOpenSettings?.()}
                    data-testid="open-settings"
                  >
                    <Settings className="h-3 w-3 mr-1.5" />
                    Åpne innstillinger
                  </Button>
                </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}