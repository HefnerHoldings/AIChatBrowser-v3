import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import SelectorBuilder from "@/components/selector-studio/SelectorBuilder";
import StabilityAnalyzer from "@/components/selector-studio/StabilityAnalyzer";
import DomainProfiler from "@/components/selector-studio/DomainProfiler";
import SelectorHealer from "@/components/selector-studio/SelectorHealer";
import ExportPanel from "@/components/selector-studio/ExportPanel";
import { 
  MousePointer, 
  Shield, 
  Sparkles, 
  Settings,
  Download,
  History,
  Target,
  Code
} from "lucide-react";

interface Selector {
  id: string;
  selector: string;
  type: string;
  url: string;
  score?: number;
  status: 'active' | 'broken' | 'deprecated';
  createdAt: Date;
  lastUsed?: Date;
}

export default function SelectorStudio() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("builder");
  const [selectedSelector, setSelectedSelector] = useState<Selector | null>(null);
  const [isPickerActive, setIsPickerActive] = useState(false);

  // Fetch selectors
  const { data: selectors = [], isLoading: selectorsLoading } = useQuery({
    queryKey: ['/api/selector-studio/selectors'],
    refetchInterval: 5000
  });

  // Fetch domain profiles
  const { data: domainProfiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['/api/selector-studio/profiles']
  });

  // Test selector mutation
  const testSelector = useMutation({
    mutationFn: async (selector: string) => {
      const response = await fetch('/api/selector-studio/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selector })
      });
      if (!response.ok) throw new Error('Failed to test selector');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Selector testet",
        description: `Score: ${data.score}/100`
      });
    }
  });

  // WebSocket for real-time picker
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:5000/ws/selector-studio`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'element-selected') {
        setSelectedSelector({
          id: Date.now().toString(),
          selector: data.selector,
          type: data.type,
          url: data.url,
          status: 'active',
          createdAt: new Date()
        });
        setIsPickerActive(false);
      }
      
      if (data.type === 'selector-healed') {
        toast({
          title: "Selector reparert",
          description: `Ny selector: ${data.newSelector}`
        });
        queryClient.invalidateQueries({ queryKey: ['/api/selector-studio/selectors'] });
      }
    };

    return () => ws.close();
  }, []);

  const togglePicker = () => {
    setIsPickerActive(!isPickerActive);
    if (!isPickerActive) {
      // Send message to browser to activate picker
      fetch('/api/browser-engine/picker/activate', {
        method: 'POST'
      });
    } else {
      // Deactivate picker
      fetch('/api/browser-engine/picker/deactivate', {
        method: 'POST'
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Selector Studio V2</h1>
            <p className="text-muted-foreground">Intelligent selector-generering og -vedlikehold</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isPickerActive ? "default" : "outline"}
              size="sm"
              onClick={togglePicker}
              data-testid="button-toggle-picker"
            >
              <MousePointer className="w-4 h-4 mr-2" />
              {isPickerActive ? "Picker Aktiv" : "Start Picker"}
            </Button>
            <Button variant="outline" size="sm" data-testid="button-history">
              <History className="w-4 h-4 mr-2" />
              Historikk
            </Button>
            <Button variant="outline" size="sm" data-testid="button-settings">
              <Settings className="w-4 h-4 mr-2" />
              Innstillinger
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="builder" data-testid="tab-builder">
              <Target className="w-4 h-4 mr-2" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="analyzer" data-testid="tab-analyzer">
              <Shield className="w-4 h-4 mr-2" />
              Analyzer
            </TabsTrigger>
            <TabsTrigger value="profiler" data-testid="tab-profiler">
              <Settings className="w-4 h-4 mr-2" />
              Profiler
            </TabsTrigger>
            <TabsTrigger value="healer" data-testid="tab-healer">
              <Sparkles className="w-4 h-4 mr-2" />
              Healer
            </TabsTrigger>
            <TabsTrigger value="export" data-testid="tab-export">
              <Download className="w-4 h-4 mr-2" />
              Eksport
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="h-full mt-4">
            <SelectorBuilder 
              selectedSelector={selectedSelector}
              onSelectorCreate={(selector) => {
                setSelectedSelector(selector);
                testSelector.mutate(selector.selector);
              }}
              isPickerActive={isPickerActive}
            />
          </TabsContent>

          <TabsContent value="analyzer" className="h-full mt-4">
            <StabilityAnalyzer 
              selectors={selectors}
              onAnalyze={(selector) => testSelector.mutate(selector)}
            />
          </TabsContent>

          <TabsContent value="profiler" className="h-full mt-4">
            <DomainProfiler 
              profiles={domainProfiles}
              selectors={selectors}
            />
          </TabsContent>

          <TabsContent value="healer" className="h-full mt-4">
            <SelectorHealer 
              brokenSelectors={selectors.filter((s: Selector) => s.status === 'broken')}
            />
          </TabsContent>

          <TabsContent value="export" className="h-full mt-4">
            <ExportPanel 
              selectors={selectors}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Picker Overlay Indicator */}
      {isPickerActive && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-sm font-medium">Klikk på et element for å velge</span>
        </div>
      )}
    </div>
  );
}