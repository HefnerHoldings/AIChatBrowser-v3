import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users,
  UserPlus,
  MessageSquare,
  Video,
  Share2,
  Eye,
  Edit,
  Lock,
  Unlock,
  MousePointer,
  AtSign,
  Send,
  Circle,
  CheckCircle,
  AlertTriangle,
  Clock,
  GitBranch
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "viewer" | "editor" | "admin";
  status: "online" | "away" | "offline";
  cursor?: { x: number; y: number; color: string };
  lastSeen: Date;
}

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: Date;
  mentions: string[];
  resolved: boolean;
}

interface ReviewRule {
  id: string;
  name: string;
  condition: string;
  reviewers: number;
  status: "pending" | "approved" | "rejected";
}

export function CollaborativeMode({ sessionId = "session-1" }: { sessionId?: string }) {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [sessionLocked, setSessionLocked] = useState(false);
  const [newComment, setNewComment] = useState("");
  
  const [collaborators] = useState<Collaborator[]>([
    {
      id: "user-1",
      name: "Alice Johnson",
      email: "alice@madeasy.com",
      role: "admin",
      status: "online",
      cursor: { x: 450, y: 320, color: "#3B82F6" },
      lastSeen: new Date()
    },
    {
      id: "user-2",
      name: "Bob Smith",
      email: "bob@madeasy.com",
      role: "editor",
      status: "online",
      cursor: { x: 780, y: 420, color: "#10B981" },
      lastSeen: new Date()
    },
    {
      id: "user-3",
      name: "Carol White",
      email: "carol@madeasy.com",
      role: "viewer",
      status: "away",
      lastSeen: new Date(Date.now() - 600000)
    }
  ]);

  const [comments] = useState<Comment[]>([
    {
      id: "comment-1",
      author: "Alice Johnson",
      text: "Can we add more validation to the lead extraction? @Bob",
      timestamp: new Date(Date.now() - 3600000),
      mentions: ["Bob"],
      resolved: false
    },
    {
      id: "comment-2",
      author: "Bob Smith",
      text: "Good idea! I'll add email and phone validation",
      timestamp: new Date(Date.now() - 1800000),
      mentions: [],
      resolved: false
    }
  ]);

  const [reviewRules] = useState<ReviewRule[]>([
    {
      id: "rule-1",
      name: "Critical changes require 2 reviewers",
      condition: "changes to production workflows",
      reviewers: 2,
      status: "pending"
    },
    {
      id: "rule-2",
      name: "Data export approval",
      condition: "exporting > 1000 leads",
      reviewers: 1,
      status: "approved"
    }
  ]);

  const startSharing = () => {
    setIsSharing(true);
    toast({
      title: "Session shared",
      description: "Collaborators can now join your session",
    });
  };

  const toggleLock = () => {
    setSessionLocked(!sessionLocked);
    toast({
      title: sessionLocked ? "Session unlocked" : "Session locked",
      description: sessionLocked ? "Editing enabled for collaborators" : "Session is now read-only",
    });
  };

  const sendComment = () => {
    if (!newComment.trim()) return;
    
    toast({
      title: "Comment posted",
      description: "Your comment has been added to the session",
    });
    setNewComment("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "away": return "bg-yellow-500";
      case "offline": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge className="bg-purple-500">Admin</Badge>;
      case "editor": return <Badge>Editor</Badge>;
      case "viewer": return <Badge variant="secondary">Viewer</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Collaborative Mode
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={toggleLock}
              >
                {sessionLocked ? (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3 mr-1" />
                    Unlocked
                  </>
                )}
              </Button>
              <Button 
                size="sm"
                onClick={startSharing}
                disabled={isSharing}
              >
                {isSharing ? (
                  <>
                    <Circle className="h-3 w-3 mr-1 animate-pulse text-red-500" />
                    Live Session
                  </>
                ) : (
                  <>
                    <Share2 className="h-3 w-3 mr-1" />
                    Start Sharing
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Real-time collaboration with shared sessions and review rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="collaborators" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="review">Review Rules</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="collaborators" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Active Collaborators</span>
                <Button size="sm" variant="outline">
                  <UserPlus className="h-3 w-3 mr-1" />
                  Invite
                </Button>
              </div>

              <div className="space-y-3">
                {collaborators.map((collaborator) => (
                  <Card key={collaborator.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={collaborator.avatar} />
                              <AvatarFallback>
                                {collaborator.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(collaborator.status)}`} />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{collaborator.name}</div>
                            <div className="text-xs text-muted-foreground">{collaborator.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRoleBadge(collaborator.role)}
                          {collaborator.cursor && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MousePointer className="h-3 w-3" style={{ color: collaborator.cursor.color }} />
                              ({collaborator.cursor.x}, {collaborator.cursor.y})
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Alert>
                <Eye className="h-4 w-4" />
                <AlertDescription>
                  Live cursors and selections are visible to all collaborators in real-time
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              <div className="space-y-3">
                <ScrollArea className="h-[300px] border rounded p-3">
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {comment.author.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">{comment.author}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.timestamp).toLocaleTimeString()}
                              </span>
                              {comment.resolved && (
                                <Badge variant="outline" className="text-xs">
                                  <CheckCircle className="h-2 w-2 mr-1" />
                                  Resolved
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm">
                              {comment.text.split(" ").map((word, index) => 
                                word.startsWith("@") ? (
                                  <span key={index} className="text-primary font-medium">{word} </span>
                                ) : (
                                  <span key={index}>{word} </span>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Add a comment... Use @ to mention"
                      className="pl-9"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendComment()}
                    />
                  </div>
                  <Button size="sm" onClick={sendComment}>
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="review" className="space-y-4">
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  Two-eyes principle enforced for critical changes
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {reviewRules.map((rule) => (
                  <Card key={rule.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{rule.name}</span>
                            <Badge variant={
                              rule.status === "approved" ? "default" :
                              rule.status === "rejected" ? "destructive" :
                              "secondary"
                            }>
                              {rule.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Condition: {rule.condition}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Users className="h-3 w-3" />
                            Requires {rule.reviewers} reviewer{rule.reviewers > 1 ? "s" : ""}
                          </div>
                        </div>
                        {rule.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Alice Johnson</span>
                        <span className="text-xs text-muted-foreground">2 minutes ago</span>
                      </div>
                      <div className="text-muted-foreground">Started editing workflow</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2">
                    <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Bob Smith</span>
                        <span className="text-xs text-muted-foreground">5 minutes ago</span>
                      </div>
                      <div className="text-muted-foreground">Added a comment</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2">
                    <GitBranch className="h-4 w-4 text-green-500 mt-0.5" />
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Carol White</span>
                        <span className="text-xs text-muted-foreground">10 minutes ago</span>
                      </div>
                      <div className="text-muted-foreground">Created a new branch</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Alice Johnson</span>
                        <span className="text-xs text-muted-foreground">15 minutes ago</span>
                      </div>
                      <div className="text-muted-foreground">Approved review request</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2">
                    <Video className="h-4 w-4 text-purple-500 mt-0.5" />
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Team</span>
                        <span className="text-xs text-muted-foreground">30 minutes ago</span>
                      </div>
                      <div className="text-muted-foreground">Started video call</div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}