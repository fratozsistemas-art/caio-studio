import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Target, Clock, CheckCircle, AlertCircle, TrendingUp, Plus } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function VentureProjectsView({ ventureId }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const queryClient = useQueryClient();

  const { data: milestones = [] } = useQuery({
    queryKey: ['venture-milestones', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ProjectMilestone',
        operation: 'filter',
        query: { venture_id: ventureId },
        sort: 'due_date'
      });
      return res.data?.data || [];
    },
    enabled: !!ventureId
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['venture-tasks', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTask',
        operation: 'filter',
        query: { venture_id: ventureId },
        sort: 'due_date'
      });
      return res.data?.data || [];
    },
    enabled: !!ventureId
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    status: 'not_started',
    progress: 0
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingMilestone) {
        return await base44.functions.invoke('secureEntityQuery', {
          entity_name: 'ProjectMilestone',
          operation: 'update',
          id: editingMilestone.id,
          data
        });
      }
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ProjectMilestone',
        operation: 'create',
        data: { ...data, venture_id: ventureId }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['venture-milestones', ventureId]);
      setShowDialog(false);
      setEditingMilestone(null);
      setFormData({ title: '', description: '', due_date: '', status: 'not_started', progress: 0 });
      toast.success('Milestone salvo!');
    }
  });

  const handleEdit = (milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      title: milestone.title,
      description: milestone.description || '',
      due_date: milestone.due_date,
      status: milestone.status,
      progress: milestone.progress
    });
    setShowDialog(true);
  };

  const statusConfig = {
    not_started: { color: 'text-slate-400', bg: 'bg-slate-500/20', label: 'Não Iniciado', icon: Clock },
    in_progress: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Em Progresso', icon: TrendingUp },
    completed: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Completo', icon: CheckCircle },
    delayed: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Atrasado', icon: AlertCircle }
  };

  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const overallProgress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;
  
  const upcomingTasks = tasks.filter(t => t.status !== 'completed' && t.due_date).sort((a, b) => 
    new Date(a.due_date) - new Date(b.due_date)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Projetos & Milestones</h3>
          <p className="text-sm text-slate-400">
            {completedMilestones} de {milestones.length} milestones completos
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingMilestone(null);
            setFormData({ title: '', description: '', due_date: '', status: 'not_started', progress: 0 });
            setShowDialog(true);
          }}
          className="bg-[#00D4FF] hover:bg-[#00B8E6]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Milestone
        </Button>
      </div>

      {/* Overall Progress */}
      <GlowCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-semibold">Progresso Geral</h4>
          <span className="text-2xl font-bold text-[#C7A763]">{overallProgress.toFixed(0)}%</span>
        </div>
        <Progress value={overallProgress} className="h-3" />
      </GlowCard>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        {Object.entries(
          milestones.reduce((acc, m) => {
            acc[m.status] = (acc[m.status] || 0) + 1;
            return acc;
          }, {})
        ).map(([status, count]) => {
          const config = statusConfig[status] || statusConfig.not_started;
          const Icon = config.icon;
          return (
            <GlowCard key={status} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.bg}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div>
                  <div className="text-xs text-slate-400">{config.label}</div>
                  <div className="text-2xl font-bold text-white">{count}</div>
                </div>
              </div>
            </GlowCard>
          );
        })}
      </div>

      {/* Milestones Timeline */}
      <GlowCard className="p-5">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-[#C7A763]" />
          Timeline de Milestones
        </h4>
        <div className="space-y-4">
          {milestones.map(milestone => {
            const config = statusConfig[milestone.status] || statusConfig.not_started;
            const Icon = config.icon;
            const daysUntilDue = differenceInDays(new Date(milestone.due_date), new Date());
            const isOverdue = isPast(new Date(milestone.due_date)) && milestone.status !== 'completed';

            return (
              <div 
                key={milestone.id} 
                className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => handleEdit(milestone)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      <h5 className="text-white font-medium">{milestone.title}</h5>
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-slate-400 ml-6">{milestone.description}</p>
                    )}
                  </div>
                  <Badge className={`${config.bg} ${config.color}`}>
                    {config.label}
                  </Badge>
                </div>

                <div className="ml-6 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Progresso</span>
                    <span className="text-white font-medium">{milestone.progress}%</span>
                  </div>
                  <Progress value={milestone.progress} className="h-2" />

                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className={isOverdue ? 'text-red-400' : 'text-slate-400'}>
                      {isOverdue ? '⚠️ Atrasado' : `${daysUntilDue} dias restantes`}
                    </span>
                    <span className="text-slate-400">
                      {format(new Date(milestone.due_date), "dd 'de' MMM", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlowCard>

      {/* Upcoming Tasks */}
      <GlowCard className="p-5">
        <h4 className="text-white font-semibold mb-4">Próximas Tarefas</h4>
        <div className="space-y-2">
          {upcomingTasks.slice(0, 5).map(task => {
            const daysUntilDue = differenceInDays(new Date(task.due_date), new Date());
            const isUrgent = daysUntilDue <= 3 && daysUntilDue >= 0;
            const isOverdue = daysUntilDue < 0;

            return (
              <div key={task.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm text-white mb-1">{task.title}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Badge variant="outline" className="text-xs capitalize">{task.priority}</Badge>
                    <span>•</span>
                    <span>{task.assigned_to}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs ${isOverdue ? 'text-red-400' : isUrgent ? 'text-yellow-400' : 'text-slate-400'}`}>
                    {isOverdue ? '⚠️ Atrasado' : `${daysUntilDue}d`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlowCard>

      {/* Milestone Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#0a1628] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingMilestone ? 'Editar Milestone' : 'Novo Milestone'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-white mb-2 block">Título *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>

            <div>
              <label className="text-sm text-white mb-2 block">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white mb-2 block">Data de Entrega *</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-white mb-2 block">Status</label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Não Iniciado</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="completed">Completo</SelectItem>
                    <SelectItem value="delayed">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm text-white mb-2 block">Progresso (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({...formData, progress: parseInt(e.target.value) || 0})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending}
                className="bg-[#00D4FF] hover:bg-[#00B8E6]"
              >
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}