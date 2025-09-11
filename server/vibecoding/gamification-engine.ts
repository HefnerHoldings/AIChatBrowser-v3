import { db } from '../storage';
import {
  userProfiles,
  achievements,
  userAchievements,
  dailyChallenges,
  userChallenges,
  leaderboards,
  gamificationEvents,
  UserProfile,
  Achievement,
  DailyChallenge,
} from '@shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

// XP and Level Configuration
const LEVEL_CONFIG = {
  baseXP: 100,
  multiplier: 1.5,
  maxLevel: 100,
};

// Achievement Categories
export enum AchievementCategory {
  EXPLORER = 'explorer',
  BUILDER = 'builder',
  COLLABORATOR = 'collaborator',
  INNOVATOR = 'innovator',
  SPEEDSTER = 'speedster',
}

// Achievement Rarity
export enum AchievementRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
}

// Event Types
export enum GamificationEventType {
  GOAL_COMPLETED = 'goal_completed',
  TASK_COMPLETED = 'task_completed',
  LEVEL_UP = 'level_up',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  STREAK_MAINTAINED = 'streak_maintained',
  CHALLENGE_COMPLETED = 'challenge_completed',
  MILESTONE_REACHED = 'milestone_reached',
  WORKFLOW_CREATED = 'workflow_created',
  CODE_GENERATED = 'code_generated',
  COLLABORATION_SESSION = 'collaboration_session',
  BUG_FIXED = 'bug_fixed',
  PERFORMANCE_IMPROVED = 'performance_improved',
  SECURITY_ENHANCED = 'security_enhanced',
  DOCUMENTATION_WRITTEN = 'documentation_written',
  TEST_WRITTEN = 'test_written',
  REVIEW_COMPLETED = 'review_completed',
  FEATURE_DEPLOYED = 'feature_deployed',
}

// XP Values for Different Actions
const XP_VALUES = {
  [GamificationEventType.GOAL_COMPLETED]: 100,
  [GamificationEventType.TASK_COMPLETED]: 25,
  [GamificationEventType.WORKFLOW_CREATED]: 50,
  [GamificationEventType.CODE_GENERATED]: 30,
  [GamificationEventType.COLLABORATION_SESSION]: 40,
  [GamificationEventType.BUG_FIXED]: 35,
  [GamificationEventType.PERFORMANCE_IMPROVED]: 45,
  [GamificationEventType.SECURITY_ENHANCED]: 50,
  [GamificationEventType.DOCUMENTATION_WRITTEN]: 20,
  [GamificationEventType.TEST_WRITTEN]: 30,
  [GamificationEventType.REVIEW_COMPLETED]: 25,
  [GamificationEventType.FEATURE_DEPLOYED]: 75,
};

// Power-ups and Boosts
export interface PowerUp {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  duration: number; // in minutes
  cost: number; // virtual currency
}

const POWER_UPS: PowerUp[] = [
  {
    id: 'xp_boost_2x',
    name: 'Double XP',
    description: 'Earn 2x XP for 30 minutes',
    multiplier: 2,
    duration: 30,
    cost: 100,
  },
  {
    id: 'xp_boost_3x',
    name: 'Triple XP',
    description: 'Earn 3x XP for 15 minutes',
    multiplier: 3,
    duration: 15,
    cost: 250,
  },
  {
    id: 'streak_protector',
    name: 'Streak Shield',
    description: 'Protect your streak for 1 day',
    multiplier: 1,
    duration: 1440,
    cost: 150,
  },
  {
    id: 'challenge_reroll',
    name: 'Challenge Reroll',
    description: 'Get a new daily challenge',
    multiplier: 1,
    duration: 0,
    cost: 50,
  },
];

