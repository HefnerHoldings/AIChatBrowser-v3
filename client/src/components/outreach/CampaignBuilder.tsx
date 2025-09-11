import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Save,
  Play,
  Pause,
  Trash2,
  Copy,
  Settings,
  Users,
  MessageSquare,
  Calendar,
  Target,
  Filter,
  ChevronRight,
  Mail,
  Smartphone,
  Linkedin,
  MessageCircle,
  Zap,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info,
  Edit,
  Eye,
  Download,
  Upload,
  Sparkles,
  Brain,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Search
} from 'lucide-react';

interface Campaign {
  campaign_id?: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  type: 'outbound' | 'nurture' | 're-engagement';
  channels: string[];
  target_criteria: {
    industries?: string[];
    company_sizes?: string[];
    locations?: string[];
    tags?: string[];
    score_min?: number;
    score_max?: number;
  };
  schedule_config: {
    start_date?: string;
    end_date?: string;
    daily_limit?: number;
    send_days?: number[];
    send_hours?: { start: string; end: string };
    timezone?: string;
  };
  message_templates: any[];
  max_prospects?: number;
  daily_limit?: number;
  budget?: number;
}

interface CampaignBuilderProps {
  showNewCampaign: boolean;
  setShowNewCampaign: (show: boolean) => void;
}

