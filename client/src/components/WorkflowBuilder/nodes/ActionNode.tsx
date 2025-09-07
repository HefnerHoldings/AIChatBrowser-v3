import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MousePointer,
  FormInput,
  Download,
  Upload,
  Navigation,
  Type,
  Image,
  Copy
} from 'lucide-react';

export function ActionNode({ data, selected }: NodeProps) {
  const getIcon = () => {
    switch (data.actionType) {
      case 'click': return <MousePointer className="h-4 w-4" />;
      case 'fill': return <FormInput className="h-4 w-4" />;
      case 'navigate': return <Navigation className="h-4 w-4" />;
      case 'type': return <Type className="h-4 w-4" />;
      case 'screenshot': return <Image className="h-4 w-4" />;
      case 'download': return <Download className="h-4 w-4" />;
      case 'upload': return <Upload className="h-4 w-4" />;
      case 'copy': return <Copy className="h-4 w-4" />;
      default: return <MousePointer className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`p-3 min-w-[180px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-background"
      />
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{data.label || 'Action'}</p>
          <Badge variant="outline" className="text-xs mt-1">
            Action
          </Badge>
        </div>
      </div>
      {data.selector && (
        <p className="text-xs text-muted-foreground font-mono bg-muted px-1 py-0.5 rounded">
          {data.selector}
        </p>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-background"
      />
    </Card>
  );
}