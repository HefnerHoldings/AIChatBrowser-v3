import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { EventEmitter } from 'events';
import jwt from 'jsonwebtoken';
// Redis import moved to dynamic import to prevent loading if not needed
import { z } from 'zod';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// WebSocket Namespaces
export enum WSNamespace {
  BROWSER = '/browser',
  AGENTS = '/agents',
  COLLABORATION = '/collaboration',
  NOTIFICATIONS = '/notifications',
  OUTREACH = '/outreach',
  QA = '/qa',
  WORKFLOWS = '/workflows',
  VIBECODING = '/vibecoding',
}

// Message Types
export enum WSEventType {
  // Connection Events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  AUTHENTICATE = 'authenticate',
  JOIN_ROOM = 'join-room',
  LEAVE_ROOM = 'leave-room',
  
  // Presence Events
  USER_JOINED = 'user-joined',
  USER_LEFT = 'user-left',
  USER_STATUS = 'user-status',
  PRESENCE_UPDATE = 'presence-update',
  
  // Collaboration Events
  CURSOR_MOVE = 'cursor-move',
  SELECTION_CHANGE = 'selection-change',
  CONTENT_CHANGE = 'content-change',
  COMMENT_ADD = 'comment-add',
  COMMENT_UPDATE = 'comment-update',
  COMMENT_DELETE = 'comment-delete',
  
  // Review Events
  REVIEW_REQUEST = 'review-request',
  REVIEW_APPROVE = 'review-approve',
  REVIEW_REJECT = 'review-reject',
  REVIEW_COMMENT = 'review-comment',
  
  // Notification Events
  NOTIFICATION = 'notification',
  NOTIFICATION_READ = 'notification-read',
  NOTIFICATION_CLEAR = 'notification-clear',
  
  // Browser Events
  TAB_SHARE = 'tab-share',
  TAB_UPDATE = 'tab-update',
  PAGE_NAVIGATE = 'page-navigate',
  PAGE_SCROLL = 'page-scroll',
  ELEMENT_HIGHLIGHT = 'element-highlight',
  
  // Agent Events
  AGENT_UPDATE = 'agent-update',
  AGENT_MESSAGE = 'agent-message',
  TASK_UPDATE = 'task-update',
  CONSENSUS_REQUEST = 'consensus-request',
  
  // Workflow Events
  WORKFLOW_START = 'workflow-start',
  WORKFLOW_UPDATE = 'workflow-update',
  WORKFLOW_COMPLETE = 'workflow-complete',
  WORKFLOW_ERROR = 'workflow-error',
  
  // System Events
  HEARTBEAT = 'heartbeat',
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error',
  ACK = 'ack',
}

