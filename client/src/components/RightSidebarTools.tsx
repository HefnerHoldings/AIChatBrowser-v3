import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot, Mic, Video, Code2, ChevronRight, 
  Settings, Brain, MessageSquare, Wand2, Sparkles
} from 'lucide-react';
import { WorkflowAIChat } from './WorkflowAIChat';
import { ActionRecorder } from './ActionRecorder';
import { VoiceControl } from './VoiceControl';
import { AIAssistant } from './AIAssistant';
import { WorkflowSuggestions } from './WorkflowSuggestions';
import { DevToolsPanel } from './DevToolsPanel';
import { VibecodingPanel } from './VibecodingPanel';

interface RightSidebarToolsProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  currentUrl?: string;
  pageContent?: string;
  activeTab?: any;
  browserInstance?: any;
  onNavigate: (url: string) => void;
  onWorkflowCreated?: (workflow: any) => void;
  onRecordedActionsChange?: (actions: any[]) => void;
  showDevTools?: boolean;
  onShowDevToolsChange?: (show: boolean) => void;
}

export function RightSidebarTools({
  collapsed,
  onCollapsedChange,
  currentUrl,
  pageContent,
  activeTab,
  browserInstance,
  onNavigate,
  onWorkflowCreated,
  onRecordedActionsChange,
  showDevTools = false,
  onShowDevToolsChange
}: RightSidebarToolsProps) {
  const [activeToolTab, setActiveToolTab] = useState<string>('ai-assistant');
  const [suggestionsCount, setSuggestionsCount] = useState(0);

  if (collapsed) return null;

  return (
        <div className="h-full flex flex-col">
          {/* Header with tabs */}
          <div className="border-b bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <div className="flex items-center justify-between p-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                Verktøy
                {suggestionsCount > 0 && (
                  <Badge className="bg-purple-500 text-white text-xs px-1.5 py-0">
                    {suggestionsCount}
                  </Badge>
                )}
              </h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-purple-500/20"
                  onClick={() => onCollapsedChange(true)}
                  title="Minimer panel (Alt+T)"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            
            {/* Tab navigation */}
            <Tabs value={activeToolTab} onValueChange={setActiveToolTab} className="w-full">
              <TabsList className="w-full justify-start rounded-none bg-transparent h-9 p-0 border-t">
                <TabsTrigger 
                  value="vibecoding" 
                  className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1 px-3"
                >
                  <Sparkles className="h-3 w-3" />
                  <span className="text-xs">Vibe</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="ai-assistant" 
                  className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1 px-3"
                >
                  <Bot className="h-3 w-3" />
                  <span className="text-xs">AI</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="workflow-chat" 
                  className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1 px-3"
                >
                  <MessageSquare className="h-3 w-3" />
                  <span className="text-xs">Chat</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="voice" 
                  className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1 px-3"
                >
                  <Mic className="h-3 w-3" />
                  <span className="text-xs">Stemme</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="recorder" 
                  className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1 px-3"
                >
                  <Video className="h-3 w-3" />
                  <span className="text-xs">Opptak</span>
                </TabsTrigger>
                {showDevTools && (
                  <TabsTrigger 
                    value="devtools" 
                    className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1 px-3"
                  >
                    <Code2 className="h-3 w-3" />
                    <span className="text-xs">Dev</span>
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Tab content */}
              <div className="flex-1 overflow-hidden">
                <TabsContent value="vibecoding" className="m-0 h-full">
                  <VibecodingPanel />
                </TabsContent>

                <TabsContent value="ai-assistant" className="m-0 h-full">
                  <div className="h-full flex flex-col">
                    {/* AI Assistant */}
                    <div className="h-[380px] border-b">
                      <ScrollArea className="h-full">
                        <AIAssistant
                          currentUrl={currentUrl}
                          pageContent={pageContent}
                          onNavigate={onNavigate}
                        />
                      </ScrollArea>
                    </div>
                    {/* Workflow Suggestions */}
                    <div className="flex-1 bg-muted/5 overflow-auto p-2">
                      <WorkflowSuggestions
                        currentUrl={currentUrl}
                        pageContent={pageContent}
                        onSuggestionsChange={setSuggestionsCount}
                        onSelectWorkflow={(workflow) => {
                          if (onWorkflowCreated) {
                            onWorkflowCreated(workflow);
                          }
                        }}
                        maxSuggestions={3}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="workflow-chat" className="m-0 h-full">
                  <ScrollArea className="h-full">
                    <div className="p-2">
                      <WorkflowAIChat
                        workflowId={undefined}
                        onWorkflowCreated={onWorkflowCreated}
                      />
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="voice" className="m-0 h-full">
                  <ScrollArea className="h-full">
                    <div className="p-2">
                      <VoiceControl
                        onCommand={(command) => {
                          // Handle voice commands
                          console.log('Voice command:', command);
                        }}
                        onTranscript={(text, isFinal) => {
                          // Handle transcript
                          console.log('Transcript:', text, isFinal);
                        }}
                      />
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="recorder" className="m-0 h-full">
                  <ScrollArea className="h-full">
                    <div className="p-2">
                      <ActionRecorder
                        onWorkflowGenerated={(workflow) => {
                          if (onWorkflowCreated) {
                            onWorkflowCreated(workflow);
                          }
                        }}
                      />
                    </div>
                  </ScrollArea>
                </TabsContent>

                {showDevTools && (
                  <TabsContent value="devtools" className="m-0 h-full">
                    <ScrollArea className="h-full">
                      <DevToolsPanel
                        activeTab={activeTab}
                        onClose={() => onShowDevToolsChange?.(false)}
                      />
                    </ScrollArea>
                  </TabsContent>
                )}
              </div>
            </Tabs>
          </div>
        </div>
  );
}