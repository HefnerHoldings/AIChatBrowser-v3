import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Code,
  Play,
  Save,
  Upload,
  Download,
  FileCode,
  Terminal,
  Bug,
  CheckCircle,
  AlertTriangle,
  Zap,
  Package,
  GitBranch,
  Settings,
  Book,
  TestTube,
  Cpu
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PluginFile {
  name: string;
  content: string;
  language: string;
}

export function PluginDevelopment() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const [activeFile, setActiveFile] = useState("manifest.json");
  const [files] = useState<PluginFile[]>([
    {
      name: "manifest.json",
      language: "json",
      content: `{
  "name": "My Custom Plugin",
  "version": "1.0.0",
  "description": "A custom plugin for MadEasy Browser",
  "author": "Your Name",
  "permissions": ["read", "write", "network"],
  "main": "index.js",
  "icon": "icon.png",
  "hooks": {
    "onPageLoad": "handlePageLoad",
    "onDataExtract": "handleDataExtract",
    "onWorkflowStart": "handleWorkflowStart"
  }
}`
    },
    {
      name: "index.js",
      language: "javascript",
      content: `// MadEasy Plugin SDK
import { browser, storage, ui } from '@madeasy/sdk';

// Plugin initialization
export function init() {
  console.log('Plugin initialized');
  
  // Register toolbar button
  ui.registerButton({
    id: 'my-plugin-btn',
    icon: 'star',
    tooltip: 'My Plugin Action',
    onClick: handleButtonClick
  });
}

// Handle page load events
export function handlePageLoad(page) {
  console.log('Page loaded:', page.url);
  
  // Example: Extract data from specific pages
  if (page.url.includes('example.com')) {
    const data = browser.extractData({
      selector: '.product-info',
      fields: {
        title: 'h1',
        price: '.price',
        description: '.description'
      }
    });
    
    storage.save('extracted-data', data);
  }
}

// Handle data extraction events
export function handleDataExtract(data) {
  console.log('Data extracted:', data);
  
  // Example: Validate and enrich data
  const enriched = data.map(item => ({
    ...item,
    timestamp: new Date().toISOString(),
    source: browser.getCurrentUrl()
  }));
  
  return enriched;
}

// Handle workflow start events
export function handleWorkflowStart(workflow) {
  console.log('Workflow started:', workflow.name);
  
  // Example: Add custom steps to workflow
  workflow.addStep({
    name: 'Custom Processing',
    action: async (context) => {
      // Your custom logic here
      const result = await processData(context.data);
      return result;
    }
  });
}

// Custom button handler
function handleButtonClick() {
  ui.showNotification({
    title: 'Plugin Action',
    message: 'Custom action executed!',
    type: 'success'
  });
}

// Helper function
async function processData(data) {
  // Your processing logic
  return data;
}`
    },
    {
      name: "styles.css",
      language: "css",
      content: `/* Plugin custom styles */
.my-plugin-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  border-radius: 0.5rem;
}

.my-plugin-button {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
}

.my-plugin-button:hover {
  background: #45a049;
}`
    }
  ]);

  const [testResults] = useState([
    { test: "Plugin loads successfully", status: "passed" },
    { test: "Permissions are correctly defined", status: "passed" },
    { test: "Event handlers are registered", status: "passed" },
    { test: "Data extraction works", status: "failed", error: "Selector not found" },
    { test: "Storage operations work", status: "pending" }
  ]);

  const handleRunPlugin = () => {
    setIsRunning(true);
    
    setTimeout(() => {
      setIsRunning(false);
      toast({
        title: "Plugin started",
        description: "Your plugin is now running in development mode",
      });
    }, 2000);
  };

  const handleTestPlugin = () => {
    setIsTesting(true);
    
    setTimeout(() => {
      setIsTesting(false);
      toast({
        title: "Tests completed",
        description: "4 passed, 1 failed, 0 skipped",
      });
    }, 3000);
  };

  const handlePublish = () => {
    toast({
      title: "Publishing to marketplace",
      description: "Your plugin will be reviewed before going live",
    });
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".json")) return "📄";
    if (fileName.endsWith(".js")) return "📜";
    if (fileName.endsWith(".css")) return "🎨";
    return "📝";
  };

  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case "passed": return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "failed": return <AlertTriangle className="h-3 w-3 text-red-500" />;
      case "pending": return <Clock className="h-3 w-3 text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Plugin Development Studio
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleTestPlugin}
                disabled={isTesting}
              >
                {isTesting ? (
                  <>
                    <TestTube className="h-3 w-3 mr-1 animate-pulse" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-3 w-3 mr-1" />
                    Test
                  </>
                )}
              </Button>
              <Button 
                size="sm"
                onClick={handleRunPlugin}
                disabled={isRunning}
              >
                {isRunning ? (
                  <>
                    <Cpu className="h-3 w-3 mr-1 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Run
                  </>
                )}
              </Button>
              <Button size="sm" variant="default" onClick={handlePublish}>
                <Upload className="h-3 w-3 mr-1" />
                Publish
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Create, test, and publish custom plugins for MadEasy Browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="console">Console</TabsTrigger>
              <TabsTrigger value="tests">Tests</TabsTrigger>
              <TabsTrigger value="docs">Documentation</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-sm font-medium mb-2">Project Files</div>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-1">
                          {files.map((file) => (
                            <div
                              key={file.name}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted ${
                                activeFile === file.name ? "bg-muted" : ""
                              }`}
                              onClick={() => setActiveFile(file.name)}
                            >
                              <span>{getFileIcon(file.name)}</span>
                              <span className="text-sm">{file.name}</span>
                            </div>
                          ))}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="w-full justify-start mt-2"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            New File
                          </Button>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                <div className="col-span-3">
                  <Card>
                    <CardContent className="p-0">
                      <div className="border-b p-2 flex items-center justify-between bg-muted">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4" />
                          <span className="text-sm font-medium">{activeFile}</span>
                          <Badge variant="secondary" className="text-xs">
                            {files.find(f => f.name === activeFile)?.language}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost">
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-3">
                        <textarea
                          className="w-full h-[400px] font-mono text-sm bg-background border-0 outline-none resize-none"
                          value={files.find(f => f.name === activeFile)?.content}
                          spellCheck={false}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="console" className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <div className="border-b p-2 flex items-center justify-between bg-muted">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      <span className="text-sm font-medium">Development Console</span>
                    </div>
                    <Button size="sm" variant="ghost">Clear</Button>
                  </div>
                  <ScrollArea className="h-[400px] p-3">
                    <div className="font-mono text-xs space-y-1">
                      <div className="text-blue-500">[INFO] Plugin development server started</div>
                      <div className="text-green-500">[SUCCESS] Plugin loaded: My Custom Plugin v1.0.0</div>
                      <div className="text-gray-500">[DEBUG] Registering event handlers...</div>
                      <div className="text-gray-500">[DEBUG] - onPageLoad: handlePageLoad</div>
                      <div className="text-gray-500">[DEBUG] - onDataExtract: handleDataExtract</div>
                      <div className="text-gray-500">[DEBUG] - onWorkflowStart: handleWorkflowStart</div>
                      <div className="text-green-500">[SUCCESS] All event handlers registered</div>
                      <div className="text-blue-500">[INFO] Toolbar button registered: my-plugin-btn</div>
                      <div className="text-yellow-500">[WARN] Deprecated API usage in line 23</div>
                      <div className="text-blue-500">[INFO] Waiting for events...</div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tests" className="space-y-4">
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  Run automated tests to ensure your plugin works correctly
                </AlertDescription>
              </Alert>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {testResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {getTestStatusIcon(result.status)}
                          <span className="text-sm">{result.test}</span>
                        </div>
                        {result.error && (
                          <span className="text-xs text-red-500">{result.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Test coverage: 78%
                    </div>
                    <Button size="sm" onClick={handleTestPlugin}>
                      Run All Tests
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="docs" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium mb-2">MadEasy Plugin SDK</div>
                      <div className="text-sm text-muted-foreground">
                        The MadEasy Plugin SDK provides a powerful API for extending browser functionality.
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="font-medium text-sm">Available APIs:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Card>
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Zap className="h-4 w-4" />
                              <span className="text-sm font-medium">Browser API</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Navigate, extract data, interact with pages
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Package className="h-4 w-4" />
                              <span className="text-sm font-medium">Storage API</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Save and retrieve plugin data
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Settings className="h-4 w-4" />
                              <span className="text-sm font-medium">UI API</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Add buttons, panels, and notifications
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <GitBranch className="h-4 w-4" />
                              <span className="text-sm font-medium">Workflow API</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Integrate with workflow engine
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      <Book className="h-4 w-4 mr-2" />
                      View Full Documentation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="plugin-name">Plugin Name</Label>
                      <Input id="plugin-name" value="My Custom Plugin" />
                    </div>
                    <div>
                      <Label htmlFor="plugin-version">Version</Label>
                      <Input id="plugin-version" value="1.0.0" />
                    </div>
                    <div>
                      <Label htmlFor="plugin-description">Description</Label>
                      <textarea 
                        id="plugin-description"
                        className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                        value="A custom plugin for MadEasy Browser"
                      />
                    </div>
                    <div>
                      <Label>Required Permissions</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge>read</Badge>
                        <Badge>write</Badge>
                        <Badge>network</Badge>
                        <Button size="sm" variant="outline">
                          <Plus className="h-3 w-3 mr-1" />
                          Add Permission
                        </Button>
                      </div>
                    </div>
                    <Button>Save Settings</Button>
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

// Add missing import
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";