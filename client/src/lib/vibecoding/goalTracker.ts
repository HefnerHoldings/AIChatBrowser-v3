// Goal Tracker with Gamification for MadEasy V3.00

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'feature' | 'fix' | 'optimization' | 'documentation' | 'testing';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  points: number; // Reward points
  experience: number; // XP gained
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  created: Date;
  started?: Date;
  completed?: Date;
  deadline?: Date;
  subGoals: SubGoal[];
  dependencies: string[]; // Goal IDs
  tags: string[];
  metrics: GoalMetrics;
}

export interface SubGoal {
  id: string;
  title: string;
  completed: boolean;
  points: number;
}

export interface GoalMetrics {
  timeSpent: number; // minutes
  linesOfCode: number;
  commits: number;
  testsWritten: number;
  bugsFixes: number;
  performance: number; // 0-100 score
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or icon name
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlocked: boolean;
  unlockedAt?: Date;
  condition: AchievementCondition;
  progress: number; // 0-100
}

export interface AchievementCondition {
  type: 'goals_completed' | 'streak' | 'speed' | 'quality' | 'special';
  target: number;
  current: number;
  metadata?: any;
}

export interface UserProfile {
  id: string;
  username: string;
  level: number;
  experience: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  achievements: string[]; // Achievement IDs
  badges: Badge[];
  stats: UserStats;
  preferences: GamificationPreferences;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  earnedAt: Date;
}

export interface UserStats {
  goalsCompleted: number;
  totalTimeSpent: number; // minutes
  averageCompletionTime: number; // minutes
  successRate: number; // percentage
  favoriteCategory: string;
  productivityScore: number; // 0-100
  weeklyActivity: number[]; // 7 days of activity scores
}

export interface GamificationPreferences {
  enableNotifications: boolean;
  enableSounds: boolean;
  enableAnimations: boolean;
  preferredRewards: ('points' | 'badges' | 'achievements')[];
  competitiveMode: boolean;
}

export interface DailyChallenge {
  id: string;
  date: Date;
  title: string;
  description: string;
  goals: string[]; // Goal IDs
  reward: {
    points: number;
    experience: number;
    badge?: Badge;
  };
  timeLimit: number; // hours
  completed: boolean;
}

export class GoalTracker {
  private goals: Map<string, Goal> = new Map();
  private achievements: Map<string, Achievement> = new Map();
  private userProfile: UserProfile;
  private dailyChallenges: Map<string, DailyChallenge> = new Map();
  private listeners: Set<(event: GameEvent) => void> = new Set();

  constructor(userId: string, username: string) {
    this.userProfile = this.initializeUserProfile(userId, username);
    this.initializeAchievements();
    this.generateDailyChallenge();
  }

