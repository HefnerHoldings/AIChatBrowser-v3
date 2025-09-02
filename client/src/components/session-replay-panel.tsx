import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Circle,
  Square,
  Video,
  Clock,
  MousePointer,
  Keyboard,
  Network,
  Monitor,
  Download,
  Share2,
  ChevronRight,
  Info,
  Activity,
  Eye,
  Camera
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { SessionReplay } from "@shared/schema";

interface ReplayEvent {
  timestamp: number;
  type: "click" | "input" | "navigation" | "network" | "console" | "error";
  details: any;
}

export function SessionReplayPanel({ projectId }: { projectId?: string }) {
  const queryClient = useQueryClient();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedReplay, setSelectedReplay] = useState<SessionReplay | null>(null);

  const { data: replays = [], isLoading } = useQuery<SessionReplay[]>({
    queryKey: ["/api/session-replays", projectId],
    queryFn: async () => {
      const params = projectId ? `?projectId=${projectId}` : "";
      return apiRequest(`/api/session-replays${params}`);
    }
  });

  const createReplayMutation = useMutation({
    mutationFn: async (data: Partial<SessionReplay>) => {
      return apiRequest("/api/session-replays", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/session-replays"] });
      setIsRecording(true);
    }
  });

  const updateReplayMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<SessionReplay> & { id: string }) => {
      return apiRequest(`/api/session-replays/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/session-replays"] });
    }
  });

  const handleStartRecording = () => {
    createReplayMutation.mutate({
      projectId,
      name: `Recording ${new Date().toLocaleString()}`,
      startUrl: window.location.href,
      status: "recording",
      recordingData: {
        events: [],
        snapshots: [],
        network: []
      }
    });
  };

  const handleStopRecording = () => {
    if (selectedReplay?.id) {
      updateReplayMutation.mutate({
        id: selectedReplay.id,
        status: "completed",
        endUrl: window.location.href,
        completedAt: new Date(),
        duration: Date.now() - new Date(selectedReplay.createdAt).getTime()
      });
    }
    setIsRecording(false);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const mockEvents: ReplayEvent[] = [
    { timestamp: 0, type: "navigation", details: { url: "https://example.com" } },
    { timestamp: 2000, type: "click", details: { element: "button#submit", x: 450, y: 320 } },
    { timestamp: 3500, type: "input", details: { element: "input#email", value: "user@example.com" } },
    { timestamp: 5000, type: "network", details: { method: "POST", url: "/api/login", status: 200 } },
    { timestamp: 7000, type: "console", details: { level: "info", message: "User logged in successfully" } },
  ];

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Session Replay
            </div>
            <div className="flex items-center gap-2">
              {isRecording ? (
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={handleStopRecording}
                >
                  <Square className="h-3 w-3 mr-1" />
                  Stop Recording
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={handleStartRecording}
                >
                  <Circle className="h-3 w-3 mr-1 text-red-500 fill-red-500" />
                  Start Recording
                </Button>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Record and replay browser sessions for debugging and monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="player" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="player">Player</TabsTrigger>
              <TabsTrigger value="recordings">Recordings</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>

            <TabsContent value="player" className="space-y-4">
              {selectedReplay ? (
                <>
                  <div className="bg-muted rounded-lg p-4 aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <Monitor className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Session replay viewport</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedReplay.startUrl}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-12">
                        {formatDuration(currentTime)}
                      </span>
                      <Slider 
                        value={[currentTime]} 
                        onValueChange={([value]) => setCurrentTime(value)}
                        max={selectedReplay.duration || 10000}
                        step={100}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-12">
                        {formatDuration(selectedReplay.duration || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <Button size="sm" variant="outline">
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button size="sm" variant="outline">
                        <SkipForward className="h-4 w-4" />
                      </Button>
                      <div className="ml-4">
                        <select 
                          value={playbackSpeed} 
                          onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value={0.5}>0.5x</option>
                          <option value={1}>1x</option>
                          <option value={1.5}>1.5x</option>
                          <option value={2}>2x</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <MousePointer className="h-3 w-3" />
                      <span>24 clicks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Keyboard className="h-3 w-3" />
                      <span>156 keys</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Network className="h-3 w-3" />
                      <span>42 requests</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      <span>3 errors</span>
                    </div>
                  </div>
                </>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Select a recording from the list or start a new recording to begin
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="recordings" className="space-y-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {replays.map((replay) => (
                    <Card 
                      key={replay.id}
                      className={`cursor-pointer transition-colors ${
                        selectedReplay?.id === replay.id ? "border-primary" : ""
                      }`}
                      onClick={() => setSelectedReplay(replay)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{replay.name}</span>
                              <Badge variant={
                                replay.status === "recording" ? "destructive" :
                                replay.status === "completed" ? "default" :
                                replay.status === "error" ? "destructive" : "secondary"
                              }>
                                {replay.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(replay.createdAt).toLocaleString()}
                            </div>
                            {replay.duration && (
                              <div className="text-xs text-muted-foreground">
                                Duration: {formatDuration(replay.duration)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Share2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  {mockEvents.map((event, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                      onClick={() => setCurrentTime(event.timestamp)}
                    >
                      <span className="text-xs text-muted-foreground w-16">
                        {formatDuration(event.timestamp)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                      <span className="text-xs flex-1">
                        {JSON.stringify(event.details).substring(0, 50)}...
                      </span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>
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