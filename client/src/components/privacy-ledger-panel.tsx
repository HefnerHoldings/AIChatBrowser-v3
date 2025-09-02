import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Eye, 
  EyeOff,
  Cookie,
  Database,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Filter,
  Fingerprint,
  Globe,
  Key,
  UserX,
  Trash2,
  RefreshCw
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PrivacyLedger } from "@shared/schema";

interface PrivacySettings {
  blockTrackers: boolean;
  blockCookies: boolean;
  anonymizeData: boolean;
  useVPN: boolean;
  randomizeFingerprint: boolean;
  clearOnExit: boolean;
}

interface PrivacyProfile {
  id: string;
  name: string;
  level: "low" | "medium" | "high" | "maximum";
  settings: PrivacySettings;
  isActive: boolean;
}

export function PrivacyLedgerPanel({ sessionId }: { sessionId?: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAuditEnabled, setIsAuditEnabled] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<PrivacyProfile>({
    id: "1",
    name: "Balanced",
    level: "medium",
    settings: {
      blockTrackers: true,
      blockCookies: false,
      anonymizeData: false,
      useVPN: false,
      randomizeFingerprint: false,
      clearOnExit: true
    },
    isActive: true
  });

  const { data: privacyLogs = [], isLoading } = useQuery<PrivacyLedger[]>({
    queryKey: sessionId ? ["/api/privacy-ledger", { sessionId }] : ["/api/privacy-ledger"],
  });

  const createPrivacyLogMutation = useMutation({
    mutationFn: async (data: Partial<PrivacyLedger>) => {
      return apiRequest("POST", "/api/privacy-ledger", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/privacy-ledger"] });
    }
  });

  const privacyProfiles: PrivacyProfile[] = [
    {
      id: "1",
      name: "Minimal",
      level: "low",
      settings: {
        blockTrackers: false,
        blockCookies: false,
        anonymizeData: false,
        useVPN: false,
        randomizeFingerprint: false,
        clearOnExit: false
      },
      isActive: false
    },
    {
      id: "2",
      name: "Balanced",
      level: "medium",
      settings: {
        blockTrackers: true,
        blockCookies: false,
        anonymizeData: false,
        useVPN: false,
        randomizeFingerprint: false,
        clearOnExit: true
      },
      isActive: true
    },
    {
      id: "3",
      name: "Strict",
      level: "high",
      settings: {
        blockTrackers: true,
        blockCookies: true,
        anonymizeData: true,
        useVPN: false,
        randomizeFingerprint: true,
        clearOnExit: true
      },
      isActive: false
    },
    {
      id: "4",
      name: "Maximum",
      level: "maximum",
      settings: {
        blockTrackers: true,
        blockCookies: true,
        anonymizeData: true,
        useVPN: true,
        randomizeFingerprint: true,
        clearOnExit: true
      },
      isActive: false
    }
  ];

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "cookie-set": return <Cookie className="h-4 w-4" />;
      case "data-collected": return <Database className="h-4 w-4" />;
      case "permission-granted": return <Unlock className="h-4 w-4" />;
      case "permission-denied": return <Lock className="h-4 w-4" />;
      case "tracker-blocked": return <Shield className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getConsentColor = (status: string) => {
    switch (status) {
      case "granted": return "default";
      case "denied": return "destructive";
      case "pending": return "secondary";
      default: return "outline";
    }
  };

  const handleClearData = () => {
    toast({
      title: "Privacy data cleared",
      description: "All tracking data and cookies have been removed",
    });
  };

  const privacyStats = {
    trackersBlocked: 142,
    cookiesBlocked: 89,
    requestsAnonymized: 234,
    dataCleaned: 15,
    permissionsDenied: 7
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Ledger
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Audit</span>
              <Switch 
                checked={isAuditEnabled} 
                onCheckedChange={setIsAuditEnabled}
              />
              {isAuditEnabled ? (
                <Eye className="h-4 w-4 text-green-500" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Track data collection, permissions, and privacy events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="profiles">Profiles</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Active Profile</span>
                        <Badge variant={
                          selectedProfile.level === "maximum" ? "destructive" :
                          selectedProfile.level === "high" ? "secondary" :
                          selectedProfile.level === "medium" ? "default" : "outline"
                        }>
                          {selectedProfile.name}
                        </Badge>
                      </div>
                      <Progress 
                        value={
                          selectedProfile.level === "maximum" ? 100 :
                          selectedProfile.level === "high" ? 75 :
                          selectedProfile.level === "medium" ? 50 : 25
                        } 
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground">
                        Privacy Level: {selectedProfile.level}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Session Stats</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          <span>{privacyStats.trackersBlocked} blocked</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Cookie className="h-3 w-3" />
                          <span>{privacyStats.cookiesBlocked} cookies</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <UserX className="h-3 w-3" />
                          <span>{privacyStats.requestsAnonymized} anonymized</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          <span>{privacyStats.permissionsDenied} denied</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div>3 sites requested location access in this session</div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Review</Button>
                      <Button size="sm" variant="outline">Block All</Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Quick Actions</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" onClick={handleClearData}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear Data
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    New Identity
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Export Log
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Button size="sm" variant="outline">All Events</Button>
                <Button size="sm" variant="outline">Cookies</Button>
                <Button size="sm" variant="outline">Trackers</Button>
                <Button size="sm" variant="outline">Permissions</Button>
              </div>

              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {privacyLogs.map((log, idx) => (
                    <Card key={log.id || idx}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getEventIcon(log.eventType)}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{log.eventType}</span>
                                <Badge variant="outline" className="text-xs">
                                  {log.domain}
                                </Badge>
                                {log.consentStatus && (
                                  <Badge variant={getConsentColor(log.consentStatus)} className="text-xs">
                                    {log.consentStatus}
                                  </Badge>
                                )}
                              </div>
                              {log.dataType && (
                                <div className="text-xs text-muted-foreground">
                                  Type: {log.dataType} | Purpose: {log.purpose || "Unknown"}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {log.consentStatus === "granted" ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : log.consentStatus === "denied" ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="profiles" className="space-y-4">
              <div className="grid gap-3">
                {privacyProfiles.map((profile) => (
                  <Card 
                    key={profile.id}
                    className={`cursor-pointer transition-colors ${
                      selectedProfile.id === profile.id ? "border-primary" : ""
                    }`}
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{profile.name}</span>
                            <Badge variant={
                              profile.level === "maximum" ? "destructive" :
                              profile.level === "high" ? "secondary" :
                              profile.level === "medium" ? "default" : "outline"
                            }>
                              {profile.level}
                            </Badge>
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            {profile.settings.blockTrackers && (
                              <span className="flex items-center gap-1">
                                <Shield className="h-3 w-3" /> Trackers
                              </span>
                            )}
                            {profile.settings.blockCookies && (
                              <span className="flex items-center gap-1">
                                <Cookie className="h-3 w-3" /> Cookies
                              </span>
                            )}
                            {profile.settings.anonymizeData && (
                              <span className="flex items-center gap-1">
                                <UserX className="h-3 w-3" /> Anonymize
                              </span>
                            )}
                            {profile.settings.useVPN && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" /> VPN
                              </span>
                            )}
                            {profile.settings.randomizeFingerprint && (
                              <span className="flex items-center gap-1">
                                <Fingerprint className="h-3 w-3" /> Fingerprint
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedProfile.id === profile.id && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Privacy Settings</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm">Block Trackers</div>
                      <div className="text-xs text-muted-foreground">
                        Prevent websites from tracking your activity
                      </div>
                    </div>
                    <Switch checked={selectedProfile.settings.blockTrackers} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm">Block Third-party Cookies</div>
                      <div className="text-xs text-muted-foreground">
                        Block cookies from external domains
                      </div>
                    </div>
                    <Switch checked={selectedProfile.settings.blockCookies} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm">Anonymize Data</div>
                      <div className="text-xs text-muted-foreground">
                        Strip identifying information from requests
                      </div>
                    </div>
                    <Switch checked={selectedProfile.settings.anonymizeData} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm">Use VPN</div>
                      <div className="text-xs text-muted-foreground">
                        Route traffic through secure VPN connection
                      </div>
                    </div>
                    <Switch checked={selectedProfile.settings.useVPN} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm">Randomize Fingerprint</div>
                      <div className="text-xs text-muted-foreground">
                        Change browser fingerprint to prevent tracking
                      </div>
                    </div>
                    <Switch checked={selectedProfile.settings.randomizeFingerprint} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm">Clear on Exit</div>
                      <div className="text-xs text-muted-foreground">
                        Automatically clear all data when closing
                      </div>
                    </div>
                    <Switch checked={selectedProfile.settings.clearOnExit} />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}