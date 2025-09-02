import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText,
  Download,
  Send,
  Eye,
  Settings,
  Calendar,
  BarChart3,
  Table,
  Image,
  FileDown,
  Mail,
  Share2,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  PieChart,
  TrendingUp,
  Users,
  Globe,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  sections: string[];
  format: "pdf" | "html" | "both";
}

interface ReportSection {
  id: string;
  title: string;
  type: "text" | "chart" | "table" | "image" | "metrics";
  included: boolean;
  data?: any;
}

export function ReportGenerator({ projectId }: { projectId?: string }) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportFormat, setReportFormat] = useState<"pdf" | "html" | "both">("pdf");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [reportSections, setReportSections] = useState<ReportSection[]>([
    { id: "summary", title: "Executive Summary", type: "text", included: true },
    { id: "metrics", title: "Key Metrics", type: "metrics", included: true },
    { id: "leads", title: "Extracted Leads", type: "table", included: true },
    { id: "performance", title: "Performance Analytics", type: "chart", included: true },
    { id: "workflow", title: "Workflow Execution", type: "table", included: true },
    { id: "privacy", title: "Privacy Compliance", type: "text", included: false },
    { id: "recommendations", title: "Recommendations", type: "text", included: true },
  ]);

  const templates: ReportTemplate[] = [
    {
      id: "lead-gen",
      name: "Lead Generation Report",
      description: "Comprehensive report on extracted leads and validation",
      icon: <Users className="h-4 w-4" />,
      sections: ["summary", "metrics", "leads", "recommendations"],
      format: "both"
    },
    {
      id: "performance",
      name: "Performance Analytics",
      description: "Detailed performance metrics and optimization insights",
      icon: <TrendingUp className="h-4 w-4" />,
      sections: ["summary", "metrics", "performance", "workflow"],
      format: "pdf"
    },
    {
      id: "compliance",
      name: "Compliance Report",
      description: "Privacy and data compliance documentation",
      icon: <Globe className="h-4 w-4" />,
      sections: ["summary", "privacy", "metrics"],
      format: "pdf"
    },
    {
      id: "executive",
      name: "Executive Summary",
      description: "High-level overview for stakeholders",
      icon: <BarChart3 className="h-4 w-4" />,
      sections: ["summary", "metrics", "recommendations"],
      format: "html"
    }
  ];

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Report generated successfully",
        description: `Your ${reportFormat.toUpperCase()} report is ready for download`,
      });
    }, 3000);
  };

  const handleSectionToggle = (sectionId: string) => {
    setReportSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, included: !section.included }
          : section
      )
    );
  };

  const mockReportData = {
    generatedAt: new Date().toISOString(),
    projectName: "EU Lead Generation Project",
    totalLeads: 156,
    validatedLeads: 142,
    conversionRate: 91,
    executionTime: "4h 23m",
    dataProcessed: "12.3 GB",
    tasksCompleted: 24,
    successRate: 96
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Generator
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Report Preview</DialogTitle>
                    <DialogDescription>
                      Preview of your generated report
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[500px] mt-4">
                    <div className="space-y-6 p-6 bg-white dark:bg-gray-900 rounded">
                      <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold">MadEasy Browser Report</h1>
                        <p className="text-muted-foreground">{mockReportData.projectName}</p>
                        <p className="text-sm text-muted-foreground">
                          Generated on {new Date(mockReportData.generatedAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center p-4 border rounded">
                          <div className="text-2xl font-bold">{mockReportData.totalLeads}</div>
                          <div className="text-sm text-muted-foreground">Total Leads</div>
                        </div>
                        <div className="text-center p-4 border rounded">
                          <div className="text-2xl font-bold">{mockReportData.conversionRate}%</div>
                          <div className="text-sm text-muted-foreground">Validation Rate</div>
                        </div>
                        <div className="text-center p-4 border rounded">
                          <div className="text-2xl font-bold">{mockReportData.executionTime}</div>
                          <div className="text-sm text-muted-foreground">Execution Time</div>
                        </div>
                        <div className="text-center p-4 border rounded">
                          <div className="text-2xl font-bold">{mockReportData.successRate}%</div>
                          <div className="text-sm text-muted-foreground">Success Rate</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Executive Summary</h2>
                        <p className="text-sm leading-relaxed">
                          The automated lead generation process successfully extracted and validated {mockReportData.totalLeads} leads 
                          from European cookware wholesalers. The system achieved a {mockReportData.conversionRate}% validation rate, 
                          processing {mockReportData.dataProcessed} of data in {mockReportData.executionTime}. 
                          All {mockReportData.tasksCompleted} automation tasks completed successfully with a {mockReportData.successRate}% success rate.
                        </p>
                      </div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <Button 
                size="sm" 
                onClick={handleGenerateReport}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Clock className="h-3 w-3 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Create professional reports from your automation data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="customize">Customize</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id ? "border-primary" : ""
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {template.icon}
                            <span className="font-medium">{template.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                          <div className="flex gap-2">
                            {template.format === "both" ? (
                              <>
                                <Badge variant="outline">PDF</Badge>
                                <Badge variant="outline">HTML</Badge>
                              </>
                            ) : (
                              <Badge variant="outline">{template.format.toUpperCase()}</Badge>
                            )}
                          </div>
                        </div>
                        {selectedTemplate?.id === template.id && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedTemplate && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div>Selected template: <strong>{selectedTemplate.name}</strong></div>
                      <div className="text-xs">
                        Includes: {selectedTemplate.sections.join(", ")}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="customize" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Report Title</Label>
                  <Input 
                    placeholder="Enter report title" 
                    defaultValue="MadEasy Browser Automation Report"
                  />
                </div>

                <div>
                  <Label>Report Format</Label>
                  <Select value={reportFormat} onValueChange={(value: any) => setReportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="html">HTML Report</SelectItem>
                      <SelectItem value="both">Both PDF & HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Include Sections</Label>
                  <div className="space-y-2 mt-2">
                    {reportSections.map((section) => (
                      <div key={section.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={section.included}
                            onCheckedChange={() => handleSectionToggle(section.id)}
                          />
                          <div>
                            <div className="text-sm font-medium">{section.title}</div>
                            <div className="text-xs text-muted-foreground">Type: {section.type}</div>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {section.type === "chart" && <PieChart className="h-3 w-3" />}
                          {section.type === "table" && <Table className="h-3 w-3" />}
                          {section.type === "text" && <FileText className="h-3 w-3" />}
                          {section.type === "metrics" && <BarChart3 className="h-3 w-3" />}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Additional Notes</Label>
                  <Textarea 
                    placeholder="Add any additional notes or comments for the report"
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <div className="space-y-4">
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    Schedule automatic report generation and delivery
                  </AlertDescription>
                </Alert>

                <div>
                  <Label>Frequency</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom Schedule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Delivery Method</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button variant="outline" className="justify-start">
                      <Mail className="h-3 w-3 mr-2" />
                      Email
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Share2 className="h-3 w-3 mr-2" />
                      Webhook
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <FileDown className="h-3 w-3 mr-2" />
                      Cloud Storage
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Recipients</Label>
                  <Input 
                    placeholder="email@example.com, email2@example.com" 
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline">
                    Test Schedule
                  </Button>
                  <Button>
                    <Calendar className="h-3 w-3 mr-1" />
                    Save Schedule
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}