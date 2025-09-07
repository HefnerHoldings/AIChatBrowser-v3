import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ChevronRight,
  ChevronDown,
  Code,
  Database,
  Users,
  Building,
  Mail,
  Phone,
  Download,
  Upload,
  Filter,
  Search,
  BarChart,
  TrendingUp,
  Activity,
  Terminal,
  Bug,
  Cpu,
  HardDrive,
  Network,
  Shield,
  Lock,
  Key,
  FileCode,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Zap,
  Clock,
  Calendar,
  MapPin,
  DollarSign,
  Star,
  Globe,
  Linkedin,
  FileText,
  Copy,
  ExternalLink,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  score: number;
  status: string;
  source: string;
}

interface RightDeveloperSidebarProps {
  onExportData?: (format: string) => void;
  onRefreshData?: () => void;
  onFilterApply?: (filters: any) => void;
  onCodeGenerate?: (type: string) => void;
}

export function RightDeveloperSidebar({
  onExportData,
  onRefreshData,
  onFilterApply,
  onCodeGenerate
}: RightDeveloperSidebarProps) {
  const [activeTab, setActiveTab] = useState('data');
  const [expandedSections, setExpandedSections] = useState({
    leads: true,
    analytics: false,
    developer: false,
    monitoring: false,
    security: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Mock data
  const mockLeads: Lead[] = [
    {
      id: '1',
      company: 'TechCorp AS',
      contact: 'Ola Nordmann',
      email: 'ola@techcorp.no',
      phone: '+47 98765432',
      website: 'techcorp.no',
      location: 'Oslo',
      score: 85,
      status: 'qualified',
      source: 'LinkedIn'
    },
    {
      id: '2',
      company: 'InnovateLab',
      contact: 'Kari Hansen',
      email: 'kari@innovatelab.no',
      phone: '+47 91234567',
      website: 'innovatelab.no',
      location: 'Bergen',
      score: 72,
      status: 'new',
      source: 'Proff.no'
    },
    {
      id: '3',
      company: 'DataSoft Solutions',
      contact: 'Per Olsen',
      email: 'per@datasoft.no',
      phone: '+47 94567890',
      website: 'datasoft.no',
      location: 'Trondheim',
      score: 90,
      status: 'converted',
      source: 'Finn.no'
    }
  ];

  const stats = {
    totalLeads: mockLeads.length,
    qualified: mockLeads.filter(l => l.status === 'qualified').length,
    converted: mockLeads.filter(l => l.status === 'converted').length,
    avgScore: Math.round(mockLeads.reduce((acc, l) => acc + l.score, 0) / mockLeads.length),
    revenue: '250K NOK',
    conversionRate: '32%'
  };

  const performanceMetrics = {
    cpu: 45,
    memory: 67,
    network: 23,
    storage: 81
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleExport = (format: string) => {
    toast({
      title: 'Eksporterer data',
      description: `Eksporterer ${selectedLeads.length || 'alle'} leads som ${format.toUpperCase()}`
    });
    if (onExportData) {
      onExportData(format);
    }
  };

  const handleRefresh = () => {
    toast({
      title: 'Oppdaterer data',
      description: 'Henter siste data...'
    });
    if (onRefreshData) {
      onRefreshData();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-blue-500';
      case 'qualified': return 'text-green-500';
      case 'converted': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="h-full flex flex-col bg-background border-l">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">Developer Tools</h3>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-1">
          <Badge variant="outline">
            {mockLeads.length} Leads
          </Badge>
          <Badge variant="outline" className="text-green-500">
            {stats.qualified} Kvalifisert
          </Badge>
          <Badge variant="outline" className="text-purple-500">
            {stats.converted} Konvertert
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start px-4">
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="developer">Dev</TabsTrigger>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
        </TabsList>

        {/* Data Tab */}
        <TabsContent value="data" className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2">
                <Card className="p-2">
                  <div className="flex items-center justify-between">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-lg font-bold">{stats.totalLeads}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Totalt</p>
                </Card>
                <Card className="p-2">
                  <div className="flex items-center justify-between">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-lg font-bold">{stats.avgScore}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Snitt Score</p>
                </Card>
                <Card className="p-2">
                  <div className="flex items-center justify-between">
                    <DollarSign className="h-3 w-3 text-purple-500" />
                    <span className="text-lg font-bold">{stats.conversionRate}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Konvertering</p>
                </Card>
              </div>

              {/* Search & Filter */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Søk leads..."
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <Button size="sm" variant="outline">
                  <Filter className="h-3 w-3" />
                </Button>
              </div>

              {/* Leads List */}
              <Collapsible
                open={expandedSections.leads}
                onOpenChange={() => toggleSection('leads')}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-accent p-2 rounded">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Leads ({mockLeads.length})</span>
                  </div>
                  {expandedSections.leads ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="space-y-2">
                    {mockLeads.map((lead) => (
                      <Card 
                        key={lead.id}
                        className="p-2 cursor-pointer hover:bg-accent"
                        onClick={() => {
                          setSelectedLeads(prev =>
                            prev.includes(lead.id)
                              ? prev.filter(id => id !== lead.id)
                              : [...prev, lead.id]
                          );
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Building className="h-3 w-3" />
                              <span className="text-sm font-medium">{lead.company}</span>
                              <Badge variant="outline" className={`text-xs ${getStatusColor(lead.status)}`}>
                                {lead.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{lead.contact}</p>
                            <div className="flex gap-3 mt-1">
                              <span className="text-xs flex items-center gap-1">
                                <Mail className="h-2 w-2" />
                                {lead.email}
                              </span>
                              <span className="text-xs flex items-center gap-1">
                                <MapPin className="h-2 w-2" />
                                {lead.location}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getScoreColor(lead.score)}`}>
                              {lead.score}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {lead.source}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Export Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport('csv')}
                  className="flex-1"
                >
                  <Download className="h-3 w-3 mr-1" />
                  CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport('json')}
                  className="flex-1"
                >
                  <Download className="h-3 w-3 mr-1" />
                  JSON
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport('excel')}
                  className="flex-1"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Excel
                </Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Card className="p-3">
                <h4 className="font-medium text-sm mb-3">Konverteringsrate</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Leads → Kvalifisert</span>
                    <span className="font-medium">67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>Kvalifisert → Konvertert</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>Total konvertering</span>
                    <span className="font-medium">32%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                </div>
              </Card>

              <Card className="p-3">
                <h4 className="font-medium text-sm mb-3">Kilder</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Linkedin className="h-3 w-3" />
                      LinkedIn
                    </span>
                    <span className="font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Proff.no
                    </span>
                    <span className="font-medium">30%</span>
                  </div>
                  <Progress value={30} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Search className="h-3 w-3" />
                      Finn.no
                    </span>
                    <span className="font-medium">25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
              </Card>

              <Card className="p-3">
                <h4 className="font-medium text-sm mb-3">Ytelse Siste 7 Dager</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-2 bg-muted rounded">
                    <p className="text-2xl font-bold text-green-500">+23</p>
                    <p className="text-muted-foreground">Nye leads</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <p className="text-2xl font-bold text-blue-500">+12</p>
                    <p className="text-muted-foreground">Kvalifisert</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <p className="text-2xl font-bold text-purple-500">+5</p>
                    <p className="text-muted-foreground">Konvertert</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <p className="text-2xl font-bold text-yellow-500">78</p>
                    <p className="text-muted-foreground">Snitt score</p>
                  </div>
                </div>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Developer Tab */}
        <TabsContent value="developer" className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Card className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">Debug Mode</h4>
                  <Switch
                    checked={debugMode}
                    onCheckedChange={setDebugMode}
                  />
                </div>
                {debugMode && (
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2 bg-muted rounded">
                      <p className="text-green-500">✓ WebSocket connected</p>
                      <p className="text-green-500">✓ API responsive</p>
                      <p className="text-green-500">✓ Database connected</p>
                      <p className="text-yellow-500">⚠ High memory usage</p>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-3">
                <h4 className="font-medium text-sm mb-3">Code Generation</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: 'Genererer API kode',
                        description: 'REST API endpoints genereres...'
                      });
                      if (onCodeGenerate) {
                        onCodeGenerate('api');
                      }
                    }}
                  >
                    <Code className="h-3 w-3 mr-1" />
                    API
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: 'Genererer Frontend kode',
                        description: 'React komponenter genereres...'
                      });
                      if (onCodeGenerate) {
                        onCodeGenerate('frontend');
                      }
                    }}
                  >
                    <FileCode className="h-3 w-3 mr-1" />
                    Frontend
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: 'Genererer Database schema',
                        description: 'SQL schema genereres...'
                      });
                      if (onCodeGenerate) {
                        onCodeGenerate('database');
                      }
                    }}
                  >
                    <Database className="h-3 w-3 mr-1" />
                    Database
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: 'Genererer Tests',
                        description: 'Unit tests genereres...'
                      });
                      if (onCodeGenerate) {
                        onCodeGenerate('tests');
                      }
                    }}
                  >
                    <Bug className="h-3 w-3 mr-1" />
                    Tests
                  </Button>
                </div>
              </Card>

              <Card className="p-3">
                <h4 className="font-medium text-sm mb-3">Git Status</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-3 w-3" />
                    <span>Branch: main</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitCommit className="h-3 w-3" />
                    <span>12 commits ahead</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="h-3 w-3" />
                    <span>3 pending PRs</span>
                  </div>
                </div>
              </Card>

              <Card className="p-3">
                <h4 className="font-medium text-sm mb-3">Console</h4>
                <div className="bg-black text-green-400 p-2 rounded text-xs font-mono h-32 overflow-auto">
                  <p>$ npm run dev</p>
                  <p>✓ Server running on port 5000</p>
                  <p>✓ Database connected</p>
                  <p>✓ WebSocket initialized</p>
                  <p>$ Workflow executed successfully</p>
                  <p>$ 23 leads extracted</p>
                  <p>$ Data exported to CSV</p>
                </div>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Monitor Tab */}
        <TabsContent value="monitor" className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Card className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">Auto Refresh</h4>
                  <Switch
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                </div>
              </Card>

              <Card className="p-3">
                <h4 className="font-medium text-sm mb-3">System Performance</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        CPU
                      </span>
                      <span>{performanceMetrics.cpu}%</span>
                    </div>
                    <Progress value={performanceMetrics.cpu} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        Memory
                      </span>
                      <span>{performanceMetrics.memory}%</span>
                    </div>
                    <Progress value={performanceMetrics.memory} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1">
                        <Network className="h-3 w-3" />
                        Network
                      </span>
                      <span>{performanceMetrics.network}%</span>
                    </div>
                    <Progress value={performanceMetrics.network} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        Storage
                      </span>
                      <span>{performanceMetrics.storage}%</span>
                    </div>
                    <Progress value={performanceMetrics.storage} className="h-2" />
                  </div>
                </div>
              </Card>

              <Card className="p-3">
                <h4 className="font-medium text-sm mb-3">Security Status</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-green-500" />
                    <span>SSL Certificate Valid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-3 w-3 text-green-500" />
                    <span>Authentication Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Key className="h-3 w-3 text-green-500" />
                    <span>API Keys Secured</span>
                  </div>
                </div>
              </Card>

              <Card className="p-3">
                <h4 className="font-medium text-sm mb-3">Recent Events</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Workflow completed (2 min ago)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-3 w-3 text-blue-500" />
                    <span>23 leads extracted (5 min ago)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-yellow-500" />
                    <span>High memory usage detected (10 min ago)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span>Connection timeout (15 min ago)</span>
                  </div>
                </div>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      <div className="p-3 border-t bg-muted/50">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Play className="h-3 w-3 mr-1" />
            Run
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Pause className="h-3 w-3 mr-1" />
            Pause
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Square className="h-3 w-3 mr-1" />
            Stop
          </Button>
        </div>
      </div>
    </div>
  );
}