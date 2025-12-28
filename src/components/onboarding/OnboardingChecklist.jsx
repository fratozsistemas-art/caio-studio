import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Circle, Calendar, Users, FileText, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlowCard from '@/components/ui/GlowCard';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DEFAULT_CHECKLIST = [
  {
    task: 'Complete seu perfil com foto e informações',
    icon: Users,
    category: 'profile'
  },
  {
    task: 'Defina suas metas para os próximos 3 meses',
    icon: Target,
    category: 'goals'
  },
  {
    task: 'Leia a documentação das ventures ativas',
    icon: FileText,
    category: 'knowledge'
  },
  {
    task: 'Conheça seu mentor ou buddy',
    icon: Users,
    category: 'connections'
  },
  {
    task: 'Participe do primeiro meeting de equipe',
    icon: Calendar,
    category: 'meetings'
  },
  {
    task: 'Configure suas notificações e preferências',
    icon: Sparkles,
    category: 'settings'
  },
  {
    task: 'Envie sua primeira contribuição ou feedback',
    icon: CheckCircle,
    category: 'contribution'
  }
];

export default function OnboardingChecklist({ talentId }) {
  const queryClient = useQueryClient();

  const { data: onboarding } = useQuery({
    queryKey: ['talent-onboarding', talentId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'TalentOnboarding',
        operation: 'filter',
        query: { talent_id: talentId }
      });
      const data = res.data?.data || [];
      return data[0];
    },
    enabled: !!talentId
  });

  const updateMutation = useMutation({
    mutationFn: async ({ checklistIndex, completed }) => {
      const checklist = onboarding?.checklist || DEFAULT_CHECKLIST.map(item => ({
        task: item.task,
        completed: false
      }));
      
      checklist[checklistIndex] = {
        ...checklist[checklistIndex],
        completed,
        completed_at: completed ? new Date().toISOString() : null
      };

      if (onboarding?.id) {
        return await base44.functions.invoke('secureEntityQuery', {
          entity_name: 'TalentOnboarding',
          operation: 'update',
          id: onboarding.id,
          data: { checklist }
        });
      } else {
        return await base44.functions.invoke('secureEntityQuery', {
          entity_name: 'TalentOnboarding',
          operation: 'create',
          data: {
            talent_id: talentId,
            checklist,
            current_step: 0,
            completed_steps: []
          }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['talent-onboarding', talentId]);
      toast.success('Checklist atualizado!');
    }
  });

  const checklist = onboarding?.checklist || DEFAULT_CHECKLIST.map(item => ({
    task: item.task,
    completed: false
  }));

  const completedCount = checklist.filter(item => item.completed).length;
  const progress = (completedCount / checklist.length) * 100;

  return (
    <GlowCard glowColor="gold" className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Checklist de Onboarding</h3>
        <div className="text-sm text-slate-400">
          {completedCount} de {checklist.length}
        </div>
      </div>

      <Progress value={progress} className="h-2 mb-6" />

      <div className="space-y-3">
        {checklist.map((item, idx) => {
          const defaultItem = DEFAULT_CHECKLIST[idx];
          const Icon = defaultItem?.icon || CheckCircle;
          
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                item.completed
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <button
                onClick={() => updateMutation.mutate({ checklistIndex: idx, completed: !item.completed })}
                className="mt-0.5"
              >
                {item.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-500" />
                )}
              </button>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span className={`text-sm ${item.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                    {item.task}
                  </span>
                </div>
                {item.completed && item.completed_at && (
                  <div className="text-xs text-slate-500 mt-1">
                    Concluído em {format(new Date(item.completed_at), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {progress === 100 && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-green-400 font-medium">Parabéns! Você completou o onboarding! 🎉</p>
        </div>
      )}
    </GlowCard>
  );
}