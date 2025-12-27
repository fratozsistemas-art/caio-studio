import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Shield, Loader2, TrendingDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function RiskAssessment({ venture }) {
  const [loading, setLoading] = useState(false);
  const [riskReport, setRiskReport] = useState(null);

  const assessRisks = async () => {
    if (!venture) {
      toast.error('Selecione uma venture primeiro');
      return;
    }

    setLoading(true);
    try {
      const [financialsRes, kpisRes, scenariosRes] = await Promise.all([
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'FinancialRecord',
          operation: 'filter',
          query: { venture_id: venture.id }
        }),
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'VentureKPI',
          operation: 'filter',
          query: { venture_id: venture.id }
        }),
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'FinancialScenario',
          operation: 'filter',
          query: { venture_id: venture.id }
        })
      ]);

      const financials = financialsRes.data?.data || [];
      const kpis = kpisRes.data?.data || [];
      const scenarios = scenariosRes.data?.data || [];

      const totalRevenue = financials.filter(f => f.record_type === 'revenue').reduce((sum, f) => sum + f.amount, 0);
      const totalExpenses = financials.filter(f => f.record_type === 'expense').reduce((sum, f) => sum + f.amount, 0);
      const burnRate = totalExpenses - totalRevenue;
      const cashBalance = financials.filter(f => f.record_type === 'cash_balance').sort((a, b) => 
        new Date(b.record_date) - new Date(a.record_date)
      )[0]?.amount || 0;

      const prompt = `Você é um analista de risco especializado em startups. Analise os dados da venture e condições de mercado para fornecer uma avaliação de risco abrangente.

Venture: ${venture.name}
Layer: ${venture.layer}
Status: ${venture.status}

Dados Financeiros:
- Receita Total: R$ ${totalRevenue.toLocaleString('pt-BR')}
- Despesas Totais: R$ ${totalExpenses.toLocaleString('pt-BR')}
- Burn Rate: R$ ${burnRate.toLocaleString('pt-BR')}
- Saldo de Caixa: R$ ${cashBalance.toLocaleString('pt-BR')}
- Runway Estimado: ${cashBalance > 0 && burnRate > 0 ? Math.floor(cashBalance / burnRate) : 'N/A'} meses

Performance de KPIs:
${kpis.map(k => `- ${k.kpi_name}: ${k.current_value}/${k.target_value} (${Math.round((k.current_value/k.target_value)*100)}%)`).join('\n')}

Cenários Planejados: ${scenarios.length}

Use dados de mercado atuais para avaliar riscos em:
1. Risco Financeiro
2. Risco de Mercado
3. Risco Operacional
4. Risco Competitivo
5. Risco de Execução

Para cada categoria, forneça:
- Nível de risco (0-100)
- Fatores específicos
- Probabilidade de ocorrência
- Impacto potencial
- Medidas de mitigação priorizadas`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            overall_risk_score: { type: "number" },
            risk_level: { type: "string" },
            risk_categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  risk_score: { type: "number" },
                  factors: { type: "array", items: { type: "string" } },
                  probability: { type: "string" },
                  impact: { type: "string" },
                  mitigation_measures: { type: "array", items: { type: "string" } }
                }
              }
            },
            critical_risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risk: { type: "string" },
                  urgency: { type: "string" },
                  immediate_action: { type: "string" }
                }
              }
            },
            risk_trends: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setRiskReport(response);
      toast.success('Avaliação de risco concluída!');
    } catch (error) {
      toast.error('Erro ao avaliar riscos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRiskLevelBg = (level) => {
    const levelLower = level?.toLowerCase();
    if (levelLower?.includes('alto') || levelLower?.includes('high') || levelLower?.includes('crítico')) 
      return 'bg-red-500/20 border-red-500/30';
    if (levelLower?.includes('médio') || levelLower?.includes('medium') || levelLower?.includes('moderado')) 
      return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-green-500/20 border-green-500/30';
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="mixed" className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Avaliação de Risco com IA
            </h3>
            {venture && (
              <p className="text-sm text-slate-400">Analisando: {venture.name}</p>
            )}
          </div>
          <Button
            onClick={assessRisks}
            disabled={loading || !venture}
            className="bg-gradient-to-r from-purple-600 to-purple-800 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Avaliando...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Avaliar Riscos
              </>
            )}
          </Button>
        </div>
      </GlowCard>

      {riskReport && (
        <div className="space-y-6">
          {/* Overall Risk Score */}
          <GlowCard glowColor="gold" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold">Score Geral de Risco</h4>
              <span className={`text-3xl font-bold ${getRiskColor(riskReport.overall_risk_score)}`}>
                {riskReport.overall_risk_score}/100
              </span>
            </div>
            <Progress value={riskReport.overall_risk_score} className="h-3 mb-3" />
            <div className={`inline-block px-4 py-2 rounded-lg border ${getRiskLevelBg(riskReport.risk_level)}`}>
              <span className="text-white font-medium">{riskReport.risk_level}</span>
            </div>
          </GlowCard>

          {/* Risk Categories */}
          <div className="grid md:grid-cols-2 gap-4">
            {riskReport.risk_categories?.map((category, i) => (
              <GlowCard key={i} glowColor="cyan" className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-white font-semibold">{category.category}</h5>
                  <span className={`text-2xl font-bold ${getRiskColor(category.risk_score)}`}>
                    {category.risk_score}
                  </span>
                </div>
                <Progress value={category.risk_score} className="h-2 mb-4" />
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Fatores de Risco:</p>
                    <ul className="space-y-1">
                      {category.factors?.map((factor, j) => (
                        <li key={j} className="text-sm text-slate-300">• {factor}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white/5 rounded">
                      <p className="text-slate-400">Probabilidade</p>
                      <p className="text-white font-medium">{category.probability}</p>
                    </div>
                    <div className="p-2 bg-white/5 rounded">
                      <p className="text-slate-400">Impacto</p>
                      <p className="text-white font-medium">{category.impact}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 mb-1">Mitigação:</p>
                    <ul className="space-y-1">
                      {category.mitigation_measures?.slice(0, 2).map((measure, j) => (
                        <li key={j} className="text-xs text-slate-300">✓ {measure}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>

          {/* Critical Risks */}
          {riskReport.critical_risks?.length > 0 && (
            <GlowCard glowColor="mixed" className="p-6 border-2 border-red-500/30">
              <h4 className="text-red-400 font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Riscos Críticos - Ação Imediata Necessária
              </h4>
              <div className="space-y-3">
                {riskReport.critical_risks.map((risk, i) => (
                  <div key={i} className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-white font-medium">{risk.risk}</span>
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                        {risk.urgency}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">
                      <strong>Ação Imediata:</strong> {risk.immediate_action}
                    </p>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Trends & Recommendations */}
          <div className="grid md:grid-cols-2 gap-4">
            <GlowCard glowColor="cyan" className="p-6">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-[#00D4FF]" />
                Tendências de Risco
              </h4>
              <p className="text-sm text-slate-300">{riskReport.risk_trends}</p>
            </GlowCard>

            <GlowCard glowColor="gold" className="p-6">
              <h4 className="text-white font-semibold mb-3">Recomendações</h4>
              <ul className="space-y-2">
                {riskReport.recommendations?.map((rec, i) => (
                  <li key={i} className="text-sm text-slate-300">→ {rec}</li>
                ))}
              </ul>
            </GlowCard>
          </div>
        </div>
      )}
    </div>
  );
}