import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from "@/api/base44Client";
import { Brain, TrendingUp, TrendingDown, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import "@/components/i18n";

export default function VenturePerformanceSummary({ venture, financials, kpis, talents }) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [generating, setGenerating] = useState(false);

  const generateSummary = async () => {
    setGenerating(true);
    try {
      const totalRevenue = financials.reduce((sum, f) => sum + (f.revenue || 0), 0);
      const totalExpenses = financials.reduce((sum, f) => sum + (f.expenses || 0), 0);
      const latestCash = financials[financials.length - 1]?.cash_balance || 0;
      const burnRate = totalExpenses / (financials.length || 1);

      const kpisOnTarget = kpis.filter(k => k.target_value && k.current_value >= k.target_value).length;
      const kpisTotal = kpis.length;

      const prompt = `Você é um analista de negócios especializado em ventures e startups.

VENTURE: ${venture.name}
Descrição: ${venture.description}
Layer: ${venture.layer}
Status: ${venture.status}
Categoria: ${venture.category}

DADOS FINANCEIROS:
- Receita Total: R$ ${totalRevenue}
- Despesas Totais: R$ ${totalExpenses}
- Saldo de Caixa: R$ ${latestCash}
- Burn Rate: R$ ${burnRate.toFixed(2)}/mês

KPIS:
- Total de KPIs: ${kpisTotal}
- KPIs no target: ${kpisOnTarget}
- Taxa de sucesso: ${kpisTotal > 0 ? ((kpisOnTarget / kpisTotal) * 100).toFixed(0) : 0}%

TALENTOS:
- Tamanho do time: ${talents.length}

ANÁLISE:
Forneça um resumo executivo conciso e objetivo sobre a saúde e progresso desta venture.
Considere dados de mercado e benchmarks da indústria ${venture.category}.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            health_status: { 
              type: "string",
              enum: ["excellent", "good", "attention", "critical"]
            },
            overall_summary: { type: "string" },
            key_strengths: {
              type: "array",
              items: { type: "string" }
            },
            key_challenges: {
              type: "array",
              items: { type: "string" }
            },
            financial_health: { type: "string" },
            kpi_performance: { type: "string" },
            team_assessment: { type: "string" },
            next_priorities: {
              type: "array",
              items: { type: "string" }
            },
            growth_trajectory: { type: "string" },
            risk_level: {
              type: "string",
              enum: ["low", "medium", "high"]
            }
          }
        }
      });

      setSummary(response);
      toast.success('Resumo gerado!');
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const healthStatusConfig = {
    excellent: {
      color: 'text-green-400',
      bg: 'bg-green-500/20',
      border: 'border-green-500/30',
      icon: CheckCircle2,
      label: t.ai.performance.status.excellent
    },
    good: {
      color: 'text-blue-400',
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30',
      icon: CheckCircle2,
      label: t.ai.performance.status.good
    },
    attention: {
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/30',
      icon: AlertCircle,
      label: t.ai.performance.status.attention
    },
    critical: {
      color: 'text-red-400',
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      icon: AlertCircle,
      label: t.ai.performance.status.critical
    }
  };

  const riskConfig = {
    low: { color: 'text-green-400', label: t.ai.performance.risk.low },
    medium: { color: 'text-yellow-400', label: t.ai.performance.risk.medium },
    high: { color: 'text-red-400', label: t.ai.performance.risk.high }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5 text-[#C7A763]" />
          {t.ai.performance.title} - {venture.name}
        </h4>
        <Button
          onClick={generateSummary}
          disabled={generating}
          size="sm"
          className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Brain className="w-4 h-4 mr-2" />
          )}
          {summary ? t.ai.performance.update : t.ai.performance.generate}
        </Button>
      </div>

      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Status Header */}
          <GlowCard glowColor="mixed" className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {React.createElement(healthStatusConfig[summary.health_status].icon, {
                  className: `w-6 h-6 ${healthStatusConfig[summary.health_status].color}`
                })}
                <div>
                  <div className="text-xs text-slate-400">Status Geral</div>
                  <div className={`text-lg font-semibold ${healthStatusConfig[summary.health_status].color}`}>
                    {healthStatusConfig[summary.health_status].label}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Nível de Risco</div>
                <div className={`text-lg font-semibold ${riskConfig[summary.risk_level].color}`}>
                  {riskConfig[summary.risk_level].label}
                </div>
              </div>
            </div>
          </GlowCard>

          {/* Overall Summary */}
          <GlowCard glowColor="gold" className="p-6">
            <h5 className="text-white font-medium mb-3">Visão Geral</h5>
            <p className="text-slate-300 text-sm leading-relaxed">{summary.overall_summary}</p>
          </GlowCard>

          {/* Detailed Assessments */}
          <div className="grid md:grid-cols-3 gap-4">
            <GlowCard glowColor="cyan" className="p-4">
              <h6 className="text-white text-sm font-medium mb-2">Saúde Financeira</h6>
              <p className="text-slate-300 text-xs">{summary.financial_health}</p>
            </GlowCard>

            <GlowCard glowColor="gold" className="p-4">
              <h6 className="text-white text-sm font-medium mb-2">Performance de KPIs</h6>
              <p className="text-slate-300 text-xs">{summary.kpi_performance}</p>
            </GlowCard>

            <GlowCard glowColor="mixed" className="p-4">
              <h6 className="text-white text-sm font-medium mb-2">Avaliação do Time</h6>
              <p className="text-slate-300 text-xs">{summary.team_assessment}</p>
            </GlowCard>
          </div>

          {/* Growth Trajectory */}
          <GlowCard glowColor="cyan" className="p-6">
            <h5 className="text-white font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trajetória de Crescimento
            </h5>
            <p className="text-slate-300 text-sm">{summary.growth_trajectory}</p>
          </GlowCard>

          {/* Strengths and Challenges */}
          <div className="grid md:grid-cols-2 gap-4">
            <GlowCard glowColor="gold" className="p-6">
              <h5 className="text-white font-medium mb-3">Pontos Fortes</h5>
              <ul className="space-y-2">
                {summary.key_strengths?.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </GlowCard>

            <GlowCard glowColor="mixed" className="p-6">
              <h5 className="text-white font-medium mb-3">Desafios</h5>
              <ul className="space-y-2">
                {summary.key_challenges?.map((challenge, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span>{challenge}</span>
                  </li>
                ))}
              </ul>
            </GlowCard>
          </div>

          {/* Next Priorities */}
          {summary.next_priorities?.length > 0 && (
            <GlowCard glowColor="cyan" className="p-6">
              <h5 className="text-white font-medium mb-3">Próximas Prioridades</h5>
              <ol className="space-y-2">
                {summary.next_priorities.map((priority, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="text-[#00D4FF] font-semibold">{i + 1}.</span>
                    <span>{priority}</span>
                  </li>
                ))}
              </ol>
            </GlowCard>
          )}
        </motion.div>
      )}

      {!summary && (
        <GlowCard glowColor="mixed" className="p-8">
          <div className="text-center space-y-3">
            <Brain className="w-12 h-12 mx-auto text-[#C7A763] opacity-30" />
            <p className="text-slate-400 text-sm">
              Clique em "Gerar Resumo" para análise detalhada da venture
            </p>
          </div>
        </GlowCard>
      )}
    </div>
  );
}