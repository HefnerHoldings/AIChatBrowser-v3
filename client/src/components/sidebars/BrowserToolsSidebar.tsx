import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  History, 
  Bookmark, 
  Download, 
  Puzzle,
  Settings,
  Globe,
  Shield,
  Key,
  Cookie,
  Trash2,
  Clock,
  Star,
  Search,
  ExternalLink
} from 'lucide-react';

export function BrowserToolsSidebar() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg mb-1">Browser Verktøy</h3>
        <p className="text-sm text-muted-foreground">
          Historikk, bokmerker og innstillinger
        </p>
      </div>

      <Tabs defaultValue="history" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="history">Historikk</TabsTrigger>
          <TabsTrigger value="bookmarks">Bokmerker</TabsTrigger>
          <TabsTrigger value="downloads">Nedlastinger</TabsTrigger>
          <TabsTrigger value="extensions">Utvidelser</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="flex-1 px-4">
          <ScrollArea className="h-full">
            <div className="space-y-3 pb-4">
              <div className="flex gap-2">
                <Input placeholder="Søk i historikk..." className="flex-1" />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <Card className="p-4">
                <h4 className="font-medium mb-3">I dag</h4>
                <div className="space-y-2">
                  {[
                    { title: 'GitHub - madeasy/browser', url: 'github.com', time: '10:23' },
                    { title: 'Stack Overflow', url: 'stackoverflow.com', time: '09:45' },
                    { title: 'MDN Web Docs', url: 'developer.mozilla.org', time: '09:12' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2 flex-1">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{item.title}</div>
                          <div className="text-xs text-muted-foreground">{item.url}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium mb-3">I går</h4>
                <div className="space-y-2">
                  {[
                    { title: 'React Documentation', url: 'react.dev', time: '16:30' },
                    { title: 'Tailwind CSS', url: 'tailwindcss.com', time: '14:15' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2 flex-1">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{item.title}</div>
                          <div className="text-xs text-muted-foreground">{item.url}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="bookmarks" className="flex-1 px-4">
          <ScrollArea className="h-full">
            <div className="space-y-3 pb-4">
              <Button className="w-full" variant="outline">
                <Star className="h-4 w-4 mr-2" />
                Legg til bokmerke
              </Button>
              
              <Card className="p-4">
                <h4 className="font-medium mb-3">Favoritter</h4>
                <div className="space-y-2">
                  {[
                    { title: 'GitHub', url: 'github.com', folder: 'Utvikling' },
                    { title: 'ChatGPT', url: 'chat.openai.com', folder: 'AI' },
                    { title: 'Figma', url: 'figma.com', folder: 'Design' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2 flex-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{item.title}</div>
                          <div className="text-xs text-muted-foreground">{item.url}</div>
                        </div>
                      </div>
                      <Badge variant="outline">{item.folder}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="downloads" className="flex-1 px-4">
          <ScrollArea className="h-full">
            <div className="space-y-3 pb-4">
              <Card className="p-4">
                <h4 className="font-medium mb-3">Siste nedlastinger</h4>
                <div className="space-y-2">
                  {[
                    { name: 'report.pdf', size: '2.3 MB', status: 'completed' },
                    { name: 'data-export.csv', size: '856 KB', status: 'completed' },
                    { name: 'image.png', size: '145 KB', status: 'completed' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2 flex-1">
                        <Download className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.size}</div>
                        </div>
                      </div>
                      <Badge variant="default">Fullført</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="extensions" className="flex-1 px-4">
          <ScrollArea className="h-full">
            <div className="space-y-3 pb-4">
              <Button className="w-full" variant="outline">
                <Puzzle className="h-4 w-4 mr-2" />
                Installer utvidelse
              </Button>
              
              <Card className="p-4">
                <h4 className="font-medium mb-3">Installerte utvidelser</h4>
                <div className="space-y-2">
                  {[
                    { name: 'React DevTools', active: true },
                    { name: 'AdBlock', active: true },
                    { name: 'Grammarly', active: false }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <Puzzle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <Badge variant={item.active ? 'default' : 'outline'}>
                        {item.active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}