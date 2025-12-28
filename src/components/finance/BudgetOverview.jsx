import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { Progress } from '@/components/ui/progress';

export default function BudgetOverview({ ventureId }) {
  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureBudget',
        operation: 'filter',
        query: ventureId ? { venture_id: ventureId } : {}
      });
      return res.data?.data || [];
    }
  });

  const totalBudget = budgets.reduce((sum, b) => sum + b.total_budget, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const percentageSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <GlowCard glowColor="cyan" className="p-5">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-[#00D4FF]" />
            <div>
              <div className="text-xs text-slate-400">Orçamento Total</div>
              <div className="text-2xl font-bold text-white">
                R$ {totalBudget.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="gold" className="p-5">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-[#C7A763]" />
            <div>
              <div className="text-xs text-slate-400">Gasto</div>
              <div className="text-2xl font-bold text-white">
                R$ {totalSpent.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor={percentageSpent > 90 ? 'mixed' : 'cyan'} className="p-5">
          <div className="flex items-center gap-3">
            {percentageSpent > 90 ? (
              <AlertCircle className="w-5 h-5 text-red-400" />
            ) : (
              <TrendingUp className="w-5 h-5 text-green-400" />
            )}
            <div>
              <div className="text-xs text-slate-400">Disponível</div>
              <div className="text-2xl font-bold text-white">
                R$ {(totalBudget - totalSpent).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </GlowCard>
      </div>

      <GlowCard className="p-6">
        <h3 className="text-white font-semibold mb-4">Orçamento por Categoria</h3>
        <div className="space-y-4">
          {budgets.map((budget) => {
            const percentage = (budget.spent / budget.total_budget) * 100;
            const isOverBudget = percentage > 100;
            
            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white capitalize">{budget.budget_type}</span>
                  <span className={isOverBudget ? 'text-red-400' : 'text-slate-400'}>
                    R$ {budget.spent?.toLocaleString('pt-BR') || 0} / R$ {budget.total_budget.toLocaleString('pt-BR')}
                  </span>
                </div>
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className={`h-2 ${isOverBudget ? 'bg-red-500/20' : ''}`}
                />
                <div className="text-xs text-slate-500">
                  {percentage.toFixed(1)}% utilizado
                </div>
              </div>
            );
          })}
        </div>
      </GlowCard>
    </div>
  );
}