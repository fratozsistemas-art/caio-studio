import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, Activity, Loader2, RefreshCw, Target, DollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

export default function PredictiveAnalytics({ ventureId }) {
  const [analysis, setAnalysis] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Fetch venture data
  const { data: venture } = useQuery({
    queryKey: ['venture', ventureId],
    queryFn: async () => {
      if (ventureId === 'all') return null;
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Venture',
        operation: 'list',
        filters: { id: ventureId }
      });
      return res.data?.data?.[0];
    },
    enabled: !!ventureId && ventureId !== 'all'
  });

  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Venture',
        operation: 'list'
      });
      return res.data?.data || [];
    },
    enabled: ventureId === 'all'
  });

  const { data: kpis = [] } = useQuery({
    queryKey: ['kpis', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureKPI',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const { data: financials = [] } = useQuery({
    queryKey: ['financials', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'FinancialRecord',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const generateAnalysis = async () => {
    setGenerating(true);
    try {
      const contextData = {
        venture: ventureId === 'all' ? { name: 'Portfolio Geral', ventures: ventures.length } : venture,
        kpis: kpis.filter(k => ventureId === 'all' || k.venture_id === ventureId),
        financials: financials.filter(f => ventureId === 'all' || f.venture_id === ventureId),
        ventureCount: ventures.length
      };

      const prompt = `Você é um analista de venture capital expert. Analise os dados a seguir e forneça:

DADOS:
${JSON.stringify(contextData, null, 2)}

Forneça sua análise no seguinte formato JSON:

{
  "success_prediction": {
    "score": <número 0-100>,
    "confidence": <"high" | "medium" | "low">,
    "factors": ["fator 1", "fator 2", "fator 3"],
    "trajectory": "ascending" | "stable" | "descending"
  },
  "risk_analysis": {
    "overall_risk": <"low" | "medium" | "high" | "critical">,
    "risks": [
      {"type": "financial" | "operational" | "market" | "talent", "severity": "low" | "medium" | "high", "description": "descrição"}
    ],
    "mitigation_strategies": ["estratégia 1", "estratégia 2"]
  },
  "health_summary": {
    "status": "excellent" | "good" | "attention" | "critical",
    "score": <número 0-100>,
    "strengths": ["força 1", "força 2"],
    "weaknesses": ["fraqueza 1", "fraqueza 2"],
    "key_metrics": {
      "financial_health": <número 0-100>,
      "growth_potential": <número 0-100>,
      "operational_efficiency": <número 0-100>,
      "market_position": <número 0-100>
    }
  },
  "projections": {
    "next_quarter": {
      "revenue_forecast": <número>,
      "growth_rate": <número>,
      "confidence": <"high" | "medium" | "low">
    },
    "milestones": ["marco 1", "marco 2"],
    "recommendations": ["recomendação 1", "recomendação 2"]
  }
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            success_prediction: {
              type: "object",
              properties: {
                score: { type: "number" },
                confidence: { type: "string" },
                factors: { type: "array", items: { type: "string" } },
                trajectory: { type: "string" }
              }
            },
            risk_analysis: {
              type: "object",
              properties: {
                overall_risk: { type: "string" },
                risks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      severity: { type: "string" },
                      description: { type: "string" }
                    }
                  }
                },
                mitigation_strategies: { type: "array", items: { type: "string" } }
              }
            },
            health_summary: {
              type: "object",
              properties: {
                status: { type: "string" },
                score: { type: "number" },
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                key_metrics: {
                  type: "object",
                  properties: {
                    financial_health: { type: "number" },
                    growth_potential: { type: "number" },
                    operational_efficiency: { type: "number" },
                    market_position: { type: "number" }
                  }
                }
              }
            },
            projections: {
              type: "object",
              properties: {
                next_quarter: {
                  type: "object",
                  properties: {
                    revenue_forecast: { type: "number" },
                    growth_rate: { type: "number" },
                    confidence: { type: "string" }
                  }
                },
                milestones: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      setAnalysis(result);
      toast.success('Análise preditiva gerada com sucesso');
    } catch (error) {
      toast.error('Erro ao gerar análise: ' + error.message);
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      excellent: 'text-green-400 border-green-500/30 bg-green-500/10',
      good: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
      attention: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
      critical: 'text-red-400 border-red-500/30 bg-red-500/10'
    };
    return colors[status] || colors.good;
  };

  const getRiskColor = (risk) => {
    const colors = {
      low: 'text-green-400 bg-green-500/10 border-green-500/30',
      medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
      critical: 'text-red-400 bg-red-500/10 border-red-500/30'
    };
    return colors[risk] || colors.medium;
  };

  const radarData = analysis?.health_summary?.key_metrics ? [
    { subject: 'Saúde Financeira', value: analysis.health_summary.key_metrics.financial_health },
    { subject: 'Crescimento', value: analysis.health_summary.key_metrics.growth_potential },
    { subject: 'Eficiência', value: analysis.health_summary.key_metrics.operational_efficiency },
    { subject: 'Mercado', value: analysis.health_summary.key_metrics.market_position }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-[#C7A763]" />
          <div>
            <h3 className="text-xl font-bold text-white">Análise Preditiva com IA</h3>
            <p className="text-sm text-slate-400">
              Insights avançados sobre performance e projeções futuras
            </p>
          </div>
        </div>
        <Button
          onClick={generateAnalysis}
          disabled={generating}
          className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Gerar Análise
            </>
          )}
        </Button>
      </div>

      {/* Analysis Results */}
      {analysis ? (
        <div className="space-y-6">
          {/* Success Prediction */}
          <GlowCard glowColor="cyan" className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
                <h4 className="text-lg font-semibold text-white">Previsão de Sucesso</h4>
              </div>
              <Badge className={`${getStatusColor(analysis.success_prediction.confidence)}`}>
                Confiança: {analysis.success_prediction.confidence}
              </Badge>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Score de Sucesso</span>
                  <span className="text-2xl font-bold text-white">{analysis.success_prediction.score}%</span>
                </div>
                <Progress value={analysis.success_prediction.score} className="h-2" />
              </div>
              <div>
                <span className="text-sm text-slate-400 block mb-2">Trajetória</span>
                <Badge className={analysis.success_prediction.trajectory === 'ascending' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                  {analysis.success_prediction.trajectory === 'ascending' ? '📈 Ascendente' : analysis.success_prediction.trajectory === 'stable' ? '➡️ Estável' : '📉 Descendente'}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-slate-400 block mb-2">Fatores-Chave</span>
                <ul className="space-y-1">
                  {analysis.success_prediction.factors.map((factor, idx) => (
                    <li key={idx} className="text-sm text-white flex items-start gap-2">
                      <Target className="w-3 h-3 text-[#C7A763] mt-1 flex-shrink-0" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </GlowCard>

          {/* Risk Analysis */}
          <GlowCard glowColor="gold" className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-[#C7A763]" />
                <h4 className="text-lg font-semibold text-white">Análise de Riscos</h4>
              </div>
              <Badge className={getRiskColor(analysis.risk_analysis.overall_risk)}>
                Risco: {analysis.risk_analysis.overall_risk}
              </Badge>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-slate-400 block mb-3">Riscos Identificados</span>
                <div className="space-y-2">
                  {analysis.risk_analysis.risks.map((risk, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-sm font-medium text-white capitalize">{risk.type}</span>
                        <Badge className={getRiskColor(risk.severity)} variant="outline">
                          {risk.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">{risk.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm text-slate-400 block mb-2">Estratégias de Mitigação</span>
                <ul className="space-y-1">
                  {analysis.risk_analysis.mitigation_strategies.map((strategy, idx) => (
                    <li key={idx} className="text-sm text-white flex items-start gap-2">
                      <Activity className="w-3 h-3 text-[#00D4FF] mt-1 flex-shrink-0" />
                      {strategy}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </GlowCard>

          {/* Health Summary with Radar Chart */}
          <div className="grid md:grid-cols-2 gap-6">
            <GlowCard className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-purple-400" />
                  <h4 className="text-lg font-semibold text-white">Saúde da Venture</h4>
                </div>
                <Badge className={getStatusColor(analysis.health_summary.status)}>
                  {analysis.health_summary.status}
                </Badge>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-white mb-2">{analysis.health_summary.score}</div>
                  <div className="text-sm text-slate-400">Health Score</div>
                </div>
                <div>
                  <span className="text-sm text-slate-400 block mb-2">Pontos Fortes</span>
                  <div className="space-y-1">
                    {analysis.health_summary.strengths.map((strength, idx) => (
                      <div key={idx} className="text-xs text-green-400 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-green-400" />
                        {strength}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-slate-400 block mb-2">Pontos de Atenção</span>
                  <div className="space-y-1">
                    {analysis.health_summary.weaknesses.map((weakness, idx) => (
                      <div key={idx} className="text-xs text-yellow-400 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-yellow-400" />
                        {weakness}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlowCard>

            <GlowCard className="p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Métricas de Performance</h4>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#ffffff20" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#94a3b8" />
                  <Radar name="Performance" dataKey="value" stroke="#C7A763" fill="#C7A763" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </GlowCard>
          </div>

          {/* Projections */}
          <GlowCard glowColor="mixed" className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-5 h-5 text-[#00D4FF]" />
              <h4 className="text-lg font-semibold text-white">Projeções Futuras</h4>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-slate-400 mb-1">Receita Projetada (Próximo Trimestre)</div>
                <div className="text-2xl font-bold text-white">
                  R$ {analysis.projections.next_quarter.revenue_forecast?.toLocaleString('pt-BR')}
                </div>
                <Badge className="mt-2 bg-[#00D4FF]/20 text-[#00D4FF]">
                  {analysis.projections.next_quarter.confidence} confiança
                </Badge>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-slate-400 mb-1">Taxa de Crescimento</div>
                <div className="text-2xl font-bold text-white">
                  {analysis.projections.next_quarter.growth_rate}%
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-slate-400 block mb-2">Próximos Marcos</span>
                <ul className="space-y-1">
                  {analysis.projections.milestones.map((milestone, idx) => (
                    <li key={idx} className="text-sm text-white flex items-start gap-2">
                      <Target className="w-3 h-3 text-[#C7A763] mt-1 flex-shrink-0" />
                      {milestone}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-sm text-slate-400 block mb-2">Recomendações Estratégicas</span>
                <ul className="space-y-1">
                  {analysis.projections.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-white flex items-start gap-2">
                      <Brain className="w-3 h-3 text-[#00D4FF] mt-1 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </GlowCard>
        </div>
      ) : (
        <GlowCard className="p-12 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h4 className="text-white font-semibold mb-2">Análise Preditiva Disponível</h4>
          <p className="text-slate-400 text-sm mb-4">
            Clique em "Gerar Análise" para obter insights de IA sobre performance, riscos e projeções futuras
          </p>
        </GlowCard>
      )}
    </div>
  );
}