import type { Express } from "express";
import { db } from "./db";
import { 
  organizations, 
  users, 
  workSchedules, 
  activityTracking,
  productivityMetrics,
  privacySettings,
  trackingNotifications,
  type InsertOrganization,
  type InsertWorkSchedule,
  type InsertActivityTracking,
  type InsertProductivityMetric,
  type InsertPrivacySettings,
  type InsertTrackingNotification
} from "@shared/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { z } from "zod";

export function registerOrganizationRoutes(app: Express) {
  // Get user profile with organization
  app.get('/api/profile', async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: 'UserId required' });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .leftJoin(organizations, eq(users.organizationId, organizations.id));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get privacy settings
      const [privacy] = await db
        .select()
        .from(privacySettings)
        .where(eq(privacySettings.userId, userId));

      res.json({
        user: user.users,
        organization: user.organizations,
        privacySettings: privacy
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // Create organization
  app.post('/api/organizations', async (req, res) => {
    try {
      const orgData = req.body as InsertOrganization;
      
      const [org] = await db
        .insert(organizations)
        .values(orgData)
        .returning();

      res.json(org);
    } catch (error) {
      console.error('Error creating organization:', error);
      res.status(500).json({ error: 'Failed to create organization' });
    }
  });

  // Get organization employees
  app.get('/api/organizations/:orgId/employees', async (req, res) => {
    try {
      const { orgId } = req.params;
      
      const employees = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, orgId));

      res.json(employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ error: 'Failed to fetch employees' });
    }
  });

  // Set work schedule
  app.post('/api/work-schedules', async (req, res) => {
    try {
      const scheduleData = req.body as InsertWorkSchedule;
      
      const [schedule] = await db
        .insert(workSchedules)
        .values(scheduleData)
        .returning();

      res.json(schedule);
    } catch (error) {
      console.error('Error creating work schedule:', error);
      res.status(500).json({ error: 'Failed to create work schedule' });
    }
  });

  // Get work schedules for user
  app.get('/api/work-schedules/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const schedules = await db
        .select()
        .from(workSchedules)
        .where(eq(workSchedules.userId, userId));

      res.json(schedules);
    } catch (error) {
      console.error('Error fetching work schedules:', error);
      res.status(500).json({ error: 'Failed to fetch work schedules' });
    }
  });

  // Track activity
  app.post('/api/activity-tracking', async (req, res) => {
    try {
      const activityData = req.body as InsertActivityTracking;
      
      // Check if user allows tracking
      const [privacy] = await db
        .select()
        .from(privacySettings)
        .where(eq(privacySettings.userId, activityData.userId));

      if (privacy && !privacy.allowTracking) {
        // Notify organization if tracking is blocked
        if (activityData.organizationId) {
          await db.insert(trackingNotifications).values({
            userId: activityData.userId,
            organizationId: activityData.organizationId,
            type: 'tracking_blocked',
            message: 'Ansatt har blokkert sporing',
            metadata: { blockedAt: new Date().toISOString() }
          });
        }
        
        return res.json({ 
          tracked: false, 
          reason: 'User has disabled tracking' 
        });
      }

      // Check if within work hours
      const now = new Date();
      const dayOfWeek = now.getDay();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const [schedule] = await db
        .select()
        .from(workSchedules)
        .where(
          and(
            eq(workSchedules.userId, activityData.userId),
            eq(workSchedules.dayOfWeek, dayOfWeek),
            eq(workSchedules.isActive, true)
          )
        );

      const isDuringWorkHours = schedule && 
        currentTime >= schedule.startTime && 
        currentTime <= schedule.endTime;

      // Categorize the activity using simple rules (can be enhanced with AI)
      const category = categorizeActivity(activityData.domain || '', activityData.title || '');
      const isWorkRelated = determineIfWorkRelated(category, activityData.domain || '');

      const [activity] = await db
        .insert(activityTracking)
        .values({
          ...activityData,
          isDuringWorkHours,
          category,
          isWorkRelated
        })
        .returning();

      // Notify user if tracking during work hours
      if (isDuringWorkHours && privacy?.notifyOnTracking) {
        await db.insert(trackingNotifications).values({
          userId: activityData.userId,
          organizationId: activityData.organizationId,
          type: 'tracking_started',
          message: 'Aktivitetssporing er aktiv i arbeidstid',
          metadata: { workHours: true }
        });
      }

      res.json(activity);
    } catch (error) {
      console.error('Error tracking activity:', error);
      res.status(500).json({ error: 'Failed to track activity' });
    }
  });

  // Get activity tracking for user
  app.get('/api/activity-tracking/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { date } = req.query;
      
      let query = db
        .select()
        .from(activityTracking)
        .where(eq(activityTracking.userId, userId))
        .orderBy(desc(activityTracking.timestamp));

      if (date) {
        const startDate = new Date(date as string);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date as string);
        endDate.setHours(23, 59, 59, 999);
        
        const activities = await db
          .select()
          .from(activityTracking)
          .where(
            and(
              eq(activityTracking.userId, userId),
              gte(activityTracking.timestamp, startDate),
              lte(activityTracking.timestamp, endDate)
            )
          )
          .orderBy(desc(activityTracking.timestamp));
        
        return res.json(activities);
      }

      const activities = await query;
      res.json(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      res.status(500).json({ error: 'Failed to fetch activities' });
    }
  });

  // Calculate and save productivity metrics
  app.post('/api/productivity-metrics/calculate', async (req, res) => {
    try {
      const { userId, date } = req.body;
      
      const targetDate = new Date(date || new Date());
      targetDate.setHours(0, 0, 0, 0);
      const endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);

      // Get all activities for the day
      const activities = await db
        .select()
        .from(activityTracking)
        .where(
          and(
            eq(activityTracking.userId, userId),
            gte(activityTracking.timestamp, targetDate),
            lte(activityTracking.timestamp, endDate)
          )
        );

      // Calculate metrics
      const metrics = calculateProductivityMetrics(activities);
      
      // Save metrics
      const [savedMetric] = await db
        .insert(productivityMetrics)
        .values({
          userId,
          organizationId: activities[0]?.organizationId,
          date: targetDate,
          ...metrics
        })
        .onConflictDoUpdate({
          target: [productivityMetrics.userId, productivityMetrics.date],
          set: metrics
        })
        .returning();

      res.json(savedMetric);
    } catch (error) {
      console.error('Error calculating productivity:', error);
      res.status(500).json({ error: 'Failed to calculate productivity' });
    }
  });

  // Get productivity metrics
  app.get('/api/productivity-metrics/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;
      
      let query = db
        .select()
        .from(productivityMetrics)
        .where(eq(productivityMetrics.userId, userId))
        .orderBy(desc(productivityMetrics.date));

      if (startDate && endDate) {
        const metrics = await db
          .select()
          .from(productivityMetrics)
          .where(
            and(
              eq(productivityMetrics.userId, userId),
              gte(productivityMetrics.date, new Date(startDate as string)),
              lte(productivityMetrics.date, new Date(endDate as string))
            )
          )
          .orderBy(desc(productivityMetrics.date));
        
        return res.json(metrics);
      }

      const metrics = await query;
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching productivity metrics:', error);
      res.status(500).json({ error: 'Failed to fetch productivity metrics' });
    }
  });

  // Update privacy settings
  app.put('/api/privacy-settings/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const settings = req.body as InsertPrivacySettings;
      
      const [privacy] = await db
        .insert(privacySettings)
        .values({ ...settings, userId })
        .onConflictDoUpdate({
          target: privacySettings.userId,
          set: { ...settings, updatedAt: new Date() }
        })
        .returning();

      // Notify organization if tracking is disabled
      if (!settings.allowTracking) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user?.organizationId) {
          await db.insert(trackingNotifications).values({
            userId,
            organizationId: user.organizationId,
            type: 'privacy_changed',
            message: 'Ansatt har endret personverninnstillinger',
            metadata: { settings }
          });
        }
      }

      res.json(privacy);
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      res.status(500).json({ error: 'Failed to update privacy settings' });
    }
  });

  // Get tracking notifications
  app.get('/api/tracking-notifications/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const notifications = await db
        .select()
        .from(trackingNotifications)
        .where(eq(trackingNotifications.userId, userId))
        .orderBy(desc(trackingNotifications.createdAt));

      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  // Acknowledge notification
  app.put('/api/tracking-notifications/:id/acknowledge', async (req, res) => {
    try {
      const { id } = req.params;
      
      const [notification] = await db
        .update(trackingNotifications)
        .set({ 
          acknowledged: true, 
          acknowledgedAt: new Date() 
        })
        .where(eq(trackingNotifications.id, id))
        .returning();

      res.json(notification);
    } catch (error) {
      console.error('Error acknowledging notification:', error);
      res.status(500).json({ error: 'Failed to acknowledge notification' });
    }
  });
}

