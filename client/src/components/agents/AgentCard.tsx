import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Bot, Brain, Shield, Search, Wrench, Pause, Play, RefreshCw } from 'lucide-react';
import type { Agent } from './AgentDashboard';

interface AgentCardProps {
  agent: Agent;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSelect: () => void;
}

const AgentCard = ({ agent, onPause, onResume, onReset, onSelect }: AgentCardProps) => {
  const getAgentIcon = () => {
    switch (agent.type) {
      case 'planner': return <Brain className="w-6 h-6" />;
      case 'critic': return <Shield className="w-6 h-6" />;
      case 'executor': return <Bot className="w-6 h-6" />;
      case 'researcher': return <Search className="w-6 h-6" />;
      case 'fixer': return <Wrench className="w-6 h-6" />;
      default: return <Bot className="w-6 h-6" />;
    }
  };

  const getStatusColor = () => {
    switch (agent.status) {
      case 'idle': return 'bg-gray-500';
      case 'thinking': return 'bg-yellow-500 animate-pulse';
      case 'working': return 'bg-blue-500 animate-pulse';
      case 'validating': return 'bg-purple-500';
      case 'waiting': return 'bg-orange-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getAgentDescription = () => {
    switch (agent.type) {
      case 'planner': return 'Decomposes complex tasks into subtasks';
      case 'critic': return 'Validates and ensures quality';
      case 'executor': return 'Performs browser actions and automation';
      case 'researcher': return 'Gathers information and analyzes data';
      case 'fixer': return 'Handles errors and recovery';
      default: return 'Unknown agent type';
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onSelect}
      data-testid={`agent-card-${agent.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getAgentIcon()}
            <CardTitle className="text-lg capitalize">{agent.type}</CardTitle>
          </div>
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          {getAgentDescription()}
        </div>
        
        <Badge variant="outline" className="w-full justify-center">
          {agent.status}
        </Badge>

        {agent.currentTask && (
          <div className="p-2 bg-secondary rounded text-xs">
            <div className="font-medium">Current Task:</div>
            <div className="truncate">{agent.currentTask.description}</div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Success Rate</span>
            <span className="font-medium">{agent.metrics.successRate.toFixed(1)}%</span>
          </div>
          <Progress value={agent.metrics.successRate} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-muted-foreground">Completed</div>
            <div className="font-medium text-green-600">{agent.metrics.tasksCompleted}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Failed</div>
            <div className="font-medium text-red-600">{agent.metrics.tasksFailed}</div>
          </div>
        </div>

        <div className="flex gap-1 mt-3">
          {agent.status === 'working' || agent.status === 'thinking' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); onPause(); }}
              className="flex-1"
              data-testid={`button-pause-${agent.id}`}
            >
              <Pause className="w-3 h-3" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); onResume(); }}
              className="flex-1"
              data-testid={`button-resume-${agent.id}`}
            >
              <Play className="w-3 h-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onReset(); }}
            className="flex-1"
            data-testid={`button-reset-${agent.id}`}
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground">Capabilities:</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {agent.capabilities.slice(0, 3).map((cap, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {cap}
              </Badge>
            ))}
            {agent.capabilities.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{agent.capabilities.length - 3}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Confidence</span>
          <span className="font-medium">{agent.confidence}%</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentCard;