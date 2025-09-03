import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Target,
  Layers,
  GitBranch,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Code,
  Hash,
  Type,
  Box,
  Sparkles,
  Database,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SelectorProfile {
  domain: string;
  preferredSelectors: string[];
  fallbacks: string[];
  antiPatterns: string[];
  stabilityScores: Record<string, number>;
  lastUpdated: Date;
}

interface SelectorAnalysis {
  selector: string;
  stabilityScore: number;
  factors: {
    hasAriaLabel: boolean;
    hasVisibleText: boolean;
    hasDataAttribute: boolean;
    domDepth: number;
    siblingVariance: number;
    isUnique: boolean;
  };
  alternatives: string[];
  recommendation: "preferred" | "acceptable" | "avoid";
}

export function SelectorStudioV2({ domain = "example.com" }: { domain?: string }) {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentSelector, setCurrentSelector] = useState("[data-testid='submit-button']");
  
  const [analysis, setAnalysis] = useState<SelectorAnalysis>({
    selector: currentSelector,
    stabilityScore: 85,
    factors: {
      hasAriaLabel: true,
      hasVisibleText: true,
      hasDataAttribute: true,
      domDepth: 3,
      siblingVariance: 2,
      isUnique: true
    },
    alternatives: [
      "button[aria-label='Submit']",
      "button:contains('Submit')",
      "#form-container > button.primary",
      "//button[text()='Submit']"
    ],
    recommendation: "preferred"
  });

  const [domainProfile, setDomainProfile] = useState<SelectorProfile>({
    domain: domain,
    preferredSelectors: [
      "[data-testid]",
      "[aria-label]",
      "button:contains(text)"
    ],
    fallbacks: [
      ".class-name",
      "#id",
      "tag[attribute]"
    ],
    antiPatterns: [
      "div > div > div > div",
      ".css-[hash]",
      ":nth-child(n)"
    ],
    stabilityScores: {
      "[data-testid]": 95,
      "[aria-label]": 90,
      "text-based": 85,
      ".class": 70,
      "#id": 80,
      "xpath": 60
    },
    lastUpdated: new Date()
  });

  const analyzeSelector = () => {
    setIsAnalyzing(true);
    
    // Simulate selector analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      toast({
        title: "Selector analyzed",
        description: `Stability score: ${analysis.stabilityScore}/100`,
      });
    }, 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case "preferred": return <Badge className="bg-green-500">Preferred</Badge>;
      case "acceptable": return <Badge>Acceptable</Badge>;
      case "avoid": return <Badge variant="destructive">Avoid</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Selector Studio v2
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Database className="h-3 w-3 mr-1" />
                {domain}
              </Badge>
              <Button size="sm" variant="outline">
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync Profile
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Intelligent selector analysis with stability scoring and learning profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="analyze" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analyze">Analyze</TabsTrigger>
              <TabsTrigger value="profile">Domain Profile</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
            </TabsList>

            <TabsContent value="analyze" className="space-y-4">
              <div className="space-y-2">
                <Label>Selector to Analyze</Label>
                <div className="flex gap-2">
                  <Input 
                    value={currentSelector}
                    onChange={(e) => setCurrentSelector(e.target.value)}
                    placeholder="Enter CSS selector, XPath, or text-based selector"
                    className="font-mono text-sm"
                  />
                  <Button onClick={analyzeSelector} disabled={isAnalyzing}>
                    {isAnalyzing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Stability Score</div>
                        <div className={`text-3xl font-bold ${getScoreColor(analysis.stabilityScore)}`}>
                          {analysis.stabilityScore}/100
                        </div>
                      </div>
                      {getRecommendationBadge(analysis.recommendation)}
                    </div>

                    <Progress value={analysis.stabilityScore} className="h-2" />

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        {analysis.factors.hasAriaLabel ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-xs">ARIA Label</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {analysis.factors.hasVisibleText ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-xs">Visible Text</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {analysis.factors.hasDataAttribute ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-xs">Data Attribute</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {analysis.factors.isUnique ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        )}
                        <span className="text-xs">Unique Match</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Alternative Selectors</div>
                      <ScrollArea className="h-[100px] border rounded p-2">
                        <div className="space-y-1">
                          {analysis.alternatives.map((alt, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <code className="text-xs bg-muted px-1 rounded">{alt}</code>
                              <Badge variant="outline" className="text-xs">
                                {85 - index * 5}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
              <Alert>
                <Layers className="h-4 w-4" />
                <AlertDescription>
                  Domain-specific selector preferences learned from {domain}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2">Preferred Selectors</Label>
                  <div className="space-y-1">
                    {domainProfile.preferredSelectors.map((selector, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-500/10 rounded">
                        <code className="text-xs">{selector}</code>
                        <Badge className="bg-green-500 text-xs">
                          {domainProfile.stabilityScores[selector.split("]")[0] + "]"] || 90}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2">Fallback Selectors</Label>
                  <div className="space-y-1">
                    {domainProfile.fallbacks.map((selector, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-yellow-500/10 rounded">
                        <code className="text-xs">{selector}</code>
                        <Badge variant="outline" className="text-xs">
                          {domainProfile.stabilityScores[selector] || 70}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2">Anti-Patterns to Avoid</Label>
                  <div className="space-y-1">
                    {domainProfile.antiPatterns.map((pattern, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-red-500/10 rounded">
                        <code className="text-xs">{pattern}</code>
                        <Badge variant="destructive" className="text-xs">
                          Unstable
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="learning" className="space-y-4">
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Machine learning model continuously improves selector stability
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Training Samples</span>
                  <Badge>1,247</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Accuracy</span>
                  <Badge>93.2%</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Updated</span>
                  <Badge variant="outline">2 hours ago</Badge>
                </div>

                <div className="space-y-2">
                  <Label>Selector Type Distribution</Label>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Hash className="h-3 w-3" />
                      <div className="flex-1">
                        <Progress value={35} className="h-2" />
                      </div>
                      <span className="text-xs">35% ID</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Box className="h-3 w-3" />
                      <div className="flex-1">
                        <Progress value={40} className="h-2" />
                      </div>
                      <span className="text-xs">40% Data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Type className="h-3 w-3" />
                      <div className="flex-1">
                        <Progress value={25} className="h-2" />
                      </div>
                      <span className="text-xs">25% Text</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Export Learning Model
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}