import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Settings, 
  ChevronRight, 
  Layers, 
  Grid3x3,
  Columns,
  PanelLeft,
  PanelRight,
  Search,
  Code2,
  Bot,
  BarChart3,
  Globe,
  Shield,
  Package,
  Zap,
  Plus,
  Save,
  Upload,
  Download,
  Star,
  StarOff,
  Check,
  X
} from 'lucide-react';
import { useSidebarManager } from '@/contexts/SidebarManagerContext';
import { SidebarRegistry, SidebarType, SidebarPreset } from '@/lib/sidebar-registry';

interface SidebarSwitcherProps {
  side: 'left' | 'right';
  currentType: SidebarType;
}

export function SidebarSwitcher({ side, currentType }: SidebarSwitcherProps) {
  const { switchSidebar, mergeSidebars, applyPreset, saveSidebarLayout } = useSidebarManager();
  const [showLayoutDialog, setShowLayoutDialog] = useState(false);
  const [selectedSidebars, setSelectedSidebars] = useState<SidebarType[]>([currentType]);
  const [mergeMode, setMergeMode] = useState<'split' | 'tabs' | 'accordion'>('tabs');

  const sidebarTypes: { type: SidebarType; name: string; icon: React.ReactNode; description: string }[] = [
    { type: 'lead-scraping', name: 'Lead Scraping', icon: <Search className="h-4 w-4" />, description: 'Web scraping og lead generation' },
    { type: 'developer', name: 'Developer', icon: <Code2 className="h-4 w-4" />, description: 'Kode og utviklingsverktøy' },
    { type: 'ai-assistant', name: 'AI Assistant', icon: <Bot className="h-4 w-4" />, description: 'AI chat og automatisering' },
    { type: 'data-analytics', name: 'Data Analytics', icon: <BarChart3 className="h-4 w-4" />, description: 'Data analyse og visualisering' },
    { type: 'workflow', name: 'Workflow', icon: <Layers className="h-4 w-4" />, description: 'Visual workflow builder' },
    { type: 'browser-tools', name: 'Browser Tools', icon: <Globe className="h-4 w-4" />, description: 'Browser verktøy og historikk' },
    { type: 'security-privacy', name: 'Security', icon: <Shield className="h-4 w-4" />, description: 'Sikkerhet og personvern' },
    { type: 'integrations', name: 'Integrations', icon: <Package className="h-4 w-4" />, description: 'Eksterne tjenester' },
    { type: 'quick-actions', name: 'Quick Actions', icon: <Zap className="h-4 w-4" />, description: 'Hurtigtaster og makroer' },
  ];

  const presets: SidebarPreset[] = SidebarRegistry.getAllPresets();

  const handleQuickSwitch = (type: SidebarType) => {
    switchSidebar(side, type);
  };

  const handleMergeSidebars = () => {
    if (selectedSidebars.length > 1) {
      mergeSidebars(side, selectedSidebars, mergeMode);
      setShowLayoutDialog(false);
    }
  };

  const toggleSidebarSelection = (type: SidebarType) => {
    setSelectedSidebars(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="flex items-center gap-2">
      {/* Current sidebar indicator */}
      <div className="flex items-center gap-2 px-2 py-1 bg-accent rounded">
        {sidebarTypes.find(s => s.type === currentType)?.icon}
        <span className="text-sm font-medium">
          {sidebarTypes.find(s => s.type === currentType)?.name}
        </span>
      </div>

      {/* Quick switch dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" title="Bytt sidebar">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={side === 'left' ? 'start' : 'end'} className="w-64">
          <DropdownMenuLabel>{side === 'left' ? 'Venstre' : 'Høyre'} Sidebar</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Quick switch options */}
          {sidebarTypes.map(sidebar => (
            <DropdownMenuItem
              key={sidebar.type}
              onClick={() => handleQuickSwitch(sidebar.type)}
              className="flex items-center gap-2"
            >
              {sidebar.icon}
              <div className="flex-1">
                <div className="font-medium">{sidebar.name}</div>
                <div className="text-xs text-muted-foreground">{sidebar.description}</div>
              </div>
              {currentType === sidebar.type && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* Presets */}
          <DropdownMenuLabel>Forhåndsinnstillinger</DropdownMenuLabel>
          {presets.map(preset => (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="flex items-center gap-2"
            >
              {preset.icon}
              <div className="flex-1">
                <div className="font-medium">{preset.name}</div>
                <div className="text-xs text-muted-foreground">{preset.description}</div>
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* Advanced layout */}
          <DropdownMenuItem onClick={() => setShowLayoutDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Avansert layout...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Advanced layout dialog */}
      <Dialog open={showLayoutDialog} onOpenChange={setShowLayoutDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tilpass Sidebar Layout</DialogTitle>
            <DialogDescription>
              Velg flere sidebars for å slå sammen eller lag ditt eget oppsett
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="merge" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="merge">Slå sammen</TabsTrigger>
              <TabsTrigger value="custom">Tilpass</TabsTrigger>
              <TabsTrigger value="saved">Lagrede</TabsTrigger>
            </TabsList>
            
            <TabsContent value="merge" className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-3">Velg sidebars å slå sammen</h4>
                <div className="grid grid-cols-2 gap-2">
                  {sidebarTypes.map(sidebar => (
                    <Card
                      key={sidebar.type}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedSidebars.includes(sidebar.type) 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => toggleSidebarSelection(sidebar.type)}
                    >
                      <div className="flex items-center gap-2">
                        {sidebar.icon}
                        <span className="text-sm font-medium">{sidebar.name}</span>
                        {selectedSidebars.includes(sidebar.type) && (
                          <Check className="h-3 w-3 ml-auto" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3">Layout type</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={mergeMode === 'split' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMergeMode('split')}
                    className="flex items-center gap-2"
                  >
                    <Columns className="h-4 w-4" />
                    Split
                  </Button>
                  <Button
                    variant={mergeMode === 'tabs' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMergeMode('tabs')}
                    className="flex items-center gap-2"
                  >
                    <Grid3x3 className="h-4 w-4" />
                    Tabs
                  </Button>
                  <Button
                    variant={mergeMode === 'accordion' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMergeMode('accordion')}
                    className="flex items-center gap-2"
                  >
                    <Layers className="h-4 w-4" />
                    Accordion
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowLayoutDialog(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleMergeSidebars} disabled={selectedSidebars.length < 2}>
                  Slå sammen
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <Plus className="h-12 w-12 mx-auto mb-4" />
                <p>Drag & drop builder kommer snart</p>
                <p className="text-sm mt-2">Du vil kunne lage helt egne sidebar layouts</p>
              </div>
            </TabsContent>
            
            <TabsContent value="saved" className="space-y-4">
              <div className="space-y-2">
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      <span className="font-medium">Mitt oppsett 1</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => saveSidebarLayout('Mitt oppsett')} variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  Lagre nåværende
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}