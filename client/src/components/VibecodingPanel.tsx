import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Users, 
  Target, 
  MessageSquare, 
  Trophy,
  Zap,
  Brain,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { MultiAgentOrchestrator, AgentRole } from '@/lib/vibecoding/multiAgentOrchestrator';
import { VibeProfiler } from '@/lib/vibecoding/vibeProfiler';
import { GoalTracker } from '@/lib/vibecoding/goalTracker';
import { InterAgentMessaging } from '@/lib/vibecoding/interAgentMessaging';
import { AnimationShowcase } from '@/components/AnimationShowcase';

export function VibecodingPanel() {
  const [orchestrator] = useState(() => new MultiAgentOrchestrator());
  const [profiler] = useState(() => new VibeProfiler());
  const [goalTracker] = useState(() => new GoalTracker('user-1', 'DevUser'));
  const [messaging] = useState(() => new InterAgentMessaging());
  
  const [activeTab, setActiveTab] = useState('overview');
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [agentStatus, setAgentStatus] = useState<Map<AgentRole, any>>(new Map());
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    // Initialize default profile
    const profile = profiler.createProfile('Default Project', 'startup');
    setActiveProfile(profile);
    profiler.activateProfile(profile.id);

    // Subscribe to goal tracker events
    const unsubscribe = goalTracker.subscribe((event) => {
      if (event.type === 'goal_completed' || event.type === 'achievement_unlocked') {
        updateGoalData();
      }
      if (event.type === 'celebration') {
        showCelebration(event.payload);
      }
    });

    // Load initial data
    updateGoalData();
    updateAgentStatus();
    updateNegotiations();

    return () => { unsubscribe(); };
  }, []);

  const updateGoalData = () => {
    setGoals(goalTracker.getGoals());
    setAchievements(goalTracker.getAchievements());
    setUserProfile(goalTracker.getUserProfile());
  };

  const updateAgentStatus = () => {
    setAgentStatus(orchestrator.getAgentStatus());
    setMessages(orchestrator.getMessageHistory(10));
  };

  const updateNegotiations = () => {
    setNegotiations(messaging.getActiveNegotiations());
  };

  const showCelebration = (celebration: any) => {
    // This would trigger a celebration animation
    console.log('Celebration!', celebration);
  };

  const createNewGoal = () => {
    const goal = goalTracker.createGoal(
      'Implement new feature',
      'Add user authentication system',
      'feature',
      'medium'
    );
    goalTracker.startGoal(goal.id);
    updateGoalData();
  };

  const initiateAgentDiscussion = async () => {
    await orchestrator.sendMessage({
      id: crypto.randomUUID(),
      from: AgentRole.LEADER,
      to: 'broadcast',
      type: 'proposal',
      content: {
        action: 'analyze_project',
        description: 'Analyze current project state and suggest improvements'
      },
      timestamp: new Date(),
      priority: 'high'
    });
    updateAgentStatus();
  };

  const formatAgentRole = (role: AgentRole): string => {
    const roleNames = {
      [AgentRole.LEADER]: 'Leader',
      [AgentRole.PROJECT_MANAGER]: 'Project Manager',
      [AgentRole.ARCHITECT]: 'Architect',
      [AgentRole.ENGINEER]: 'Engineer',
      [AgentRole.DATA_ANALYST]: 'Data Analyst',
      [AgentRole.CRITIC]: 'Critic',
      [AgentRole.RESEARCHER]: 'Researcher',
      [AgentRole.FIXER]: 'Fixer'
    };
    return roleNames[role] || role;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 bg-gradient-to-r from-purple-600/10 to-blue-600/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-semibold">Vibecoding Platform</h2>
            <Badge variant="secondary" className="ml-2">
              v3.00
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {userProfile && (
              <>
                <Badge variant="outline" className="gap-1">
                  <Trophy className="h-3 w-3" />
                  Level {userProfile.level}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Zap className="h-3 w-3" />
                  {userProfile.totalPoints} pts
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-3">
          <TabsTrigger value="overview" className="gap-1">
            <Brain className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="agents" className="gap-1">
            <Users className="h-4 w-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-1">
            <Target className="h-4 w-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-1">
            <Settings className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="animations" className="gap-1">
            <Sparkles className="h-4 w-4" />
            Animate
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="p-4">
            <TabsContent value="overview" className="mt-0 space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Active Goals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {goals.filter(g => g.status === 'active').length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {goals.filter(g => g.status === 'completed').length} completed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Agent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {messages.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      messages today
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Current Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Current Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {messages.slice(0, 5).map((msg, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {formatAgentRole(msg.from)}
                      </Badge>
                      <span className="text-muted-foreground flex-1">
                        {msg.type}: {JSON.stringify(msg.content).slice(0, 50)}...
                      </span>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No recent activity. Start a discussion to see agents in action.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={createNewGoal}>
                    <Target className="h-4 w-4 mr-1" />
                    New Goal
                  </Button>
                  <Button size="sm" variant="outline" onClick={initiateAgentDiscussion}>
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Start Discussion
                  </Button>
                  <Button size="sm" variant="outline">
                    <Play className="h-4 w-4 mr-1" />
                    Run Workflow
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents" className="mt-0 space-y-4">
              {/* Agent Status Grid */}
              <div className="grid grid-cols-1 gap-3">
                {Array.from(agentStatus.entries()).map(([role, capabilities]) => (
                  <Card key={role}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>{formatAgentRole(role)}</span>
                        <Badge variant="outline" className="text-xs">
                          {capabilities.planning > 80 ? 'Active' : 'Ready'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Planning</span>
                          <span>{capabilities.planning}%</span>
                        </div>
                        <Progress value={capabilities.planning} className="h-1" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Execution</span>
                          <span>{capabilities.execution}%</span>
                        </div>
                        <Progress value={capabilities.execution} className="h-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Active Negotiations */}
              {negotiations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Active Negotiations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {negotiations.map(neg => (
                      <div key={neg.id} className="flex items-center justify-between">
                        <span className="text-sm">{neg.topic}</span>
                        <Badge variant={neg.state === 'consensus' ? 'default' : 'secondary'}>
                          {neg.state}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="goals" className="mt-0 space-y-4">
              {/* Active Goals */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Active Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {goals.filter(g => g.status === 'active').map(goal => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{goal.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {goal.difficulty}
                        </Badge>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{goal.progress}% complete</span>
                        <span>{goal.points} pts</span>
                      </div>
                    </div>
                  ))}
                  {goals.filter(g => g.status === 'active').length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No active goals. Create a new goal to get started!
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {achievements.slice(0, 6).map(achievement => (
                      <div 
                        key={achievement.id}
                        className={`text-center p-2 rounded-lg ${
                          achievement.unlocked ? 'bg-primary/10' : 'bg-muted/30'
                        }`}
                      >
                        <div className="text-2xl mb-1">{achievement.icon}</div>
                        <div className="text-xs font-medium">{achievement.name}</div>
                        {achievement.unlocked && (
                          <CheckCircle className="h-3 w-3 mx-auto mt-1 text-green-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="mt-0 space-y-4">
              {/* Active Vibe Profile */}
              {activeProfile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Active Vibe Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium">{activeProfile.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Template: {activeProfile.vibe.mood} • {activeProfile.vibe.pace} pace
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs font-medium">Tech Stack</div>
                      <div className="flex flex-wrap gap-1">
                        {activeProfile.stack.frontend.map((tech: string) => (
                          <Badge key={tech} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-medium">Quality Requirements</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Code Coverage</span>
                          <span>{activeProfile.requirements.codeQuality.coverage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Load Time</span>
                          <span>{activeProfile.requirements.performance.loadTime}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>WCAG Level</span>
                          <span>{activeProfile.requirements.accessibility.wcagLevel}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Profile Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Profile Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Array.from(profiler.getTemplates().entries()).map(([key, template]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        const profile = profiler.createProfile(template.name!, key);
                        setActiveProfile(profile);
                        profiler.activateProfile(profile.id);
                      }}
                    >
                      {template.name}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="animations" className="mt-0">
              <AnimationShowcase />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}