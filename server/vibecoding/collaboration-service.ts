import { WebSocket, WebSocketServer } from 'ws';
import { db } from '../db';
import { collaborationSessions, users, projects } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { EventEmitter } from 'events';

// Message Types
enum MessageType {
  // Connection
  JOIN_SESSION = 'join_session',
  LEAVE_SESSION = 'leave_session',
  SESSION_JOINED = 'session_joined',
  SESSION_LEFT = 'session_left',
  
  // Cursor and Selection
  CURSOR_MOVE = 'cursor_move',
  SELECTION_CHANGE = 'selection_change',
  
  // Code Changes
  CODE_CHANGE = 'code_change',
  CODE_INSERT = 'code_insert',
  CODE_DELETE = 'code_delete',
  CODE_REPLACE = 'code_replace',
  
  // File Operations
  FILE_OPEN = 'file_open',
  FILE_CLOSE = 'file_close',
  FILE_CREATE = 'file_create',
  FILE_DELETE = 'file_delete',
  FILE_RENAME = 'file_rename',
  
  // Comments and Annotations
  COMMENT_ADD = 'comment_add',
  COMMENT_UPDATE = 'comment_update',
  COMMENT_DELETE = 'comment_delete',
  COMMENT_RESOLVE = 'comment_resolve',
  
  // Collaboration Features
  SCREEN_SHARE_START = 'screen_share_start',
  SCREEN_SHARE_STOP = 'screen_share_stop',
  VOICE_CHAT_START = 'voice_chat_start',
  VOICE_CHAT_STOP = 'voice_chat_stop',
  VIDEO_CHAT_START = 'video_chat_start',
  VIDEO_CHAT_STOP = 'video_chat_stop',
  
  // Drawing and Annotations
  DRAWING_START = 'drawing_start',
  DRAWING_UPDATE = 'drawing_update',
  DRAWING_END = 'drawing_end',
  
  // Git-like Features
  BRANCH_CREATE = 'branch_create',
  BRANCH_SWITCH = 'branch_switch',
  BRANCH_MERGE = 'branch_merge',
  COMMIT = 'commit',
  
  // Pair Programming
  DRIVER_CHANGE = 'driver_change',
  NAVIGATOR_CHANGE = 'navigator_change',
  ROLE_SWAP = 'role_swap',
  
  // Sync and State
  SYNC_REQUEST = 'sync_request',
  SYNC_RESPONSE = 'sync_response',
  STATE_UPDATE = 'state_update',
  
  // Notifications
  NOTIFICATION = 'notification',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  
  // AI Assistance
  AI_SUGGESTION = 'ai_suggestion',
  AI_REVIEW = 'ai_review',
  AI_HELP_REQUEST = 'ai_help_request',
}

// Collaboration Modes
enum CollaborationMode {
  PAIR_PROGRAMMING = 'pair-programming',
  CODE_REVIEW = 'review',
  BRAINSTORMING = 'brainstorming',
  DEBUGGING = 'debugging',
  TEACHING = 'teaching',
  WHITEBOARD = 'whiteboard',
}

// User Role in Session
enum UserRole {
  HOST = 'host',
  DRIVER = 'driver',
  NAVIGATOR = 'navigator',
  OBSERVER = 'observer',
  REVIEWER = 'reviewer',
  STUDENT = 'student',
  TEACHER = 'teacher',
}

// Participant Interface
interface Participant {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  role: UserRole;
  cursor?: {
    line: number;
    column: number;
    file?: string;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
    file?: string;
  };
  color: string;
  isActive: boolean;
  isSpeaking?: boolean;
  isScreenSharing?: boolean;
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canDraw: boolean;
    canShare: boolean;
  };
}

