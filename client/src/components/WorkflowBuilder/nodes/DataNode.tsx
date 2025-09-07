import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Database,
  FileText,
  Download,
  Upload,
  Filter,
  GitMerge,
  Table,
  Package
} from 'lucide-react';

export function DataNode({ data, selected }: NodeProps) {
  const getIcon = () => {
    switch (data.dataType) {
      case 'extract': return <Database className="h-4 w-4" />;
      case 'transform': return <GitMerge className="h-4 w-4" />;
      case 'filter': return <Filter className="h-4 w-4" />;
      case 'aggregate': return <Package className="h-4 w-4" />;
      case 'export': return <Download className="h-4 w-4" />;
      case 'import': return <Upload className="h-4 w-4" />;
      case 'table': return <Table className="h-4 w-4" />;
      case 'file': return <FileText className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`p-3 min-w-[180px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-amber-500 border-2 border-background"
      />
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{data.label || 'Data'}</p>
          <Badge variant="outline" className="text-xs mt-1">
            Data
          </Badge>
        </div>
      </div>
      {data.fields && (
        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Felter:</p>
          {data.fields.slice(0, 3).map((field: string, idx: number) => (
            <p key={idx} className="ml-2">• {field}</p>
          ))}
          {data.fields.length > 3 && (
            <p className="ml-2 italic">+{data.fields.length - 3} flere...</p>
          )}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-amber-500 border-2 border-background"
      />
    </Card>
  );
}