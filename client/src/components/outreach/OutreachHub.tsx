import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  Users,
  Target,
  Zap,
  TrendingUp,
  Mail,
  MessageSquare,
  Calendar,
  Filter,
  Search,
  Plus,
  Upload,
  Download,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Eye,
  MousePointer,
  Reply,
  CalendarCheck,
  Sparkles,
  Trophy,
  Brain,
  Rocket,
  Database,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  Settings,
  ChevronRight,
  X,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Info,
  AlertTriangle
} from 'lucide-react';

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
  contact_name: string;
  email: string;
  industry: string;
  status: 'pending' | 'contacted' | 'replied' | 'meeting' | 'closed';
  score: number;
  last_activity?: Date;
  hooks?: Hook[];
}

interface Hook {
  id: string;
  type: string;
  title: string;
  content: string;
  score: number;
  date: Date;
}

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  source: string;
  status: 'new' | 'qualified' | 'contacted' | 'opportunity' | 'customer' | 'lost';
  score: number;
  value?: number;
  assigned_to?: string;
  created_at: Date;
  updated_at: Date;
  notes?: string;
  tags: string[];
}

export function OutreachHub() {
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Fetch campaigns
  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery<Campaign[]>({
    queryKey: ['/api/outreach/campaigns'],
    refetchInterval: 5000
  });

  // Fetch prospects
  const { data: prospects = [], isLoading: loadingProspects } = useQuery<Prospect[]>({
    queryKey: ['/api/outreach/prospects']
  });

  // Fetch leads
  const { data: leads = [], isLoading: loadingLeads } = useQuery<Lead[]>({
    queryKey: ['/api/outreach/leads']
  });

  // Start campaign mutation
  const startCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      return await apiRequest(`/api/outreach/campaigns/${campaignId}/start`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Kampanje startet",
        description: "Outreach-kampanjen kjører nå automatisk"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/campaigns'] });
    }
  });

  // Pause campaign mutation
  const pauseCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      return await apiRequest(`/api/outreach/campaigns/${campaignId}/pause`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Kampanje pauset",
        description: "Kampanjen er satt på pause"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/campaigns'] });
    }
  });

  // Mine hooks mutation
  const mineHooks = useMutation({
    mutationFn: async (prospectId: string) => {
      return await apiRequest(`/api/outreach/prospects/${prospectId}/mine-hooks`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Hooks funnet",
        description: "Nye personaliserte hooks er klare"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/prospects'] });
    }
  });

  // Generate message mutation
  const generateMessage = useMutation({
    mutationFn: async (data: { prospectId: string; hookId: string }) => {
      return await apiRequest('/api/outreach/messages/generate', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Melding generert",
        description: "AI har laget en personalisert melding"
      });
    }
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500',
      paused: 'bg-yellow-500',
      draft: 'bg-gray-500',
      completed: 'bg-blue-500',
      new: 'bg-purple-500',
      qualified: 'bg-indigo-500',
      contacted: 'bg-blue-500',
      opportunity: 'bg-green-500',
      customer: 'bg-emerald-500',
      lost: 'bg-red-500',
      pending: 'bg-gray-500',
      replied: 'bg-blue-500',
      meeting: 'bg-green-500',
      closed: 'bg-purple-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const totalStats = {
    campaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c: Campaign) => c.status === 'active').length,
    totalProspects: prospects.length,
    totalLeads: leads.length,
    totalSent: campaigns.reduce((sum: number, c: Campaign) => sum + c.sent, 0),
    totalOpens: campaigns.reduce((sum: number, c: Campaign) => sum + c.opens, 0),
    totalReplies: campaigns.reduce((sum: number, c: Campaign) => sum + c.replies, 0),
    totalMeetings: campaigns.reduce((sum: number, c: Campaign) => sum + c.meetings, 0)
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-green-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Send className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Outreach & Leads Hub</h2>
              <p className="text-sm text-muted-foreground">AI-drevet salgsautomatisering</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importer leads
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-purple-500 to-blue-500"
              onClick={() => setShowNewCampaignModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ny kampanje
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-8 gap-4 mt-4">
          <Card className="col-span-1">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Kampanjer</p>
                  <p className="text-xl font-bold">{totalStats.campaigns}</p>
                </div>
                <Rocket className="h-5 w-5 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Aktive</p>
                  <p className="text-xl font-bold">{totalStats.activeCampaigns}</p>
                </div>
                <Activity className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Prospects</p>
                  <p className="text-xl font-bold">{totalStats.totalProspects}</p>
                </div>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Leads</p>
                  <p className="text-xl font-bold">{totalStats.totalLeads}</p>
                </div>
                <Target className="h-5 w-5 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Sendt</p>
                  <p className="text-xl font-bold">{totalStats.totalSent}</p>
                </div>
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Åpnet</p>
                  <p className="text-xl font-bold">{totalStats.totalOpens}</p>
                </div>
                <Eye className="h-5 w-5 text-cyan-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Svar</p>
                  <p className="text-xl font-bold">{totalStats.totalReplies}</p>
                </div>
                <Reply className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Møter</p>
                  <p className="text-xl font-bold">{totalStats.totalMeetings}</p>
                </div>
                <CalendarCheck className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="campaigns" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="campaigns">
            <Rocket className="h-4 w-4 mr-2" />
            Kampanjer
          </TabsTrigger>
          <TabsTrigger value="prospects">
            <Users className="h-4 w-4 mr-2" />
            Prospects
          </TabsTrigger>
          <TabsTrigger value="leads">
            <Target className="h-4 w-4 mr-2" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="hooks">
            <Brain className="h-4 w-4 mr-2" />
            Hook Mining
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-2" />
            Meldinger
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="flex-1 p-4">
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Campaign List */}
            <div className="col-span-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søk kampanjer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-3">
                  {campaigns.map((campaign: Campaign) => (
                    <Card 
                      key={campaign.id}
                      className={`cursor-pointer transition-all ${
                        selectedCampaign?.id === campaign.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedCampaign(campaign)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{campaign.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              Opprettet {new Date(campaign.created_at).toLocaleDateString('nb-NO')}
                            </p>
                          </div>
                          <Badge className={`${getStatusColor(campaign.status)} text-white`}>
                            {campaign.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="text-center p-2 bg-muted rounded">
                            <p className="text-xs text-muted-foreground">Prospects</p>
                            <p className="font-semibold">{campaign.prospects}</p>
                          </div>
                          <div className="text-center p-2 bg-muted rounded">
                            <p className="text-xs text-muted-foreground">Sendt</p>
                            <p className="font-semibold">{campaign.sent}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {campaign.opens}
                            </span>
                            <span className="flex items-center gap-1">
                              <Reply className="h-3 w-3" />
                              {campaign.replies}
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarCheck className="h-3 w-3" />
                              {campaign.meetings}
                            </span>
                          </div>
                          
                          {campaign.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                pauseCampaign.mutate(campaign.id);
                              }}
                            >
                              <PauseCircle className="h-4 w-4" />
                            </Button>
                          ) : campaign.status === 'paused' || campaign.status === 'draft' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                startCampaign.mutate(campaign.id);
                              }}
                            >
                              <PlayCircle className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Campaign Details */}
            <div className="col-span-8">
              {selectedCampaign ? (
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>{selectedCampaign.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Performance Chart */}
                      <div>
                        <h4 className="font-medium mb-3">Ytelse</h4>
                        <div className="grid grid-cols-4 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center">
                                <Mail className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{selectedCampaign.sent}</p>
                                <p className="text-xs text-muted-foreground">E-poster sendt</p>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center">
                                <Eye className="h-8 w-8 text-cyan-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{selectedCampaign.opens}</p>
                                <p className="text-xs text-muted-foreground">Åpnet</p>
                                <p className="text-xs text-green-600">
                                  {selectedCampaign.sent > 0 
                                    ? `${Math.round((selectedCampaign.opens / selectedCampaign.sent) * 100)}%`
                                    : '0%'}
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center">
                                <Reply className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{selectedCampaign.replies}</p>
                                <p className="text-xs text-muted-foreground">Svar</p>
                                <p className="text-xs text-green-600">
                                  {selectedCampaign.opens > 0 
                                    ? `${Math.round((selectedCampaign.replies / selectedCampaign.opens) * 100)}%`
                                    : '0%'}
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center">
                                <CalendarCheck className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{selectedCampaign.meetings}</p>
                                <p className="text-xs text-muted-foreground">Møter booket</p>
                                <p className="text-xs text-green-600">
                                  {selectedCampaign.replies > 0 
                                    ? `${Math.round((selectedCampaign.meetings / selectedCampaign.replies) * 100)}%`
                                    : '0%'}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <h4 className="font-medium mb-3">Handlinger</h4>
                        <div className="flex gap-2">
                          <Button variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Rediger
                          </Button>
                          <Button variant="outline">
                            <Copy className="h-4 w-4 mr-2" />
                            Dupliser
                          </Button>
                          <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Eksporter
                          </Button>
                          <Button variant="outline" className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Slett
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Rocket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Velg en kampanje</h3>
                    <p className="text-sm text-muted-foreground">
                      Velg en kampanje fra listen for å se detaljer
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Prospects Tab */}
        <TabsContent value="prospects" className="flex-1 p-4">
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="space-y-4">
              {prospects.map((prospect: Prospect) => (
                <Card key={prospect.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{prospect.company}</h4>
                          <Badge className={`${getStatusColor(prospect.status)} text-white`}>
                            {prospect.status}
                          </Badge>
                          <Badge variant="outline">
                            Score: {Math.round(prospect.score * 100)}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Kontakt</p>
                            <p>{prospect.contact_name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">E-post</p>
                            <p>{prospect.email}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Bransje</p>
                            <p>{prospect.industry}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => mineHooks.mutate(prospect.id)}
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          Mine Hooks
                        </Button>
                        <Button size="sm">
                          <Send className="h-4 w-4 mr-2" />
                          Send melding
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="flex-1 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle leads</SelectItem>
                  <SelectItem value="new">Nye</SelectItem>
                  <SelectItem value="qualified">Kvalifiserte</SelectItem>
                  <SelectItem value="contacted">Kontaktet</SelectItem>
                  <SelectItem value="opportunity">Mulighet</SelectItem>
                  <SelectItem value="customer">Kunde</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Søk leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Legg til lead
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-center text-muted-foreground py-8">
                    Ingen leads ennå. Importer eller legg til leads for å komme i gang.
                  </p>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Hook Mining Tab */}
        <TabsContent value="hooks" className="flex-1 p-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Hook Mining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        Hva er Hook Mining?
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                        Hook Mining bruker AI til å finne personaliserte innfallsvinkler for hver prospect.
                        Systemet søker etter triggere som finansiering, priser, ansettelser, produktlanseringer
                        og andre relevante hendelser som kan brukes for å starte en samtale.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <Trophy className="h-8 w-8 text-amber-500 mb-2" />
                      <h4 className="font-medium">Vant pris</h4>
                      <p className="text-xs text-muted-foreground">
                        Gratulere med nylig vunnet pris eller anerkjennelse
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                      <h4 className="font-medium">Finansiering</h4>
                      <p className="text-xs text-muted-foreground">
                        Referere til nylig finansieringsrunde
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <Users className="h-8 w-8 text-blue-500 mb-2" />
                      <h4 className="font-medium">Ny ansettelse</h4>
                      <p className="text-xs text-muted-foreground">
                        Gratulere med ny nøkkelansettelse
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Button className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Hook Mining for alle prospects
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="flex-1 p-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Meldingsgenerator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Velg mal</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg meldingsmal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cold">Cold outreach</SelectItem>
                      <SelectItem value="followup">Oppfølging</SelectItem>
                      <SelectItem value="meeting">Møteforespørsel</SelectItem>
                      <SelectItem value="breakup">Break-up e-post</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tone</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Profesjonell</SelectItem>
                      <SelectItem value="casual">Uformell</SelectItem>
                      <SelectItem value="friendly">Vennlig</SelectItem>
                      <SelectItem value="urgent">Haster</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Forhåndsvisning</Label>
                  <Textarea 
                    placeholder="Generert melding vises her..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generer med AI
                  </Button>
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Ny variant
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="flex-1 p-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Konverteringstunnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Sendt</span>
                      <span className="text-sm font-medium">100%</span>
                    </div>
                    <Progress value={100} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Åpnet</span>
                      <span className="text-sm font-medium">70%</span>
                    </div>
                    <Progress value={70} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Svart</span>
                      <span className="text-sm font-medium">14%</span>
                    </div>
                    <Progress value={14} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Møte booket</span>
                      <span className="text-sm font-medium">4%</span>
                    </div>
                    <Progress value={4} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Beste hooks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Vant pris</span>
                    </div>
                    <Badge>32% svarrate</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Finansiering</span>
                    </div>
                    <Badge>28% svarrate</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Ny ansettelse</span>
                    </div>
                    <Badge>24% svarrate</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Campaign Modal */}
      {showNewCampaignModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-[500px]">
            <CardHeader>
              <CardTitle>Opprett ny kampanje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Kampanjenavn</Label>
                <Input placeholder="F.eks. Q1 2025 - Enterprise prospects" />
              </div>
              <div>
                <Label>Hook-typer</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Finansiering', 'Priser', 'Ansettelser', 'Produktlansering'].map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <input type="checkbox" id={type} />
                      <Label htmlFor={type} className="text-sm cursor-pointer">{type}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Maks alder på hooks (dager)</Label>
                <Input type="number" placeholder="30" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewCampaignModal(false)}>
                  Avbryt
                </Button>
                <Button>
                  Opprett kampanje
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-[500px]">
            <CardHeader>
              <CardTitle>Importer leads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Dra og slipp CSV-fil her, eller klikk for å velge
                </p>
                <p className="text-xs text-muted-foreground">
                  Støtter CSV med kolonner: navn, selskap, e-post, telefon
                </p>
                <Button variant="outline" size="sm" className="mt-4">
                  Velg fil
                </Button>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowImportModal(false)}>
                  Avbryt
                </Button>
                <Button>
                  Importer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}