import React, { useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowInstance,
  BackgroundVariant,
  NodeTypes,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  RotateCw, 
  Save, 
  Download,
  Zap,
  MousePointer,
  FormInput,
  Database,
  Code,
  GitBranch,
  Globe,
  Search,
  FileText,
  Mail,
  Clock,
  Filter
} from 'lucide-react';

// Custom node types
import { TriggerNode } from './nodes/TriggerNode';
import { ActionNode } from './nodes/ActionNode';
import { DataNode } from './nodes/DataNode';
import { LogicNode } from './nodes/LogicNode';
import { ScraperNode } from './nodes/ScraperNode';

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  data: DataNode,
  logic: LogicNode,
  scraper: ScraperNode,
};

// Initial nodes for demo
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 250, y: 50 },
    data: { 
      label: 'Start',
      type: 'manual',
      description: 'Manuell start av workflow'
    },
  },
];

const initialEdges: Edge[] = [];

interface VisualCanvasProps {
  onWorkflowChange?: (nodes: Node[], edges: Edge[]) => void;
  onExecute?: () => void;
  isExecuting?: boolean;
  aiSuggestions?: any[];
}

export function VisualCanvas({
  onWorkflowChange,
  onExecute,
  isExecuting = false,
  aiSuggestions = []
}: VisualCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Handle connection between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        style: {
          strokeWidth: 2,
          stroke: '#6366f1',
        },
        animated: isExecuting,
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, isExecuting]
  );

  // Drag and drop handler
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('nodeType');
      const label = event.dataTransfer.getData('label');
      const icon = event.dataTransfer.getData('icon');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (!position) return;

      const newNode: Node = {
        id: `${Date.now()}`,
        type,
        position,
        data: { label, icon, type },
      };

      setNodes((nds) => nds.concat(newNode));
      
      toast({
        title: 'Node lagt til',
        description: `${label} node er lagt til i workflowen`,
      });
    },
    [reactFlowInstance, setNodes]
  );

  // Node selection handler
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Save workflow
  const saveWorkflow = useCallback(() => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      localStorage.setItem('workflow', JSON.stringify(flow));
      toast({
        title: 'Workflow lagret',
        description: 'Din workflow er lagret lokalt',
      });
    }
  }, [reactFlowInstance]);

  // Load workflow
  const loadWorkflow = useCallback(() => {
    const saved = localStorage.getItem('workflow');
    if (saved && reactFlowInstance) {
      const flow = JSON.parse(saved);
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
      toast({
        title: 'Workflow lastet',
        description: 'Din lagrede workflow er lastet inn',
      });
    }
  }, [reactFlowInstance, setNodes, setEdges]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    toast({
      title: 'Canvas tømt',
      description: 'Alle noder og koblinger er fjernet',
    });
  }, [setNodes, setEdges]);

  // Update parent when workflow changes
  useEffect(() => {
    if (onWorkflowChange) {
      onWorkflowChange(nodes, edges);
    }
  }, [nodes, edges, onWorkflowChange]);

  // Highlight nodes during execution
  useEffect(() => {
    if (isExecuting) {
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          animated: true,
          style: { ...edge.style, stroke: '#10b981' },
        }))
      );
    } else {
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          animated: false,
          style: { ...edge.style, stroke: '#6366f1' },
        }))
      );
    }
  }, [isExecuting, setEdges]);

  return (
    <div className="h-full w-full relative">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 bg-background/95 backdrop-blur rounded-lg shadow-lg border p-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={isExecuting ? "destructive" : "default"}
            onClick={onExecute}
            disabled={nodes.length === 0}
          >
            {isExecuting ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stopp
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Kjør
              </>
            )}
          </Button>
          <Button size="sm" variant="outline" onClick={saveWorkflow}>
            <Save className="h-4 w-4 mr-2" />
            Lagre
          </Button>
          <Button size="sm" variant="outline" onClick={loadWorkflow}>
            <Download className="h-4 w-4 mr-2" />
            Last inn
          </Button>
          <Button size="sm" variant="outline" onClick={clearCanvas}>
            <RotateCw className="h-4 w-4 mr-2" />
            Tøm
          </Button>
        </div>
      </div>

      {/* AI Suggestions Panel */}
      {aiSuggestions.length > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-background/95 backdrop-blur rounded-lg shadow-lg border p-4 max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="font-semibold text-sm">AI Forslag</span>
          </div>
          <div className="space-y-2">
            {aiSuggestions.slice(0, 3).map((suggestion, idx) => (
              <Card key={idx} className="p-2 cursor-pointer hover:bg-accent">
                <p className="text-xs">{suggestion}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 z-10 bg-background/95 backdrop-blur rounded-lg shadow-lg border p-4 max-w-sm">
          <h3 className="font-semibold mb-2">Node Detaljer</h3>
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Type:</span> {selectedNode.type}</p>
            <p><span className="text-muted-foreground">Label:</span> {selectedNode.data.label}</p>
            <p><span className="text-muted-foreground">ID:</span> {selectedNode.id}</p>
          </div>
        </div>
      )}

      {/* React Flow Canvas */}
      <div className="h-full w-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={12} 
            size={1}
            color="#6b7280"
          />
          <Controls 
            className="bg-background border shadow-lg"
            showZoom={true}
            showFitView={true}
            showInteractive={false}
          />
          <MiniMap 
            className="bg-background border shadow-lg"
            nodeColor={(node) => {
              switch (node.type) {
                case 'trigger': return '#10b981';
                case 'action': return '#3b82f6';
                case 'data': return '#f59e0b';
                case 'logic': return '#8b5cf6';
                case 'scraper': return '#ef4444';
                default: return '#6b7280';
              }
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

// Wrapper component with ReactFlowProvider
export default function VisualWorkflowCanvas(props: VisualCanvasProps) {
  return (
    <ReactFlowProvider>
      <VisualCanvas {...props} />
    </ReactFlowProvider>
  );
}