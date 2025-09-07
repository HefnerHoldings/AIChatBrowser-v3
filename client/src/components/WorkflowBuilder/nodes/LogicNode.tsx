import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GitBranch,
  Repeat,
  Timer,
  Shuffle,
  Calculator,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export function LogicNode({ data, selected }: NodeProps) {
  const getIcon = () => {
    switch (data.logicType) {
      case 'condition': return <GitBranch className="h-4 w-4" />;
      case 'loop': return <Repeat className="h-4 w-4" />;
      case 'wait': return <Timer className="h-4 w-4" />;
      case 'switch': return <Shuffle className="h-4 w-4" />;
      case 'calculate': return <Calculator className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'validate': return <AlertCircle className="h-4 w-4" />;
      default: return <GitBranch className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`p-3 min-w-[180px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-500 border-2 border-background"
      />
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-purple-500/10 text-purple-500 rounded">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{data.label || 'Logic'}</p>
          <Badge variant="outline" className="text-xs mt-1">
            Logic
          </Badge>
        </div>
      </div>
      {data.condition && (
        <div className="text-xs bg-muted p-2 rounded">
          <p className="font-mono">{data.condition}</p>
        </div>
      )}
      <div className="flex gap-2 mt-2">
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          style={{ left: '30%' }}
          className="w-3 h-3 bg-green-500 border-2 border-background"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          style={{ left: '70%' }}
          className="w-3 h-3 bg-red-500 border-2 border-background"
        />
      </div>
    </Card>
  );
}