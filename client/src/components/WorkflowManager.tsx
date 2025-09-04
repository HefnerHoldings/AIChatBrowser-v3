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
  GitBranch
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
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            Oversikt
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Planlagte
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
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
      </Tabs>
    </div>
  );
}