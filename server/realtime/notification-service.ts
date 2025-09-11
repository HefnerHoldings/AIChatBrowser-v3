import { EventEmitter } from 'events';
import { db } from '../db';
import { notifications, notificationPreferences, users } from '@shared/schema';
import { eq, and, gte, lte, or, inArray } from 'drizzle-orm';
import { getWebSocketServer, WSNamespace, WSEventType } from './websocket-server';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

// Notification Types
export enum NotificationType {
  // System
  SYSTEM_UPDATE = 'system-update',
  MAINTENANCE = 'maintenance',
  
  // Collaboration
  MENTION = 'mention',
  COMMENT = 'comment',
  REVIEW_REQUEST = 'review-request',
  REVIEW_APPROVED = 'review-approved',
  REVIEW_REJECTED = 'review-rejected',
  
  // Workflow
  WORKFLOW_STARTED = 'workflow-started',
  WORKFLOW_COMPLETED = 'workflow-completed',
  WORKFLOW_FAILED = 'workflow-failed',
  
  // Agent
  AGENT_TASK_COMPLETED = 'agent-task-completed',
  AGENT_CONSENSUS_NEEDED = 'agent-consensus-needed',
  
  // Outreach
  CAMPAIGN_LAUNCHED = 'campaign-launched',
  LEAD_RESPONDED = 'lead-responded',
  EMAIL_BOUNCED = 'email-bounced',
  
  // QA
  TEST_COMPLETED = 'test-completed',
  TEST_FAILED = 'test-failed',
  REGRESSION_DETECTED = 'regression-detected',
  
  // Browser
  SESSION_SHARED = 'session-shared',
  SESSION_JOINED = 'session-joined',
  
  // Marketplace
  PLUGIN_INSTALLED = 'plugin-installed',
  PLUGIN_UPDATED = 'plugin-updated',
  PURCHASE_COMPLETED = 'purchase-completed',
}

// Notification Priority
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Notification Channel
export enum NotificationChannel {
  IN_APP = 'in-app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook',
}

// Notification Interface
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: any;
  channels: NotificationChannel[];
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
  groupId?: string;
  actions?: NotificationAction[];
}

// Notification Action
export interface NotificationAction {
  id: string;
  label: string;
  url?: string;
  action?: string;
  style?: 'primary' | 'secondary' | 'danger';
}

// User Preferences
export interface UserPreferences {
  userId: string;
  channels: {
    [key in NotificationChannel]: boolean;
  };
  types: {
    [key in NotificationType]: {
      enabled: boolean;
      channels: NotificationChannel[];
      priority?: NotificationPriority;
    };
  };
  doNotDisturb: {
    enabled: boolean;
    schedule?: {
      start: string; // HH:MM
      end: string; // HH:MM
      timezone: string;
      days: number[]; // 0-6, Sunday-Saturday
    };
  };
  grouping: {
    enabled: boolean;
    delay: number; // Seconds
  };
  emailDigest: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM
  };
}

// Notification Group
interface NotificationGroup {
  id: string;
  userId: string;
  type: NotificationType;
  notifications: Notification[];
  createdAt: Date;
  updatedAt: Date;
}

// Notification Service
export class NotificationService extends EventEmitter {
  private preferences: Map<string, UserPreferences> = new Map();
  private groups: Map<string, NotificationGroup> = new Map();
  private queue: Map<string, Notification[]> = new Map();
  private emailTransporter: nodemailer.Transporter | null = null;
  private twilioClient: twilio.Twilio | null = null;
  private batchInterval: NodeJS.Timeout | null = null;
  private digestInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Initialize email transporter
    if (process.env.SMTP_HOST) {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    // Initialize Twilio client
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }

    // Load user preferences
    await this.loadUserPreferences();

    // Start batch processing
    this.startBatchProcessing();

    // Start digest processing
    this.startDigestProcessing();

