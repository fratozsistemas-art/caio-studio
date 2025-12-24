import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Brain, Loader2, DollarSign, TrendingUp, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import FinancialForm from "./FinancialForm";
import FinancialProjections from "./FinancialProjections";
import { toast } from "sonner";

export default function FinancialModeling({ ventures }) {
  const [selectedVenture, setSelectedVenture] = useState(ventures[0]?.id || null);
  const [showFinancialForm, setShowFinancialForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [projections, setProjections] = useState(null);

  const { data: financialData, refetch } = useQuery({
    queryKey: ['financialData', selectedVenture],
    queryFn: async () => {
      if (!selectedVenture) return null;

      const [financialsResponse, kpisResponse] = await Promise.all([
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'FinancialRecord',
          operation: 'filter',
          query: { venture_id: selectedVenture },
          sort: '-record_date'
        }),
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'VentureKPI',
          operation: 'filter',
          query: { venture_id: selectedVenture }
        })
      ]);

      return {
        financials: financialsResponse.data?.data || [],
        kpis: kpisResponse.data?.data || []
      };
    },
    enabled: !!selectedVenture
  });

  const venture = ventures.find(v => v.id === selectedVenture);

  const generateProjections = async () => {
    if (!venture || !financialData?.financials?.length) {
      toast.error('Adicione dados financeiros primeiro');
      return;
    }

    setGenerating(true);
    setProjections(null);

    try {
      const latestFinancial = financialData.financials[0];
      const monthlyBurnRate = latestFinancial.expenses - latestFinancial.revenue;
      const runwayMonths = monthlyBurnRate > 0 ? Math.floor(latestFinancial.cash_balance / monthlyBurnRate) : null;

      const context = {
        venture: {
          name: venture.name,
          layer: venture.layer,
          category: venture.category,
          status: venture.status
        },
        current_financials: {
          latest_revenue: latestFinancial.revenue,
          latest_expenses: latestFinancial.expenses,
          cash_balance: latestFinancial.cash_balance,
          burn_rate: monthlyBurnRate,
          runway_months: runwayMonths
        },
        historical_data: financialData.financials.slice(0, 6).map(f => ({
          date: f.record_date,
          revenue: f.revenue,
          expenses: f.expenses
        })),
        kpis: financialData.kpis.map(k => ({
          name: k.kpi_name,
          current: k.current_value,
          target: k.target_value
        }))
      };

      const prompt = `Você é um especialista em modelagem financeira para ventures e startups. Analise os dados financeiros abaixo e crie projeções detalhadas para os próximos 12 meses.

DADOS ATUAIS:
${JSON.stringify(context, null, 2)}

Forneça projeções financeiras no formato JSON especificado com:

1. SCENARIO_ANALYSIS: 3 cenários (optimistic, realistic, pessimistic) cada um com:
   - revenue_growth_rate: taxa de crescimento mensal de receita (%)
   - expense_growth_rate: taxa de crescimento mensal de despesas (%)
   - assumptions: lista de premissas chave para este cenário

2. MONTHLY_PROJECTIONS: Para cada um dos próximos 12 meses, forneça (para cada cenário):
   - month: número do mês (1-12)
   - revenue: receita projetada
   - expenses: despesas projetadas
   - net_income: resultado líquido
   - cash_balance: saldo de caixa projetado

3. KEY_METRICS: Métricas calculadas para os 12 meses:
   - total_revenue: receita total projetada
   - total_expenses: despesas totais
   - net_profit: lucro/prejuízo líquido
   - roi_percentage: ROI projetado (%)
   - break_even_month: mês estimado de break-even (se aplicável)
   - runway_months: meses de runway com o saldo atual

4. RECOMMENDATIONS: Lista de 4-6 recomendações financeiras estratégicas

5. INVESTMENT_NEEDS: Análise de necessidades de investimento:
   - needs_investment: boolean
   - recommended_amount: valor recomendado se necessário
   - timing: quando buscar investimento
   - rationale: justificativa

Seja realista e baseie-se em dados históricos e benchmarks do setor.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            scenario_analysis: {
              type: "object",
              properties: {
                optimistic: {
                  type: "object",
                  properties: {
                    revenue_growth_rate: { type: "number" },
                    expense_growth_rate: { type: "number" },
                    assumptions: { type: "array", items: { type: "string" } }
                  }
                },
                realistic: {
                  type: "object",
                  properties: {
                    revenue_growth_rate: { type: "number" },
                    expense_growth_rate: { type: "number" },
                    assumptions: { type: "array", items: { type: "string" } }
                  }
                },
                pessimistic: {
                  type: "object",
                  properties: {
                    revenue_growth_rate: { type: "number" },
                    expense_growth_rate: { type: "number" },
                    assumptions: { type: "array", items: { type: "string" } }
                  }
                }
              }
            },
            monthly_projections: {
              type: "object",
              properties: {
                optimistic: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      month: { type: "number" },
                      revenue: { type: "number" },
                      expenses: { type: "number" },
                      net_income: { type: "number" },
                      cash_balance: { type: "number" }
                    }
                  }
                },
                realistic: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      month: { type: "number" },
                      revenue: { type: "number" },
                      expenses: { type: "number" },
                      net_income: { type: "number" },
                      cash_balance: { type: "number" }
                    }
                  }
                },
                pessimistic: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      month: { type: "number" },
                      revenue: { type: "number" },
                      expenses: { type: "number" },
                      net_income: { type: "number" },
                      cash_balance: { type: "number" }
                    }
                  }
                }
              }
            },
            key_metrics: {
              type: "object",
              properties: {
                optimistic: {
                  type: "object",
                  properties: {
                    total_revenue: { type: "number" },
                    total_expenses: { type: "number" },
                    net_profit: { type: "number" },
                    roi_percentage: { type: "number" },
                    break_even_month: { type: "number" },
                    runway_months: { type: "number" }
                  }
                },
                realistic: {
                  type: "object",
                  properties: {
                    total_revenue: { type: "number" },
                    total_expenses: { type: "number" },
                    net_profit: { type: "number" },
                    roi_percentage: { type: "number" },
                    break_even_month: { type: "number" },
                    runway_months: { type: "number" }
                  }
                },
                pessimistic: {
                  type: "object",
                  properties: {
                    total_revenue: { type: "number" },
                    total_expenses: { type: "number" },
                    net_profit: { type: "number" },
                    roi_percentage: { type: "number" },
                    break_even_month: { type: "number" },
                    runway_months: { type: "number" }
                  }
                }
              }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            },
            investment_needs: {
              type: "object",
              properties: {
                needs_investment: { type: "boolean" },
                recommended_amount: { type: "number" },
                timing: { type: "string" },
                rationale: { type: "string" }
              }
            }
          }
        }
      });

      setProjections({
        ...response,
        generated_at: new Date().toISOString(),
        venture_name: venture.name,
        current_data: context.current_financials
      });

      toast.success('Projeções financeiras geradas!');
    } catch (error) {
      toast.error('Erro ao gerar projeções: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Select value={selectedVenture} onValueChange={setSelectedVenture}>
          <SelectTrigger className="w-64 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Selecione uma venture" />
          </SelectTrigger>
          <SelectContent>
            {ventures.map(venture => (
              <SelectItem key={venture.id} value={venture.id}>
                {venture.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowFinancialForm(true)}
            disabled={!selectedVenture}
            variant="outline"
            className="border-white/10 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Dados
          </Button>
          <Button
            onClick={generateProjections}
            disabled={!selectedVenture || generating || !financialData?.financials?.length}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Gerar Projeções
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Current Financials */}
      {selectedVenture && financialData?.financials?.length > 0 && (
        <div className="grid md:grid-cols-4 gap-4">
          {(() => {
            const latest = financialData.financials[0];
            const burnRate = latest.expenses - latest.revenue;
            const runway = burnRate > 0 ? Math.floor(latest.cash_balance / burnRate) : null;

            return (
              <>
                <GlowCard glowColor="gold" className="p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-[#C7A763]" />
                    <div>
                      <div className="text-2xl font-bold text-white">
                        ${latest.revenue.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400">Receita Atual</div>
                    </div>
                  </div>
                </GlowCard>

                <GlowCard glowColor="mixed" className="p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-red-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">
                        ${latest.expenses.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400">Despesas</div>
                    </div>
                  </div>
                </GlowCard>

                <GlowCard glowColor="cyan" className="p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-[#00D4FF]" />
                    <div>
                      <div className="text-2xl font-bold text-white">
                        ${latest.cash_balance.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400">Caixa</div>
                    </div>
                  </div>
                </GlowCard>

                <GlowCard glowColor={runway && runway < 6 ? "mixed" : "gold"} className="p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className={`w-5 h-5 ${runway && runway < 6 ? 'text-orange-400' : 'text-green-400'}`} />
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {runway ? `${runway}m` : '∞'}
                      </div>
                      <div className="text-xs text-slate-400">Runway</div>
                    </div>
                  </div>
                </GlowCard>
              </>
            );
          })()}
        </div>
      )}

      {/* Projections */}
      {projections && <FinancialProjections projections={projections} />}

      {/* Empty State */}
      {selectedVenture && !financialData?.financials?.length && (
        <GlowCard glowColor="mixed" className="p-12">
          <div className="text-center">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-slate-500 opacity-30" />
            <p className="text-slate-400 mb-4">Nenhum dado financeiro registrado para esta venture.</p>
            <Button onClick={() => setShowFinancialForm(true)} variant="outline" className="border-white/10 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Registro
            </Button>
          </div>
        </GlowCard>
      )}

      {/* Form Modal */}
      {showFinancialForm && (
        <FinancialForm
          ventureId={selectedVenture}
          ventureName={venture?.name}
          onClose={() => setShowFinancialForm(false)}
          onSuccess={() => {
            setShowFinancialForm(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}