// Message Schema
const WSMessageSchema = z.object({
  id: z.string(),
  namespace: z.nativeEnum(WSNamespace),
  event: z.string(),
  data: z.any(),
  timestamp: z.number(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  roomId: z.string().optional(),
  ack: z.boolean().optional(),
});

export type WSMessage = z.infer<typeof WSMessageSchema>;

// Client Connection
interface ClientConnection {
  id: string;
  ws: WebSocket;
  userId: string;
  username: string;
  namespace: WSNamespace;
  rooms: Set<string>;
  lastActivity: Date;
  isAuthenticated: boolean;
  metadata: {
    ip: string;
    userAgent: string;
    connectedAt: Date;
  };
}

// Room State
interface Room {
  id: string;
  namespace: WSNamespace;
  name: string;
  clients: Set<string>;
  metadata: Record<string, any>;
  createdAt: Date;
  settings: {
    maxClients: number;
    persistent: boolean;
    recordActivity: boolean;
  };
}

// Unified WebSocket Server
export class UnifiedWebSocketServer extends EventEmitter {
  private wss: WebSocketServer;
  private connections: Map<string, ClientConnection> = new Map();
  private rooms: Map<string, Room> = new Map();
  private redis: any | null = null;
  private subscriber: any | null = null;
  private rateLimiter: RateLimiterMemory;
  private messageQueue: Map<string, WSMessage[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private useRedis: boolean = false;

  constructor(server: HttpServer) {
    super();
    
    // Initialize WebSocket Server
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
      maxPayload: 10 * 1024 * 1024, // 10MB
    });

    // Always use memory rate limiter - it's more reliable and doesn't require Redis
    this.rateLimiter = new RateLimiterMemory({
      points: 100, // Number of messages
      duration: 1, // Per second
      blockDuration: 10, // Block for 10 seconds if exceeded
    });

    // Try to initialize Redis for pub/sub and scaling (optional)
    // Only if explicitly configured
    if (process.env.REDIS_HOST && process.env.REDIS_HOST !== 'localhost') {
      // Defer Redis initialization to avoid immediate connection attempts
      setTimeout(() => this.initializeRedis(), 1000);
    } else {
      console.log('Redis not configured, using in-memory WebSocket handling');
      this.useRedis = false;
    }

    this.initialize();
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Dynamic import to prevent loading Redis if not needed
      const { Redis } = await import('ioredis');
      
      const redisConfig = {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Don't retry
        lazyConnect: true,
        enableOfflineQueue: false,
        enableReadyCheck: false,
        reconnectOnError: () => false,
      };

      // Create Redis clients
      this.redis = new Redis(redisConfig);
      this.subscriber = new Redis(redisConfig);

      // Set up error handlers BEFORE connecting
      const handleError = (client: any, name: string) => {
        client.on('error', (err: any) => {
          if (!this.useRedis) return; // Already using fallback
          console.log(`Redis ${name} error, switching to in-memory:`, err.message);
          this.cleanupRedis();
        });
        
        client.on('end', () => {
          if (!this.useRedis) return;
          console.log(`Redis ${name} connection ended`);
          this.cleanupRedis();
        });
      };

      handleError(this.redis, 'publisher');
      handleError(this.subscriber, 'subscriber');

      // Try to connect with timeout
      const connectTimeout = setTimeout(() => {
        console.log('Redis connection timeout, using in-memory fallback');
        this.cleanupRedis();
      }, 5000);

      await Promise.all([
        this.redis.connect(),
        this.subscriber.connect()
      ]);

      clearTimeout(connectTimeout);
      this.useRedis = true;
      console.log('Redis connected for WebSocket scaling');
    } catch (error: any) {
      console.log('Redis not available, using in-memory fallback:', error?.message || 'Unknown error');
      this.cleanupRedis();
    }
  }

  private cleanupRedis(): void {
    this.useRedis = false;
    
    if (this.redis) {
      try {
        this.redis.removeAllListeners();
        this.redis.disconnect();
      } catch {}
      this.redis = null;
    }
    
    if (this.subscriber) {
      try {
        this.subscriber.removeAllListeners();
        this.subscriber.disconnect();
      } catch {}
      this.subscriber = null;
    }
  }

  private initialize(): void {
    // Handle WebSocket connections
    this.wss.on('connection', async (ws: WebSocket, req: any) => {
      const connectionId = this.generateConnectionId();
      const ip = req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';
      
      // Create client connection
      const connection: ClientConnection = {
        id: connectionId,
        ws,
        userId: '',
        username: 'Anonymous',
        namespace: WSNamespace.COLLABORATION,
        rooms: new Set(),
        lastActivity: new Date(),
        isAuthenticated: false,
        metadata: {
          ip,
          userAgent,
          connectedAt: new Date(),
        },
      };

      this.connections.set(connectionId, connection);
      console.log(`WebSocket connection established: ${connectionId}`);

      // Send connection confirmation
      this.sendToClient(connection, {
        id: this.generateMessageId(),
        namespace: WSNamespace.COLLABORATION,
        event: WSEventType.CONNECT,
        data: { connectionId },
        timestamp: Date.now(),
      });

      // Handle messages
      ws.on('message', async (data: Buffer) => {
        try {
          // Rate limiting
          await this.rateLimiter.consume(ip);
          
          const message = JSON.parse(data.toString());
          const validatedMessage = WSMessageSchema.parse(message);
          
          await this.handleMessage(connection, validatedMessage);
        } catch (error) {
          if (error instanceof Error && error.message.includes('rate')) {
            this.sendError(connection, 'Rate limit exceeded. Please slow down.');
          } else {
            console.error('Message handling error:', error);
            this.sendError(connection, 'Invalid message format');
          }
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnect(connectionId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for ${connectionId}:`, error);
        this.handleDisconnect(connectionId);
      });

      // Handle pong for heartbeat
      ws.on('pong', () => {
        connection.lastActivity = new Date();
      });
    });

    // Set up Redis pub/sub for horizontal scaling
    this.setupRedisPubSub();

    // Start heartbeat
    this.startHeartbeat();

    console.log('Unified WebSocket Server initialized');
  }

  private async handleMessage(connection: ClientConnection, message: WSMessage): Promise<void> {
    connection.lastActivity = new Date();

    switch (message.event) {
      case WSEventType.AUTHENTICATE:
        await this.handleAuthentication(connection, message);
        break;

      case WSEventType.JOIN_ROOM:
        await this.handleJoinRoom(connection, message);
        break;

      case WSEventType.LEAVE_ROOM:
        await this.handleLeaveRoom(connection, message);
        break;

      case WSEventType.CURSOR_MOVE:
      case WSEventType.SELECTION_CHANGE:
      case WSEventType.CONTENT_CHANGE:
        await this.broadcastToRoom(message.roomId || '', message, connection.id);
        break;

      case WSEventType.COMMENT_ADD:
      case WSEventType.COMMENT_UPDATE:
      case WSEventType.COMMENT_DELETE:
        await this.handleComment(connection, message);
        break;

      case WSEventType.NOTIFICATION:
        await this.handleNotification(connection, message);
        break;

      case WSEventType.PING:
        this.sendToClient(connection, {
          ...message,
          event: WSEventType.PONG,
        });
        break;

      default:
        // Namespace-specific handling
        await this.handleNamespaceMessage(connection, message);
    }

    // Acknowledge message if requested
    if (message.ack) {
      this.sendToClient(connection, {
        ...message,
        event: WSEventType.ACK,
        data: { originalId: message.id },
      });
    }
  }

  private async handleAuthentication(connection: ClientConnection, message: WSMessage): Promise<void> {
    try {
      const { token } = message.data;
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      
      // Get user from database
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (user) {
        connection.userId = user.id;
        connection.username = user.firstName || 'User';
        connection.isAuthenticated = true;

        // Send success response
        this.sendToClient(connection, {
          id: this.generateMessageId(),
          namespace: connection.namespace,
          event: WSEventType.AUTHENTICATE,
          data: { 
            success: true, 
            userId: user.id,
            username: connection.username 
          },
          timestamp: Date.now(),
        });

        // Check for queued messages
        const queuedMessages = this.messageQueue.get(user.id);
        if (queuedMessages && queuedMessages.length > 0) {
          queuedMessages.forEach(msg => this.sendToClient(connection, msg));
          this.messageQueue.delete(user.id);
        }

        this.emit('user-authenticated', { connectionId: connection.id, userId: user.id });
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      connection.isAuthenticated = false;
      this.sendError(connection, 'Authentication failed');
    }
  }

  private async handleJoinRoom(connection: ClientConnection, message: WSMessage): Promise<void> {
    const { roomId, namespace = connection.namespace } = message.data;
    
    if (!roomId) {
      this.sendError(connection, 'Room ID required');
      return;
    }

    // Create room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        namespace,
        name: roomId,
        clients: new Set(),
        metadata: {},
        createdAt: new Date(),
        settings: {
          maxClients: 100,
          persistent: false,
          recordActivity: true,
        },
      });
    }

    const room = this.rooms.get(roomId)!;
    
    // Check room capacity
    if (room.clients.size >= room.settings.maxClients) {
      this.sendError(connection, 'Room is full');
      return;
    }

    // Add client to room
    room.clients.add(connection.id);
    connection.rooms.add(roomId);

    // Notify room members
    await this.broadcastToRoom(roomId, {
      id: this.generateMessageId(),
      namespace,
      event: WSEventType.USER_JOINED,
      data: {
        userId: connection.userId,
        username: connection.username,
        roomId,
      },
      timestamp: Date.now(),
    }, connection.id);

    // Send room state to new member
    this.sendToClient(connection, {
      id: this.generateMessageId(),
      namespace,
      event: WSEventType.JOIN_ROOM,
      data: {
        roomId,
        members: Array.from(room.clients).map(clientId => {
          const client = this.connections.get(clientId);
          return client ? {
            userId: client.userId,
            username: client.username,
          } : null;
        }).filter(Boolean),
      },
      timestamp: Date.now(),
    });

    // Publish to Redis for other servers
    await this.publishToRedis('room-join', {
      roomId,
      userId: connection.userId,
      username: connection.username,
    });
  }

  private async handleLeaveRoom(connection: ClientConnection, message: WSMessage): Promise<void> {
    const { roomId } = message.data;
    
    if (!roomId || !connection.rooms.has(roomId)) {
      return;
    }

    const room = this.rooms.get(roomId);
    if (room) {
      room.clients.delete(connection.id);
      
      // Delete room if empty and not persistent
      if (room.clients.size === 0 && !room.settings.persistent) {
        this.rooms.delete(roomId);
      }
    }

    connection.rooms.delete(roomId);

    // Notify room members
    await this.broadcastToRoom(roomId, {
      id: this.generateMessageId(),
      namespace: connection.namespace,
      event: WSEventType.USER_LEFT,
      data: {
        userId: connection.userId,
        username: connection.username,
        roomId,
      },
      timestamp: Date.now(),
    });

    // Publish to Redis
    await this.publishToRedis('room-leave', {
      roomId,
      userId: connection.userId,
    });
  }

  private async handleComment(connection: ClientConnection, message: WSMessage): Promise<void> {
    // Store comment in database
    // Broadcast to room members
    // Send notifications to mentioned users
    
    if (message.roomId) {
      await this.broadcastToRoom(message.roomId, message, connection.id);
    }

    this.emit('comment', {
      connectionId: connection.id,
      userId: connection.userId,
      message,
    });
  }

  private async handleNotification(connection: ClientConnection, message: WSMessage): Promise<void> {
    const { targetUserId, notification } = message.data;
    
    // Find target user's connections
    const targetConnections = Array.from(this.connections.values())
      .filter(conn => conn.userId === targetUserId);

    if (targetConnections.length > 0) {
      // User is online - send immediately
      targetConnections.forEach(conn => {
        this.sendToClient(conn, {
          id: this.generateMessageId(),
          namespace: WSNamespace.NOTIFICATIONS,
          event: WSEventType.NOTIFICATION,
          data: notification,
          timestamp: Date.now(),
        });
      });
    } else {
      // User is offline - queue message
      if (!this.messageQueue.has(targetUserId)) {
        this.messageQueue.set(targetUserId, []);
      }
      this.messageQueue.get(targetUserId)!.push(message);
    }
  }

  private async handleNamespaceMessage(connection: ClientConnection, message: WSMessage): Promise<void> {
    // Emit namespace-specific events
    this.emit(`${message.namespace}:${message.event}`, {
      connectionId: connection.id,
      userId: connection.userId,
      message,
    });

    // Namespace-specific logic
    switch (message.namespace) {
      case WSNamespace.BROWSER:
        await this.handleBrowserMessage(connection, message);
        break;
      case WSNamespace.AGENTS:
        await this.handleAgentMessage(connection, message);
        break;
      case WSNamespace.WORKFLOWS:
        await this.handleWorkflowMessage(connection, message);
        break;
      case WSNamespace.OUTREACH:
        await this.handleOutreachMessage(connection, message);
        break;
      case WSNamespace.QA:
        await this.handleQAMessage(connection, message);
        break;
      case WSNamespace.VIBECODING:
        await this.handleVibecodingMessage(connection, message);
        break;
    }
  }

  private async handleBrowserMessage(connection: ClientConnection, message: WSMessage): Promise<void> {
    // Handle browser-specific messages
    if (message.roomId) {
      await this.broadcastToRoom(message.roomId, message, connection.id);
    }
  }

  private async handleAgentMessage(connection: ClientConnection, message: WSMessage): Promise<void> {
    // Handle agent-specific messages
    this.emit('agent-message', message);
  }

  private async handleWorkflowMessage(connection: ClientConnection, message: WSMessage): Promise<void> {
    // Handle workflow-specific messages
    this.emit('workflow-message', message);
  }

  private async handleOutreachMessage(connection: ClientConnection, message: WSMessage): Promise<void> {
    // Handle outreach-specific messages
    this.emit('outreach-message', message);
  }

  private async handleQAMessage(connection: ClientConnection, message: WSMessage): Promise<void> {
    // Handle QA-specific messages
    this.emit('qa-message', message);
  }

  private async handleVibecodingMessage(connection: ClientConnection, message: WSMessage): Promise<void> {
    // Handle vibecoding-specific messages
    if (message.roomId) {
      await this.broadcastToRoom(message.roomId, message, connection.id);
    }
  }

  private handleDisconnect(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Leave all rooms
    connection.rooms.forEach(roomId => {
      const room = this.rooms.get(roomId);
      if (room) {
        room.clients.delete(connectionId);
        
        // Notify room members
        this.broadcastToRoom(roomId, {
          id: this.generateMessageId(),
          namespace: connection.namespace,
          event: WSEventType.USER_LEFT,
          data: {
            userId: connection.userId,
            username: connection.username,
            roomId,
          },
          timestamp: Date.now(),
        });

        // Clean up empty rooms
        if (room.clients.size === 0 && !room.settings.persistent) {
          this.rooms.delete(roomId);
        }
      }
    });

    // Remove connection
    this.connections.delete(connectionId);
    
    console.log(`WebSocket connection closed: ${connectionId}`);
    this.emit('disconnect', { connectionId, userId: connection.userId });
  }

  private async broadcastToRoom(roomId: string, message: WSMessage, excludeConnectionId?: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.clients.forEach(clientId => {
      if (clientId !== excludeConnectionId) {
        const connection = this.connections.get(clientId);
        if (connection) {
          this.sendToClient(connection, message);
        }
      }
    });

    // Publish to Redis for other servers
    await this.publishToRedis('room-broadcast', {
      roomId,
      message,
      excludeConnectionId,
    });
  }

  public broadcast(message: WSMessage, namespace?: WSNamespace): void {
    this.connections.forEach(connection => {
      if (!namespace || connection.namespace === namespace) {
        this.sendToClient(connection, message);
      }
    });
  }

  private sendToClient(connection: ClientConnection, message: WSMessage): void {
    if (connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(message));
    }
  }

  private sendError(connection: ClientConnection, error: string): void {
    this.sendToClient(connection, {
      id: this.generateMessageId(),
      namespace: connection.namespace,
      event: WSEventType.ERROR,
      data: { error },
      timestamp: Date.now(),
    });
  }

  private setupRedisPubSub(): void {
    if (!this.subscriber) return;
    
    // Subscribe to Redis channels for horizontal scaling
    this.subscriber.subscribe('ws-broadcast', 'room-broadcast', 'room-join', 'room-leave');

    this.subscriber.on('message', async (channel, message) => {
      try {
        const data = JSON.parse(message);
        
        switch (channel) {
          case 'ws-broadcast':
            // Broadcast to all local clients
            this.broadcast(data.message, data.namespace);
            break;
            
          case 'room-broadcast':
            // Broadcast to local room members
            const room = this.rooms.get(data.roomId);
            if (room) {
              room.clients.forEach(clientId => {
                if (clientId !== data.excludeConnectionId) {
                  const connection = this.connections.get(clientId);
                  if (connection) {
                    this.sendToClient(connection, data.message);
                  }
                }
              });
            }
            break;
        }
      } catch (error) {
        console.error('Redis message processing error:', error);
      }
    });
  }

  private async publishToRedis(channel: string, data: any): Promise<void> {
    if (!this.redis) return;
    
    try {
      await this.redis.publish(channel, JSON.stringify(data));
    } catch (error) {
      console.error('Redis publish error:', error);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 60 seconds

      this.connections.forEach((connection, id) => {
        if (now - connection.lastActivity.getTime() > timeout) {
          // Connection is stale, close it
          connection.ws.terminate();
          this.handleDisconnect(id);
        } else {
          // Send ping
          if (connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.ping();
          }
        }
      });

      // Broadcast heartbeat
      this.broadcast({
        id: this.generateMessageId(),
        namespace: WSNamespace.COLLABORATION,
        event: WSEventType.HEARTBEAT,
        data: { timestamp: now },
        timestamp: now,
      });
    }, 30000); // Every 30 seconds
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API
  public sendToUser(userId: string, message: WSMessage): void {
    const userConnections = Array.from(this.connections.values())
      .filter(conn => conn.userId === userId);

    if (userConnections.length > 0) {
      userConnections.forEach(conn => this.sendToClient(conn, message));
    } else {
      // Queue message for offline user
      if (!this.messageQueue.has(userId)) {
        this.messageQueue.set(userId, []);
      }
      this.messageQueue.get(userId)!.push(message);
    }
  }

  public getUsersInRoom(roomId: string): string[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room.clients).map(clientId => {
      const connection = this.connections.get(clientId);
      return connection?.userId || '';
    }).filter(Boolean);
  }

  public getConnectionCount(): number {
    return this.connections.size;
  }

  public getRoomCount(): number {
    return this.rooms.size;
  }

  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.connections.forEach(connection => {
      connection.ws.close();
    });

    this.wss.close();
    this.redis.disconnect();
    this.subscriber.disconnect();
  }
}

// Export singleton instance
let wsServer: UnifiedWebSocketServer | null = null;

export function initializeWebSocketServer(server: HttpServer): UnifiedWebSocketServer {
  if (!wsServer) {
    wsServer = new UnifiedWebSocketServer(server);
  }
  return wsServer;
}

export function getWebSocketServer(): UnifiedWebSocketServer | null {
  return wsServer;
}