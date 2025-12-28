import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Award, Trophy, Star, Users, Zap, Target, BookOpen, Sparkles } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const BADGE_CONFIG = {
  first_goal_completed: {
    name: 'Primeira Meta',
    icon: Target,
    color: 'from-blue-500 to-blue-600',
    description: 'Completou sua primeira meta'
  },
  five_goals_completed: {
    name: 'Realizador',
    icon: Trophy,
    color: 'from-yellow-500 to-yellow-600',
    description: '5 metas completadas'
  },
  feedback_champion: {
    name: 'Campeão de Feedback',
    icon: Star,
    color: 'from-purple-500 to-purple-600',
    description: 'Recebeu 10+ feedbacks positivos'
  },
  mentor: {
    name: 'Mentor',
    icon: Users,
    color: 'from-green-500 to-green-600',
    description: 'Mentor ativo da equipe'
  },
  team_player: {
    name: 'Team Player',
    icon: Users,
    color: 'from-pink-500 to-pink-600',
    description: 'Colaboração excepcional'
  },
  innovator: {
    name: 'Inovador',
    icon: Zap,
    color: 'from-orange-500 to-orange-600',
    description: 'Ideias inovadoras'
  },
  fast_learner: {
    name: 'Aprendiz Rápido',
    icon: BookOpen,
    color: 'from-cyan-500 to-cyan-600',
    description: 'Aprendizado acelerado'
  },
  onboarding_complete: {
    name: 'Onboarding',
    icon: Sparkles,
    color: 'from-[#C7A763] to-[#A88B4A]',
    description: 'Onboarding completo'
  },
  expert_developer: {
    name: 'Desenvolvedor Expert',
    icon: Award,
    color: 'from-red-500 to-red-600',
    description: 'Expert em desenvolvimento'
  },
  collaboration_star: {
    name: 'Estrela da Colaboração',
    icon: Star,
    color: 'from-indigo-500 to-indigo-600',
    description: 'Colaborador excepcional'
  }
};

export default function BadgeShowcase({ talentId, compact = false }) {
  const { data: badges = [] } = useQuery({
    queryKey: ['talent-badges', talentId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'TalentBadge',
        operation: 'filter',
        query: { talent_id: talentId },
        sort: '-earned_at'
      });
      return res.data?.data || [];
    },
    enabled: !!talentId
  });

  const totalPoints = badges.reduce((sum, badge) => sum + (badge.points || 0), 0);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-[#C7A763]" />
          <span className="text-white font-semibold">{totalPoints}</span>
          <span className="text-xs text-slate-400">pts</span>
        </div>
        <div className="flex gap-1">
          {badges.slice(0, 3).map((badge, idx) => {
            const config = BADGE_CONFIG[badge.badge_type];
            const Icon = config?.icon || Award;
            return (
              <div
                key={idx}
                className={`w-6 h-6 rounded-full bg-gradient-to-br ${config?.color || 'from-slate-500 to-slate-600'} flex items-center justify-center`}
                title={config?.name}
              >
                <Icon className="w-3 h-3 text-white" />
              </div>
            );
          })}
          {badges.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
              +{badges.length - 3}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <GlowCard glowColor="gold" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#C7A763]" />
            Conquistas
          </h3>
          <p className="text-sm text-slate-400 mt-1">{badges.length} badges • {totalPoints} pontos</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {badges.map((badge, idx) => {
          const config = BADGE_CONFIG[badge.badge_type];
          const Icon = config?.icon || Award;
          
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${config?.color || 'from-slate-500 to-slate-600'} flex items-center justify-center mb-3 mx-auto`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <div className="text-white font-semibold text-sm">{config?.name || badge.badge_type}</div>
                <div className="text-xs text-slate-400 mt-1">{config?.description}</div>
                <Badge className="mt-2 bg-[#C7A763]/20 text-[#C7A763]">
                  +{badge.points} pts
                </Badge>
              </div>
            </motion.div>
          );
        })}
      </div>

      {badges.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma conquista ainda</p>
        </div>
      )}
    </GlowCard>
  );
}