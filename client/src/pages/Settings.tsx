import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { 
  ArrowLeft,
  Globe, 
  Shield, 
  Palette, 
  Download,
  History,
  Trash2,
  Moon,
  Sun,
  Monitor,
  AlertTriangle,
  Info
} from 'lucide-react';

interface BrowserSettings {
  general: {
    homepage: string;
    searchEngine: string;
    defaultDownloadPath: string;
    askWhereToSaveFiles: boolean;
    startupBehavior: string;
  };
  privacy: {
    doNotTrack: boolean;
    blockThirdPartyCookies: boolean;
    clearCookiesOnExit: boolean;
    sendUsageStatistics: boolean;
    safeBrowsing: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    showBookmarksBar: boolean;
    showHomeButton: boolean;
    compactMode: boolean;
  };
}

export default function Settings() {
  const { toast } = useToast();
  
  // Default settings
  const [settings, setSettings] = useState<BrowserSettings>({
    general: {
      homepage: 'https://www.google.com',
      searchEngine: 'google',
      defaultDownloadPath: '~/Downloads',
      askWhereToSaveFiles: false,
      startupBehavior: 'homepage',
    },
    privacy: {
      doNotTrack: true,
      blockThirdPartyCookies: true,
      clearCookiesOnExit: false,
      sendUsageStatistics: false,
      safeBrowsing: true,
    },
    appearance: {
      theme: 'system',
      fontSize: 'medium',
      showBookmarksBar: true,
      showHomeButton: true,
      compactMode: false,
    },
  });

  // Clear browsing data mutation
  const clearDataMutation = useMutation({
    mutationFn: async (dataTypes: string[]) => {
      const promises = [];
      
      if (dataTypes.includes('history')) {
        promises.push(apiRequest('/api/browser-history', 'DELETE'));
      }
      if (dataTypes.includes('downloads')) {
        const downloads = await queryClient.fetchQuery<any[]>({ 
          queryKey: ['/api/downloads'] 
        });
        if (downloads) {
          for (const download of downloads) {
            promises.push(apiRequest(`/api/downloads/${download.id}`, 'DELETE'));
          }
        }
      }
      if (dataTypes.includes('bookmarks')) {
        const bookmarks = await queryClient.fetchQuery<any[]>({ 
          queryKey: ['/api/bookmarks'] 
        });
        if (bookmarks) {
          for (const bookmark of bookmarks) {
            promises.push(apiRequest(`/api/bookmarks/${bookmark.id}`, 'DELETE'));
          }
        }
      }
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: 'Data slettet',
        description: 'De valgte dataene ble slettet',
      });
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke slette data',
        variant: 'destructive',
      });
    },
  });

  const handleSaveSettings = () => {
    // I en ekte app ville dette lagres til backend/localStorage
    localStorage.setItem('browserSettings', JSON.stringify(settings));
    
    toast({
      title: 'Innstillinger lagret',
      description: 'Endringene dine har blitt lagret',
    });
  };

  const handleClearData = () => {
    const selectedData: string[] = [];
    const checkboxes = document.querySelectorAll<HTMLInputElement>('[data-clear-type]:checked');
    checkboxes.forEach(cb => {
      const type = cb.getAttribute('data-clear-type');
      if (type) selectedData.push(type);
    });
    
    if (selectedData.length > 0) {
      clearDataMutation.mutate(selectedData);
    } else {
      toast({
        title: 'Ingen data valgt',
        description: 'Velg minst én datatype å slette',
        variant: 'destructive',
      });
    }
  };

  const getThemeIcon = () => {
    switch (settings.appearance.theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Nettleserinnstillinger</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            <Globe className="w-4 h-4 mr-2" />
            Generelt
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="w-4 h-4 mr-2" />
            Personvern
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="w-4 h-4 mr-2" />
            Utseende
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Download className="w-4 h-4 mr-2" />
            Avansert
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Generelle innstillinger</CardTitle>
              <CardDescription>
                Konfigurer grunnleggende nettleserinnstillinger
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Homepage */}
              <div className="space-y-2">
                <Label htmlFor="homepage">Hjemmeside</Label>
                <Input
                  id="homepage"
                  value={settings.general.homepage}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, homepage: e.target.value }
                  })}
                  placeholder="https://example.com"
                />
              </div>

              {/* Search Engine */}
              <div className="space-y-2">
                <Label htmlFor="search-engine">Standard søkemotor</Label>
                <Select
                  value={settings.general.searchEngine}
                  onValueChange={(value) => setSettings({
                    ...settings,
                    general: { ...settings.general, searchEngine: value }
                  })}
                >
                  <SelectTrigger id="search-engine">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="bing">Bing</SelectItem>
                    <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
                    <SelectItem value="yahoo">Yahoo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Startup Behavior */}
              <div className="space-y-2">
                <Label htmlFor="startup">Ved oppstart</Label>
                <Select
                  value={settings.general.startupBehavior}
                  onValueChange={(value) => setSettings({
                    ...settings,
                    general: { ...settings.general, startupBehavior: value }
                  })}
                >
                  <SelectTrigger id="startup">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homepage">Åpne hjemmeside</SelectItem>
                    <SelectItem value="newtab">Åpne ny fane</SelectItem>
                    <SelectItem value="restore">Gjenopprett forrige økt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Downloads */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Nedlastninger</h3>
                <div className="space-y-2">
                  <Label htmlFor="download-path">Standard nedlastingsmappe</Label>
                  <Input
                    id="download-path"
                    value={settings.general.defaultDownloadPath}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, defaultDownloadPath: e.target.value }
                    })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ask-where-save"
                    checked={settings.general.askWhereToSaveFiles}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      general: { ...settings.general, askWhereToSaveFiles: checked }
                    })}
                  />
                  <Label htmlFor="ask-where-save">
                    Spør hvor hver fil skal lagres
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Personvern og sikkerhet</CardTitle>
              <CardDescription>
                Administrer personvern- og sikkerhetsinnstillinger
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ikke spor</Label>
                    <p className="text-sm text-muted-foreground">
                      Be nettsteder om ikke å spore deg
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.doNotTrack}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, doNotTrack: checked }
                    })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Blokker tredjeparts cookies</Label>
                    <p className="text-sm text-muted-foreground">
                      Hindre tredjeparts cookies fra å spore deg
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.blockThirdPartyCookies}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, blockThirdPartyCookies: checked }
                    })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Slett cookies ved avslutning</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatisk slette alle cookies når nettleseren lukkes
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.clearCookiesOnExit}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, clearCookiesOnExit: checked }
                    })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sikker surfing</Label>
                    <p className="text-sm text-muted-foreground">
                      Advar deg om farlige nettsteder
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.safeBrowsing}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, safeBrowsing: checked }
                    })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Send bruksstatistikk</Label>
                    <p className="text-sm text-muted-foreground">
                      Hjelp oss forbedre nettleseren
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.sendUsageStatistics}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, sendUsageStatistics: checked }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Utseende</CardTitle>
              <CardDescription>
                Tilpass hvordan nettleseren ser ut
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme */}
              <div className="space-y-2">
                <Label>Tema</Label>
                <Select
                  value={settings.appearance.theme}
                  onValueChange={(value: 'light' | 'dark' | 'system') => setSettings({
                    ...settings,
                    appearance: { ...settings.appearance, theme: value }
                  })}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      {getThemeIcon()}
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Lyst
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Mørkt
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <Label>Skriftstørrelse</Label>
                <Select
                  value={settings.appearance.fontSize}
                  onValueChange={(value: 'small' | 'medium' | 'large') => setSettings({
                    ...settings,
                    appearance: { ...settings.appearance, fontSize: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Liten</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Stor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Toolbar Options */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Verktøylinje</h3>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-bookmarks"
                    checked={settings.appearance.showBookmarksBar}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      appearance: { ...settings.appearance, showBookmarksBar: checked }
                    })}
                  />
                  <Label htmlFor="show-bookmarks">
                    Vis bokmerkelinje
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-home"
                    checked={settings.appearance.showHomeButton}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      appearance: { ...settings.appearance, showHomeButton: checked }
                    })}
                  />
                  <Label htmlFor="show-home">
                    Vis hjem-knapp
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="compact-mode"
                    checked={settings.appearance.compactMode}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      appearance: { ...settings.appearance, compactMode: checked }
                    })}
                  />
                  <Label htmlFor="compact-mode">
                    Kompakt modus (mindre verktøylinje)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Avanserte innstillinger</CardTitle>
              <CardDescription>
                Slett nettleserdata og tilbakestill innstillinger
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Clear Browsing Data */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Slett nettleserdata
                </h3>
                
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="clear-history"
                      data-clear-type="history"
                      className="rounded"
                    />
                    <Label htmlFor="clear-history">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Nettleserhistorikk
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="clear-downloads"
                      data-clear-type="downloads"
                      className="rounded"
                    />
                    <Label htmlFor="clear-downloads">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Nedlastingshistorikk
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="clear-bookmarks"
                      data-clear-type="bookmarks"
                      className="rounded"
                    />
                    <Label htmlFor="clear-bookmarks">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Bokmerker
                      </div>
                    </Label>
                  </div>

                  <Button
                    variant="destructive"
                    onClick={handleClearData}
                    disabled={clearDataMutation.isPending}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Slett valgte data
                  </Button>
                </div>

                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-900 dark:text-yellow-100">
                      Advarsel
                    </p>
                    <p className="text-yellow-800 dark:text-yellow-200 mt-1">
                      Sletting av nettleserdata er permanent og kan ikke angres.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Reset Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Tilbakestill innstillinger</h3>
                <p className="text-sm text-muted-foreground">
                  Tilbakestill alle innstillinger til standardverdiene
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSettings({
                      general: {
                        homepage: 'https://www.google.com',
                        searchEngine: 'google',
                        defaultDownloadPath: '~/Downloads',
                        askWhereToSaveFiles: false,
                        startupBehavior: 'homepage',
                      },
                      privacy: {
                        doNotTrack: true,
                        blockThirdPartyCookies: true,
                        clearCookiesOnExit: false,
                        sendUsageStatistics: false,
                        safeBrowsing: true,
                      },
                      appearance: {
                        theme: 'system',
                        fontSize: 'medium',
                        showBookmarksBar: true,
                        showHomeButton: true,
                        compactMode: false,
                      },
                    });
                    toast({
                      title: 'Innstillinger tilbakestilt',
                      description: 'Alle innstillinger er tilbake til standard',
                    });
                  }}
                >
                  Tilbakestill til standard
                </Button>
              </div>

              <Separator />

              {/* About */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Om MadEasy Browser
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Versjon: 2.0.0</p>
                  <p>Bygget med React og TypeScript</p>
                  <p>© 2025 MadEasy Browser</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-4 pt-4">
        <Link href="/">
          <Button variant="outline">Avbryt</Button>
        </Link>
        <Button onClick={handleSaveSettings}>
          Lagre endringer
        </Button>
      </div>
    </div>
  );
}