    console.log('Notification service initialized');
  }

  // Send notification
  public async send(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<void> {
    const notificationId = this.generateNotificationId();
    const fullNotification: Notification = {
      ...notification,
      id: notificationId,
      createdAt: new Date(),
      read: false,
    };

    // Check user preferences
    const preferences = await this.getUserPreferences(notification.userId);
    
    // Check if notification type is enabled
    const typePrefs = preferences.types[notification.type];
    if (typePrefs && !typePrefs.enabled) {
      return; // User has disabled this notification type
    }

    // Check Do Not Disturb
    if (this.isInDoNotDisturb(preferences)) {
      // Queue for later delivery
      this.queueNotification(fullNotification);
      return;
    }

    // Check grouping
    if (preferences.grouping.enabled) {
      const grouped = await this.groupNotification(fullNotification, preferences.grouping.delay);
      if (grouped) {
        return; // Will be sent as part of group
      }
    }

    // Determine channels
    const channels = this.determineChannels(fullNotification, preferences);

    // Send through each channel
    for (const channel of channels) {
      await this.sendToChannel(fullNotification, channel);
    }

    // Store in database
    await this.storeNotification(fullNotification);

    // Emit event
    this.emit('notification-sent', fullNotification);
  }

  // Send to specific channel
  private async sendToChannel(notification: Notification, channel: NotificationChannel): Promise<void> {
    switch (channel) {
      case NotificationChannel.IN_APP:
        await this.sendInApp(notification);
        break;

      case NotificationChannel.EMAIL:
        await this.sendEmail(notification);
        break;

      case NotificationChannel.SMS:
        await this.sendSMS(notification);
        break;

      case NotificationChannel.PUSH:
        await this.sendPush(notification);
        break;

      case NotificationChannel.WEBHOOK:
        await this.sendWebhook(notification);
        break;
    }
  }

  // Send in-app notification
  private async sendInApp(notification: Notification): Promise<void> {
    const wsServer = getWebSocketServer();
    if (!wsServer) return;

    wsServer.sendToUser(notification.userId, {
      id: notification.id,
      namespace: WSNamespace.NOTIFICATIONS,
      event: WSEventType.NOTIFICATION,
      data: notification,
      timestamp: Date.now(),
    });
  }

  // Send email notification
  private async sendEmail(notification: Notification): Promise<void> {
    if (!this.emailTransporter) return;

    // Get user email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, notification.userId))
      .limit(1);

    if (!user?.email) return;

    // Prepare email content
    const emailContent = this.formatEmailContent(notification);

    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@madeasy.ai',
        to: user.email,
        subject: notification.title,
        html: emailContent.html,
        text: emailContent.text,
      });

      this.emit('email-sent', {
        notificationId: notification.id,
        userId: notification.userId,
        email: user.email,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      this.emit('email-failed', {
        notificationId: notification.id,
        userId: notification.userId,
        error,
      });
    }
  }

  // Send SMS notification
  private async sendSMS(notification: Notification): Promise<void> {
    if (!this.twilioClient) return;

    // Get user phone
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, notification.userId))
      .limit(1);

    if (!user?.phone) return;

    try {
      await this.twilioClient.messages.create({
        body: `${notification.title}\n${notification.message}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: user.phone,
      });

      this.emit('sms-sent', {
        notificationId: notification.id,
        userId: notification.userId,
        phone: user.phone,
      });
    } catch (error) {
      console.error('Failed to send SMS:', error);
      this.emit('sms-failed', {
        notificationId: notification.id,
        userId: notification.userId,
        error,
      });
    }
  }

  // Send push notification
  private async sendPush(notification: Notification): Promise<void> {
    // Would integrate with service like OneSignal or Firebase Cloud Messaging
    this.emit('push-sent', {
      notificationId: notification.id,
      userId: notification.userId,
    });
  }

  // Send webhook notification
  private async sendWebhook(notification: Notification): Promise<void> {
    // Get user webhook URL
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, notification.userId))
      .limit(1);

    const webhookUrl = user?.metadata?.webhookUrl;
    if (!webhookUrl) return;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MadEasy-Signature': this.generateWebhookSignature(notification),
        },
        body: JSON.stringify(notification),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      this.emit('webhook-sent', {
        notificationId: notification.id,
        userId: notification.userId,
        webhookUrl,
      });
    } catch (error) {
      console.error('Failed to send webhook:', error);
      this.emit('webhook-failed', {
        notificationId: notification.id,
        userId: notification.userId,
        error,
      });
    }
  }

  // Group notifications
  private async groupNotification(notification: Notification, delay: number): Promise<boolean> {
    const groupKey = `${notification.userId}-${notification.type}`;
    
    let group = this.groups.get(groupKey);
    if (!group) {
      group = {
        id: this.generateGroupId(),
        userId: notification.userId,
        type: notification.type,
        notifications: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.groups.set(groupKey, group);
    }

    group.notifications.push(notification);
    group.updatedAt = new Date();

    // Schedule group send
    setTimeout(() => {
      this.sendGroupedNotifications(groupKey);
    }, delay * 1000);

    return true;
  }

  // Send grouped notifications
  private async sendGroupedNotifications(groupKey: string): Promise<void> {
    const group = this.groups.get(groupKey);
    if (!group || group.notifications.length === 0) return;

    // Create summary notification
    const summaryNotification: Notification = {
      id: this.generateNotificationId(),
      userId: group.userId,
      type: group.type,
      priority: NotificationPriority.NORMAL,
      title: `${group.notifications.length} ${group.type} notifications`,
      message: this.generateGroupSummary(group.notifications),
      data: {
        groupId: group.id,
        notifications: group.notifications,
      },
      channels: [NotificationChannel.IN_APP],
      read: false,
      createdAt: new Date(),
      groupId: group.id,
    };

    // Send summary
    await this.send(summaryNotification);

    // Clear group
    this.groups.delete(groupKey);
  }

  // Generate group summary
  private generateGroupSummary(notifications: Notification[]): string {
    const titles = notifications.slice(0, 3).map(n => n.title);
    const remaining = notifications.length - 3;
    
    let summary = titles.join(', ');
    if (remaining > 0) {
      summary += ` and ${remaining} more`;
    }
    
    return summary;
  }

  // Mark as read
  public async markAsRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({
        read: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );

    // Send real-time update
    const wsServer = getWebSocketServer();
    if (wsServer) {
      wsServer.sendToUser(userId, {
        id: this.generateNotificationId(),
        namespace: WSNamespace.NOTIFICATIONS,
        event: WSEventType.NOTIFICATION_READ,
        data: { notificationId },
        timestamp: Date.now(),
      });
    }

    this.emit('notification-read', { notificationId, userId });
  }

  // Mark all as read
  public async markAllAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({
        read: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );

    // Send real-time update
    const wsServer = getWebSocketServer();
    if (wsServer) {
      wsServer.sendToUser(userId, {
        id: this.generateNotificationId(),
        namespace: WSNamespace.NOTIFICATIONS,
        event: WSEventType.NOTIFICATION_CLEAR,
        data: {},
        timestamp: Date.now(),
      });
    }

    this.emit('notifications-cleared', { userId });
  }

  // Get user notifications
  public async getUserNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      types?: NotificationType[];
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<Notification[]> {
    let query = db.select().from(notifications).where(eq(notifications.userId, userId));

    if (options.unreadOnly) {
      query = query.where(eq(notifications.read, false));
    }

    if (options.types && options.types.length > 0) {
      query = query.where(inArray(notifications.type, options.types));
    }

    if (options.startDate) {
      query = query.where(gte(notifications.createdAt, options.startDate));
    }

    if (options.endDate) {
      query = query.where(lte(notifications.createdAt, options.endDate));
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.offset(options.offset);
    }

    const results = await query.orderBy(notifications.createdAt, 'desc');

    return results.map(n => ({
      id: n.id,
      userId: n.userId,
      type: n.type as NotificationType,
      priority: n.priority as NotificationPriority,
      title: n.title,
      message: n.message,
      data: n.data,
      channels: n.channels as NotificationChannel[],
      read: n.read,
      readAt: n.readAt || undefined,
      createdAt: n.createdAt,
      expiresAt: n.expiresAt || undefined,
      groupId: n.groupId || undefined,
      actions: n.actions || undefined,
    }));
  }

  // Get user preferences
  public async getUserPreferences(userId: string): Promise<UserPreferences> {
    // Check cache
    if (this.preferences.has(userId)) {
      return this.preferences.get(userId)!;
    }

    // Load from database
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    let preferences: UserPreferences;

    if (prefs) {
      preferences = prefs.preferences as UserPreferences;
    } else {
      // Create default preferences
      preferences = this.getDefaultPreferences(userId);
      
      // Save to database
      await db.insert(notificationPreferences).values({
        userId,
        preferences,
      });
    }

    // Cache
    this.preferences.set(userId, preferences);

    return preferences;
  }

  // Update user preferences
  public async updateUserPreferences(
    userId: string,
    updates: Partial<UserPreferences>
  ): Promise<void> {
    const current = await this.getUserPreferences(userId);
    const updated = { ...current, ...updates };

    // Save to database
    await db
      .update(notificationPreferences)
      .set({ preferences: updated })
      .where(eq(notificationPreferences.userId, userId));

    // Update cache
    this.preferences.set(userId, updated);

    this.emit('preferences-updated', { userId, preferences: updated });
  }

  // Get default preferences
  private getDefaultPreferences(userId: string): UserPreferences {
    return {
      userId,
      channels: {
        [NotificationChannel.IN_APP]: true,
        [NotificationChannel.EMAIL]: true,
        [NotificationChannel.SMS]: false,
        [NotificationChannel.PUSH]: true,
        [NotificationChannel.WEBHOOK]: false,
      },
      types: Object.values(NotificationType).reduce((acc, type) => {
        acc[type] = {
          enabled: true,
          channels: [NotificationChannel.IN_APP],
        };
        return acc;
      }, {} as UserPreferences['types']),
      doNotDisturb: {
        enabled: false,
      },
      grouping: {
        enabled: true,
        delay: 60, // 1 minute
      },
      emailDigest: {
        enabled: false,
        frequency: 'daily',
        time: '09:00',
      },
    };
  }

  // Check if user is in Do Not Disturb
  private isInDoNotDisturb(preferences: UserPreferences): boolean {
    if (!preferences.doNotDisturb.enabled) return false;
    
    const schedule = preferences.doNotDisturb.schedule;
    if (!schedule) return false;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Check if current day is in schedule
    if (!schedule.days.includes(currentDay)) return false;

    // Check if current time is in range
    if (schedule.start <= schedule.end) {
      return currentTime >= schedule.start && currentTime <= schedule.end;
    } else {
      // Schedule spans midnight
      return currentTime >= schedule.start || currentTime <= schedule.end;
    }
  }

  // Queue notification for later delivery
  private queueNotification(notification: Notification): void {
    const userId = notification.userId;
    
    if (!this.queue.has(userId)) {
      this.queue.set(userId, []);
    }
    
    this.queue.get(userId)!.push(notification);
  }

  // Process queued notifications
  private async processQueuedNotifications(): Promise<void> {
    for (const [userId, notifications] of this.queue) {
      const preferences = await this.getUserPreferences(userId);
      
      if (!this.isInDoNotDisturb(preferences)) {
        // Send queued notifications
        for (const notification of notifications) {
          await this.send(notification);
        }
        
        // Clear queue
        this.queue.delete(userId);
      }
    }
  }

  // Determine channels for notification
  private determineChannels(
    notification: Notification,
    preferences: UserPreferences
  ): NotificationChannel[] {
    const channels: NotificationChannel[] = [];

    // Check type-specific preferences
    const typePrefs = preferences.types[notification.type];
    if (typePrefs && typePrefs.channels) {
      return typePrefs.channels.filter(ch => preferences.channels[ch]);
    }

    // Use notification's specified channels
    for (const channel of notification.channels) {
      if (preferences.channels[channel]) {
        channels.push(channel);
      }
    }

    // Default to in-app if no channels
    if (channels.length === 0) {
      channels.push(NotificationChannel.IN_APP);
    }

    return channels;
  }

  // Store notification in database
  private async storeNotification(notification: Notification): Promise<void> {
    await db.insert(notifications).values({
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      priority: notification.priority,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      channels: notification.channels,
      read: notification.read,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      expiresAt: notification.expiresAt,
      groupId: notification.groupId,
      actions: notification.actions,
    });
  }

  // Load user preferences from database
  private async loadUserPreferences(): Promise<void> {
    const allPrefs = await db.select().from(notificationPreferences);
    
    for (const pref of allPrefs) {
      this.preferences.set(pref.userId, pref.preferences as UserPreferences);
    }
  }

  // Format email content
  private formatEmailContent(notification: Notification): { html: string; text: string } {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #F9FAFB; padding: 20px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 10px 20px; background: #4F46E5; color: white; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${notification.title}</h1>
            </div>
            <div class="content">
              <p>${notification.message}</p>
              ${notification.actions ? notification.actions.map(action => `
                <a href="${action.url}" class="button">${action.label}</a>
              `).join(' ') : ''}
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `${notification.title}\n\n${notification.message}`;

    return { html, text };
  }

  // Generate webhook signature
  private generateWebhookSignature(notification: Notification): string {
    const crypto = require('crypto');
    const secret = process.env.WEBHOOK_SECRET || 'secret';
    const payload = JSON.stringify(notification);
    
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  // Start batch processing
  private startBatchProcessing(): void {
    this.batchInterval = setInterval(() => {
      this.processQueuedNotifications();
    }, 60000); // Every minute
  }

  // Start digest processing
  private startDigestProcessing(): void {
    this.digestInterval = setInterval(async () => {
      await this.sendEmailDigests();
    }, 3600000); // Every hour
  }

  // Send email digests
  private async sendEmailDigests(): Promise<void> {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:00`;

    for (const [userId, preferences] of this.preferences) {
      if (!preferences.emailDigest.enabled) continue;
      
      // Check if it's time to send digest
      if (preferences.emailDigest.time !== currentTime) continue;

      // Check frequency
      const shouldSend = this.shouldSendDigest(preferences.emailDigest.frequency, now);
      if (!shouldSend) continue;

      // Get unread notifications
      const unreadNotifications = await this.getUserNotifications(userId, {
        unreadOnly: true,
      });

      if (unreadNotifications.length === 0) continue;

      // Send digest email
      await this.sendDigestEmail(userId, unreadNotifications);
    }
  }

  // Check if digest should be sent
  private shouldSendDigest(frequency: 'daily' | 'weekly' | 'monthly', now: Date): boolean {
    switch (frequency) {
      case 'daily':
        return true;
      case 'weekly':
        return now.getDay() === 1; // Monday
      case 'monthly':
        return now.getDate() === 1; // First day of month
      default:
        return false;
    }
  }

  // Send digest email
  private async sendDigestEmail(userId: string, notifications: Notification[]): Promise<void> {
    if (!this.emailTransporter) return;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.email) return;

    const grouped = this.groupNotificationsByType(notifications);
    const html = this.formatDigestEmail(grouped);

    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@madeasy.ai',
        to: user.email,
        subject: `Your MadEasy Browser Digest - ${notifications.length} notifications`,
        html,
      });

      this.emit('digest-sent', { userId, count: notifications.length });
    } catch (error) {
      console.error('Failed to send digest email:', error);
    }
  }

  // Group notifications by type for digest
  private groupNotificationsByType(notifications: Notification[]): Map<NotificationType, Notification[]> {
    const grouped = new Map<NotificationType, Notification[]>();
    
    for (const notification of notifications) {
      if (!grouped.has(notification.type)) {
        grouped.set(notification.type, []);
      }
      grouped.get(notification.type)!.push(notification);
    }
    
    return grouped;
  }

  // Format digest email
  private formatDigestEmail(grouped: Map<NotificationType, Notification[]>): string {
    let content = '';
    
    for (const [type, notifications] of grouped) {
      content += `
        <h2>${this.formatNotificationType(type)} (${notifications.length})</h2>
        <ul>
          ${notifications.slice(0, 5).map(n => `
            <li>
              <strong>${n.title}</strong><br>
              ${n.message}<br>
              <small>${n.createdAt.toLocaleString()}</small>
            </li>
          `).join('')}
          ${notifications.length > 5 ? `<li>...and ${notifications.length - 5} more</li>` : ''}
        </ul>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            h1 { color: #4F46E5; }
            h2 { color: #6B7280; }
            ul { list-style: none; padding: 0; }
            li { margin: 10px 0; padding: 10px; background: #F9FAFB; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Your MadEasy Browser Digest</h1>
            ${content}
          </div>
        </body>
      </html>
    `;
  }

  // Format notification type for display
  private formatNotificationType(type: NotificationType): string {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  // Generate IDs
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateGroupId(): string {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  public cleanup(): void {
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
    }
    if (this.digestInterval) {
      clearInterval(this.digestInterval);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();