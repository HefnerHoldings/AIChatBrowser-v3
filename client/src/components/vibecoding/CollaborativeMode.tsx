import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageSquare,
  MousePointer2,
  Edit3,
  AtSign,
  Hash,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Share2,
  Eye,
  Settings,
  UserPlus,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Clock,
  GitBranch,
  GitPullRequest,
  Code2,
  FileText,
  Send,
  ThumbsUp,
  ThumbsDown,
  AlertCircle
} from 'lucide-react';

// Types
interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer' | 'reviewer';
  status: 'online' | 'away' | 'offline';
  cursorPosition?: { x: number; y: number };
  cursorColor: string;
  lastSeen: Date;
  isTyping?: boolean;
  currentFile?: string;
}

interface LiveCursor {
  userId: string;
  x: number;
  y: number;
  color: string;
  name: string;
  timestamp: Date;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  mentions?: string[];
  resolved: boolean;
  replies?: Comment[];
  reactions?: { type: string; users: string[] }[];
  lineNumber?: number;
  file?: string;
}

interface ReviewRule {
  id: string;
  name: string;
  description: string;
  requiredApprovals: number;
  autoMerge: boolean;
  blockingLabels: string[];
  requiredLabels: string[];
  protectedPaths: string[];
}

interface SharedSession {
  id: string;
  name: string;
  description: string;
  owner: string;
  collaborators: Collaborator[];
  startTime: Date;
  isLive: boolean;
  shareLink?: string;
  settings: {
    allowAnonymous: boolean;
    requireApproval: boolean;
    maxCollaborators: number;
    recordSession: boolean;
  };
}

