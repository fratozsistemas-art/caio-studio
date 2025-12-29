import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import GlowCard from '@/components/ui/GlowCard';
import { CheckCircle2, Circle, Clock, AlertCircle, Plus, Loader2, Calendar, Trash2, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function ClickUpIntegration() {
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [selectedList, setSelectedList] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [user, setUser] = useState(null);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    status: '',
    priority: 3
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to load user', error);
      }
    };
    loadUser();
  }, []);

  // Fetch workspaces/teams
  const { data: workspaces, isLoading: loadingWorkspaces } = useQuery({
    queryKey: ['clickup-workspaces'],
    queryFn: async () => {
      const response = await base44.functions.invoke('clickup', { action: 'getWorkspaces' });
      return response.data.teams || [];
    }
  });

  // Fetch spaces when team is selected
  const { data: spaces } = useQuery({
    queryKey: ['clickup-spaces', selectedTeam],
    queryFn: async () => {
      const response = await base44.functions.invoke('clickup', {
        action: 'getSpaces',
        teamId: selectedTeam
      });
      return response.data.spaces || [];
    },
    enabled: !!selectedTeam
  });

  // Fetch lists when space is selected
  const { data: lists } = useQuery({
    queryKey: ['clickup-lists', selectedSpace],
    queryFn: async () => {
      const response = await base44.functions.invoke('clickup', {
        action: 'getListsInSpace',
        spaceId: selectedSpace
      });
      return response.data.lists || [];
    },
    enabled: !!selectedSpace
  });

  // Fetch tasks when list is selected
  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['clickup-tasks', selectedList],
    queryFn: async () => {
      const response = await base44.functions.invoke('clickup', {
        action: 'getTasks',
        listId: selectedList
      });
      return response.data.tasks || [];
    },
    enabled: !!selectedList,
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const response = await base44.functions.invoke('clickup', {
        action: 'createTask',
        listId: selectedList,
        ...taskData
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clickup-tasks', selectedList] });
      setCreateDialogOpen(false);
      setNewTask({ name: '', description: '', status: '', priority: 3 });
      toast.success('Task created successfully');
      
      // Create notification
      if (user) {
        base44.entities.Notification.create({
          user_email: user.email,
          type: 'task_assigned',
          title: 'Nova tarefa criada',
          message: `Tarefa "${newTask.name}" criada com sucesso no ClickUp`
        });
      }
    },
    onError: (error) => {
      toast.error('Failed to create task: ' + error.message);
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status, name }) => {
      const response = await base44.functions.invoke('clickup', {
        action: 'updateTask',
        taskId,
        status
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clickup-tasks', selectedList] });
      toast.success('Task updated successfully');
      
      // Create notification
      if (user) {
        base44.entities.Notification.create({
          user_email: user.email,
          type: 'task_assigned',
          title: 'Status atualizado',
          message: `Tarefa "${variables.name}" atualizada para "${variables.status}"`
        });
      }
    },
    onError: (error) => {
      toast.error('Failed to update task: ' + error.message);
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      const response = await base44.functions.invoke('clickup', {
        action: 'deleteTask',
        taskId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clickup-tasks', selectedList] });
      toast.success('Task deleted successfully');
      
      // Create notification
      if (user) {
        base44.entities.Notification.create({
          user_email: user.email,
          type: 'task_assigned',
          title: 'Tarefa excluída',
          message: 'Tarefa removida com sucesso do ClickUp'
        });
      }
    },
    onError: (error) => {
      toast.error('Failed to delete task: ' + error.message);
    }
  });

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('complete') || statusLower.includes('done')) {
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    } else if (statusLower.includes('progress')) {
      return <Clock className="w-4 h-4 text-blue-400" />;
    } else if (statusLower.includes('todo') || statusLower.includes('open')) {
      return <Circle className="w-4 h-4 text-slate-400" />;
    }
    return <AlertCircle className="w-4 h-4 text-yellow-400" />;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 2: return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 3: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 4: return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1: return 'Urgent';
      case 2: return 'High';
      case 3: return 'Normal';
      case 4: return 'Low';
      default: return 'None';
    }
  };

  // Filter tasks
  const filteredTasks = tasks?.filter(task => {
    const matchesSearch = searchQuery === '' || 
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      task.status?.status?.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  }) || [];

  if (loadingWorkspaces) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#C7A763]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace/Space/List Selection */}
      <GlowCard glowColor="cyan" className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">ClickUp Workspace</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Team</label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {workspaces?.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Space</label>
            <Select value={selectedSpace} onValueChange={setSelectedSpace} disabled={!selectedTeam}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Select space" />
              </SelectTrigger>
              <SelectContent>
                {spaces?.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">List</label>
            <Select value={selectedList} onValueChange={setSelectedList} disabled={!selectedSpace}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Select list" />
              </SelectTrigger>
              <SelectContent>
                {lists?.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    {list.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlowCard>

      {/* Tasks Section */}
      {selectedList && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Tasks</h3>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]">
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0a1628] border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Task Name</label>
                    <Input
                      value={newTask.name}
                      onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                      placeholder="Enter task name"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Description</label>
                    <Textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Enter task description"
                      className="bg-white/5 border-white/10 text-white"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Priority</label>
                    <Select
                      value={newTask.priority.toString()}
                      onValueChange={(val) => setNewTask({ ...newTask, priority: parseInt(val) })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Urgent</SelectItem>
                        <SelectItem value="2">High</SelectItem>
                        <SelectItem value="3">Normal</SelectItem>
                        <SelectItem value="4">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => createTaskMutation.mutate(newTask)}
                    disabled={!newTask.name || createTaskMutation.isPending}
                    className="w-full bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]"
                  >
                    {createTaskMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Create Task'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filter */}
          <div className="mb-4 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="to do">To Do</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadingTasks ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#C7A763]" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <GlowCard glowColor="gold" className="p-12 text-center">
              <p className="text-slate-400">
                {tasks?.length === 0 ? 'No tasks found. Create your first task!' : 'No tasks match your filters'}
              </p>
            </GlowCard>
          ) : (
            <div className="grid gap-4">
              {filteredTasks.map((task) => (
                <GlowCard key={task.id} glowColor="mixed" className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(task.status?.status)}
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-2">{task.name}</h4>
                        {task.description && (
                          <p className="text-sm text-slate-400 mb-3">{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="bg-white/5 text-white border-white/10">
                            {task.status?.status || 'No Status'}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(task.priority?.priority)}>
                            {getPriorityLabel(task.priority?.priority)}
                          </Badge>
                          {task.due_date && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(parseInt(task.due_date)).toLocaleDateString()}
                            </Badge>
                          )}
                          {task.assignees?.length > 0 && (
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                              {task.assignees.length} assigned
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={task.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#C7A763] hover:text-[#A88B4A] text-sm whitespace-nowrap"
                      >
                        View in ClickUp →
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
                            deleteTaskMutation.mutate(task.id);
                          }
                        }}
                        disabled={deleteTaskMutation.isPending}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </GlowCard>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}