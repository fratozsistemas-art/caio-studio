import React from 'react';
import { motion } from 'framer-motion';
import { Users, Star, Briefcase } from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";

export default function VentureTalentAllocation({ ventureId, talents }) {
  const totalAllocation = talents.reduce((sum, t) => sum + (t.allocation || 0), 0);
  const avgPerformance = talents.length > 0 
    ? talents.reduce((sum, t) => sum + (t.performance_score || 0), 0) / talents.length 
    : 0;

  const talentsByLevel = talents.reduce((acc, t) => {
    acc[t.level] = (acc[t.level] || 0) + 1;
    return acc;
  }, {});

  return (
    <GlowCard glowColor="cyan" className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-5 h-5 text-[#00D4FF]" />
        <h3 className="text-xl font-bold text-white">Alocação de Talentos</h3>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs text-slate-400 mb-1">Total Talentos</div>
          <div className="text-2xl font-bold text-white">{talents.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs text-slate-400 mb-1">Alocação Total</div>
          <div className="text-2xl font-bold text-[#00D4FF]">{totalAllocation}%</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs text-slate-400 mb-1">Performance Média</div>
          <div className="text-2xl font-bold text-[#C7A763]">{avgPerformance.toFixed(0)}</div>
        </div>
      </div>

      {/* Talents by Level */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-white/80 mb-3">Distribuição por Nível</h4>
        <div className="flex gap-2">
          {Object.entries(talentsByLevel).map(([level, count]) => (
            <div key={level} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-slate-400 capitalize">{level}</div>
              <div className="text-lg font-bold text-white">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Talent List */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-white/80 mb-3">Time Alocado</h4>
        {talents.map((talent, i) => (
          <motion.div
            key={talent.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-medium">{talent.talent_name}</span>
                  <Badge variant="outline" className="border-white/20 text-xs capitalize">
                    {talent.level}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-3 h-3 text-slate-400" />
                  <span className="text-sm text-slate-400">{talent.role}</span>
                </div>
                {talent.skills && (
                  <div className="flex flex-wrap gap-1">
                    {talent.skills.slice(0, 4).map((skill, j) => (
                      <span key={j} className="text-xs bg-white/5 px-2 py-1 rounded text-white/60">
                        {skill}
                      </span>
                    ))}
                    {talent.skills.length > 4 && (
                      <span className="text-xs text-slate-500">+{talent.skills.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right space-y-2">
                <div>
                  <div className="text-xs text-slate-400">Alocação</div>
                  <div className="text-lg font-bold text-[#00D4FF]">{talent.allocation}%</div>
                </div>
                {talent.performance_score && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-[#C7A763]" />
                    <span className="text-sm font-semibold text-[#C7A763]">
                      {talent.performance_score}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {talents.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum talento alocado nesta venture</p>
        </div>
      )}
    </GlowCard>
  );
}