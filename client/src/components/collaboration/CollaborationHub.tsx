import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageCircle, 
  Video, 
  Mic, 
  Screen, 
  Hand,
  Eye,
  Edit3,
  Check,
  X,
  Bell,
  Settings,
  Share2,
  Circle,
  MousePointer,
  Hash,
  UserPlus
} from 'lucide-react';
import { useWebSocketContext, WSEventType } from '@/hooks/useWebSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// User Presence
interface UserPresence {
  userId: string;
  username: string;
  avatar?: string;
  color: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  cursor?: { x: number; y: number; element?: string };
  selection?: { start: number; end: number; text: string };
  isTyping?: boolean;
  lastActivity?: Date;
  role?: 'host' | 'editor' | 'viewer' | 'commenter';
}

// Comment
interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  elementId?: string;
  position?: { x: number; y: number };
  timestamp: Date;
  resolved?: boolean;
  replies?: Comment[];
}

// Annotation
interface Annotation {
  id: string;
  userId: string;
  type: 'highlight' | 'underline' | 'strikethrough' | 'note';
  elementId: string;
  text?: string;
  color: string;
  timestamp: Date;
}

// Cursor Component
function UserCursor({ user, position }: { user: UserPresence; position: { x: number; y: number } }) {
  return (
    <motion.div
      className="absolute pointer-events-none z-[9999]"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: position.x,
        y: position.y
      }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.1 }}
      data-testid={`cursor-${user.userId}`}
    >
      <MousePointer 
        className="w-4 h-4" 
        style={{ color: user.color }}
        fill={user.color}
      />
      <div 
        className="absolute left-4 top-0 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
        style={{ backgroundColor: user.color }}
      >
        {user.username}
      </div>
    </motion.div>
  );
}

// Selection Highlight Component
function SelectionHighlight({ user, selection }: { user: UserPresence; selection: any }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        backgroundColor: `${user.color}20`,
        border: `2px solid ${user.color}`,
      }}
      data-testid={`selection-${user.userId}`}
    >
      <div className="absolute -top-6 left-0 px-2 py-1 rounded text-xs font-medium text-white"
        style={{ backgroundColor: user.color }}
      >
        {user.username} is selecting
      </div>
    </div>
  );
}

