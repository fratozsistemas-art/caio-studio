import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, CheckCircle2, Users, Target } from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";

export default function PortfolioMetrics({ data, config }) {
  if (!data) return null;

  const { ventures, kpis, talents, financials } = data;

  // Calculate metrics
  const venturesByLayer = ventures.reduce((acc, v) => {
    acc[v.layer] = (acc[v.layer] || 0) + 1;
    return acc;
  }, {});

  const venturesByStatus = ventures.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {});

  const kpisAboveTarget = kpis.filter(k => k.target_value && k.current_value >= k.target_value).length;
  const kpisBelowTarget = kpis.filter(k => k.target_value && k.current_value < k.target_value).length;

  const totalRevenue = financials.reduce((sum, f) => sum + (f.revenue || 0), 0);
  const totalExpenses = financials.reduce((sum, f) => sum + (f.expenses || 0), 0);

  return (
    <div className="space-y-6">
      {/* Ventures Distribution */}
      <GlowCard glowColor="cyan" className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
          Distribuição por Camada
        </h3>
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(venturesByLayer).map(([layer, count]) => (
            <motion.div
              key={layer}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-lg bg-white/5 border border-white/10 text-center"
            >
              <div className="text-2xl font-bold text-white mb-1">{count}</div>
              <div className="text-xs text-slate-400 capitalize">{layer}</div>
            </motion.div>
          ))}
        </div>
      </GlowCard>

      {/* Status Overview */}
      <GlowCard glowColor="gold" className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Status das Ventures</h3>
        <div className="grid md:grid-cols-4 gap-4">
          {Object.entries(venturesByStatus).map(([status, count]) => (
            <div key={status} className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400 capitalize">{status}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00D4FF] to-[#C7A763]"
                  style={{ width: `${(count / ventures.length) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </GlowCard>

      {/* KPI Performance */}
      {config.showKPIs && (
        <GlowCard glowColor="mixed" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#C7A763]" />
            Performance de KPIs
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20">
              <CheckCircle2 className="w-8 h-8 text-green-400 mb-3" />
              <div className="text-3xl font-bold text-white mb-1">{kpisAboveTarget}</div>
              <div className="text-sm text-slate-400">Acima da Meta</div>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20">
              <AlertTriangle className="w-8 h-8 text-orange-400 mb-3" />
              <div className="text-3xl font-bold text-white mb-1">{kpisBelowTarget}</div>
              <div className="text-sm text-slate-400">Abaixo da Meta</div>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
              <Target className="w-8 h-8 text-blue-400 mb-3" />
              <div className="text-3xl font-bold text-white mb-1">{kpis.length}</div>
              <div className="text-sm text-slate-400">Total de KPIs</div>
            </div>
          </div>
        </GlowCard>
      )}

      {/* Financial Summary */}
      {config.showFinancials && financials.length > 0 && (
        <GlowCard glowColor="gold" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Resumo Financeiro</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm text-slate-400 mb-2">Receita Total</div>
              <div className="text-2xl font-bold text-green-400">${totalRevenue.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm text-slate-400 mb-2">Despesas Totais</div>
              <div className="text-2xl font-bold text-red-400">${totalExpenses.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm text-slate-400 mb-2">Resultado Líquido</div>
              <div className={`text-2xl font-bold ${totalRevenue - totalExpenses >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${Math.abs(totalRevenue - totalExpenses).toLocaleString()}
              </div>
            </div>
          </div>
        </GlowCard>
      )}

      {/* Talent Overview */}
      {config.showTalents && (
        <GlowCard glowColor="mixed" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Talentos no Portfolio
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {talents.slice(0, 6).map((talent, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm text-white font-medium">{talent.talent_name}</div>
                  <div className="text-xs text-slate-400">{talent.role}</div>
                </div>
                {talent.level && (
                  <Badge variant="outline" className="text-xs">{talent.level}</Badge>
                )}
              </motion.div>
            ))}
          </div>
        </GlowCard>
      )}
    </div>
  );
}