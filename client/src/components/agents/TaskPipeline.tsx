import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, GripVertical, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Agent, AgentTask } from './AgentDashboard';

interface TaskPipelineProps {
  tasks: AgentTask[];
  agents: Agent[];
  onCreateTask: (task: Partial<AgentTask>) => void;
}

const TaskItem = ({ task, agents }: { task: AgentTask; agents: Agent[] }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'in-progress': return <AlertCircle className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 1: return 'bg-gray-500';
      case 2: return 'bg-blue-500';
      case 3: return 'bg-orange-500';
      case 4: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const assignedAgent = agents.find(a => a.id === task.assignedAgent);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 border rounded-lg bg-card hover:shadow-md transition-shadow"
      data-testid={`task-item-${task.id}`}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium text-sm">{task.type}</span>
              <div className={`w-2 h-2 rounded-full ${getPriorityColor()}`} />
            </div>
            <Badge variant="outline" className="text-xs">
              {task.status}
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {task.description}
          </div>
          
          {assignedAgent && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs capitalize">
                {assignedAgent.type}
              </Badge>
              {task.startedAt && (
                <span className="text-xs text-muted-foreground">
                  Started: {new Date(task.startedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
          
          {task.dependencies && task.dependencies.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Depends on:</span>
              {task.dependencies.map(dep => (
                <Badge key={dep} variant="outline" className="text-xs">
                  {dep}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TaskPipeline = ({ tasks, agents, onCreateTask }: TaskPipelineProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState<Partial<AgentTask>>({
    type: '',
    description: '',
    priority: 2,
    status: 'pending'
  });
  const [taskItems, setTaskItems] = useState(tasks);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setTaskItems((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleCreateTask = () => {
    onCreateTask({
      ...newTask,
      id: `task-${Date.now()}`,
      createdAt: new Date()
    });
    setNewTask({
      type: '',
      description: '',
      priority: 2,
      status: 'pending'
    });
    setShowCreateForm(false);
  };

  // Group tasks by status
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const failedTasks = tasks.filter(t => t.status === 'failed');

  return (
    <div className="h-full flex gap-4">
      {/* Task Creation Form */}
      {showCreateForm && (
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="task-type">Task Type</Label>
              <Select
                value={newTask.type}
                onValueChange={(value) => setNewTask({ ...newTask, type: value })}
              >
                <SelectTrigger id="task-type" data-testid="select-task-type">
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="navigate">Navigate</SelectItem>
                  <SelectItem value="extract">Extract Data</SelectItem>
                  <SelectItem value="fill">Fill Form</SelectItem>
                  <SelectItem value="search">Search</SelectItem>
                  <SelectItem value="analyze">Analyze</SelectItem>
                  <SelectItem value="validate">Validate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Describe the task..."
                data-testid="input-task-description"
              />
            </div>

            <div>
              <Label htmlFor="task-priority">Priority</Label>
              <Select
                value={String(newTask.priority)}
                onValueChange={(value) => setNewTask({ ...newTask, priority: parseInt(value) })}
              >
                <SelectTrigger id="task-priority" data-testid="select-task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Low</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">High</SelectItem>
                  <SelectItem value="4">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCreateTask} 
                className="flex-1"
                data-testid="button-create-task"
              >
                Create Task
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                className="flex-1"
                data-testid="button-cancel-task"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Pipeline */}
      <div className="flex-1 grid grid-cols-4 gap-4">
        {/* Pending Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pending</CardTitle>
              <Badge variant="secondary">{pendingTasks.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={pendingTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {pendingTasks.map(task => (
                      <TaskItem key={task.id} task={task} agents={agents} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* In Progress Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">In Progress</CardTitle>
              <Badge variant="secondary">{inProgressTasks.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-2">
                {inProgressTasks.map(task => (
                  <TaskItem key={task.id} task={task} agents={agents} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Completed</CardTitle>
              <Badge variant="secondary" className="bg-green-500 text-white">
                {completedTasks.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-2">
                {completedTasks.slice(0, 10).map(task => (
                  <TaskItem key={task.id} task={task} agents={agents} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Failed Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Failed</CardTitle>
              <Badge variant="secondary" className="bg-red-500 text-white">
                {failedTasks.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-2">
                {failedTasks.slice(0, 10).map(task => (
                  <TaskItem key={task.id} task={task} agents={agents} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Floating Add Button */}
      {!showCreateForm && (
        <Button
          className="absolute bottom-8 right-8"
          size="lg"
          onClick={() => setShowCreateForm(true)}
          data-testid="button-add-task"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Task
        </Button>
      )}
    </div>
  );
};

export default TaskPipeline;