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
      title: 'Opprett workflow',
      description: 'Bygg automatiserte oppgaver',
      action: () => onStartWorkflow?.(),
      color: 'from-purple-500/60 to-pink-500/60'
    },
    {
      icon: Bot,
      title: 'AI Assistent',
      description: 'Få hjelp fra AI',
      action: () => {},
      color: 'from-blue-500/60 to-cyan-500/60'
    },
    {
      icon: Video,
      title: 'Ta opp handlinger',
      description: 'Spill inn og automatiser',
      action: () => {},
      color: 'from-red-500/60 to-orange-500/60'
    },
    {
      icon: Mic,
      title: 'Talekommandoer',
      description: 'Kontroller med stemmen',
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
      title: 'Web Scraping',
      description: 'Hent data fra nettsider automatisk',
      icon: Database,
      steps: 5
    },
    {
      title: 'Form Filler',
      description: 'Fyll ut skjemaer automatisk',
      icon: FileText,
      steps: 3
    },
    {
      title: 'Daily Report',
      description: 'Generer daglige rapporter',
      icon: Calendar,
      steps: 7
    },
    {
      title: 'Data Monitor',
      description: 'Overvåk endringer på nettsider',
      icon: TrendingUp,
      steps: 4
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
      {/* Animated AI Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Primary gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/40 to-blue-950/30" />
        
        {/* Animated floating orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-gradient-to-br from-blue-600/30 to-cyan-600/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '5s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-cyan-600/30 to-emerald-600/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '10s' }} />
        
        {/* Additional morphing orbs */}
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 animate-morph blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-56 h-56 bg-gradient-to-br from-pink-600/20 to-rose-600/20 animate-morph blur-3xl" style={{ animationDelay: '7s' }} />
        
        {/* Grid pattern overlay with shimmer */}
        <div 
          className="absolute inset-0 opacity-[0.03] animate-shimmer"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                             linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Neural network lines */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="neural-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="5" cy="5" r="1" fill="currentColor" className="text-purple-500" />
              <circle cx="95" cy="95" r="1" fill="currentColor" className="text-blue-500" />
              <line x1="5" y1="5" x2="95" y2="95" stroke="currentColor" strokeWidth="0.5" className="text-purple-500" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#neural-pattern)" />
        </svg>
        
        {/* Animated gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>
      
      <div className="max-w-7xl mx-auto p-8 space-y-8 relative">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 py-12"
        >
          {/* Animated Logo */}
          <div className="flex justify-center mb-6">
            <MadEasyLogo size="xlarge" animated={true} showText={true} />
          </div>
          
          <p className="text-muted-foreground/60 text-sm font-light max-w-2xl mx-auto leading-relaxed">
            Fremtidens nettleser med innebygget AI-intelligens, automatisering og avanserte workflows
          </p>
          
          {/* Feature badges with subtle glow */}
          <div className="flex justify-center gap-2 flex-wrap">
            <Badge variant="outline" className="px-2.5 py-0.5 text-[10px] border-purple-500/20 bg-purple-950/10 backdrop-blur-xl">
              <Sparkles className="h-2.5 w-2.5 mr-1 text-purple-400/60" />
              AI-drevet
            </Badge>
            <Badge variant="outline" className="px-2.5 py-0.5 text-[10px] border-blue-500/20 bg-blue-950/10 backdrop-blur-xl">
              <Shield className="h-2.5 w-2.5 mr-1 text-blue-400/60" />
              CORS-fri
            </Badge>
            <Badge variant="outline" className="px-2.5 py-0.5 text-[10px] border-cyan-500/20 bg-cyan-950/10 backdrop-blur-xl">
              <Workflow className="h-2.5 w-2.5 mr-1 text-cyan-400/60" />
              Automatisering
            </Badge>
            <Badge variant="outline" className="px-2.5 py-0.5 text-[10px] border-emerald-500/20 bg-emerald-950/10 backdrop-blur-xl">
              <Zap className="h-2.5 w-2.5 mr-1 text-emerald-400/60" />
              Produktivitet
            </Badge>
          </div>
          
          {/* Search Bar with delicate glass effect */}
          <div className="max-w-2xl mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 blur-3xl rounded-full" />
            <Input
              type="text"
              placeholder="Søk på nettet eller skriv inn URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="h-12 pl-12 pr-4 text-base shadow-sm bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] relative"
              data-testid="startpage-search"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 text-xs bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05]"
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
          <h2 className="text-sm font-light mb-4 flex items-center gap-2 text-foreground/70 uppercase tracking-wider">
            <Zap className="h-3 w-3 text-yellow-500/70" />
            Hurtighandlinger
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                    className="cursor-pointer hover:shadow-md transition-all duration-300 hover:border-white/20 h-full bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] group"
                    onClick={action.action}
                    data-testid={`quick-action-${index}`}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${action.color} opacity-80 group-hover:opacity-100 flex items-center justify-center mb-2.5 transition-opacity duration-300`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="font-normal text-xs mb-1 text-foreground/90">{action.title}</h3>
                      <p className="text-[10px] text-muted-foreground/70 line-clamp-2 leading-relaxed">{action.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
        
        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-5">
          {/* Recent Sites */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card className="h-full overflow-hidden bg-white/[0.02] backdrop-blur-xl border border-white/[0.05]">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="flex items-center gap-2 text-sm font-light text-foreground/80">
                  <Clock className="h-3 w-3 text-primary/70" />
                  Nylig besøkt
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[240px]">
                  <div className="space-y-1">
                    {recentSites.map((site, index) => (
                      <motion.div
                        key={site.url}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.03 }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-2 h-auto py-1.5 px-2 hover:bg-white/[0.02] border border-transparent hover:border-white/[0.05] transition-all duration-300"
                          onClick={() => onNavigate(site.url)}
                          data-testid={`recent-site-${index}`}
                        >
                          <Globe className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                          <div className="flex-1 text-left min-w-0">
                            <div className="font-normal text-xs truncate text-foreground/80">{site.title}</div>
                            <div className="text-[10px] text-muted-foreground/50 truncate">{site.url}</div>
                          </div>
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 bg-white/[0.02] border-white/[0.05] text-foreground/50">
                            {site.visits}
                          </Badge>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Suggested Workflows */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <Card className="h-full overflow-hidden bg-white/[0.02] backdrop-blur-xl border border-white/[0.05]">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="flex items-center gap-2 text-sm font-light text-foreground/80">
                  <Sparkles className="h-3 w-3 text-purple-500/70" />
                  Foreslåtte workflows
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[240px]">
                  <div className="space-y-2">
                    {suggestedWorkflows.map((workflow, index) => {
                      const Icon = workflow.icon;
                      return (
                        <motion.div
                          key={workflow.title}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.03 }}
                          whileHover={{ x: 3 }}
                          className="p-2.5 rounded-lg border border-white/[0.03] hover:border-white/10 hover:bg-white/[0.02] cursor-pointer transition-all duration-300"
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
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5 border-white/10 text-foreground/60">
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
          </motion.div>
          
          {/* Tips & Features */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1"
          >
            <Card className="h-full overflow-hidden bg-white/[0.02] backdrop-blur-xl border border-white/[0.05]">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="flex items-center gap-2 text-sm font-light text-foreground/80">
                  <HelpCircle className="h-3 w-3 text-blue-500/70" />
                  Tips & funksjoner
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/10">
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded-full bg-blue-500/10">
                        <Rocket className="h-2.5 w-2.5 text-blue-500/60" />
                      </div>
                      <div className="flex-1">
                        <p className="font-normal text-[11px] mb-0.5 text-foreground/70">Hurtigtaster</p>
                        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Ctrl+T</kbd> ny fane • 
                          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono ml-1">Ctrl+W</kbd> lukk fane
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/10">
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded-full bg-green-500/10">
                        <Shield className="h-2.5 w-2.5 text-green-500/60" />
                      </div>
                      <div className="flex-1">
                        <p className="font-normal text-[11px] mb-0.5 text-foreground/70">Privat modus</p>
                        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                          Surf inkognito med beskyttet data og ingen sporing
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/10">
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded-full bg-purple-500/10">
                        <Target className="h-2.5 w-2.5 text-purple-500/60" />
                      </div>
                      <div className="flex-1">
                        <p className="font-normal text-[11px] mb-0.5 text-foreground/70">AI-automatisering</p>
                        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                          Ta opp handlinger og la AI lage workflows automatisk
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/5 to-red-500/5 border border-orange-500/10">
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded-full bg-orange-500/10">
                        <Code2 className="h-2.5 w-2.5 text-orange-500/60" />
                      </div>
                      <div className="flex-1">
                        <p className="font-normal text-[11px] mb-0.5 text-foreground/70">Utviklermodus</p>
                        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                          Inspiser elementer og test API-er direkte
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 h-7 text-[11px] hover:bg-white/[0.02] border border-white/[0.03]"
                    onClick={() => onOpenSettings?.()}
                    data-testid="open-settings"
                  >
                    <Settings className="h-3 w-3 mr-1.5" />
                    Åpne innstillinger
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}