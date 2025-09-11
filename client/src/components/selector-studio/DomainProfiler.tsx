import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Globe, 
  ShoppingCart, 
  Newspaper, 
  Building2,
  GraduationCap,
  Heart,
  Briefcase,
  Users,
  TrendingUp,
  Settings,
  Plus
} from "lucide-react";

interface DomainProfilerProps {
  profiles: any[];
  selectors: any[];
}

export default function DomainProfiler({ profiles, selectors }: DomainProfilerProps) {
  const [selectedProfile, setSelectedProfile] = useState<string>('ecommerce');
  const [customPatterns, setCustomPatterns] = useState<any[]>([]);
  const [newPattern, setNewPattern] = useState({ name: '', selector: '', description: '' });

  const domainProfiles = {
    ecommerce: {
      name: 'E-handel',
      icon: <ShoppingCart className="w-4 h-4" />,
      patterns: [
        { name: 'Produkttittel', selector: '[data-product-name], .product-title, h1.product-name', frequency: 95 },
        { name: 'Pris', selector: '[data-price], .price, .product-price', frequency: 92 },
        { name: 'Legg til handlevogn', selector: '[data-add-to-cart], .add-to-cart, button[name="add"]', frequency: 88 },
        { name: 'Produktbilde', selector: '[data-product-image], .product-image img', frequency: 90 },
        { name: 'Vurdering', selector: '[data-rating], .star-rating, .review-stars', frequency: 75 }
      ],
      statistics: {
        totalSelectors: 156,
        averageScore: 82,
        failureRate: 5,
        repairCount: 12
      }
    },
    news: {
      name: 'Nyheter',
      icon: <Newspaper className="w-4 h-4" />,
      patterns: [
        { name: 'Artikkelttittel', selector: 'h1.article-title, [data-article-title]', frequency: 98 },
        { name: 'Forfatter', selector: '.author, [data-author], .byline', frequency: 85 },
        { name: 'Publiseringsdato', selector: 'time, .publish-date, [data-date]', frequency: 90 },
        { name: 'Artikkelinnhold', selector: '.article-body, .content, main article', frequency: 95 },
        { name: 'Kommentarer', selector: '#comments, .comments-section', frequency: 70 }
      ],
      statistics: {
        totalSelectors: 89,
        averageScore: 78,
        failureRate: 8,
        repairCount: 7
      }
    },
    'social-media': {
      name: 'Sosiale Medier',
      icon: <Users className="w-4 h-4" />,
      patterns: [
        { name: 'Post', selector: '[data-post], .post, article.status', frequency: 96 },
        { name: 'Brukernavn', selector: '.username, [data-username], .author', frequency: 94 },
        { name: 'Like-knapp', selector: '[data-like], button.like, .heart-button', frequency: 92 },
        { name: 'Kommentar', selector: '.comment, [data-comment], .reply', frequency: 88 },
        { name: 'Del-knapp', selector: '[data-share], .share-button', frequency: 85 }
      ],
      statistics: {
        totalSelectors: 203,
        averageScore: 86,
        failureRate: 3,
        repairCount: 15
      }
    },
    banking: {
      name: 'Bank',
      icon: <Building2 className="w-4 h-4" />,
      patterns: [
        { name: 'Saldo', selector: '[data-balance], .account-balance', frequency: 99 },
        { name: 'Transaksjoner', selector: '.transactions, [data-transactions]', frequency: 95 },
        { name: 'Overfør', selector: '[data-transfer], button.transfer', frequency: 90 },
        { name: 'Kontonummer', selector: '.account-number, [data-account]', frequency: 88 },
        { name: 'Logg ut', selector: '[data-logout], .logout-button', frequency: 100 }
      ],
      statistics: {
        totalSelectors: 67,
        averageScore: 91,
        failureRate: 1,
        repairCount: 2
      }
    }
  };

  const currentProfile = domainProfiles[selectedProfile as keyof typeof domainProfiles];

  const addCustomPattern = () => {
    if (newPattern.name && newPattern.selector) {
      setCustomPatterns([...customPatterns, { ...newPattern, frequency: 0 }]);
      setNewPattern({ name: '', selector: '', description: '' });
    }
  };

  const getProfileIcon = (profile: string) => {
    switch (profile) {
      case 'ecommerce': return <ShoppingCart className="w-5 h-5" />;
      case 'news': return <Newspaper className="w-5 h-5" />;
      case 'social-media': return <Users className="w-5 h-5" />;
      case 'banking': return <Building2 className="w-5 h-5" />;
      case 'educational': return <GraduationCap className="w-5 h-5" />;
      case 'healthcare': return <Heart className="w-5 h-5" />;
      case 'saas': return <Briefcase className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {/* Profile Selection */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Domeneprofiler</CardTitle>
          <CardDescription>Velg eller opprett profil</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="profile-select">Aktiv Profil</Label>
              <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                <SelectTrigger id="profile-select" data-testid="select-profile">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(domainProfiles).map(([key, profile]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {profile.icon}
                        <span>{profile.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Profile Stats */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Profilstatistikk</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Totale Selectors</span>
                  <span className="font-medium">{currentProfile.statistics.totalSelectors}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gj.snitt Score</span>
                  <span className="font-medium">{currentProfile.statistics.averageScore}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Feilrate</span>
                  <span className="font-medium">{currentProfile.statistics.failureRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reparasjoner</span>
                  <span className="font-medium">{currentProfile.statistics.repairCount}</span>
                </div>
              </div>
            </div>

            {/* Profile Presets */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Hurtigvalg</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(domainProfiles).map(profile => (
                  <Button
                    key={profile}
                    variant={selectedProfile === profile ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedProfile(profile)}
                    className="justify-start"
                    data-testid={`preset-${profile}`}
                  >
                    {getProfileIcon(profile)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Learning Progress */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Læringsframgang</h4>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Mønstergjenkjenning</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Selector Optimalisering</span>
                    <span>65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Feilprediksjon</span>
                    <span>82%</span>
                  </div>
                  <Progress value={82} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pattern Library */}
      <Card className="col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mønstre for {currentProfile.name}</CardTitle>
              <CardDescription>Vanlige selector-mønstre for dette domenet</CardDescription>
            </div>
            <Button variant="outline" size="sm" data-testid="button-train">
              <TrendingUp className="w-4 h-4 mr-2" />
              Tren Modell
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Standard Patterns */}
            <div>
              <h4 className="font-medium mb-3">Standard Mønstre</h4>
              <div className="space-y-2">
                {currentProfile.patterns.map((pattern, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                    data-testid={`pattern-${index}`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{pattern.name}</div>
                      <code className="text-xs font-mono text-muted-foreground">
                        {pattern.selector}
                      </code>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Frekvens</div>
                        <div className="font-medium">{pattern.frequency}%</div>
                      </div>
                      <Button variant="ghost" size="sm" data-testid={`button-use-pattern-${index}`}>
                        Bruk
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Patterns */}
            <div>
              <h4 className="font-medium mb-3">Egendefinerte Mønstre</h4>
              {customPatterns.length > 0 ? (
                <div className="space-y-2">
                  {customPatterns.map((pattern, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`custom-pattern-${index}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{pattern.name}</div>
                        <code className="text-xs font-mono text-muted-foreground">
                          {pattern.selector}
                        </code>
                        {pattern.description && (
                          <p className="text-xs text-muted-foreground mt-1">{pattern.description}</p>
                        )}
                      </div>
                      <Badge variant="outline">Custom</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4 border-2 border-dashed rounded-lg">
                  Ingen egendefinerte mønstre ennå
                </div>
              )}
            </div>

            {/* Add Custom Pattern */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Legg til Mønster</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    placeholder="Navn"
                    value={newPattern.name}
                    onChange={(e) => setNewPattern({ ...newPattern, name: e.target.value })}
                    data-testid="input-pattern-name"
                  />
                  <Input
                    placeholder="Selector"
                    value={newPattern.selector}
                    onChange={(e) => setNewPattern({ ...newPattern, selector: e.target.value })}
                    className="font-mono"
                    data-testid="input-pattern-selector"
                  />
                  <Button onClick={addCustomPattern} data-testid="button-add-pattern">
                    <Plus className="w-4 h-4 mr-2" />
                    Legg til
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Anbefalinger for {currentProfile.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>• Bruk data-attributter for kritiske elementer</li>
                  <li>• Unngå dypt nestede selectors (maks 3 nivåer)</li>
                  <li>• Test selectors på minst 10 forskjellige sider</li>
                  <li>• Valider mot mobilvisning</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}