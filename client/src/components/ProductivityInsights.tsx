import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Brain, 
  Zap, 
  Activity,
  BarChart3,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Sparkles,
  ChevronRight,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ActivityMetric {
  id: string;
  type: 'browse' | 'search' | 'workflow' | 'ai-chat' | 'code' | 'research';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  context: string;
  productivity: number; // 0-100
  insights?: string[];
}

interface ProductivityGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline?: Date;
  priority: 'low' | 'medium' | 'high';
}

interface Insight {
  id: string;
  type: 'tip' | 'warning' | 'achievement' | 'suggestion';
  title: string;
  description: string;
  actionable?: {
    label: string;
    action: () => void;
  };
  timestamp: Date;
}

export function ProductivityInsights() {
  const [isTracking, setIsTracking] = useState(true);
  const [currentActivity, setCurrentActivity] = useState<ActivityMetric | null>(null);
  const [activities, setActivities] = useState<ActivityMetric[]>([]);
  const [goals, setGoals] = useState<ProductivityGoal[]>([
    {
      id: '1',
      title: 'Fokustid i dag',
      target: 240,
      current: 145,
      unit: 'minutter',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Oppgaver fullført',
      target: 8,
      current: 5,
      unit: 'oppgaver',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Kodelinjer skrevet',
      target: 500,
      current: 287,
      unit: 'linjer',
      priority: 'low'
    }
  ]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [focusTime, setFocusTime] = useState(0);
  const [productivityScore, setProductivityScore] = useState(75);

  // Oppdater fokustid
  useEffect(() => {
    if (!isTracking || !currentActivity) return;
    
    const interval = setInterval(() => {
      setFocusTime(prev => prev + 1);
      
      // Oppdater gjeldende aktivitet
      if (currentActivity) {
        const duration = Date.now() - currentActivity.startTime.getTime();
        setCurrentActivity(prev => prev ? { ...prev, duration } : null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking, currentActivity]);

  // Generer kontekstuelle innsikter
  useEffect(() => {
    const generateInsights = () => {
      const newInsights: Insight[] = [];
      
      // Produktivitetsbaserte innsikter
      if (productivityScore > 80) {
        newInsights.push({
          id: `insight-${Date.now()}-1`,
          type: 'achievement',
          title: 'Høy produktivitet! 🚀',
          description: 'Du har vært veldig produktiv de siste 2 timene. Fortsett slik!',
          timestamp: new Date()
        });
      }
      
      // Tidsbaserte innsikter
      const currentHour = new Date().getHours();
      if (currentHour >= 14 && currentHour <= 15) {
        newInsights.push({
          id: `insight-${Date.now()}-2`,
          type: 'tip',
          title: 'Ettermiddagsdipp',
          description: 'Studier viser at produktiviteten ofte synker på denne tiden. Vurder en kort pause.',
          actionable: {
            label: 'Ta en pause',
            action: () => handleTakeBreak()
          },
          timestamp: new Date()
        });
      }
      
      // Målbaserte innsikter
      const focusGoal = goals.find(g => g.title === 'Fokustid i dag');
      if (focusGoal && focusGoal.current >= focusGoal.target * 0.8) {
        newInsights.push({
          id: `insight-${Date.now()}-3`,
          type: 'achievement',
          title: 'Nær målet!',
          description: `Du har nådd 80% av ditt daglige fokusmål. Bare ${focusGoal.target - focusGoal.current} ${focusGoal.unit} igjen!`,
          timestamp: new Date()
        });
      }
      
      setInsights(prev => [...newInsights, ...prev].slice(0, 10));
    };
    
    const interval = setInterval(generateInsights, 60000); // Hver minutt
    generateInsights(); // Kjør umiddelbart
    
    return () => clearInterval(interval);
  }, [productivityScore, goals]);

  const handleTakeBreak = () => {
    setIsTracking(false);
    if (currentActivity) {
      setCurrentActivity({ ...currentActivity, endTime: new Date() });
    }
    
    setInsights(prev => [{
      id: `break-${Date.now()}`,
      type: 'tip' as const,
      title: 'Pause startet',
      description: 'Ta en 5-10 minutters pause for å lade opp energien.',
      timestamp: new Date()
    }, ...prev].slice(0, 10));
  };

  const toggleTracking = () => {
    setIsTracking(!isTracking);
    
    if (!isTracking) {
      // Start ny aktivitet
      const newActivity: ActivityMetric = {
        id: `activity-${Date.now()}`,
        type: 'browse',
        startTime: new Date(),
        context: 'Generell nettlesing',
        productivity: 75
      };
      setCurrentActivity(newActivity);
      setActivities(prev => [newActivity, ...prev]);
    } else {
      // Stopp gjeldende aktivitet
      if (currentActivity) {
        const updatedActivity = { ...currentActivity, endTime: new Date() };
        setActivities(prev => 
          prev.map(a => a.id === currentActivity.id ? updatedActivity : a)
        );
        setCurrentActivity(null);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}t ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getProductivityColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'achievement': return <Trophy className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'tip': return <Sparkles className="h-4 w-4 text-blue-500" />;
      case 'suggestion': return <Brain className="h-4 w-4 text-purple-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Header med hovedmetrikker */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>Produktivitetsinnsikt</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTracking}
                className={cn(
                  "gap-2",
                  isTracking && "bg-green-500/10 border-green-500/50"
                )}
              >
                {isTracking ? (
                  <>
                    <Pause className="h-3 w-3" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    Start
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Produktivitet</p>
              <p className={cn("text-2xl font-bold", getProductivityColor(productivityScore))}>
                {productivityScore}%
              </p>
              <Progress value={productivityScore} className="h-1" />
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Fokustid</p>
              <p className="text-2xl font-bold">{formatDuration(focusTime)}</p>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Aktiv</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Oppgaver</p>
              <p className="text-2xl font-bold">5/8</p>
              <Progress value={62.5} className="h-1" />
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Effektivitet</p>
              <p className="text-2xl font-bold flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                +12%
              </p>
              <span className="text-xs text-muted-foreground">vs. i går</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs med detaljert informasjon */}
      <Tabs defaultValue="insights" className="flex-1">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">Innsikt</TabsTrigger>
          <TabsTrigger value="goals">Mål</TabsTrigger>
          <TabsTrigger value="activity">Aktivitet</TabsTrigger>
          <TabsTrigger value="analytics">Analyse</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <ScrollArea className="h-[400px] w-full rounded-md">
            <div className="space-y-3 pr-4">
              {insights.map(insight => (
                <Card key={insight.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-medium">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                      {insight.actionable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 mt-2"
                          onClick={insight.actionable.action}
                        >
                          {insight.actionable.label}
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(insight.timestamp, 'HH:mm', { locale: nb })}
                    </span>
                  </div>
                </Card>
              ))}
              
              {insights.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Ingen innsikter ennå</p>
                  <p className="text-xs mt-1">Fortsett å jobbe for å få personlige tips</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <ScrollArea className="h-[400px] w-full rounded-md">
            <div className="space-y-3 pr-4">
              {goals.map(goal => (
                <Card key={goal.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <h4 className="font-medium">{goal.title}</h4>
                      </div>
                      <Badge variant={
                        goal.priority === 'high' ? 'destructive' :
                        goal.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {goal.priority === 'high' ? 'Høy' :
                         goal.priority === 'medium' ? 'Middels' : 'Lav'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fremgang</span>
                        <span className="font-medium">
                          {goal.current}/{goal.target} {goal.unit}
                        </span>
                      </div>
                      <Progress 
                        value={(goal.current / goal.target) * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    {goal.deadline && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Frist: {format(goal.deadline, 'dd. MMM', { locale: nb })}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
              
              <Button variant="outline" className="w-full">
                <Target className="h-4 w-4 mr-2" />
                Legg til nytt mål
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <ScrollArea className="h-[400px] w-full rounded-md">
            <div className="space-y-3 pr-4">
              {/* Gjeldende aktivitet */}
              {currentActivity && (
                <Card className="p-4 border-green-500/50 bg-green-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                      <div>
                        <p className="font-medium">{currentActivity.context}</p>
                        <p className="text-sm text-muted-foreground">
                          Pågår - {formatDuration(Math.floor((currentActivity.duration || 0) / 1000))}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-500">
                      Aktiv
                    </Badge>
                  </div>
                </Card>
              )}
              
              {/* Tidligere aktiviteter */}
              {activities.filter(a => a.endTime).map(activity => (
                <Card key={activity.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{activity.context}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{format(activity.startTime, 'HH:mm', { locale: nb })}</span>
                        <span>•</span>
                        <span>{formatDuration(Math.floor((activity.duration || 0) / 1000))}</span>
                        <span>•</span>
                        <span className={getProductivityColor(activity.productivity)}>
                          {activity.productivity}% produktiv
                        </span>
                      </div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              ))}
              
              {activities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Ingen aktivitet registrert</p>
                  <p className="text-xs mt-1">Start sporing for å se din aktivitet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Produktivitetstrender</CardTitle>
              <CardDescription>Siste 7 dager</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Enkle visualiseringer */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Mandag</span>
                    <span className="text-muted-foreground">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tirsdag</span>
                    <span className="text-muted-foreground">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Onsdag</span>
                    <span className="text-muted-foreground">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Torsdag</span>
                    <span className="text-muted-foreground">88%</span>
                  </div>
                  <Progress value={88} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">I dag</span>
                    <span className="text-muted-foreground font-medium">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Toppkategorier</CardTitle>
              <CardDescription>Mest produktive aktiviteter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Koding</span>
                </div>
                <span className="text-sm font-medium">94%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Forskning</span>
                </div>
                <span className="text-sm font-medium">87%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Analyse</span>
                </div>
                <span className="text-sm font-medium">82%</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}