  private initializeUserProfile(userId: string, username: string): UserProfile {
    return {
      id: userId,
      username,
      level: 1,
      experience: 0,
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      achievements: [],
      badges: [],
      stats: {
        goalsCompleted: 0,
        totalTimeSpent: 0,
        averageCompletionTime: 0,
        successRate: 0,
        favoriteCategory: 'feature',
        productivityScore: 50,
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0]
      },
      preferences: {
        enableNotifications: true,
        enableSounds: true,
        enableAnimations: true,
        preferredRewards: ['points', 'achievements'],
        competitiveMode: false
      }
    };
  }

  private initializeAchievements() {
    const achievementsList: Achievement[] = [
      {
        id: 'first-goal',
        name: 'First Steps',
        description: 'Complete your first goal',
        icon: '🎯',
        rarity: 'common',
        points: 10,
        unlocked: false,
        condition: { type: 'goals_completed', target: 1, current: 0 },
        progress: 0
      },
      {
        id: 'speed-demon',
        name: 'Speed Demon',
        description: 'Complete 5 goals in one day',
        icon: '⚡',
        rarity: 'rare',
        points: 50,
        unlocked: false,
        condition: { type: 'speed', target: 5, current: 0 },
        progress: 0
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Complete 10 goals with 100% quality score',
        icon: '💎',
        rarity: 'epic',
        points: 100,
        unlocked: false,
        condition: { type: 'quality', target: 10, current: 0 },
        progress: 0
      },
      {
        id: 'marathon-runner',
        name: 'Marathon Runner',
        description: 'Maintain a 30-day streak',
        icon: '🏃',
        rarity: 'legendary',
        points: 500,
        unlocked: false,
        condition: { type: 'streak', target: 30, current: 0 },
        progress: 0
      },
      {
        id: 'bug-hunter',
        name: 'Bug Hunter',
        description: 'Fix 50 bugs',
        icon: '🐛',
        rarity: 'rare',
        points: 75,
        unlocked: false,
        condition: { type: 'special', target: 50, current: 0, metadata: { type: 'bugs' } },
        progress: 0
      }
    ];

    achievementsList.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  createGoal(
    title: string,
    description: string,
    category: Goal['category'],
    difficulty: Goal['difficulty'],
    deadline?: Date
  ): Goal {
    const goal: Goal = {
      id: crypto.randomUUID(),
      title,
      description,
      category,
      priority: 'medium',
      status: 'pending',
      progress: 0,
      points: this.calculatePoints(difficulty),
      experience: this.calculateExperience(difficulty),
      difficulty,
      created: new Date(),
      deadline,
      subGoals: [],
      dependencies: [],
      tags: [],
      metrics: {
        timeSpent: 0,
        linesOfCode: 0,
        commits: 0,
        testsWritten: 0,
        bugsFixes: 0,
        performance: 0
      }
    };

    this.goals.set(goal.id, goal);
    this.emitEvent({
      type: 'goal_created',
      payload: goal,
      timestamp: new Date()
    });

    return goal;
  }

  startGoal(goalId: string): boolean {
    const goal = this.goals.get(goalId);
    if (!goal || goal.status !== 'pending') {
      return false;
    }

    goal.status = 'active';
    goal.started = new Date();
    this.goals.set(goalId, goal);

    this.emitEvent({
      type: 'goal_started',
      payload: goal,
      timestamp: new Date()
    });

    return true;
  }

  updateProgress(goalId: string, progress: number, metrics?: Partial<GoalMetrics>): boolean {
    const goal = this.goals.get(goalId);
    if (!goal || goal.status !== 'active') {
      return false;
    }

    const oldProgress = goal.progress;
    goal.progress = Math.min(100, Math.max(0, progress));

    if (metrics) {
      goal.metrics = { ...goal.metrics, ...metrics };
    }

    this.goals.set(goalId, goal);

    // Check for milestone achievements
    if (oldProgress < 25 && goal.progress >= 25) {
      this.awardBonus('25% Milestone', 5, 10);
    } else if (oldProgress < 50 && goal.progress >= 50) {
      this.awardBonus('Halfway There!', 10, 20);
    } else if (oldProgress < 75 && goal.progress >= 75) {
      this.awardBonus('Almost Done!', 15, 30);
    }

    if (goal.progress === 100) {
      this.completeGoal(goalId);
    }

    this.emitEvent({
      type: 'progress_updated',
      payload: { goal, oldProgress },
      timestamp: new Date()
    });

    return true;
  }

  private completeGoal(goalId: string): boolean {
    const goal = this.goals.get(goalId);
    if (!goal) {
      return false;
    }

    goal.status = 'completed';
    goal.completed = new Date();
    goal.progress = 100;

    // Award points and experience
    this.userProfile.totalPoints += goal.points;
    this.addExperience(goal.experience);

    // Update stats
    this.userProfile.stats.goalsCompleted++;
    this.updateStreak();
    this.checkAchievements();

    this.goals.set(goalId, goal);

    this.emitEvent({
      type: 'goal_completed',
      payload: goal,
      timestamp: new Date()
    });

    // Celebration animation trigger
    this.triggerCelebration(goal);

    return true;
  }

  private addExperience(amount: number) {
    this.userProfile.experience += amount;
    
    // Check for level up
    const requiredXP = this.getRequiredExperience(this.userProfile.level);
    if (this.userProfile.experience >= requiredXP) {
      this.levelUp();
    }
  }

  private levelUp() {
    this.userProfile.level++;
    this.userProfile.experience = 0;

    const badge: Badge = {
      id: `level-${this.userProfile.level}`,
      name: `Level ${this.userProfile.level}`,
      icon: '⭐',
      color: this.getLevelColor(this.userProfile.level),
      earnedAt: new Date()
    };

    this.userProfile.badges.push(badge);

    this.emitEvent({
      type: 'level_up',
      payload: {
        newLevel: this.userProfile.level,
        badge
      },
      timestamp: new Date()
    });
  }

  private updateStreak() {
    const today = new Date().toDateString();
    const lastActivity = localStorage.getItem('lastActivityDate');

    if (lastActivity === today) {
      // Already active today
      return;
    }

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    if (lastActivity === yesterday) {
      // Continuing streak
      this.userProfile.currentStreak++;
    } else {
      // Streak broken
      this.userProfile.currentStreak = 1;
    }

    if (this.userProfile.currentStreak > this.userProfile.longestStreak) {
      this.userProfile.longestStreak = this.userProfile.currentStreak;
    }

    localStorage.setItem('lastActivityDate', today);
  }

  private checkAchievements() {
    this.achievements.forEach(achievement => {
      if (!achievement.unlocked) {
        const progress = this.calculateAchievementProgress(achievement);
        achievement.progress = progress;

        if (progress >= 100) {
          this.unlockAchievement(achievement.id);
        }
      }
    });
  }

  private calculateAchievementProgress(achievement: Achievement): number {
    switch (achievement.condition.type) {
      case 'goals_completed':
        achievement.condition.current = this.userProfile.stats.goalsCompleted;
        break;
      case 'streak':
        achievement.condition.current = this.userProfile.currentStreak;
        break;
      case 'quality':
        achievement.condition.current = Array.from(this.goals.values())
          .filter(g => g.status === 'completed' && g.metrics.performance === 100)
          .length;
        break;
      case 'speed':
        // Count goals completed today
        const today = new Date().toDateString();
        achievement.condition.current = Array.from(this.goals.values())
          .filter(g => g.completed && g.completed.toDateString() === today)
          .length;
        break;
      case 'special':
        if (achievement.condition.metadata?.type === 'bugs') {
          achievement.condition.current = Array.from(this.goals.values())
            .reduce((sum, g) => sum + g.metrics.bugsFixes, 0);
        }
        break;
    }

    return Math.min(100, (achievement.condition.current / achievement.condition.target) * 100);
  }

  private unlockAchievement(achievementId: string) {
    const achievement = this.achievements.get(achievementId);
    if (!achievement || achievement.unlocked) {
      return;
    }

    achievement.unlocked = true;
    achievement.unlockedAt = new Date();
    achievement.progress = 100;

    this.userProfile.achievements.push(achievementId);
    this.userProfile.totalPoints += achievement.points;

    this.emitEvent({
      type: 'achievement_unlocked',
      payload: achievement,
      timestamp: new Date()
    });
  }

  private generateDailyChallenge() {
    const challenges = [
      {
        title: 'Speed Run',
        description: 'Complete 3 easy goals in 2 hours',
        goalCount: 3,
        difficulty: 'easy' as const,
        timeLimit: 2,
        reward: { points: 50, experience: 100 }
      },
      {
        title: 'Quality Focus',
        description: 'Complete 1 goal with 100% quality score',
        goalCount: 1,
        difficulty: 'any' as const,
        timeLimit: 4,
        reward: { points: 75, experience: 150 }
      },
      {
        title: 'Bug Squasher',
        description: 'Fix 5 bugs today',
        goalCount: 5,
        difficulty: 'any' as const,
        timeLimit: 8,
        reward: { points: 100, experience: 200 }
      }
    ];

    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    const challenge: DailyChallenge = {
      id: crypto.randomUUID(),
      date: new Date(),
      title: randomChallenge.title,
      description: randomChallenge.description,
      goals: [],
      reward: randomChallenge.reward,
      timeLimit: randomChallenge.timeLimit,
      completed: false
    };

    this.dailyChallenges.set(challenge.id, challenge);
    return challenge;
  }

  private calculatePoints(difficulty: Goal['difficulty']): number {
    const pointsMap = {
      easy: 10,
      medium: 25,
      hard: 50,
      expert: 100
    };
    return pointsMap[difficulty];
  }

  private calculateExperience(difficulty: Goal['difficulty']): number {
    const xpMap = {
      easy: 20,
      medium: 50,
      hard: 100,
      expert: 200
    };
    return xpMap[difficulty];
  }

  private getRequiredExperience(level: number): number {
    return level * 100 + (level - 1) * 50; // Progressive scaling
  }

  private getLevelColor(level: number): string {
    if (level < 10) return '#9CA3AF'; // Gray
    if (level < 25) return '#10B981'; // Green
    if (level < 50) return '#3B82F6'; // Blue
    if (level < 75) return '#8B5CF6'; // Purple
    if (level < 100) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  }

  private awardBonus(reason: string, points: number, experience: number) {
    this.userProfile.totalPoints += points;
    this.addExperience(experience);

    this.emitEvent({
      type: 'bonus_awarded',
      payload: { reason, points, experience },
      timestamp: new Date()
    });
  }

  private triggerCelebration(goal: Goal) {
    const celebrations = [
      { emoji: '🎉', message: 'Awesome job!' },
      { emoji: '🚀', message: 'You\'re on fire!' },
      { emoji: '💪', message: 'Keep crushing it!' },
      { emoji: '⭐', message: 'Stellar performance!' },
      { emoji: '🏆', message: 'Champion!' }
    ];

    const celebration = celebrations[Math.floor(Math.random() * celebrations.length)];

    this.emitEvent({
      type: 'celebration',
      payload: {
        goal,
        celebration
      },
      timestamp: new Date()
    });
  }

  private emitEvent(event: GameEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  subscribe(listener: (event: GameEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getGoals(): Goal[] {
    return Array.from(this.goals.values());
  }

  getAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  getUserProfile(): UserProfile {
    return this.userProfile;
  }

  getDailyChallenge(): DailyChallenge | null {
    const today = new Date().toDateString();
    const challenges = Array.from(this.dailyChallenges.values());
    return challenges.find(c => c.date.toDateString() === today) || null;
  }

  getLeaderboard(): any[] {
    // This would fetch from a backend in production
    return [
      { username: this.userProfile.username, points: this.userProfile.totalPoints, level: this.userProfile.level },
      { username: 'DevMaster', points: 15000, level: 42 },
      { username: 'CodeNinja', points: 12000, level: 35 },
      { username: 'BugSlayer', points: 9000, level: 28 }
    ].sort((a, b) => b.points - a.points);
  }
}

interface GameEvent {
  type: 'goal_created' | 'goal_started' | 'progress_updated' | 'goal_completed' | 
        'achievement_unlocked' | 'level_up' | 'bonus_awarded' | 'celebration';
  payload: any;
  timestamp: Date;
}