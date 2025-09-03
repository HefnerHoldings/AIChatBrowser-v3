import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Store,
  Download,
  Upload,
  Star,
  Shield,
  Package,
  GitBranch,
  Users,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Code,
  Puzzle,
  Award,
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MarketplaceItem {
  id: string;
  type: "playbook" | "plugin";
  name: string;
  author: string;
  description: string;
  version: string;
  downloads: number;
  rating: number;
  reviews: number;
  verified: boolean;
  permissions: string[];
  signature: string;
  price: number;
  tags: string[];
  lastUpdated: Date;
}

export function Marketplace() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isInstalling, setIsInstalling] = useState<string | null>(null);
  
  const [items] = useState<MarketplaceItem[]>([
    {
      id: "mp-1",
      type: "playbook",
      name: "EU Lead Generator Pro",
      author: "MadEasy Team",
      description: "Advanced lead generation for European B2B markets with GDPR compliance",
      version: "2.1.0",
      downloads: 1247,
      rating: 4.8,
      reviews: 89,
      verified: true,
      permissions: ["read", "write", "network"],
      signature: "verified",
      price: 0,
      tags: ["leads", "b2b", "europe", "gdpr"],
      lastUpdated: new Date(Date.now() - 86400000)
    },
    {
      id: "mp-2",
      type: "plugin",
      name: "Smart Form Filler",
      author: "AutomateHub",
      description: "AI-powered form detection and filling with validation",
      version: "1.5.2",
      downloads: 3456,
      rating: 4.6,
      reviews: 234,
      verified: true,
      permissions: ["read", "write", "storage"],
      signature: "verified",
      price: 0,
      tags: ["forms", "automation", "ai"],
      lastUpdated: new Date(Date.now() - 172800000)
    },
    {
      id: "mp-3",
      type: "playbook",
      name: "E-commerce Price Monitor",
      author: "PriceWatch",
      description: "Track competitor prices across major e-commerce platforms",
      version: "3.0.1",
      downloads: 892,
      rating: 4.9,
      reviews: 67,
      verified: false,
      permissions: ["read", "network", "notifications"],
      signature: "community",
      price: 0,
      tags: ["ecommerce", "pricing", "monitoring"],
      lastUpdated: new Date(Date.now() - 259200000)
    }
  ]);

  const handleInstall = async (itemId: string) => {
    setIsInstalling(itemId);
    
    // Simulate installation
    setTimeout(() => {
      setIsInstalling(null);
      toast({
        title: "Installation complete",
        description: "The item has been installed successfully",
      });
    }, 2000);
  };

  const handlePublish = () => {
    toast({
      title: "Publishing wizard opened",
      description: "Follow the steps to publish your playbook or plugin",
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Marketplace
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Download className="h-3 w-3 mr-1" />
                My Downloads
              </Button>
              <Button size="sm" onClick={handlePublish}>
                <Upload className="h-3 w-3 mr-1" />
                Publish
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Community playbooks and plugins with sandboxed execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="discover" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="discover">Discover</TabsTrigger>
              <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
              <TabsTrigger value="plugins">Plugins</TabsTrigger>
              <TabsTrigger value="installed">Installed</TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search marketplace..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button size="sm" variant="outline">
                  <Filter className="h-3 w-3 mr-1" />
                  Filter
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">4,312</div>
                        <div className="text-xs text-muted-foreground">Total Items</div>
                      </div>
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">892</div>
                        <div className="text-xs text-muted-foreground">Publishers</div>
                      </div>
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">45K</div>
                        <div className="text-xs text-muted-foreground">Downloads</div>
                      </div>
                      <Download className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">4.7</div>
                        <div className="text-xs text-muted-foreground">Avg Rating</div>
                      </div>
                      <Star className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            {item.type === "playbook" ? (
                              <Code className="h-4 w-4" />
                            ) : (
                              <Puzzle className="h-4 w-4" />
                            )}
                            <span className="font-medium">{item.name}</span>
                            <Badge variant="outline">{item.version}</Badge>
                            {item.verified && (
                              <Badge className="bg-blue-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {item.price === 0 && (
                              <Badge className="bg-green-500">Free</Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            {item.description}
                          </div>

                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {item.author}
                            </div>
                            <div className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {item.downloads.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              {item.rating} ({item.reviews})
                            </div>
                            <div className="text-muted-foreground">
                              Updated {new Date(item.lastUpdated).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button 
                          size="sm"
                          onClick={() => handleInstall(item.id)}
                          disabled={isInstalling === item.id}
                        >
                          {isInstalling === item.id ? (
                            <>Installing...</>
                          ) : (
                            <>
                              <Download className="h-3 w-3 mr-1" />
                              Install
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="playbooks" className="space-y-4">
              <Alert>
                <Code className="h-4 w-4" />
                <AlertDescription>
                  Playbooks are YAML-based workflow definitions that automate complex tasks
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium mb-2">Popular Categories</div>
                    <div className="space-y-1">
                      <Button variant="ghost" className="w-full justify-start text-xs">
                        Lead Generation (234)
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-xs">
                        Data Extraction (189)
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-xs">
                        Form Automation (156)
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-xs">
                        Testing & QA (123)
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium mb-2">Trending This Week</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs">EU GDPR Compliant Scraper</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs">LinkedIn Profile Enricher</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs">Multi-site Price Tracker</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="plugins" className="space-y-4">
              <Alert>
                <Puzzle className="h-4 w-4" />
                <AlertDescription>
                  Plugins extend browser capabilities with custom tools and integrations
                </AlertDescription>
              </Alert>

              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium mb-3">Security & Sandboxing</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span className="text-sm">All plugins run in isolated sandboxes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Permissions must match manifest declarations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Verified plugins undergo security review</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="installed" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Installed Items</span>
                <Button size="sm" variant="outline">
                  Check for Updates
                </Button>
              </div>

              <Alert>
                <Package className="h-4 w-4" />
                <AlertDescription>
                  You have 3 installed items. All are up to date.
                </AlertDescription>
              </Alert>

              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {items.slice(0, 3).map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {item.type === "playbook" ? (
                              <Code className="h-3 w-3" />
                            ) : (
                              <Puzzle className="h-3 w-3" />
                            )}
                            <span className="text-sm font-medium">{item.name}</span>
                            <Badge variant="outline" className="text-xs">{item.version}</Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost">
                              Configure
                            </Button>
                            <Button size="sm" variant="ghost">
                              Uninstall
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}