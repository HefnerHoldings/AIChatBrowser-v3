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
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Bot,
      title: 'AI Assistent',
      description: 'Få hjelp fra AI',
      action: () => {},
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Video,
      title: 'Ta opp handlinger',
      description: 'Spill inn og automatiser',
      action: () => {},
      color: 'from-red-500 to-orange-500'
    },
    {
      icon: Mic,
      title: 'Talekommandoer',
      description: 'Kontroller med stemmen',
      action: () => {},
      color: 'from-green-500 to-emerald-500'
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
    <div className="h-full bg-gradient-to-br from-background via-background to-purple-950/10 overflow-auto relative z-10">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
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
          
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Fremtidens nettleser med innebygget AI-intelligens, automatisering og avanserte workflows
          </p>
          
          {/* Feature badges */}
          <div className="flex justify-center gap-3 flex-wrap">
            <Badge variant="outline" className="px-3 py-1">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-drevet
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Shield className="h-3 w-3 mr-1" />
              CORS-fri
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Workflow className="h-3 w-3 mr-1" />
              Automatisering
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Zap className="h-3 w-3 mr-1" />
              Produktivitet
            </Badge>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Input
              type="text"
              placeholder="Søk på nettet eller skriv inn URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="h-14 pl-12 pr-4 text-lg shadow-lg"
              data-testid="startpage-search"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2"
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
        >
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Hurtighandlinger
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all"
                    onClick={action.action}
                    data-testid={`quick-action-${index}`}
                  >
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Recent Sites */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Nylig besøkt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {recentSites.map((site, index) => (
                      <motion.div
                        key={site.url}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 hover:bg-accent"
                          onClick={() => onNavigate(site.url)}
                          data-testid={`recent-site-${index}`}
                        >
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 text-left">
                            <div className="font-medium">{site.title}</div>
                            <div className="text-xs text-muted-foreground">{site.url}</div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
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
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Foreslåtte workflows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {suggestedWorkflows.map((workflow, index) => {
                      const Icon = workflow.icon;
                      return (
                        <motion.div
                          key={workflow.title}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          whileHover={{ x: 5 }}
                          className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-all"
                          onClick={() => onStartWorkflow?.()}
                          data-testid={`workflow-suggestion-${index}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-md bg-purple-500/10">
                              <Icon className="h-4 w-4 text-purple-500" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium mb-1">{workflow.title}</h4>
                              <p className="text-xs text-muted-foreground mb-2">
                                {workflow.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
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
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-500" />
                  Tips & funksjoner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-start gap-2">
                      <Rocket className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Hurtigtaster</p>
                        <p className="text-xs text-muted-foreground">
                          Bruk <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+T</kbd> for ny fane
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-green-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Privat modus</p>
                        <p className="text-xs text-muted-foreground">
                          Surf inkognito med beskyttet data
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-purple-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">AI-automatisering</p>
                        <p className="text-xs text-muted-foreground">
                          Ta opp handlinger og la AI lage workflows
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onOpenSettings?.()}
                    data-testid="open-settings"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Innstillinger
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