import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Building,
  Phone,
  Mail,
  Globe,
  Download,
  Upload,
  Filter,
  Search,
  Star,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Linkedin,
  DollarSign
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
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source: string;
  createdAt: Date;
  industry?: string;
  size?: string;
  revenue?: string;
}

interface LeadManagerProps {
  leads?: Lead[];
  onExport?: (format: string) => void;
  onEnrich?: (leadIds: string[]) => void;
}

export function LeadManager({ leads = [], onExport, onEnrich }: LeadManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock data for demo
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
      source: 'LinkedIn',
      createdAt: new Date(),
      industry: 'IT',
      size: '50-100',
      revenue: '10-50M'
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
      source: 'Proff.no',
      createdAt: new Date(),
      industry: 'Software',
      size: '10-50',
      revenue: '5-10M'
    }
  ];

  const displayLeads = leads.length > 0 ? leads : mockLeads;

  const filteredLeads = displayLeads.filter(lead => {
    const matchesSearch = lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: displayLeads.length,
    qualified: displayLeads.filter(l => l.status === 'qualified').length,
    avgScore: Math.round(displayLeads.reduce((acc, l) => acc + l.score, 0) / displayLeads.length),
    converted: displayLeads.filter(l => l.status === 'converted').length
  };

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleBulkAction = (action: string) => {
    if (selectedLeads.length === 0) {
      toast({
        title: 'Ingen leads valgt',
        description: 'Velg minst én lead først',
        variant: 'destructive'
      });
      return;
    }

    switch (action) {
      case 'export':
        if (onExport) onExport('csv');
        toast({
          title: 'Eksporterer leads',
          description: `${selectedLeads.length} leads eksporteres`
        });
        break;
      case 'enrich':
        if (onEnrich) onEnrich(selectedLeads);
        toast({
          title: 'Beriker leads',
          description: `Henter ekstra data for ${selectedLeads.length} leads`
        });
        break;
      case 'delete':
        toast({
          title: 'Sletter leads',
          description: `${selectedLeads.length} leads slettet`,
          variant: 'destructive'
        });
        setSelectedLeads([]);
        break;
    }
  };

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'contacted': return 'bg-yellow-500';
      case 'qualified': return 'bg-green-500';
      case 'converted': return 'bg-purple-500';
      case 'lost': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lead Manager
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
              <Download className="h-4 w-4 mr-2" />
              Eksporter
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('enrich')}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Berik
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-xs text-muted-foreground">Totalt</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{stats.qualified}</span>
            </div>
            <p className="text-xs text-muted-foreground">Kvalifisert</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.avgScore}</span>
            </div>
            <p className="text-xs text-muted-foreground">Snitt score</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-2xl font-bold">{stats.converted}</span>
            </div>
            <p className="text-xs text-muted-foreground">Konvertert</p>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Søk etter bedrift, kontakt eller e-post..."
              className="pl-10"
            />
          </div>
          <Button size="sm" variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="all">Alle ({displayLeads.length})</TabsTrigger>
            <TabsTrigger value="new">Nye</TabsTrigger>
            <TabsTrigger value="qualified">Kvalifiserte</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="flex-1">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredLeads.map((lead) => (
                  <Card 
                    key={lead.id}
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedLeads.includes(lead.id) ? 'bg-accent' : ''
                    }`}
                    onClick={() => toggleLeadSelection(lead.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Building className="h-4 w-4" />
                          <span className="font-semibold">{lead.company}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(lead.status)} bg-opacity-10`}
                          >
                            {lead.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{lead.contact}</p>
                        <div className="flex flex-wrap gap-3 text-xs">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {lead.location}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(lead.score)}`}>
                          {lead.score}
                        </div>
                        <p className="text-xs text-muted-foreground">Score</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {lead.source}
                        </Badge>
                      </div>
                    </div>
                    {lead.industry && (
                      <div className="flex gap-2 mt-2 pt-2 border-t">
                        <Badge variant="secondary" className="text-xs">
                          {lead.industry}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {lead.size} ansatte
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {lead.revenue} NOK
                        </Badge>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="new" className="flex-1">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nye leads vises her</p>
            </div>
          </TabsContent>

          <TabsContent value="qualified" className="flex-1">
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Kvalifiserte leads vises her</p>
            </div>
          </TabsContent>

          <TabsContent value="pipeline" className="flex-1">
            <div className="grid grid-cols-4 gap-4 h-full">
              {['New', 'Contacted', 'Qualified', 'Converted'].map((stage) => (
                <div key={stage} className="bg-muted rounded-lg p-3">
                  <h4 className="font-medium mb-3">{stage}</h4>
                  <div className="space-y-2">
                    {/* Pipeline cards would go here */}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Selected Actions */}
        {selectedLeads.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
            <span className="text-sm">
              {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} valgt
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedLeads([])}>
                Avbryt
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                Slett
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}