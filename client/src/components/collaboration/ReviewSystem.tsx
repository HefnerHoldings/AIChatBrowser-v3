import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Check,
  X,
  MessageSquare,
  Clock,
  AlertCircle,
  FileText,
  Code,
  Eye,
  Edit,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  BarChart,
  CheckSquare,
  Square,
  Circle,
  Send,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Star,
  Archive,
  RefreshCw,
  Download,
  Upload,
  Copy,
  Link,
  User,
  Users,
  Calendar,
  Hash,
  Tag,
  Zap
} from 'lucide-react';
import { useWebSocketContext, WSEventType, WSNamespace } from '@/hooks/useWebSocket';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DiffEditor, Monaco } from '@monaco-editor/react';

// Review Status
export enum ReviewStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  CHANGES_REQUESTED = 'changes-requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  MERGED = 'merged',
  CLOSED = 'closed',
}

// Review Type
export enum ReviewType {
  CODE = 'code',
  CONTENT = 'content',
  DESIGN = 'design',
  WORKFLOW = 'workflow',
  AUTOMATION = 'automation',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
}

// Review Priority
export enum ReviewPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

// Review Interface
interface Review {
  id: string;
  title: string;
  description: string;
  type: ReviewType;
  status: ReviewStatus;
  priority: ReviewPriority;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  reviewers: Reviewer[];
  files: ReviewFile[];
  comments: ReviewComment[];
  checklist: ChecklistItem[];
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  mergedAt?: Date;
  closedAt?: Date;
  metrics: {
    additions: number;
    deletions: number;
    filesChanged: number;
    commentsCount: number;
    approvalsNeeded: number;
    approvalsReceived: number;
  };
}

// Reviewer Interface
interface Reviewer {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'changes-requested';
  reviewedAt?: Date;
  comments?: string;
}

// Review File Interface
interface ReviewFile {
  id: string;
  path: string;
  language?: string;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
  comments: FileComment[];
  oldContent?: string;
  newContent?: string;
}

// Diff Hunk Interface
interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

// Diff Line Interface
interface DiffLine {
  type: 'add' | 'delete' | 'normal';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

// File Comment Interface
interface FileComment {
  id: string;
  userId: string;
  username: string;
  lineNumber: number;
  text: string;
  timestamp: Date;
  resolved: boolean;
  replies?: FileComment[];
}

// Review Comment Interface
interface ReviewComment {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  text: string;
  timestamp: Date;
  type: 'comment' | 'approval' | 'rejection' | 'changes-requested';
  reactions?: { [emoji: string]: string[] };
}

// Checklist Item Interface
interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
  required: boolean;
}

// Review Template
interface ReviewTemplate {
  id: string;
  name: string;
  description: string;
  type: ReviewType;
  checklist: string[];
  reviewers: string[];
  labels: string[];
}

