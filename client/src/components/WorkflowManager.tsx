import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Play, 
  Pause, 
  Plus, 
  Save, 
  Settings, 
  Clock,
  Eye,
  Code2,
  Box,
  Calendar,
  Zap,
  Share2,
  BarChart3,
  Users,
  FileCode,
  GitBranch,
  ShoppingCart,
  Bug,
  Network,
  Activity,
  Shield,
  Search,
  Download,
  Upload,
  Star,
  TrendingUp,
  Lock,
  Globe,
  Terminal,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  type: 'automation' | 'watched' | 'scheduled';
  status: 'active' | 'paused' | 'draft';
  trigger?: string;
  schedule?: string;
  lastRun?: Date;
  nextRun?: Date;
  actions: WorkflowAction[];
}

interface WorkflowAction {
  id: string;
  type: string;
  config: Record<string, any>;
}

export function WorkflowManager() {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'Daglig nyhetsscraping',
      description: 'Henter nyheter fra utvalgte nettsteder hver morgen',
      type: 'scheduled',
      status: 'active',
      schedule: '0 7 * * *',
      lastRun: new Date('2024-01-06T07:00:00'),
      nextRun: new Date('2024-01-07T07:00:00'),
      actions: []
    },
    {
      id: '2',
      name: 'Prisovervåking',
      description: 'Overvåker prisendringer på produkter',
      type: 'watched',
      status: 'active',
      trigger: 'content_change',
      actions: []
    }
  ]);

  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="overview" className="flex-1">
        <TabsList className="w-full overflow-x-auto flex">
          <TabsTrigger value="overview" className="flex items-center gap-2 flex-shrink-0">
            <Box className="h-4 w-4" />
            Oversikt
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center gap-2 flex-shrink-0">
            <Code2 className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2 flex-shrink-0">
            <Clock className="h-4 w-4" />
            Planlagte
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex items-center gap-2 flex-shrink-0">
            <ShoppingCart className="h-4 w-4" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2 flex-shrink-0">
            <Bug className="h-4 w-4" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="api-gateway" className="flex items-center gap-2 flex-shrink-0">
            <Network className="h-4 w-4" />
            API Gateway
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2 flex-shrink-0">
            <Activity className="h-4 w-4" />
            Monitor
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2 flex-shrink-0">
            <Shield className="h-4 w-4" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 flex-shrink-0">
            <BarChart3 className="h-4 w-4" />
            Analyse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="p-4 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Mine Workflows</h3>
            <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ny Workflow
            </Button>
          </div>

          <div className="grid gap-4">
            {workflows.map(workflow => (
              <Card key={workflow.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{workflow.name}</h4>
                      <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                        {workflow.status}
                      </Badge>
                      <Badge variant="outline">
                        {workflow.type === 'scheduled' ? <Clock className="h-3 w-3 mr-1" /> : 
                         workflow.type === 'watched' ? <Eye className="h-3 w-3 mr-1" /> :
                         <Zap className="h-3 w-3 mr-1" />}
                        {workflow.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{workflow.description}</p>
                    {workflow.schedule && (
                      <p className="text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Kjører: {workflow.schedule}
                      </p>
                    )}
                    {workflow.lastRun && (
                      <p className="text-xs text-muted-foreground">
                        Sist kjørt: {workflow.lastRun.toLocaleString('nb-NO')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setSelectedWorkflow(workflow)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        // Toggle status
                        setWorkflows(prev => prev.map(w => 
                          w.id === workflow.id 
                            ? { ...w, status: w.status === 'active' ? 'paused' : 'active' }
                            : w
                        ));
                      }}
                    >
                      {workflow.status === 'active' ? 
                        <Pause className="h-4 w-4" /> : 
                        <Play className="h-4 w-4" />
                      }
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="editor" className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Workflow Editor</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <FileCode className="h-4 w-4 mr-2" />
                  Importer DSL
                </Button>
                <Button variant="outline" size="sm">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Versjonskontroll
                </Button>
              </div>
            </div>

            {isCreating || selectedWorkflow ? (
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="workflow-name">Navn</Label>
                    <Input 
                      id="workflow-name" 
                      placeholder="Min workflow"
                      defaultValue={selectedWorkflow?.name}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="workflow-desc">Beskrivelse</Label>
                    <Textarea 
                      id="workflow-desc" 
                      placeholder="Beskriv hva denne workflowen gjør..."
                      defaultValue={selectedWorkflow?.description}
                    />
                  </div>

                  <div>
                    <Label htmlFor="workflow-type">Type</Label>
                    <Select defaultValue={selectedWorkflow?.type || 'automation'}>
                      <SelectTrigger id="workflow-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automation">
                          <Zap className="h-4 w-4 inline mr-2" />
                          Automasjon
                        </SelectItem>
                        <SelectItem value="scheduled">
                          <Clock className="h-4 w-4 inline mr-2" />
                          Planlagt
                        </SelectItem>
                        <SelectItem value="watched">
                          <Eye className="h-4 w-4 inline mr-2" />
                          Overvåket
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Workflow Actions</h4>
                    <div className="space-y-2">
                      <div className="border-l-2 border-primary pl-4 space-y-2">
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">1. Naviger til URL</span>
                          <Button variant="ghost" size="sm">Rediger</Button>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">2. Vent på element</span>
                          <Button variant="ghost" size="sm">Rediger</Button>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">3. Hent data</span>
                          <Button variant="ghost" size="sm">Rediger</Button>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Legg til action
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsCreating(false);
                        setSelectedWorkflow(null);
                      }}
                    >
                      Avbryt
                    </Button>
                    <Button className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Lagre Workflow
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <Code2 className="h-16 w-16 mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Ingen workflow valgt</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Velg en eksisterende workflow eller opprett en ny
                </p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ny Workflow
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Planlagte & Overvåkede Workflows</h3>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Kalendervisning
              </Button>
            </div>

            <div className="grid gap-4">
              {workflows
                .filter(w => w.type === 'scheduled' || w.type === 'watched')
                .map(workflow => (
                  <Card key={workflow.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {workflow.type === 'scheduled' ? 
                          <Clock className="h-5 w-5 text-primary" /> :
                          <Eye className="h-5 w-5 text-primary" />
                        }
                        <div>
                          <h4 className="font-medium">{workflow.name}</h4>
                          {workflow.nextRun && (
                            <p className="text-sm text-muted-foreground">
                              Neste kjøring: {workflow.nextRun.toLocaleString('nb-NO')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                          {workflow.status}
                        </Badge>
                        <Switch 
                          checked={workflow.status === 'active'}
                          onCheckedChange={(checked) => {
                            setWorkflows(prev => prev.map(w => 
                              w.id === workflow.id 
                                ? { ...w, status: checked ? 'active' : 'paused' }
                                : w
                            ));
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Workflow Analyse</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Del rapport
                </Button>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Samarbeid
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-2xl font-bold">24</div>
                <div className="text-sm text-muted-foreground">Totalt kjøringer</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-green-600">95%</div>
                <div className="text-sm text-muted-foreground">Suksessrate</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold">2.3s</div>
                <div className="text-sm text-muted-foreground">Gjennomsnitt tid</div>
              </Card>
            </div>

            <Card className="p-4">
              <h4 className="font-medium mb-3">Siste kjøringer</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Daglig nyhetsscraping</span>
                  <Badge variant="default">Vellykket</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Prisovervåking</span>
                  <Badge variant="default">Vellykket</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Daglig nyhetsscraping</span>
                  <Badge variant="destructive">Feilet</Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Marketplace */}
        <TabsContent value="marketplace" className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Workflow Marketplace</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Del Workflow
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Søk
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Globe className="h-8 w-8 text-primary" />
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-sm">4.8</span>
                  </div>
                </div>
                <h4 className="font-medium mb-1">E-commerce Scraper</h4>
                <p className="text-sm text-muted-foreground mb-3">Hent produktdata fra nettbutikker</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">2.3k nedlastinger</span>
                  <Button size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Installer
                  </Button>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-sm">4.9</span>
                  </div>
                </div>
                <h4 className="font-medium mb-1">SEO Monitor</h4>
                <p className="text-sm text-muted-foreground mb-3">Overvåk SEO-ytelse automatisk</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">1.8k nedlastinger</span>
                  <Button size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Installer
                  </Button>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Shield className="h-8 w-8 text-primary" />
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-sm">5.0</span>
                  </div>
                </div>
                <h4 className="font-medium mb-1">Security Scanner</h4>
                <p className="text-sm text-muted-foreground mb-3">Automatisk sikkerhetsskanning</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">892 nedlastinger</span>
                  <Button size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Installer
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Testing/Debugging */}
        <TabsContent value="testing" className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Workflow Testing & Debugging</h3>
              <Button variant="outline" size="sm">
                <Terminal className="h-4 w-4 mr-2" />
                Konsoll
              </Button>
            </div>

            <Card className="p-4">
              <h4 className="font-medium mb-3">Test Runner</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">Navigasjon Test</p>
                      <p className="text-xs text-muted-foreground">Alle steg bestått</p>
                    </div>
                  </div>
                  <span className="text-xs">2.3s</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-sm">Data Ekstraksjon</p>
                      <p className="text-xs text-muted-foreground">1 advarsel</p>
                    </div>
                  </div>
                  <span className="text-xs">1.8s</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm">API Integrasjon</p>
                      <p className="text-xs text-muted-foreground">Kjører...</p>
                    </div>
                  </div>
                  <span className="text-xs">--</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Kjør Alle Tester
                </Button>
                <Button variant="outline" size="sm">
                  <Bug className="h-4 w-4 mr-2" />
                  Debug Modus
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* API Gateway */}
        <TabsContent value="api-gateway" className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">API Gateway</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ny Integrasjon
              </Button>
            </div>

            <div className="grid gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                      <Globe className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">OpenAI API</h4>
                      <p className="text-sm text-muted-foreground">GPT-4 integrasjon</p>
                    </div>
                  </div>
                  <Badge variant="default">Aktiv</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Forespørsler:</span>
                    <p className="font-medium">1,234</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Suksessrate:</span>
                    <p className="font-medium">99.8%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Latency:</span>
                    <p className="font-medium">245ms</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                      <Network className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Stripe API</h4>
                      <p className="text-sm text-muted-foreground">Betalingsintegrasjon</p>
                    </div>
                  </div>
                  <Badge variant="default">Aktiv</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Forespørsler:</span>
                    <p className="font-medium">567</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Suksessrate:</span>
                    <p className="font-medium">100%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Latency:</span>
                    <p className="font-medium">180ms</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Real-time Monitor */}
        <TabsContent value="monitor" className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Real-time Monitor</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm">Live</span>
                </div>
                <Button variant="outline" size="sm">
                  <Activity className="h-4 w-4 mr-2" />
                  Metrics
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  <span className="text-xs text-green-600">+12%</span>
                </div>
                <div className="text-2xl font-bold">8</div>
                <div className="text-sm text-muted-foreground">Aktive Workflows</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  <span className="text-xs text-blue-600">+5%</span>
                </div>
                <div className="text-2xl font-bold">124</div>
                <div className="text-sm text-muted-foreground">Fullførte i dag</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-xs text-yellow-600">-2%</span>
                </div>
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-muted-foreground">Advarsler</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="text-xs text-purple-600">Stabil</span>
                </div>
                <div className="text-2xl font-bold">1.2s</div>
                <div className="text-sm text-muted-foreground">Gj.snitt tid</div>
              </Card>
            </div>

            <Card className="p-4">
              <h4 className="font-medium mb-3">Live Aktivitet</h4>
              <div className="space-y-2 max-h-64 overflow-auto">
                <div className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <span>Daglig nyhetsscraping</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Startet 10:45</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full" />
                    <span>Prisovervåking</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Fullført 10:43</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                    <span>API Sync</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Venter...</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Workflow Policies */}
        <TabsContent value="policies" className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Workflow Policies</h3>
              <Button size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Ny Policy
              </Button>
            </div>

            <div className="grid gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-red-600" />
                    <div>
                      <h4 className="font-medium">Produksjon Workflow Policy</h4>
                      <p className="text-sm text-muted-foreground">Kun godkjente brukere kan kjøre</p>
                    </div>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Gjelder for:</span>
                    <Badge variant="outline" className="ml-2">Produksjon</Badge>
                    <Badge variant="outline" className="ml-1">Kritisk</Badge>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Tillatte brukere:</span>
                    <span className="ml-2">Admin, DevOps</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">API Rate Limiting</h4>
                      <p className="text-sm text-muted-foreground">Begrens API-kall per time</p>
                    </div>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Maks forespørsler:</span>
                    <span className="ml-2">1000/time</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Nåværende bruk:</span>
                    <span className="ml-2">234/1000</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium">Data Sikkerhet</h4>
                      <p className="text-sm text-muted-foreground">Kryptering og tilgangskontroll</p>
                    </div>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Kryptering:</span>
                    <Badge variant="default" className="ml-2">AES-256</Badge>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Sist revidert:</span>
                    <span className="ml-2">5 dager siden</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}