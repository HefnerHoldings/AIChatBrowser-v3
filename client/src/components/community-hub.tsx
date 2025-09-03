import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users,
  MessageCircle,
  Heart,
  Share2,
  TrendingUp,
  Award,
  BookOpen,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  Flag,
  CheckCircle,
  Clock,
  Tag,
  Search,
  Filter,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ForumPost {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  category: string;
  content: string;
  likes: number;
  replies: number;
  views: number;
  solved: boolean;
  pinned: boolean;
  createdAt: Date;
  tags: string[];
}

interface Tutorial {
  id: string;
  title: string;
  author: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: string;
  views: number;
  rating: number;
  topics: string[];
}

export function CommunityHub() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  
  const [forumPosts] = useState<ForumPost[]>([
    {
      id: "post-1",
      title: "How to extract data from dynamic websites?",
      author: "Sarah Chen",
      category: "Help",
      content: "I'm trying to extract data from a React-based website but the content loads dynamically...",
      likes: 23,
      replies: 8,
      views: 156,
      solved: true,
      pinned: false,
      createdAt: new Date(Date.now() - 7200000),
      tags: ["web-scraping", "react", "dynamic-content"]
    },
    {
      id: "post-2",
      title: "Share your best lead generation workflows!",
      author: "Mike Johnson",
      category: "Showcase",
      content: "Let's share our most successful lead generation workflows. I'll start with mine...",
      likes: 45,
      replies: 12,
      views: 289,
      solved: false,
      pinned: true,
      createdAt: new Date(Date.now() - 86400000),
      tags: ["leads", "workflows", "tips"]
    },
    {
      id: "post-3",
      title: "New plugin: LinkedIn Profile Enricher",
      author: "DevTeam",
      category: "Announcement",
      content: "We're excited to announce our new LinkedIn Profile Enricher plugin...",
      likes: 67,
      replies: 15,
      views: 512,
      solved: false,
      pinned: true,
      createdAt: new Date(Date.now() - 172800000),
      tags: ["plugin", "linkedin", "announcement"]
    }
  ]);

  const [tutorials] = useState<Tutorial[]>([
    {
      id: "tut-1",
      title: "Getting Started with MadEasy Browser",
      author: "MadEasy Team",
      difficulty: "beginner",
      duration: "15 min",
      views: 2341,
      rating: 4.8,
      topics: ["basics", "setup", "first-workflow"]
    },
    {
      id: "tut-2",
      title: "Advanced Selector Strategies",
      author: "Expert User",
      difficulty: "advanced",
      duration: "30 min",
      views: 892,
      rating: 4.9,
      topics: ["selectors", "xpath", "css"]
    },
    {
      id: "tut-3",
      title: "Building Your First Plugin",
      author: "Plugin Dev",
      difficulty: "intermediate",
      duration: "45 min",
      views: 1234,
      rating: 4.7,
      topics: ["plugin", "development", "api"]
    }
  ]);

  const handleCreatePost = () => {
    if (!newPostTitle || !newPostContent) {
      toast({
        title: "Missing information",
        description: "Please provide both title and content",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Post created",
      description: "Your post has been published to the community",
    });
    setNewPostTitle("");
    setNewPostContent("");
  };

  const handleLikePost = (postId: string) => {
    toast({
      title: "Post liked",
      description: "You liked this post",
    });
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return <Badge className="bg-green-500">Beginner</Badge>;
      case "intermediate": return <Badge className="bg-yellow-500">Intermediate</Badge>;
      case "advanced": return <Badge className="bg-red-500">Advanced</Badge>;
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
              Community Hub
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <BookOpen className="h-3 w-3 mr-1" />
                Documentation
              </Button>
              <Button size="sm">
                <Plus className="h-3 w-3 mr-1" />
                New Post
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Connect with other users, share knowledge, and get help
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="forum" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="forum">Forum</TabsTrigger>
              <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
              <TabsTrigger value="showcase">Showcase</TabsTrigger>
              <TabsTrigger value="help">Help Center</TabsTrigger>
            </TabsList>

            <TabsContent value="forum" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search discussions..." 
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

              <div className="grid grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <div className="text-2xl font-bold">1,234</div>
                    <div className="text-xs text-muted-foreground">Active Users</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-2xl font-bold">456</div>
                    <div className="text-xs text-muted-foreground">Discussions</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-2xl font-bold">89%</div>
                    <div className="text-xs text-muted-foreground">Solved</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-2xl font-bold">23</div>
                    <div className="text-xs text-muted-foreground">Online Now</div>
                  </CardContent>
                </Card>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {forumPosts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              {post.pinned && (
                                <Badge variant="outline">
                                  📌 Pinned
                                </Badge>
                              )}
                              {post.solved && (
                                <Badge className="bg-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Solved
                                </Badge>
                              )}
                              <Badge variant="secondary">{post.category}</Badge>
                            </div>
                            
                            <div className="font-medium hover:text-primary cursor-pointer">
                              {post.title}
                            </div>
                            
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {post.content}
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {post.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <Tag className="h-2 w-2 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="text-xs">
                                    {post.author.split(" ").map(n => n[0]).join("")}
                                  </AvatarFallback>
                                </Avatar>
                                {post.author}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(post.createdAt).toLocaleTimeString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                {post.replies} replies
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {post.likes}
                              </div>
                              <div>{post.views} views</div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleLikePost(post.id)}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <span className="text-xs text-center">{post.likes}</span>
                            <Button size="sm" variant="ghost">
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Start a New Discussion</div>
                    <Input 
                      placeholder="Discussion title..."
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                    />
                    <Textarea 
                      placeholder="Share your thoughts, ask questions, or help others..."
                      className="min-h-[100px]"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Tag className="h-3 w-3 mr-1" />
                          Add Tags
                        </Button>
                        <Button size="sm" variant="outline">
                          📎 Attach
                        </Button>
                      </div>
                      <Button size="sm" onClick={handleCreatePost}>
                        Post to Community
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tutorials" className="space-y-4">
              <Alert>
                <BookOpen className="h-4 w-4" />
                <AlertDescription>
                  Learn from community-created tutorials and guides
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                {tutorials.map((tutorial) => (
                  <Card key={tutorial.id} className="cursor-pointer hover:border-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium">{tutorial.title}</div>
                        {getDifficultyBadge(tutorial.difficulty)}
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-3">
                        By {tutorial.author} • {tutorial.duration}
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {tutorial.topics.map((topic, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          ⭐ {tutorial.rating}
                        </div>
                        <div>{tutorial.views.toLocaleString()} views</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="showcase" className="space-y-4">
              <Alert>
                <Award className="h-4 w-4" />
                <AlertDescription>
                  Share your successful workflows and learn from others
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <div className="text-sm font-medium">Top Workflow</div>
                    <div className="text-xs text-muted-foreground">
                      EU Lead Generator
                    </div>
                    <div className="text-xs mt-1">2.3k uses</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <Award className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                    <div className="text-sm font-medium">Featured Plugin</div>
                    <div className="text-xs text-muted-foreground">
                      Smart Form Filler
                    </div>
                    <div className="text-xs mt-1">4.9 ★</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-sm font-medium">Top Contributor</div>
                    <div className="text-xs text-muted-foreground">
                      Sarah Chen
                    </div>
                    <div className="text-xs mt-1">156 posts</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="help" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <HelpCircle className="h-6 w-6 mb-2 text-blue-500" />
                    <div className="font-medium mb-1">Getting Started</div>
                    <div className="text-xs text-muted-foreground">
                      New to MadEasy? Start here with our beginner guides
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <MessageCircle className="h-6 w-6 mb-2 text-green-500" />
                    <div className="font-medium mb-1">Contact Support</div>
                    <div className="text-xs text-muted-foreground">
                      Get help from our support team for technical issues
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium mb-3">Frequently Asked Questions</div>
                  <div className="space-y-2">
                    <div className="p-2 hover:bg-muted rounded cursor-pointer">
                      <div className="text-sm">How do I create my first workflow?</div>
                    </div>
                    <div className="p-2 hover:bg-muted rounded cursor-pointer">
                      <div className="text-sm">What are the differences between plans?</div>
                    </div>
                    <div className="p-2 hover:bg-muted rounded cursor-pointer">
                      <div className="text-sm">How do I develop and publish a plugin?</div>
                    </div>
                    <div className="p-2 hover:bg-muted rounded cursor-pointer">
                      <div className="text-sm">Can I export my data to other formats?</div>
                    </div>
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