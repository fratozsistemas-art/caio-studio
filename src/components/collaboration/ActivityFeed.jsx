import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, MessageSquare, TrendingUp, DollarSign, Users, Briefcase } from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";
import moment from "moment";

export default function ActivityFeed({ ventureId, limit = 20 }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['activity', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ActivityLog',
        operation: 'filter',
        query: ventureId ? { venture_id: ventureId } : {},
        sort: '-created_date'
      });
      const data = res.data?.data || [];
      return data.slice(0, limit);
    }
  });

  const activityIcons = {
    task_created: Briefcase,
    task_completed: CheckCircle2,
    comment_added: MessageSquare,
    kpi_updated: TrendingUp,
    financial_added: DollarSign,
    venture_updated: Activity,
    talent_added: Users
  };

  const activityColors = {
    task_created: 'text-blue-400',
    task_completed: 'text-green-400',
    comment_added: 'text-purple-400',
    kpi_updated: 'text-yellow-400',
    financial_added: 'text-emerald-400',
    venture_updated: 'text-cyan-400',
    talent_added: 'text-pink-400'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-[#00D4FF]" />
        <h3 className="text-lg font-semibold text-white">Atividades Recentes</h3>
      </div>

      <GlowCard glowColor="cyan" className="p-6">
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = activityIcons[activity.action_type] || Activity;
            const color = activityColors[activity.action_type] || 'text-slate-400';

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 pb-4 border-b border-white/5 last:border-0 last:pb-0"
              >
                <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{activity.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span>{activity.user_name}</span>
                    <span>•</span>
                    <span>{moment(activity.created_date).fromNow()}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {activities.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              Nenhuma atividade registrada ainda
            </div>
          )}
        </div>
      </GlowCard>
    </div>
  );
}