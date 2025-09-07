import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Send, 
  Users, 
  Target, 
  TrendingUp,
  Calendar,
  Mail,
  MessageSquare,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MousePointer,
  Reply,
  CalendarCheck,
  Plus,
  Play,
  Pause,
  RefreshCw,
  Download,
  Upload,
  Search,
  Filter,
  Settings,
  BarChart3,
  Activity,
  Zap,
  Award,
  ShoppingBag,
  Newspaper,
  Star,
  Clock,
  Globe
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  prospects: number;
  sent: number;
  opens: number;
  replies: number;
  meetings: number;
  created_at: Date;
  started_at?: Date;
}

interface Prospect {
  id: string;
  company: string;
  domain: string;
  contact_name?: string;
  email?: string;
  industry?: string;
  hooks: Hook[];
  score: number;
  status: 'pending' | 'contacted' | 'replied' | 'meeting';
}

interface Hook {
  id: string;
  type: string;
  headline: string;
  source: string;
  date: Date;
  score: number;
  status: 'approved' | 'review' | 'rejected';
}

export function OutreachDashboard() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterHookType, setFilterHookType] = useState('all');
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);
  const [showProspectDialog, setShowProspectDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for demo
  const campaigns: Campaign[] = [
    {
      id: '1',
      name: 'Q1 2025 - Review Winners',
      status: 'active',
      prospects: 245,
      sent: 180,
      opens: 126,
      replies: 18,
      meetings: 5,
      created_at: new Date('2025-01-10'),
      started_at: new Date('2025-01-12')
    },
    {
      id: '2',
      name: 'Award Recipients Outreach',
      status: 'paused',
      prospects: 120,
      sent: 45,
      opens: 32,
      replies: 8,
      meetings: 2,
      created_at: new Date('2025-01-05')
    }
  ];

  const prospects: Prospect[] = [
    {
      id: '1',
      company: 'TechCorp AS',
      domain: 'techcorp.no',
      contact_name: 'Lars Hansen',
      email: 'lars@techcorp.no',
      industry: 'Technology',
      hooks: [
        {
          id: 'h1',
          type: 'review_win',
          headline: 'Fikk 5 stjerner på Trustpilot (12. jan)',
          source: 'Trustpilot',
          date: new Date('2025-01-12'),
          score: 0.92,
          status: 'approved'
        }
      ],
      score: 0.85,
      status: 'pending'
    },
    {
      id: '2',
      company: 'Nordic Commerce',
      domain: 'nordiccommerce.no',
      contact_name: 'Anna Berg',
      email: 'anna@nordiccommerce.no',
      industry: 'E-commerce',
      hooks: [
        {
          id: 'h2',
          type: 'award',
          headline: 'Vant Nordic Commerce Award (26. aug)',
          source: 'Nyhetsrom',
          date: new Date('2024-08-26'),
          score: 0.88,
          status: 'approved'
        }
      ],
      score: 0.82,
      status: 'contacted'
    }
  ];

  // Hook type icons
  const getHookIcon = (type: string) => {
    const icons: Record<string, any> = {
      'review_win': Star,
      'award': Award,
      'product_launch': ShoppingBag,
      'pr_feature': Newspaper,
      'milestone': TrendingUp,
      'case_post': CheckCircle
    };
    const Icon = icons[type] || AlertCircle;
    return <Icon className="h-4 w-4" />;
  };

  // Status colors
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-500',
      'active': 'bg-green-500',
      'paused': 'bg-yellow-500',
      'completed': 'bg-blue-500',
      'pending': 'bg-gray-400',
      'contacted': 'bg-blue-400',
      'replied': 'bg-green-400',
      'meeting': 'bg-purple-400'
    };
    return colors[status] || 'bg-gray-400';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Outreach Engine</h3>
            <p className="text-sm text-muted-foreground">
              Signal-drevet B2B kommunikasjon
            </p>
          </div>
          <Button 
            size="sm"
            onClick={() => setShowNewCampaignDialog(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Ny kampanje
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="campaigns" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="campaigns">Kampanjer</TabsTrigger>
          <TabsTrigger value="prospects">Prospekter</TabsTrigger>
          <TabsTrigger value="hooks">Signaler</TabsTrigger>
          <TabsTrigger value="analytics">Analyse</TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="flex-1 p-4 space-y-4">
          <div className="grid gap-2">
            {campaigns.map((campaign) => (
              <Card 
                key={campaign.id}
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setSelectedCampaign(campaign)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{campaign.name}</h4>
                      <Badge 
                        variant="outline"
                        className={`${getStatusColor(campaign.status)} text-white`}
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {campaign.prospects} prospekter • Startet {campaign.started_at?.toLocaleDateString('nb-NO')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {campaign.status === 'active' ? (
                      <Button size="icon" variant="ghost">
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost">
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Campaign Stats */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="text-center">
                    <Mail className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium">{campaign.sent}</p>
                    <p className="text-xs text-muted-foreground">Sendt</p>
                  </div>
                  <div className="text-center">
                    <Eye className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                    <p className="text-sm font-medium">{campaign.opens}</p>
                    <p className="text-xs text-muted-foreground">Åpnet</p>
                  </div>
                  <div className="text-center">
                    <Reply className="h-4 w-4 mx-auto mb-1 text-green-500" />
                    <p className="text-sm font-medium">{campaign.replies}</p>
                    <p className="text-xs text-muted-foreground">Svar</p>
                  </div>
                  <div className="text-center">
                    <CalendarCheck className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                    <p className="text-sm font-medium">{campaign.meetings}</p>
                    <p className="text-xs text-muted-foreground">Møter</p>
                  </div>
                </div>

                {/* Performance Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Åpningsrate</span>
                    <span>{Math.round((campaign.opens / campaign.sent) * 100)}%</span>
                  </div>
                  <Progress value={(campaign.opens / campaign.sent) * 100} className="h-2" />
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Prospects Tab */}
        <TabsContent value="prospects" className="flex-1 p-4">
          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <Select value={filterIndustry} onValueChange={setFilterIndustry}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Bransje" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle bransjer</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="ecommerce">E-commerce</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterHookType} onValueChange={setFilterHookType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Signal-type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle signaler</SelectItem>
                <SelectItem value="review_win">Anmeldelser</SelectItem>
                <SelectItem value="award">Priser</SelectItem>
                <SelectItem value="product_launch">Lanseringer</SelectItem>
                <SelectItem value="pr_feature">PR/Media</SelectItem>
              </SelectContent>
            </Select>

            <Button size="sm" variant="outline">
              <Upload className="h-4 w-4 mr-1" />
              Importer
            </Button>
          </div>

          {/* Prospect List */}
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {prospects.map((prospect) => (
                <Card key={prospect.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedProspects.includes(prospect.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProspects([...selectedProspects, prospect.id]);
                            } else {
                              setSelectedProspects(selectedProspects.filter(id => id !== prospect.id));
                            }
                          }}
                        />
                        <div>
                          <h4 className="font-medium">{prospect.company}</h4>
                          <p className="text-xs text-muted-foreground">
                            {prospect.contact_name} • {prospect.email}
                          </p>
                        </div>
                      </div>

                      {/* Hooks */}
                      <div className="mt-2 space-y-1">
                        {prospect.hooks.map((hook) => (
                          <div key={hook.id} className="flex items-center gap-2">
                            {getHookIcon(hook.type)}
                            <span className="text-xs">{hook.headline}</span>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(hook.score * 100)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge className={getStatusColor(prospect.status)}>
                        {prospect.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Score: {Math.round(prospect.score * 100)}%
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Actions */}
          {selectedProspects.length > 0 && (
            <div className="mt-4 p-3 bg-accent rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {selectedProspects.length} prospekt(er) valgt
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Target className="h-4 w-4 mr-1" />
                    Legg til kampanje
                  </Button>
                  <Button size="sm">
                    <Send className="h-4 w-4 mr-1" />
                    Start outreach
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Hooks/Signals Tab */}
        <TabsContent value="hooks" className="flex-1 p-4">
          <Alert className="mb-4">
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Live signaler:</strong> Systemet overvåker kontinuerlig for nye hendelser
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Card className="p-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <Star className="h-4 w-4 text-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Ny 5-stjernes anmeldelse</p>
                  <p className="text-xs text-muted-foreground">
                    TechCorp AS • Trustpilot • For 2 timer siden
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">92% match</Badge>
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <Award className="h-4 w-4 text-purple-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Vant bransjepris</p>
                  <p className="text-xs text-muted-foreground">
                    Nordic Commerce • DN.no • I går
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">88% match</Badge>
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                <ShoppingBag className="h-4 w-4 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Lanserte nytt produkt</p>
                  <p className="text-xs text-muted-foreground">
                    StartupCo • Egen nettside • For 3 dager siden
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">75% match</Badge>
              </div>
            </Card>
          </div>

          <div className="mt-4">
            <Button className="w-full" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Oppdater signaler
            </Button>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="flex-1 p-4">
          <div className="space-y-4">
            {/* Overall Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">2,450</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Totalt sendt</p>
                <p className="text-xs text-green-500">+12% denne uken</p>
              </Card>

              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">68%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Åpningsrate</p>
                <p className="text-xs text-green-500">+5% vs. gj.snitt</p>
              </Card>

              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <Reply className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">12.5%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Svarrate</p>
                <p className="text-xs text-green-500">+3% vs. gj.snitt</p>
              </Card>

              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">45</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Bookede møter</p>
                <p className="text-xs text-green-500">+8 denne uken</p>
              </Card>
            </div>

            {/* Best Performing Hooks */}
            <Card className="p-4">
              <h4 className="font-medium mb-3">Beste signal-typer</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Anmeldelser</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">18% svarrate</span>
                    <Progress value={18} className="w-20 h-2" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Priser</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">15% svarrate</span>
                    <Progress value={15} className="w-20 h-2" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Lanseringer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">12% svarrate</span>
                    <Progress value={12} className="w-20 h-2" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Export */}
            <Button className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Eksporter rapport
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Campaign Dialog */}
      <Dialog open={showNewCampaignDialog} onOpenChange={setShowNewCampaignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opprett ny kampanje</DialogTitle>
            <DialogDescription>
              Sett opp en ny outreach-kampanje med ferske signaler
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Kampanjenavn</Label>
              <Input placeholder="F.eks. Q1 2025 - Review Winners" />
            </div>
            
            <div>
              <Label>Signal-typer</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Anmeldelser</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Priser</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  <span className="text-sm">Lanseringer</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  <span className="text-sm">PR/Media</span>
                </label>
              </div>
            </div>
            
            <div>
              <Label>Maks alder på signaler</Label>
              <Select defaultValue="14">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dager</SelectItem>
                  <SelectItem value="14">14 dager</SelectItem>
                  <SelectItem value="30">30 dager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Eskaleringssekvens</Label>
              <div className="text-xs text-muted-foreground mt-1">
                Dag 0: E-post #1 → Dag 4: E-post #2 → Dag 7: SMS → Dag 11: E-post #3
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCampaignDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={() => {
              setShowNewCampaignDialog(false);
              toast({
                title: "Kampanje opprettet",
                description: "Finner ferske signaler og forbereder meldinger..."
              });
            }}>
              Opprett kampanje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}