// Session State
interface SessionState {
  id: string;
  roomId: string;
  mode: CollaborationMode;
  participants: Map<string, Participant>;
  files: Map<string, FileState>;
  branches: Map<string, BranchState>;
  currentBranch: string;
  comments: Comment[];
  drawings: Drawing[];
  chat: ChatMessage[];
  sharedTerminal?: TerminalState;
  settings: SessionSettings;
}

interface FileState {
  path: string;
  content: string;
  version: number;
  locks: Map<string, FileLock>;
  changes: Change[];
  openBy: Set<string>;
}

interface BranchState {
  name: string;
  baseCommit: string;
  commits: Commit[];
  files: Map<string, string>;
}

interface FileLock {
  userId: string;
  startLine: number;
  endLine: number;
  timestamp: number;
}

interface Change {
  id: string;
  userId: string;
  type: 'insert' | 'delete' | 'replace';
  position: { line: number; column: number };
  content?: string;
  timestamp: number;
}

interface Comment {
  id: string;
  userId: string;
  fileP…: string;
  line: number;
  text: string;
  resolved: boolean;
  replies: Reply[];
  timestamp: number;
}

interface Reply {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
}

interface Drawing {
  id: string;
  userId: string;
  type: 'line' | 'rectangle' | 'circle' | 'text' | 'arrow';
  data: any;
  timestamp: number;
}

interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
  mentions?: string[];
}

interface TerminalState {
  sessionId: string;
  output: string[];
  currentDirectory: string;
  environment: Record<string, string>;
}

interface SessionSettings {
  maxParticipants: number;
  allowGuestAccess: boolean;
  requireApproval: boolean;
  recordSession: boolean;
  enableAI: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
}

interface Commit {
  id: string;
  message: string;
  author: string;
  timestamp: number;
  changes: FileChange[];
}

interface FileChange {
  path: string;
  type: 'create' | 'modify' | 'delete';
  diff?: string;
}

// Operational Transform for Conflict Resolution
class OperationalTransform {
  // Transform operation against another operation
  static transform(op1: Change, op2: Change): [Change, Change] {
    if (op1.type === 'insert' && op2.type === 'insert') {
      return this.transformInsertInsert(op1, op2);
    } else if (op1.type === 'insert' && op2.type === 'delete') {
      return this.transformInsertDelete(op1, op2);
    } else if (op1.type === 'delete' && op2.type === 'insert') {
      const [transformed2, transformed1] = this.transformInsertDelete(op2, op1);
      return [transformed1, transformed2];
    } else if (op1.type === 'delete' && op2.type === 'delete') {
      return this.transformDeleteDelete(op1, op2);
    }
    
    return [op1, op2];
  }

  private static transformInsertInsert(op1: Change, op2: Change): [Change, Change] {
    if (op1.position.line < op2.position.line ||
        (op1.position.line === op2.position.line && op1.position.column < op2.position.column)) {
      return [op1, op2];
    } else if (op1.position.line === op2.position.line && op1.position.column === op2.position.column) {
      // Same position - use user ID as tiebreaker
      if (op1.userId < op2.userId) {
        return [op1, { ...op2, position: { ...op2.position, column: op2.position.column + (op1.content?.length || 0) } }];
      } else {
        return [{ ...op1, position: { ...op1.position, column: op1.position.column + (op2.content?.length || 0) } }, op2];
      }
    } else {
      return [op1, op2];
    }
  }

  private static transformInsertDelete(insert: Change, del: Change): [Change, Change] {
    // Simplified transform - would need more complex logic for production
    return [insert, del];
  }

  private static transformDeleteDelete(op1: Change, op2: Change): [Change, Change] {
    // Simplified transform - would need more complex logic for production
    return [op1, op2];
  }
}

