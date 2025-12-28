import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, DollarSign, Users, Target, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function VenturePortfolioDashboard({ ventures }) {
  // Fetch all related data
  const { data: kpis = [] } = useQuery({
    queryKey: ['all-kpis'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureKPI',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['all-budgets'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureBudget',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['all-expenses'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Expense',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['all-milestones'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ProjectMilestone',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const { data: talents = [] } = useQuery({
    queryKey: ['all-venture-talents'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTalent',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  // Calculate portfolio metrics
  const totalBudget = budgets.reduce((sum, b) => sum + (b.total_budget || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending').length;
  const totalTalents = talents.length;
  const uniqueTalents = new Set(talents.map(t => t.talent_id)).size;

  // Calculate KPI performance
  const kpisWithTargets = kpis.filter(k => k.target_value && k.current_value);
  const avgKPIPerformance = kpisWithTargets.length > 0
    ? kpisWithTargets.reduce((sum, k) => sum + ((k.current_value / k.target_value) * 100), 0) / kpisWithTargets.length
    : 0;

  // Calculate milestone progress
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const milestoneProgress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;

  // Layer distribution
  const layerCounts = ventures.reduce((acc, v) => {
    acc[v.layer] = (acc[v.layer] || 0) + 1;
    return acc;
  }, {});

  // Status distribution
  const statusCounts = ventures.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {});

  const layerColors = {
    startup: { bg: 'from-blue-500/20 to-transparent', border: 'border-blue-500/30', text: 'text-blue-400' },
    scaleup: { bg: 'from-green-500/20 to-transparent', border: 'border-green-500/30', text: 'text-green-400' },
    deeptech: { bg: 'from-purple-500/20 to-transparent', border: 'border-purple-500/30', text: 'text-purple-400' },
    platform: { bg: 'from-[#00D4FF]/20 to-transparent', border: 'border-[#00D4FF]/30', text: 'text-[#00D4FF]' },
    cultural: { bg: 'from-pink-500/20 to-transparent', border: 'border-pink-500/30', text: 'text-pink-400' },
    winwin: { bg: 'from-[#C7A763]/20 to-transparent', border: 'border-[#C7A763]/30', text: 'text-[#C7A763]' }
  };

  const statusConfig = {
    active: { color: 'text-green-400', icon: CheckCircle },
    development: { color: 'text-blue-400', icon: Zap },
    research: { color: 'text-purple-400', icon: Target },
    scaling: { color: 'text-[#C7A763]', icon: TrendingUp }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlowCard glowColor="cyan" className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[#00D4FF]/20">
              <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Total Ventures</div>
              <div className="text-2xl font-bold text-white">{ventures.length}</div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(statusCounts).map(([status, count]) => (
              <Badge key={status} variant="outline" className="text-xs bg-white/5">
                {status}: {count}
              </Badge>
            ))}
          </div>
        </GlowCard>

        <GlowCard glowColor="gold" className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[#C7A763]/20">
              <DollarSign className="w-5 h-5 text-[#C7A763]" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Orçamento Total</div>
              <div className="text-2xl font-bold text-white">
                R$ {(totalBudget / 1000000).toFixed(1)}M
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Gasto</span>
              <span className="text-white font-medium">
                R$ {(totalSpent / 1000000).toFixed(1)}M ({((totalSpent/totalBudget)*100).toFixed(0)}%)
              </span>
            </div>
            <Progress value={(totalSpent/totalBudget)*100} className="h-1.5" />
          </div>
        </GlowCard>

        <GlowCard glowColor="mixed" className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Target className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Performance KPIs</div>
              <div className="text-2xl font-bold text-white">{avgKPIPerformance.toFixed(0)}%</div>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            {kpisWithTargets.length} KPIs ativos
          </div>
        </GlowCard>

        <GlowCard glowColor="cyan" className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Talentos Alocados</div>
              <div className="text-2xl font-bold text-white">{uniqueTalents}</div>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            {totalTalents} alocações totais
          </div>
        </GlowCard>
      </div>

      {/* Milestones & Expenses */}
      <div className="grid md:grid-cols-2 gap-4">
        <GlowCard className="p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Progresso de Milestones
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Completos: {completedMilestones}/{milestones.length}</span>
              <span className="text-white font-medium">{milestoneProgress.toFixed(0)}%</span>
            </div>
            <Progress value={milestoneProgress} className="h-2" />
            <div className="grid grid-cols-2 gap-2 mt-4">
              {Object.entries(
                milestones.reduce((acc, m) => {
                  acc[m.status] = (acc[m.status] || 0) + 1;
                  return acc;
                }, {})
              ).map(([status, count]) => (
                <div key={status} className="bg-white/5 rounded p-2">
                  <div className="text-xs text-slate-400 capitalize">{status}</div>
                  <div className="text-lg font-bold text-white">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            Despesas Pendentes
          </h3>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-yellow-400">{pendingExpenses}</div>
            <div className="text-xs text-slate-400 mb-4">aguardando aprovação</div>
            <div className="space-y-1.5">
              {expenses.filter(e => e.status === 'pending').slice(0, 3).map(expense => (
                <div key={expense.id} className="bg-white/5 rounded p-2 flex justify-between">
                  <span className="text-xs text-slate-300 truncate">{expense.description}</span>
                  <span className="text-xs text-white font-medium">
                    R$ {(expense.amount/1000).toFixed(1)}k
                  </span>
                </div>
              ))}
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Layer Distribution */}
      <GlowCard className="p-5">
        <h3 className="text-white font-semibold mb-4">Distribuição por Camada</h3>
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(layerCounts).map(([layer, count]) => {
            const colors = layerColors[layer] || layerColors.startup;
            return (
              <div
                key={layer}
                className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-lg p-4 text-center`}
              >
                <div className={`text-2xl font-bold ${colors.text}`}>{count}</div>
                <div className="text-xs text-slate-400 capitalize mt-1">{layer}</div>
              </div>
            );
          })}
        </div>
      </GlowCard>

      {/* Ventures Grid with Enhanced Info */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ventures.map(venture => {
          const ventureKPIs = kpis.filter(k => k.venture_id === venture.id);
          const ventureBudgets = budgets.filter(b => b.venture_id === venture.id);
          const ventureMilestones = milestones.filter(m => m.venture_id === venture.id);
          const ventureTalents = talents.filter(t => t.venture_id === venture.id);

          const totalVentureBudget = ventureBudgets.reduce((sum, b) => sum + (b.total_budget || 0), 0);
          const totalVentureSpent = ventureBudgets.reduce((sum, b) => sum + (b.spent || 0), 0);
          const budgetUsage = totalVentureBudget > 0 ? (totalVentureSpent / totalVentureBudget) * 100 : 0;

          const completedVentureMilestones = ventureMilestones.filter(m => m.status === 'completed').length;
          const milestonePercentage = ventureMilestones.length > 0 
            ? (completedVentureMilestones / ventureMilestones.length) * 100 
            : 0;

          const layerColor = layerColors[venture.layer] || layerColors.startup;
          const StatusIcon = statusConfig[venture.status]?.icon || Zap;

          return (
            <Link key={venture.id} to={createPageUrl('VentureDetail') + '?id=' + venture.id}>
              <GlowCard 
                glowColor="mixed"
                className="p-5 hover:scale-[1.02] transition-transform cursor-pointer h-full"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">{venture.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{venture.description}</p>
                  </div>
                  <StatusIcon className={`w-4 h-4 ${statusConfig[venture.status]?.color}`} />
                </div>

                <div className="flex gap-2 mb-4">
                  <Badge className={`text-xs ${layerColor.text} bg-white/5`}>
                    {venture.layer}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-white/5">
                    {venture.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {/* Budget */}
                  {totalVentureBudget > 0 && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Orçamento</span>
                        <span className="text-white">{budgetUsage.toFixed(0)}%</span>
                      </div>
                      <Progress value={budgetUsage} className="h-1" />
                    </div>
                  )}

                  {/* Milestones */}
                  {ventureMilestones.length > 0 && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Milestones</span>
                        <span className="text-white">{completedVentureMilestones}/{ventureMilestones.length}</span>
                      </div>
                      <Progress value={milestonePercentage} className="h-1" />
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex justify-between pt-2 border-t border-white/10">
                    <div className="text-center">
                      <div className="text-xs text-slate-400">KPIs</div>
                      <div className="text-sm font-bold text-white">{ventureKPIs.length}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400">Equipe</div>
                      <div className="text-sm font-bold text-white">{ventureTalents.length}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400">Projetos</div>
                      <div className="text-sm font-bold text-white">{ventureMilestones.length}</div>
                    </div>
                  </div>
                </div>
              </GlowCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}