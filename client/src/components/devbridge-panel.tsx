import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Code2, 
  Globe, 
  Zap, 
  Terminal, 
  Layers,
  Send,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  GitBranch,
  Package,
  Database,
  FileCode,
  Cpu
} from "lucide-react";

interface DevBridgeConnection {
  id: string;
  platform: "lovable" | "bolt" | "replit" | "github" | "vercel";
  status: "connected" | "disconnected" | "syncing";
  lastSync?: Date;
  apiKey?: string;
}

interface DevBridgeTask {
  id: string;
  type: "create" | "update" | "deploy" | "test" | "sync";
  platform: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  logs: string[];
}

export function DevBridgePanel() {
  const [connections, setConnections] = useState<DevBridgeConnection[]>([
    { id: "1", platform: "replit", status: "connected", lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: "2", platform: "lovable", status: "disconnected" },
    { id: "3", platform: "bolt", status: "disconnected" },
  ]);

  const [activeTasks, setActiveTasks] = useState<DevBridgeTask[]>([
    {
      id: "task-1",
      type: "sync",
      platform: "replit",
      description: "Syncing project structure and dependencies",
      status: "running",
      progress: 65,
      logs: [
        "[09:15:30] Analyzing project structure...",
        "[09:15:31] Found 42 components, 15 pages",
        "[09:15:32] Syncing package dependencies...",
        "[09:15:33] Updating environment variables...",
      ]
    }
  ]);

  const [selectedPlatform, setSelectedPlatform] = useState<string>("replit");

  const platformIcons = {
    lovable: <Code2 className="h-4 w-4" />,
    bolt: <Zap className="h-4 w-4" />,
    replit: <Terminal className="h-4 w-4" />,
    github: <GitBranch className="h-4 w-4" />,
    vercel: <Globe className="h-4 w-4" />
  };

  const handleConnect = (platform: string) => {
    setConnections(prev => 
      prev.map(conn => 
        conn.platform === platform 
          ? { ...conn, status: "connected", lastSync: new Date() }
          : conn
      )
    );
  };

  const handleSync = (platform: string) => {
    const newTask: DevBridgeTask = {
      id: `task-${Date.now()}`,
      type: "sync",
      platform,
      description: `Syncing with ${platform}`,
      status: "running",
      progress: 0,
      logs: [`[${new Date().toLocaleTimeString()}] Starting sync...`]
    };
    setActiveTasks(prev => [...prev, newTask]);
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            DevBridge
          </CardTitle>
          <CardDescription>
            Connect and sync with development platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="connections" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="connections">Connections</TabsTrigger>
              <TabsTrigger value="tasks">Active Tasks</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="connections" className="space-y-4">
              <div className="space-y-3">
                {connections.map(conn => (
                  <div key={conn.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {platformIcons[conn.platform]}
                      <div>
                        <div className="font-medium capitalize">{conn.platform}</div>
                        {conn.lastSync && (
                          <div className="text-xs text-muted-foreground">
                            Last sync: {conn.lastSync.toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        conn.status === "connected" ? "default" :
                        conn.status === "syncing" ? "secondary" : "outline"
                      }>
                        {conn.status}
                      </Badge>
                      {conn.status === "disconnected" ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleConnect(conn.platform)}
                        >
                          Connect
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSync(conn.platform)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Sync
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    <Package className="h-3 w-3 mr-1" />
                    Sync Dependencies
                  </Button>
                  <Button variant="outline" size="sm">
                    <Database className="h-3 w-3 mr-1" />
                    Sync Database
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileCode className="h-3 w-3 mr-1" />
                    Push Code
                  </Button>
                  <Button variant="outline" size="sm">
                    <Globe className="h-3 w-3 mr-1" />
                    Deploy
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {activeTasks.map(task => (
                    <Card key={task.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {task.status === "running" && <Cpu className="h-4 w-4 animate-pulse text-blue-500" />}
                            {task.status === "completed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            {task.status === "failed" && <AlertCircle className="h-4 w-4 text-red-500" />}
                            {task.status === "pending" && <Clock className="h-4 w-4 text-gray-500" />}
                            <span className="text-sm font-medium">{task.description}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {task.platform}
                          </Badge>
                        </div>
                        
                        {task.status === "running" && (
                          <Progress value={task.progress} className="h-2 mb-2" />
                        )}

                        <div className="bg-muted rounded p-2 max-h-24 overflow-y-auto">
                          <code className="text-xs">
                            {task.logs.map((log, idx) => (
                              <div key={idx}>{log}</div>
                            ))}
                          </code>
                        </div>

                        {task.status === "running" && (
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline" className="h-7">
                              <Pause className="h-3 w-3 mr-1" />
                              Pause
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-red-600">
                              Cancel
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="config" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Default Platform</label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="replit">Replit</SelectItem>
                      <SelectItem value="lovable">Lovable</SelectItem>
                      <SelectItem value="bolt">Bolt</SelectItem>
                      <SelectItem value="github">GitHub</SelectItem>
                      <SelectItem value="vercel">Vercel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-sync changes</span>
                    <Button size="sm" variant="outline">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Deployment triggers</span>
                    <Button size="sm" variant="outline">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Environment variables</span>
                    <Button size="sm" variant="outline">Manage</Button>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    DevBridge allows seamless integration with development platforms. 
                    Configure API keys in settings to enable full functionality.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}