import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Brain, Zap, Shield, Users, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Agent } from './AgentDashboard';

interface AgentConfigProps {
  agents: Agent[];
  selectedAgent: string | null;
  onUpdate: () => void;
}

interface AgentSettings {
  agentId: string;
  personality: {
    aggressiveness: number;  // 0-100: How aggressive in pursuing goals
    cautiousness: number;    // 0-100: How careful in decision making
    creativity: number;       // 0-100: How creative in problem solving
    collaboration: number;    // 0-100: How collaborative with other agents
  };
  performance: {
    maxConcurrentTasks: number;
    taskTimeout: number;      // in seconds
    retryAttempts: number;
    retryDelay: number;       // in milliseconds
  };
  learning: {
    enabled: boolean;
    learningRate: number;     // 0-1: How quickly to adapt
    memorySize: number;       // Number of past experiences to remember
    shareKnowledge: boolean;  // Share learned patterns with other agents
  };
  specialization: {
    preferredTasks: string[];
    avoidTasks: string[];
    expertiseAreas: string[];
  };
  consensus: {
    voteWeight: number;       // 1-5: Weight of vote in consensus
    vetoEnabled: boolean;     // Can veto critical decisions
    autoApprove: string[];    // Task types to auto-approve
  };
}

const defaultSettings: Omit<AgentSettings, 'agentId'> = {
  personality: {
    aggressiveness: 50,
    cautiousness: 50,
    creativity: 50,
    collaboration: 70
  },
  performance: {
    maxConcurrentTasks: 3,
    taskTimeout: 300,
    retryAttempts: 3,
    retryDelay: 1000
  },
  learning: {
    enabled: true,
    learningRate: 0.5,
    memorySize: 100,
    shareKnowledge: true
  },
  specialization: {
    preferredTasks: [],
    avoidTasks: [],
    expertiseAreas: []
  },
  consensus: {
    voteWeight: 1,
    vetoEnabled: false,
    autoApprove: []
  }
};

