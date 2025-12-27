import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";
import KPIHistoryChart from "./KPIHistoryChart";

export default function VentureMetricsOverview({ venture, financials, kpis }) {
  // Calculate financial metrics
  const sortedFinancials = [...financials].sort((a, b) => 
    new Date(a.record_date) - new Date(b.record_date)
  );

  const totalRevenue = financials.reduce((sum, f) => sum + (f.revenue || 0), 0);
  const totalExpenses = financials.reduce((sum, f) => sum + (f.expenses || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const avgBurnRate = financials.length > 0 ? totalExpenses / financials.length : 0;
  const latestCash = financials[financials.length - 1]?.cash_balance || 0;
  const runway = avgBurnRate > 0 ? latestCash / avgBurnRate : 0;

  // Prepare chart data
  const chartData = sortedFinancials.slice(-6).map(f => ({
    date: new Date(f.record_date).toLocaleDateString('pt-BR', { month: 'short' }),
    receita: f.revenue || 0,
    despesas: f.expenses || 0,
    lucro: (f.revenue || 0) - (f.expenses || 0)
  }));

  // Calculate KPI achievement
  const kpiAchievement = kpis.filter(k => k.current_value >= k.target_value).length / (kpis.length || 1) * 100;

  // Calculate growth rate
  const recentRevenue = sortedFinancials.slice(-3).reduce((sum, f) => sum + (f.revenue || 0), 0);
  const previousRevenue = sortedFinancials.slice(-6, -3).reduce((sum, f) => sum + (f.revenue || 0), 0);
  const growthRate = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Financial Health Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <GlowCard glowColor="gold" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#C7A763]" />
              <h4 className="text-white font-semibold">Saúde Financeira</h4>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Receita Total</span>
              <span className="text-green-400 font-semibold">R$ {totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Despesas Total</span>
              <span className="text-red-400 font-semibold">R$ {totalExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-white/10">
              <span className="text-white font-medium">Lucro Líquido</span>
              <span className={`font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                R$ {netProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="cyan" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
              <h4 className="text-white font-semibold">Crescimento</h4>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {growthRate >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-2xl font-bold ${growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {growthRate.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-slate-400">Taxa de crescimento trimestral</p>
            </div>
            <div className="pt-3 border-t border-white/10">
              <div className="text-sm text-slate-400 mb-1">Atingimento de KPIs</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00D4FF] to-[#0099CC] transition-all"
                    style={{ width: `${kpiAchievement}%` }}
                  />
                </div>
                <span className="text-white font-semibold text-sm">{kpiAchievement.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="mixed" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              <h4 className="text-white font-semibold">Runway</h4>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-3xl font-bold text-white mb-1">
                {runway.toFixed(1)} meses
              </div>
              <p className="text-xs text-slate-400">Com o burn rate atual</p>
            </div>
            <div className="pt-3 border-t border-white/10">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Caixa</span>
                <span className="text-white font-semibold">R$ {latestCash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Burn Rate</span>
                <span className="text-orange-400 font-semibold">R$ {avgBurnRate.toFixed(0)}/mês</span>
              </div>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Financial Trends Chart */}
      <GlowCard glowColor="gold" className="p-6">
        <h4 className="text-lg font-bold text-white mb-4">Tendências Financeiras (6 meses)</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a1628',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px'
              }}
              formatter={(value) => `R$ ${value.toLocaleString()}`}
            />
            <Line type="monotone" dataKey="receita" stroke="#10B981" strokeWidth={2} name="Receita" />
            <Line type="monotone" dataKey="despesas" stroke="#EF4444" strokeWidth={2} name="Despesas" />
            <Line type="monotone" dataKey="lucro" stroke="#C7A763" strokeWidth={2} name="Lucro" />
          </LineChart>
        </ResponsiveContainer>
      </GlowCard>

      {/* KPI History Chart */}
      {kpis.length > 0 && <KPIHistoryChart kpis={kpis} />}

      {/* KPI Performance */}
      {kpis.length > 0 && (
        <GlowCard glowColor="cyan" className="p-6">
          <h4 className="text-lg font-bold text-white mb-4">Performance de KPIs</h4>
          <div className="space-y-3">
            {kpis.slice(0, 5).map((kpi, i) => {
              const progress = kpi.target_value > 0 ? (kpi.current_value / kpi.target_value * 100) : 0;
              const isOnTrack = kpi.current_value >= kpi.target_value;
              
              return (
                <motion.div
                  key={kpi.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-lg bg-white/5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-medium">{kpi.kpi_name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      isOnTrack ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {kpi.current_value} / {kpi.target_value} {kpi.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isOnTrack ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-12 text-right">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlowCard>
      )}
    </div>
  );
}