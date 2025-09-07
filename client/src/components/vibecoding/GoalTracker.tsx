import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Trophy,
  Star,
  Flame,
  TrendingUp,
  Zap,
  Award,
  ChevronRight,
  Plus,
  CheckCircle,
  Circle,
  Clock,
  Calendar,
  BarChart3,
  Users,
  Brain,
  Sparkles,
  Gift,
  Crown,
  Medal,
  Rocket,
  Code,
  Shield
} from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  xpReward: number;
  status: 'pending' | 'active' | 'completed';
  category: 'development' | 'quality' | 'collaboration' | 'learning';
  difficulty: 'easy' | 'medium' | 'hard' | 'epic';
  deadline?: Date;
  subtasks?: SubTask[];
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export function GoalTracker() {
  const [userLevel, setUserLevel] = useState(12);
  const [currentXP, setCurrentXP] = useState(2840);
  const [nextLevelXP] = useState(3000);
  const [streak, setStreak] = useState(7);
  const [totalPoints, setTotalPoints] = useState(15420);
  
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Implementer OAuth 2.0 autentisering',
      description: 'Legg til sikker innlogging med Google og GitHub',
      progress: 75,
      xpReward: 250,
      status: 'active',
      category: 'development',
      difficulty: 'medium',
      deadline: new Date('2025-01-20'),
      subtasks: [
        { id: 's1', title: 'Setup OAuth providers', completed: true },
        { id: 's2', title: 'Implement callback handlers', completed: true },
        { id: 's3', title: 'Add user session management', completed: true },
        { id: 's4', title: 'Write tests', completed: false }
      ]
    },
    {
      id: '2',
      title: 'Optimaliser database queries',
      description: 'Reduser responstid med 50% på kritiske endpoints',
      progress: 40,
      xpReward: 300,
      status: 'active',
      category: 'quality',
      difficulty: 'hard',
      deadline: new Date('2025-01-25')
    },
    {
      id: '3',
      title: 'Code review 5 pull requests',
      description: 'Hjelp teamet med konstruktive tilbakemeldinger',
      progress: 60,
      xpReward: 150,
      status: 'active',
      category: 'collaboration',
      difficulty: 'easy'
    },
    {
      id: '4',
      title: 'Mestre React Server Components',
      description: 'Fullfør kurs og bygg demo-applikasjon',
      progress: 20,
      xpReward: 400,
      status: 'active',
      category: 'learning',
      difficulty: 'epic'
    }
  ]);

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'a1',
      title: 'Speed Demon',
      description: 'Fullfør 10 oppgaver på under 1 time hver',
      icon: '⚡',
      unlockedAt: new Date('2025-01-10'),
      rarity: 'rare'
    },
    {
      id: 'a2',
      title: 'Quality Guardian',
      description: 'Oppnå 100% test coverage på 5 moduler',
      icon: '🛡️',
      unlockedAt: new Date('2025-01-08'),
      rarity: 'epic'
    },
    {
      id: 'a3',
      title: 'Team Player',
      description: 'Hjelp 20 teammedlemmer med deres oppgaver',
      icon: '🤝',
      rarity: 'common'
    },
    {
      id: 'a4',
      title: 'AI Whisperer',
      description: 'Bruk AI-assistenter 100 ganger effektivt',
      icon: '🤖',
      unlockedAt: new Date('2025-01-12'),
      rarity: 'legendary'
    }
  ]);

  const [weeklyChallenge] = useState({
    title: 'Zero Bug Week',
    description: 'Deploy uten en eneste bug denne uken',
    reward: 500,
    participants: 42,
    timeLeft: '3 dager'
  });

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-green-500',
      medium: 'bg-blue-500',
      hard: 'bg-purple-500',
      epic: 'bg-gradient-to-r from-purple-500 to-pink-500'
    };
    return colors[difficulty] || 'bg-gray-500';
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'text-gray-500',
      rare: 'text-blue-500',
      epic: 'text-purple-500',
      legendary: 'text-amber-500'
    };
    return colors[rarity] || 'text-gray-500';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      development: Code,
      quality: Shield,
      collaboration: Users,
      learning: Brain
    };
    const Icon = icons[category] || Target;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Stats */}
      <div className="border-b p-4 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-green-500/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{userLevel}</span>
              </div>
              <Badge className="absolute -bottom-1 -right-1 bg-amber-500">
                <Crown className="h-3 w-3 mr-1" />
                Pro
              </Badge>
            </div>
            <div>
              <h3 className="text-lg font-bold">Goal Tracker</h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  {totalPoints.toLocaleString()} pts
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  {streak} dagers streak
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">XP til level {userLevel + 1}</p>
              <div className="flex items-center gap-2">
                <Progress value={(currentXP / nextLevelXP) * 100} className="w-32 h-2" />
                <span className="text-xs font-medium">{currentXP}/{nextLevelXP}</span>
              </div>
            </div>
            <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-500">
              <Plus className="h-4 w-4 mr-1" />
              Nytt mål
            </Button>
          </div>
        </div>

        {/* Weekly Challenge Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg p-3 border border-amber-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">{weeklyChallenge.title}</p>
                <p className="text-xs text-muted-foreground">{weeklyChallenge.description}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-1">
                <Gift className="h-3 w-3 mr-1" />
                {weeklyChallenge.reward} XP
              </Badge>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {weeklyChallenge.participants} deltar
                <Clock className="h-3 w-3 ml-2" />
                {weeklyChallenge.timeLeft}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="active" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="active">Aktive mål</TabsTrigger>
          <TabsTrigger value="completed">Fullført</TabsTrigger>
          <TabsTrigger value="achievements">Prestasjoner</TabsTrigger>
          <TabsTrigger value="stats">Statistikk</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="flex-1 p-4">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {goals.filter(g => g.status === 'active').map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg ${getDifficultyColor(goal.difficulty)} flex items-center justify-center text-white`}>
                            {getCategoryIcon(goal.category)}
                          </div>
                          <div>
                            <CardTitle className="text-base">{goal.title}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">
                            <Star className="h-3 w-3 mr-1" />
                            {goal.xpReward} XP
                          </Badge>
                          {goal.deadline && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {goal.deadline.toLocaleDateString('nb-NO')}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Fremgang</span>
                            <span>{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>

                        {/* Subtasks */}
                        {goal.subtasks && (
                          <div className="space-y-1">
                            {goal.subtasks.map(subtask => (
                              <div key={subtask.id} className="flex items-center gap-2 text-sm">
                                {subtask.completed ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Circle className="h-4 w-4 text-gray-400" />
                                )}
                                <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                                  {subtask.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-end">
                          <Button size="sm" variant="ghost">
                            Oppdater
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="completed" className="flex-1 p-4">
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Gratulerer!</h3>
            <p className="text-sm text-muted-foreground">
              Du har fullført 47 mål denne måneden
            </p>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="flex-1 p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`relative ${achievement.unlockedAt ? '' : 'opacity-50'}`}>
                  <CardContent className="p-4 text-center">
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <h4 className="font-semibold text-sm">{achievement.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {achievement.description}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={`mt-2 ${getRarityColor(achievement.rarity)}`}
                    >
                      {achievement.rarity}
                    </Badge>
                    {achievement.unlockedAt && (
                      <div className="absolute top-2 right-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Produktivitet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Mål fullført</span>
                    <span className="font-bold">142</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Gjennomsnittlig tid</span>
                    <span className="font-bold">3.2 dager</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Suksessrate</span>
                    <span className="font-bold">94%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ferdigheter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Development', 'Quality', 'Collaboration'].map((skill) => (
                    <div key={skill}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{skill}</span>
                        <span>Lvl {Math.floor(Math.random() * 10) + 5}</span>
                      </div>
                      <Progress value={Math.random() * 100} className="h-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Milepæler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Medal className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">100 mål nådd</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">30 dagers streak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Top 10% denne måneden</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}