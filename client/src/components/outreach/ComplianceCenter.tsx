import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  Lock,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  FileText,
  Users,
  Mail,
  Ban,
  Clock,
  Globe,
  Key,
  Database,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

interface ConsentRecord {
  consent_id: string;
  prospect_id: string;
  email: string;
  company: string;
  consent_type: 'marketing' | 'tracking' | 'profiling';
  status: 'granted' | 'denied' | 'withdrawn';
  legal_basis: string;
  channels: string[];
  granted_at?: Date;
  withdrawn_at?: Date;
  expires_at?: Date;
  ip_address?: string;
}

interface SuppressionEntry {
  id: string;
  email?: string;
  domain?: string;
  phone?: string;
  reason: 'unsubscribed' | 'bounced' | 'complained' | 'manual';
  source: string;
  added_at: Date;
}

interface ComplianceSettings {
  gdpr_mode: boolean;
  require_double_optin: boolean;
  auto_delete_after_days: number;
  encrypt_personal_data: boolean;
  log_all_access: boolean;
  anonymize_inactive: boolean;
  retention_period_days: number;
  consent_renewal_days: number;
}

export function ComplianceCenter() {
  const { toast } = useToast();
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [showSuppressionDialog, setShowSuppressionDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [complianceSettings, setComplianceSettings] = useState<ComplianceSettings>({
    gdpr_mode: true,
    require_double_optin: true,
    auto_delete_after_days: 365,
    encrypt_personal_data: true,
    log_all_access: true,
    anonymize_inactive: false,
    retention_period_days: 730,
    consent_renewal_days: 365
  });

  const [newSuppression, setNewSuppression] = useState({
    email: '',
    domain: '',
    phone: '',
    reason: 'manual' as const
  });

  // Fetch consent records
  const { data: consentRecords = [], isLoading: loadingConsents } = useQuery<ConsentRecord[]>({
    queryKey: ['/api/outreach/consent'],
    queryFn: async () => {
      // Mock data for now
      return [
        {
          consent_id: '1',
          prospect_id: 'p1',
          email: 'lars@techcorp.no',
          company: 'TechCorp AS',
          consent_type: 'marketing',
          status: 'granted',
          legal_basis: 'Legitimate interest',
          channels: ['email', 'sms'],
          granted_at: new Date('2025-01-01'),
          expires_at: new Date('2026-01-01'),
          ip_address: '192.168.1.1'
        },
        {
          consent_id: '2',
          prospect_id: 'p2',
          email: 'kari@innovatetech.no',
          company: 'InnovateTech',
          consent_type: 'marketing',
          status: 'withdrawn',
          legal_basis: 'Consent',
          channels: ['email'],
          granted_at: new Date('2024-12-01'),
          withdrawn_at: new Date('2025-01-10'),
          ip_address: '192.168.1.2'
        }
      ];
    }
  });

  // Fetch suppression list
  const { data: suppressionList = [], isLoading: loadingSuppression } = useQuery<SuppressionEntry[]>({
    queryKey: ['/api/outreach/suppression'],
    queryFn: async () => {
      // Mock data for now
      return [
        {
          id: '1',
          email: 'unsubscribed@example.com',
          reason: 'unsubscribed',
          source: 'Email footer link',
          added_at: new Date('2025-01-05')
        },
        {
          id: '2',
          domain: 'competitor.com',
          reason: 'manual',
          source: 'Admin action',
          added_at: new Date('2025-01-08')
        },
        {
          id: '3',
          email: 'bounced@invalid.com',
          reason: 'bounced',
          source: 'SendGrid webhook',
          added_at: new Date('2025-01-10')
        }
      ];
    }
  });

  // Save compliance settings mutation
  const saveSettings = useMutation({
    mutationFn: async (settings: ComplianceSettings) => {
      return await apiRequest('/api/outreach/compliance/settings', 'POST', settings);
    },
    onSuccess: () => {
      toast({
        title: "Innstillinger lagret",
        description: "GDPR-innstillinger er oppdatert"
      });
    }
  });

  // Add to suppression list mutation
  const addSuppression = useMutation({
    mutationFn: async (entry: any) => {
      return await apiRequest('/api/outreach/suppression', 'POST', entry);
    },
    onSuccess: () => {
      toast({
        title: "Lagt til svarteliste",
        description: "Kontakten vil ikke motta flere meldinger"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/suppression'] });
      setShowSuppressionDialog(false);
      setNewSuppression({ email: '', domain: '', phone: '', reason: 'manual' });
    }
  });

  // Export data mutation
  const exportData = useMutation({
    mutationFn: async (prospectId: string) => {
      return await apiRequest(`/api/outreach/gdpr/export/${prospectId}`, 'GET');
    },
    onSuccess: (data) => {
      // Download the exported data
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr-export-${Date.now()}.json`;
      a.click();
      
      toast({
        title: "Data eksportert",
        description: "Persondata er lastet ned"
      });
    }
  });

  // Delete data mutation
  const deleteData = useMutation({
    mutationFn: async (prospectId: string) => {
      return await apiRequest(`/api/outreach/gdpr/delete/${prospectId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Data slettet",
        description: "All persondata er permanent slettet"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/consent'] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'granted': return 'text-green-600';
      case 'denied': return 'text-red-600';
      case 'withdrawn': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'unsubscribed': return 'bg-yellow-500';
      case 'bounced': return 'bg-red-500';
      case 'complained': return 'bg-orange-500';
      case 'manual': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const stats = {
    totalConsents: consentRecords.length,
    activeConsents: consentRecords.filter(c => c.status === 'granted').length,
    withdrawnConsents: consentRecords.filter(c => c.status === 'withdrawn').length,
    suppressedEntries: suppressionList.length,
    emailsSuppressed: suppressionList.filter(s => s.email).length,
    domainsSuppressed: suppressionList.filter(s => s.domain).length
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Compliance & GDPR</h2>
            <p className="text-muted-foreground">Administrer samtykke og personvern</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant={complianceSettings.gdpr_mode ? 'default' : 'secondary'}
              className={complianceSettings.gdpr_mode ? 'bg-green-500' : ''}
            >
              <Shield className="h-3 w-3 mr-1" />
              GDPR {complianceSettings.gdpr_mode ? 'Aktivert' : 'Deaktivert'}
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Eksporter rapport
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Totalt samtykker</p>
                  <p className="text-2xl font-bold">{stats.totalConsents}</p>
                </div>
                <UserCheck className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Aktive</p>
                  <p className="text-2xl font-bold">{stats.activeConsents}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Trukket tilbake</p>
                  <p className="text-2xl font-bold">{stats.withdrawnConsents}</p>
                </div>
                <XCircle className="h-5 w-5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Svarteliste</p>
                  <p className="text-2xl font-bold">{stats.suppressedEntries}</p>
                </div>
                <Ban className="h-5 w-5 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">E-poster blokkert</p>
                  <p className="text-2xl font-bold">{stats.emailsSuppressed}</p>
                </div>
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Domener blokkert</p>
                  <p className="text-2xl font-bold">{stats.domainsSuppressed}</p>
                </div>
                <Globe className="h-5 w-5 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="settings">
          <TabsList>
            <TabsTrigger value="settings">Innstillinger</TabsTrigger>
            <TabsTrigger value="consent">Samtykker</TabsTrigger>
            <TabsTrigger value="suppression">Svarteliste</TabsTrigger>
            <TabsTrigger value="audit">Revisjonslogg</TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>GDPR-innstillinger</CardTitle>
                <CardDescription>
                  Konfigurer personvern og compliance-innstillinger
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>GDPR-modus</Label>
                    <p className="text-xs text-muted-foreground">
                      Aktiver streng GDPR-compliance for all databehandling
                    </p>
                  </div>
                  <Switch
                    checked={complianceSettings.gdpr_mode}
                    onCheckedChange={(checked) => setComplianceSettings({
                      ...complianceSettings,
                      gdpr_mode: checked
                    })}
                    data-testid="switch-gdpr-mode"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dobbel opt-in</Label>
                    <p className="text-xs text-muted-foreground">
                      Krev e-postbekreftelse for nye samtykker
                    </p>
                  </div>
                  <Switch
                    checked={complianceSettings.require_double_optin}
                    onCheckedChange={(checked) => setComplianceSettings({
                      ...complianceSettings,
                      require_double_optin: checked
                    })}
                    data-testid="switch-double-optin"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Krypter persondata</Label>
                    <p className="text-xs text-muted-foreground">
                      Ende-til-ende kryptering av sensitive data
                    </p>
                  </div>
                  <Switch
                    checked={complianceSettings.encrypt_personal_data}
                    onCheckedChange={(checked) => setComplianceSettings({
                      ...complianceSettings,
                      encrypt_personal_data: checked
                    })}
                    data-testid="switch-encrypt-data"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Logg all tilgang</Label>
                    <p className="text-xs text-muted-foreground">
                      Opprett revisjonslogg for all datatilgang
                    </p>
                  </div>
                  <Switch
                    checked={complianceSettings.log_all_access}
                    onCheckedChange={(checked) => setComplianceSettings({
                      ...complianceSettings,
                      log_all_access: checked
                    })}
                    data-testid="switch-log-access"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Anonymiser inaktive</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatisk anonymisering av inaktive kontakter
                    </p>
                  </div>
                  <Switch
                    checked={complianceSettings.anonymize_inactive}
                    onCheckedChange={(checked) => setComplianceSettings({
                      ...complianceSettings,
                      anonymize_inactive: checked
                    })}
                    data-testid="switch-anonymize"
                  />
                </div>

                <div>
                  <Label>Dataoppbevaringsperiode</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      value={complianceSettings.retention_period_days}
                      onChange={(e) => setComplianceSettings({
                        ...complianceSettings,
                        retention_period_days: parseInt(e.target.value)
                      })}
                      className="w-24"
                      data-testid="input-retention-days"
                    />
                    <span className="text-sm text-muted-foreground">dager</span>
                  </div>
                </div>

                <div>
                  <Label>Fornyelse av samtykke</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      value={complianceSettings.consent_renewal_days}
                      onChange={(e) => setComplianceSettings({
                        ...complianceSettings,
                        consent_renewal_days: parseInt(e.target.value)
                      })}
                      className="w-24"
                      data-testid="input-consent-renewal"
                    />
                    <span className="text-sm text-muted-foreground">dager</span>
                  </div>
                </div>

                <Button 
                  onClick={() => saveSettings.mutate(complianceSettings)}
                  className="w-full"
                  data-testid="button-save-settings"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Lagre innstillinger
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consent Records Tab */}
          <TabsContent value="consent" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søk samtykker..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                    data-testid="input-search-consent"
                  />
                </div>
              </div>
              <Button size="sm" onClick={() => setShowConsentDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrer samtykke
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3 p-4">
                    {consentRecords.map((consent) => (
                      <Card key={consent.consent_id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <p className="font-medium">{consent.email}</p>
                                <Badge 
                                  variant={consent.status === 'granted' ? 'default' : 'secondary'}
                                  className={getStatusColor(consent.status)}
                                >
                                  {consent.status === 'granted' ? 'Godkjent' :
                                   consent.status === 'denied' ? 'Avslått' :
                                   'Trukket tilbake'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{consent.company}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Type: {consent.consent_type}</span>
                                <span>•</span>
                                <span>Grunnlag: {consent.legal_basis}</span>
                                <span>•</span>
                                <span>Kanaler: {consent.channels.join(', ')}</span>
                              </div>
                              {consent.granted_at && (
                                <p className="text-xs text-muted-foreground">
                                  Gitt: {new Date(consent.granted_at).toLocaleDateString('nb-NO')}
                                </p>
                              )}
                              {consent.expires_at && (
                                <p className="text-xs text-muted-foreground">
                                  Utløper: {new Date(consent.expires_at).toLocaleDateString('nb-NO')}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => exportData.mutate(consent.prospect_id)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-600"
                                onClick={() => deleteData.mutate(consent.prospect_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suppression List Tab */}
          <TabsContent value="suppression" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Svarteliste</AlertTitle>
                <AlertDescription>
                  Kontakter på denne listen vil aldri motta meldinger
                </AlertDescription>
              </Alert>
              <Button size="sm" onClick={() => setShowSuppressionDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Legg til svarteliste
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2 p-4">
                    {suppressionList.map((entry) => (
                      <div 
                        key={entry.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge className={`${getReasonColor(entry.reason)} text-white`}>
                            {entry.reason === 'unsubscribed' ? 'Avmeldt' :
                             entry.reason === 'bounced' ? 'Bounced' :
                             entry.reason === 'complained' ? 'Klaget' :
                             'Manuell'}
                          </Badge>
                          <div>
                            <p className="font-medium">
                              {entry.email || entry.domain || entry.phone}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Kilde: {entry.source} • {new Date(entry.added_at).toLocaleDateString('nb-NO')}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Revisjonslogg</AlertTitle>
              <AlertDescription>
                Alle GDPR-relevante handlinger logges automatisk for compliance
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Siste handlinger</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Data eksportert</p>
                        <p className="text-xs text-muted-foreground">
                          Bruker ID: p1 • Admin: admin@firma.no
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date().toLocaleString('nb-NO')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Samtykke registrert</p>
                        <p className="text-xs text-muted-foreground">
                          E-post: ny@kontakt.no • Type: Marketing
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date().toLocaleString('nb-NO')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Ban className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Lagt til svarteliste</p>
                        <p className="text-xs text-muted-foreground">
                          E-post: unsubscribe@example.com • Grunn: Avmeldt
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date().toLocaleString('nb-NO')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add to Suppression Dialog */}
      <Dialog open={showSuppressionDialog} onOpenChange={setShowSuppressionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Legg til svarteliste</DialogTitle>
            <DialogDescription>
              Blokkér e-post, domene eller telefonnummer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="suppress-email">E-postadresse</Label>
              <Input
                id="suppress-email"
                type="email"
                value={newSuppression.email}
                onChange={(e) => setNewSuppression({ ...newSuppression, email: e.target.value })}
                placeholder="eksempel@firma.no"
                data-testid="input-suppress-email"
              />
            </div>

            <div>
              <Label htmlFor="suppress-domain">Domene</Label>
              <Input
                id="suppress-domain"
                value={newSuppression.domain}
                onChange={(e) => setNewSuppression({ ...newSuppression, domain: e.target.value })}
                placeholder="firma.no"
                data-testid="input-suppress-domain"
              />
            </div>

            <div>
              <Label htmlFor="suppress-phone">Telefonnummer</Label>
              <Input
                id="suppress-phone"
                value={newSuppression.phone}
                onChange={(e) => setNewSuppression({ ...newSuppression, phone: e.target.value })}
                placeholder="+47 123 45 678"
                data-testid="input-suppress-phone"
              />
            </div>

            <div>
              <Label htmlFor="suppress-reason">Grunn</Label>
              <Select 
                value={newSuppression.reason} 
                onValueChange={(value: any) => setNewSuppression({ ...newSuppression, reason: value })}
              >
                <SelectTrigger id="suppress-reason" data-testid="select-suppress-reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manuell</SelectItem>
                  <SelectItem value="unsubscribed">Avmeldt</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                  <SelectItem value="complained">Klaget</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuppressionDialog(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={() => addSuppression.mutate(newSuppression)}
              disabled={!newSuppression.email && !newSuppression.domain && !newSuppression.phone}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-add-suppression"
            >
              <Ban className="h-4 w-4 mr-2" />
              Legg til svarteliste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}