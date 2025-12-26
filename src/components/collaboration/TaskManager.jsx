import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, Clock, AlertCircle, User, Calendar, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function TaskManager({ ventureId, ventures }) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
    due_date: '',
    status: 'todo'
  });

  React.useEffect(() => {
    const getUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    getUser();
  }, []);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTask',
        operation: 'filter',
        query: ventureId ? { venture_id: ventureId } : {},
        sort: '-created_date'
      });
      return res.data?.data || [];
    }
  });

  const createTask = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTask',
        operation: 'create',
        data: {
          ...data,
          venture_id: ventureId,
          assigned_by: user?.email
        }
      });
      
      // Log activity
      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ActivityLog',
        operation: 'create',
        data: {
          venture_id: ventureId,
          action_type: 'task_created',
          description: `Nova tarefa criada: ${data.title}`,
          user_email: user?.email,
          user_name: user?.full_name,
          related_entity: 'task',
          related_entity_id: res.data?.id
        }
      });
      
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['activity']);
      setShowForm(false);
      setFormData({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', status: 'todo' });
      toast.success('Tarefa criada');
    }
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTask',
        operation: 'update',
        id,
        data
      });

      if (data.status === 'completed') {
        await base44.functions.invoke('secureEntityQuery', {
          entity_name: 'ActivityLog',
          operation: 'create',
          data: {
            venture_id: ventureId,
            action_type: 'task_completed',
            description: `Tarefa concluída: ${tasks.find(t => t.id === id)?.title}`,
            user_email: user?.email,
            user_name: user?.full_name,
            related_entity: 'task',
            related_entity_id: id
          }
        });
      }

      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['activity']);
      toast.success('Tarefa atualizada');
    }
  });

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'my') return task.assigned_to === user?.email;
    return task.status === filter;
  });

  const statusConfig = {
    todo: { label: 'A Fazer', color: 'text-slate-400', bg: 'bg-slate-400/10', icon: Clock },
    in_progress: { label: 'Em Progresso', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Clock },
    review: { label: 'Revisão', color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: AlertCircle },
    completed: { label: 'Concluída', color: 'text-green-400', bg: 'bg-green-400/10', icon: CheckCircle2 },
    cancelled: { label: 'Cancelada', color: 'text-red-400', bg: 'bg-red-400/10', icon: X }
  };

  const priorityColors = {
    low: 'text-slate-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    urgent: 'text-red-400'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['all', 'my', 'todo', 'in_progress', 'completed'].map(f => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              className={filter === f ? 'bg-[#00D4FF] text-[#06101F]' : 'border-white/10 text-white'}
            >
              {f === 'all' ? 'Todas' : f === 'my' ? 'Minhas' : statusConfig[f]?.label || f}
            </Button>
          ))}
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlowCard glowColor="gold" className="p-6">
              <div className="space-y-4">
                <Input
                  placeholder="Título da tarefa"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Textarea
                  placeholder="Descrição"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
                <div className="grid md:grid-cols-3 gap-4">
                  <Input
                    type="email"
                    placeholder="Email do responsável"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
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
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => createTask.mutate(formData)} disabled={!formData.title || !formData.assigned_to}>
                    Criar Tarefa
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)} className="border-white/10">
                    Cancelar
                  </Button>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const StatusIcon = statusConfig[task.status]?.icon || Clock;
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlowCard glowColor="cyan" className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${statusConfig[task.status]?.bg}`}>
                    <StatusIcon className={`w-5 h-5 ${statusConfig[task.status]?.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-white font-medium">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-slate-400 mt-1">{task.description}</p>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {task.assigned_to}
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <Select
                    value={task.status}
                    onValueChange={(status) => updateTask.mutate({ id: task.id, data: { status, completed_at: status === 'completed' ? new Date().toISOString() : null } })}
                  >
                    <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </GlowCard>
            </motion.div>
          );
        })}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            Nenhuma tarefa encontrada
          </div>
        )}
      </div>
    </div>
  );
}