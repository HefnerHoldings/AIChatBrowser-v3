import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Share2,
  Copy,
  Link,
  QrCode,
  Mail,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Download,
  Settings,
  Shield,
  Eye,
  Edit,
  MessageCircle,
  Crown,
  UserPlus,
  UserMinus,
  Lock,
  Unlock,
  Activity,
  Calendar,
  ChevronRight,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  Zap
} from 'lucide-react';
import { useWebSocketContext, WSEventType, WSNamespace } from '@/hooks/useWebSocket';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import QRCode from 'qrcode';

// Session Role
export enum SessionRole {
  HOST = 'host',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  COMMENTER = 'commenter',
}

// Session Status
export enum SessionStatus {
  PREPARING = 'preparing',
  ACTIVE = 'active',
  PAUSED = 'paused',
  RECORDING = 'recording',
  ENDED = 'ended',
}

// Session Template
export enum SessionTemplate {
  BRAINSTORMING = 'brainstorming',
  CODE_REVIEW = 'code-review',
  BUG_HUNTING = 'bug-hunting',
  PAIR_PROGRAMMING = 'pair-programming',
  DESIGN_REVIEW = 'design-review',
  USER_TESTING = 'user-testing',
  TRAINING = 'training',
  MEETING = 'meeting',
  CUSTOM = 'custom',
}

// Session Configuration
interface SessionConfig {
  id: string;
  name: string;
  description?: string;
  template: SessionTemplate;
  maxParticipants: number;
  allowGuests: boolean;
  requireApproval: boolean;
  recordSession: boolean;
  autoSave: boolean;
  enableChat: boolean;
  enableVoice: boolean;
  enableVideo: boolean;
  enableScreenShare: boolean;
  enableAnnotations: boolean;
  expiresAt?: Date;
  password?: string;
}

// Session Participant
interface SessionParticipant {
  id: string;
  userId: string;
  username: string;
  email?: string;
  avatar?: string;
  role: SessionRole;
  joinedAt: Date;
  lastActivity?: Date;
  isActive: boolean;
  isGuest: boolean;
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canShare: boolean;
    canInvite: boolean;
    canRecord: boolean;
  };
  status: {
    isMuted: boolean;
    isVideoOn: boolean;
    isScreenSharing: boolean;
    isPresenting: boolean;
  };
}

// Activity Log Entry
interface ActivityEntry {
  id: string;
  userId: string;
  username: string;
  action: string;
  details?: string;
  timestamp: Date;
  icon?: string;
}

// Invitation
interface Invitation {
  id: string;
  email: string;
  role: SessionRole;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  sentAt: Date;
  expiresAt: Date;
  token: string;
}

// Recording
interface Recording {
  id: string;
  sessionId: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  size?: number;
  url?: string;
  status: 'recording' | 'processing' | 'ready' | 'failed';
}