export function CollaborativeMode() {
  const [currentSession, setCurrentSession] = useState<SharedSession | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: '1',
      name: 'Du',
      role: 'owner',
      status: 'online',
      cursorColor: 'blue',
      lastSeen: new Date(),
      currentFile: 'index.tsx'
    },
    {
      id: '2',
      name: 'Alice Developer',
      avatar: '/api/placeholder/32/32',
      role: 'editor',
      status: 'online',
      cursorPosition: { x: 450, y: 230 },
      cursorColor: 'green',
      lastSeen: new Date(),
      isTyping: true,
      currentFile: 'components/Header.tsx'
    },
    {
      id: '3',
      name: 'Bob Reviewer',
      avatar: '/api/placeholder/32/32',
      role: 'reviewer',
      status: 'away',
      cursorColor: 'purple',
      lastSeen: new Date(Date.now() - 300000),
      currentFile: 'utils/helpers.ts'
    },
    {
      id: '4',
      name: 'Charlie Viewer',
      avatar: '/api/placeholder/32/32',
      role: 'viewer',
      status: 'online',
      cursorPosition: { x: 200, y: 400 },
      cursorColor: 'orange',
      lastSeen: new Date(),
      currentFile: 'index.tsx'
    }
  ]);

  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      userId: '2',
      userName: 'Alice Developer',
      content: 'Kan vi refaktorere denne funksjonen? @Du Den ser litt kompleks ut.',
      timestamp: new Date(Date.now() - 600000),
      mentions: ['Du'],
      resolved: false,
      lineNumber: 45,
      file: 'components/Header.tsx',
      replies: [
        {
          id: '1-1',
          userId: '1',
          userName: 'Du',
          content: 'God idé! La oss dele den opp i mindre funksjoner.',
          timestamp: new Date(Date.now() - 300000),
          resolved: false,
          reactions: [{ type: '👍', users: ['2'] }]
        }
      ]
    },
    {
      id: '2',
      userId: '3',
      userName: 'Bob Reviewer',
      content: 'LGTM! Tester passerer og koden ser ren ut.',
      timestamp: new Date(Date.now() - 1200000),
      resolved: true,
      file: 'utils/helpers.ts',
      reactions: [
        { type: '✅', users: ['1', '2'] },
        { type: '🎉', users: ['2'] }
      ]
    }
  ]);

  const [reviewRules] = useState<ReviewRule[]>([
    {
      id: '1',
      name: 'Main Branch Protection',
      description: 'Krever godkjenning før merge til main',
      requiredApprovals: 2,
      autoMerge: false,
      blockingLabels: ['needs-fix', 'wip'],
      requiredLabels: ['reviewed'],
      protectedPaths: ['src/core/**', 'package.json']
    },
    {
      id: '2',
      name: 'Auto-merge for Docs',
      description: 'Auto-merger dokumentasjonsendringer',
      requiredApprovals: 1,
      autoMerge: true,
      blockingLabels: [],
      requiredLabels: ['documentation'],
      protectedPaths: []
    }
  ]);

  const [liveCursors, setLiveCursors] = useState<LiveCursor[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<string | null>(null);

  // Simulate cursor movements
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCursors(prev => {
        const cursors = collaborators
          .filter(c => c.id !== '1' && c.status === 'online' && c.cursorPosition)
          .map(c => ({
            userId: c.id,
            x: c.cursorPosition!.x + (Math.random() - 0.5) * 20,
            y: c.cursorPosition!.y + (Math.random() - 0.5) * 20,
            color: c.cursorColor,
            name: c.name,
            timestamp: new Date()
          }));
        return cursors;
      });

      // Random typing status
      setCollaborators(prev => prev.map(c => ({
        ...c,
        isTyping: c.status === 'online' && Math.random() > 0.7
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, [collaborators]);

  const startSession = () => {
    setCurrentSession({
      id: 'session-' + Date.now(),
      name: 'Utviklingssesjon',
      description: 'Samarbeid om ny feature',
      owner: '1',
      collaborators: collaborators,
      startTime: new Date(),
      isLive: true,
      shareLink: `https://madeasy.dev/session/${Date.now()}`,
      settings: {
        allowAnonymous: false,
        requireApproval: true,
        maxCollaborators: 10,
        recordSession: true
      }
    });
  };

  const endSession = () => {
    setCurrentSession(null);
  };

  const sendComment = () => {
    if (!messageInput.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      userId: '1',
      userName: 'Du',
      content: messageInput,
      timestamp: new Date(),
      mentions: messageInput.match(/@\w+/g)?.map(m => m.substring(1)) || [],
      resolved: false
    };

    setComments([newComment, ...comments]);
    setMessageInput('');
  };

  const resolveComment = (commentId: string) => {
    setComments(prev => prev.map(c =>
      c.id === commentId ? { ...c, resolved: true } : c
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return '👑';
      case 'editor': return '✏️';
      case 'reviewer': return '👁️';
      case 'viewer': return '👀';
      default: return '👤';
    }
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Collaborative Mode</h2>
            {currentSession ? (
              <Badge variant="default" className="animate-pulse">
                <div className="h-2 w-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                Live Session
              </Badge>
            ) : (
              <Badge variant="secondary">Ingen aktiv sesjon</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentSession && (
              <>
                <Button
                  variant={isVoiceEnabled ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                >
                  {isVoiceEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant={isVideoEnabled ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                >
                  {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant={isScreenSharing ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </>
            )}
            {currentSession ? (
              <Button variant="destructive" onClick={endSession}>
                Avslutt Sesjon
              </Button>
            ) : (
              <Button onClick={startSession}>
                <Video className="h-4 w-4 mr-2" />
                Start Sesjon
              </Button>
            )}
          </div>
        </div>

        {currentSession && (
          <div className="mt-3 p-2 bg-muted/50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <span>Delelenke:</span>
              <code className="px-2 py-1 bg-background rounded">
                {currentSession.shareLink}
              </code>
              <Button size="sm" variant="ghost">
                Kopier
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Startet {currentSession.startTime.toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-3 gap-4">
        {/* Collaborators Panel */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Samarbeidspartnere</h3>
            <Button size="sm" variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Inviter
            </Button>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {collaborators.map(collab => (
                <motion.div
                  key={collab.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCollaborator === collab.id ? 'bg-muted' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedCollaborator(collab.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={collab.avatar} />
                          <AvatarFallback>{collab.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(collab.status)}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{collab.name}</span>
                          <span className="text-xs">{getRoleIcon(collab.role)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {collab.currentFile && (
                            <>
                              <FileText className="h-3 w-3" />
                              {collab.currentFile}
                            </>
                          )}
                          {collab.isTyping && (
                            <span className="text-blue-500">skriver...</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: collab.cursorColor }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{collab.role}</span>
                    <span>
                      {collab.status === 'online' 
                        ? 'Aktiv nå' 
                        : `Sist sett ${collab.lastSeen.toLocaleTimeString()}`}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          {/* Live Cursors Visualization */}
          {currentSession && (
            <div className="mt-3 p-3 bg-muted/20 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Live Markører</h4>
              <div className="relative h-32 bg-background rounded border">
                <AnimatePresence>
                  {liveCursors.map(cursor => (
                    <motion.div
                      key={cursor.userId}
                      initial={{ scale: 0 }}
                      animate={{ 
                        scale: 1,
                        x: cursor.x % 200,
                        y: cursor.y % 100
                      }}
                      exit={{ scale: 0 }}
                      className="absolute flex items-center"
                      style={{ 
                        left: 0,
                        top: 0,
                      }}
                    >
                      <MousePointer2 
                        className="h-4 w-4"
                        style={{ color: cursor.color }}
                      />
                      <span 
                        className="text-xs ml-1 px-1 rounded"
                        style={{ 
                          backgroundColor: cursor.color + '20',
                          color: cursor.color
                        }}
                      >
                        {cursor.name}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </Card>

        {/* Comments & Chat */}
        <Card className="p-4 flex flex-col">
          <Tabs defaultValue="comments" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comments">
                <MessageSquare className="h-4 w-4 mr-2" />
                Kommentarer
              </TabsTrigger>
              <TabsTrigger value="mentions">
                <AtSign className="h-4 w-4 mr-2" />
                Omtaler
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 h-[350px]">
                <div className="space-y-3 pr-4">
                  {comments.map(comment => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg border ${
                        comment.resolved ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {comment.userName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium text-sm">{comment.userName}</span>
                            {comment.file && (
                              <span className="text-xs text-muted-foreground ml-2">
                                {comment.file}:{comment.lineNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {comment.resolved ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => resolveComment(comment.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm mb-2">{comment.content}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {comment.reactions?.map((reaction, i) => (
                            <span key={i} className="text-xs">
                              {reaction.type} {reaction.users.length}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {comment.timestamp.toLocaleTimeString()}
                        </span>
                      </div>

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-2 pl-4 border-l-2">
                          {comment.replies.map(reply => (
                            <div key={reply.id} className="mt-2">
                              <div className="flex items-center gap-2 mb-1">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-xs">
                                    {reply.userName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium">{reply.userName}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              <div className="mt-3 flex gap-2">
                <Textarea
                  placeholder="Skriv en kommentar... Bruk @ for å nevne noen"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="resize-none"
                  rows={2}
                />
                <Button onClick={sendComment}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="mentions" className="flex-1">
              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {comments
                    .filter(c => c.mentions?.includes('Du'))
                    .map(comment => (
                      <div key={comment.id} className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-1">
                          <AtSign className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-sm">{comment.userName} nevnte deg</span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                        <span className="text-xs text-muted-foreground">
                          {comment.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Review Rules & Settings */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Review Regler</h3>
          
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {reviewRules.map(rule => (
                <div key={rule.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GitPullRequest className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{rule.name}</span>
                    </div>
                    {rule.autoMerge && (
                      <Badge variant="secondary" className="text-xs">
                        Auto-merge
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {rule.description}
                  </p>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>Krever {rule.requiredApprovals} godkjenninger</span>
                    </div>
                    
                    {rule.blockingLabels.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <XCircle className="h-3 w-3 text-red-600" />
                        <span>Blokkerer: {rule.blockingLabels.join(', ')}</span>
                      </div>
                    )}
                    
                    {rule.protectedPaths.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <Lock className="h-3 w-3 text-yellow-600" />
                        <span>Beskyttet: {rule.protectedPaths.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Session Settings */}
              {currentSession && (
                <div className="mt-4 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="h-4 w-4" />
                    <h4 className="font-medium">Sesjonsinnstillinger</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Tillat anonyme</span>
                      <Badge variant={currentSession.settings.allowAnonymous ? 'default' : 'secondary'}>
                        {currentSession.settings.allowAnonymous ? 'Ja' : 'Nei'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Krev godkjenning</span>
                      <Badge variant={currentSession.settings.requireApproval ? 'default' : 'secondary'}>
                        {currentSession.settings.requireApproval ? 'Ja' : 'Nei'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Maks deltakere</span>
                      <Badge variant="outline">
                        {collaborators.length}/{currentSession.settings.maxCollaborators}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Ta opp sesjon</span>
                      <Badge variant={currentSession.settings.recordSession ? 'destructive' : 'secondary'}>
                        {currentSession.settings.recordSession ? 'Opptak' : 'Av'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}