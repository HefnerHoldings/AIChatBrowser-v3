import { useState, useEffect } from 'react';
import { 
  Shield, 
  Cookie, 
  Eye, 
  EyeOff, 
  Lock, 
  Trash2, 
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ToggleLeft,
  ToggleRight,
  Filter,
  Ban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: Date;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  size: number;
}

interface Tracker {
  domain: string;
  type: 'analytics' | 'advertising' | 'social' | 'other';
  blocked: boolean;
  requestsCount: number;
}

interface PrivacySettings {
  blockTrackers: boolean;
  blockThirdPartyCookies: boolean;
  blockAllCookies: boolean;
  sendDoNotTrack: boolean;
  blockFingerprinting: boolean;
  httpsOnly: boolean;
  clearOnExit: boolean;
}

interface PrivacyCenterProps {
  isOpen: boolean;
  onClose: () => void;
  currentDomain?: string;
}

export function PrivacyCenter({ isOpen, onClose, currentDomain }: PrivacyCenterProps) {
  const { toast } = useToast();
  const [cookies, setCookies] = useState<Cookie[]>([]);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    blockTrackers: true,
    blockThirdPartyCookies: true,
    blockAllCookies: false,
    sendDoNotTrack: true,
    blockFingerprinting: true,
    httpsOnly: true,
    clearOnExit: false
  });
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [privacyScore, setPrivacyScore] = useState(85);

  // Simuler henting av cookies
  useEffect(() => {
    if (isOpen) {
      // Simuler noen cookies
      setCookies([
        {
          name: 'session_id',
          value: 'abc123...',
          domain: currentDomain || 'example.com',
          path: '/',
          expires: new Date(Date.now() + 86400000),
          secure: true,
          httpOnly: true,
          sameSite: 'Lax',
          size: 128
        },
        {
          name: 'analytics_id',
          value: 'ga_xyz...',
          domain: '.google-analytics.com',
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'None',
          size: 64
        },
        {
          name: 'prefs',
          value: 'theme=dark...',
          domain: currentDomain || 'example.com',
          path: '/',
          secure: false,
          httpOnly: false,
          sameSite: 'Lax',
          size: 32
        }
      ]);

      // Simuler noen trackere
      setTrackers([
        {
          domain: 'google-analytics.com',
          type: 'analytics',
          blocked: privacySettings.blockTrackers,
          requestsCount: 12
        },
        {
          domain: 'facebook.com',
          type: 'social',
          blocked: privacySettings.blockTrackers,
          requestsCount: 5
        },
        {
          domain: 'doubleclick.net',
          type: 'advertising',
          blocked: privacySettings.blockTrackers,
          requestsCount: 8
        }
      ]);

      // Beregn personvernscore
      calculatePrivacyScore();
    }
  }, [isOpen, currentDomain, privacySettings]);

  const calculatePrivacyScore = () => {
    let score = 50; // Grunnpoeng
    if (privacySettings.blockTrackers) score += 15;
    if (privacySettings.blockThirdPartyCookies) score += 10;
    if (privacySettings.sendDoNotTrack) score += 5;
    if (privacySettings.blockFingerprinting) score += 10;
    if (privacySettings.httpsOnly) score += 10;
    setPrivacyScore(Math.min(100, score));
  };

  const handleSettingChange = (key: keyof PrivacySettings, value: boolean) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    toast({
      title: 'Innstilling oppdatert',
      description: `${key} er nå ${value ? 'aktivert' : 'deaktivert'}`,
    });
  };

  const deleteCookie = (cookie: Cookie) => {
    setCookies(prev => prev.filter(c => c.name !== cookie.name || c.domain !== cookie.domain));
    toast({
      title: 'Informasjonskapsel slettet',
      description: `${cookie.name} fra ${cookie.domain} er fjernet`,
    });
  };

  const deleteAllCookies = (domain?: string) => {
    if (domain && domain !== 'all') {
      setCookies(prev => prev.filter(c => c.domain !== domain));
      toast({
        title: 'Informasjonskapsler slettet',
        description: `Alle informasjonskapsler fra ${domain} er fjernet`,
      });
    } else {
      setCookies([]);
      toast({
        title: 'Alle informasjonskapsler slettet',
        description: 'Alle informasjonskapsler er fjernet',
      });
    }
  };

  const toggleTrackerBlock = (tracker: Tracker) => {
    setTrackers(prev => prev.map(t => 
      t.domain === tracker.domain 
        ? { ...t, blocked: !t.blocked }
        : t
    ));
    
    toast({
      title: tracker.blocked ? 'Sporer tillatt' : 'Sporer blokkert',
      description: `${tracker.domain} er nå ${tracker.blocked ? 'tillatt' : 'blokkert'}`,
    });
  };

  const getTrackerIcon = (type: string) => {
    switch (type) {
      case 'analytics':
        return <Globe className="w-4 h-4 text-blue-500" />;
      case 'advertising':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'social':
        return <Eye className="w-4 h-4 text-purple-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPrivacyScoreColor = () => {
    if (privacyScore >= 80) return 'text-green-500';
    if (privacyScore >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getUniqueDomains = () => {
    const domains = new Set(cookies.map(c => c.domain));
    return ['all', ...Array.from(domains)];
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Personvernsenter
          </DialogTitle>
          <DialogDescription>
            Administrer informasjonskapsler, sporere og personverninnstillinger
          </DialogDescription>
        </DialogHeader>

        {/* Personvernscore */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Personvernscore</span>
            <span className={`text-2xl font-bold ${getPrivacyScoreColor()}`}>
              {privacyScore}%
            </span>
          </div>
          <Progress value={privacyScore} className="h-2 mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{trackers.filter(t => t.blocked).length} sporere blokkert</span>
            <span>{cookies.length} informasjonskapsler</span>
          </div>
        </Card>

        <Tabs defaultValue="cookies" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cookies">
              <Cookie className="w-4 h-4 mr-2" />
              Informasjonskapsler
            </TabsTrigger>
            <TabsTrigger value="trackers">
              <Eye className="w-4 h-4 mr-2" />
              Sporere
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Lock className="w-4 h-4 mr-2" />
              Innstillinger
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cookies" className="space-y-4">
            <div className="flex items-center justify-between">
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Velg domene" />
                </SelectTrigger>
                <SelectContent>
                  {getUniqueDomains().map(domain => (
                    <SelectItem key={domain} value={domain}>
                      {domain === 'all' ? 'Alle domener' : domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteAllCookies(selectedDomain)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Slett {selectedDomain === 'all' ? 'alle' : 'valgte'}
              </Button>
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {cookies
                  .filter(c => selectedDomain === 'all' || c.domain === selectedDomain)
                  .map((cookie, idx) => (
                    <Card key={idx} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Cookie className="w-4 h-4" />
                            <span className="font-medium">{cookie.name}</span>
                            {cookie.secure && (
                              <Badge variant="secondary" className="text-xs">
                                <Lock className="w-3 h-3 mr-1" />
                                Sikker
                              </Badge>
                            )}
                            {cookie.httpOnly && (
                              <Badge variant="secondary" className="text-xs">
                                HTTP-Only
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>Domene: {cookie.domain}</div>
                            <div>Sti: {cookie.path}</div>
                            <div>Størrelse: {cookie.size} bytes</div>
                            {cookie.expires && (
                              <div>Utløper: {cookie.expires.toLocaleString('nb')}</div>
                            )}
                            {cookie.sameSite && (
                              <div>SameSite: {cookie.sameSite}</div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteCookie(cookie)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="trackers" className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {trackers.filter(t => t.blocked).length} av {trackers.length} sporere blokkert
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTrackers(prev => prev.map(t => ({ ...t, blocked: true })));
                  toast({
                    title: 'Alle sporere blokkert',
                    description: 'Alle sporingsforespørsler vil bli blokkert',
                  });
                }}
              >
                <Ban className="w-4 h-4 mr-2" />
                Blokker alle
              </Button>
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {trackers.map((tracker, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTrackerIcon(tracker.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{tracker.domain}</span>
                            <Badge variant="outline" className="text-xs">
                              {tracker.type}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {tracker.requestsCount} forespørsler
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {tracker.blocked ? (
                          <Badge variant="destructive" className="text-xs">
                            <XCircle className="w-3 h-3 mr-1" />
                            Blokkert
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Tillatt
                          </Badge>
                        )}
                        <Switch
                          checked={tracker.blocked}
                          onCheckedChange={() => toggleTrackerBlock(tracker)}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="block-trackers">Blokker sporere</Label>
                      <p className="text-xs text-muted-foreground">
                        Blokkerer kjente sporingsdomener
                      </p>
                    </div>
                    <Switch
                      id="block-trackers"
                      checked={privacySettings.blockTrackers}
                      onCheckedChange={(checked) => handleSettingChange('blockTrackers', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="block-third-party">Blokker tredjeparts cookies</Label>
                      <p className="text-xs text-muted-foreground">
                        Blokkerer cookies fra andre domener
                      </p>
                    </div>
                    <Switch
                      id="block-third-party"
                      checked={privacySettings.blockThirdPartyCookies}
                      onCheckedChange={(checked) => handleSettingChange('blockThirdPartyCookies', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dnt">Send "Do Not Track"</Label>
                      <p className="text-xs text-muted-foreground">
                        Ber nettsteder om ikke å spore deg
                      </p>
                    </div>
                    <Switch
                      id="dnt"
                      checked={privacySettings.sendDoNotTrack}
                      onCheckedChange={(checked) => handleSettingChange('sendDoNotTrack', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="fingerprinting">Blokker fingerprinting</Label>
                      <p className="text-xs text-muted-foreground">
                        Forhindrer nettleseridentifisering
                      </p>
                    </div>
                    <Switch
                      id="fingerprinting"
                      checked={privacySettings.blockFingerprinting}
                      onCheckedChange={(checked) => handleSettingChange('blockFingerprinting', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="https-only">Kun HTTPS</Label>
                      <p className="text-xs text-muted-foreground">
                        Tvinger sikre tilkoblinger når mulig
                      </p>
                    </div>
                    <Switch
                      id="https-only"
                      checked={privacySettings.httpsOnly}
                      onCheckedChange={(checked) => handleSettingChange('httpsOnly', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="clear-on-exit">Tøm data ved avslutning</Label>
                      <p className="text-xs text-muted-foreground">
                        Sletter cookies og historikk når nettleseren lukkes
                      </p>
                    </div>
                    <Switch
                      id="clear-on-exit"
                      checked={privacySettings.clearOnExit}
                      onCheckedChange={(checked) => handleSettingChange('clearOnExit', checked)}
                    />
                  </div>
                </div>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Lukk
                </Button>
                <Button onClick={() => {
                  toast({
                    title: 'Innstillinger lagret',
                    description: 'Personverninnstillinger er oppdatert',
                  });
                  onClose();
                }}>
                  Lagre innstillinger
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}