export function CampaignBuilder({ showNewCampaign, setShowNewCampaign }: CampaignBuilderProps) {
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentStep, setCurrentStep] = useState(0);

  // New campaign state
  const [newCampaign, setNewCampaign] = useState<Campaign>({
    name: '',
    description: '',
    status: 'draft',
    type: 'outbound',
    channels: ['email'],
    target_criteria: {},
    schedule_config: {
      daily_limit: 50,
      send_days: [1, 2, 3, 4, 5], // Monday to Friday
      send_hours: { start: '09:00', end: '17:00' },
      timezone: 'Europe/Oslo'
    },
    message_templates: []
  });

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['/api/outreach/campaigns'],
    refetchInterval: 5000
  });

  // Create campaign mutation
  const createCampaign = useMutation({
    mutationFn: async (campaign: Campaign) => {
      return await apiRequest('/api/outreach/campaigns', 'POST', campaign);
    },
    onSuccess: () => {
      toast({
        title: "Kampanje opprettet",
        description: "Kampanjen er klar til konfigurering"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/campaigns'] });
      setShowNewCampaign(false);
      setNewCampaign({
        name: '',
        description: '',
        status: 'draft',
        type: 'outbound',
        channels: ['email'],
        target_criteria: {},
        schedule_config: {
          daily_limit: 50,
          send_days: [1, 2, 3, 4, 5],
          send_hours: { start: '09:00', end: '17:00' },
          timezone: 'Europe/Oslo'
        },
        message_templates: []
      });
    }
  });

  // Start campaign mutation
  const startCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      return await apiRequest(`/api/outreach/campaigns/${campaignId}/start`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Kampanje startet",
        description: "Kampanjen kjører nå automatisk"
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500',
      paused: 'bg-yellow-500',
      draft: 'bg-gray-500',
      completed: 'bg-blue-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const steps = [
    { title: 'Grunnleggende', icon: Info },
    { title: 'Målgruppe', icon: Target },
    { title: 'Kanaler', icon: MessageSquare },
    { title: 'Tidsplan', icon: Calendar },
    { title: 'Gjennomgang', icon: CheckCircle }
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Kampanjebygger</h2>
            <p className="text-muted-foreground">Opprett og administrer outreach-kampanjer</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Importer kampanje
            </Button>
            <Button 
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-blue-500"
              onClick={() => setShowNewCampaign(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ny kampanje
            </Button>
          </div>
        </div>

        {/* Campaign List and Details */}
        <div className="grid grid-cols-12 gap-6">
          {/* Campaign List */}
          <div className="col-span-4 space-y-4">
            {/* Search and Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk kampanjer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-campaigns"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32" data-testid="select-filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="active">Aktive</SelectItem>
                  <SelectItem value="paused">Pauset</SelectItem>
                  <SelectItem value="draft">Utkast</SelectItem>
                  <SelectItem value="completed">Fullført</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campaign Cards */}
            <ScrollArea className="h-[calc(100vh-350px)]">
              <div className="space-y-3">
                {campaigns.map((campaign: any) => (
                  <Card 
                    key={campaign.campaign_id}
                    className={`cursor-pointer transition-all ${
                      selectedCampaign?.campaign_id === campaign.campaign_id 
                        ? 'ring-2 ring-primary' 
                        : 'hover:shadow-lg'
                    }`}
                    onClick={() => setSelectedCampaign(campaign)}
                    data-testid={`card-campaign-${campaign.campaign_id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold">{campaign.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {campaign.description}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(campaign.status)} text-white`}>
                          {campaign.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        {campaign.channels?.map((channel: string) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel === 'email' && <Mail className="h-3 w-3 mr-1" />}
                            {channel === 'sms' && <Smartphone className="h-3 w-3 mr-1" />}
                            {channel === 'linkedin' && <Linkedin className="h-3 w-3 mr-1" />}
                            {channel}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="text-muted-foreground">Prospects</p>
                          <p className="font-semibold">{campaign.max_prospects || 0}</p>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="text-muted-foreground">Daglig grense</p>
                          <p className="font-semibold">{campaign.daily_limit || 50}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          {campaign.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                pauseCampaign.mutate(campaign.campaign_id);
                              }}
                              data-testid={`button-pause-${campaign.campaign_id}`}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : campaign.status === 'draft' || campaign.status === 'paused' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                startCampaign.mutate(campaign.campaign_id);
                              }}
                              data-testid={`button-start-${campaign.campaign_id}`}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button size="sm" variant="ghost" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedCampaign.name}</CardTitle>
                      <CardDescription>{selectedCampaign.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Forhåndsvis
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Eksporter
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview">
                    <TabsList>
                      <TabsTrigger value="overview">Oversikt</TabsTrigger>
                      <TabsTrigger value="targeting">Målgruppe</TabsTrigger>
                      <TabsTrigger value="messages">Meldinger</TabsTrigger>
                      <TabsTrigger value="schedule">Tidsplan</TabsTrigger>
                      <TabsTrigger value="performance">Ytelse</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Kampanjetype</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Badge variant="outline">{selectedCampaign.type}</Badge>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Kanaler</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-2">
                              {selectedCampaign.channels?.map((channel: string) => (
                                <Badge key={channel} variant="secondary">
                                  {channel}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="targeting" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Målgruppekriterier</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {selectedCampaign.target_criteria?.industries && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Bransjer:</span>
                              <div className="flex gap-1">
                                {selectedCampaign.target_criteria.industries.map((ind: string) => (
                                  <Badge key={ind} variant="outline">{ind}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedCampaign.target_criteria?.locations && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Lokasjoner:</span>
                              <div className="flex gap-1">
                                {selectedCampaign.target_criteria.locations.map((loc: string) => (
                                  <Badge key={loc} variant="outline">{loc}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="messages" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Meldingsmaler</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {selectedCampaign.message_templates?.length || 0} maler konfigurert
                          </p>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="schedule" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Sendeplan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Daglig grense:</span>
                            <span className="text-sm font-medium">
                              {selectedCampaign.schedule_config?.daily_limit || 50} meldinger
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Sendetider:</span>
                            <span className="text-sm font-medium">
                              {selectedCampaign.schedule_config?.send_hours?.start || '09:00'} - {selectedCampaign.schedule_config?.send_hours?.end || '17:00'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Tidssone:</span>
                            <span className="text-sm font-medium">
                              {selectedCampaign.schedule_config?.timezone || 'Europe/Oslo'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-4">
                      <div className="flex items-center justify-center h-64 text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mr-4" />
                        <span>Ytelsesdata vises når kampanjen er aktiv</span>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Velg en kampanje</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Velg en kampanje fra listen for å se detaljer
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-purple-500 to-blue-500"
                    onClick={() => setShowNewCampaign(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Opprett ny kampanje
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* New Campaign Dialog */}
      <Dialog open={showNewCampaign} onOpenChange={setShowNewCampaign}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Opprett ny kampanje</DialogTitle>
            <DialogDescription>
              Konfigurer din nye outreach-kampanje steg for steg
            </DialogDescription>
          </DialogHeader>

          {/* Stepper */}
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= index 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <step.icon className="h-5 w-5" />
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-5 w-5 mx-2 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="space-y-4">
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="campaign-name">Kampanjenavn</Label>
                  <Input
                    id="campaign-name"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    placeholder="F.eks. Q1 2025 - SaaS Outreach"
                    data-testid="input-campaign-name"
                  />
                </div>
                <div>
                  <Label htmlFor="campaign-description">Beskrivelse</Label>
                  <Textarea
                    id="campaign-description"
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                    placeholder="Beskriv kampanjens mål og strategi"
                    rows={3}
                    data-testid="textarea-campaign-description"
                  />
                </div>
                <div>
                  <Label htmlFor="campaign-type">Kampanjetype</Label>
                  <Select 
                    value={newCampaign.type} 
                    onValueChange={(value: any) => setNewCampaign({ ...newCampaign, type: value })}
                  >
                    <SelectTrigger id="campaign-type" data-testid="select-campaign-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outbound">Outbound - Nye prospects</SelectItem>
                      <SelectItem value="nurture">Nurture - Eksisterende leads</SelectItem>
                      <SelectItem value="re-engagement">Re-engagement - Inaktive kontakter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Bransjer</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['Technology', 'SaaS', 'E-commerce', 'Healthcare', 'Finance', 'Education'].map((industry) => (
                      <Badge
                        key={industry}
                        variant={newCampaign.target_criteria.industries?.includes(industry) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const industries = newCampaign.target_criteria.industries || [];
                          if (industries.includes(industry)) {
                            setNewCampaign({
                              ...newCampaign,
                              target_criteria: {
                                ...newCampaign.target_criteria,
                                industries: industries.filter(i => i !== industry)
                              }
                            });
                          } else {
                            setNewCampaign({
                              ...newCampaign,
                              target_criteria: {
                                ...newCampaign.target_criteria,
                                industries: [...industries, industry]
                              }
                            });
                          }
                        }}
                      >
                        {industry}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Firmastørrelse</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['1-10', '11-50', '51-200', '201-500', '500+'].map((size) => (
                      <Badge
                        key={size}
                        variant={newCampaign.target_criteria.company_sizes?.includes(size) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const sizes = newCampaign.target_criteria.company_sizes || [];
                          if (sizes.includes(size)) {
                            setNewCampaign({
                              ...newCampaign,
                              target_criteria: {
                                ...newCampaign.target_criteria,
                                company_sizes: sizes.filter(s => s !== size)
                              }
                            });
                          } else {
                            setNewCampaign({
                              ...newCampaign,
                              target_criteria: {
                                ...newCampaign.target_criteria,
                                company_sizes: [...sizes, size]
                              }
                            });
                          }
                        }}
                      >
                        {size} ansatte
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Lead score (minimum)</Label>
                  <Slider
                    value={[newCampaign.target_criteria.score_min || 0]}
                    onValueChange={(value) => setNewCampaign({
                      ...newCampaign,
                      target_criteria: {
                        ...newCampaign.target_criteria,
                        score_min: value[0] / 100
                      }
                    })}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                  <span className="text-sm text-muted-foreground">
                    {((newCampaign.target_criteria.score_min || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>Velg kanaler</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <Card 
                      className={`cursor-pointer transition-all ${
                        newCampaign.channels.includes('email') ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => {
                        if (newCampaign.channels.includes('email')) {
                          setNewCampaign({
                            ...newCampaign,
                            channels: newCampaign.channels.filter(c => c !== 'email')
                          });
                        } else {
                          setNewCampaign({
                            ...newCampaign,
                            channels: [...newCampaign.channels, 'email']
                          });
                        }
                      }}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <Mail className="h-6 w-6 text-blue-500" />
                          <div>
                            <p className="font-medium">E-post</p>
                            <p className="text-xs text-muted-foreground">SendGrid-integrasjon</p>
                          </div>
                        </div>
                        {newCampaign.channels.includes('email') && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer transition-all ${
                        newCampaign.channels.includes('sms') ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => {
                        if (newCampaign.channels.includes('sms')) {
                          setNewCampaign({
                            ...newCampaign,
                            channels: newCampaign.channels.filter(c => c !== 'sms')
                          });
                        } else {
                          setNewCampaign({
                            ...newCampaign,
                            channels: [...newCampaign.channels, 'sms']
                          });
                        }
                      }}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-6 w-6 text-green-500" />
                          <div>
                            <p className="font-medium">SMS</p>
                            <p className="text-xs text-muted-foreground">Twilio-integrasjon</p>
                          </div>
                        </div>
                        {newCampaign.channels.includes('sms') && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer transition-all ${
                        newCampaign.channels.includes('linkedin') ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => {
                        if (newCampaign.channels.includes('linkedin')) {
                          setNewCampaign({
                            ...newCampaign,
                            channels: newCampaign.channels.filter(c => c !== 'linkedin')
                          });
                        } else {
                          setNewCampaign({
                            ...newCampaign,
                            channels: [...newCampaign.channels, 'linkedin']
                          });
                        }
                      }}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <Linkedin className="h-6 w-6 text-blue-600" />
                          <div>
                            <p className="font-medium">LinkedIn</p>
                            <p className="text-xs text-muted-foreground">Automatisert outreach</p>
                          </div>
                        </div>
                        {newCampaign.channels.includes('linkedin') && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer transition-all ${
                        newCampaign.channels.includes('whatsapp') ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => {
                        if (newCampaign.channels.includes('whatsapp')) {
                          setNewCampaign({
                            ...newCampaign,
                            channels: newCampaign.channels.filter(c => c !== 'whatsapp')
                          });
                        } else {
                          setNewCampaign({
                            ...newCampaign,
                            channels: [...newCampaign.channels, 'whatsapp']
                          });
                        }
                      }}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-6 w-6 text-green-600" />
                          <div>
                            <p className="font-medium">WhatsApp</p>
                            <p className="text-xs text-muted-foreground">Business API</p>
                          </div>
                        </div>
                        {newCampaign.channels.includes('whatsapp') && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="daily-limit">Daglig sendegrense</Label>
                  <Input
                    id="daily-limit"
                    type="number"
                    value={newCampaign.schedule_config.daily_limit}
                    onChange={(e) => setNewCampaign({
                      ...newCampaign,
                      schedule_config: {
                        ...newCampaign.schedule_config,
                        daily_limit: parseInt(e.target.value)
                      }
                    })}
                    data-testid="input-daily-limit"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maksimalt antall meldinger som sendes per dag
                  </p>
                </div>
                <div>
                  <Label>Sendedager</Label>
                  <div className="flex gap-2 mt-2">
                    {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map((day, index) => (
                      <Badge
                        key={day}
                        variant={newCampaign.schedule_config.send_days?.includes(index + 1) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const days = newCampaign.schedule_config.send_days || [];
                          if (days.includes(index + 1)) {
                            setNewCampaign({
                              ...newCampaign,
                              schedule_config: {
                                ...newCampaign.schedule_config,
                                send_days: days.filter(d => d !== index + 1)
                              }
                            });
                          } else {
                            setNewCampaign({
                              ...newCampaign,
                              schedule_config: {
                                ...newCampaign.schedule_config,
                                send_days: [...days, index + 1].sort()
                              }
                            });
                          }
                        }}
                      >
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="send-start">Sendetid start</Label>
                    <Input
                      id="send-start"
                      type="time"
                      value={newCampaign.schedule_config.send_hours?.start}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        schedule_config: {
                          ...newCampaign.schedule_config,
                          send_hours: {
                            ...newCampaign.schedule_config.send_hours!,
                            start: e.target.value
                          }
                        }
                      })}
                      data-testid="input-send-start"
                    />
                  </div>
                  <div>
                    <Label htmlFor="send-end">Sendetid slutt</Label>
                    <Input
                      id="send-end"
                      type="time"
                      value={newCampaign.schedule_config.send_hours?.end}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        schedule_config: {
                          ...newCampaign.schedule_config,
                          send_hours: {
                            ...newCampaign.schedule_config.send_hours!,
                            end: e.target.value
                          }
                        }
                      })}
                      data-testid="input-send-end"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Kampanjeoppsummering</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Navn:</span>
                      <span className="text-sm font-medium">{newCampaign.name || 'Ikke angitt'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Type:</span>
                      <Badge variant="outline">{newCampaign.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Kanaler:</span>
                      <div className="flex gap-1">
                        {newCampaign.channels.map(channel => (
                          <Badge key={channel} variant="secondary">{channel}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Daglig grense:</span>
                      <span className="text-sm font-medium">{newCampaign.schedule_config.daily_limit} meldinger</span>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-900 dark:text-green-100">
                    Kampanjen er klar til å opprettes. Du kan redigere detaljer senere.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(currentStep - 1)}
                  data-testid="button-previous-step"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Tilbake
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowNewCampaign(false);
                  setCurrentStep(0);
                }}
                data-testid="button-cancel"
              >
                Avbryt
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button 
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={currentStep === 0 && !newCampaign.name}
                  data-testid="button-next-step"
                >
                  Neste
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    createCampaign.mutate(newCampaign);
                    setCurrentStep(0);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-blue-500"
                  disabled={!newCampaign.name || newCampaign.channels.length === 0}
                  data-testid="button-create-campaign"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Opprett kampanje
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}