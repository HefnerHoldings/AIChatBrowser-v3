import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Zap,
  TrendingUp,
  Trophy,
  Target,
  BarChart3,
  Eye,
  MousePointer,
  MessageSquare,
  Calendar,
  Plus,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  RefreshCw,
  Download,
  Copy,
  Edit,
  Trash2
} from 'lucide-react';

interface ABTest {
  test_id: string;
  campaign_id: string;
  campaign_name: string;
  name: string;
  variant_a: {
    id: string;
    name: string;
    subject?: string;
    body: string;
    metrics: {
      sent: number;
      opens: number;
      clicks: number;
      replies: number;
    };
  };
  variant_b: {
    id: string;
    name: string;
    subject?: string;
    body: string;
    metrics: {
      sent: number;
      opens: number;
      clicks: number;
      replies: number;
    };
  };
  metric_type: 'open_rate' | 'click_rate' | 'reply_rate';
  sample_size: number;
  confidence_level: number;
  statistical_significance: number;
  winner?: 'A' | 'B';
  status: 'draft' | 'running' | 'completed' | 'cancelled';
  started_at?: Date;
  completed_at?: Date;
}

export function ABTestingPanel() {
  const { toast } = useToast();
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [showNewTest, setShowNewTest] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const [newTest, setNewTest] = useState({
    name: '',
    campaign_id: '',
    metric_type: 'open_rate' as const,
    sample_size: 100,
    confidence_level: 95
  });

  // Fetch A/B tests
  const { data: abTests = [], isLoading } = useQuery<ABTest[]>({
    queryKey: ['/api/outreach/ab-tests'],
    queryFn: async () => {
      // Mock data for now
      return [
        {
          test_id: '1',
          campaign_id: 'campaign-1',
          campaign_name: 'Q1 2025 - SaaS Outreach',
          name: 'Emnelinje test - Personlig vs. Profesjonell',
          variant_a: {
            id: 'var-a-1',
            name: 'Personlig',
            subject: 'Gratulerer {{first_name}}! 🎉',
            body: 'Hei {{first_name}}, så at {{company}} nylig...',
            metrics: {
              sent: 500,
              opens: 245,
              clicks: 67,
              replies: 34
            }
          },
          variant_b: {
            id: 'var-b-1',
            name: 'Profesjonell',
            subject: 'Angående {{company}}s nylige suksess',
            body: 'Kjære {{first_name}}, jeg kontakter deg angående...',
            metrics: {
              sent: 500,
              opens: 189,
              clicks: 45,
              replies: 22
            }
          },
          metric_type: 'open_rate',
          sample_size: 1000,
          confidence_level: 95,
          statistical_significance: 98.7,
          winner: 'A',
          status: 'completed',
          started_at: new Date('2025-01-10'),
          completed_at: new Date('2025-01-15')
        },
        {
          test_id: '2',
          campaign_id: 'campaign-2',
          campaign_name: 'Review Winners Norge',
          name: 'CTA test - Møte vs. Demo',
          variant_a: {
            id: 'var-a-2',
            name: 'Møte CTA',
            subject: 'Gratulerer med anmeldelsen!',
            body: '...Kan vi ta et kort møte neste uke?',
            metrics: {
              sent: 200,
              opens: 134,
              clicks: 28,
              replies: 18
            }
          },
          variant_b: {
            id: 'var-b-2',
            name: 'Demo CTA',
            subject: 'Gratulerer med anmeldelsen!',
            body: '...Interessert i en rask demo?',
            metrics: {
              sent: 200,
              opens: 128,
              clicks: 34,
              replies: 14
            }
          },
          metric_type: 'reply_rate',
          sample_size: 400,
          confidence_level: 95,
          statistical_significance: 72.3,
          status: 'running',
          started_at: new Date('2025-01-12')
        }
      ];
    }
  });

  // Create A/B test mutation
  const createABTest = useMutation({
    mutationFn: async (test: any) => {
      return await apiRequest('/api/outreach/ab-tests', 'POST', test);
    },
    onSuccess: () => {
      toast({
        title: "A/B test opprettet",
        description: "Testen er klar til å kjøres"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/ab-tests'] });
      setShowNewTest(false);
    }
  });

  // Start test mutation
  const startTest = useMutation({
    mutationFn: async (testId: string) => {
      return await apiRequest(`/api/outreach/ab-tests/${testId}/start`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Test startet",
        description: "A/B testen kjører nå"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/ab-tests'] });
    }
  });

  // Stop test mutation
  const stopTest = useMutation({
    mutationFn: async (testId: string) => {
      return await apiRequest(`/api/outreach/ab-tests/${testId}/stop`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Test stoppet",
        description: "A/B testen er avsluttet"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/ab-tests'] });
    }
  });

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return 0;
    return ((numerator / denominator) * 100).toFixed(1);
  };

  const getMetricValue = (variant: any, metricType: string) => {
    switch (metricType) {
      case 'open_rate':
        return calculateRate(variant.metrics.opens, variant.metrics.sent);
      case 'click_rate':
        return calculateRate(variant.metrics.clicks, variant.metrics.opens);
      case 'reply_rate':
        return calculateRate(variant.metrics.replies, variant.metrics.sent);
      default:
        return '0';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'draft': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredTests = abTests.filter(test => 
    filterStatus === 'all' || test.status === filterStatus
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">A/B Testing</h2>
            <p className="text-muted-foreground">Test og optimaliser meldingsvarianter</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32" data-testid="select-filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="running">Kjører</SelectItem>
                <SelectItem value="completed">Fullført</SelectItem>
                <SelectItem value="draft">Utkast</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              className="bg-gradient-to-r from-purple-500 to-blue-500"
              onClick={() => setShowNewTest(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ny A/B test
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Aktive tester</p>
                  <p className="text-2xl font-bold">
                    {abTests.filter(t => t.status === 'running').length}
                  </p>
                </div>
                <Zap className="h-5 w-5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Fullførte tester</p>
                  <p className="text-2xl font-bold">
                    {abTests.filter(t => t.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Gj.snitt løft</p>
                  <p className="text-2xl font-bold">+23%</p>
                </div>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Signifikante</p>
                  <p className="text-2xl font-bold">
                    {abTests.filter(t => t.statistical_significance > 95).length}
                  </p>
                </div>
                <Trophy className="h-5 w-5 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test List */}
        <div className="space-y-4">
          {filteredTests.map((test) => (
            <Card key={test.test_id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                    <CardDescription>{test.campaign_name}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusColor(test.status)} text-white`}>
                      {test.status === 'running' ? 'Kjører' :
                       test.status === 'completed' ? 'Fullført' :
                       test.status === 'draft' ? 'Utkast' :
                       'Avbrutt'}
                    </Badge>
                    {test.winner && (
                      <Badge variant="outline" className="border-green-500 text-green-600">
                        <Trophy className="h-3 w-3 mr-1" />
                        Variant {test.winner} vant
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {/* Variant A */}
                  <div className={`space-y-3 p-4 rounded-lg border-2 ${
                    test.winner === 'A' ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-border'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                          A
                        </div>
                        {test.variant_a.name}
                      </h4>
                      {test.winner === 'A' && <Trophy className="h-4 w-4 text-green-500" />}
                    </div>
                    
                    {test.variant_a.subject && (
                      <div>
                        <p className="text-xs text-muted-foreground">Emnelinje:</p>
                        <p className="text-sm">{test.variant_a.subject}</p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Sendt</span>
                        <span className="text-sm font-medium">{test.variant_a.metrics.sent}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Åpningsrate</span>
                        <Badge variant="secondary">
                          {calculateRate(test.variant_a.metrics.opens, test.variant_a.metrics.sent)}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Klikkrate</span>
                        <Badge variant="secondary">
                          {calculateRate(test.variant_a.metrics.clicks, test.variant_a.metrics.opens)}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Svarrate</span>
                        <Badge variant="secondary">
                          {calculateRate(test.variant_a.metrics.replies, test.variant_a.metrics.sent)}%
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium">
                        {test.metric_type === 'open_rate' ? 'Åpningsrate' :
                         test.metric_type === 'click_rate' ? 'Klikkrate' :
                         'Svarrate'}:
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {getMetricValue(test.variant_a, test.metric_type)}%
                      </p>
                    </div>
                  </div>

                  {/* Variant B */}
                  <div className={`space-y-3 p-4 rounded-lg border-2 ${
                    test.winner === 'B' ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-border'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
                          B
                        </div>
                        {test.variant_b.name}
                      </h4>
                      {test.winner === 'B' && <Trophy className="h-4 w-4 text-green-500" />}
                    </div>
                    
                    {test.variant_b.subject && (
                      <div>
                        <p className="text-xs text-muted-foreground">Emnelinje:</p>
                        <p className="text-sm">{test.variant_b.subject}</p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Sendt</span>
                        <span className="text-sm font-medium">{test.variant_b.metrics.sent}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Åpningsrate</span>
                        <Badge variant="secondary">
                          {calculateRate(test.variant_b.metrics.opens, test.variant_b.metrics.sent)}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Klikkrate</span>
                        <Badge variant="secondary">
                          {calculateRate(test.variant_b.metrics.clicks, test.variant_b.metrics.opens)}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Svarrate</span>
                        <Badge variant="secondary">
                          {calculateRate(test.variant_b.metrics.replies, test.variant_b.metrics.sent)}%
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium">
                        {test.metric_type === 'open_rate' ? 'Åpningsrate' :
                         test.metric_type === 'click_rate' ? 'Klikkrate' :
                         'Svarrate'}:
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {getMetricValue(test.variant_b, test.metric_type)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statistical Significance */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Statistisk signifikans</span>
                    <span className="text-sm font-medium">{test.statistical_significance}%</span>
                  </div>
                  <Progress value={test.statistical_significance} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {test.statistical_significance >= 95 
                      ? 'Resultatene er statistisk signifikante'
                      : 'Trenger mer data for signifikans'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    {test.started_at && (
                      <Badge variant="outline" className="text-xs">
                        Startet {new Date(test.started_at).toLocaleDateString('nb-NO')}
                      </Badge>
                    )}
                    {test.completed_at && (
                      <Badge variant="outline" className="text-xs">
                        Fullført {new Date(test.completed_at).toLocaleDateString('nb-NO')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {test.status === 'draft' && (
                      <Button 
                        size="sm"
                        onClick={() => startTest.mutate(test.test_id)}
                        data-testid={`button-start-test-${test.test_id}`}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start test
                      </Button>
                    )}
                    {test.status === 'running' && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => stopTest.mutate(test.test_id)}
                        data-testid={`button-stop-test-${test.test_id}`}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Stopp test
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Eksporter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTests.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen A/B tester</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start din første A/B test for å optimalisere meldingene dine
              </p>
              <Button 
                className="bg-gradient-to-r from-purple-500 to-blue-500"
                onClick={() => setShowNewTest(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Opprett første test
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* New Test Dialog */}
      <Dialog open={showNewTest} onOpenChange={setShowNewTest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opprett ny A/B test</DialogTitle>
            <DialogDescription>
              Test to varianter av meldingene dine
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="test-name">Testnavn</Label>
              <Input
                id="test-name"
                value={newTest.name}
                onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                placeholder="F.eks. Emnelinje test - Personlig vs. Profesjonell"
                data-testid="input-test-name"
              />
            </div>

            <div>
              <Label htmlFor="test-campaign">Kampanje</Label>
              <Select 
                value={newTest.campaign_id} 
                onValueChange={(value) => setNewTest({ ...newTest, campaign_id: value })}
              >
                <SelectTrigger id="test-campaign" data-testid="select-test-campaign">
                  <SelectValue placeholder="Velg kampanje" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="campaign-1">Q1 2025 - SaaS Outreach</SelectItem>
                  <SelectItem value="campaign-2">Review Winners Norge</SelectItem>
                  <SelectItem value="campaign-3">Product Launch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="test-metric">Primær målemetrikk</Label>
              <Select 
                value={newTest.metric_type} 
                onValueChange={(value: any) => setNewTest({ ...newTest, metric_type: value })}
              >
                <SelectTrigger id="test-metric" data-testid="select-test-metric">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open_rate">Åpningsrate</SelectItem>
                  <SelectItem value="click_rate">Klikkrate</SelectItem>
                  <SelectItem value="reply_rate">Svarrate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sample størrelse (per variant)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[newTest.sample_size]}
                  onValueChange={(value) => setNewTest({ ...newTest, sample_size: value[0] })}
                  max={1000}
                  min={50}
                  step={50}
                  className="flex-1"
                />
                <span className="w-20 text-sm font-medium">
                  {newTest.sample_size} kontakter
                </span>
              </div>
            </div>

            <div>
              <Label>Konfidensnivå</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[newTest.confidence_level]}
                  onValueChange={(value) => setNewTest({ ...newTest, confidence_level: value[0] })}
                  max={99}
                  min={90}
                  step={1}
                  className="flex-1"
                />
                <span className="w-12 text-sm font-medium">
                  {newTest.confidence_level}%
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTest(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={() => createABTest.mutate(newTest)}
              disabled={!newTest.name || !newTest.campaign_id}
              className="bg-gradient-to-r from-purple-500 to-blue-500"
              data-testid="button-create-test"
            >
              <Plus className="h-4 w-4 mr-2" />
              Opprett test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}