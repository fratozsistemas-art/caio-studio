import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity, FileText, CheckSquare, TrendingUp, MessageSquare } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ActivityFeedWidget({ ventureId }) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['activity-feed', ventureId],
    queryFn: async () => {
      // Fetch recent activities from multiple sources
      const [documents, tasks, kpis, comments] = await Promise.all([
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'VentureDocument',
          operation: 'filter',
          query: { venture_id: ventureId },
          sort: '-created_date'
        }).then(res => res.data?.data?.slice(0, 5) || []),
        
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'VentureTask',
          operation: 'filter',
          query: { venture_id: ventureId },
          sort: '-created_date'
        }).then(res => res.data?.data?.slice(0, 5) || []),
        
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'VentureKPI',
          operation: 'filter',
          query: { venture_id: ventureId },
          sort: '-created_date'
        }).then(res => res.data?.data?.slice(0, 5) || []),
        
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'VentureComment',
          operation: 'list',
          sort: '-created_date'
        }).then(res => res.data?.data?.slice(0, 5) || [])
      ]);

      // Combine and sort all activities
      const allActivities = [
        ...documents.map(d => ({ ...d, type: 'document', date: d.created_date })),
        ...tasks.map(t => ({ ...t, type: 'task', date: t.created_date })),
        ...kpis.map(k => ({ ...k, type: 'kpi', date: k.created_date })),
        ...comments.map(c => ({ ...c, type: 'comment', date: c.created_date }))
      ];

      return allActivities
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
    },
    enabled: !!ventureId
  });

  const getActivityIcon = (type) => {
    switch (type) {
      case 'document': return <FileText className="w-4 h-4" />;
      case 'task': return <CheckSquare className="w-4 h-4" />;
      case 'kpi': return <TrendingUp className="w-4 h-4" />;
      case 'comment': return <MessageSquare className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityText = (activity) => {
    switch (activity.type) {
      case 'document':
        return `Novo documento: ${activity.title}`;
      case 'task':
        return `Nova tarefa: ${activity.title}`;
      case 'kpi':
        return `KPI atualizado: ${activity.kpi_name}`;
      case 'comment':
        return `${activity.author_name} comentou`;
      default:
        return 'Atividade';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'document': return 'text-[#00D4FF]';
      case 'task': return 'text-orange-400';
      case 'kpi': return 'text-[#C7A763]';
      case 'comment': return 'text-purple-400';
      default: return 'text-slate-400';
    }
  };

  if (isLoading) {
    return (
      <GlowCard className="p-6">
        <div className="text-slate-400">Carregando atividades...</div>
      </GlowCard>
    );
  }

  return (
    <GlowCard className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Atividades Recentes</h3>
      </div>

      <div className="space-y-3">
        {activities?.length > 0 ? (
          activities.map((activity, idx) => (
            <div
              key={`${activity.type}-${activity.id}-${idx}`}
              className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0"
            >
              <div className={`w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">
                  {getActivityText(activity)}
                </p>
                <p className="text-xs text-slate-400">
                  {format(new Date(activity.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Nenhuma atividade recente</p>
          </div>
        )}
      </div>
    </GlowCard>
  );
}