import { useState, useEffect } from 'react';
import {
  Puzzle,
  Download,
  Trash2,
  Settings,
  ToggleLeft,
  ToggleRight,
  Shield,
  Globe,
  Lock,
  AlertTriangle,
  CheckCircle,
  Star,
  Search,
  Filter,
  Code,
  Package,
  Wrench,
  RefreshCw,
  ExternalLink,
  Info,
  FileCode,
  Bug,
  Cpu,
  Activity,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Permission {
  id: string;
  name: string;
  description: string;
  granted: boolean;
  required: boolean;
}

interface Extension {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  icon: string;
  enabled: boolean;
  permissions: Permission[];
  category: 'productivity' | 'developer' | 'privacy' | 'social' | 'shopping' | 'other';
  rating: number;
  downloads: number;
  size: string;
  lastUpdated: Date;
  homepage?: string;
  installed: boolean;
  pinned: boolean;
  hasUpdate?: boolean;
  manifestVersion: number;
  backgroundColor?: string;
}

interface ExtensionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Extensions({ isOpen, onClose }: ExtensionsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('installed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState<Extension | null>(null);
  const [isDevMode, setIsDevMode] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [extensionCode, setExtensionCode] = useState('');
  
  const [installedExtensions, setInstalledExtensions] = useState<Extension[]>([
    {
      id: '1',
      name: 'AdBlock Plus',
      version: '3.15.0',
      author: 'Eyeo GmbH',
      description: 'Blokkerer irriterende annonser og sporere på nettet',
      icon: '🛡️',
      enabled: true,
      permissions: [
        { id: 'tabs', name: 'Faner', description: 'Tilgang til faneinformasjon', granted: true, required: true },
        { id: 'webRequest', name: 'Nettforespørsler', description: 'Blokkere og modifisere forespørsler', granted: true, required: true }
      ],
      category: 'privacy',
      rating: 4.5,
      downloads: 10000000,
      size: '3.2 MB',
      lastUpdated: new Date('2024-03-15'),
      installed: true,
      pinned: true,
      manifestVersion: 3,
      backgroundColor: '#C70D2C'
    },
    {
      id: '2',
      name: 'React Developer Tools',
      version: '4.28.0',
      author: 'Meta',
      description: 'Utviklerverktøy for React-applikasjoner',
      icon: '⚛️',
      enabled: true,
      permissions: [
        { id: 'devtools', name: 'Utviklerverktøy', description: 'Tilgang til DevTools API', granted: true, required: true },
        { id: 'tabs', name: 'Faner', description: 'Inspeksjon av React-komponenter', granted: true, required: false }
      ],
      category: 'developer',
      rating: 4.8,
      downloads: 3000000,
      size: '1.5 MB',
      lastUpdated: new Date('2024-03-20'),
      installed: true,
      pinned: false,
      hasUpdate: true,
      manifestVersion: 3,
      backgroundColor: '#61DAFB'
    },
    {
      id: '3',
      name: 'Grammarly',
      version: '14.1176.0',
      author: 'Grammarly, Inc.',
      description: 'Skriveassistent for grammatikk og stavekontroll',
      icon: '✏️',
      enabled: false,
      permissions: [
        { id: 'tabs', name: 'Faner', description: 'Tilgang til tekstfelt', granted: true, required: true },
        { id: 'storage', name: 'Lagring', description: 'Lagre brukerpreferanser', granted: true, required: false }
      ],
      category: 'productivity',
      rating: 4.6,
      downloads: 30000000,
      size: '24.8 MB',
      lastUpdated: new Date('2024-03-10'),
      installed: true,
      pinned: false,
      manifestVersion: 3,
      backgroundColor: '#15C39A'
    }
  ]);

  const [storeExtensions] = useState<Extension[]>([
    {
      id: '4',
      name: 'LastPass',
      version: '4.123.0',
      author: 'LastPass',
      description: 'Passordbehandler for sikker lagring av pålogginger',
      icon: '🔑',
      enabled: false,
      permissions: [
        { id: 'tabs', name: 'Faner', description: 'Auto-fylling av passord', granted: false, required: true },
        { id: 'storage', name: 'Lagring', description: 'Lagre krypterte passord', granted: false, required: true }
      ],
      category: 'privacy',
      rating: 4.4,
      downloads: 20000000,
      size: '15.3 MB',
      lastUpdated: new Date('2024-03-18'),
      installed: false,
      pinned: false,
      manifestVersion: 3,
      backgroundColor: '#D32D27'
    },
    {
      id: '5',
      name: 'Honey',
      version: '14.8.1',
      author: 'PayPal',
      description: 'Automatisk finn og bruk rabattkoder når du handler',
      icon: '🍯',
      enabled: false,
      permissions: [
        { id: 'tabs', name: 'Faner', description: 'Finne handlenettsteder', granted: false, required: true },
        { id: 'cookies', name: 'Informasjonskapsler', description: 'Spore handlekurv', granted: false, required: false }
      ],
      category: 'shopping',
      rating: 4.7,
      downloads: 17000000,
      size: '8.9 MB',
      lastUpdated: new Date('2024-03-22'),
      installed: false,
      pinned: false,
      manifestVersion: 3,
      backgroundColor: '#FF6D00'
    },
    {
      id: '6',
      name: 'Dark Reader',
      version: '4.9.80',
      author: 'Dark Reader Ltd',
      description: 'Mørk modus for alle nettsteder',
      icon: '🌙',
      enabled: false,
      permissions: [
        { id: 'tabs', name: 'Faner', description: 'Bruke mørkt tema på sider', granted: false, required: true },
        { id: 'storage', name: 'Lagring', description: 'Lagre temainnstillinger', granted: false, required: false }
      ],
      category: 'productivity',
      rating: 4.9,
      downloads: 5000000,
      size: '2.7 MB',
      lastUpdated: new Date('2024-03-25'),
      installed: false,
      pinned: false,
      manifestVersion: 3,
      backgroundColor: '#141E24'
    }
  ]);

  const handleInstallExtension = (extension: Extension) => {
    setSelectedExtension(extension);
    setShowPermissionDialog(true);
  };

  const confirmInstallExtension = () => {
    if (selectedExtension) {
      setInstalledExtensions(prev => [...prev, { ...selectedExtension, installed: true, enabled: true }]);
      toast({
        title: 'Utvidelse installert',
        description: `${selectedExtension.name} er installert og aktivert`,
      });
      setShowPermissionDialog(false);
      setSelectedExtension(null);
    }
  };

  const handleUninstallExtension = (extension: Extension) => {
    setInstalledExtensions(prev => prev.filter(e => e.id !== extension.id));
    toast({
      title: 'Utvidelse avinstallert',
      description: `${extension.name} er fjernet`,
    });
  };

  const handleToggleExtension = (extension: Extension) => {
    setInstalledExtensions(prev => prev.map(e => 
      e.id === extension.id ? { ...e, enabled: !e.enabled } : e
    ));
    toast({
      title: extension.enabled ? 'Utvidelse deaktivert' : 'Utvidelse aktivert',
      description: `${extension.name} er ${extension.enabled ? 'deaktivert' : 'aktivert'}`,
    });
  };

  const handlePinExtension = (extension: Extension) => {
    setInstalledExtensions(prev => prev.map(e => 
      e.id === extension.id ? { ...e, pinned: !e.pinned } : e
    ));
    toast({
      title: extension.pinned ? 'Fjernet fra verktøylinjen' : 'Festet til verktøylinjen',
      description: `${extension.name} er ${extension.pinned ? 'fjernet fra' : 'festet til'} verktøylinjen`,
    });
  };

  const handleUpdateExtension = (extension: Extension) => {
    setInstalledExtensions(prev => prev.map(e => 
      e.id === extension.id ? { ...e, hasUpdate: false, version: '5.0.0' } : e
    ));
    toast({
      title: 'Utvidelse oppdatert',
      description: `${extension.name} er oppdatert til nyeste versjon`,
    });
  };

  const handleUploadExtension = () => {
    if (!extensionCode.trim()) {
      toast({
        title: 'Feil',
        description: 'Vennligst lim inn utvidelseskoden',
        variant: 'destructive'
      });
      return;
    }

    const newExtension: Extension = {
      id: Date.now().toString(),
      name: 'Egendefinert utvidelse',
      version: '1.0.0',
      author: 'Lokal utvikler',
      description: 'Egenutviklet utvidelse lastet opp lokalt',
      icon: '📦',
      enabled: false,
      permissions: [],
      category: 'other',
      rating: 0,
      downloads: 0,
      size: '0.1 MB',
      lastUpdated: new Date(),
      installed: true,
      pinned: false,
      manifestVersion: 3
    };

    setInstalledExtensions(prev => [...prev, newExtension]);
    setShowUploadDialog(false);
    setExtensionCode('');
    toast({
      title: 'Utvidelse lastet opp',
      description: 'Din egendefinerte utvidelse er installert',
    });
  };

  const filteredExtensions = (extensions: Extension[]) => {
    return extensions.filter(ext => {
      const matchesSearch = ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ext.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || ext.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'productivity': return <Cpu className="w-4 h-4" />;
      case 'developer': return <Code className="w-4 h-4" />;
      case 'privacy': return <Shield className="w-4 h-4" />;
      case 'social': return <Globe className="w-4 h-4" />;
      case 'shopping': return <Package className="w-4 h-4" />;
      default: return <Puzzle className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Puzzle className="w-5 h-5" />
            Utvidelser
          </DialogTitle>
          <DialogDescription>
            Administrer og installer nettleserutvidelser
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk etter utvidelser..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle kategorier</SelectItem>
              <SelectItem value="productivity">Produktivitet</SelectItem>
              <SelectItem value="developer">Utvikler</SelectItem>
              <SelectItem value="privacy">Personvern</SelectItem>
              <SelectItem value="social">Sosial</SelectItem>
              <SelectItem value="shopping">Shopping</SelectItem>
              <SelectItem value="other">Annet</SelectItem>
            </SelectContent>
          </Select>

          {activeTab === 'installed' && (
            <div className="flex items-center gap-2">
              <Switch
                id="dev-mode"
                checked={isDevMode}
                onCheckedChange={setIsDevMode}
              />
              <Label htmlFor="dev-mode" className="text-sm">
                Utviklermodus
              </Label>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="installed">
              <Download className="w-4 h-4 mr-2" />
              Installerte ({installedExtensions.length})
            </TabsTrigger>
            <TabsTrigger value="store">
              <Package className="w-4 h-4 mr-2" />
              Utvidelsesbutikk
            </TabsTrigger>
            <TabsTrigger value="developer">
              <Wrench className="w-4 h-4 mr-2" />
              Utviklerverktøy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="installed" className="space-y-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-4">
                {filteredExtensions(installedExtensions).map((extension) => (
                  <Card key={extension.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ backgroundColor: extension.backgroundColor || '#f0f0f0' }}
                        >
                          {extension.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{extension.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              v{extension.version}
                            </Badge>
                            {extension.hasUpdate && (
                              <Badge variant="secondary" className="text-xs">
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Oppdatering tilgjengelig
                              </Badge>
                            )}
                            {extension.pinned && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Festet
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {extension.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Av {extension.author}</span>
                            <span>{extension.size}</span>
                            <div className="flex items-center gap-1">
                              {getCategoryIcon(extension.category)}
                              <span className="capitalize">{extension.category}</span>
                            </div>
                          </div>

                          {isDevMode && (
                            <Accordion type="single" collapsible className="mt-3">
                              <AccordionItem value="permissions" className="border-none">
                                <AccordionTrigger className="text-sm py-2">
                                  <div className="flex items-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    Tillatelser ({extension.permissions.length})
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-2 pt-2">
                                    {extension.permissions.map((perm) => (
                                      <div key={perm.id} className="flex items-center justify-between text-xs">
                                        <div>
                                          <span className="font-medium">{perm.name}</span>
                                          <span className="text-muted-foreground ml-2">
                                            {perm.description}
                                          </span>
                                        </div>
                                        {perm.granted ? (
                                          <CheckCircle className="w-4 h-4 text-green-500" />
                                        ) : (
                                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={extension.enabled}
                          onCheckedChange={() => handleToggleExtension(extension)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {extension.hasUpdate && (
                              <DropdownMenuItem onClick={() => handleUpdateExtension(extension)}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Oppdater
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handlePinExtension(extension)}>
                              <Star className="w-4 h-4 mr-2" />
                              {extension.pinned ? 'Fjern fra verktøylinje' : 'Fest til verktøylinje'}
                            </DropdownMenuItem>
                            {extension.homepage && (
                              <DropdownMenuItem>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Besøk nettsted
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Info className="w-4 h-4 mr-2" />
                              Detaljer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleUninstallExtension(extension)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Avinstaller
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="store" className="space-y-4">
            <ScrollArea className="h-[500px]">
              <div className="grid grid-cols-2 gap-4 pr-4">
                {filteredExtensions(storeExtensions).map((extension) => (
                  <Card key={extension.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
                        style={{ backgroundColor: extension.backgroundColor || '#f0f0f0' }}
                      >
                        {extension.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{extension.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {extension.description}
                        </p>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{extension.rating}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {(extension.downloads / 1000000).toFixed(1)}M nedlastinger
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleInstallExtension(extension)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Installer
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="developer" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Utviklerverktøy</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-base mb-2">Last opp upakket utvidelse</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Last opp din egen utvidelse for testing og utvikling
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowUploadDialog(true)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Last opp utvidelse
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <Label className="text-base mb-2">Feilsøking</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Aktiver utviklermodus for å se avanserte alternativer
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Bug className="w-4 h-4 mr-2" />
                      Inspiser bakgrunnssider
                    </Button>
                    <Button variant="outline" size="sm">
                      <Activity className="w-4 h-4 mr-2" />
                      Ytelsesmonitor
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileCode className="w-4 h-4 mr-2" />
                      Konsoll
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Label className="text-base mb-2">Manifest versjon</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    MadEasy Browser støtter Manifest V3 for moderne utvidelser
                  </p>
                  <Badge variant="secondary">Manifest V3 støttet</Badge>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Permission Dialog */}
        <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Installer {selectedExtension?.name}</DialogTitle>
              <DialogDescription>
                Denne utvidelsen krever følgende tillatelser:
              </DialogDescription>
            </DialogHeader>
            
            {selectedExtension && (
              <div className="space-y-3 my-4">
                {selectedExtension.permissions.map((perm) => (
                  <div key={perm.id} className="flex items-start gap-2">
                    {perm.required ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                    ) : (
                      <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{perm.name}</p>
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
                Avbryt
              </Button>
              <Button onClick={confirmInstallExtension}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Installer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Upload Extension Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Last opp upakket utvidelse</DialogTitle>
              <DialogDescription>
                Lim inn manifest.json-koden for din utvidelse
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 my-4">
              <Textarea
                placeholder='{\n  "manifest_version": 3,\n  "name": "Min utvidelse",\n  "version": "1.0.0",\n  ...\n}'
                value={extensionCode}
                onChange={(e) => setExtensionCode(e.target.value)}
                className="font-mono text-sm min-h-[200px]"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Avbryt
              </Button>
              <Button onClick={handleUploadExtension}>
                <Upload className="w-4 h-4 mr-2" />
                Last opp
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Lukk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}