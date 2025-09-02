import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText,
  Plus,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Link2,
  Calendar,
  Search,
  Filter,
  Eye,
  Edit,
  Archive,
  TrendingUp,
  Lightbulb
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AdrRecord } from "@shared/schema";

interface RiskItem {
  id: string;
  title: string;
  level: "low" | "medium" | "high" | "critical";
  category: "technical" | "business" | "security" | "performance";
  impact: string;
  mitigation: string;
}

export function AdrPanel({ projectId }: { projectId?: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AdrRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: adrRecords = [], isLoading } = useQuery<AdrRecord[]>({
    queryKey: projectId ? ["/api/adr-records", { projectId }] : ["/api/adr-records"],
  });

  const createAdrMutation = useMutation({
    mutationFn: async (data: Partial<AdrRecord>) => {
      return apiRequest("POST", "/api/adr-records", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adr-records"] });
      setIsCreateOpen(false);
      toast({
        title: "ADR created",
        description: "Architecture decision record has been created",
      });
    }
  });

  const updateAdrMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<AdrRecord> & { id: string }) => {
      return apiRequest("PATCH", `/api/adr-records/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adr-records"] });
      toast({
        title: "ADR updated",
        description: "Architecture decision record has been updated",
      });
    }
  });

  const risks: RiskItem[] = [
    {
      id: "risk-1",
      title: "API Rate Limiting",
      level: "medium",
      category: "technical",
      impact: "May slow down data extraction for large datasets",
      mitigation: "Implement adaptive throttling and request queuing"
    },
    {
      id: "risk-2",
      title: "Data Privacy Compliance",
      level: "high",
      category: "security",
      impact: "GDPR/CCPA violations if PII is mishandled",
      mitigation: "Implement data anonymization and consent tracking"
    },
    {
      id: "risk-3",
      title: "Browser Resource Usage",
      level: "low",
      category: "performance",
      impact: "High memory usage with multiple concurrent sessions",
      mitigation: "Implement session pooling and resource limits"
    }
  ];

  const filteredRecords = adrRecords.filter(record => {
    if (filterStatus !== "all" && record.status !== filterStatus) return false;
    if (searchTerm && !record.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected": return <XCircle className="h-4 w-4 text-red-500" />;
      case "proposed": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "deprecated": return <Archive className="h-4 w-4 text-gray-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "default";
      case "rejected": return "destructive";
      case "proposed": return "secondary";
      case "deprecated": return "outline";
      default: return "outline";
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "default";
    }
  };

  const handleCreateAdr = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createAdrMutation.mutate({
      projectId,
      title: formData.get("title") as string,
      status: formData.get("status") as string,
      context: formData.get("context") as string,
      decision: formData.get("decision") as string,
      consequences: formData.get("consequences") as string,
      alternatives: formData.get("alternatives") ? 
        (formData.get("alternatives") as string).split("\n").filter(a => a.trim()) : 
        undefined
    });
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              ADR & Risk Radar
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-3 w-3 mr-1" />
                  New ADR
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Architecture Decision Record</DialogTitle>
                  <DialogDescription>
                    Document an important architectural decision
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAdr} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input 
                      id="title" 
                      name="title" 
                      placeholder="Use PostgreSQL for data persistence"
                      required 
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select 
                      id="status" 
                      name="status" 
                      className="w-full border rounded-md px-3 py-2"
                      defaultValue="proposed"
                    >
                      <option value="proposed">Proposed</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="context">Context</Label>
                    <Textarea 
                      id="context" 
                      name="context" 
                      placeholder="What is the issue that we're seeing that is motivating this decision?"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="decision">Decision</Label>
                    <Textarea 
                      id="decision" 
                      name="decision" 
                      placeholder="What is the change that we're proposing and/or doing?"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="consequences">Consequences</Label>
                    <Textarea 
                      id="consequences" 
                      name="consequences" 
                      placeholder="What becomes easier or more difficult to do because of this change?"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="alternatives">Alternatives (one per line)</Label>
                    <Textarea 
                      id="alternatives" 
                      name="alternatives" 
                      placeholder="Option 1: Use MongoDB&#10;Option 2: Use SQLite&#10;Option 3: Use in-memory storage"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createAdrMutation.isPending}>
                      Create ADR
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Track architectural decisions and project risks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="decisions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="decisions">Decisions</TabsTrigger>
              <TabsTrigger value="risks">Risk Radar</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="decisions" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search decisions..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-3 w-3 mr-1" />
                  Filter
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredRecords.map((record) => (
                    <Card 
                      key={record.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(record.status)}
                              <span className="font-medium">{record.title}</span>
                            </div>
                            <Badge variant={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {record.context}
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                            </div>
                            {record.relatedRecords && record.relatedRecords.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Link2 className="h-3 w-3" />
                                <span>{record.relatedRecords.length} related</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="risks" className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  3 risks require attention - 1 high priority
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {risks.map((risk) => (
                  <Card key={risk.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`h-4 w-4 ${
                              risk.level === "critical" || risk.level === "high" ? "text-red-500" :
                              risk.level === "medium" ? "text-yellow-500" : "text-gray-500"
                            }`} />
                            <span className="font-medium">{risk.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getRiskColor(risk.level)}>
                              {risk.level}
                            </Badge>
                            <Badge variant="outline">
                              {risk.category}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Impact: </span>
                            <span>{risk.impact}</span>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Mitigation: </span>
                            <span>{risk.mitigation}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Review
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3 mr-1" />
                            Update
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-green-500" />
                      <div>
                        <div className="text-2xl font-bold">12</div>
                        <div className="text-sm text-muted-foreground">Decisions this month</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Lightbulb className="h-8 w-8 text-yellow-500" />
                      <div>
                        <div className="text-2xl font-bold">8</div>
                        <div className="text-sm text-muted-foreground">Active proposals</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Decision Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {adrRecords.slice(0, 5).map((record, idx) => (
                      <div key={record.id} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{record.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(record.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        {idx < adrRecords.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}