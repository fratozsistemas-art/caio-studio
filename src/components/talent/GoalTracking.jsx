import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Target, Plus, Edit2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GlowCard from '@/components/ui/GlowCard';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function GoalTracking({ talentId, talentName }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const queryClient = useQueryClient();

  const { data: goals = [] } = useQuery({
    queryKey: ['talent-goals', talentId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'TalentGoal',
        operation: 'filter',
        query: { talent_id: talentId }
      });
      return res.data?.data || [];
    },
    enabled: !!talentId
  });

  const saveMutation = useMutation({
    mutationFn: async (goal) => {
      if (goal.id) {
        return await base44.functions.invoke('secureEntityQuery', {
          entity_name: 'TalentGoal',
          operation: 'update',
          id: goal.id,
          data: goal
        });
      }
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'TalentGoal',
        operation: 'create',
        data: { ...goal, talent_id: talentId }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['talent-goals', talentId]);
      setShowDialog(false);
      setEditingGoal(null);
      toast.success('Meta salva!');
    }
  });

  const statusConfig = {
    not_started: { label: 'Não Iniciada', color: 'text-slate-400', bg: 'bg-slate-500/20' },
    in_progress: { label: 'Em Progresso', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    completed: { label: 'Concluída', color: 'text-green-400', bg: 'bg-green-500/20' },
    blocked: { label: 'Bloqueada', color: 'text-red-400', bg: 'bg-red-500/20' }
  };

  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const avgProgress = goals.length > 0
    ? goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Metas e Objetivos</h3>
          <p className="text-sm text-slate-400">{completedGoals} de {goals.length} concluídas</p>
        </div>
        <Button
          onClick={() => {
            setEditingGoal({ title: '', description: '', goal_type: 'skill_development', progress: 0 });
            setShowDialog(true);
          }}
          className="bg-[#C7A763] hover:bg-[#A88B4A]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <GlowCard className="p-5">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#C7A763] mb-1">{avgProgress.toFixed(0)}%</div>
            <Progress value={avgProgress} className="h-2 mb-2" />
            <div className="text-xs text-slate-400">Progresso Médio</div>
          </div>
        </GlowCard>

        <GlowCard className="p-5">
          <div className="space-y-2">
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = goals.filter(g => g.status === status).length;
              return (
                <div key={status} className="flex items-center justify-between">
                  <span className={`text-sm ${config.color}`}>{config.label}</span>
                  <span className="text-sm font-semibold text-white">{count}</span>
                </div>
              );
            })}
          </div>
        </GlowCard>
      </div>

      <div className="space-y-3">
        {goals.map(goal => {
          const config = statusConfig[goal.status];
          return (
            <GlowCard key={goal.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-white font-semibold">{goal.title}</h4>
                  <p className="text-sm text-slate-400 mt-1">{goal.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-slate-500 capitalize">{goal.goal_type}</span>
                    {goal.target_date && (
                      <span className="text-xs text-slate-500">
                        Meta: {format(new Date(goal.target_date), 'dd/MM/yyyy')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingGoal(goal);
                    setShowDialog(true);
                  }}
                  className="p-2 hover:bg-white/10 rounded text-slate-400"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Progresso</span>
                  <span className="text-white font-semibold">{goal.progress || 0}%</span>
                </div>
                <Progress value={goal.progress || 0} className="h-2" />
              </div>

              {goal.milestones && goal.milestones.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-xs text-slate-400 mb-2">Marcos:</div>
                  <div className="space-y-1">
                    {goal.milestones.map((milestone, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {milestone.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-slate-500" />
                        )}
                        <span className={`text-sm ${milestone.completed ? 'text-slate-400 line-through' : 'text-slate-300'}`}>
                          {milestone.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlowCard>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#0a1628] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingGoal?.id ? 'Editar' : 'Nova'} Meta
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Input
              placeholder="Título da meta *"
              value={editingGoal?.title || ''}
              onChange={(e) => setEditingGoal({...editingGoal, title: e.target.value})}
              className="bg-white/5 border-white/10 text-white"
            />

            <Textarea
              placeholder="Descrição"
              value={editingGoal?.description || ''}
              onChange={(e) => setEditingGoal({...editingGoal, description: e.target.value})}
              className="bg-white/5 border-white/10 text-white"
            />

            <Select
              value={editingGoal?.goal_type}
              onValueChange={(v) => setEditingGoal({...editingGoal, goal_type: v})}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skill_development">Desenvolvimento de Habilidade</SelectItem>
                <SelectItem value="project">Projeto</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="career">Carreira</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={editingGoal?.target_date || ''}
              onChange={(e) => setEditingGoal({...editingGoal, target_date: e.target.value})}
              className="bg-white/5 border-white/10 text-white"
            />

            <Select
              value={editingGoal?.status}
              onValueChange={(v) => setEditingGoal({...editingGoal, status: v})}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Não Iniciada</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="blocked">Bloqueada</SelectItem>
              </SelectContent>
            </Select>

            <div>
              <label className="text-sm text-white mb-2 block">Progresso: {editingGoal?.progress || 0}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={editingGoal?.progress || 0}
                onChange={(e) => setEditingGoal({...editingGoal, progress: parseInt(e.target.value)})}
                className="w-full"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => saveMutation.mutate(editingGoal)}
                className="bg-[#C7A763] hover:bg-[#A88B4A]"
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}