// Collaboration Service
export class CollaborationService extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private sessions: Map<string, SessionState> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private connections: Map<string, WebSocket> = new Map();

  constructor() {
    super();
  }

  // Initialize WebSocket server
  initialize(port: number = 3001): void {
    this.wss = new WebSocketServer({ port });
    
    this.wss.on('connection', (ws: WebSocket, req: any) => {
      const userId = this.extractUserId(req);
      if (!userId) {
        ws.close(1008, 'User authentication required');
        return;
      }
      
      this.handleConnection(ws, userId);
    });
    
    console.log(`Collaboration service listening on port ${port}`);
  }

  // Handle new WebSocket connection
  private handleConnection(ws: WebSocket, userId: string): void {
    this.connections.set(userId, ws);
    
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(userId, message);
      } catch (error) {
        console.error('Invalid message format:', error);
        this.sendError(userId, 'Invalid message format');
      }
    });
    
    ws.on('close', () => {
      this.handleDisconnect(userId);
    });
    
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
    });
  }

  // Handle incoming message
  private async handleMessage(userId: string, message: any): Promise<void> {
    const { type, payload } = message;
    
    switch (type) {
      case MessageType.JOIN_SESSION:
        await this.handleJoinSession(userId, payload);
        break;
      
      case MessageType.LEAVE_SESSION:
        await this.handleLeaveSession(userId, payload);
        break;
      
      case MessageType.CURSOR_MOVE:
        this.handleCursorMove(userId, payload);
        break;
      
      case MessageType.SELECTION_CHANGE:
        this.handleSelectionChange(userId, payload);
        break;
      
      case MessageType.CODE_CHANGE:
        this.handleCodeChange(userId, payload);
        break;
      
      case MessageType.COMMENT_ADD:
        this.handleCommentAdd(userId, payload);
        break;
      
      case MessageType.FILE_OPEN:
        this.handleFileOpen(userId, payload);
        break;
      
      case MessageType.BRANCH_CREATE:
        this.handleBranchCreate(userId, payload);
        break;
      
      case MessageType.DRIVER_CHANGE:
        this.handleDriverChange(userId, payload);
        break;
      
      case MessageType.SYNC_REQUEST:
        this.handleSyncRequest(userId, payload);
        break;
      
      default:
        console.warn(`Unknown message type: ${type}`);
    }
  }

  // Handle user joining session
  private async handleJoinSession(userId: string, payload: any): Promise<void> {
    const { sessionId, role = UserRole.OBSERVER } = payload;
    
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      // Create new session
      session = await this.createSession(sessionId, userId, payload);
    }
    
    // Get user info
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    // Add participant
    const participant: Participant = {
      id: `participant_${Date.now()}`,
      userId,
      username: user?.firstName || 'Anonymous',
      avatar: user?.profileImageUrl || undefined,
      role,
      color: this.getParticipantColor(session.participants.size),
      isActive: true,
      permissions: this.getPermissionsForRole(role),
    };
    
    session.participants.set(userId, participant);
    
    // Track user session
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(sessionId);
    
    // Send session joined confirmation
    this.sendToUser(userId, {
      type: MessageType.SESSION_JOINED,
      payload: {
        sessionId,
        session: this.serializeSession(session),
      },
    });
    
    // Notify other participants
    this.broadcastToSession(sessionId, {
      type: MessageType.STATE_UPDATE,
      payload: {
        type: 'participant_joined',
        participant,
      },
    }, userId);
    
    // Update database
    await this.updateSessionInDB(sessionId);
  }

  // Handle user leaving session
  private async handleLeaveSession(userId: string, payload: any): Promise<void> {
    const { sessionId } = payload;
    const session = this.sessions.get(sessionId);
    
    if (!session) return;
    
    // Remove participant
    session.participants.delete(userId);
    
    // Update user sessions
    this.userSessions.get(userId)?.delete(sessionId);
    
    // Notify other participants
    this.broadcastToSession(sessionId, {
      type: MessageType.STATE_UPDATE,
      payload: {
        type: 'participant_left',
        userId,
      },
    }, userId);
    
    // Clean up empty session
    if (session.participants.size === 0) {
      this.sessions.delete(sessionId);
    }
    
    // Update database
    await this.updateSessionInDB(sessionId);
  }

  // Handle cursor movement
  private handleCursorMove(userId: string, payload: any): void {
    const { sessionId, cursor } = payload;
    const session = this.sessions.get(sessionId);
    
    if (!session) return;
    
    const participant = session.participants.get(userId);
    if (participant) {
      participant.cursor = cursor;
      
      // Broadcast to other participants
      this.broadcastToSession(sessionId, {
        type: MessageType.CURSOR_MOVE,
        payload: {
          userId,
          cursor,
        },
      }, userId);
    }
  }

  // Handle selection change
  private handleSelectionChange(userId: string, payload: any): void {
    const { sessionId, selection } = payload;
    const session = this.sessions.get(sessionId);
    
    if (!session) return;
    
    const participant = session.participants.get(userId);
    if (participant) {
      participant.selection = selection;
      
      // Broadcast to other participants
      this.broadcastToSession(sessionId, {
        type: MessageType.SELECTION_CHANGE,
        payload: {
          userId,
          selection,
        },
      }, userId);
    }
  }

  // Handle code change
  private handleCodeChange(userId: string, payload: any): void {
    const { sessionId, fileId, change } = payload;
    const session = this.sessions.get(sessionId);
    
    if (!session) return;
    
    const file = session.files.get(fileId);
    if (!file) return;
    
    // Check permissions
    const participant = session.participants.get(userId);
    if (!participant?.permissions.canEdit) {
      this.sendError(userId, 'No edit permissions');
      return;
    }
    
    // Apply operational transform
    const transformedChange = this.applyOperationalTransform(file, change);
    
    // Update file state
    file.changes.push(transformedChange);
    file.version++;
    
    // Apply change to content
    file.content = this.applyChangeToContent(file.content, transformedChange);
    
    // Broadcast to other participants
    this.broadcastToSession(sessionId, {
      type: MessageType.CODE_CHANGE,
      payload: {
        fileId,
        change: transformedChange,
        version: file.version,
      },
    }, userId);
  }

  // Handle comment addition
  private handleCommentAdd(userId: string, payload: any): void {
    const { sessionId, comment } = payload;
    const session = this.sessions.get(sessionId);
    
    if (!session) return;
    
    const participant = session.participants.get(userId);
    if (!participant?.permissions.canComment) {
      this.sendError(userId, 'No comment permissions');
      return;
    }
    
    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      userId,
      filePath: comment.filePath,
      line: comment.line,
      text: comment.text,
      resolved: false,
      replies: [],
      timestamp: Date.now(),
    };
    
    session.comments.push(newComment);
    
    // Broadcast to all participants
    this.broadcastToSession(sessionId, {
      type: MessageType.COMMENT_ADD,
      payload: {
        comment: newComment,
      },
    });
  }

  // Handle file open
  private handleFileOpen(userId: string, payload: any): void {
    const { sessionId, filePath } = payload;
    const session = this.sessions.get(sessionId);
    
    if (!session) return;
    
    let file = session.files.get(filePath);
    if (!file) {
      // Create new file state
      file = {
        path: filePath,
        content: payload.content || '',
        version: 0,
        locks: new Map(),
        changes: [],
        openBy: new Set(),
      };
      session.files.set(filePath, file);
    }
    
    file.openBy.add(userId);
    
    // Broadcast to other participants
    this.broadcastToSession(sessionId, {
      type: MessageType.FILE_OPEN,
      payload: {
        userId,
        filePath,
      },
    }, userId);
  }

  // Handle branch creation
  private handleBranchCreate(userId: string, payload: any): void {
    const { sessionId, branchName, baseCommit } = payload;
    const session = this.sessions.get(sessionId);
    
    if (!session) return;
    
    // Create new branch
    const branch: BranchState = {
      name: branchName,
      baseCommit: baseCommit || 'main',
      commits: [],
      files: new Map(session.files),
    };
    
    session.branches.set(branchName, branch);
    
    // Broadcast to all participants
    this.broadcastToSession(sessionId, {
      type: MessageType.BRANCH_CREATE,
      payload: {
        branchName,
        userId,
      },
    });
  }

  // Handle driver change (pair programming)
  private handleDriverChange(userId: string, payload: any): void {
    const { sessionId, newDriverId } = payload;
    const session = this.sessions.get(sessionId);
    
    if (!session || session.mode !== CollaborationMode.PAIR_PROGRAMMING) return;
    
    // Update roles
    session.participants.forEach((participant) => {
      if (participant.userId === newDriverId) {
        participant.role = UserRole.DRIVER;
      } else if (participant.role === UserRole.DRIVER) {
        participant.role = UserRole.NAVIGATOR;
      }
    });
    
    // Broadcast to all participants
    this.broadcastToSession(sessionId, {
      type: MessageType.DRIVER_CHANGE,
      payload: {
        newDriverId,
      },
    });
  }

  // Handle sync request
  private handleSyncRequest(userId: string, payload: any): void {
    const { sessionId } = payload;
    const session = this.sessions.get(sessionId);
    
    if (!session) return;
    
    // Send current state
    this.sendToUser(userId, {
      type: MessageType.SYNC_RESPONSE,
      payload: {
        session: this.serializeSession(session),
      },
    });
  }

  // Handle user disconnect
  private handleDisconnect(userId: string): void {
    const sessions = this.userSessions.get(userId);
    
    if (sessions) {
      sessions.forEach((sessionId) => {
        this.handleLeaveSession(userId, { sessionId });
      });
    }
    
    this.connections.delete(userId);
    this.userSessions.delete(userId);
  }

  // Create new session
  private async createSession(sessionId: string, hostId: string, config: any): Promise<SessionState> {
    const session: SessionState = {
      id: sessionId,
      roomId: `room_${Date.now()}`,
      mode: config.mode || CollaborationMode.PAIR_PROGRAMMING,
      participants: new Map(),
      files: new Map(),
      branches: new Map([['main', {
        name: 'main',
        baseCommit: 'initial',
        commits: [],
        files: new Map(),
      }]]),
      currentBranch: 'main',
      comments: [],
      drawings: [],
      chat: [],
      settings: {
        maxParticipants: config.maxParticipants || 10,
        allowGuestAccess: config.allowGuestAccess || false,
        requireApproval: config.requireApproval || false,
        recordSession: config.recordSession || false,
        enableAI: config.enableAI || true,
        autoSave: config.autoSave || true,
        autoSaveInterval: config.autoSaveInterval || 30000,
      },
    };
    
    this.sessions.set(sessionId, session);
    
    // Save to database
    await db.insert(collaborationSessions).values({
      roomId: session.roomId,
      hostUserId: hostId,
      participants: [],
      projectId: config.projectId,
      fileId: config.fileId,
      mode: session.mode,
      status: 'active',
      metadata: {
        settings: session.settings,
      },
    });
    
    return session;
  }

  // Update session in database
  private async updateSessionInDB(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const participants = Array.from(session.participants.values()).map(p => ({
      userId: p.userId,
      username: p.username,
      role: p.role,
    }));
    
    await db
      .update(collaborationSessions)
      .set({
        participants,
        metadata: {
          settings: session.settings,
          stats: {
            fileCount: session.files.size,
            commentCount: session.comments.length,
            branchCount: session.branches.size,
          },
        },
      })
      .where(eq(collaborationSessions.roomId, session.roomId));
  }

  // Apply operational transform
  private applyOperationalTransform(file: FileState, change: Change): Change {
    // Apply OT against pending changes
    let transformedChange = change;
    
    for (const existingChange of file.changes) {
      if (existingChange.timestamp > change.timestamp) {
        const [transformed] = OperationalTransform.transform(transformedChange, existingChange);
        transformedChange = transformed;
      }
    }
    
    return transformedChange;
  }

  // Apply change to content
  private applyChangeToContent(content: string, change: Change): string {
    const lines = content.split('\n');
    
    if (change.type === 'insert') {
      const line = lines[change.position.line] || '';
      lines[change.position.line] = 
        line.slice(0, change.position.column) + 
        change.content + 
        line.slice(change.position.column);
    } else if (change.type === 'delete') {
      // Handle delete
      const line = lines[change.position.line] || '';
      lines[change.position.line] = 
        line.slice(0, change.position.column) + 
        line.slice(change.position.column + 1);
    }
    
    return lines.join('\n');
  }

  // Get permissions for role
  private getPermissionsForRole(role: UserRole): any {
    switch (role) {
      case UserRole.HOST:
      case UserRole.DRIVER:
        return {
          canEdit: true,
          canComment: true,
          canDraw: true,
          canShare: true,
        };
      
      case UserRole.NAVIGATOR:
      case UserRole.REVIEWER:
        return {
          canEdit: false,
          canComment: true,
          canDraw: true,
          canShare: false,
        };
      
      case UserRole.OBSERVER:
      case UserRole.STUDENT:
      default:
        return {
          canEdit: false,
          canComment: true,
          canDraw: false,
          canShare: false,
        };
    }
  }

  // Get participant color
  private getParticipantColor(index: number): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#FFD93D', '#6C5CE7', '#A8E6CF',
    ];
    return colors[index % colors.length];
  }

  // Serialize session for transmission
  private serializeSession(session: SessionState): any {
    return {
      id: session.id,
      roomId: session.roomId,
      mode: session.mode,
      participants: Array.from(session.participants.values()),
      files: Array.from(session.files.entries()).map(([path, file]) => ({
        path,
        content: file.content,
        version: file.version,
        openBy: Array.from(file.openBy),
      })),
      branches: Array.from(session.branches.keys()),
      currentBranch: session.currentBranch,
      comments: session.comments,
      drawings: session.drawings,
      chat: session.chat.slice(-100), // Last 100 messages
      settings: session.settings,
    };
  }

  // Send message to specific user
  private sendToUser(userId: string, message: any): void {
    const ws = this.connections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Broadcast to all session participants
  private broadcastToSession(sessionId: string, message: any, excludeUserId?: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    session.participants.forEach((participant) => {
      if (participant.userId !== excludeUserId) {
        this.sendToUser(participant.userId, message);
      }
    });
  }

  // Send error message
  private sendError(userId: string, error: string): void {
    this.sendToUser(userId, {
      type: MessageType.ERROR,
      payload: { error },
    });
  }

  // Extract user ID from request
  private extractUserId(req: any): string | null {
    // Extract from auth header or query params
    // This would integrate with your auth system
    return req.headers['user-id'] || req.url?.split('userId=')[1]?.split('&')[0] || null;
  }

  // Public API methods
  
  // Get active sessions
  getActiveSessions(): Array<{ id: string; participants: number; mode: string }> {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      participants: session.participants.size,
      mode: session.mode,
    }));
  }

  // Get session details
  getSession(sessionId: string): SessionState | undefined {
    return this.sessions.get(sessionId);
  }

  // End session
  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    // Notify all participants
    this.broadcastToSession(sessionId, {
      type: MessageType.INFO,
      payload: {
        message: 'Session is ending',
      },
    });
    
    // Update database
    await db
      .update(collaborationSessions)
      .set({
        status: 'ended',
        endedAt: new Date(),
      })
      .where(eq(collaborationSessions.roomId, session.roomId));
    
    // Clean up
    session.participants.forEach((participant) => {
      this.userSessions.get(participant.userId)?.delete(sessionId);
    });
    
    this.sessions.delete(sessionId);
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();