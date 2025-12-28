import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function Leaderboard() {
  const { data: badges = [] } = useQuery({
    queryKey: ['all-badges'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'TalentBadge',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const { data: talents = [] } = useQuery({
    queryKey: ['talents'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Talent',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const leaderboard = useMemo(() => {
    const talentPoints = {};
    
    badges.forEach(badge => {
      if (!talentPoints[badge.talent_id]) {
        talentPoints[badge.talent_id] = {
          points: 0,
          badgeCount: 0,
          talent: talents.find(t => t.id === badge.talent_id)
        };
      }
      talentPoints[badge.talent_id].points += badge.points || 0;
      talentPoints[badge.talent_id].badgeCount += 1;
    });

    return Object.entries(talentPoints)
      .map(([talentId, data]) => ({
        talentId,
        ...data
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);
  }, [badges, talents]);

  const getPodiumIcon = (rank) => {
    switch (rank) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 1:
        return <Medal className="w-5 h-5 text-slate-300" />;
      case 2:
        return <Medal className="w-5 h-5 text-orange-400" />;
      default:
        return <span className="text-slate-400 font-bold">#{rank + 1}</span>;
    }
  };

  return (
    <GlowCard glowColor="cyan" className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Leaderboard</h3>
          <p className="text-sm text-slate-400">Top 10 talentos por pontos</p>
        </div>
      </div>

      <div className="space-y-2">
        {leaderboard.map((entry, idx) => (
          <motion.div
            key={entry.talentId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex items-center gap-4 p-4 rounded-lg ${
              idx < 3
                ? 'bg-gradient-to-r from-[#C7A763]/20 to-transparent border border-[#C7A763]/30'
                : 'bg-white/5 border border-white/10'
            } hover:bg-white/10 transition-all`}
          >
            <div className="w-8 flex justify-center">
              {getPodiumIcon(idx)}
            </div>
            
            <div className="flex-1">
              <div className="text-white font-semibold">
                {entry.talent?.full_name || 'Talento'}
              </div>
              <div className="text-xs text-slate-400">
                {entry.talent?.current_position || 'Posição não definida'}
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#C7A763]" />
                <span className="text-white font-bold">{entry.points}</span>
                <span className="text-xs text-slate-400">pts</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {entry.badgeCount} badges
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum dado de ranking ainda</p>
        </div>
      )}
    </GlowCard>
  );
}