import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { Progress } from '@/components/ui/progress';
import { format, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ProjectTimeline({ ventureId }) {
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ProjectMilestone',
        operation: 'filter',
        query: ventureId ? { venture_id: ventureId } : {},
        sort: 'due_date'
      });
      return res.data?.data || [];
    }
  });

  const getStatusIcon = (milestone) => {
    if (milestone.status === 'completed') return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (milestone.status === 'delayed') return <AlertCircle className="w-5 h-5 text-red-400" />;
    if (isPast(new Date(milestone.due_date)) && milestone.status !== 'completed') {
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    }
    return <Clock className="w-5 h-5 text-blue-400" />;
  };

  const getStatusColor = (milestone) => {
    if (milestone.status === 'completed') return 'border-green-500/30 bg-green-500/5';
    if (milestone.status === 'delayed') return 'border-red-500/30 bg-red-500/5';
    if (isPast(new Date(milestone.due_date)) && milestone.status !== 'completed') {
      return 'border-red-500/30 bg-red-500/5';
    }
    return 'border-blue-500/30 bg-blue-500/5';
  };

  return (
    <GlowCard className="p-6">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-[#C7A763]" />
        Timeline do Projeto
      </h3>

      <div className="space-y-4 relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-white/10" />

        {milestones.map((milestone, idx) => {
          const daysUntil = differenceInDays(new Date(milestone.due_date), new Date());
          
          return (
            <div key={milestone.id} className="relative pl-16">
              <div className="absolute left-0 top-2">
                <div className={`w-12 h-12 rounded-full border-2 ${getStatusColor(milestone)} flex items-center justify-center z-10`}>
                  {getStatusIcon(milestone)}
                </div>
              </div>

              <div className={`border rounded-lg p-4 ${getStatusColor(milestone)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{milestone.title}</h4>
                    {milestone.description && (
                      <p className="text-sm text-slate-400 mt-1">{milestone.description}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm text-slate-400">
                      {format(new Date(milestone.due_date), "dd MMM yyyy", { locale: ptBR })}
                    </div>
                    {milestone.status !== 'completed' && (
                      <div className={`text-xs mt-1 ${daysUntil < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                        {daysUntil < 0 ? `${Math.abs(daysUntil)} dias atrasado` : `${daysUntil} dias restantes`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Progresso</span>
                    <span>{milestone.progress}%</span>
                  </div>
                  <Progress value={milestone.progress} className="h-2" />
                </div>
              </div>
            </div>
          );
        })}

        {milestones.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum milestone cadastrado</p>
          </div>
        )}
      </div>
    </GlowCard>
  );
}