// Main Review System Component
export function ReviewSystem() {
  const ws = useWebSocketContext();
  const { toast } = useToast();
  
  // State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  const [selectedFile, setSelectedFile] = useState<ReviewFile | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ReviewStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<ReviewType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [showWhitespace, setShowWhitespace] = useState(false);
  
  // Form State
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewDescription, setNewReviewDescription] = useState('');
  const [newReviewType, setNewReviewType] = useState<ReviewType>(ReviewType.CODE);
  const [newReviewPriority, setNewReviewPriority] = useState<ReviewPriority>(ReviewPriority.MEDIUM);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [commentText, setCommentText] = useState('');
  const [lineCommentText, setLineCommentText] = useState('');
  const [selectedLineNumber, setSelectedLineNumber] = useState<number | null>(null);

  // Refs
  const diffEditorRef = useRef<any>(null);

  // Calculate review statistics
  const reviewStats = useMemo(() => {
    return {
      total: reviews.length,
      pending: reviews.filter(r => r.status === ReviewStatus.PENDING).length,
      inProgress: reviews.filter(r => r.status === ReviewStatus.IN_PROGRESS).length,
      approved: reviews.filter(r => r.status === ReviewStatus.APPROVED).length,
      changesRequested: reviews.filter(r => r.status === ReviewStatus.CHANGES_REQUESTED).length,
    };
  }, [reviews]);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      if (filterStatus !== 'all' && review.status !== filterStatus) return false;
      if (filterType !== 'all' && review.type !== filterType) return false;
      if (searchQuery && !review.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !review.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [reviews, filterStatus, filterType, searchQuery]);

  // Subscribe to WebSocket events
  useEffect(() => {
    if (!ws.isConnected) return;

    const unsubscribers = [
      ws.subscribe('review-created', (data) => {
        setReviews(prev => [...prev, data.review]);
        toast({
          title: 'New Review',
          description: `Review "${data.review.title}" has been created`,
        });
      }),

      ws.subscribe('review-updated', (data) => {
        setReviews(prev => prev.map(r => r.id === data.review.id ? data.review : r));
        if (currentReview?.id === data.review.id) {
          setCurrentReview(data.review);
        }
      }),

      ws.subscribe('review-approved', (data) => {
        setReviews(prev => prev.map(r => 
          r.id === data.reviewId 
            ? { ...r, status: ReviewStatus.APPROVED }
            : r
        ));
        toast({
          title: 'Review Approved',
          description: `${data.username} approved the review`,
        });
      }),

      ws.subscribe('review-rejected', (data) => {
        setReviews(prev => prev.map(r => 
          r.id === data.reviewId 
            ? { ...r, status: ReviewStatus.REJECTED }
            : r
        ));
        toast({
          title: 'Review Rejected',
          description: `${data.username} rejected the review`,
        });
      }),

      ws.subscribe('review-comment', (data) => {
        setReviews(prev => prev.map(r => 
          r.id === data.reviewId 
            ? { ...r, comments: [...r.comments, data.comment] }
            : r
        ));
        if (currentReview?.id === data.reviewId) {
          setCurrentReview(prev => prev ? { ...prev, comments: [...prev.comments, data.comment] } : null);
        }
      }),

      ws.subscribe('line-comment', (data) => {
        if (currentReview?.id === data.reviewId) {
          const updatedFiles = currentReview.files.map(file => {
            if (file.id === data.fileId) {
              return { ...file, comments: [...file.comments, data.comment] };
            }
            return file;
          });
          setCurrentReview({ ...currentReview, files: updatedFiles });
        }
      }),

      ws.subscribe('checklist-updated', (data) => {
        if (currentReview?.id === data.reviewId) {
          const updatedChecklist = currentReview.checklist.map(item =>
            item.id === data.itemId ? { ...item, ...data.updates } : item
          );
          setCurrentReview({ ...currentReview, checklist: updatedChecklist });
        }
      }),
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [ws, currentReview, toast]);

  // Create review
  const createReview = () => {
    if (!newReviewTitle) return;

    const review: Review = {
      id: `review-${Date.now()}`,
      title: newReviewTitle,
      description: newReviewDescription,
      type: newReviewType,
      status: ReviewStatus.PENDING,
      priority: newReviewPriority,
      author: {
        id: 'current-user',
        name: 'You',
      },
      reviewers: selectedReviewers.map(id => ({
        id: `reviewer-${id}`,
        userId: id,
        name: `User ${id}`,
        status: 'pending',
      })),
      files: [],
      comments: [],
      checklist: getDefaultChecklist(newReviewType),
      labels: selectedLabels,
      createdAt: new Date(),
      updatedAt: new Date(),
      metrics: {
        additions: 0,
        deletions: 0,
        filesChanged: 0,
        commentsCount: 0,
        approvalsNeeded: selectedReviewers.length,
        approvalsReceived: 0,
      },
    };

    ws.send({
      namespace: WSNamespace.COLLABORATION,
      event: 'create-review',
      data: review,
    });

    setReviews(prev => [...prev, review]);
    setCurrentReview(review);
    setShowCreateDialog(false);
    resetForm();

    toast({
      title: 'Review Created',
      description: 'Your review has been created and sent to reviewers',
    });
  };

  // Approve review
  const approveReview = () => {
    if (!currentReview) return;

    ws.send({
      namespace: WSNamespace.COLLABORATION,
      event: WSEventType.REVIEW_APPROVE,
      data: {
        reviewId: currentReview.id,
        comment: commentText,
      },
    });

    setCommentText('');
  };

  // Reject review
  const rejectReview = () => {
    if (!currentReview) return;

    ws.send({
      namespace: WSNamespace.COLLABORATION,
      event: WSEventType.REVIEW_REJECT,
      data: {
        reviewId: currentReview.id,
        comment: commentText,
      },
    });

    setCommentText('');
  };

  // Request changes
  const requestChanges = () => {
    if (!currentReview || !commentText) return;

    ws.send({
      namespace: WSNamespace.COLLABORATION,
      event: 'review-changes-requested',
      data: {
        reviewId: currentReview.id,
        comment: commentText,
      },
    });

    setCommentText('');
  };

  // Add comment
  const addComment = () => {
    if (!currentReview || !commentText) return;

    const comment: ReviewComment = {
      id: `comment-${Date.now()}`,
      userId: 'current-user',
      username: 'You',
      text: commentText,
      timestamp: new Date(),
      type: 'comment',
    };

    ws.send({
      namespace: WSNamespace.COLLABORATION,
      event: WSEventType.REVIEW_COMMENT,
      data: {
        reviewId: currentReview.id,
        comment,
      },
    });

    setCommentText('');
  };

  // Add line comment
  const addLineComment = () => {
    if (!currentReview || !selectedFile || selectedLineNumber === null || !lineCommentText) return;

    const comment: FileComment = {
      id: `line-comment-${Date.now()}`,
      userId: 'current-user',
      username: 'You',
      lineNumber: selectedLineNumber,
      text: lineCommentText,
      timestamp: new Date(),
      resolved: false,
    };

    ws.send({
      namespace: WSNamespace.COLLABORATION,
      event: 'line-comment',
      data: {
        reviewId: currentReview.id,
        fileId: selectedFile.id,
        comment,
      },
    });

    setLineCommentText('');
    setSelectedLineNumber(null);
  };

  // Toggle checklist item
  const toggleChecklistItem = (itemId: string) => {
    if (!currentReview) return;

    const item = currentReview.checklist.find(i => i.id === itemId);
    if (!item) return;

    ws.send({
      namespace: WSNamespace.COLLABORATION,
      event: 'checklist-update',
      data: {
        reviewId: currentReview.id,
        itemId,
        updates: {
          completed: !item.completed,
          completedBy: 'current-user',
          completedAt: new Date(),
        },
      },
    });
  };

  // Merge review
  const mergeReview = () => {
    if (!currentReview) return;

    ws.send({
      namespace: WSNamespace.COLLABORATION,
      event: 'review-merge',
      data: {
        reviewId: currentReview.id,
      },
    });

    toast({
      title: 'Review Merged',
      description: 'The review has been merged successfully',
    });
  };

  // Get default checklist
  const getDefaultChecklist = (type: ReviewType): ChecklistItem[] => {
    const checklists: Record<ReviewType, string[]> = {
      [ReviewType.CODE]: [
        'Code follows style guidelines',
        'Tests pass',
        'No security vulnerabilities',
        'Documentation updated',
        'Performance impact assessed',
      ],
      [ReviewType.CONTENT]: [
        'Grammar and spelling checked',
        'Facts verified',
        'Tone appropriate',
        'SEO optimized',
        'Images have alt text',
      ],
      [ReviewType.DESIGN]: [
        'Follows design system',
        'Responsive on all devices',
        'Accessibility standards met',
        'Assets optimized',
        'Color contrast passes WCAG',
      ],
      [ReviewType.WORKFLOW]: [
        'Steps clearly defined',
        'Error handling included',
        'Performance optimized',
        'Documentation complete',
        'Tested in staging',
      ],
      [ReviewType.AUTOMATION]: [
        'Scripts tested',
        'Error handling robust',
        'Logging implemented',
        'Documentation complete',
        'Rollback plan defined',
      ],
      [ReviewType.SECURITY]: [
        'Vulnerabilities assessed',
        'Authentication proper',
        'Authorization checked',
        'Data encrypted',
        'Audit logging enabled',
      ],
      [ReviewType.PERFORMANCE]: [
        'Load times measured',
        'Database queries optimized',
        'Caching implemented',
        'Memory usage acceptable',
        'Scalability considered',
      ],
    };

    return (checklists[type] || []).map((text, index) => ({
      id: `checklist-${index}`,
      text,
      completed: false,
      required: index < 3,
    }));
  };

  // Reset form
  const resetForm = () => {
    setNewReviewTitle('');
    setNewReviewDescription('');
    setNewReviewType(ReviewType.CODE);
    setNewReviewPriority(ReviewPriority.MEDIUM);
    setSelectedReviewers([]);
    setSelectedLabels([]);
  };

  // Get status color
  const getStatusColor = (status: ReviewStatus) => {
    const colors: Record<ReviewStatus, string> = {
      [ReviewStatus.DRAFT]: 'bg-gray-500',
      [ReviewStatus.PENDING]: 'bg-yellow-500',
      [ReviewStatus.IN_PROGRESS]: 'bg-blue-500',
      [ReviewStatus.CHANGES_REQUESTED]: 'bg-orange-500',
      [ReviewStatus.APPROVED]: 'bg-green-500',
      [ReviewStatus.REJECTED]: 'bg-red-500',
      [ReviewStatus.MERGED]: 'bg-purple-500',
      [ReviewStatus.CLOSED]: 'bg-gray-500',
    };
    return colors[status];
  };

  // Get priority color
  const getPriorityColor = (priority: ReviewPriority) => {
    const colors: Record<ReviewPriority, string> = {
      [ReviewPriority.LOW]: 'text-gray-500',
      [ReviewPriority.MEDIUM]: 'text-blue-500',
      [ReviewPriority.HIGH]: 'text-yellow-500',
      [ReviewPriority.URGENT]: 'text-orange-500',
      [ReviewPriority.CRITICAL]: 'text-red-500',
    };
    return colors[priority];
  };

  return (
    <div className="review-system p-4" data-testid="review-system">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Reviews List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reviews</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowCreateDialog(true)}
                  data-testid="button-create-review"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New
                </Button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-2xl font-bold">{reviewStats.pending}</div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-2xl font-bold">{reviewStats.inProgress}</div>
                  <div className="text-xs text-gray-500">In Progress</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="space-y-2 mb-4">
                <Input
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  data-testid="input-search"
                />
                
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.values(ReviewStatus).map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.values(ReviewType).map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Reviews List */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredReviews.map(review => (
                    <div
                      key={review.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        currentReview?.id === review.id && "border-primary bg-primary/5"
                      )}
                      onClick={() => setCurrentReview(review)}
                      data-testid={`review-${review.id}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn("w-1 h-full rounded", getStatusColor(review.status))} />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{review.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {review.type}
                            </Badge>
                            <Flag className={cn("w-3 h-3", getPriorityColor(review.priority))} />
                            <span className="text-xs text-gray-500">
                              #{review.id.slice(-4)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                            <Avatar className="w-4 h-4">
                              <AvatarFallback>{review.author.name[0]}</AvatarFallback>
                            </Avatar>
                            <span>{review.author.name}</span>
                            <span>•</span>
                            <Clock className="w-3 h-3" />
                            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Review Details */}
        <div className="lg:col-span-3">
          {currentReview ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{currentReview.title}</CardTitle>
                    <CardDescription>{currentReview.description}</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={cn("text-xs", getStatusColor(currentReview.status))}>
                        {currentReview.status}
                      </Badge>
                      {currentReview.labels.map(label => (
                        <Badge key={label} variant="outline" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentReview.status === ReviewStatus.PENDING && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={approveReview}
                          data-testid="button-approve"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={requestChanges}
                          data-testid="button-request-changes"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Request Changes
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={rejectReview}
                          data-testid="button-reject"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                    {currentReview.status === ReviewStatus.APPROVED && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={mergeReview}
                        data-testid="button-merge"
                      >
                        <GitMerge className="w-4 h-4 mr-2" />
                        Merge
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="files">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="files">
                      Files ({currentReview.files.length})
                    </TabsTrigger>
                    <TabsTrigger value="comments">
                      Comments ({currentReview.comments.length})
                    </TabsTrigger>
                    <TabsTrigger value="checklist">
                      Checklist ({currentReview.checklist.filter(i => i.completed).length}/{currentReview.checklist.length})
                    </TabsTrigger>
                    <TabsTrigger value="reviewers">
                      Reviewers ({currentReview.reviewers.length})
                    </TabsTrigger>
                    <TabsTrigger value="metrics">
                      Metrics
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="files" className="mt-4">
                    <div className="flex gap-4">
                      {/* File List */}
                      <div className="w-64">
                        <ScrollArea className="h-[500px]">
                          <div className="space-y-1">
                            {currentReview.files.map(file => (
                              <div
                                key={file.id}
                                className={cn(
                                  "p-2 rounded cursor-pointer text-sm",
                                  selectedFile?.id === file.id ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-50 dark:hover:bg-gray-900"
                                )}
                                onClick={() => setSelectedFile(file)}
                                data-testid={`file-${file.id}`}
                              >
                                <div className="font-mono text-xs">{file.path}</div>
                                <div className="flex items-center gap-2 mt-1 text-xs">
                                  <span className="text-green-500">+{file.additions}</span>
                                  <span className="text-red-500">-{file.deletions}</span>
                                  {file.comments.length > 0 && (
                                    <span className="text-gray-500">
                                      <MessageSquare className="w-3 h-3 inline mr-1" />
                                      {file.comments.length}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Diff Viewer */}
                      <div className="flex-1">
                        {selectedFile ? (
                          <div className="border rounded-lg">
                            <div className="p-2 border-b bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                              <span className="font-mono text-sm">{selectedFile.path}</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setViewMode(viewMode === 'split' ? 'unified' : 'split')}
                                  data-testid="button-toggle-view"
                                >
                                  {viewMode === 'split' ? 'Unified' : 'Split'}
                                </Button>
                              </div>
                            </div>
                            
                            {/* Diff Content */}
                            <ScrollArea className="h-[400px]">
                              <div className="font-mono text-sm">
                                {selectedFile.hunks.map((hunk, hunkIndex) => (
                                  <div key={hunkIndex} className="border-b">
                                    <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs">
                                      @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                                    </div>
                                    {hunk.lines.map((line, lineIndex) => {
                                      const lineNumber = line.newLineNumber || line.oldLineNumber || 0;
                                      const hasComment = selectedFile.comments.some(c => c.lineNumber === lineNumber);
                                      
                                      return (
                                        <div key={lineIndex}>
                                          <div
                                            className={cn(
                                              "px-2 py-1 flex items-center group hover:bg-gray-50 dark:hover:bg-gray-900",
                                              line.type === 'add' && "bg-green-50 dark:bg-green-900/20",
                                              line.type === 'delete' && "bg-red-50 dark:bg-red-900/20"
                                            )}
                                            onClick={() => setSelectedLineNumber(lineNumber)}
                                          >
                                            {showLineNumbers && (
                                              <>
                                                <span className="w-10 text-right pr-2 text-xs text-gray-500">
                                                  {line.oldLineNumber || ''}
                                                </span>
                                                <span className="w-10 text-right pr-2 text-xs text-gray-500">
                                                  {line.newLineNumber || ''}
                                                </span>
                                              </>
                                            )}
                                            <span className="w-4 text-center">
                                              {line.type === 'add' && '+'}
                                              {line.type === 'delete' && '-'}
                                            </span>
                                            <span className="flex-1 pl-2">
                                              {line.content}
                                            </span>
                                            {hasComment && (
                                              <MessageSquare className="w-3 h-3 text-blue-500" />
                                            )}
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="opacity-0 group-hover:opacity-100"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedLineNumber(lineNumber);
                                              }}
                                              data-testid={`button-comment-line-${lineNumber}`}
                                            >
                                              <MessageSquare className="w-3 h-3" />
                                            </Button>
                                          </div>
                                          
                                          {/* Line Comments */}
                                          {selectedFile.comments
                                            .filter(c => c.lineNumber === lineNumber)
                                            .map(comment => (
                                              <div key={comment.id} className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 border-l-2 border-blue-500">
                                                <div className="flex items-start gap-2">
                                                  <Avatar className="w-6 h-6">
                                                    <AvatarFallback>{comment.username[0]}</AvatarFallback>
                                                  </Avatar>
                                                  <div className="flex-1">
                                                    <div className="text-xs text-gray-500">
                                                      {comment.username} • {new Date(comment.timestamp).toLocaleTimeString()}
                                                    </div>
                                                    <div className="text-sm mt-1">{comment.text}</div>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          
                                          {/* Add Line Comment */}
                                          {selectedLineNumber === lineNumber && (
                                            <div className="bg-gray-50 dark:bg-gray-800 p-2">
                                              <div className="flex gap-2">
                                                <Input
                                                  value={lineCommentText}
                                                  onChange={(e) => setLineCommentText(e.target.value)}
                                                  placeholder="Add a comment..."
                                                  className="text-sm"
                                                  data-testid={`input-line-comment-${lineNumber}`}
                                                />
                                                <Button
                                                  size="sm"
                                                  onClick={addLineComment}
                                                  data-testid={`button-add-line-comment-${lineNumber}`}
                                                >
                                                  Comment
                                                </Button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-[400px] text-gray-500">
                            <FileText className="w-12 h-12 mb-2" />
                            <p>Select a file to view changes</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="comments" className="mt-4">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {currentReview.comments.map(comment => (
                          <div key={comment.id} className="p-3 border rounded-lg" data-testid={`comment-${comment.id}`}>
                            <div className="flex items-start gap-3">
                              <Avatar>
                                <AvatarImage src={comment.avatar} />
                                <AvatarFallback>{comment.username[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{comment.username}</span>
                                  {comment.type === 'approval' && (
                                    <Badge className="text-xs bg-green-500">Approved</Badge>
                                  )}
                                  {comment.type === 'rejection' && (
                                    <Badge className="text-xs bg-red-500">Rejected</Badge>
                                  )}
                                  {comment.type === 'changes-requested' && (
                                    <Badge className="text-xs bg-orange-500">Changes Requested</Badge>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {new Date(comment.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <p className="mt-2">{comment.text}</p>
                                {comment.reactions && Object.keys(comment.reactions).length > 0 && (
                                  <div className="flex items-center gap-2 mt-2">
                                    {Object.entries(comment.reactions).map(([emoji, users]) => (
                                      <TooltipProvider key={emoji}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button size="sm" variant="outline" className="h-6 px-2">
                                              <span>{emoji}</span>
                                              <span className="ml-1 text-xs">{users.length}</span>
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            {users.join(', ')}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    {/* Add Comment */}
                    <div className="mt-4 space-y-2">
                      <Textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add your comment..."
                        className="min-h-[80px]"
                        data-testid="textarea-comment"
                      />
                      <Button onClick={addComment} className="w-full" data-testid="button-add-comment">
                        <Send className="w-4 h-4 mr-2" />
                        Add Comment
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="checklist" className="mt-4">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {currentReview.checklist.map(item => (
                          <div
                            key={item.id}
                            className="flex items-start gap-2 p-2"
                            data-testid={`checklist-${item.id}`}
                          >
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={() => toggleChecklistItem(item.id)}
                              data-testid={`checkbox-${item.id}`}
                            />
                            <div className="flex-1">
                              <div className={cn(
                                "text-sm",
                                item.completed && "line-through text-gray-500"
                              )}>
                                {item.text}
                                {item.required && (
                                  <Badge variant="outline" className="ml-2 text-xs">Required</Badge>
                                )}
                              </div>
                              {item.completed && item.completedBy && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Completed by {item.completedBy} at {new Date(item.completedAt!).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    {/* Checklist Progress */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Checklist Progress</span>
                        <span>
                          {currentReview.checklist.filter(i => i.completed).length} / {currentReview.checklist.length}
                        </span>
                      </div>
                      <Progress
                        value={(currentReview.checklist.filter(i => i.completed).length / currentReview.checklist.length) * 100}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="reviewers" className="mt-4">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {currentReview.reviewers.map(reviewer => (
                          <div
                            key={reviewer.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                            data-testid={`reviewer-${reviewer.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={reviewer.avatar} />
                                <AvatarFallback>{reviewer.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{reviewer.name}</div>
                                {reviewer.reviewedAt && (
                                  <div className="text-xs text-gray-500">
                                    Reviewed {new Date(reviewer.reviewedAt).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant={
                                reviewer.status === 'approved' ? 'default' :
                                reviewer.status === 'rejected' ? 'destructive' :
                                reviewer.status === 'changes-requested' ? 'outline' :
                                'secondary'
                              }
                            >
                              {reviewer.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="metrics" className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Changes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Files Changed</span>
                              <span className="font-medium">{currentReview.metrics.filesChanged}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-green-600">Additions</span>
                              <span className="font-medium text-green-600">+{currentReview.metrics.additions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-red-600">Deletions</span>
                              <span className="font-medium text-red-600">-{currentReview.metrics.deletions}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Review Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Comments</span>
                              <span className="font-medium">{currentReview.metrics.commentsCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Approvals</span>
                              <span className="font-medium">
                                {currentReview.metrics.approvalsReceived} / {currentReview.metrics.approvalsNeeded}
                              </span>
                            </div>
                            <Progress
                              value={(currentReview.metrics.approvalsReceived / currentReview.metrics.approvalsNeeded) * 100}
                              className="mt-2"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-[600px] text-center">
                <GitPullRequest className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Review Selected</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Select a review from the list or create a new one
                </p>
                <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-review-empty">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Review
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Review Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl" data-testid="dialog-create-review">
          <DialogHeader>
            <DialogTitle>Create Review</DialogTitle>
            <DialogDescription>
              Start a new review for code, content, or any other changes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="review-title">Title</Label>
              <Input
                id="review-title"
                value={newReviewTitle}
                onChange={(e) => setNewReviewTitle(e.target.value)}
                placeholder="Brief description of changes"
                data-testid="input-review-title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="review-description">Description</Label>
              <Textarea
                id="review-description"
                value={newReviewDescription}
                onChange={(e) => setNewReviewDescription(e.target.value)}
                placeholder="Detailed description of what changed and why"
                className="min-h-[100px]"
                data-testid="textarea-review-description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newReviewType} onValueChange={(value) => setNewReviewType(value as ReviewType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ReviewType).map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newReviewPriority} onValueChange={(value) => setNewReviewPriority(value as ReviewPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ReviewPriority).map(priority => (
                      <SelectItem key={priority} value={priority}>
                        {priority.replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createReview} data-testid="button-confirm-create">
                Create Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}