// Main Shared Session Component
export function SharedSession() {
  const ws = useWebSocketContext();
  const { toast } = useToast();
  
  // Session State
  const [sessions, setSessions] = useState<SessionConfig[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionConfig | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(SessionStatus.PREPARING);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  
  // UI State
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SessionTemplate>(SessionTemplate.CUSTOM);
  const [qrCode, setQrCode] = useState<string>('');
  
  // Form State
  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [sessionPassword, setSessionPassword] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<SessionRole>(SessionRole.VIEWER);

  // Get current user role
  const currentUserRole = useMemo(() => {
    if (!currentSession) return null;
    const participant = participants.find(p => p.userId === 'current-user');
    return participant?.role;
  }, [currentSession, participants]);

  // Check permissions
  const canEdit = currentUserRole === SessionRole.HOST || currentUserRole === SessionRole.EDITOR;
  const canInvite = currentUserRole === SessionRole.HOST;
  const canManageParticipants = currentUserRole === SessionRole.HOST;
  const canRecord = currentUserRole === SessionRole.HOST;

  // Subscribe to WebSocket events
  useEffect(() => {
    if (!ws.isConnected) return;

    const unsubscribers = [
      ws.subscribe('session-created', (data) => {
        setSessions(prev => [...prev, data.session]);
        toast({
          title: 'Session Created',
          description: `Session "${data.session.name}" has been created`,
        });
      }),

      ws.subscribe('session-joined', (data) => {
        setParticipants(prev => [...prev, data.participant]);
        addActivityEntry({
          userId: data.participant.userId,
          username: data.participant.username,
          action: 'joined',
          icon: 'user-plus',
        });
      }),

      ws.subscribe('session-left', (data) => {
        setParticipants(prev => prev.filter(p => p.userId !== data.userId));
        addActivityEntry({
          userId: data.userId,
          username: data.username,
          action: 'left',
          icon: 'user-minus',
        });
      }),

      ws.subscribe('role-changed', (data) => {
        setParticipants(prev => prev.map(p =>
          p.userId === data.userId ? { ...p, role: data.role } : p
        ));
        addActivityEntry({
          userId: data.userId,
          username: data.username,
          action: 'role changed',
          details: `Changed to ${data.role}`,
          icon: 'shield',
        });
      }),

      ws.subscribe('session-recording-started', (data) => {
        setSessionStatus(SessionStatus.RECORDING);
        setRecordings(prev => [...prev, data.recording]);
        toast({
          title: 'Recording Started',
          description: 'Session recording has started',
        });
      }),

      ws.subscribe('session-recording-stopped', (data) => {
        setSessionStatus(SessionStatus.ACTIVE);
        setRecordings(prev => prev.map(r =>
          r.id === data.recordingId ? { ...r, status: 'processing' } : r
        ));
        toast({
          title: 'Recording Stopped',
          description: 'Session recording has been stopped',
        });
      }),

      ws.subscribe('activity', (data) => {
        addActivityEntry(data);
      }),
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [ws, toast]);

  // Add activity entry
  const addActivityEntry = (entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => {
    const newEntry: ActivityEntry = {
      ...entry,
      id: `activity-${Date.now()}`,
      timestamp: new Date(),
    };
    setActivityLog(prev => [newEntry, ...prev].slice(0, 100));
  };

  // Create session
  const createSession = async () => {
    if (!sessionName) return;

    const config: SessionConfig = {
      id: `session-${Date.now()}`,
      name: sessionName,
      description: sessionDescription,
      template: selectedTemplate,
      maxParticipants: getTemplateDefaults(selectedTemplate).maxParticipants,
      allowGuests: getTemplateDefaults(selectedTemplate).allowGuests,
      requireApproval: false,
      recordSession: false,
      autoSave: true,
      enableChat: true,
      enableVoice: true,
      enableVideo: true,
      enableScreenShare: true,
      enableAnnotations: true,
      password: sessionPassword,
    };

    ws.send({
      namespace: WSNamespace.COLLABORATION,
      event: 'create-session',
      data: config,
    });

    setCurrentSession(config);
    setSessionStatus(SessionStatus.ACTIVE);
    setShowCreateDialog(false);
    
    // Generate QR code
    const sessionUrl = `${window.location.origin}/session/${config.id}`;
    const qr = await QRCode.toDataURL(sessionUrl);
    setQrCode(qr);

    toast({
      title: 'Session Created',
      description: 'Your collaboration session is ready',
    });
  };

  // Join session
  const joinSession = (sessionId: string, password?: string) => {
    ws.send({
      namespace: WSNamespace.COLLABORATION,
      event: 'join-session',
      data: { sessionId, password },
    });

    ws.joinRoom(sessionId);
  };

  // Leave session
  const leaveSession = () => {
    if (!currentSession) return;

    ws.send({
      namespace: WSNamespace.COLLABORATION,
      event: 'leave-session',
      data: { sessionId: currentSession.id },
    });

    ws.leaveRoom(currentSession.id);
    setCurrentSession(null);
    setSessionStatus(SessionStatus.ENDED);
  };

  // Invite participant
  const inviteParticipant = () => {
    if (!inviteEmail || !currentSession) return;

    const invitation: Invitation = {
      id: `invite-${Date.now()}`,
      email: inviteEmail,
      role: inviteRole,
      status: 'pending',
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      token: generateInviteToken(),
    };

    ws.send({
      namespace: WSNamespace.COLLABORATION,
      event: 'send-invitation',
      data: {
        sessionId: currentSession.id,
        invitation,
      },
    });

    setInvitations(prev => [...prev, invitation]);
    setInviteEmail('');
    setShowInviteDialog(false);

    toast({
      title: 'Invitation Sent',
      description: `Invitation sent to ${inviteEmail}`,
    });
  };

  // Change participant role
  const changeParticipantRole = (userId: string, newRole: SessionRole) => {
    if (!canManageParticipants || !currentSession) return;

    ws.send({
      namespace: WSNamespace.COLLABORATION,
      event: 'change-role',
      data: {
        sessionId: currentSession.id,
        userId,
        role: newRole,
      },
    });
  };

  // Remove participant
  const removeParticipant = (userId: string) => {
    if (!canManageParticipants || !currentSession) return;

    ws.send({
      namespace: WSNamespace.COLLABORATION,
      event: 'remove-participant',
      data: {
        sessionId: currentSession.id,
        userId,
      },
    });
  };

  // Start recording
  const startRecording = () => {
    if (!canRecord || !currentSession) return;

    ws.send({
      namespace: WSNamespace.COLLABORATION,
      event: 'start-recording',
      data: { sessionId: currentSession.id },
    });
  };

  // Stop recording
  const stopRecording = () => {
    if (!canRecord || !currentSession) return;

    ws.send({
      namespace: WSNamespace.COLLABORATION,
      event: 'stop-recording',
      data: { sessionId: currentSession.id },
    });
  };

  // Get template defaults
  const getTemplateDefaults = (template: SessionTemplate) => {
    const defaults: Record<SessionTemplate, any> = {
      [SessionTemplate.BRAINSTORMING]: {
        maxParticipants: 20,
        allowGuests: true,
        icon: Zap,
        color: 'bg-yellow-500',
      },
      [SessionTemplate.CODE_REVIEW]: {
        maxParticipants: 5,
        allowGuests: false,
        icon: Eye,
        color: 'bg-blue-500',
      },
      [SessionTemplate.BUG_HUNTING]: {
        maxParticipants: 10,
        allowGuests: false,
        icon: Activity,
        color: 'bg-red-500',
      },
      [SessionTemplate.PAIR_PROGRAMMING]: {
        maxParticipants: 2,
        allowGuests: false,
        icon: Users,
        color: 'bg-green-500',
      },
      [SessionTemplate.DESIGN_REVIEW]: {
        maxParticipants: 8,
        allowGuests: true,
        icon: Eye,
        color: 'bg-purple-500',
      },
      [SessionTemplate.USER_TESTING]: {
        maxParticipants: 5,
        allowGuests: true,
        icon: Users,
        color: 'bg-indigo-500',
      },
      [SessionTemplate.TRAINING]: {
        maxParticipants: 30,
        allowGuests: true,
        icon: Play,
        color: 'bg-teal-500',
      },
      [SessionTemplate.MEETING]: {
        maxParticipants: 15,
        allowGuests: true,
        icon: Video,
        color: 'bg-gray-500',
      },
      [SessionTemplate.CUSTOM]: {
        maxParticipants: 10,
        allowGuests: true,
        icon: Settings,
        color: 'bg-gray-500',
      },
    };
    return defaults[template];
  };

  // Generate invite token
  const generateInviteToken = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  // Copy session link
  const copySessionLink = () => {
    if (!currentSession) return;
    
    const link = `${window.location.origin}/session/${currentSession.id}`;
    navigator.clipboard.writeText(link);
    
    toast({
      title: 'Link Copied',
      description: 'Session link copied to clipboard',
    });
  };

  return (
    <div className="shared-session p-4" data-testid="shared-session">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sessions List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sessions</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowCreateDialog(true)}
                  data-testid="button-create-session"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {sessions.map(session => {
                    const template = getTemplateDefaults(session.template);
                    const Icon = template.icon;
                    
                    return (
                      <div
                        key={session.id}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-colors",
                          currentSession?.id === session.id && "border-primary bg-primary/5"
                        )}
                        onClick={() => joinSession(session.id, session.password)}
                        data-testid={`session-${session.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded", template.color)}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{session.name}</div>
                            {session.description && (
                              <div className="text-sm text-gray-500 mt-1">
                                {session.description}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {session.template}
                              </Badge>
                              {session.password && (
                                <Lock className="w-3 h-3 text-gray-400" />
                              )}
                              <span className="text-xs text-gray-400">
                                Max {session.maxParticipants} users
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Session Content */}
        <div className="lg:col-span-2">
          {currentSession ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{currentSession.name}</CardTitle>
                    {currentSession.description && (
                      <CardDescription>{currentSession.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={sessionStatus === SessionStatus.RECORDING ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {sessionStatus === SessionStatus.RECORDING && (
                        <Circle className="w-2 h-2 mr-1 fill-current" />
                      )}
                      {sessionStatus}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copySessionLink}
                      data-testid="button-copy-link"
                    >
                      <Link className="w-4 h-4" />
                    </Button>
                    {canInvite && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowInviteDialog(true)}
                        data-testid="button-invite"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    )}
                    {canRecord && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={sessionStatus === SessionStatus.RECORDING ? stopRecording : startRecording}
                        data-testid="button-record"
                      >
                        {sessionStatus === SessionStatus.RECORDING ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowSettingsDialog(true)}
                      data-testid="button-settings"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="participants">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="participants">
                      Participants ({participants.length})
                    </TabsTrigger>
                    <TabsTrigger value="activity">
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="invitations">
                      Invitations ({invitations.filter(i => i.status === 'pending').length})
                    </TabsTrigger>
                    <TabsTrigger value="recordings">
                      Recordings ({recordings.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="participants" className="mt-4">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {participants.map(participant => (
                          <div
                            key={participant.id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                            data-testid={`participant-${participant.userId}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar>
                                  <AvatarImage src={participant.avatar} />
                                  <AvatarFallback>{participant.username[0]}</AvatarFallback>
                                </Avatar>
                                <Circle
                                  className={cn(
                                    "absolute bottom-0 right-0 w-3 h-3",
                                    participant.isActive ? "fill-green-500 text-green-500" : "fill-gray-500 text-gray-500"
                                  )}
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{participant.username}</span>
                                  {participant.role === SessionRole.HOST && (
                                    <Crown className="w-4 h-4 text-yellow-500" />
                                  )}
                                  {participant.isGuest && (
                                    <Badge variant="secondary" className="text-xs">Guest</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                  <span>{participant.role}</span>
                                  <span>Joined {new Date(participant.joinedAt).toLocaleTimeString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {participant.status.isMuted && <MicOff className="w-4 h-4 text-gray-400" />}
                              {!participant.status.isVideoOn && <VideoOff className="w-4 h-4 text-gray-400" />}
                              {participant.status.isScreenSharing && <Monitor className="w-4 h-4 text-blue-500" />}
                              
                              {canManageParticipants && participant.userId !== 'current-user' && (
                                <Select
                                  value={participant.role}
                                  onValueChange={(role) => changeParticipantRole(participant.userId, role as SessionRole)}
                                >
                                  <SelectTrigger className="w-24 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={SessionRole.EDITOR}>Editor</SelectItem>
                                    <SelectItem value={SessionRole.VIEWER}>Viewer</SelectItem>
                                    <SelectItem value={SessionRole.COMMENTER}>Commenter</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                              
                              {canManageParticipants && participant.userId !== 'current-user' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeParticipant(participant.userId)}
                                  data-testid={`button-remove-${participant.userId}`}
                                >
                                  <UserMinus className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="activity" className="mt-4">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {activityLog.map(entry => (
                          <div
                            key={entry.id}
                            className="flex items-start gap-3 p-2"
                            data-testid={`activity-${entry.id}`}
                          >
                            <div className="text-gray-400 text-xs mt-1">
                              {entry.timestamp.toLocaleTimeString()}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm">
                                <span className="font-medium">{entry.username}</span>
                                {' '}
                                <span className="text-gray-600">{entry.action}</span>
                                {entry.details && (
                                  <span className="text-gray-500"> - {entry.details}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="invitations" className="mt-4">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {invitations.map(invitation => (
                          <div
                            key={invitation.id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                            data-testid={`invitation-${invitation.id}`}
                          >
                            <div>
                              <div className="font-medium">{invitation.email}</div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <span>{invitation.role}</span>
                                <span>•</span>
                                <span>Sent {new Date(invitation.sentAt).toLocaleString()}</span>
                                <span>•</span>
                                <span>Expires {new Date(invitation.expiresAt).toLocaleString()}</span>
                              </div>
                            </div>
                            <Badge
                              variant={
                                invitation.status === 'accepted' ? 'default' :
                                invitation.status === 'declined' ? 'destructive' :
                                invitation.status === 'expired' ? 'secondary' :
                                'outline'
                              }
                            >
                              {invitation.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="recordings" className="mt-4">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {recordings.map(recording => (
                          <div
                            key={recording.id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                            data-testid={`recording-${recording.id}`}
                          >
                            <div>
                              <div className="font-medium">
                                Recording {new Date(recording.startedAt).toLocaleString()}
                              </div>
                              {recording.duration && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Duration: {Math.floor(recording.duration / 60)}m {recording.duration % 60}s
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  recording.status === 'ready' ? 'default' :
                                  recording.status === 'failed' ? 'destructive' :
                                  'secondary'
                                }
                              >
                                {recording.status}
                              </Badge>
                              {recording.status === 'ready' && recording.url && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  asChild
                                  data-testid={`button-download-${recording.id}`}
                                >
                                  <a href={recording.url} download>
                                    <Download className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-[500px] text-center">
                <Users className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Session</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Create a new session or join an existing one to start collaborating
                </p>
                <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-session-empty">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Session
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Session Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl" data-testid="dialog-create-session">
          <DialogHeader>
            <DialogTitle>Create Collaboration Session</DialogTitle>
            <DialogDescription>
              Choose a template and configure your session settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Templates */}
            <div>
              <Label>Template</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {Object.values(SessionTemplate).map(template => {
                  const defaults = getTemplateDefaults(template);
                  const Icon = defaults.icon;
                  
                  return (
                    <button
                      key={template}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-colors",
                        selectedTemplate === template ? "border-primary" : "border-gray-200"
                      )}
                      onClick={() => setSelectedTemplate(template)}
                      data-testid={`template-${template}`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-xs font-medium">
                        {template.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Session Details */}
            <div className="space-y-2">
              <Label htmlFor="session-name">Session Name</Label>
              <Input
                id="session-name"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Enter session name"
                data-testid="input-session-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="session-description">Description (Optional)</Label>
              <Input
                id="session-description"
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
                placeholder="What's this session about?"
                data-testid="input-session-description"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="session-password">Password (Optional)</Label>
              <Input
                id="session-password"
                type="password"
                value={sessionPassword}
                onChange={(e) => setSessionPassword(e.target.value)}
                placeholder="Protect with password"
                data-testid="input-session-password"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createSession} data-testid="button-confirm-create">
                Create Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent data-testid="dialog-invite">
          <DialogHeader>
            <DialogTitle>Invite Participants</DialogTitle>
            <DialogDescription>
              Send invitations via email or share the session link
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* QR Code */}
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="Session QR Code" className="w-32 h-32" />
              </div>
            )}
            
            {/* Email Invite */}
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  data-testid="input-invite-email"
                />
                <Select value={inviteRole} onValueChange={(role) => setInviteRole(role as SessionRole)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SessionRole.EDITOR}>Editor</SelectItem>
                    <SelectItem value={SessionRole.VIEWER}>Viewer</SelectItem>
                    <SelectItem value={SessionRole.COMMENTER}>Commenter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={inviteParticipant} data-testid="button-send-invite">
                <Mail className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}