import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Clock, 
  Globe, 
  Webhook,
  Calendar,
  MousePointer,
  Bot
} from 'lucide-react';

export function TriggerNode({ data, selected }: NodeProps) {
  const getIcon = () => {
    switch (data.triggerType) {
      case 'manual': return <MousePointer className="h-4 w-4" />;
      case 'schedule': return <Clock className="h-4 w-4" />;
      case 'webhook': return <Webhook className="h-4 w-4" />;
      case 'pageLoad': return <Globe className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      case 'ai': return <Bot className="h-4 w-4" />;
      default: return <Play className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`p-3 min-w-[180px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-green-500/10 text-green-500 rounded">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{data.label || 'Trigger'}</p>
          <Badge variant="outline" className="text-xs mt-1">
            Trigger
          </Badge>
        </div>
      </div>
      {data.description && (
        <p className="text-xs text-muted-foreground">{data.description}</p>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-500 border-2 border-background"
      />
    </Card>
  );
}