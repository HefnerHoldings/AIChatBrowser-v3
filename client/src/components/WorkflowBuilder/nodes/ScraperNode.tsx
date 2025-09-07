import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Globe,
  Users,
  Building,
  Phone,
  Mail,
  MapPin,
  Linkedin,
  FileSearch
} from 'lucide-react';

export function ScraperNode({ data, selected }: NodeProps) {
  const getIcon = () => {
    switch (data.scraperType) {
      case 'search': return <Search className="h-4 w-4" />;
      case 'website': return <Globe className="h-4 w-4" />;
      case 'contact': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'company': return <Building className="h-4 w-4" />;
      case 'people': return <Users className="h-4 w-4" />;
      case 'location': return <MapPin className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'document': return <FileSearch className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`p-3 min-w-[180px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-red-500 border-2 border-background"
      />
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-red-500/10 text-red-500 rounded">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{data.label || 'Scraper'}</p>
          <Badge variant="outline" className="text-xs mt-1">
            Scraper
          </Badge>
        </div>
      </div>
      {data.source && (
        <div className="text-xs text-muted-foreground">
          <p className="font-medium">Kilde: {data.source}</p>
          {data.extractFields && (
            <div className="mt-1">
              {data.extractFields.slice(0, 2).map((field: string, idx: number) => (
                <p key={idx} className="ml-2">• {field}</p>
              ))}
            </div>
          )}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-red-500 border-2 border-background"
      />
    </Card>
  );
}