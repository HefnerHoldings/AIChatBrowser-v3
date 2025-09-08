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
  const [activeTab, setActiveTab] = useState('goals');
  
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
        <div className="flex items-center justify-between">
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
              <p className="text-sm text-muted-foreground">XP til neste nivå</p>
              <div className="flex items-center gap-2">
                <Progress value={(currentXP / nextLevelXP) * 100} className="w-32 h-2" />
                <span className="text-xs font-medium">{currentXP}/{nextLevelXP}</span>
              </div>
            </div>
            <Button size="sm" variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Nytt mål
            </Button>
          </div>
        </div>
      </div>

      {/* Main content with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar navigation */}
        <div className="w-64 border-r bg-muted/10 p-4">
          <div className="space-y-2">
            <Button
              variant={activeTab === 'goals' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('goals')}
            >
              <Target className="h-4 w-4 mr-2" />
              Mål
            </Button>
            <Button
              variant={activeTab === 'achievements' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('achievements')}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Prestasjoner
            </Button>
            <Button
              variant={activeTab === 'challenges' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('challenges')}
            >
              <Zap className="h-4 w-4 mr-2" />
              Utfordringer
            </Button>
            <Button
              variant={activeTab === 'leaderboard' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('leaderboard')}
            >
              <Crown className="h-4 w-4 mr-2" />
              Leaderboard
            </Button>
            <Button
              variant={activeTab === 'stats' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('stats')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Statistikk
            </Button>
          </div>

          {/* Quick stats in sidebar */}
          <div className="mt-8 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Aktive mål</span>
                <span className="font-bold">{goals.filter(g => g.status === 'active').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Fullførte</span>
                <span className="font-bold">{goals.filter(g => g.status === 'completed').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Achievements</span>
                <span className="font-bold">{achievements.filter(a => a.unlockedAt).length}/{achievements.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'goals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Aktive mål</h2>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    <Circle className="h-3 w-3 mr-1 fill-green-500 text-green-500" />
                    {goals.filter(g => g.difficulty === 'easy').length} Easy
                  </Badge>
                  <Badge variant="outline">
                    <Circle className="h-3 w-3 mr-1 fill-blue-500 text-blue-500" />
                    {goals.filter(g => g.difficulty === 'medium').length} Medium
                  </Badge>
                  <Badge variant="outline">
                    <Circle className="h-3 w-3 mr-1 fill-purple-500 text-purple-500" />
                    {goals.filter(g => g.difficulty === 'hard').length} Hard
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4">
                {goals.map(goal => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getCategoryIcon(goal.category)}
                              <h3 className="font-semibold">{goal.title}</h3>
                              <Badge className={getDifficultyColor(goal.difficulty)}>
                                {goal.difficulty}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{goal.description}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="mb-1">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {goal.xpReward} XP
                            </Badge>
                            {goal.deadline && (
                              <p className="text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {new Date(goal.deadline).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-medium">{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>

                        {goal.subtasks && (
                          <div className="mt-3 space-y-1">
                            {goal.subtasks.map(subtask => (
                              <div key={subtask.id} className="flex items-center gap-2 text-sm">
                                {subtask.completed ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                                  {subtask.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Achievements</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {achievements.map(achievement => (
                  <motion.div
                    key={achievement.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card className={`${achievement.unlockedAt ? '' : 'opacity-50 grayscale'}`}>
                      <CardContent className="p-4 text-center">
                        <div className="text-4xl mb-2">{achievement.icon}</div>
                        <h3 className={`font-bold ${getRarityColor(achievement.rarity)}`}>
                          {achievement.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {achievement.description}
                        </p>
                        {achievement.unlockedAt && (
                          <Badge variant="outline" className="mt-2">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {achievement.unlockedAt.toLocaleDateString()}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'challenges' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Ukentlige utfordringer</h2>
              <Card className="border-2 border-primary">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        {weeklyChallenge.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {weeklyChallenge.description}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{weeklyChallenge.reward} XP</p>
                      <p className="text-xs text-muted-foreground">Belønning</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {weeklyChallenge.participants} deltakere
                    </span>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {weeklyChallenge.timeLeft} igjen
                    </Badge>
                  </div>
                  <Button className="w-full mt-4">
                    Delta i utfordring
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {[
                      { rank: 1, name: 'Sarah Chen', points: 28450, avatar: '👩‍💻' },
                      { rank: 2, name: 'Erik Nordmann', points: 24320, avatar: '🧑‍💻' },
                      { rank: 3, name: 'Lisa Berg', points: 21150, avatar: '👩‍🎨' },
                      { rank: 4, name: 'Du', points: totalPoints, avatar: '🎯', highlight: true },
                      { rank: 5, name: 'Tom Hansen', points: 14200, avatar: '👨‍💼' }
                    ].map(user => (
                      <div key={user.rank} className={`flex items-center gap-3 p-2 rounded-lg ${user.highlight ? 'bg-primary/10' : ''}`}>
                        <div className="w-8 text-center font-bold">
                          {user.rank === 1 && '🥇'}
                          {user.rank === 2 && '🥈'}
                          {user.rank === 3 && '🥉'}
                          {user.rank > 3 && `#${user.rank}`}
                        </div>
                        <div className="text-2xl">{user.avatar}</div>
                        <div className="flex-1">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.points.toLocaleString()} poeng</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Statistikk</h2>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Mål fullført</span>
                    </div>
                    <p className="text-2xl font-bold">23</p>
                    <p className="text-xs text-muted-foreground">+5 denne uken</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">Total XP</span>
                    </div>
                    <p className="text-2xl font-bold">{currentXP + (userLevel - 1) * 3000}</p>
                    <p className="text-xs text-muted-foreground">Nivå {userLevel}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">Beste streak</span>
                    </div>
                    <p className="text-2xl font-bold">14 dager</p>
                    <p className="text-xs text-muted-foreground">Nåværende: {streak} dager</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Gjennomsnitt</span>
                    </div>
                    <p className="text-2xl font-bold">3.2 timer</p>
                    <p className="text-xs text-muted-foreground">Per oppgave</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}