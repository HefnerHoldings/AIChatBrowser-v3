import React from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Play,
  MousePointer,
  Database,
  GitBranch,
  Search,
  Clock,
  Globe,
  FormInput,
  Filter,
  Download,
  Mail,
  Building,
  Users,
  Phone,
  FileText,
  Calculator,
  Repeat,
  Timer,
  Navigation,
  Image,
  Copy,
  Package,
  Webhook,
  Calendar,
  Bot,
  Type,
  Upload,
  GitMerge,
  Table,
  Shuffle,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Linkedin,
  FileSearch
} from 'lucide-react';

interface NodeTemplate {
  type: string;
  label: string;
  icon: React.ReactNode;
  category: string;
  data?: any;
}

const nodeTemplates: NodeTemplate[] = [
  // Trigger nodes
  { type: 'trigger', label: 'Manuell Start', icon: <MousePointer className="h-4 w-4" />, category: 'Trigger', data: { triggerType: 'manual' } },
  { type: 'trigger', label: 'Tidsplan', icon: <Clock className="h-4 w-4" />, category: 'Trigger', data: { triggerType: 'schedule' } },
  { type: 'trigger', label: 'Webhook', icon: <Webhook className="h-4 w-4" />, category: 'Trigger', data: { triggerType: 'webhook' } },
  { type: 'trigger', label: 'Side Lastet', icon: <Globe className="h-4 w-4" />, category: 'Trigger', data: { triggerType: 'pageLoad' } },
  { type: 'trigger', label: 'Event', icon: <Calendar className="h-4 w-4" />, category: 'Trigger', data: { triggerType: 'event' } },
  { type: 'trigger', label: 'AI Trigger', icon: <Bot className="h-4 w-4" />, category: 'Trigger', data: { triggerType: 'ai' } },
  
  // Action nodes
  { type: 'action', label: 'Klikk', icon: <MousePointer className="h-4 w-4" />, category: 'Action', data: { actionType: 'click' } },
  { type: 'action', label: 'Fyll Skjema', icon: <FormInput className="h-4 w-4" />, category: 'Action', data: { actionType: 'fill' } },
  { type: 'action', label: 'Naviger', icon: <Navigation className="h-4 w-4" />, category: 'Action', data: { actionType: 'navigate' } },
  { type: 'action', label: 'Skriv Tekst', icon: <Type className="h-4 w-4" />, category: 'Action', data: { actionType: 'type' } },
  { type: 'action', label: 'Skjermbilde', icon: <Image className="h-4 w-4" />, category: 'Action', data: { actionType: 'screenshot' } },
  { type: 'action', label: 'Last Ned', icon: <Download className="h-4 w-4" />, category: 'Action', data: { actionType: 'download' } },
  { type: 'action', label: 'Last Opp', icon: <Upload className="h-4 w-4" />, category: 'Action', data: { actionType: 'upload' } },
  { type: 'action', label: 'Kopier', icon: <Copy className="h-4 w-4" />, category: 'Action', data: { actionType: 'copy' } },
  
  // Data nodes
  { type: 'data', label: 'Ekstraher Data', icon: <Database className="h-4 w-4" />, category: 'Data', data: { dataType: 'extract' } },
  { type: 'data', label: 'Transformer', icon: <GitMerge className="h-4 w-4" />, category: 'Data', data: { dataType: 'transform' } },
  { type: 'data', label: 'Filtrer', icon: <Filter className="h-4 w-4" />, category: 'Data', data: { dataType: 'filter' } },
  { type: 'data', label: 'Aggreger', icon: <Package className="h-4 w-4" />, category: 'Data', data: { dataType: 'aggregate' } },
  { type: 'data', label: 'Eksporter', icon: <Download className="h-4 w-4" />, category: 'Data', data: { dataType: 'export' } },
  { type: 'data', label: 'Importer', icon: <Upload className="h-4 w-4" />, category: 'Data', data: { dataType: 'import' } },
  { type: 'data', label: 'Tabell', icon: <Table className="h-4 w-4" />, category: 'Data', data: { dataType: 'table' } },
  { type: 'data', label: 'Fil', icon: <FileText className="h-4 w-4" />, category: 'Data', data: { dataType: 'file' } },
  
  // Logic nodes
  { type: 'logic', label: 'If/Else', icon: <GitBranch className="h-4 w-4" />, category: 'Logic', data: { logicType: 'condition' } },
  { type: 'logic', label: 'Loop', icon: <Repeat className="h-4 w-4" />, category: 'Logic', data: { logicType: 'loop' } },
  { type: 'logic', label: 'Vent', icon: <Timer className="h-4 w-4" />, category: 'Logic', data: { logicType: 'wait' } },
  { type: 'logic', label: 'Switch', icon: <Shuffle className="h-4 w-4" />, category: 'Logic', data: { logicType: 'switch' } },
  { type: 'logic', label: 'Kalkulator', icon: <Calculator className="h-4 w-4" />, category: 'Logic', data: { logicType: 'calculate' } },
  { type: 'logic', label: 'Suksess', icon: <CheckCircle className="h-4 w-4" />, category: 'Logic', data: { logicType: 'success' } },
  { type: 'logic', label: 'Feil', icon: <XCircle className="h-4 w-4" />, category: 'Logic', data: { logicType: 'error' } },
  { type: 'logic', label: 'Valider', icon: <AlertCircle className="h-4 w-4" />, category: 'Logic', data: { logicType: 'validate' } },
  
  // Scraper nodes
  { type: 'scraper', label: 'Søk', icon: <Search className="h-4 w-4" />, category: 'Scraper', data: { scraperType: 'search' } },
  { type: 'scraper', label: 'Nettside', icon: <Globe className="h-4 w-4" />, category: 'Scraper', data: { scraperType: 'website' } },
  { type: 'scraper', label: 'Kontakt', icon: <Phone className="h-4 w-4" />, category: 'Scraper', data: { scraperType: 'contact' } },
  { type: 'scraper', label: 'E-post', icon: <Mail className="h-4 w-4" />, category: 'Scraper', data: { scraperType: 'email' } },
  { type: 'scraper', label: 'Bedrift', icon: <Building className="h-4 w-4" />, category: 'Scraper', data: { scraperType: 'company' } },
  { type: 'scraper', label: 'Personer', icon: <Users className="h-4 w-4" />, category: 'Scraper', data: { scraperType: 'people' } },
  { type: 'scraper', label: 'Lokasjon', icon: <MapPin className="h-4 w-4" />, category: 'Scraper', data: { scraperType: 'location' } },
  { type: 'scraper', label: 'LinkedIn', icon: <Linkedin className="h-4 w-4" />, category: 'Scraper', data: { scraperType: 'linkedin' } },
  { type: 'scraper', label: 'Dokument', icon: <FileSearch className="h-4 w-4" />, category: 'Scraper', data: { scraperType: 'document' } },
];

