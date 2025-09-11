import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { EventEmitter } from 'events';
import { AgentOrchestrator } from './ai-agents';

export interface WSMessage {
  type: string;
  data: any;
  timestamp: Date;
}

export class AgentWebSocketServer extends EventEmitter {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private orchestrator: AgentOrchestrator | null = null;

  constructor(server: Server) {
    super();
    
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/agents'
    });

    this.initialize();
  }

  private initialize(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket client connected for agents');
      this.clients.add(ws);

      // Send initial connection confirmation
      this.sendToClient(ws, {
        type: 'connected',
        data: { message: 'Connected to Agent Orchestrator' },
        timestamp: new Date()
      });

      // Send current agent states if orchestrator exists
      if (this.orchestrator) {
        this.sendAgentStates(ws);
      }

      // Handle client messages
      ws.on('message', (message: string) => {
        try {
          const msg = JSON.parse(message.toString());
          this.handleClientMessage(ws, msg);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  setOrchestrator(orchestrator: AgentOrchestrator): void {
    this.orchestrator = orchestrator;

    // Subscribe to orchestrator events
    orchestrator.on('agent-update', (data) => {
      this.broadcast({
        type: 'agent-update',
        data: { agent: data },
        timestamp: new Date()
      });
    });

    orchestrator.on('message', (message) => {
      this.broadcast({
        type: 'message',
        data: { message },
        timestamp: new Date()
      });
    });

    orchestrator.on('task-update', (task) => {
      this.broadcast({
        type: 'task-update',
        data: { task },
        timestamp: new Date()
      });
    });

    orchestrator.on('consensus-request', (request) => {
      this.broadcast({
        type: 'consensus-request',
        data: { request },
        timestamp: new Date()
      });
    });

    orchestrator.on('knowledge-update', (knowledge) => {
      this.broadcast({
        type: 'knowledge-update',
        data: { knowledge },
        timestamp: new Date()
      });
    });

    orchestrator.on('error', (error) => {
      this.broadcast({
        type: 'error',
        data: { error: error.message },
        timestamp: new Date()
      });
    });
  }

  private handleClientMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'get-agents':
        this.sendAgentStates(ws);
        break;

      case 'get-tasks':
        this.sendTasks(ws);
        break;

      case 'create-task':
        this.createTask(message.data);
        break;

      case 'pause-agent':
        this.pauseAgent(message.data.agentId);
        break;

      case 'resume-agent':
        this.resumeAgent(message.data.agentId);
        break;

      case 'reset-agent':
        this.resetAgent(message.data.agentId);
        break;

      case 'vote-consensus':
        this.voteConsensus(message.data);
        break;

      case 'update-config':
        this.updateAgentConfig(message.data);
        break;

      case 'get-knowledge':
        this.sendKnowledge(ws);
        break;

      case 'ping':
        this.sendToClient(ws, {
          type: 'pong',
          data: {},
          timestamp: new Date()
        });
        break;

      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }

  private sendAgentStates(ws: WebSocket): void {
    if (this.orchestrator) {
      const agents = this.orchestrator.getAgents();
      this.sendToClient(ws, {
        type: 'agents-list',
        data: { agents },
        timestamp: new Date()
      });
    }
  }

  private sendTasks(ws: WebSocket): void {
    if (this.orchestrator) {
      const tasks = this.orchestrator.getTasks();
      this.sendToClient(ws, {
        type: 'tasks-list',
        data: { tasks },
        timestamp: new Date()
      });
    }
  }

  private sendKnowledge(ws: WebSocket): void {
    if (this.orchestrator) {
      const knowledge = this.orchestrator.getKnowledgeBase();
      this.sendToClient(ws, {
        type: 'knowledge-base',
        data: { knowledge },
        timestamp: new Date()
      });
    }
  }

  private createTask(taskData: any): void {
    if (this.orchestrator) {
      this.orchestrator.createTask(taskData);
    }
  }

  private pauseAgent(agentId: string): void {
    if (this.orchestrator) {
      this.orchestrator.pauseAgent(agentId);
    }
  }

  private resumeAgent(agentId: string): void {
    if (this.orchestrator) {
      this.orchestrator.resumeAgent(agentId);
    }
  }

  private resetAgent(agentId: string): void {
    if (this.orchestrator) {
      this.orchestrator.resetAgent(agentId);
    }
  }

  private voteConsensus(voteData: any): void {
    if (this.orchestrator) {
      this.orchestrator.submitConsensusVote(
        voteData.requestId,
        voteData.agentId,
        voteData.vote
      );
    }
  }

  private updateAgentConfig(configData: any): void {
    if (this.orchestrator) {
      this.orchestrator.updateAgentConfiguration(
        configData.agentId,
        configData.config
      );
    }
  }

  private sendToClient(ws: WebSocket, message: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcast(message: WSMessage): void {
    const messageStr = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  // Send periodic heartbeat to keep connections alive
  startHeartbeat(): void {
    setInterval(() => {
      this.broadcast({
        type: 'heartbeat',
        data: { timestamp: Date.now() },
        timestamp: new Date()
      });
    }, 30000); // Every 30 seconds
  }

  getClientCount(): number {
    return this.clients.size;
  }

  close(): void {
    this.clients.forEach(client => {
      client.close();
    });
    this.wss.close();
  }
}