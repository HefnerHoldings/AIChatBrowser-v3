import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Users,
  Mail,
  Eye,
  MousePointer,
  MessageSquare,
  Calendar,
  DollarSign,
  Target,
  Award,
  Download,
  RefreshCw,
  Filter,
  ChevronRight,
  Activity,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface CampaignMetrics {
  campaign_id: string;
  campaign_name: string;
  total_prospects: number;
  messages_sent: number;
  messages_delivered: number;
  opens: number;
  clicks: number;
  replies: number;
  meetings_booked: number;
  deals_created: number;
  revenue_attributed: number;
  cost: number;
  roi: number;
  conversion_funnel: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    meeting: number;
    deal: number;
  };
  channel_breakdown: {
    email: { sent: number; opens: number; replies: number };
    sms: { sent: number; delivered: number; replies: number };
    linkedin: { sent: number; accepts: number; replies: number };
  };
  daily_metrics: Array<{
    date: string;
    sent: number;
    opens: number;
    replies: number;
  }>;
  top_performers: Array<{
    prospect_id: string;
    company: string;
    score: number;
    engagement: string;
  }>;
}

export function AnalyticsDashboard() {
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Fetch analytics data
  const { data: analyticsData, isLoading, refetch } = useQuery<CampaignMetrics>({
    queryKey: ['/api/outreach/analytics', { campaign: selectedCampaign, range: dateRange }],
    queryFn: async () => {
      // Mock data for now
      return {
        campaign_id: '1',
        campaign_name: 'Q1 2025 - SaaS Outreach',
        total_prospects: 1234,
        messages_sent: 3456,
        messages_delivered: 3312,
        opens: 2234,
        clicks: 445,
        replies: 178,
        meetings_booked: 34,
        deals_created: 12,
        revenue_attributed: 125000,
        cost: 2500,
        roi: 4900,
        conversion_funnel: {
          sent: 3456,
          delivered: 3312,
          opened: 2234,
          clicked: 445,
          replied: 178,
          meeting: 34,
          deal: 12
        },
        channel_breakdown: {
          email: { sent: 2456, opens: 1678, replies: 134 },
          sms: { sent: 500, delivered: 485, replies: 22 },
          linkedin: { sent: 500, accepts: 234, replies: 22 }
        },
        daily_metrics: [
          { date: '2025-01-10', sent: 234, opens: 167, replies: 12 },
          { date: '2025-01-11', sent: 256, opens: 189, replies: 18 },
          { date: '2025-01-12', sent: 278, opens: 201, replies: 22 },
          { date: '2025-01-13', sent: 289, opens: 234, replies: 28 },
          { date: '2025-01-14', sent: 301, opens: 245, replies: 31 },
          { date: '2025-01-15', sent: 312, opens: 267, replies: 34 },
          { date: '2025-01-16', sent: 334, opens: 289, replies: 38 }
        ],
        top_performers: [
          { prospect_id: '1', company: 'TechCorp AS', score: 0.92, engagement: 'Meeting booked' },
          { prospect_id: '2', company: 'InnovateTech', score: 0.87, engagement: 'Multiple replies' },
          { prospect_id: '3', company: 'DataSoft Norge', score: 0.83, engagement: 'High engagement' }
        ]
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return 0;
    return ((numerator / denominator) * 100).toFixed(1);
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const metrics = analyticsData ? [
    {
      label: 'Sendt',
      value: analyticsData.messages_sent,
      change: '+12.3',
      trend: 'up',
      icon: Mail,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Levert',
      value: analyticsData.messages_delivered,
      rate: calculateRate(analyticsData.messages_delivered, analyticsData.messages_sent),
      change: '+2.1',
      trend: 'up',
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'Åpnet',
      value: analyticsData.opens,
      rate: calculateRate(analyticsData.opens, analyticsData.messages_delivered),
      change: '+15.7',
      trend: 'up',
      icon: Eye,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      label: 'Klikket',
      value: analyticsData.clicks,
      rate: calculateRate(analyticsData.clicks, analyticsData.opens),
      change: '+8.4',
      trend: 'up',
      icon: MousePointer,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10'
    },
    {
      label: 'Svar',
      value: analyticsData.replies,
      rate: calculateRate(analyticsData.replies, analyticsData.messages_delivered),
      change: '+23.1',
      trend: 'up',
      icon: MessageSquare,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      label: 'Møter',
      value: analyticsData.meetings_booked,
      rate: calculateRate(analyticsData.meetings_booked, analyticsData.replies),
      change: '+31.2',
      trend: 'up',
      icon: Calendar,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    }
  ] : [];

  const funnelStages = analyticsData ? [
    { stage: 'Sendt', value: analyticsData.conversion_funnel.sent, percentage: 100 },
    { stage: 'Levert', value: analyticsData.conversion_funnel.delivered, percentage: calculateRate(analyticsData.conversion_funnel.delivered, analyticsData.conversion_funnel.sent) },
    { stage: 'Åpnet', value: analyticsData.conversion_funnel.opened, percentage: calculateRate(analyticsData.conversion_funnel.opened, analyticsData.conversion_funnel.sent) },
    { stage: 'Klikket', value: analyticsData.conversion_funnel.clicked, percentage: calculateRate(analyticsData.conversion_funnel.clicked, analyticsData.conversion_funnel.sent) },
    { stage: 'Svart', value: analyticsData.conversion_funnel.replied, percentage: calculateRate(analyticsData.conversion_funnel.replied, analyticsData.conversion_funnel.sent) },
    { stage: 'Møte', value: analyticsData.conversion_funnel.meeting, percentage: calculateRate(analyticsData.conversion_funnel.meeting, analyticsData.conversion_funnel.sent) },
    { stage: 'Deal', value: analyticsData.conversion_funnel.deal, percentage: calculateRate(analyticsData.conversion_funnel.deal, analyticsData.conversion_funnel.sent) }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Analyser kampanjeytelse og ROI</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-48" data-testid="select-campaign">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle kampanjer</SelectItem>
              <SelectItem value="1">Q1 2025 - SaaS Outreach</SelectItem>
              <SelectItem value="2">Review Winners Norge</SelectItem>
              <SelectItem value="3">Product Launch Campaign</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32" data-testid="select-date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Siste 7 dager</SelectItem>
              <SelectItem value="30d">Siste 30 dager</SelectItem>
              <SelectItem value="90d">Siste 90 dager</SelectItem>
              <SelectItem value="all">Alle</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Oppdater
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Eksporter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <div className={`p-1.5 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold">{metric.value.toLocaleString()}</p>
                {metric.rate && (
                  <p className="text-xs text-muted-foreground">{metric.rate}%</p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  {metric.trend === 'up' ? (
                    <ArrowUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {metric.change}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ROI Card */}
      {analyticsData && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              ROI & Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Inntekt generert</p>
                <p className="text-3xl font-bold text-green-600">
                  ${analyticsData.revenue_attributed.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kostnad</p>
                <p className="text-3xl font-bold">
                  ${analyticsData.cost.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ROI</p>
                <p className="text-3xl font-bold text-green-600">
                  {analyticsData.roi}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kostnad per møte</p>
                <p className="text-3xl font-bold">
                  ${analyticsData.meetings_booked > 0 
                    ? Math.round(analyticsData.cost / analyticsData.meetings_booked)
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funnel">Konverteringstrakt</TabsTrigger>
          <TabsTrigger value="channels">Kanalytelse</TabsTrigger>
          <TabsTrigger value="trends">Trender</TabsTrigger>
          <TabsTrigger value="engagement">Engasjement</TabsTrigger>
          <TabsTrigger value="performance">Top Performers</TabsTrigger>
        </TabsList>

        {/* Conversion Funnel */}
        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle>Konverteringstrakt</CardTitle>
              <CardDescription>
                Visualisering av prospect-reisen gjennom salgstrakten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelStages.map((stage, index) => (
                  <div key={stage.stage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-20 text-sm font-medium">{stage.stage}</div>
                        <Badge variant="secondary">{stage.value.toLocaleString()}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {stage.percentage}%
                      </span>
                    </div>
                    <Progress value={parseFloat(stage.percentage as string)} className="h-3" />
                    {index < funnelStages.length - 1 && (
                      <div className="flex items-center justify-center py-1">
                        <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channel Performance */}
        <TabsContent value="channels">
          <div className="grid grid-cols-3 gap-6">
            {analyticsData && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-blue-500" />
                      E-post
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sendt</span>
                      <span className="font-medium">{analyticsData.channel_breakdown.email.sent}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Åpnet</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{analyticsData.channel_breakdown.email.opens}</span>
                        <Badge variant="secondary">
                          {calculateRate(analyticsData.channel_breakdown.email.opens, analyticsData.channel_breakdown.email.sent)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Svar</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{analyticsData.channel_breakdown.email.replies}</span>
                        <Badge variant="secondary">
                          {calculateRate(analyticsData.channel_breakdown.email.replies, analyticsData.channel_breakdown.email.sent)}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                      SMS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sendt</span>
                      <span className="font-medium">{analyticsData.channel_breakdown.sms.sent}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Levert</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{analyticsData.channel_breakdown.sms.delivered}</span>
                        <Badge variant="secondary">
                          {calculateRate(analyticsData.channel_breakdown.sms.delivered, analyticsData.channel_breakdown.sms.sent)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Svar</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{analyticsData.channel_breakdown.sms.replies}</span>
                        <Badge variant="secondary">
                          {calculateRate(analyticsData.channel_breakdown.sms.replies, analyticsData.channel_breakdown.sms.sent)}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      LinkedIn
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sendt</span>
                      <span className="font-medium">{analyticsData.channel_breakdown.linkedin.sent}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Akseptert</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{analyticsData.channel_breakdown.linkedin.accepts}</span>
                        <Badge variant="secondary">
                          {calculateRate(analyticsData.channel_breakdown.linkedin.accepts, analyticsData.channel_breakdown.linkedin.sent)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Svar</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{analyticsData.channel_breakdown.linkedin.replies}</span>
                        <Badge variant="secondary">
                          {calculateRate(analyticsData.channel_breakdown.linkedin.replies, analyticsData.channel_breakdown.linkedin.sent)}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Daglige trender</CardTitle>
              <CardDescription>
                Aktivitet og engasjement over tid
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData && (
                <div className="space-y-4">
                  {/* Simple bar chart visualization */}
                  <div className="space-y-2">
                    {analyticsData.daily_metrics.map((day) => (
                      <div key={day.date} className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-2 text-sm text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('nb-NO', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="col-span-10 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-12">Sendt</span>
                            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-blue-500"
                                style={{ width: `${(day.sent / 400) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium w-10 text-right">{day.sent}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-12">Åpnet</span>
                            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-purple-500"
                                style={{ width: `${(day.opens / 400) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium w-10 text-right">{day.opens}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-12">Svar</span>
                            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-green-500"
                                style={{ width: `${(day.replies / 40) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium w-10 text-right">{day.replies}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Heatmap */}
        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Engasjement heatmap</CardTitle>
              <CardDescription>
                Beste tidspunkter for engasjement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Day/Hour heatmap */}
                <div className="grid grid-cols-8 gap-2">
                  <div></div>
                  {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map((day) => (
                    <div key={day} className="text-xs text-center text-muted-foreground">
                      {day}
                    </div>
                  ))}
                  {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((hour) => (
                    <>
                      <div key={`hour-${hour}`} className="text-xs text-muted-foreground">
                        {hour}:00
                      </div>
                      {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                        const intensity = Math.random(); // Mock data
                        return (
                          <div
                            key={`${day}-${hour}`}
                            className="aspect-square rounded"
                            style={{
                              backgroundColor: `rgba(147, 51, 234, ${intensity})`,
                            }}
                            title={`${Math.round(intensity * 100)}% engasjement`}
                          />
                        );
                      })}
                    </>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-purple-200"></div>
                    <span className="text-xs text-muted-foreground">Lav</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-purple-500"></div>
                    <span className="text-xs text-muted-foreground">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-purple-800"></div>
                    <span className="text-xs text-muted-foreground">Høy</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Performers */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>
                Prospects med høyest engasjement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData && (
                <div className="space-y-3">
                  {analyticsData.top_performers.map((performer, index) => (
                    <Card key={performer.prospect_id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{performer.company}</p>
                              <p className="text-sm text-muted-foreground">{performer.engagement}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-medium">Score</p>
                              <p className="text-2xl font-bold text-green-600">
                                {(performer.score * 100).toFixed(0)}%
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}