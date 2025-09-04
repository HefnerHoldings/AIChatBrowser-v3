import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VibeProfiler } from './VibeProfiler';
import { SandboxRuntime } from './SandboxRuntime';
import { EditorRunner } from './EditorRunner';
import { Marketplace } from './Marketplace';
import { PolicyGuard } from './PolicyGuard';
import { CollaborativeMode } from './CollaborativeMode';
import { QASuite } from './QASuite';
import { 
  Settings,
  Code2,
  Shield,
  Terminal,
  Play,
  Sparkles,
  ShoppingBag,
  Shield as ShieldIcon,
  Users,
  TestTube2
} from 'lucide-react';

export function VibePlatform() {
  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="editor" className="flex-1 flex flex-col">
        <div className="border-b px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <h1 className="text-lg font-bold">Vibecoding Platform v3</h1>
              <span className="text-sm text-muted-foreground">
                Replit-opplevelse med AI-team ledelse
              </span>
            </div>
          </div>
        </div>

        <TabsList className="w-full justify-start rounded-none px-4">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Editor & Runner
          </TabsTrigger>
          <TabsTrigger value="sandbox" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sandbox Runtime
          </TabsTrigger>
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Vibe Profiles
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="policy" className="flex items-center gap-2">
            <ShieldIcon className="h-4 w-4" />
            Policy Guard
          </TabsTrigger>
          <TabsTrigger value="collab" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Collaborative
          </TabsTrigger>
          <TabsTrigger value="qa" className="flex items-center gap-2">
            <TestTube2 className="h-4 w-4" />
            QA Suite
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="flex-1 m-0">
          <EditorRunner />
        </TabsContent>

        <TabsContent value="sandbox" className="flex-1 m-0 overflow-auto">
          <SandboxRuntime />
        </TabsContent>

        <TabsContent value="profiles" className="flex-1 m-0 overflow-auto">
          <VibeProfiler />
        </TabsContent>

        <TabsContent value="marketplace" className="flex-1 m-0 overflow-auto">
          <Marketplace />
        </TabsContent>

        <TabsContent value="policy" className="flex-1 m-0 overflow-auto">
          <PolicyGuard />
        </TabsContent>

        <TabsContent value="collab" className="flex-1 m-0 overflow-auto">
          <CollaborativeMode />
        </TabsContent>

        <TabsContent value="qa" className="flex-1 m-0 overflow-auto">
          <QASuite />
        </TabsContent>
      </Tabs>
    </div>
  );
}