const AgentConfig = ({ agents, selectedAgent, onUpdate }: AgentConfigProps) => {
  const [settings, setSettings] = useState<{ [key: string]: AgentSettings }>({});
  const [globalSettings, setGlobalSettings] = useState({
    enableAllAgents: true,
    globalLearning: true,
    consensusThreshold: 3,
    taskQueueLimit: 100,
    debugMode: false
  });
  const { toast } = useToast();

  // Get or create settings for an agent
  const getAgentSettings = (agentId: string): AgentSettings => {
    if (!settings[agentId]) {
      return { agentId, ...defaultSettings };
    }
    return settings[agentId];
  };

  // Update agent settings
  const updateAgentSettings = (agentId: string, updates: Partial<AgentSettings>) => {
    setSettings(prev => ({
      ...prev,
      [agentId]: { ...getAgentSettings(agentId), ...updates }
    }));
  };

  // Save settings to backend
  const saveSettings = async () => {
    try {
      const response = await fetch('/api/agents/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentSettings: settings, globalSettings })
      });
      
      if (response.ok) {
        toast({
          title: "Settings Saved",
          description: "Agent configurations have been updated successfully",
        });
        onUpdate();
      }
    } catch (error) {
      toast({
        title: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  // Reset settings to defaults
  const resetSettings = () => {
    setSettings({});
    toast({
      title: "Settings Reset",
      description: "All agent configurations have been reset to defaults",
    });
  };

  const currentAgent = selectedAgent ? agents.find(a => a.id === selectedAgent) : null;

  return (
    <div className="h-full">
      <Tabs defaultValue="agent" className="h-full">
        <TabsList>
          <TabsTrigger value="agent" data-testid="tab-agent-config">
            <Brain className="w-4 h-4 mr-2" />
            Agent Configuration
          </TabsTrigger>
          <TabsTrigger value="global" data-testid="tab-global-config">
            <Settings className="w-4 h-4 mr-2" />
            Global Settings
          </TabsTrigger>
          <TabsTrigger value="presets" data-testid="tab-presets">
            <Zap className="w-4 h-4 mr-2" />
            Presets
          </TabsTrigger>
        </TabsList>

        {/* Agent Configuration Tab */}
        <TabsContent value="agent" className="h-[calc(100%-3rem)]">
          <div className="flex gap-4 h-full">
            {/* Agent Selector */}
            <Card className="w-64">
              <CardHeader>
                <CardTitle className="text-base">Select Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-20rem)]">
                  <div className="space-y-2">
                    {agents.map(agent => (
                      <Card
                        key={agent.id}
                        className={`cursor-pointer p-3 ${
                          selectedAgent === agent.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => onUpdate()}
                        data-testid={`agent-select-${agent.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium capitalize">{agent.type}</div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {agent.status}
                            </Badge>
                          </div>
                          <div className="text-right text-xs">
                            <div>{agent.metrics.successRate.toFixed(0)}%</div>
                            <div className="text-muted-foreground">success</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Configuration Panel */}
            {currentAgent ? (
              <div className="flex-1">
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    {/* Personality Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Personality</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Aggressiveness</Label>
                            <span className="text-sm">
                              {getAgentSettings(currentAgent.id).personality.aggressiveness}%
                            </span>
                          </div>
                          <Slider
                            value={[getAgentSettings(currentAgent.id).personality.aggressiveness]}
                            onValueChange={([value]) => 
                              updateAgentSettings(currentAgent.id, {
                                personality: { ...getAgentSettings(currentAgent.id).personality, aggressiveness: value }
                              })
                            }
                            max={100}
                            step={1}
                            data-testid="slider-aggressiveness"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Cautiousness</Label>
                            <span className="text-sm">
                              {getAgentSettings(currentAgent.id).personality.cautiousness}%
                            </span>
                          </div>
                          <Slider
                            value={[getAgentSettings(currentAgent.id).personality.cautiousness]}
                            onValueChange={([value]) => 
                              updateAgentSettings(currentAgent.id, {
                                personality: { ...getAgentSettings(currentAgent.id).personality, cautiousness: value }
                              })
                            }
                            max={100}
                            step={1}
                            data-testid="slider-cautiousness"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Creativity</Label>
                            <span className="text-sm">
                              {getAgentSettings(currentAgent.id).personality.creativity}%
                            </span>
                          </div>
                          <Slider
                            value={[getAgentSettings(currentAgent.id).personality.creativity]}
                            onValueChange={([value]) => 
                              updateAgentSettings(currentAgent.id, {
                                personality: { ...getAgentSettings(currentAgent.id).personality, creativity: value }
                              })
                            }
                            max={100}
                            step={1}
                            data-testid="slider-creativity"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Collaboration</Label>
                            <span className="text-sm">
                              {getAgentSettings(currentAgent.id).personality.collaboration}%
                            </span>
                          </div>
                          <Slider
                            value={[getAgentSettings(currentAgent.id).personality.collaboration]}
                            onValueChange={([value]) => 
                              updateAgentSettings(currentAgent.id, {
                                personality: { ...getAgentSettings(currentAgent.id).personality, collaboration: value }
                              })
                            }
                            max={100}
                            step={1}
                            data-testid="slider-collaboration"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Performance Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="max-tasks">Max Concurrent Tasks</Label>
                          <Input
                            id="max-tasks"
                            type="number"
                            value={getAgentSettings(currentAgent.id).performance.maxConcurrentTasks}
                            onChange={(e) => 
                              updateAgentSettings(currentAgent.id, {
                                performance: { 
                                  ...getAgentSettings(currentAgent.id).performance, 
                                  maxConcurrentTasks: parseInt(e.target.value) 
                                }
                              })
                            }
                            className="mt-1"
                            data-testid="input-max-tasks"
                          />
                        </div>

                        <div>
                          <Label htmlFor="task-timeout">Task Timeout (seconds)</Label>
                          <Input
                            id="task-timeout"
                            type="number"
                            value={getAgentSettings(currentAgent.id).performance.taskTimeout}
                            onChange={(e) => 
                              updateAgentSettings(currentAgent.id, {
                                performance: { 
                                  ...getAgentSettings(currentAgent.id).performance, 
                                  taskTimeout: parseInt(e.target.value) 
                                }
                              })
                            }
                            className="mt-1"
                            data-testid="input-task-timeout"
                          />
                        </div>

                        <div>
                          <Label htmlFor="retry-attempts">Retry Attempts</Label>
                          <Input
                            id="retry-attempts"
                            type="number"
                            value={getAgentSettings(currentAgent.id).performance.retryAttempts}
                            onChange={(e) => 
                              updateAgentSettings(currentAgent.id, {
                                performance: { 
                                  ...getAgentSettings(currentAgent.id).performance, 
                                  retryAttempts: parseInt(e.target.value) 
                                }
                              })
                            }
                            className="mt-1"
                            data-testid="input-retry-attempts"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Learning Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Learning</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="learning-enabled">Enable Learning</Label>
                          <Switch
                            id="learning-enabled"
                            checked={getAgentSettings(currentAgent.id).learning.enabled}
                            onCheckedChange={(checked) => 
                              updateAgentSettings(currentAgent.id, {
                                learning: { ...getAgentSettings(currentAgent.id).learning, enabled: checked }
                              })
                            }
                            data-testid="switch-learning"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Learning Rate</Label>
                            <span className="text-sm">
                              {(getAgentSettings(currentAgent.id).learning.learningRate * 100).toFixed(0)}%
                            </span>
                          </div>
                          <Slider
                            value={[getAgentSettings(currentAgent.id).learning.learningRate * 100]}
                            onValueChange={([value]) => 
                              updateAgentSettings(currentAgent.id, {
                                learning: { ...getAgentSettings(currentAgent.id).learning, learningRate: value / 100 }
                              })
                            }
                            max={100}
                            step={1}
                            disabled={!getAgentSettings(currentAgent.id).learning.enabled}
                            data-testid="slider-learning-rate"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="share-knowledge">Share Knowledge</Label>
                          <Switch
                            id="share-knowledge"
                            checked={getAgentSettings(currentAgent.id).learning.shareKnowledge}
                            onCheckedChange={(checked) => 
                              updateAgentSettings(currentAgent.id, {
                                learning: { ...getAgentSettings(currentAgent.id).learning, shareKnowledge: checked }
                              })
                            }
                            data-testid="switch-share-knowledge"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Consensus Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Consensus</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="vote-weight">Vote Weight</Label>
                          <Select
                            value={String(getAgentSettings(currentAgent.id).consensus.voteWeight)}
                            onValueChange={(value) => 
                              updateAgentSettings(currentAgent.id, {
                                consensus: { 
                                  ...getAgentSettings(currentAgent.id).consensus, 
                                  voteWeight: parseInt(value) 
                                }
                              })
                            }
                          >
                            <SelectTrigger id="vote-weight" data-testid="select-vote-weight">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1x (Standard)</SelectItem>
                              <SelectItem value="2">2x (Important)</SelectItem>
                              <SelectItem value="3">3x (Critical)</SelectItem>
                              <SelectItem value="4">4x (Expert)</SelectItem>
                              <SelectItem value="5">5x (Authority)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="veto-enabled">Veto Power</Label>
                          <Switch
                            id="veto-enabled"
                            checked={getAgentSettings(currentAgent.id).consensus.vetoEnabled}
                            onCheckedChange={(checked) => 
                              updateAgentSettings(currentAgent.id, {
                                consensus: { ...getAgentSettings(currentAgent.id).consensus, vetoEnabled: checked }
                              })
                            }
                            data-testid="switch-veto"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <Card className="flex-1">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <Settings className="w-12 h-12 mx-auto mb-4" />
                    <p>Select an agent to configure its settings</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={resetSettings} data-testid="button-reset-settings">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button onClick={saveSettings} data-testid="button-save-settings">
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </TabsContent>

        {/* Global Settings Tab */}
        <TabsContent value="global" className="p-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Agent Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-all">Enable All Agents</Label>
                <Switch
                  id="enable-all"
                  checked={globalSettings.enableAllAgents}
                  onCheckedChange={(checked) => 
                    setGlobalSettings(prev => ({ ...prev, enableAllAgents: checked }))
                  }
                  data-testid="switch-enable-all"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="global-learning">Global Learning</Label>
                <Switch
                  id="global-learning"
                  checked={globalSettings.globalLearning}
                  onCheckedChange={(checked) => 
                    setGlobalSettings(prev => ({ ...prev, globalLearning: checked }))
                  }
                  data-testid="switch-global-learning"
                />
              </div>

              <div>
                <Label htmlFor="consensus-threshold">Consensus Threshold</Label>
                <Input
                  id="consensus-threshold"
                  type="number"
                  value={globalSettings.consensusThreshold}
                  onChange={(e) => 
                    setGlobalSettings(prev => ({ ...prev, consensusThreshold: parseInt(e.target.value) }))
                  }
                  className="mt-1"
                  data-testid="input-consensus-threshold"
                />
              </div>

              <div>
                <Label htmlFor="queue-limit">Task Queue Limit</Label>
                <Input
                  id="queue-limit"
                  type="number"
                  value={globalSettings.taskQueueLimit}
                  onChange={(e) => 
                    setGlobalSettings(prev => ({ ...prev, taskQueueLimit: parseInt(e.target.value) }))
                  }
                  className="mt-1"
                  data-testid="input-queue-limit"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="debug-mode">Debug Mode</Label>
                <Switch
                  id="debug-mode"
                  checked={globalSettings.debugMode}
                  onCheckedChange={(checked) => 
                    setGlobalSettings(prev => ({ ...prev, debugMode: checked }))
                  }
                  data-testid="switch-debug"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Presets Tab */}
        <TabsContent value="presets" className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:shadow-lg" data-testid="preset-speed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Speed Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Optimize agents for maximum speed and throughput
                </p>
                <ul className="text-xs space-y-1">
                  <li>• High aggressiveness</li>
                  <li>• Reduced cautiousness</li>
                  <li>• Increased concurrent tasks</li>
                  <li>• Minimal retry delays</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg" data-testid="preset-accuracy">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Accuracy Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Prioritize accuracy and reliability over speed
                </p>
                <ul className="text-xs space-y-1">
                  <li>• High cautiousness</li>
                  <li>• Thorough validation</li>
                  <li>• More retry attempts</li>
                  <li>• Consensus required</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg" data-testid="preset-collaboration">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Collaboration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Enhance inter-agent collaboration and knowledge sharing
                </p>
                <ul className="text-xs space-y-1">
                  <li>• High collaboration scores</li>
                  <li>• Knowledge sharing enabled</li>
                  <li>• Balanced vote weights</li>
                  <li>• Group consensus priority</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg" data-testid="preset-learning">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Learning Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Maximize learning and adaptation capabilities
                </p>
                <ul className="text-xs space-y-1">
                  <li>• Maximum learning rate</li>
                  <li>• Large memory size</li>
                  <li>• Knowledge sharing on</li>
                  <li>• High creativity scores</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentConfig;