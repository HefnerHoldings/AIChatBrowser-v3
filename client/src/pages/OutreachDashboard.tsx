import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  Users,
  Target,
  BarChart3,
  MessageSquare,
  Calendar,
  Settings,
  Plus,
  Brain,
  Zap,
  Shield,
  TrendingUp,
  Trophy,
  Rocket,
  AlertCircle
} from 'lucide-react';

// Import Outreach Components
import { CampaignBuilder } from '@/components/outreach/CampaignBuilder';
import { ProspectList } from '@/components/outreach/ProspectList';
import { MessageEditor } from '@/components/outreach/MessageEditor';
import { AnalyticsDashboard } from '@/components/outreach/AnalyticsDashboard';
import { ChannelConfig } from '@/components/outreach/ChannelConfig';
import { ScheduleCalendar } from '@/components/outreach/ScheduleCalendar';
import { ABTestingPanel } from '@/components/outreach/ABTestingPanel';
import { ComplianceCenter } from '@/components/outreach/ComplianceCenter';

interface CampaignSummary {
  active: number;
  paused: number;
  draft: number;
  completed: number;
  totalProspects: number;
  totalSent: number;
  totalOpens: number;
  totalReplies: number;
  totalMeetings: number;
  conversionRate: number;
}

export default function OutreachDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  // Fetch campaign summary
  const { data: campaignSummary } = useQuery<CampaignSummary>({
    queryKey: ['/api/outreach/summary'],
    queryFn: async () => {
      // Mock data for now
      return {
        active: 5,
        paused: 2,
        draft: 3,
        completed: 12,
        totalProspects: 3456,
        totalSent: 12890,
        totalOpens: 8234,
        totalReplies: 456,
        totalMeetings: 78,
        conversionRate: 6.7
      };
    }
  });

  const stats = [
    {
      label: 'Aktive kampanjer',
      value: campaignSummary?.active || 0,
      icon: Rocket,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'Totalt prospects',
      value: campaignSummary?.totalProspects || 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Meldinger sendt',
      value: campaignSummary?.totalSent || 0,
      icon: Send,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      label: 'Svar mottatt',
      value: campaignSummary?.totalReplies || 0,
      icon: MessageSquare,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10'
    },
    {
      label: 'Møter booket',
      value: campaignSummary?.totalMeetings || 0,
      icon: Calendar,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      label: 'Konvertering',
      value: `${campaignSummary?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-green-500/5">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Send className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Outreach Engine</h1>
                <p className="text-sm text-muted-foreground">
                  AI-drevet salgsautomatisering og leadgenerering
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-2" />
                GDPR-modus
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

          {/* Stats Grid */}
          <div className="grid grid-cols-6 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <Tabs 
        defaultValue="overview" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div className="border-b px-6">
          <TabsList className="h-12 bg-transparent p-0 border-0">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Oversikt
            </TabsTrigger>
            <TabsTrigger 
              value="campaigns"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
            >
              <Rocket className="h-4 w-4 mr-2" />
              Kampanjer
            </TabsTrigger>
            <TabsTrigger 
              value="prospects"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
            >
              <Users className="h-4 w-4 mr-2" />
              Prospects
            </TabsTrigger>
            <TabsTrigger 
              value="messages"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Meldinger
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="schedule"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Tidsplan
            </TabsTrigger>
            <TabsTrigger 
              value="ab-testing"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
            >
              <Zap className="h-4 w-4 mr-2" />
              A/B Testing
            </TabsTrigger>
            <TabsTrigger 
              value="channels"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
            >
              <Settings className="h-4 w-4 mr-2" />
              Kanaler
            </TabsTrigger>
            <TabsTrigger 
              value="compliance"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
            >
              <Shield className="h-4 w-4 mr-2" />
              Compliance
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Active Campaigns */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Aktive kampanjer</span>
                  <Badge variant="default">{campaignSummary?.active || 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Q1 2025 - SaaS Outreach</span>
                    <Badge className="bg-green-500 text-white">Aktiv</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>245 prospects</span>
                    <span>•</span>
                    <span>67% åpnet</span>
                    <span>•</span>
                    <span>12% svar</span>
                  </div>
                </div>
                <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Review Winners Norge</span>
                    <Badge className="bg-green-500 text-white">Aktiv</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>178 prospects</span>
                    <span>•</span>
                    <span>72% åpnet</span>
                    <span>•</span>
                    <span>18% svar</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Hooks */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Ferske hooks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border rounded-lg border-purple-200 bg-purple-50 dark:bg-purple-950/30">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">TechCorp AS</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ny 5-stjernes anmeldelse på Trustpilot (2 dager siden)
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 border rounded-lg border-blue-200 bg-blue-50 dark:bg-blue-950/30">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">InnovateTech Norge</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Lanserte nytt AI-produkt (5 dager siden)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Hurtighandlinger</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Target className="h-4 w-4 mr-2" />
                  Importer nye prospects
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Brain className="h-4 w-4 mr-2" />
                  Kjør hook mining
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Generer meldinger med AI
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Eksporter rapport
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Kampanjeytelse siste 30 dager</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mr-4" />
                <span>Ytelsesdiagram vises her</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="flex-1 p-6">
          <CampaignBuilder 
            showNewCampaign={showNewCampaign}
            setShowNewCampaign={setShowNewCampaign}
          />
        </TabsContent>

        {/* Prospects Tab */}
        <TabsContent value="prospects" className="flex-1 p-6">
          <ProspectList />
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="flex-1 p-6">
          <MessageEditor />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="flex-1 p-6">
          <AnalyticsDashboard />
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="flex-1 p-6">
          <ScheduleCalendar />
        </TabsContent>

        {/* A/B Testing Tab */}
        <TabsContent value="ab-testing" className="flex-1 p-6">
          <ABTestingPanel />
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="flex-1 p-6">
          <ChannelConfig />
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="flex-1 p-6">
          <ComplianceCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
}