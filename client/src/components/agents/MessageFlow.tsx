import { useEffect, useRef } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Controls, 
  Background,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Agent, AgentMessage } from './AgentDashboard';

interface MessageFlowProps {
  messages: AgentMessage[];
  agents: Agent[];
}

const MessageFlow = ({ messages, agents }: MessageFlowProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const flowRef = useRef<any>(null);

  useEffect(() => {
    // Create nodes for each agent
    const agentNodes: Node[] = agents.map((agent, index) => ({
      id: agent.id,
      type: 'default',
      position: {
        x: 200 + (index % 3) * 250,
        y: 100 + Math.floor(index / 3) * 200
      },
      data: {
        label: (
          <div className="p-2 text-center">
            <div className="font-semibold capitalize">{agent.type}</div>
            <Badge variant={agent.status === 'working' ? 'default' : 'secondary'} className="mt-1">
              {agent.status}
            </Badge>
          </div>
        )
      },
      style: {
        background: agent.status === 'working' ? '#3b82f6' : 
                    agent.status === 'thinking' ? '#eab308' :
                    agent.status === 'error' ? '#ef4444' : '#6b7280',
        color: 'white',
        borderRadius: '8px',
        width: 150,
        fontSize: '12px'
      }
    }));

    setNodes(agentNodes);

    // Create edges for recent messages
    const recentMessages = messages.slice(0, 20);
    const messageEdges: Edge[] = recentMessages.map((msg, index) => ({
      id: `msg-${msg.id}`,
      source: agents.find(a => a.type === msg.from)?.id || msg.from,
      target: msg.to === 'broadcast' ? agents[0]?.id : 
              agents.find(a => a.type === msg.to)?.id || msg.to,
      animated: index < 5,
      label: msg.type,
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      style: {
        stroke: msg.type === 'consensus' ? '#8b5cf6' :
                msg.type === 'request' ? '#3b82f6' :
                msg.type === 'response' ? '#10b981' : '#6b7280',
        strokeWidth: index < 5 ? 2 : 1,
        opacity: 1 - (index * 0.04)
      }
    }));

    setEdges(messageEdges);
  }, [messages, agents, setNodes, setEdges]);

  // Format timestamp
  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // Get message type color
  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'request': return 'bg-blue-500';
      case 'response': return 'bg-green-500';
      case 'notification': return 'bg-yellow-500';
      case 'consensus': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="h-full flex gap-4">
      {/* Flow Diagram */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Agent Communication Flow</CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-5rem)]">
          <ReactFlowProvider>
            <ReactFlow
              ref={flowRef}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              attributionPosition="bottom-left"
            >
              <Background color="#aaa" gap={16} />
              <MiniMap 
                nodeStrokeColor={(n) => n.style?.background as string || '#6b7280'}
                nodeColor={(n) => n.style?.background as string || '#6b7280'}
                nodeBorderRadius={8}
              />
              <Controls />
            </ReactFlow>
          </ReactFlowProvider>
        </CardContent>
      </Card>

      {/* Message List */}
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="space-y-2">
              {messages.slice(0, 50).map((msg) => (
                <div
                  key={msg.id}
                  className="p-3 border rounded-lg space-y-2"
                  data-testid={`message-${msg.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {msg.from}
                      </Badge>
                      <span className="text-xs text-muted-foreground">→</span>
                      <Badge variant="outline" className="capitalize">
                        {msg.to}
                      </Badge>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getMessageTypeColor(msg.type)}`} />
                  </div>
                  
                  <div className="text-xs">
                    <Badge variant="secondary" className="mb-1">
                      {msg.type}
                    </Badge>
                    <div className="text-muted-foreground mt-1">
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>

                  {msg.content && (
                    <div className="text-xs p-2 bg-secondary rounded">
                      <pre className="whitespace-pre-wrap break-words">
                        {typeof msg.content === 'string' 
                          ? msg.content 
                          : JSON.stringify(msg.content, null, 2).substring(0, 200)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageFlow;