import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, DollarSign, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import GlowCard from "@/components/ui/GlowCard";
import moment from 'moment';

export default function FinancialProjections({ projections }) {
  const [activeScenario, setActiveScenario] = useState('realistic');

  const scenarios = [
    { id: 'optimistic', label: 'Otimista', color: 'text-green-400', badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { id: 'realistic', label: 'Realista', color: 'text-blue-400', badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { id: 'pessimistic', label: 'Pessimista', color: 'text-orange-400', badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
  ];

  const chartData = projections.monthly_projections[activeScenario].map(month => ({
    month: `Mês ${month.month}`,
    revenue: month.revenue,
    expenses: month.expenses,
    netIncome: month.net_income,
    cashBalance: month.cash_balance
  }));

  const metrics = projections.key_metrics[activeScenario];
  const scenarioData = projections.scenario_analysis[activeScenario];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <GlowCard glowColor="mixed" className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Projeções Financeiras - {projections.venture_name}
            </h3>
            <p className="text-slate-400 text-sm">
              Gerado em {moment(projections.generated_at).format('DD/MM/YYYY HH:mm')}
            </p>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            AI Forecast
          </Badge>
        </div>

        {/* Current Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mt-6">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-slate-400 mb-1">Burn Rate Atual</div>
            <div className="text-lg font-bold text-white">
              ${Math.abs(projections.current_data.burn_rate).toLocaleString()}/mês
            </div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-slate-400 mb-1">Runway Atual</div>
            <div className="text-lg font-bold text-white">
              {projections.current_data.runway_months ? `${projections.current_data.runway_months} meses` : '∞'}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-slate-400 mb-1">Receita Atual</div>
            <div className="text-lg font-bold text-white">
              ${projections.current_data.latest_revenue.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-slate-400 mb-1">Caixa Atual</div>
            <div className="text-lg font-bold text-white">
              ${projections.current_data.cash_balance.toLocaleString()}
            </div>
          </div>
        </div>
      </GlowCard>

      {/* Scenario Selection */}
      <div className="flex gap-3">
        {scenarios.map(scenario => (
          <button
            key={scenario.id}
            onClick={() => setActiveScenario(scenario.id)}
            className={`flex-1 p-4 rounded-xl border transition-all ${
              activeScenario === scenario.id
                ? 'bg-white/10 border-white/30'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <Badge className={scenario.badgeColor}>{scenario.label}</Badge>
            <div className="mt-2 text-xs text-slate-400">
              {scenarioData.revenue_growth_rate > 0 ? '+' : ''}{scenarioData.revenue_growth_rate}% receita | 
              {scenarioData.expense_growth_rate > 0 ? ' +' : ' '}{scenarioData.expense_growth_rate}% despesas
            </div>
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <GlowCard glowColor="gold" className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-[#C7A763]" />
            <span className="text-xs text-slate-400">Receita Total (12m)</span>
          </div>
          <div className="text-2xl font-bold text-white">
            ${metrics.total_revenue.toLocaleString()}
          </div>
        </GlowCard>

        <GlowCard glowColor="mixed" className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-red-400" />
            <span className="text-xs text-slate-400">Despesas Totais (12m)</span>
          </div>
          <div className="text-2xl font-bold text-white">
            ${metrics.total_expenses.toLocaleString()}
          </div>
        </GlowCard>

        <GlowCard glowColor={metrics.net_profit >= 0 ? "gold" : "mixed"} className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className={`w-5 h-5 ${metrics.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-xs text-slate-400">Lucro/Prejuízo Líquido</span>
          </div>
          <div className={`text-2xl font-bold ${metrics.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${Math.abs(metrics.net_profit).toLocaleString()}
          </div>
        </GlowCard>

        <GlowCard glowColor="cyan" className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-[#00D4FF]" />
            <span className="text-xs text-slate-400">Break-even</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics.break_even_month ? `Mês ${metrics.break_even_month}` : 'N/A'}
          </div>
        </GlowCard>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="revenue">Receita & Despesas</TabsTrigger>
          <TabsTrigger value="cash">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="profit">Resultado Líquido</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <GlowCard glowColor="mixed" className="p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Projeção de Receita & Despesas</h4>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a1628',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#00D4FF" fillOpacity={1} fill="url(#colorRevenue)" name="Receita" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" name="Despesas" />
              </AreaChart>
            </ResponsiveContainer>
          </GlowCard>
        </TabsContent>

        <TabsContent value="cash">
          <GlowCard glowColor="cyan" className="p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Projeção de Caixa</h4>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a1628',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Line type="monotone" dataKey="cashBalance" stroke="#00D4FF" strokeWidth={3} dot={{ fill: '#00D4FF', r: 4 }} name="Saldo de Caixa" />
              </LineChart>
            </ResponsiveContainer>
          </GlowCard>
        </TabsContent>

        <TabsContent value="profit">
          <GlowCard glowColor="gold" className="p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Resultado Líquido</h4>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a1628',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Area type="monotone" dataKey="netIncome" stroke="#22c55e" fillOpacity={1} fill="url(#colorProfit)" name="Resultado Líquido" />
              </AreaChart>
            </ResponsiveContainer>
          </GlowCard>
        </TabsContent>
      </Tabs>

      {/* Assumptions */}
      <GlowCard glowColor="mixed" className="p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Premissas do Cenário {scenarios.find(s => s.id === activeScenario).label}</h4>
        <ul className="space-y-2">
          {scenarioData.assumptions.map((assumption, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-300">
              <span className="text-[#C7A763]">•</span>
              <span>{assumption}</span>
            </li>
          ))}
        </ul>
      </GlowCard>

      {/* Recommendations */}
      <GlowCard glowColor="gold" className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-[#C7A763]" />
          <h4 className="text-lg font-semibold text-white">Recomendações Estratégicas</h4>
        </div>
        <ul className="space-y-3">
          {projections.recommendations.map((rec, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
              <span className="text-[#C7A763] mt-1">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </GlowCard>

      {/* Investment Needs */}
      {projections.investment_needs.needs_investment && (
        <GlowCard glowColor="mixed" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h4 className="text-lg font-semibold text-white">Necessidade de Investimento</h4>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <span className="text-slate-300">Valor Recomendado:</span>
              <span className="text-2xl font-bold text-orange-400">
                ${projections.investment_needs.recommended_amount.toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm text-slate-400 mb-1">Timing:</div>
              <div className="text-white">{projections.investment_needs.timing}</div>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm text-slate-400 mb-2">Justificativa:</div>
              <p className="text-white/90 text-sm leading-relaxed">{projections.investment_needs.rationale}</p>
            </div>
          </div>
        </GlowCard>
      )}
    </motion.div>
  );
}