// Helper functions
function categorizeActivity(domain: string, title: string): string {
  const lowerDomain = domain.toLowerCase();
  const lowerTitle = title.toLowerCase();
  
  if (['github.com', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com'].some(d => lowerDomain.includes(d))) {
    return 'development';
  }
  if (['docs.google.com', 'office.com', 'notion.so', 'confluence'].some(d => lowerDomain.includes(d))) {
    return 'productivity';
  }
  if (['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com'].some(d => lowerDomain.includes(d))) {
    return 'social';
  }
  if (['youtube.com', 'netflix.com', 'spotify.com', 'twitch.tv'].some(d => lowerDomain.includes(d))) {
    return 'entertainment';
  }
  if (['amazon.com', 'ebay.com', 'aliexpress.com'].some(d => lowerDomain.includes(d))) {
    return 'shopping';
  }
  if (['gmail.com', 'outlook.com', 'mail.'].some(d => lowerDomain.includes(d))) {
    return 'communication';
  }
  
  return 'other';
}

function determineIfWorkRelated(category: string, domain: string): boolean {
  const workCategories = ['development', 'productivity', 'communication'];
  return workCategories.includes(category) || domain.includes('company.com');
}

function calculateProductivityMetrics(activities: any[]) {
  const totalActiveTime = activities.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
  const workRelatedTime = activities.filter(a => a.isWorkRelated).reduce((sum, a) => sum + (a.timeSpent || 0), 0);
  const focusTime = activities.filter(a => a.timeSpent > 300).reduce((sum, a) => sum + (a.timeSpent || 0), 0); // 5+ min sessions
  
  // Category summary
  const categorySummary: Record<string, number> = {};
  activities.forEach(a => {
    if (a.category) {
      categorySummary[a.category] = (categorySummary[a.category] || 0) + (a.timeSpent || 0);
    }
  });

  // Top sites
  const siteSummary: Record<string, number> = {};
  activities.forEach(a => {
    if (a.domain) {
      siteSummary[a.domain] = (siteSummary[a.domain] || 0) + (a.timeSpent || 0);
    }
  });
  
  const topSites = Object.entries(siteSummary)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([domain, timeSpent]) => ({ domain, timeSpent }));

  // Calculate productivity score (0-100)
  const productivityScore = Math.min(100, Math.round(
    (workRelatedTime / totalActiveTime) * 100 * 
    (focusTime / totalActiveTime) * 
    1.5
  ));

  // AI insights (simplified - would use actual AI in production)
  const aiInsights = {
    summary: `Produktivitetsscore: ${productivityScore}%`,
    suggestions: [
      productivityScore < 50 ? 'Prøv å redusere tid på sosiale medier' : 'Bra fokus på arbeidsrelaterte oppgaver',
      focusTime < totalActiveTime * 0.3 ? 'Øk fokustiden med lengre arbeidsøkter' : 'God balanse mellom fokus og pauser'
    ],
    patterns: {
      mostProductiveHour: '10:00-11:00',
      leastProductiveHour: '14:00-15:00'
    }
  };

  return {
    productivityScore,
    focusTime,
    breakTime: totalActiveTime - workRelatedTime,
    totalActiveTime,
    categorySummary,
    topSites,
    aiInsights
  };
}