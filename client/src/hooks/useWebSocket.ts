import React, { useEffect, useRef, useState, useCallback } from 'react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// WebSocket State
export enum WSState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

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

// WebSocket Events
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

// WebSocket Options
export interface UseWebSocketOptions {
  namespace?: WSNamespace;
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  reconnectDelayMax?: number;
  heartbeatInterval?: number;
  messageQueueSize?: number;
  debug?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason?: string) => void;
  onError?: (error: Error) => void;
  onMessage?: (message: WSMessage) => void;
}

// Message Handler
type MessageHandler = (data: any) => void;

// Subscription
interface Subscription {
  event: string;
  handler: MessageHandler;
  once?: boolean;
}

// WebSocket Hook
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    namespace = WSNamespace.COLLABORATION,
    autoConnect = true,
    reconnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
    reconnectDelayMax = 30000,
    heartbeatInterval = 30000,
    messageQueueSize = 100,
    debug = false,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
  } = options;

  const { toast } = useToast();
  
  // State
  const [state, setState] = useState<WSState>(WSState.DISCONNECTED);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Set<string>>(new Set());
  const [presence, setPresence] = useState<Map<string, any>>(new Map());
  
  // Refs
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
  const reconnectCount = useRef(0);
  const subscriptions = useRef<Map<string, Set<Subscription>>>(new Map());
  const messageQueue = useRef<WSMessage[]>([]);
  const messageId = useRef(0);

  // Debug logging
  const log = useCallback((...args: any[]) => {
    if (debug) {
      console.log('[WebSocket]', ...args);
    }
  }, [debug]);

  // Generate message ID
  const generateMessageId = useCallback((): string => {
    return `msg_${Date.now()}_${++messageId.current}`;
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      log('Already connected');
      return;
    }

    setState(WSState.CONNECTING);
    log('Connecting to WebSocket...');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws`;

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        log('Connected to WebSocket');
        setState(WSState.CONNECTED);
        reconnectCount.current = 0;
        
        // Start heartbeat
        startHeartbeat();
        
        // Authenticate
        authenticate();
        
        // Process queued messages
        processMessageQueue();
        
        onConnect?.();
      };

      ws.current.onclose = (event) => {
        log('WebSocket closed:', event.code, event.reason);
        setState(WSState.DISCONNECTED);
        stopHeartbeat();
        
        setIsAuthenticated(false);
        setConnectionId(null);
        
        onDisconnect?.(event.reason);
        
        // Attempt reconnection
        if (reconnect && reconnectCount.current < reconnectAttempts) {
          scheduleReconnect();
        }
      };

      ws.current.onerror = (event) => {
        log('WebSocket error:', event);
        setState(WSState.ERROR);
        
        const error = new Error('WebSocket connection error');
        onError?.(error);
        
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to real-time services',
          variant: 'destructive',
        });
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const validatedMessage = WSMessageSchema.parse(message);
          
          handleMessage(validatedMessage);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setState(WSState.ERROR);
      
      if (error instanceof Error) {
        onError?.(error);
      }
    }
  }, [log, onConnect, onDisconnect, onError, reconnect, reconnectAttempts, toast]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    log('Disconnecting from WebSocket');
    
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    
    stopHeartbeat();
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    setState(WSState.DISCONNECTED);
  }, [log]);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimer.current) return;
    
    setState(WSState.RECONNECTING);
    reconnectCount.current++;
    
    const delay = Math.min(
      reconnectDelay * Math.pow(2, reconnectCount.current - 1),
      reconnectDelayMax
    );
    
    log(`Reconnecting in ${delay}ms (attempt ${reconnectCount.current}/${reconnectAttempts})`);
    
    reconnectTimer.current = setTimeout(() => {
      reconnectTimer.current = null;
      connect();
    }, delay);
  }, [connect, log, reconnectAttempts, reconnectDelay, reconnectDelayMax]);

  // Authenticate connection
  const authenticate = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      log('No auth token found');
      return;
    }
    
    send({
      event: WSEventType.AUTHENTICATE,
      data: { token },
    });
  }, []);

  // Handle incoming message
  const handleMessage = useCallback((message: WSMessage) => {
    log('Received message:', message.event, message.data);
    
    // Handle system events
    switch (message.event) {
      case WSEventType.CONNECT:
        setConnectionId(message.data.connectionId);
        break;
        
      case WSEventType.AUTHENTICATE:
        if (message.data.success) {
          setIsAuthenticated(true);
          log('Authenticated successfully');
        } else {
          log('Authentication failed');
        }
        break;
        
      case WSEventType.JOIN_ROOM:
        const members = message.data.members || [];
        members.forEach((member: any) => {
          presence.set(member.userId, member);
        });
        setPresence(new Map(presence));
        break;
        
      case WSEventType.USER_JOINED:
        presence.set(message.data.userId, message.data);
        setPresence(new Map(presence));
        break;
        
      case WSEventType.USER_LEFT:
        presence.delete(message.data.userId);
        setPresence(new Map(presence));
        break;
        
      case WSEventType.HEARTBEAT:
        // Server heartbeat received
        break;
        
      case WSEventType.PONG:
        // Pong received
        break;
        
      case WSEventType.ERROR:
        console.error('WebSocket error:', message.data.error);
        toast({
          title: 'Error',
          description: message.data.error,
          variant: 'destructive',
        });
        break;
    }
    
    // Notify subscribers
    const handlers = subscriptions.current.get(message.event);
    if (handlers) {
      handlers.forEach(subscription => {
        subscription.handler(message.data);
        
        if (subscription.once) {
          handlers.delete(subscription);
        }
      });
    }
    
    // Global message handler
    onMessage?.(message);
  }, [log, onMessage, presence, toast]);

  // Send message
  const send = useCallback((message: Partial<WSMessage>) => {
    const fullMessage: WSMessage = {
      id: message.id || generateMessageId(),
      namespace: message.namespace || namespace,
      event: message.event || '',
      data: message.data || {},
      timestamp: message.timestamp || Date.now(),
      ...message,
    };
    
    if (ws.current?.readyState === WebSocket.OPEN) {
      log('Sending message:', fullMessage.event, fullMessage.data);
      ws.current.send(JSON.stringify(fullMessage));
    } else {
      // Queue message if not connected
      log('Queueing message:', fullMessage.event);
      messageQueue.current.push(fullMessage);
      
      // Trim queue if too large
      if (messageQueue.current.length > messageQueueSize) {
        messageQueue.current = messageQueue.current.slice(-messageQueueSize);
      }
    }
  }, [generateMessageId, log, messageQueueSize, namespace]);

  // Process queued messages
  const processMessageQueue = useCallback(() => {
    if (messageQueue.current.length === 0) return;
    
    log(`Processing ${messageQueue.current.length} queued messages`);
    
    const queue = [...messageQueue.current];
    messageQueue.current = [];
    
    queue.forEach(message => {
      send(message);
    });
  }, [log, send]);

  // Subscribe to event
  const subscribe = useCallback((event: string, handler: MessageHandler, once = false): (() => void) => {
    log('Subscribing to event:', event);
    
    if (!subscriptions.current.has(event)) {
      subscriptions.current.set(event, new Set());
    }
    
    const subscription: Subscription = { event, handler, once };
    subscriptions.current.get(event)!.add(subscription);
    
    // Return unsubscribe function
    return () => {
      const handlers = subscriptions.current.get(event);
      if (handlers) {
        handlers.delete(subscription);
        
        if (handlers.size === 0) {
          subscriptions.current.delete(event);
        }
      }
    };
  }, [log]);

  // Join room
  const joinRoom = useCallback((roomId: string) => {
    log('Joining room:', roomId);
    
    send({
      event: WSEventType.JOIN_ROOM,
      data: { roomId, namespace },
    });
    
    setRooms(prev => new Set(prev).add(roomId));
  }, [log, namespace, send]);

  // Leave room
  const leaveRoom = useCallback((roomId: string) => {
    log('Leaving room:', roomId);
    
    send({
      event: WSEventType.LEAVE_ROOM,
      data: { roomId },
    });
    
    setRooms(prev => {
      const next = new Set(prev);
      next.delete(roomId);
      return next;
    });
  }, [log, send]);

  // Send cursor position
  const sendCursor = useCallback((position: { x: number; y: number; element?: string }) => {
    send({
      event: WSEventType.CURSOR_MOVE,
      data: position,
    });
  }, [send]);

  // Send selection
  const sendSelection = useCallback((selection: { start: number; end: number; text: string }) => {
    send({
      event: WSEventType.SELECTION_CHANGE,
      data: selection,
    });
  }, [send]);

  // Send comment
  const sendComment = useCallback((comment: { text: string; elementId?: string; position?: { x: number; y: number } }) => {
    send({
      event: WSEventType.COMMENT_ADD,
      data: comment,
    });
  }, [send]);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    if (heartbeatTimer.current) return;
    
    heartbeatTimer.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        send({
          event: WSEventType.PING,
          data: {},
        });
      }
    }, heartbeatInterval);
  }, [heartbeatInterval, send]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = null;
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [autoConnect]); // Only include stable dependencies

  // Reconnect on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (state === WSState.DISCONNECTED && reconnect) {
        log('Window focused, attempting reconnection');
        connect();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [connect, log, reconnect, state]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      log('Network online, attempting reconnection');
      connect();
    };
    
    const handleOffline = () => {
      log('Network offline');
      disconnect();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connect, disconnect, log]);

  return {
    // State
    state,
    isConnected: state === WSState.CONNECTED,
    isAuthenticated,
    connectionId,
    rooms,
    presence,
    
    // Actions
    connect,
    disconnect,
    send,
    subscribe,
    joinRoom,
    leaveRoom,
    sendCursor,
    sendSelection,
    sendComment,
  };
}

// Context for WebSocket
import { createContext, useContext, ReactNode } from 'react';

interface WebSocketContextValue extends ReturnType<typeof useWebSocket> {}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const ws = useWebSocket({
    autoConnect: true,
    reconnect: true,
    debug: process.env.NODE_ENV === 'development',
  });

  return React.createElement(
    WebSocketContext.Provider,
    { value: ws },
    children
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
}