export class GamificationEngine {
  // Calculate XP required for a level
  private calculateXPForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.floor(
      LEVEL_CONFIG.baseXP * Math.pow(LEVEL_CONFIG.multiplier, level - 1)
    );
  }

  // Calculate total XP required up to a level
  private calculateTotalXPForLevel(level: number): number {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += this.calculateXPForLevel(i);
    }
    return total;
  }

  // Calculate level from total XP
  private calculateLevelFromXP(totalXP: number): number {
    let level = 1;
    let requiredXP = 0;
    
    while (level < LEVEL_CONFIG.maxLevel) {
      const nextLevelXP = this.calculateXPForLevel(level + 1);
      if (requiredXP + nextLevelXP > totalXP) break;
      requiredXP += nextLevelXP;
      level++;
    }
    
    return level;
  }

  // Get or create user profile
  async getUserProfile(userId: string): Promise<UserProfile> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    
    if (profile) return profile;
    
    // Create new profile
    const [newProfile] = await db
      .insert(userProfiles)
      .values({
        userId,
        username: `User_${userId.slice(0, 8)}`,
        level: 1,
        experience: 0,
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        preferences: {},
        stats: {},
        badges: [],
      })
      .returning();
    
    return newProfile;
  }

  // Award XP to user
  async awardXP(
    userId: string,
    amount: number,
    eventType: GamificationEventType,
    metadata: any = {}
  ): Promise<{
    newXP: number;
    newLevel: number;
    leveledUp: boolean;
    unlockedAchievements: Achievement[];
  }> {
    const profile = await this.getUserProfile(userId);
    
    // Apply active boosts
    const boostMultiplier = await this.getActiveBoostMultiplier(userId);
    const streakMultiplier = this.getStreakMultiplier(profile.currentStreak);
    const finalXP = Math.floor(amount * boostMultiplier * streakMultiplier);
    
    const newTotalXP = profile.experience + finalXP;
    const newLevel = this.calculateLevelFromXP(newTotalXP);
    const leveledUp = newLevel > profile.level;
    
    // Update profile
    await db
      .update(userProfiles)
      .set({
        experience: newTotalXP,
        level: newLevel,
        totalPoints: profile.totalPoints + finalXP,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId));
    
    // Log event
    await db.insert(gamificationEvents).values({
      userId,
      eventType,
      eventData: {
        ...metadata,
        baseXP: amount,
        finalXP,
        boostMultiplier,
        streakMultiplier,
      },
      points: finalXP,
      experience: finalXP,
    });
    
    // Check for level-up achievements
    const unlockedAchievements: Achievement[] = [];
    if (leveledUp) {
      await this.logEvent(userId, GamificationEventType.LEVEL_UP, { newLevel });
      const levelAchievements = await this.checkLevelAchievements(userId, newLevel);
      unlockedAchievements.push(...levelAchievements);
    }
    
    // Check for other achievements
    const otherAchievements = await this.checkAchievements(userId, eventType, metadata);
    unlockedAchievements.push(...otherAchievements);
    
    // Update leaderboards
    await this.updateLeaderboards(userId);
    
    return {
      newXP: newTotalXP,
      newLevel,
      leveledUp,
      unlockedAchievements,
    };
  }

  // Get streak multiplier
  private getStreakMultiplier(streak: number): number {
    if (streak < 3) return 1;
    if (streak < 7) return 1.1;
    if (streak < 14) return 1.2;
    if (streak < 30) return 1.3;
    if (streak < 60) return 1.5;
    if (streak < 100) return 1.75;
    return 2;
  }

  // Get active boost multiplier
  private async getActiveBoostMultiplier(userId: string): Promise<number> {
    const profile = await this.getUserProfile(userId);
    const activePowerUps = profile.stats?.activePowerUps || [];
    
    let multiplier = 1;
    const now = Date.now();
    
    for (const powerUp of activePowerUps) {
      if (powerUp.expiresAt > now) {
        multiplier = Math.max(multiplier, powerUp.multiplier);
      }
    }
    
    return multiplier;
  }

  // Update streak
  async updateStreak(userId: string): Promise<number> {
    const profile = await this.getUserProfile(userId);
    const now = new Date();
    const lastActivity = profile.lastActivityDate ? new Date(profile.lastActivityDate) : null;
    
    let newStreak = profile.currentStreak;
    
    if (!lastActivity) {
      newStreak = 1;
    } else {
      const daysSince = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSince === 0) {
        // Same day, no change
      } else if (daysSince === 1) {
        // Next day, increment streak
        newStreak++;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }
    
    const longestStreak = Math.max(newStreak, profile.longestStreak);
    
    await db
      .update(userProfiles)
      .set({
        currentStreak: newStreak,
        longestStreak,
        lastActivityDate: now,
        updatedAt: now,
      })
      .where(eq(userProfiles.userId, userId));
    
    // Check streak achievements
    if (newStreak > profile.currentStreak) {
      await this.checkStreakAchievements(userId, newStreak);
    }
    
    return newStreak;
  }

  // Check and unlock achievements
  private async checkAchievements(
    userId: string,
    eventType: GamificationEventType,
    metadata: any
  ): Promise<Achievement[]> {
    const allAchievements = await db.select().from(achievements);
    const userAchievementIds = await db
      .select({ achievementId: userAchievements.achievementId })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
    
    const unlockedIds = new Set(userAchievementIds.map(ua => ua.achievementId));
    const newlyUnlocked: Achievement[] = [];
    
    for (const achievement of allAchievements) {
      if (unlockedIds.has(achievement.id)) continue;
      
      const isUnlocked = await this.checkAchievementCondition(
        userId,
        achievement,
        eventType,
        metadata
      );
      
      if (isUnlocked) {
        await this.unlockAchievement(userId, achievement);
        newlyUnlocked.push(achievement);
      }
    }
    
    return newlyUnlocked;
  }

  // Check specific achievement condition
  private async checkAchievementCondition(
    userId: string,
    achievement: Achievement,
    eventType: GamificationEventType,
    metadata: any
  ): Promise<boolean> {
    const profile = await this.getUserProfile(userId);
    
    switch (achievement.conditionType) {
      case 'total_xp':
        return profile.experience >= achievement.conditionTarget;
      
      case 'level':
        return profile.level >= achievement.conditionTarget;
      
      case 'streak':
        return profile.currentStreak >= achievement.conditionTarget;
      
      case 'tasks_completed':
        const taskCount = profile.stats?.tasksCompleted || 0;
        return taskCount >= achievement.conditionTarget;
      
      case 'workflows_created':
        const workflowCount = profile.stats?.workflowsCreated || 0;
        return workflowCount >= achievement.conditionTarget;
      
      case 'collaboration_hours':
        const collabHours = profile.stats?.collaborationHours || 0;
        return collabHours >= achievement.conditionTarget;
      
      case 'event_type':
        return eventType === achievement.conditionMetadata?.eventType;
      
      case 'specific_action':
        return metadata?.action === achievement.conditionMetadata?.action;
      
      default:
        return false;
    }
  }

  // Unlock achievement for user
  private async unlockAchievement(userId: string, achievement: Achievement): Promise<void> {
    await db.insert(userAchievements).values({
      userId,
      achievementId: achievement.id,
      progress: 100,
      notified: false,
    });
    
    await this.awardXP(
      userId,
      achievement.points,
      GamificationEventType.ACHIEVEMENT_UNLOCKED,
      { achievementId: achievement.id, achievementName: achievement.name }
    );
    
    // Update user's badge collection
    const profile = await this.getUserProfile(userId);
    const badges = profile.badges as any[] || [];
    badges.push({
      id: achievement.id,
      name: achievement.name,
      icon: achievement.icon,
      rarity: achievement.rarity,
      unlockedAt: new Date(),
    });
    
    await db
      .update(userProfiles)
      .set({ badges })
      .where(eq(userProfiles.userId, userId));
  }

  // Check level achievements
  private async checkLevelAchievements(userId: string, level: number): Promise<Achievement[]> {
    const milestones = [5, 10, 20, 30, 50, 75, 100];
    const unlocked: Achievement[] = [];
    
    if (milestones.includes(level)) {
      const levelAchievements = await db
        .select()
        .from(achievements)
        .where(
          and(
            eq(achievements.conditionType, 'level'),
            eq(achievements.conditionTarget, level)
          )
        );
      
      for (const achievement of levelAchievements) {
        const isAlreadyUnlocked = await db
          .select()
          .from(userAchievements)
          .where(
            and(
              eq(userAchievements.userId, userId),
              eq(userAchievements.achievementId, achievement.id)
            )
          )
          .limit(1);
        
        if (isAlreadyUnlocked.length === 0) {
          await this.unlockAchievement(userId, achievement);
          unlocked.push(achievement);
        }
      }
    }
    
    return unlocked;
  }

  // Check streak achievements
  private async checkStreakAchievements(userId: string, streak: number): Promise<Achievement[]> {
    const milestones = [3, 7, 14, 30, 60, 100, 365];
    const unlocked: Achievement[] = [];
    
    if (milestones.includes(streak)) {
      const streakAchievements = await db
        .select()
        .from(achievements)
        .where(
          and(
            eq(achievements.conditionType, 'streak'),
            eq(achievements.conditionTarget, streak)
          )
        );
      
      for (const achievement of streakAchievements) {
        const isAlreadyUnlocked = await db
          .select()
          .from(userAchievements)
          .where(
            and(
              eq(userAchievements.userId, userId),
              eq(userAchievements.achievementId, achievement.id)
            )
          )
          .limit(1);
        
        if (isAlreadyUnlocked.length === 0) {
          await this.unlockAchievement(userId, achievement);
          unlocked.push(achievement);
        }
      }
    }
    
    return unlocked;
  }

  // Get daily challenges
  async getDailyChallenges(date: Date = new Date()): Promise<DailyChallenge[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const challenges = await db
      .select()
      .from(dailyChallenges)
      .where(
        and(
          gte(dailyChallenges.date, startOfDay),
          lte(dailyChallenges.date, endOfDay),
          eq(dailyChallenges.active, true)
        )
      );
    
    // Generate new challenges if none exist
    if (challenges.length === 0) {
      return await this.generateDailyChallenges(date);
    }
    
    return challenges;
  }

  // Generate daily challenges
  private async generateDailyChallenges(date: Date): Promise<DailyChallenge[]> {
    const challengeTemplates = [
      {
        title: 'Speed Coder',
        description: 'Complete 5 tasks in under 2 hours',
        type: 'speed',
        difficulty: 'medium',
        rewardPoints: 50,
        rewardXP: 100,
        requirements: { taskCount: 5, timeLimit: 120 },
      },
      {
        title: 'Quality First',
        description: 'Write 3 unit tests for your code',
        type: 'quality',
        difficulty: 'easy',
        rewardPoints: 30,
        rewardXP: 60,
        requirements: { testCount: 3 },
      },
      {
        title: 'Collaboration Champion',
        description: 'Help 2 team members with their tasks',
        type: 'collaboration',
        difficulty: 'medium',
        rewardPoints: 40,
        rewardXP: 80,
        requirements: { helpCount: 2 },
      },
      {
        title: 'Bug Hunter',
        description: 'Find and fix 3 bugs',
        type: 'quality',
        difficulty: 'hard',
        rewardPoints: 60,
        rewardXP: 120,
        requirements: { bugCount: 3 },
      },
      {
        title: 'Documentation Hero',
        description: 'Document 5 functions or components',
        type: 'quality',
        difficulty: 'easy',
        rewardPoints: 25,
        rewardXP: 50,
        requirements: { docCount: 5 },
      },
    ];
    
    // Select 3 random challenges for the day
    const selectedChallenges = challengeTemplates
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    const newChallenges: DailyChallenge[] = [];
    
    for (const template of selectedChallenges) {
      const [challenge] = await db
        .insert(dailyChallenges)
        .values({
          date,
          title: template.title,
          description: template.description,
          type: template.type as any,
          difficulty: template.difficulty as any,
          rewardPoints: template.rewardPoints,
          rewardXP: template.rewardXP,
          requirements: template.requirements,
          active: true,
        })
        .returning();
      
      newChallenges.push(challenge);
    }
    
    return newChallenges;
  }

  // Start a challenge
  async startChallenge(userId: string, challengeId: string): Promise<void> {
    await db.insert(userChallenges).values({
      userId,
      challengeId,
      progress: 0,
      status: 'active',
    });
  }

  // Update challenge progress
  async updateChallengeProgress(
    userId: string,
    challengeId: string,
    progress: number
  ): Promise<{ completed: boolean; rewards?: { points: number; xp: number } }> {
    const [userChallenge] = await db
      .select()
      .from(userChallenges)
      .where(
        and(
          eq(userChallenges.userId, userId),
          eq(userChallenges.challengeId, challengeId),
          eq(userChallenges.status, 'active')
        )
      )
      .limit(1);
    
    if (!userChallenge) {
      throw new Error('Challenge not found or not active');
    }
    
    const [challenge] = await db
      .select()
      .from(dailyChallenges)
      .where(eq(dailyChallenges.id, challengeId))
      .limit(1);
    
    if (!challenge) {
      throw new Error('Challenge not found');
    }
    
    const newProgress = Math.min(100, progress);
    const completed = newProgress >= 100;
    
    await db
      .update(userChallenges)
      .set({
        progress: newProgress,
        status: completed ? 'completed' : 'active',
        completedAt: completed ? new Date() : null,
      })
      .where(
        and(
          eq(userChallenges.userId, userId),
          eq(userChallenges.challengeId, challengeId)
        )
      );
    
    if (completed) {
      await this.awardXP(
        userId,
        challenge.rewardXP,
        GamificationEventType.CHALLENGE_COMPLETED,
        { challengeId, challengeTitle: challenge.title }
      );
      
      const profile = await this.getUserProfile(userId);
      await db
        .update(userProfiles)
        .set({
          totalPoints: profile.totalPoints + challenge.rewardPoints,
        })
        .where(eq(userProfiles.userId, userId));
      
      return {
        completed: true,
        rewards: {
          points: challenge.rewardPoints,
          xp: challenge.rewardXP,
        },
      };
    }
    
    return { completed: false };
  }

  // Update leaderboards
  async updateLeaderboards(userId: string): Promise<void> {
    const profile = await this.getUserProfile(userId);
    const now = new Date();
    
    // Update different period leaderboards
    const periods = ['daily', 'weekly', 'monthly', 'all-time'];
    const categories = ['points', 'xp', 'streaks', 'achievements'];
    
    for (const period of periods) {
      for (const category of categories) {
        let score = 0;
        
        switch (category) {
          case 'points':
            score = profile.totalPoints;
            break;
          case 'xp':
            score = profile.experience;
            break;
          case 'streaks':
            score = profile.currentStreak;
            break;
          case 'achievements':
            const achievementCount = await db
              .select({ count: sql<number>`count(*)` })
              .from(userAchievements)
              .where(eq(userAchievements.userId, userId));
            score = achievementCount[0].count;
            break;
        }
        
        // Upsert leaderboard entry
        await db
          .insert(leaderboards)
          .values({
            userId,
            period: period as any,
            category: category as any,
            score,
            metadata: {
              username: profile.username,
              level: profile.level,
              avatar: profile.avatar,
            },
          })
          .onConflictDoUpdate({
            target: [leaderboards.userId, leaderboards.period, leaderboards.category],
            set: {
              score,
              calculatedAt: now,
            },
          });
      }
    }
    
    // Calculate ranks
    await this.calculateRanks();
  }

  // Calculate leaderboard ranks
  private async calculateRanks(): Promise<void> {
    const periods = ['daily', 'weekly', 'monthly', 'all-time'];
    const categories = ['points', 'xp', 'streaks', 'achievements'];
    
    for (const period of periods) {
      for (const category of categories) {
        const entries = await db
          .select()
          .from(leaderboards)
          .where(
            and(
              eq(leaderboards.period, period as any),
              eq(leaderboards.category, category as any)
            )
          )
          .orderBy(desc(leaderboards.score));
        
        for (let i = 0; i < entries.length; i++) {
          await db
            .update(leaderboards)
            .set({ rank: i + 1 })
            .where(eq(leaderboards.id, entries[i].id));
        }
      }
    }
  }

  // Get leaderboard
  async getLeaderboard(
    period: string = 'all-time',
    category: string = 'xp',
    limit: number = 100
  ): Promise<any[]> {
    return await db
      .select()
      .from(leaderboards)
      .where(
        and(
          eq(leaderboards.period, period as any),
          eq(leaderboards.category, category as any)
        )
      )
      .orderBy(leaderboards.rank)
      .limit(limit);
  }

  // Get user rank
  async getUserRank(
    userId: string,
    period: string = 'all-time',
    category: string = 'xp'
  ): Promise<number | null> {
    const [entry] = await db
      .select()
      .from(leaderboards)
      .where(
        and(
          eq(leaderboards.userId, userId),
          eq(leaderboards.period, period as any),
          eq(leaderboards.category, category as any)
        )
      )
      .limit(1);
    
    return entry?.rank || null;
  }

  // Activate power-up
  async activatePowerUp(userId: string, powerUpId: string): Promise<void> {
    const powerUp = POWER_UPS.find(p => p.id === powerUpId);
    if (!powerUp) {
      throw new Error('Power-up not found');
    }
    
    const profile = await this.getUserProfile(userId);
    
    // Check if user has enough points
    if (profile.totalPoints < powerUp.cost) {
      throw new Error('Insufficient points');
    }
    
    // Deduct points
    await db
      .update(userProfiles)
      .set({
        totalPoints: profile.totalPoints - powerUp.cost,
        stats: {
          ...profile.stats,
          activePowerUps: [
            ...(profile.stats?.activePowerUps || []),
            {
              id: powerUpId,
              multiplier: powerUp.multiplier,
              expiresAt: Date.now() + powerUp.duration * 60 * 1000,
            },
          ],
        },
      })
      .where(eq(userProfiles.userId, userId));
  }

  // Get user statistics
  async getUserStats(userId: string): Promise<any> {
    const profile = await this.getUserProfile(userId);
    
    const achievementCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
    
    const completedChallenges = await db
      .select({ count: sql<number>`count(*)` })
      .from(userChallenges)
      .where(
        and(
          eq(userChallenges.userId, userId),
          eq(userChallenges.status, 'completed')
        )
      );
    
    const recentEvents = await db
      .select()
      .from(gamificationEvents)
      .where(eq(gamificationEvents.userId, userId))
      .orderBy(desc(gamificationEvents.timestamp))
      .limit(10);
    
    return {
      profile,
      achievements: achievementCount[0].count,
      completedChallenges: completedChallenges[0].count,
      recentEvents,
      levelProgress: {
        currentLevel: profile.level,
        currentXP: profile.experience,
        xpForNextLevel: this.calculateXPForLevel(profile.level + 1),
        totalXPForNextLevel: this.calculateTotalXPForLevel(profile.level + 1),
      },
      streakInfo: {
        current: profile.currentStreak,
        longest: profile.longestStreak,
        multiplier: this.getStreakMultiplier(profile.currentStreak),
      },
    };
  }

  // Log event
  private async logEvent(
    userId: string,
    eventType: GamificationEventType,
    eventData: any = {}
  ): Promise<void> {
    await db.insert(gamificationEvents).values({
      userId,
      eventType,
      eventData,
      points: 0,
      experience: 0,
    });
  }

  // Initialize default achievements
  async initializeAchievements(): Promise<void> {
    const defaultAchievements = [
      // Explorer achievements
      {
        name: 'First Steps',
        description: 'Complete your first task',
        icon: '🎯',
        category: AchievementCategory.EXPLORER,
        rarity: AchievementRarity.COMMON,
        points: 10,
        conditionType: 'tasks_completed',
        conditionTarget: 1,
      },
      {
        name: 'Getting Started',
        description: 'Reach level 5',
        icon: '⭐',
        category: AchievementCategory.EXPLORER,
        rarity: AchievementRarity.COMMON,
        points: 25,
        conditionType: 'level',
        conditionTarget: 5,
      },
      {
        name: 'Explorer',
        description: 'Try 10 different features',
        icon: '🗺️',
        category: AchievementCategory.EXPLORER,
        rarity: AchievementRarity.RARE,
        points: 50,
        conditionType: 'features_tried',
        conditionTarget: 10,
      },
      
      // Builder achievements
      {
        name: 'Workflow Creator',
        description: 'Create your first workflow',
        icon: '🔧',
        category: AchievementCategory.BUILDER,
        rarity: AchievementRarity.COMMON,
        points: 20,
        conditionType: 'workflows_created',
        conditionTarget: 1,
      },
      {
        name: 'Architect',
        description: 'Create 10 workflows',
        icon: '🏗️',
        category: AchievementCategory.BUILDER,
        rarity: AchievementRarity.RARE,
        points: 75,
        conditionType: 'workflows_created',
        conditionTarget: 10,
      },
      {
        name: 'Master Builder',
        description: 'Create 50 workflows',
        icon: '🏛️',
        category: AchievementCategory.BUILDER,
        rarity: AchievementRarity.EPIC,
        points: 200,
        conditionType: 'workflows_created',
        conditionTarget: 50,
      },
      
      // Collaborator achievements
      {
        name: 'Team Player',
        description: 'Join your first collaboration session',
        icon: '🤝',
        category: AchievementCategory.COLLABORATOR,
        rarity: AchievementRarity.COMMON,
        points: 15,
        conditionType: 'collaboration_hours',
        conditionTarget: 1,
      },
      {
        name: 'Mentor',
        description: 'Help 10 team members',
        icon: '👨‍🏫',
        category: AchievementCategory.COLLABORATOR,
        rarity: AchievementRarity.RARE,
        points: 60,
        conditionType: 'team_helps',
        conditionTarget: 10,
      },
      
      // Innovator achievements
      {
        name: 'Bug Squasher',
        description: 'Fix 5 bugs',
        icon: '🐛',
        category: AchievementCategory.INNOVATOR,
        rarity: AchievementRarity.COMMON,
        points: 30,
        conditionType: 'bugs_fixed',
        conditionTarget: 5,
      },
      {
        name: 'Performance Guru',
        description: 'Improve performance 10 times',
        icon: '⚡',
        category: AchievementCategory.INNOVATOR,
        rarity: AchievementRarity.RARE,
        points: 80,
        conditionType: 'performance_improvements',
        conditionTarget: 10,
      },
      
      // Speedster achievements
      {
        name: 'Quick Starter',
        description: 'Complete a task in under 5 minutes',
        icon: '🏃',
        category: AchievementCategory.SPEEDSTER,
        rarity: AchievementRarity.COMMON,
        points: 15,
        conditionType: 'speed_task',
        conditionTarget: 1,
      },
      {
        name: 'Lightning Fast',
        description: 'Complete 10 tasks in one hour',
        icon: '⚡',
        category: AchievementCategory.SPEEDSTER,
        rarity: AchievementRarity.RARE,
        points: 70,
        conditionType: 'speed_burst',
        conditionTarget: 10,
      },
      
      // Streak achievements
      {
        name: '3 Day Streak',
        description: 'Maintain a 3-day streak',
        icon: '🔥',
        category: AchievementCategory.EXPLORER,
        rarity: AchievementRarity.COMMON,
        points: 20,
        conditionType: 'streak',
        conditionTarget: 3,
      },
      {
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        category: AchievementCategory.EXPLORER,
        rarity: AchievementRarity.RARE,
        points: 50,
        conditionType: 'streak',
        conditionTarget: 7,
      },
      {
        name: 'Unstoppable',
        description: 'Maintain a 30-day streak',
        icon: '🔥',
        category: AchievementCategory.EXPLORER,
        rarity: AchievementRarity.EPIC,
        points: 150,
        conditionType: 'streak',
        conditionTarget: 30,
      },
      {
        name: 'Legendary',
        description: 'Maintain a 100-day streak',
        icon: '🔥',
        category: AchievementCategory.EXPLORER,
        rarity: AchievementRarity.LEGENDARY,
        points: 500,
        conditionType: 'streak',
        conditionTarget: 100,
      },
      
      // Level milestones
      {
        name: 'Rising Star',
        description: 'Reach level 10',
        icon: '🌟',
        category: AchievementCategory.EXPLORER,
        rarity: AchievementRarity.RARE,
        points: 50,
        conditionType: 'level',
        conditionTarget: 10,
      },
      {
        name: 'Experienced',
        description: 'Reach level 25',
        icon: '💫',
        category: AchievementCategory.EXPLORER,
        rarity: AchievementRarity.EPIC,
        points: 150,
        conditionType: 'level',
        conditionTarget: 25,
      },
      {
        name: 'Expert',
        description: 'Reach level 50',
        icon: '✨',
        category: AchievementCategory.EXPLORER,
        rarity: AchievementRarity.LEGENDARY,
        points: 400,
        conditionType: 'level',
        conditionTarget: 50,
      },
      {
        name: 'Master',
        description: 'Reach level 100',
        icon: '👑',
        category: AchievementCategory.EXPLORER,
        rarity: AchievementRarity.MYTHIC,
        points: 1000,
        conditionType: 'level',
        conditionTarget: 100,
      },
    ];
    
    for (const achievement of defaultAchievements) {
      await db.insert(achievements).values(achievement as any).onConflictDoNothing();
    }
  }
}

// Export singleton instance
export const gamificationEngine = new GamificationEngine();