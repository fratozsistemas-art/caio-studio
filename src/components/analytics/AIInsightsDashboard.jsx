import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, Sparkles, Loader2, Target } from 'lucide-react';
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function AIInsightsDashboard({ ventures, financials, kpis, talents }) {
  const [insights, setInsights] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const generateInsights = async () => {
    setAnalyzing(true);
    try {
      // Prepare data summary
      const dataContext = ventures.map(v => {
        const ventureFinancials = financials.filter(f => f.venture_id === v.id);
        const ventureKPIs = kpis.filter(k => k.venture_id === v.id);
        const ventureTalents = talents.filter(t => t.venture_id === v.id);

        const totalRevenue = ventureFinancials.reduce((sum, f) => sum + (f.revenue || 0), 0);
        const totalExpenses = ventureFinancials.reduce((sum, f) => sum + (f.expenses || 0), 0);
        const latestCash = ventureFinancials[ventureFinancials.length - 1]?.cash_balance || 0;

        return {
          name: v.name,
          layer: v.layer,
          status: v.status,
          category: v.category,
          revenue: totalRevenue,
          expenses: totalExpenses,
          cash_balance: latestCash,
          burn_rate: totalExpenses / (ventureFinancials.length || 1),
          kpi_count: ventureKPIs.length,
          kpis_on_target: ventureKPIs.filter(k => k.target_value && k.current_value >= k.target_value).length,
          team_size: ventureTalents.length
        };
      });

      const prompt = `Você é um analista estratégico de ventures e investimentos com expertise em identificar padrões e oportunidades.

DADOS DO PORTFOLIO:
${JSON.stringify(dataContext, null, 2)}

ANÁLISE COMPLETA:
Identifique e forneça insights acionáveis sobre:

1. TENDÊNCIAS PRINCIPAIS (trends):
   - Padrões de crescimento ou declínio
   - Movimentos de mercado relevantes
   - Comportamento das métricas ao longo do tempo

2. ANOMALIAS (anomalies):
   - Desvios significativos do esperado
   - Ventures com performance atípica
   - Alertas de risco ou atenção

3. OPORTUNIDADES (opportunities):
   - Áreas de expansão ou otimização
   - Ventures prontas para scaling
   - Sinergias entre ventures
   - Investimentos estratégicos recomendados

4. RECOMENDAÇÕES ESTRATÉGICAS (strategic_actions):
   - Ações prioritárias para o portfolio
   - Alocação de recursos
   - Próximos passos táticos

Forneça análise objetiva e baseada em dados.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            trends: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" },
                  ventures_affected: { type: "array", items: { type: "string" } }
                }
              }
            },
            anomalies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string" },
                  venture: { type: "string" }
                }
              }
            },
            opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  potential_value: { type: "string" },
                  timeframe: { type: "string" }
                }
              }
            },
            strategic_actions: {
              type: "array",
              items: { type: "string" }
            },
            portfolio_health_score: { type: "number" },
            overall_summary: { type: "string" }
          }
        }
      });

      setInsights(response);
      toast.success('Insights gerados com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar insights: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const severityColors = {
    high: 'text-red-400 bg-red-500/20 border-red-500/30',
    medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    low: 'text-green-400 bg-green-500/20 border-green-500/30'
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="gold" className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#C7A763]" />
              AI Insights Dashboard
            </h3>
            <p className="text-slate-400 text-sm">
              Análise automática do portfolio com identificação de tendências, anomalias e oportunidades
            </p>
          </div>
          <Button
            onClick={generateInsights}
            disabled={analyzing}
            className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Insights
              </>
            )}
          </Button>
        </div>
      </GlowCard>

      {insights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Overall Summary */}
          <GlowCard glowColor="mixed" className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <Target className="w-6 h-6 text-[#C7A763] mt-1" />
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-2">Visão Geral do Portfolio</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{insights.overall_summary}</p>
              </div>
              {insights.portfolio_health_score && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#C7A763]">
                    {insights.portfolio_health_score}
                  </div>
                  <div className="text-xs text-slate-400">Health Score</div>
                </div>
              )}
            </div>
          </GlowCard>

          {/* Trends */}
          {insights.trends?.length > 0 && (
            <GlowCard glowColor="cyan" className="p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
                Tendências Identificadas ({insights.trends.length})
              </h4>
              <div className="space-y-3">
                {insights.trends.map((trend, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-lg bg-white/5 border border-white/10"
                  >
                    <h5 className="text-white font-medium mb-2">{trend.title}</h5>
                    <p className="text-sm text-slate-300 mb-2">{trend.description}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-[#00D4FF]">Impacto: {trend.impact}</span>
                      {trend.ventures_affected?.length > 0 && (
                        <span className="text-slate-400">
                          Ventures: {trend.ventures_affected.join(', ')}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Anomalies */}
          {insights.anomalies?.length > 0 && (
            <GlowCard glowColor="gold" className="p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Anomalias e Alertas ({insights.anomalies.length})
              </h4>
              <div className="space-y-3">
                {insights.anomalies.map((anomaly, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="text-white font-medium">{anomaly.title}</h5>
                      <span className={`text-xs px-2 py-1 rounded border ${severityColors[anomaly.severity]}`}>
                        {anomaly.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{anomaly.description}</p>
                    <span className="text-xs text-slate-400">Venture: {anomaly.venture}</span>
                  </motion.div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Opportunities */}
          {insights.opportunities?.length > 0 && (
            <GlowCard glowColor="mixed" className="p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C7A763]" />
                Oportunidades Identificadas ({insights.opportunities.length})
              </h4>
              <div className="space-y-3">
                {insights.opportunities.map((opp, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-lg bg-gradient-to-r from-[#C7A763]/10 to-transparent border border-[#C7A763]/20"
                  >
                    <h5 className="text-white font-medium mb-2">{opp.title}</h5>
                    <p className="text-sm text-slate-300 mb-3">{opp.description}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-green-400">Valor Potencial: {opp.potential_value}</span>
                      <span className="text-slate-400">Prazo: {opp.timeframe}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Strategic Actions */}
          {insights.strategic_actions?.length > 0 && (
            <GlowCard glowColor="cyan" className="p-6">
              <h4 className="text-white font-semibold mb-4">Ações Estratégicas Recomendadas</h4>
              <ul className="space-y-2">
                {insights.strategic_actions.map((action, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 text-sm text-slate-300"
                  >
                    <span className="text-[#00D4FF] mt-1">→</span>
                    <span>{action}</span>
                  </motion.li>
                ))}
              </ul>
            </GlowCard>
          )}
        </motion.div>
      )}

      {!insights && (
        <GlowCard glowColor="mixed" className="p-12">
          <div className="text-center space-y-4">
            <Brain className="w-16 h-16 mx-auto text-[#C7A763] opacity-30" />
            <div>
              <h3 className="text-white font-semibold mb-2">AI Insights não gerados</h3>
              <p className="text-slate-400 text-sm">
                Clique em "Gerar Insights" para análise automática do portfolio
              </p>
            </div>
          </div>
        </GlowCard>
      )}
    </div>
  );
}