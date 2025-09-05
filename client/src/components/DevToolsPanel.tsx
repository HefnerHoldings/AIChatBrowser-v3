import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface DevToolsPanelProps {
  activeTab?: any;
  onClose: () => void;
}

export function DevToolsPanel({ activeTab, onClose }: DevToolsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium">Utviklerverktøy</h4>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      <div className="space-y-4 text-sm">
        <div>
          <p className="font-medium mb-2">Nåværende side</p>
          <div className="space-y-1 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <p><span className="font-medium">URL:</span> {activeTab?.url || 'N/A'}</p>
            <p><span className="font-medium">Tittel:</span> {activeTab?.title || 'N/A'}</p>
            <p><span className="font-medium">Status:</span> {activeTab?.isLoading ? 'Laster...' : 'Ferdig'}</p>
          </div>
        </div>
        
        <div>
          <p className="font-medium mb-2">DOM Inspector</p>
          <div className="bg-muted/50 p-2 rounded text-xs">
            <p className="text-muted-foreground">Element inspection coming soon...</p>
          </div>
        </div>
        
        <div>
          <p className="font-medium mb-2">Console</p>
          <div className="bg-muted/50 p-2 rounded text-xs">
            <p className="text-muted-foreground">Console logs will appear here...</p>
          </div>
        </div>
        
        <div>
          <p className="font-medium mb-2">Network</p>
          <div className="bg-muted/50 p-2 rounded text-xs">
            <p className="text-muted-foreground">Network requests will appear here...</p>
          </div>
        </div>
      </div>
    </div>
  );
}