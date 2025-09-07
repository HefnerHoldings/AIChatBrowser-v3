import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare,
  ThumbsUp,
  Eye,
  Search,
  TrendingUp,
  Clock,
  Star,
  Award,
  Users,
  Hash,
  Filter,
  Plus,
  ChevronRight,
  Pin,
  Lock,
  Flame,
  MessageCircle,
  Heart,
  Bookmark,
  Share2,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  authorAvatar?: string;
  authorLevel?: number;
  category: 'discussion' | 'question' | 'showcase' | 'announcement' | 'tutorial' | 'bug';
  tags: string[];
  views: number;
  replies: number;
  likes: number;
  isPinned?: boolean;
  isLocked?: boolean;
  isSolved?: boolean;
  createdAt: Date;
  lastReply?: {
    author: string;
    time: Date;
  };
}

interface ForumReply {
  id: string;
  postId: string;
  author: string;
  authorAvatar?: string;
  authorLevel?: number;
  content: string;
  likes: number;
  isBestAnswer?: boolean;
  createdAt: Date;
}

export function CommunityForum() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  
  // Sample forum posts
  const posts: ForumPost[] = [
    {
      id: '1',
      title: 'Hvordan optimalisere web scraping for dynamisk innhold?',
      content: 'Jeg har problemer med å scrape nettsider som laster innhold dynamisk med JavaScript...',
      author: 'TechNinja',
      authorLevel: 15,
      category: 'question',
      tags: ['scraping', 'javascript', 'puppeteer'],
      views: 342,
      replies: 12,
      likes: 28,
      isSolved: true,
      createdAt: new Date('2025-01-28'),
      lastReply: {
        author: 'CodeMaster',
        time: new Date('2025-01-29')
      }
    },
    {
      id: '2',
      title: '🚀 Lanserer ny AI-drevet workflow automation playbook!',
      content: 'Hei alle! Jeg har nettopp publisert min nye playbook som bruker GPT-5 for intelligent automatisering...',
      author: 'AICreator',
      authorLevel: 22,
      category: 'showcase',
      tags: ['ai', 'automation', 'gpt-5', 'showcase'],
      views: 892,
      replies: 34,
      likes: 156,
      isPinned: true,
      createdAt: new Date('2025-01-27'),
      lastReply: {
        author: 'DevGuru',
        time: new Date('2025-01-29')
      }
    },
    {
      id: '3',
      title: 'MadEasy 3.0 - Nye funksjoner og forbedringer',
      content: 'Vi er glade for å kunngjøre den nye versjonen med multi-agent support...',
      author: 'MadEasy Team',
      authorLevel: 99,
      category: 'announcement',
      tags: ['update', 'official', 'features'],
      views: 2341,
      replies: 89,
      likes: 412,
      isPinned: true,
      isLocked: true,
      createdAt: new Date('2025-01-25')
    },
    {
      id: '4',
      title: 'Steg-for-steg guide: Bygge en custom browser extension',
      content: 'I denne guiden skal jeg vise hvordan du kan lage din egen browser extension...',
      author: 'ExtensionPro',
      authorLevel: 18,
      category: 'tutorial',
      tags: ['tutorial', 'extension', 'chrome', 'guide'],
      views: 567,
      replies: 23,
      likes: 87,
      createdAt: new Date('2025-01-26'),
      lastReply: {
        author: 'Learner123',
        time: new Date('2025-01-28')
      }
    },
    {
      id: '5',
      title: 'Bug: Workflow builder krasjer ved import av store filer',
      content: 'Når jeg prøver å importere CSV-filer over 10MB, krasjer workflow builder...',
      author: 'BugHunter',
      authorLevel: 12,
      category: 'bug',
      tags: ['bug', 'workflow', 'import', 'csv'],
      views: 123,
      replies: 5,
      likes: 3,
      createdAt: new Date('2025-01-29'),
      lastReply: {
        author: 'Support',
        time: new Date('2025-01-29')
      }
    }
  ];

  const replies: ForumReply[] = [
    {
      id: 'r1',
      postId: '1',
      author: 'CodeMaster',
      authorLevel: 25,
      content: 'Du kan bruke Puppeteer med waitForSelector for å vente på at innholdet lastes. Her er et eksempel...',
      likes: 15,
      isBestAnswer: true,
      createdAt: new Date('2025-01-28')
    },
    {
      id: 'r2',
      postId: '1',
      author: 'WebScraper',
      authorLevel: 10,
      content: 'Alternativt kan du bruke Playwright som har bedre støtte for moderne web apps...',
      likes: 8,
      createdAt: new Date('2025-01-29')
    }
  ];

  const categories = [
    { id: 'all', name: 'Alle innlegg', icon: MessageSquare, count: posts.length },
    { id: 'discussion', name: 'Diskusjon', icon: MessageCircle, count: 0 },
    { id: 'question', name: 'Spørsmål', icon: HelpCircle, count: 0 },
    { id: 'showcase', name: 'Showcase', icon: Star, count: 0 },
    { id: 'announcement', name: 'Kunngjøringer', icon: AlertCircle, count: 0 },
    { id: 'tutorial', name: 'Guider', icon: Lightbulb, count: 0 },
    { id: 'bug', name: 'Bugs', icon: AlertCircle, count: 0 }
  ];

  const trendingTags = [
    'automation', 'ai', 'scraping', 'workflow', 'gpt-5', 'integration', 'api', 'testing'
  ];

  const topContributors = [
    { name: 'CodeMaster', level: 25, posts: 234, bestAnswers: 45 },
    { name: 'AICreator', level: 22, posts: 189, bestAnswers: 32 },
    { name: 'DevGuru', level: 20, posts: 156, bestAnswers: 28 },
    { name: 'ExtensionPro', level: 18, posts: 142, bestAnswers: 21 }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'question': return <HelpCircle className="h-4 w-4" />;
      case 'showcase': return <Star className="h-4 w-4" />;
      case 'announcement': return <AlertCircle className="h-4 w-4" />;
      case 'tutorial': return <Lightbulb className="h-4 w-4" />;
      case 'bug': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'question': return 'bg-blue-500';
      case 'showcase': return 'bg-purple-500';
      case 'announcement': return 'bg-amber-500';
      case 'tutorial': return 'bg-green-500';
      case 'bug': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredPosts = posts.filter(post => 
    (selectedCategory === 'all' || post.category === selectedCategory) &&
    (searchQuery === '' || 
     post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
     post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 border-r p-4 space-y-6">
        {/* New Post Button */}
        <Button 
          className="w-full"
          onClick={() => setShowNewPostForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nytt innlegg
        </Button>

        {/* Categories */}
        <div>
          <h3 className="font-semibold mb-3">Kategorier</h3>
          <div className="space-y-1">
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setSelectedCategory(cat.id)}
              >
                <cat.icon className="h-4 w-4 mr-2" />
                {cat.name}
                {cat.count > 0 && (
                  <span className="ml-auto text-xs">{cat.count}</span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Trending Tags */}
        <div>
          <h3 className="font-semibold mb-3">Trending Tags</h3>
          <div className="flex flex-wrap gap-2">
            {trendingTags.map(tag => (
              <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                <Hash className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Top Contributors */}
        <div>
          <h3 className="font-semibold mb-3">Topp Bidragsytere</h3>
          <div className="space-y-2">
            {topContributors.map((user, index) => (
              <div key={user.name} className="flex items-center gap-2">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-white">👑</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Lvl {user.level} • {user.bestAnswers} beste svar
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk i forum..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="latest" className="mb-6">
          <TabsList>
            <TabsTrigger value="latest">
              <Clock className="h-4 w-4 mr-2" />
              Nyeste
            </TabsTrigger>
            <TabsTrigger value="trending">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="unanswered">
              <HelpCircle className="h-4 w-4 mr-2" />
              Ubesvarte
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Posts List */}
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="space-y-4">
            {filteredPosts.map(post => (
              <Card 
                key={post.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedPost(post)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{post.author[0]}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {post.isPinned && (
                              <Pin className="h-4 w-4 text-amber-500" />
                            )}
                            {post.isLocked && (
                              <Lock className="h-4 w-4 text-gray-500" />
                            )}
                            <h3 className="font-semibold hover:text-primary">
                              {post.title}
                            </h3>
                            {post.isSolved && (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Løst
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {post.content}
                          </p>
                        </div>
                        <Badge className={`${getCategoryColor(post.category)} text-white`}>
                          {getCategoryIcon(post.category)}
                          <span className="ml-1">{post.category}</span>
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px]">{post.author[0]}</AvatarFallback>
                            </Avatar>
                            {post.author}
                            {post.authorLevel && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                Lvl {post.authorLevel}
                              </Badge>
                            )}
                          </span>
                          <span>
                            {post.createdAt.toLocaleDateString('nb-NO')}
                          </span>
                          {post.lastReply && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              Siste svar av {post.lastReply.author}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {post.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {post.replies}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            {post.likes}
                          </span>
                        </div>
                      </div>

                      {post.tags.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {post.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Hash className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* New Post Form Modal */}
        {showNewPostForm && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="w-[600px] max-h-[80vh] overflow-auto">
              <CardHeader>
                <CardTitle>Opprett nytt innlegg</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tittel</label>
                  <Input placeholder="Skriv inn tittel..." />
                </div>
                <div>
                  <label className="text-sm font-medium">Kategori</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="discussion">Diskusjon</option>
                    <option value="question">Spørsmål</option>
                    <option value="showcase">Showcase</option>
                    <option value="tutorial">Guide</option>
                    <option value="bug">Bug rapport</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Innhold</label>
                  <Textarea 
                    placeholder="Skriv ditt innlegg her..."
                    rows={8}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tags</label>
                  <Input placeholder="Legg til tags (komma-separert)" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewPostForm(false)}>
                    Avbryt
                  </Button>
                  <Button>
                    Publiser innlegg
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}