// Comment Thread Component
function CommentThread({ 
  comment, 
  onReply, 
  onResolve 
}: { 
  comment: Comment; 
  onReply: (text: string) => void;
  onResolve: () => void;
}) {
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);

  return (
    <div className="space-y-2" data-testid={`comment-${comment.id}`}>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Avatar className="w-6 h-6">
            <AvatarFallback>{comment.username[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{comment.username}</span>
              <span className="text-xs text-gray-500">
                {new Date(comment.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm mt-1">{comment.text}</p>
          </div>
          {!comment.resolved && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onResolve}
              data-testid={`button-resolve-${comment.id}`}
            >
              <Check className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-8 mt-2 space-y-2">
            {comment.replies.map(reply => (
              <div key={reply.id} className="text-sm">
                <span className="font-medium">{reply.username}: </span>
                <span>{reply.text}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Reply Input */}
        {showReply && (
          <div className="ml-8 mt-2 flex gap-2">
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply..."
              className="text-sm"
              data-testid={`input-reply-${comment.id}`}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && replyText) {
                  onReply(replyText);
                  setReplyText('');
                  setShowReply(false);
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => {
                if (replyText) {
                  onReply(replyText);
                  setReplyText('');
                  setShowReply(false);
                }
              }}
              data-testid={`button-send-reply-${comment.id}`}
            >
              Send
            </Button>
          </div>
        )}
        
        {!showReply && !comment.resolved && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-8 mt-2 text-xs"
            onClick={() => setShowReply(true)}
            data-testid={`button-reply-${comment.id}`}
          >
            Reply
          </Button>
        )}
      </div>
    </div>
  );
}

// Main Collaboration Hub Component
export function CollaborationHub() {
  const ws = useWebSocketContext();
  const [showPresence, setShowPresence] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // User colors
  const userColors = useMemo(() => [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#FD79A8', '#A29BFE', '#6C5CE7', '#00B894', '#00CEC9'
  ], []);

  // Get user color
  const getUserColor = (userId: string) => {
    const index = userId.charCodeAt(0) % userColors.length;
    return userColors[index];
  };

  // Subscribe to WebSocket events
  useEffect(() => {
    if (!ws.isConnected) return;

    const unsubscribers = [
      // Cursor events
      ws.subscribe(WSEventType.CURSOR_MOVE, (data) => {
        // Update cursor position for user
      }),

      // Selection events
      ws.subscribe(WSEventType.SELECTION_CHANGE, (data) => {
        // Update selection for user
      }),

      // Comment events
      ws.subscribe(WSEventType.COMMENT_ADD, (data) => {
        setComments(prev => [...prev, data]);
      }),

      ws.subscribe(WSEventType.COMMENT_UPDATE, (data) => {
        setComments(prev => prev.map(c => c.id === data.id ? data : c));
      }),

      ws.subscribe(WSEventType.COMMENT_DELETE, (data) => {
        setComments(prev => prev.filter(c => c.id !== data.id));
      }),

      // Typing indicator
      ws.subscribe('typing-start', (data) => {
        setTypingUsers(prev => new Set(prev).add(data.userId));
      }),

      ws.subscribe('typing-stop', (data) => {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }),
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [ws]);

  // Track cursor movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ws.isConnected || !currentRoom) return;
      
      ws.sendCursor({
        x: e.clientX,
        y: e.clientY,
        element: (e.target as HTMLElement)?.id
      });
    };

    const throttledMouseMove = throttle(handleMouseMove, 50);
    document.addEventListener('mousemove', throttledMouseMove);

    return () => {
      document.removeEventListener('mousemove', throttledMouseMove);
    };
  }, [ws, currentRoom]);

  // Track text selection
  useEffect(() => {
    const handleSelectionChange = () => {
      if (!ws.isConnected || !currentRoom) return;
      
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        ws.sendSelection({
          start: selection.anchorOffset,
          end: selection.focusOffset,
          text: selection.toString()
        });
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [ws, currentRoom]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!ws.isConnected || !currentRoom) return;

    // Send typing start
    ws.send({
      event: 'typing-start',
      data: { roomId: currentRoom }
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      ws.send({
        event: 'typing-stop',
        data: { roomId: currentRoom }
      });
    }, 2000);
  };

  // Handle mention
  const handleMention = (username: string) => {
    if (commentInputRef.current) {
      const current = commentInputRef.current.value;
      const lastAtIndex = current.lastIndexOf('@');
      const newValue = current.substring(0, lastAtIndex) + `@${username} `;
      commentInputRef.current.value = newValue;
      commentInputRef.current.focus();
    }
    setShowMentions(false);
    setMentionQuery('');
  };

  // Add comment
  const addComment = (text: string, elementId?: string, position?: { x: number; y: number }) => {
    if (!ws.isConnected || !text) return;

    ws.sendComment({
      text,
      elementId,
      position
    });
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      setIsScreenSharing(false);
      ws.send({
        event: 'screen-share-stop',
        data: { roomId: currentRoom }
      });
    } else {
      try {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        setIsScreenSharing(true);
        ws.send({
          event: 'screen-share-start',
          data: { roomId: currentRoom, streamId: stream.id }
        });
        
        // Handle stream end
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          ws.send({
            event: 'screen-share-stop',
            data: { roomId: currentRoom }
          });
        };
      } catch (error) {
        console.error('Failed to start screen sharing:', error);
      }
    }
  };

  // Join collaboration room
  const joinRoom = (roomId: string) => {
    ws.joinRoom(roomId);
    setCurrentRoom(roomId);
  };

  // Leave collaboration room
  const leaveRoom = () => {
    if (currentRoom) {
      ws.leaveRoom(currentRoom);
      setCurrentRoom(null);
    }
  };

  return (
    <div className="collaboration-hub" data-testid="collaboration-hub">
      {/* Floating Presence Indicator */}
      <AnimatePresence>
        {showPresence && ws.presence.size > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-20 right-4 z-50"
            data-testid="presence-indicator"
          >
            <Card className="w-64">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Active Users</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {ws.presence.size} online
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from(ws.presence.values()).slice(0, 5).map((user: any) => (
                  <div key={user.userId} className="flex items-center gap-2" data-testid={`user-presence-${user.userId}`}>
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.username[0]}</AvatarFallback>
                      </Avatar>
                      <Circle 
                        className={cn(
                          "absolute bottom-0 right-0 w-3 h-3",
                          user.status === 'online' && "fill-green-500 text-green-500",
                          user.status === 'away' && "fill-yellow-500 text-yellow-500",
                          user.status === 'busy' && "fill-red-500 text-red-500",
                          user.status === 'offline' && "fill-gray-500 text-gray-500"
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{user.username}</div>
                      <div className="text-xs text-gray-500">{user.role || 'Viewer'}</div>
                    </div>
                    {user.isTyping && (
                      <div className="flex gap-1">
                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    )}
                  </div>
                ))}
                {ws.presence.size > 5 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{ws.presence.size - 5} more
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Sidebar */}
      <AnimatePresence>
        {showComments && comments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed top-20 left-4 z-50 w-80"
            data-testid="comments-sidebar"
          >
            <Card className="max-h-[600px]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Comments</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {comments.filter(c => !c.resolved).length} unresolved
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {comments.map(comment => (
                      <CommentThread
                        key={comment.id}
                        comment={comment}
                        onReply={(text) => {
                          // Add reply
                          const reply: Comment = {
                            id: `reply-${Date.now()}`,
                            userId: 'current-user',
                            username: 'You',
                            text,
                            timestamp: new Date()
                          };
                          
                          setComments(prev => prev.map(c => 
                            c.id === comment.id 
                              ? { ...c, replies: [...(c.replies || []), reply] }
                              : c
                          ));
                        }}
                        onResolve={() => {
                          setComments(prev => prev.map(c =>
                            c.id === comment.id ? { ...c, resolved: true } : c
                          ));
                        }}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collaboration Toolbar */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50" data-testid="collaboration-toolbar">
        <Card className="px-4 py-2">
          <div className="flex items-center gap-2">
            {/* Room Status */}
            {currentRoom && (
              <Badge variant="secondary" className="text-xs">
                Room: {currentRoom}
              </Badge>
            )}
            
            {/* Voice Chat */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={isVoiceEnabled ? "default" : "ghost"}
                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    data-testid="button-voice"
                  >
                    <Mic className={cn("w-4 h-4", !isVoiceEnabled && "opacity-50")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voice Chat</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Video Chat */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={isVideoEnabled ? "default" : "ghost"}
                    onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                    data-testid="button-video"
                  >
                    <Video className={cn("w-4 h-4", !isVideoEnabled && "opacity-50")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Video Chat</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Screen Share */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={isScreenSharing ? "default" : "ghost"}
                    onClick={toggleScreenShare}
                    data-testid="button-screen-share"
                  >
                    <Screen className={cn("w-4 h-4", !isScreenSharing && "opacity-50")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Screen Share</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="w-px h-6 bg-gray-300" />
            
            {/* Comments */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={showComments ? "default" : "ghost"}
                    onClick={() => setShowComments(!showComments)}
                    data-testid="button-comments"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {comments.length > 0 && (
                      <Badge className="ml-1 px-1 py-0 text-xs">
                        {comments.length}
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Comments</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Presence */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={showPresence ? "default" : "ghost"}
                    onClick={() => setShowPresence(!showPresence)}
                    data-testid="button-presence"
                  >
                    <Users className="w-4 h-4" />
                    {ws.presence.size > 0 && (
                      <Badge className="ml-1 px-1 py-0 text-xs">
                        {ws.presence.size}
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Active Users</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="w-px h-6 bg-gray-300" />
            
            {/* Invite */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    data-testid="button-invite"
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Invite Collaborators</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Share */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    data-testid="button-share"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share Session</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Settings */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    data-testid="button-settings"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Collaboration Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </Card>
      </div>

      {/* Floating Comment Input */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className="fixed bottom-20 right-4 rounded-full w-12 h-12 shadow-lg"
            data-testid="button-add-comment"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end" data-testid="comment-popover">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Add Comment</h4>
            <Textarea
              ref={commentInputRef}
              placeholder="Type your comment... Use @ to mention"
              className="min-h-[80px]"
              onInput={(e) => {
                handleTyping();
                const value = e.currentTarget.value;
                const lastAtIndex = value.lastIndexOf('@');
                if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
                  setShowMentions(true);
                  setMentionQuery('');
                } else if (lastAtIndex !== -1) {
                  const query = value.substring(lastAtIndex + 1);
                  if (query.includes(' ')) {
                    setShowMentions(false);
                  } else {
                    setMentionQuery(query);
                  }
                }
              }}
              data-testid="textarea-comment"
            />
            
            {/* Mention Suggestions */}
            {showMentions && (
              <div className="border rounded-md p-2 space-y-1">
                {Array.from(ws.presence.values())
                  .filter((user: any) => 
                    !mentionQuery || user.username.toLowerCase().includes(mentionQuery.toLowerCase())
                  )
                  .map((user: any) => (
                    <button
                      key={user.userId}
                      className="flex items-center gap-2 w-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      onClick={() => handleMention(user.username)}
                      data-testid={`mention-${user.userId}`}
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.username[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.username}</span>
                    </button>
                  ))}
              </div>
            )}
            
            <Button 
              className="w-full"
              onClick={() => {
                if (commentInputRef.current?.value) {
                  addComment(commentInputRef.current.value);
                  commentInputRef.current.value = '';
                }
              }}
              data-testid="button-post-comment"
            >
              Post Comment
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Render user cursors */}
      <AnimatePresence>
        {Array.from(ws.presence.values()).map((user: any) => (
          user.cursor && (
            <UserCursor
              key={user.userId}
              user={user}
              position={user.cursor}
            />
          )
        ))}
      </AnimatePresence>

      {/* Render selections */}
      {Array.from(ws.presence.values()).map((user: any) => (
        user.selection && (
          <SelectionHighlight
            key={`selection-${user.userId}`}
            user={user}
            selection={user.selection}
          />
        )
      ))}

      {/* Typing Indicators */}
      {typingUsers.size > 0 && (
        <div className="fixed bottom-24 left-4 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Array.from(typingUsers).length} user{Array.from(typingUsers).length > 1 ? 's' : ''} typing...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility function to throttle events
function throttle(func: Function, delay: number) {
  let lastCall = 0;
  return (...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}