const categories = ['Trigger', 'Action', 'Data', 'Logic', 'Scraper'];

interface NodeLibraryProps {
  onNodeDragStart?: (event: React.DragEvent, nodeType: string, label: string, data?: any) => void;
}

export function NodeLibrary({ onNodeDragStart }: NodeLibraryProps) {
  const handleDragStart = (event: React.DragEvent, node: NodeTemplate) => {
    event.dataTransfer.setData('nodeType', node.type);
    event.dataTransfer.setData('label', node.label);
    event.dataTransfer.setData('data', JSON.stringify(node.data || {}));
    event.dataTransfer.effectAllowed = 'move';
    
    if (onNodeDragStart) {
      onNodeDragStart(event, node.type, node.label, node.data);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Trigger': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Action': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Data': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Logic': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Scraper': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Node Bibliotek</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Dra noder til canvas for å bygge workflow
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  category === 'Trigger' ? 'bg-green-500' :
                  category === 'Action' ? 'bg-blue-500' :
                  category === 'Data' ? 'bg-amber-500' :
                  category === 'Logic' ? 'bg-purple-500' :
                  'bg-red-500'
                }`} />
                {category}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {nodeTemplates
                  .filter((node) => node.category === category)
                  .map((node, idx) => (
                    <Card
                      key={`${category}-${idx}`}
                      className={`p-3 cursor-move hover:shadow-lg transition-all ${getCategoryColor(category)}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, node)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0">
                          {node.icon}
                        </div>
                        <span className="text-xs font-medium truncate">
                          {node.label}
                        </span>
                      </div>
                    </Card>
                  ))}
              </div>
              {category !== categories[categories.length - 1] && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}