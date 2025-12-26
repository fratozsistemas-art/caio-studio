import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function SuccessDrivers({ ventures, kpis, financials, talents }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [drivers, setDrivers] = useState(null);

  const analyzeDrivers = async () => {
    setAnalyzing(true);
    try {
      // Prepare data for ML analysis
      const ventureData = ventures.map(v => {
        const ventureKPIs = kpis.filter(k => k.venture_id === v.id);
        const ventureFinancials = financials.filter(f => f.venture_id === v.id);
        const ventureTalents = talents.filter(t => t.venture_id === v.id);

        const avgKPIAchievement = ventureKPIs.length > 0
          ? ventureKPIs.reduce((sum, k) => sum + ((k.current_value / k.target_value) * 100), 0) / ventureKPIs.length
          : 0;

        const latestFinancial = ventureFinancials[ventureFinancials.length - 1];
        const profitMargin = latestFinancial
          ? ((latestFinancial.revenue - latestFinancial.expenses) / latestFinancial.revenue) * 100
          : 0;

        const avgTalentPerformance = ventureTalents.length > 0
          ? ventureTalents.reduce((sum, t) => sum + (t.performance_score || 0), 0) / ventureTalents.length
          : 0;

        return {
          name: v.name,
          layer: v.layer,
          status: v.status,
          team_size: v.team_size || 0,
          avg_kpi_achievement: avgKPIAchievement,
          profit_margin: profitMargin,
          avg_talent_performance: avgTalentPerformance,
          kpi_count: ventureKPIs.length,
          talent_count: ventureTalents.length
        };
      });

      const prompt = `
You are a machine learning analyst specializing in venture success prediction. Analyze this dataset of ventures and identify key drivers of success and failure.

VENTURE DATA:
${JSON.stringify(ventureData, null, 2)}

Perform a correlation and pattern analysis to identify:
1. Which metrics are most strongly correlated with success (high KPI achievement, profitability)
2. Which factors distinguish successful ventures from struggling ones
3. Common patterns among top performers
4. Warning signs in underperforming ventures

Generate a JSON response with:
{
  "success_drivers": [
    {
      "factor": "Factor name",
      "impact_score": 0-100,
      "correlation": "positive|negative",
      "description": "How this factor drives success"
    }
  ],
  "failure_indicators": [
    {
      "factor": "Factor name",
      "risk_score": 0-100,
      "description": "Warning sign description"
    }
  ],
  "top_performing_patterns": ["pattern1", "pattern2", "pattern3"],
  "insights": ["insight1", "insight2", "insight3"],
  "ml_confidence": 0-100
}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            success_drivers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  factor: { type: "string" },
                  impact_score: { type: "number" },
                  correlation: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            failure_indicators: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  factor: { type: "string" },
                  risk_score: { type: "number" },
                  description: { type: "string" }
                }
              }
            },
            top_performing_patterns: { type: "array", items: { type: "string" } },
            insights: { type: "array", items: { type: "string" } },
            ml_confidence: { type: "number" }
          }
        }
      });

      setDrivers(response);
      toast.success('Análise de drivers concluída!');
    } catch (error) {
      toast.error('Erro na análise: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <GlowCard glowColor="cyan" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-[#00D4FF]" />
          <h3 className="text-xl font-bold text-white">Drivers de Sucesso & Fracasso</h3>
        </div>
        <Button
          onClick={analyzeDrivers}
          disabled={analyzing}
          className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]"
        >
          {analyzing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 mr-2" />
          )}
          Analisar com ML
        </Button>
      </div>

      {drivers ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* ML Confidence */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-[#00D4FF]/10 to-transparent border border-[#00D4FF]/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Confiança do Modelo ML</span>
              <span className="text-lg font-bold text-[#00D4FF]">{drivers.ml_confidence}%</span>
            </div>
            <Progress value={drivers.ml_confidence} className="h-2" />
          </div>

          {/* Success Drivers */}
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-green-400" />
              Drivers de Sucesso
            </h4>
            <div className="space-y-3">
              {drivers.success_drivers?.map((driver, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-lg bg-green-500/10 border border-green-500/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h5 className="text-white font-semibold mb-1">{driver.factor}</h5>
                      <p className="text-sm text-slate-300">{driver.description}</p>
                    </div>
                    <div className="ml-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">{driver.impact_score}</div>
                        <div className="text-xs text-slate-400">Impacto</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Progress value={driver.impact_score} className="h-1.5 bg-green-950" />
                  </div>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      driver.correlation === 'positive' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      Correlação {driver.correlation === 'positive' ? 'Positiva' : 'Negativa'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Failure Indicators */}
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-red-400" />
              Indicadores de Risco
            </h4>
            <div className="space-y-3">
              {drivers.failure_indicators?.map((indicator, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-lg bg-red-500/10 border border-red-500/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h5 className="text-white font-semibold mb-1">{indicator.factor}</h5>
                      <p className="text-sm text-slate-300">{indicator.description}</p>
                    </div>
                    <div className="ml-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-400">{indicator.risk_score}</div>
                        <div className="text-xs text-slate-400">Risco</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Progress value={indicator.risk_score} className="h-1.5 bg-red-950" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Top Performing Patterns */}
          <div className="p-5 rounded-lg bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
            <h4 className="text-white font-semibold mb-3">Padrões de Top Performers</h4>
            <div className="space-y-2">
              {drivers.top_performing_patterns?.map((pattern, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  {pattern}
                </div>
              ))}
            </div>
          </div>

          {/* Key Insights */}
          <div className="p-5 rounded-lg bg-gradient-to-br from-[#C7A763]/10 to-transparent border border-[#C7A763]/20">
            <h4 className="text-white font-semibold mb-3">Insights da Análise</h4>
            <div className="space-y-2">
              {drivers.insights?.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <Zap className="w-4 h-4 text-[#C7A763] mt-0.5 flex-shrink-0" />
                  {insight}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Use machine learning para identificar os principais drivers de sucesso</p>
          <p className="text-xs mt-2">Análise baseada em correlações e padrões</p>
        </div>
      )}
    </GlowCard>
  );
}