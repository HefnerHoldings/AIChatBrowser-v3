import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Lock,
  Database,
  Shield,
  Key,
  Globe,
  Users,
  Mail,
  Phone,
  Building,
  MapPin,
  TrendingUp,
  Hash,
  CheckCircle,
  AlertTriangle,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeadEnrichment {
  provider: string;
  payload: any;
  confidence: number;
}

interface LeadScore {
  fit: number;
  reach: number;
  intent: number;
  credibility: number;
  total: number;
}

interface VaultLead {
  id: string;
  fingerprint: string;
  sourceUrl: string;
  collectedAt: Date;
  collectorId: string;
  company: string;
  email?: string;
  phone?: string;
  website?: string;
  country?: string;
  enrichments: LeadEnrichment[];
  score: LeadScore;
  status: "new" | "enriched" | "verified" | "duplicate";
  complianceMode: "standard" | "gdpr" | "pseudonymized" | "public-only";
}

export function LeadDataVault() {
  const { toast } = useToast();
  const [isIngesting, setIsIngesting] = useState(false);
  const [complianceMode, setComplianceMode] = useState<string>("standard");
  
  const [vaultStats, setVaultStats] = useState({
    totalLeads: 12847,
    enrichedLeads: 11234,
    verifiedLeads: 9876,
    duplicates: 823,
    avgScore: 74,
    storageUsed: 2.4 // GB
  });

  const [sampleLeads] = useState<VaultLead[]>([
    {
      id: "lead-vault-1",
      fingerprint: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      sourceUrl: "https://suppliers.eu/cookware",
      collectedAt: new Date(),
      collectorId: "browser-001",
      company: "Nordic Cookware AB",
      email: "info@nordiccookware.se",
      phone: "+46 8 123 4567",
      website: "https://nordiccookware.se",
      country: "Sweden",
      enrichments: [
        { provider: "MX", payload: { valid: true }, confidence: 95 },
        { provider: "Firmographic", payload: { employees: "50-100" }, confidence: 85 }
      ],
      score: { fit: 85, reach: 70, intent: 60, credibility: 90, total: 76 },
      status: "enriched",
      complianceMode: "gdpr"
    },
    {
      id: "lead-vault-2",
      fingerprint: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      sourceUrl: "https://b2b.wholesale.eu",
      collectedAt: new Date(Date.now() - 86400000),
      collectorId: "browser-002",
      company: "Alpine Kitchen Solutions",
      email: "contact@alpinekitchen.at",
      website: "https://alpinekitchen.at",
      country: "Austria",
      enrichments: [
        { provider: "SMTP", payload: { deliverable: true }, confidence: 90 }
      ],
      score: { fit: 90, reach: 85, intent: 75, credibility: 95, total: 86 },
      status: "verified",
      complianceMode: "gdpr"
    }
  ]);

  const handleIngest = () => {
    setIsIngesting(true);
    
    toast({
      title: "Ingestion started",
      description: "Leads are being processed and enriched",
    });

    setTimeout(() => {
      setIsIngesting(false);
      setVaultStats(prev => ({
        ...prev,
        totalLeads: prev.totalLeads + 24,
        enrichedLeads: prev.enrichedLeads + 22
      }));
    }, 3000);
  };

  const getComplianceBadge = (mode: string) => {
    switch (mode) {
      case "gdpr": return <Badge className="bg-blue-500">GDPR</Badge>;
      case "pseudonymized": return <Badge className="bg-purple-500">Pseudonymized</Badge>;
      case "public-only": return <Badge className="bg-green-500">Public Only</Badge>;
      default: return <Badge>Standard</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Lead Data Vault
              <Badge variant="destructive">
                <Lock className="h-3 w-3 mr-1" />
                Admin Only
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Select value={complianceMode} onValueChange={setComplianceMode}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (Non-EU)</SelectItem>
                  <SelectItem value="gdpr">GDPR Compliant</SelectItem>
                  <SelectItem value="pseudonymized">Pseudonymized</SelectItem>
                  <SelectItem value="public-only">Public Sources Only</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                size="sm"
                onClick={handleIngest}
                disabled={isIngesting}
              >
                {isIngesting ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3 mr-1" />
                )}
                Ingest Leads
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Centralized lead storage with enrichment, deduplication, and scoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger value="enrichment">Enrichment</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{vaultStats.totalLeads.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Total Leads</div>
                      </div>
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <Progress value={75} className="mt-2 h-1" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{vaultStats.enrichedLeads.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Enriched</div>
                      </div>
                      <Sparkles className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <Progress value={87} className="mt-2 h-1" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{vaultStats.avgScore}%</div>
                        <div className="text-xs text-muted-foreground">Avg Score</div>
                      </div>
                      <TrendingUp className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <Progress value={vaultStats.avgScore} className="mt-2 h-1" />
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Security Architecture</div>
                    <div className="text-xs space-y-1">
                      <div>• mTLS + signature authentication on ingestion</div>
                      <div>• Row-level security (RLS) - admin read only</div>
                      <div>• PII masking in all logs</div>
                      <div>• Audit trail with hash-chaining</div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium mb-3">Ingestion Pipeline</div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-center flex-1">
                      <div className="bg-muted rounded p-2 mb-1">
                        <Database className="h-4 w-4 mx-auto" />
                      </div>
                      <div className="text-xs">Browser</div>
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div className="text-center flex-1">
                      <div className="bg-muted rounded p-2 mb-1">
                        <Key className="h-4 w-4 mx-auto" />
                      </div>
                      <div className="text-xs">mTLS API</div>
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div className="text-center flex-1">
                      <div className="bg-muted rounded p-2 mb-1">
                        <Sparkles className="h-4 w-4 mx-auto" />
                      </div>
                      <div className="text-xs">Enrichment</div>
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div className="text-center flex-1">
                      <div className="bg-muted rounded p-2 mb-1">
                        <Hash className="h-4 w-4 mx-auto" />
                      </div>
                      <div className="text-xs">Dedup</div>
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div className="text-center flex-1">
                      <div className="bg-primary/20 rounded p-2 mb-1">
                        <Lock className="h-4 w-4 mx-auto" />
                      </div>
                      <div className="text-xs font-medium">Vault</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leads" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Input placeholder="Search leads..." className="max-w-sm" />
                <Button size="sm" variant="outline">
                  <Filter className="h-3 w-3 mr-1" />
                  Filter
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {sampleLeads.map((lead) => (
                    <Card key={lead.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <Building className="h-3 w-3" />
                              <span className="font-medium text-sm">{lead.company}</span>
                              {getComplianceBadge(lead.complianceMode)}
                              <Badge variant={lead.status === "verified" ? "default" : "secondary"}>
                                {lead.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              {lead.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {lead.email}
                                </div>
                              )}
                              {lead.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {lead.phone}
                                </div>
                              )}
                              {lead.website && (
                                <div className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  {lead.website}
                                </div>
                              )}
                              {lead.country && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {lead.country}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-4 mt-2">
                              <div className="text-xs">
                                Score: <span className="font-medium">{lead.score.total}</span>
                              </div>
                              <div className="text-xs">
                                Enrichments: <span className="font-medium">{lead.enrichments.length}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(lead.collectedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="enrichment" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium mb-3">Enrichment Providers</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs">MX/SMTP Validation</span>
                        <Badge className="text-xs">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Firmographic Data</span>
                        <Badge className="text-xs">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">HLR Phone Lookup</span>
                        <Badge variant="outline" className="text-xs">Optional</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Geo Location</span>
                        <Badge className="text-xs">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium mb-3">Scoring Formula</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Fit Score</span>
                        <span className="text-xs font-medium">25%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Reach Score</span>
                        <span className="text-xs font-medium">25%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Intent Score</span>
                        <span className="text-xs font-medium">20%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Credibility Score</span>
                        <span className="text-xs font-medium">30%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Automatic enrichment runs on all ingested leads within 60 seconds
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4">
              <Alert className={complianceMode === "gdpr" ? "border-blue-500" : ""}>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Current Mode: {complianceMode.toUpperCase()}</div>
                    <div className="text-xs">
                      {complianceMode === "gdpr" && "Full GDPR compliance with RLS, audit trail, and data subject rights"}
                      {complianceMode === "pseudonymized" && "PII is hashed and requires admin process to decrypt"}
                      {complianceMode === "public-only" && "Only data from public sources without personal information"}
                      {complianceMode === "standard" && "Standard processing for non-EU operations"}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Data Retention</span>
                      <Badge>90 days</Badge>
                    </div>
                    <Progress value={30} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      Automatic purge of leads older than retention period
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium mb-3">Audit Trail</div>
                    <ScrollArea className="h-[100px]">
                      <div className="space-y-1 font-mono text-xs">
                        <div>2024-01-15 14:32:18 - INGEST - 24 leads - collector:browser-001</div>
                        <div>2024-01-15 14:32:45 - ENRICH - 24 leads - provider:MX</div>
                        <div>2024-01-15 14:33:02 - DEDUP - 2 duplicates merged</div>
                        <div>2024-01-15 14:33:15 - SCORE - 22 leads scored</div>
                        <div>2024-01-15 15:45:22 - EXPORT - admin@company.com - 500 leads</div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}