import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Globe, 
  Mail, 
  Phone, 
  Building, 
  Users, 
  MapPin, 
  Linkedin, 
  FileSearch,
  Download,
  Filter,
  Play,
  Pause,
  RefreshCw,
  Settings,
  Database,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ScrapingJob {
  id: string;
  name: string;
  type: 'emails' | 'contacts' | 'companies' | 'social';
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  results: number;
  source: string;
}

export function LeadScrapingSidebar() {
  const [activeJob, setActiveJob] = useState<ScrapingJob | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrapingJobs, setScrapingJobs] = useState<ScrapingJob[]>([
    {
      id: '1',
      name: 'Tech Startups Oslo',
      type: 'companies',
      status: 'completed',
      progress: 100,
      results: 245,
      source: 'proff.no'
    },
    {
      id: '2',
      name: 'Marketing Contacts',
      type: 'emails',
      status: 'running',
      progress: 67,
      results: 89,
      source: 'linkedin.com'
    }
  ]);

  const startScraping = () => {
    // Start scraping logic
    console.log('Starting scraping job...');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg mb-1">Lead Scraping</h3>
        <p className="text-sm text-muted-foreground">
          Ekstraher kontakter og bedriftsdata
        </p>
      </div>

      <Tabs defaultValue="search" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="search">Søk</TabsTrigger>
          <TabsTrigger value="active">Aktive</TabsTrigger>
          <TabsTrigger value="results">Resultater</TabsTrigger>
          <TabsTrigger value="settings">Oppsett</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="flex-1 px-4">
          <ScrollArea className="h-full">
            <div className="space-y-4 pb-4">
              {/* Search Configuration */}
              <Card className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Søkeparametere
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label>Søkeord</Label>
                    <Input 
                      placeholder="f.eks. 'IT konsulenter Oslo'"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Datakilde</Label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle kilder</SelectItem>
                        <SelectItem value="proff">Proff.no</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="yellow">Gule Sider</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Data type</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="emails" defaultChecked />
                        <Label htmlFor="emails" className="text-sm font-normal">
                          E-poster
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="phones" defaultChecked />
                        <Label htmlFor="phones" className="text-sm font-normal">
                          Telefon
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="companies" defaultChecked />
                        <Label htmlFor="companies" className="text-sm font-normal">
                          Bedrifter
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="social" />
                        <Label htmlFor="social" className="text-sm font-normal">
                          Sosiale
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4"
                  onClick={startScraping}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Scraping
                </Button>
              </Card>

              {/* Quick Templates */}
              <Card className="p-4">
                <h4 className="font-medium mb-3">Raske maler</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Building className="h-4 w-4 mr-2" />
                    B2B Bedrifter
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    E-post kampanje
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Kontaktpersoner
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn profiler
                  </Button>
                </div>
              </Card>

              {/* Advanced Filters */}
              <Card className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Avanserte filtre
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label>Lokasjon</Label>
                    <Input placeholder="By, fylke eller postnummer" />
                  </div>
                  <div>
                    <Label>Bransje</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg bransje" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="it">IT & Teknologi</SelectItem>
                        <SelectItem value="finance">Finans</SelectItem>
                        <SelectItem value="health">Helse</SelectItem>
                        <SelectItem value="retail">Handel</SelectItem>
                        <SelectItem value="construction">Bygg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Bedriftsstørrelse</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Antall ansatte" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 ansatte</SelectItem>
                        <SelectItem value="11-50">11-50 ansatte</SelectItem>
                        <SelectItem value="51-200">51-200 ansatte</SelectItem>
                        <SelectItem value="200+">200+ ansatte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="active" className="flex-1 px-4">
          <ScrollArea className="h-full">
            <div className="space-y-3 pb-4">
              {scrapingJobs.map(job => (
                <Card key={job.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {job.type === 'emails' && <Mail className="h-4 w-4" />}
                      {job.type === 'companies' && <Building className="h-4 w-4" />}
                      {job.type === 'contacts' && <Users className="h-4 w-4" />}
                      {job.type === 'social' && <Linkedin className="h-4 w-4" />}
                      <span className="font-medium">{job.name}</span>
                    </div>
                    <Badge variant={
                      job.status === 'completed' ? 'default' :
                      job.status === 'running' ? 'secondary' :
                      job.status === 'failed' ? 'destructive' : 'outline'
                    }>
                      {job.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {job.status === 'running' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                      {job.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                      {job.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Kilde: {job.source}
                  </div>
                  <Progress value={job.progress} className="mb-2" />
                  <div className="flex justify-between text-sm">
                    <span>{job.results} resultater</span>
                    <span>{job.progress}%</span>
                  </div>
                  {job.status === 'running' && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Pause className="h-3 w-3 mr-1" />
                        Pause
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <XCircle className="h-3 w-3 mr-1" />
                        Stopp
                      </Button>
                    </div>
                  )}
                  {job.status === 'completed' && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="h-3 w-3 mr-1" />
                        Last ned
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Database className="h-3 w-3 mr-1" />
                        Se data
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="results" className="flex-1 px-4">
          <ScrollArea className="h-full">
            <div className="space-y-3 pb-4">
              <Card className="p-4">
                <h4 className="font-medium mb-3">Siste resultater</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Tech Startups Oslo</span>
                    <div className="flex items-center gap-2">
                      <Badge>245 leads</Badge>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Marketing Contacts</span>
                    <div className="flex items-center gap-2">
                      <Badge>89 leads</Badge>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium mb-3">Statistikk</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Totalt scrapet</span>
                    <span className="font-medium">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Unike e-poster</span>
                    <span className="font-medium">892</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Bedrifter</span>
                    <span className="font-medium">156</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Suksessrate</span>
                    <span className="font-medium">94%</span>
                  </div>
                </div>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 px-4">
          <ScrollArea className="h-full">
            <div className="space-y-4 pb-4">
              <Card className="p-4">
                <h4 className="font-medium mb-3">Scraping innstillinger</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-dedupe">Auto-deduplisering</Label>
                    <Checkbox id="auto-dedupe" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="verify-emails">Verifiser e-poster</Label>
                    <Checkbox id="verify-emails" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="gdpr-mode">GDPR-modus</Label>
                    <Checkbox id="gdpr-mode" />
                  </div>
                  <Separator />
                  <div>
                    <Label>Maksimalt antall resultater</Label>
                    <Input type="number" defaultValue="500" className="mt-1" />
                  </div>
                  <div>
                    <Label>Forsinkelse mellom forespørsler (ms)</Label>
                    <Input type="number" defaultValue="1000" className="mt-1" />
                  </div>
                </div>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}