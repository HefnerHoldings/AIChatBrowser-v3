import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target,
  CheckCircle2,
  Circle,
  ChevronRight,
  Trophy,
  Zap,
  TrendingUp,
  Clock,
  Sparkles,
  Flag,
  ArrowUp,
  Star,
  Gift,
  Award,
  Flame
} from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  progress: number;
  steps: {
    id: string;
    title: string;
    completed: boolean;
    active?: boolean;
  }[];
  timeEstimate?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  streak?: number;
}

export function GoalTracker() {
  const [activeGoal, setActiveGoal] = useState<Goal>({
    id: '1',
    title: 'Find 150 EU cookware wholesalers',
    progress: 67,
    timeEstimate: '2h 15m',
    difficulty: 'medium',
    streak: 3,
    steps: [
      { id: '1', title: 'Search Google for wholesalers', completed: true },
      { id: '2', title: 'Extract contact details', completed: true },
      { id: '3', title: 'Validate email formats', completed: false, active: true },
      { id: '4', title: 'Export to XLSX', completed: false }
    ]
  });

  const [showCelebration, setShowCelebration] = useState(false);
  const [recentAchievement, setRecentAchievement] = useState<string | null>(null);
  const [points, setPoints] = useState(1250);
  const [level, setLevel] = useState(8);
  const [nextLevelProgress, setNextLevelProgress] = useState(75);

  // Simulate progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeGoal.progress < 100) {
        setActiveGoal(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 1, 100)
        }));
        setPoints(prev => prev + 5);
        setNextLevelProgress(prev => {
          const newProgress = prev + 0.5;
          if (newProgress >= 100) {
            setLevel(l => l + 1);
            setRecentAchievement('Level Up! 🎉');
            setTimeout(() => setRecentAchievement(null), 3000);
            return 0;
          }
          return newProgress;
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeGoal.progress]);

  const handleStepComplete = (stepId: string) => {
    setActiveGoal(prev => ({
      ...prev,
      steps: prev.steps.map(step => {
        if (step.id === stepId) {
          if (!step.completed) {
            setPoints(p => p + 50);
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 2000);
          }
          return { ...step, completed: true, active: false };
        }
        // Auto-activate next step
        if (prev.steps.findIndex(s => s.id === stepId) === prev.steps.findIndex(s => !s.completed) - 1) {
          return { ...step, active: true };
        }
        return step;
      })
    }));
  };

  const completedSteps = activeGoal.steps.filter(s => s.completed).length;
  const totalSteps = activeGoal.steps.length;

  return (
    <div className="space-y-4">
      {/* Main Goal Card with Micro-interactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-4 relative overflow-hidden">
          {/* Background gradient animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 animate-pulse" />
          
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"
                >
                  <Target className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="font-semibold text-lg">{activeGoal.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {activeGoal.timeEstimate}
                    </Badge>
                    {activeGoal.streak && activeGoal.streak > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1"
                      >
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">{activeGoal.streak} days</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-right"
              >
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {activeGoal.progress}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {completedSteps}/{totalSteps} steps
                </div>
              </motion.div>
            </div>

            {/* Animated Progress Bar */}
            <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-4">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${activeGoal.progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
              {activeGoal.progress > 0 && (
                <motion.div
                  className="absolute right-0 top-0 h-full w-1 bg-white"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ right: `${100 - activeGoal.progress}%` }}
                />
              )}
            </div>

            {/* Steps with Micro-interactions */}
            <div className="space-y-2">
              {activeGoal.steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 5 }}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                    step.completed ? 'bg-green-50 dark:bg-green-900/20' : 
                    step.active ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 
                    'hover:bg-muted/50'
                  }`}
                  onClick={() => !step.completed && handleStepComplete(step.id)}
                >
                  <motion.div
                    whileTap={{ scale: 0.8 }}
                    animate={step.active ? { scale: [1, 1.2, 1] } : {}}
                    transition={step.active ? { duration: 1, repeat: Infinity } : {}}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : step.active ? (
                      <div className="relative">
                        <Circle className="h-5 w-5 text-blue-600" />
                        <motion.div
                          className="absolute inset-0"
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Circle className="h-5 w-5 text-blue-600" />
                        </motion.div>
                      </div>
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </motion.div>
                  
                  <span className={`text-sm ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {step.title}
                  </span>
                  
                  {step.active && (
                    <motion.div
                      className="ml-auto"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Gamification Stats */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Card className="p-3 text-center cursor-pointer hover:shadow-lg transition-shadow">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
            >
              <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
            </motion.div>
            <div className="text-2xl font-bold">{points.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Points</div>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Card className="p-3 text-center cursor-pointer hover:shadow-lg transition-shadow">
            <div className="relative">
              <Award className="h-6 w-6 text-purple-500 mx-auto mb-1" />
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-3 w-3 text-purple-400" />
              </motion.div>
            </div>
            <div className="text-2xl font-bold">Level {level}</div>
            <Progress value={nextLevelProgress} className="h-1 mt-1" />
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Card className="p-3 text-center cursor-pointer hover:shadow-lg transition-shadow">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-1" />
            </motion.div>
            <div className="text-2xl font-bold">89%</div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </Card>
        </motion.div>
      </div>

      {/* Achievement Notifications */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Card className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <CheckCircle2 className="h-6 w-6" />
                </motion.div>
                <div>
                  <p className="font-semibold">Step Completed!</p>
                  <p className="text-sm opacity-90">+50 points earned</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {recentAchievement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed top-4 right-4 z-50"
          >
            <Card className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-xl">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 1 }}
                >
                  <Star className="h-6 w-6" />
                </motion.div>
                <p className="font-semibold">{recentAchievement}</p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions with Hover Effects */}
      <div className="flex gap-2">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
          <Button variant="outline" className="w-full" size="sm">
            <Flag className="h-4 w-4 mr-2" />
            Add Milestone
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
          <Button variant="outline" className="w-full" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Speed Boost
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
          <Button variant="outline" className="w-full" size="sm">
            <Gift className="h-4 w-4 mr-2" />
            Rewards
          </Button>
        </motion.div>
      </div>
    </div>
  );
}