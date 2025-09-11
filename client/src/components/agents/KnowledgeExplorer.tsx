import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Search, Database, GitBranch, Hash, FileText, Lightbulb, TrendingUp } from 'lucide-react';
import type { Agent } from './AgentDashboard';

interface KnowledgeEntry {
  id: string;
  agentId: string;
  agentType: string;
  category: string;
  key: string;
  value: any;
  confidence: number;
  timestamp: Date;
  usageCount: number;
  successRate: number;
  tags: string[];
}

interface Pattern {
  id: string;
  name: string;
  description: string;
  occurrences: number;
  successRate: number;
  agents: string[];
  example: any;
}

interface KnowledgeExplorerProps {
  agents: Agent[];
}

const KnowledgeExplorer = ({ agents }: KnowledgeExplorerProps) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock knowledge data - in real app, fetch from API
  const knowledgeEntries: KnowledgeEntry[] = [
    {
      id: '1',
      agentId: 'planner-1',
      agentType: 'planner',
      category: 'task-patterns',
      key: 'form-automation-strategy',
      value: {
        steps: ['identify-fields', 'validate-data', 'fill-fields', 'submit', 'verify'],
        successRate: 0.92,
        avgTime: 45000
      },
      confidence: 95,
      timestamp: new Date(),
      usageCount: 127,
      successRate: 92,
      tags: ['automation', 'forms', 'strategy']
    },
    {
      id: '2',
      agentId: 'researcher-1',
      agentType: 'researcher',
      category: 'selectors',
      key: 'common-price-selectors',
      value: ['.price', '.product-price', '[data-price]', 'span.amount'],
      confidence: 88,
      timestamp: new Date(),
      usageCount: 89,
      successRate: 88,
      tags: ['scraping', 'e-commerce', 'selectors']
    },
    {
      id: '3',
      agentId: 'executor-1',
      agentType: 'executor',
      category: 'error-handling',
      key: 'timeout-recovery',
      value: {
        strategy: 'exponential-backoff',
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 8000
      },
      confidence: 90,
      timestamp: new Date(),
      usageCount: 45,
      successRate: 87,
      tags: ['error-handling', 'recovery', 'reliability']
    }
  ];

  const patterns: Pattern[] = [
    {
      id: '1',
      name: 'Sequential Form Fill',
      description: 'Pattern for filling multi-step forms with validation',
      occurrences: 234,
      successRate: 91,
      agents: ['planner', 'executor', 'critic'],
      example: { workflow: 'identify → validate → fill → submit → verify' }
    },
    {
      id: '2',
      name: 'Data Extraction Pipeline',
      description: 'Efficient pattern for extracting structured data from web pages',
      occurrences: 189,
      successRate: 94,
      agents: ['researcher', 'executor'],
      example: { workflow: 'navigate → wait → extract → transform → validate' }
    }
  ];

  // Filter knowledge entries
  const filteredEntries = knowledgeEntries.filter(entry => {
    const matchesSearch = searchQuery === '' || 
      entry.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    const matchesAgent = !selectedAgent || entry.agentId === selectedAgent;
    
    return matchesSearch && matchesCategory && matchesAgent;
  });

  // Get categories
  const categories = Array.from(new Set(knowledgeEntries.map(e => e.category)));

  // Calculate knowledge stats
  const knowledgeStats = {
    totalEntries: knowledgeEntries.length,
    avgConfidence: knowledgeEntries.reduce((acc, e) => acc + e.confidence, 0) / knowledgeEntries.length,
    totalUsage: knowledgeEntries.reduce((acc, e) => acc + e.usageCount, 0),
    topCategory: categories.reduce((prev, curr) => {
      const prevCount = knowledgeEntries.filter(e => e.category === prev).length;
      const currCount = knowledgeEntries.filter(e => e.category === curr).length;
      return currCount > prevCount ? curr : prev;
    }, categories[0])
  };

  return (
    <div className="h-full">
      <Tabs defaultValue="knowledge" className="h-full">
        <TabsList>
          <TabsTrigger value="knowledge" data-testid="tab-knowledge">
            <Database className="w-4 h-4 mr-2" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="patterns" data-testid="tab-patterns">
            <GitBranch className="w-4 h-4 mr-2" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="insights" data-testid="tab-insights">
            <Lightbulb className="w-4 h-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="h-[calc(100%-3rem)]">
          <div className="flex gap-4 h-full">
            {/* Filters */}
            <Card className="w-64">
              <CardHeader>
                <CardTitle className="text-base">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Search</label>
                  <Input
                    placeholder="Search knowledge..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-1"
                    data-testid="input-search-knowledge"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Category</label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge
                      variant={selectedCategory === 'all' ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory('all')}
                    >
                      All
                    </Badge>
                    {categories.map(cat => (
                      <Badge
                        key={cat}
                        variant={selectedCategory === cat ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Agent</label>
                  <div className="space-y-1 mt-2">
                    <Badge
                      variant={!selectedAgent ? 'default' : 'outline'}
                      className="cursor-pointer w-full justify-start"
                      onClick={() => setSelectedAgent(null)}
                    >
                      All Agents
                    </Badge>
                    {agents.map(agent => (
                      <Badge
                        key={agent.id}
                        variant={selectedAgent === agent.id ? 'default' : 'outline'}
                        className="cursor-pointer w-full justify-start capitalize"
                        onClick={() => setSelectedAgent(agent.id)}
                      >
                        {agent.type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Knowledge Entries */}
            <div className="flex-1">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Knowledge Entries</CardTitle>
                    <Badge variant="outline">
                      {filteredEntries.length} entries
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-20rem)]">
                    <div className="space-y-3">
                      {filteredEntries.map(entry => (
                        <Card key={entry.id} data-testid={`knowledge-entry-${entry.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-medium">{entry.key}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs capitalize">
                                    {entry.agentType}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {entry.category}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {entry.confidence}% confidence
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Used {entry.usageCount} times
                                </div>
                              </div>
                            </div>

                            <div className="text-xs p-2 bg-secondary rounded mb-2">
                              <pre className="whitespace-pre-wrap">
                                {typeof entry.value === 'string' 
                                  ? entry.value 
                                  : JSON.stringify(entry.value, null, 2)}
                              </pre>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap gap-1">
                                {entry.tags.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    <Hash className="w-3 h-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              <Badge 
                                variant={entry.successRate > 90 ? 'default' : 
                                        entry.successRate > 70 ? 'secondary' : 'destructive'}
                                className="text-xs"
                              >
                                {entry.successRate}% success
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="h-[calc(100%-3rem)]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Discovered Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="grid grid-cols-2 gap-4">
                  {patterns.map(pattern => (
                    <Card key={pattern.id} data-testid={`pattern-${pattern.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium">{pattern.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {pattern.description}
                            </div>
                          </div>
                          <Badge variant="outline">
                            {pattern.occurrences} uses
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-sm">
                            {pattern.successRate}% success rate
                          </span>
                        </div>

                        <div className="mt-3">
                          <div className="text-xs text-muted-foreground mb-1">Agents involved:</div>
                          <div className="flex gap-1">
                            {pattern.agents.map(agent => (
                              <Badge key={agent} variant="secondary" className="text-xs capitalize">
                                {agent}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="text-xs p-2 bg-secondary rounded mt-3">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(pattern.example, null, 2)}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="h-[calc(100%-3rem)]">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Knowledge Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Entries</span>
                  <span className="font-bold">{knowledgeStats.totalEntries}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Confidence</span>
                  <span className="font-bold">{knowledgeStats.avgConfidence.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Usage</span>
                  <span className="font-bold">{knowledgeStats.totalUsage}</span>
                </div>
                <div className="flex justify-between">
                  <span>Top Category</span>
                  <Badge>{knowledgeStats.topCategory}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    The system has learned {patterns.length} patterns from {knowledgeStats.totalUsage} interactions.
                    Average pattern success rate: {(patterns.reduce((acc, p) => acc + p.successRate, 0) / patterns.length).toFixed(1)}%
                  </AlertDescription>
                </Alert>

                <div className="mt-4 space-y-2">
                  {agents.map(agent => {
                    const agentKnowledge = knowledgeEntries.filter(e => e.agentType === agent.type);
                    return (
                      <div key={agent.id} className="flex items-center justify-between p-2 border rounded">
                        <Badge variant="outline" className="capitalize">
                          {agent.type}
                        </Badge>
                        <div className="text-sm">
                          {agentKnowledge.length} knowledge entries
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KnowledgeExplorer;