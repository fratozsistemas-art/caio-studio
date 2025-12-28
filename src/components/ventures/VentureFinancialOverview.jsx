import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function VentureFinancialOverview({ ventureId }) {
  const { data: budgets = [] } = useQuery({
    queryKey: ['venture-budgets', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureBudget',
        operation: 'filter',
        query: { venture_id: ventureId }
      });
      return res.data?.data || [];
    },
    enabled: !!ventureId
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['venture-expenses', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Expense',
        operation: 'filter',
        query: { venture_id: ventureId },
        sort: '-expense_date'
      });
      return res.data?.data || [];
    },
    enabled: !!ventureId
  });

  const totalBudget = budgets.reduce((sum, b) => sum + (b.total_budget || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const budgetRemaining = totalBudget - totalSpent;
  const budgetUsage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const pendingExpenses = expenses.filter(e => e.status === 'pending');
  const approvedExpenses = expenses.filter(e => e.status === 'approved');
  const paidExpenses = expenses.filter(e => e.status === 'paid');

  const categoryBreakdown = budgets.map(budget => {
    const categoryExpenses = expenses
      .filter(e => e.category === budget.budget_type && e.status !== 'rejected')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    
    return {
      ...budget,
      actualSpent: categoryExpenses,
      remaining: budget.total_budget - categoryExpenses,
      usage: budget.total_budget > 0 ? (categoryExpenses / budget.total_budget) * 100 : 0
    };
  });

  const categoryColors = {
    operational: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    marketing: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
    technology: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    personnel: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    infrastructure: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlowCard glowColor="gold" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#C7A763]/20">
              <DollarSign className="w-5 h-5 text-[#C7A763]" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Orçamento Total</div>
              <div className="text-xl font-bold text-white">
                R$ {(totalBudget / 1000).toFixed(0)}k
              </div>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="cyan" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Gasto</div>
              <div className="text-xl font-bold text-white">
                R$ {(totalSpent / 1000).toFixed(0)}k
              </div>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="mixed" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Disponível</div>
              <div className="text-xl font-bold text-white">
                R$ {(budgetRemaining / 1000).toFixed(0)}k
              </div>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Pendente Aprovação</div>
              <div className="text-xl font-bold text-white">
                {pendingExpenses.length}
              </div>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Budget Usage */}
      <GlowCard className="p-5">
        <h3 className="text-white font-semibold mb-4">Uso do Orçamento</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Utilizado</span>
            <span className="text-white font-medium">
              R$ {(totalSpent / 1000).toFixed(0)}k / R$ {(totalBudget / 1000).toFixed(0)}k ({budgetUsage.toFixed(1)}%)
            </span>
          </div>
          <Progress 
            value={budgetUsage} 
            className="h-3"
          />
          {budgetUsage > 90 && (
            <div className="flex items-center gap-2 text-xs text-yellow-400 mt-2">
              <AlertCircle className="w-3 h-3" />
              Orçamento quase esgotado
            </div>
          )}
        </div>
      </GlowCard>

      {/* Category Breakdown */}
      <GlowCard className="p-5">
        <h3 className="text-white font-semibold mb-4">Breakdown por Categoria</h3>
        <div className="space-y-4">
          {categoryBreakdown.map(cat => {
            const colors = categoryColors[cat.budget_type] || categoryColors.operational;
            return (
              <div key={cat.id} className={`border ${colors.border} ${colors.bg} rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className={`font-semibold ${colors.text} capitalize`}>
                      {cat.budget_type}
                    </h4>
                    <div className="text-xs text-slate-400 mt-1">
                      Período: {new Date(cat.period_start).toLocaleDateString()} - {new Date(cat.period_end).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={cat.usage > 90 ? 'destructive' : 'outline'} className="text-xs">
                    {cat.usage.toFixed(0)}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Progress value={cat.usage} className="h-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">
                      Gasto: R$ {(cat.actualSpent / 1000).toFixed(1)}k
                    </span>
                    <span className="text-white">
                      Restante: R$ {(cat.remaining / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlowCard>

      {/* Recent Expenses */}
      <GlowCard className="p-5">
        <h3 className="text-white font-semibold mb-4">Despesas Recentes</h3>
        <div className="space-y-2">
          {expenses.slice(0, 5).map(expense => {
            const statusConfig = {
              pending: { color: 'text-yellow-400', icon: AlertCircle, label: 'Pendente' },
              approved: { color: 'text-blue-400', icon: CheckCircle, label: 'Aprovado' },
              paid: { color: 'text-green-400', icon: CheckCircle, label: 'Pago' },
              rejected: { color: 'text-red-400', icon: AlertCircle, label: 'Rejeitado' }
            };
            const config = statusConfig[expense.status] || statusConfig.pending;
            const StatusIcon = config.icon;

            return (
              <div key={expense.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-white">{expense.description}</span>
                    <StatusIcon className={`w-3 h-3 ${config.color}`} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="capitalize">{expense.category}</span>
                    <span>•</span>
                    <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">
                    R$ {(expense.amount / 1000).toFixed(1)}k
                  </div>
                  <div className={`text-xs ${config.color}`}>
                    {config.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlowCard>
    </div>
  );
}