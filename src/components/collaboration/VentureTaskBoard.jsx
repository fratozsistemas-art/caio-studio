import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Plus, Calendar, User, Flag, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';
import TaskCalendar from './TaskCalendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusColumns = [
  { id: 'todo', label: 'A Fazer', color: 'cyan' },
  { id: 'in_progress', label: 'Em Progresso', color: 'gold' },
  { id: 'review', label: 'Revisão', color: 'mixed' },
  { id: 'completed', label: 'Concluído', color: 'gold' }
];

const priorityColors = {
  low: 'text-blue-400 bg-blue-500/10',
  medium: 'text-yellow-400 bg-yellow-500/10',
  high: 'text-orange-400 bg-orange-500/10',
  urgent: 'text-red-400 bg-red-500/10'
};

export default function VentureTaskBoard({ ventureId, ventureName }) {
  const [showNewTask, setShowNewTask] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('todo');
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to: ''
  });

  React.useEffect(() => {
    const getUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    getUser();
  }, []);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['venture-tasks', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTask',
        operation: 'filter',
        query: { venture_id: ventureId },
        sort: '-created_date'
      });
      return res.data?.data || [];
    },
    enabled: !!ventureId
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTask',
        operation: 'create',
        data: taskData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['venture-tasks', ventureId]);
      setShowNewTask(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        assigned_to: ''
      });
      toast.success('Tarefa criada com sucesso');
    }
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTask',
        operation: 'update',
        id: taskId,
        data: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['venture-tasks', ventureId]);
      toast.success('Status atualizado');
    }
  });

  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    createTaskMutation.mutate({
      venture_id: ventureId,
      title: newTask.title,
      description: newTask.description,
      status: selectedStatus,
      priority: newTask.priority,
      due_date: newTask.due_date || null,
      assigned_to: newTask.assigned_to || user?.email,
      assigned_by: user?.email
    });
  };

  if (isLoading) {
    return (
      <GlowCard className="p-6">
        <div className="text-center text-slate-400">Carregando tarefas...</div>
      </GlowCard>
    );
  }

  const tasksByStatus = statusColumns.reduce((acc, column) => {
    acc[column.id] = tasks?.filter(t => t.status === column.id) || [];
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Quadro de Tarefas</h3>
          <p className="text-sm text-slate-400">{tasks?.length || 0} tarefas no total</p>
        </div>

        <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
          <DialogTrigger asChild>
            <Button className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]">
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0a1628] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Criar Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Status Inicial</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusColumns.map(col => (
                      <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input
                placeholder="Título da tarefa *"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />

              <Textarea
                placeholder="Descrição"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Prioridade</label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask({...newTask, priority: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Data de Entrega</label>
                  <Input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <Input
                placeholder="Atribuir para (email)"
                value={newTask.assigned_to}
                onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowNewTask(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateTask}
                  disabled={createTaskMutation.isPending}
                  className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]"
                >
                  Criar Tarefa
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs for Board and Calendar Views */}
      <Tabs defaultValue="board" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="board">Quadro Kanban</TabsTrigger>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          <div className="grid lg:grid-cols-4 gap-4">
        {statusColumns.map((column) => (
          <div key={column.id}>
            <GlowCard glowColor={column.color} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-white">{column.label}</h4>
                <span className="text-xs text-slate-400">
                  {tasksByStatus[column.id]?.length || 0}
                </span>
              </div>

              <div className="space-y-3">
                {tasksByStatus[column.id]?.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="text-sm font-medium text-white flex-1">{task.title}</h5>
                      {task.status !== 'completed' && (
                        <button
                          onClick={() => updateTaskStatusMutation.mutate({
                            taskId: task.id,
                            status: statusColumns[statusColumns.findIndex(c => c.id === task.status) + 1]?.id || 'completed'
                          })}
                          className="text-green-400 hover:text-green-300"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-400 mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>

                      {task.due_date && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString('pt-BR')}
                        </span>
                      )}

                      {task.assigned_to && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {task.assigned_to.split('@')[0]}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlowCard>
          </div>
        ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <TaskCalendar tasks={tasks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}