import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Star,
  Download,
  Upload,
  Search,
  Filter,
  TrendingUp,
  Shield,
  GitBranch,
  Code2,
  Package,
  Users,
  Heart,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Zap,
  Sparkles,
  Award,
  Clock,
  Eye,
  X
} from 'lucide-react';

interface Playbook {
  id: string;
  name: string;
  description: string;
  author: string;
  authorAvatar?: string;
  category: 'automation' | 'testing' | 'scraping' | 'integration' | 'ai' | 'productivity';
  tags: string[];
  downloads: number;
  rating: number;
  reviews: number;
  price: number | 'free';
  verified: boolean;
  featured: boolean;
  version: string;
  lastUpdated: Date;
  compatibility: string[];
  preview?: string;
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  type: 'extension' | 'theme' | 'tool' | 'integration';
  icon: string;
  downloads: number;
  rating: number;
  size: string;
  developer: string;
  verified: boolean;
}

export function Marketplace() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);

  // Sample data
  const playbooks: Playbook[] = [
    {
      id: '1',
      name: 'E-Commerce Scraper Pro',
      description: 'Advanced scraping workflow for e-commerce sites with dynamic content handling',
      author: 'DataMaster',
      category: 'scraping',
      tags: ['e-commerce', 'data', 'automation'],
      downloads: 15420,
      rating: 4.8,
      reviews: 234,
      price: 'free',
      verified: true,
      featured: true,
      version: '2.3.1',
      lastUpdated: new Date('2025-01-20'),
      compatibility: ['Chrome', 'Edge', 'Firefox'],
      preview: '/api/placeholder/400/200'
    },
    {
      id: '2',
      name: 'AI Content Generator',
      description: 'Generate high-quality content using multiple AI models with built-in optimization',
      author: 'AICreative',
      category: 'ai',
      tags: ['content', 'ai', 'writing', 'seo'],
      downloads: 8932,
      rating: 4.6,
      reviews: 156,
      price: 29.99,
      verified: true,
      featured: false,
      version: '1.5.0',
      lastUpdated: new Date('2025-01-25'),
      compatibility: ['All browsers']
    },
    {
      id: '3',
      name: 'Form Automation Suite',
      description: 'Automate form filling across multiple sites with smart field detection',
      author: 'AutoTools',
      category: 'automation',
      tags: ['forms', 'automation', 'productivity'],
      downloads: 22103,
      rating: 4.9,
      reviews: 412,
      price: 'free',
      verified: true,
      featured: true,
      version: '3.0.0',
      lastUpdated: new Date('2025-01-28'),
      compatibility: ['Chrome', 'Edge']
    },
    {
      id: '4',
      name: 'Visual Testing Framework',
      description: 'Comprehensive visual regression testing with AI-powered diff detection',
      author: 'QAMaster',
      category: 'testing',
      tags: ['testing', 'qa', 'visual', 'regression'],
      downloads: 5678,
      rating: 4.7,
      reviews: 89,
      price: 49.99,
      verified: false,
      featured: false,
      version: '1.2.3',
      lastUpdated: new Date('2025-01-15'),
      compatibility: ['Chrome']
    }
  ];

  const plugins: Plugin[] = [
    {
      id: '1',
      name: 'Dark Mode Pro',
      description: 'Advanced dark mode with custom themes',
      type: 'theme',
      icon: '🌙',
      downloads: 45230,
      rating: 4.9,
      size: '2.3 MB',
      developer: 'ThemeWorks',
      verified: true
    },
    {
      id: '2',
      name: 'API Connector',
      description: 'Connect to any REST API with ease',
      type: 'integration',
      icon: '🔌',
      downloads: 18940,
      rating: 4.7,
      size: '1.8 MB',
      developer: 'IntegrateHub',
      verified: true
    },
    {
      id: '3',
      name: 'Code Snippets',
      description: 'Manage and share code snippets',
      type: 'tool',
      icon: '📝',
      downloads: 31200,
      rating: 4.8,
      size: '3.1 MB',
      developer: 'DevTools',
      verified: false
    }
  ];

  const categories = [
    { id: 'all', name: 'Alle', icon: Package },
    { id: 'automation', name: 'Automatisering', icon: Zap },
    { id: 'testing', name: 'Testing', icon: Shield },
    { id: 'scraping', name: 'Scraping', icon: Download },
    { id: 'integration', name: 'Integrasjon', icon: GitBranch },
    { id: 'ai', name: 'AI', icon: Sparkles },
    { id: 'productivity', name: 'Produktivitet', icon: TrendingUp }
  ];

  const filteredPlaybooks = playbooks.filter(pb => 
    (selectedCategory === 'all' || pb.category === selectedCategory) &&
    (searchQuery === '' || 
     pb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     pb.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
     pb.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const toggleFavorite = (id: string) => {
    setUserFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(f => f !== id)
        : [...prev, id]
    );
  };

  const installPlaybook = (playbook: Playbook) => {
    console.log('Installing playbook:', playbook.name);
    // Implement installation logic
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Marketplace</h2>
            <Badge variant="secondary">Beta</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Publiser
            </Button>
            <Button variant="outline" size="sm">
              <Heart className="h-4 w-4 mr-2" />
              Favoritter ({userFavorites.length})
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Søk etter playbooks, plugins, utvidelser eller tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="playbooks" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="playbooks">
            <Package className="h-4 w-4 mr-2" />
            Playbooks
          </TabsTrigger>
          <TabsTrigger value="plugins">
            <Code2 className="h-4 w-4 mr-2" />
            Plugins
          </TabsTrigger>
          <TabsTrigger value="trending">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="playbooks" className="flex-1 flex gap-4">
          {/* Categories Sidebar */}
          <Card className="w-48 p-3">
            <h3 className="font-medium mb-3 text-sm">Kategorier</h3>
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
                </Button>
              ))}
            </div>
          </Card>

          {/* Playbooks Grid */}
          <div className="flex-1">
            <ScrollArea className="h-[500px]">
              <div className="grid grid-cols-2 gap-4 pr-4">
                {filteredPlaybooks.map((playbook, index) => (
                  <motion.div
                    key={playbook.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="p-4 cursor-pointer hover:shadow-lg transition-all"
                      onClick={() => setSelectedPlaybook(playbook)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{playbook.name}</h4>
                            {playbook.verified && (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            )}
                            {playbook.featured && (
                              <Badge variant="secondary" className="text-xs">
                                <Award className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {playbook.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(playbook.id);
                          }}
                        >
                          <Heart 
                            className={`h-4 w-4 ${
                              userFavorites.includes(playbook.id) 
                                ? 'fill-red-500 text-red-500' 
                                : ''
                            }`}
                          />
                        </Button>
                      </div>

                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">{playbook.rating}</span>
                          <span className="text-xs text-muted-foreground">
                            ({playbook.reviews})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {playbook.downloads.toLocaleString()}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          v{playbook.version}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {playbook.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="font-semibold text-primary">
                          {playbook.price === 'free' ? 'Gratis' : `$${playbook.price}`}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="plugins" className="flex-1">
          <ScrollArea className="h-[500px]">
            <div className="grid grid-cols-3 gap-4">
              {plugins.map((plugin, index) => (
                <motion.div
                  key={plugin.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-3xl">{plugin.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{plugin.name}</h4>
                          {plugin.verified && (
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {plugin.developer}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {plugin.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          {plugin.rating}
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {plugin.downloads.toLocaleString()}
                        </div>
                        <span>{plugin.size}</span>
                      </div>
                      <Button size="sm">
                        Installer
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="trending" className="flex-1">
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Trending Denne Uken
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {filteredPlaybooks.slice(0, 3).map((pb, i) => (
                  <div key={pb.id} className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-muted-foreground">
                      #{i + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{pb.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        +{Math.round(Math.random() * 50 + 20)}% denne uken
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Community Favoritter
              </h3>
              <div className="space-y-2">
                {playbooks.filter(pb => pb.featured).map(pb => (
                  <div key={pb.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                      <div>
                        <h4 className="font-medium text-sm">{pb.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          av {pb.author}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {pb.category}
                      </Badge>
                      <span className="text-sm font-medium">
                        {pb.price === 'free' ? 'Gratis' : `$${pb.price}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Playbook Details Modal */}
      <AnimatePresence>
        {selectedPlaybook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={() => setSelectedPlaybook(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px]"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">{selectedPlaybook.name}</h3>
                      {selectedPlaybook.verified && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      av {selectedPlaybook.author}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedPlaybook(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-sm mb-4">{selectedPlaybook.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{selectedPlaybook.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({selectedPlaybook.reviews} anmeldelser)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {selectedPlaybook.downloads.toLocaleString()} nedlastinger
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Oppdatert {selectedPlaybook.lastUpdated.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Versjon {selectedPlaybook.version}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {selectedPlaybook.compatibility.join(', ')}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {selectedPlaybook.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary">
                    {selectedPlaybook.price === 'free' ? 'Gratis' : `$${selectedPlaybook.price}`}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Forhåndsvis
                    </Button>
                    <Button onClick={() => installPlaybook(selectedPlaybook)}>
                      <Download className="h-4 w-4 mr-2" />
                      Installer
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}