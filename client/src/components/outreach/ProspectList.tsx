import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Upload,
  Download,
  Plus,
  Filter,
  Search,
  Mail,
  Phone,
  Globe,
  Building,
  MapPin,
  Tag,
  Star,
  Brain,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  Eye,
  MoreVertical,
  RefreshCw,
  Database,
  Link,
  UserPlus,
  FileSpreadsheet,
  Linkedin,
  Twitter,
  Facebook
} from 'lucide-react';

interface Prospect {
  prospect_id: string;
  company: string;
  domain: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  industry?: string;
  size?: string;
  location?: string;
  score: number;
  status: 'active' | 'paused' | 'blacklisted';
  tags: string[];
  last_contacted?: Date;
  hooks_count?: number;
  messages_sent?: number;
  created_at: Date;
}

export function ProspectList() {
  const { toast } = useToast();
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEnrichDialog, setShowEnrichDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const [newProspect, setNewProspect] = useState<Partial<Prospect>>({
    company: '',
    domain: '',
    contact_name: '',
    email: '',
    phone: '',
    industry: '',
    location: '',
    status: 'active'
  });

  // Fetch prospects
  const { data: prospects = [], isLoading } = useQuery<Prospect[]>({
    queryKey: ['/api/outreach/prospects', { industry: filterIndustry, status: filterStatus }],
    queryFn: async () => {
      // Mock data for now
      return [
        {
          prospect_id: '1',
          company: 'TechCorp AS',
          domain: 'techcorp.no',
          contact_name: 'Lars Hansen',
          email: 'lars@techcorp.no',
          phone: '+47 123 45 678',
          linkedin_url: 'https://linkedin.com/in/larshansen',
          industry: 'Technology',
          size: '51-200',
          location: 'Oslo, Norge',
          score: 0.85,
          status: 'active' as const,
          tags: ['SaaS', 'B2B', 'Hot lead'],
          hooks_count: 3,
          messages_sent: 2,
          created_at: new Date('2025-01-10')
        },
        {
          prospect_id: '2',
          company: 'InnovateTech Norge',
          domain: 'innovatetech.no',
          contact_name: 'Kari Nordmann',
          email: 'kari@innovatetech.no',
          phone: '+47 987 65 432',
          linkedin_url: 'https://linkedin.com/in/karinordmann',
          industry: 'Software',
          size: '11-50',
          location: 'Bergen, Norge',
          score: 0.72,
          status: 'active' as const,
          tags: ['Startup', 'AI', 'Qualified'],
          hooks_count: 5,
          messages_sent: 0,
          created_at: new Date('2025-01-08')
        }
      ];
    }
  });

  // Add prospect mutation
  const addProspect = useMutation({
    mutationFn: async (prospect: Partial<Prospect>) => {
      return await apiRequest('/api/outreach/prospects', 'POST', prospect);
    },
    onSuccess: () => {
      toast({
        title: "Prospect lagt til",
        description: "Prospect er lagt til i databasen"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/prospects'] });
      setShowAddDialog(false);
      setNewProspect({
        company: '',
        domain: '',
        contact_name: '',
        email: '',
        phone: '',
        industry: '',
        location: '',
        status: 'active'
      });
    }
  });

  // Import prospects mutation
  const importProspects = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return await fetch('/api/outreach/prospects/import', {
        method: 'POST',
        body: formData
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Import fullført",
        description: `${data.imported} av ${data.total} prospects importert`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/prospects'] });
      setShowImportDialog(false);
      setImportFile(null);
    }
  });

  // Enrich prospect mutation
  const enrichProspect = useMutation({
    mutationFn: async (prospectId: string) => {
      return await apiRequest(`/api/outreach/prospects/${prospectId}/enrich`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Berikelse fullført",
        description: "Prospect-data er oppdatert"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/prospects'] });
    }
  });

  // Mine hooks mutation
  const mineHooks = useMutation({
    mutationFn: async (prospectId: string) => {
      return await apiRequest('/api/outreach/hooks/mine', 'POST', { prospect_id: prospectId });
    },
    onSuccess: (data) => {
      toast({
        title: "Hook mining fullført",
        description: `${data.length} hooks funnet`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/prospects'] });
    }
  });

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    if (score >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProspects(prospects.map(p => p.prospect_id));
    } else {
      setSelectedProspects([]);
    }
  };

  const handleSelectProspect = (prospectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProspects([...selectedProspects, prospectId]);
    } else {
      setSelectedProspects(selectedProspects.filter(id => id !== prospectId));
    }
  };

  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = !searchQuery || 
      prospect.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prospect.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prospect.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesIndustry = filterIndustry === 'all' || prospect.industry === filterIndustry;
    const matchesStatus = filterStatus === 'all' || prospect.status === filterStatus;
    
    return matchesSearch && matchesIndustry && matchesStatus;
  });

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Prospect-database</h2>
            <p className="text-muted-foreground">Administrer og berik dine prospects</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importer CSV
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Eksporter
            </Button>
            <Button 
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-blue-500"
              onClick={() => setShowAddDialog(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Legg til prospect
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Totalt prospects</p>
                  <p className="text-2xl font-bold">{prospects.length}</p>
                </div>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Aktive</p>
                  <p className="text-2xl font-bold">
                    {prospects.filter(p => p.status === 'active').length}
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
                  <p className="text-xs text-muted-foreground">Med hooks</p>
                  <p className="text-2xl font-bold">
                    {prospects.filter(p => p.hooks_count && p.hooks_count > 0).length}
                  </p>
                </div>
                <Brain className="h-5 w-5 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Kontaktet</p>
                  <p className="text-2xl font-bold">
                    {prospects.filter(p => p.messages_sent && p.messages_sent > 0).length}
                  </p>
                </div>
                <Mail className="h-5 w-5 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Gj.snitt score</p>
                  <p className="text-2xl font-bold">
                    {prospects.length > 0 
                      ? (prospects.reduce((sum, p) => sum + p.score, 0) / prospects.length * 100).toFixed(0)
                      : 0}%
                  </p>
                </div>
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Bransjer</p>
                  <p className="text-2xl font-bold">
                    {new Set(prospects.map(p => p.industry).filter(Boolean)).size}
                  </p>
                </div>
                <Building className="h-5 w-5 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk etter firma, kontakt eller e-post..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-prospects"
            />
          </div>
          <Select value={filterIndustry} onValueChange={setFilterIndustry}>
            <SelectTrigger className="w-40" data-testid="select-filter-industry">
              <SelectValue placeholder="Bransje" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle bransjer</SelectItem>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Software">Software</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="E-commerce">E-commerce</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32" data-testid="select-filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="active">Aktive</SelectItem>
              <SelectItem value="paused">Pauset</SelectItem>
              <SelectItem value="blacklisted">Svarteliste</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Flere filtre
          </Button>
        </div>

        {/* Actions Bar */}
        {selectedProspects.length > 0 && (
          <Card className="border-primary">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedProspects.length} valgt</Badge>
                  <Button variant="outline" size="sm">
                    <Tag className="h-4 w-4 mr-2" />
                    Legg til tags
                  </Button>
                  <Button variant="outline" size="sm">
                    <Brain className="h-4 w-4 mr-2" />
                    Kjør hook mining
                  </Button>
                  <Button variant="outline" size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Berik data
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Start kampanje
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-600"
                  onClick={() => setSelectedProspects([])}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Slett valgte
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prospects Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedProspects.length === filteredProspects.length && filteredProspects.length > 0}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Bransje</TableHead>
                  <TableHead>Lokasjon</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Hooks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProspects.map((prospect) => (
                  <TableRow key={prospect.prospect_id} data-testid={`row-prospect-${prospect.prospect_id}`}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedProspects.includes(prospect.prospect_id)}
                        onCheckedChange={(checked) => handleSelectProspect(prospect.prospect_id, checked as boolean)}
                        data-testid={`checkbox-prospect-${prospect.prospect_id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{prospect.company}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <a 
                            href={`https://${prospect.domain}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                          >
                            <Globe className="h-3 w-3" />
                            {prospect.domain}
                          </a>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{prospect.contact_name || '-'}</p>
                        {prospect.email && (
                          <div className="flex items-center gap-1 mt-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{prospect.email}</span>
                          </div>
                        )}
                        {prospect.linkedin_url && (
                          <a 
                            href={prospect.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 hover:underline"
                          >
                            <Linkedin className="h-3 w-3" />
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{prospect.industry || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{prospect.location || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.round(prospect.score * 5)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`text-sm font-medium ${getScoreColor(prospect.score)}`}>
                          {(prospect.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {prospect.hooks_count ? (
                        <Badge variant="secondary" className="gap-1">
                          <Brain className="h-3 w-3" />
                          {prospect.hooks_count}
                        </Badge>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => mineHooks.mutate(prospect.prospect_id)}
                          data-testid={`button-mine-hooks-${prospect.prospect_id}`}
                        >
                          <Brain className="h-3 w-3 mr-1" />
                          Finn
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={prospect.status === 'active' ? 'default' : 'secondary'}
                        className={
                          prospect.status === 'active' ? 'bg-green-500' :
                          prospect.status === 'paused' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }
                      >
                        {prospect.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {prospect.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => enrichProspect.mutate(prospect.prospect_id)}
                          data-testid={`button-enrich-${prospect.prospect_id}`}
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add Prospect Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Legg til ny prospect</DialogTitle>
            <DialogDescription>
              Fyll inn informasjon om den nye prospecten
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Firma *</Label>
                <Input
                  id="company"
                  value={newProspect.company}
                  onChange={(e) => setNewProspect({ ...newProspect, company: e.target.value })}
                  placeholder="TechCorp AS"
                  data-testid="input-new-company"
                />
              </div>
              <div>
                <Label htmlFor="domain">Domene *</Label>
                <Input
                  id="domain"
                  value={newProspect.domain}
                  onChange={(e) => setNewProspect({ ...newProspect, domain: e.target.value })}
                  placeholder="techcorp.no"
                  data-testid="input-new-domain"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact">Kontaktperson</Label>
                <Input
                  id="contact"
                  value={newProspect.contact_name}
                  onChange={(e) => setNewProspect({ ...newProspect, contact_name: e.target.value })}
                  placeholder="Lars Hansen"
                  data-testid="input-new-contact"
                />
              </div>
              <div>
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  value={newProspect.email}
                  onChange={(e) => setNewProspect({ ...newProspect, email: e.target.value })}
                  placeholder="lars@techcorp.no"
                  data-testid="input-new-email"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={newProspect.phone}
                  onChange={(e) => setNewProspect({ ...newProspect, phone: e.target.value })}
                  placeholder="+47 123 45 678"
                  data-testid="input-new-phone"
                />
              </div>
              <div>
                <Label htmlFor="industry">Bransje</Label>
                <Select 
                  value={newProspect.industry} 
                  onValueChange={(value) => setNewProspect({ ...newProspect, industry: value })}
                >
                  <SelectTrigger id="industry" data-testid="select-new-industry">
                    <SelectValue placeholder="Velg bransje" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Software">Software</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="location">Lokasjon</Label>
              <Input
                id="location"
                value={newProspect.location}
                onChange={(e) => setNewProspect({ ...newProspect, location: e.target.value })}
                placeholder="Oslo, Norge"
                data-testid="input-new-location"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={() => addProspect.mutate(newProspect)}
              disabled={!newProspect.company || !newProspect.domain}
              data-testid="button-add-prospect"
            >
              <Plus className="h-4 w-4 mr-2" />
              Legg til prospect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer prospects fra CSV</DialogTitle>
            <DialogDescription>
              Last opp en CSV-fil med prospect-data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="border-dashed">
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Dra og slipp CSV-fil her, eller klikk for å velge
                  </p>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="max-w-xs"
                    data-testid="input-import-file"
                  />
                  {importFile && (
                    <Badge variant="secondary" className="mt-2">
                      {importFile.name}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                CSV-format:
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                company, domain, contact_name, email, phone, industry, location, tags
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={() => importFile && importProspects.mutate(importFile)}
              disabled={!importFile}
              data-testid="button-import-prospects"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importer prospects
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}