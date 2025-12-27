import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Target, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function PersonalizedSWOT({ venture }) {
  const [loading, setLoading] = useState(false);
  const [swotAnalysis, setSwotAnalysis] = useState(null);

  const generateSWOT = async () => {
    if (!venture) {
      toast.error('Selecione uma venture primeiro');
      return;
    }

    setLoading(true);
    try {
      const [kpisRes, financialsRes, talentsRes] = await Promise.all([
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'VentureKPI',
          operation: 'filter',
          query: { venture_id: venture.id }
        }),
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'FinancialRecord',
          operation: 'filter',
          query: { venture_id: venture.id }
        }),
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'VentureTalent',
          operation: 'filter',
          query: { venture_id: venture.id }
        })
      ]);

      const kpis = kpisRes.data?.data || [];
      const financials = financialsRes.data?.data || [];
      const talents = talentsRes.data?.data || [];

      const prompt = `Você é um consultor estratégico especializado. Faça uma análise SWOT detalhada e personalizada para a seguinte venture:

Venture: ${venture.name}
Descrição: ${venture.description}
Layer: ${venture.layer}
Status: ${venture.status}
Categoria: ${venture.category}

KPIs da Venture:
${kpis.map(k => `- ${k.kpi_name}: ${k.current_value}/${k.target_value} ${k.unit}`).join('\n')}

Dados Financeiros:
${financials.slice(0, 10).map(f => `- ${f.record_type}: R$ ${f.amount} (${f.record_date})`).join('\n')}

Time:
${talents.map(t => `- ${t.talent_name} (${t.role}, ${t.level})`).join('\n')}

Com base nos dados reais da venture e tendências de mercado atuais, forneça uma análise SWOT detalhada e acionável com:
- Forças internas específicas
- Fraquezas a serem endereçadas
- Oportunidades de mercado concretas
- Ameaças reais do ambiente
- Score de impacto para cada item (0-10)
- Recomendações estratégicas priorizadas`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            strengths: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  impact_score: { type: "number" },
                  details: { type: "string" }
                }
              }
            },
            weaknesses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  impact_score: { type: "number" },
                  action: { type: "string" }
                }
              }
            },
            opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  impact_score: { type: "number" },
                  timeframe: { type: "string" }
                }
              }
            },
            threats: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  severity: { type: "number" },
                  mitigation: { type: "string" }
                }
              }
            },
            strategic_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  priority: { type: "string" },
                  recommendation: { type: "string" },
                  expected_impact: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSwotAnalysis(response);
      toast.success('Análise SWOT gerada!');
    } catch (error) {
      toast.error('Erro ao gerar SWOT: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="gold" className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-[#C7A763]" />
              Análise SWOT Personalizada com IA
            </h3>
            {venture && (
              <p className="text-sm text-slate-400">Analisando: {venture.name}</p>
            )}
          </div>
          <Button
            onClick={generateSWOT}
            disabled={loading || !venture}
            className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Gerar SWOT
              </>
            )}
          </Button>
        </div>
      </GlowCard>

      {swotAnalysis && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Strengths */}
          <GlowCard glowColor="cyan" className="p-6">
            <h4 className="text-green-400 font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Forças
            </h4>
            <div className="space-y-3">
              {swotAnalysis.strengths?.map((strength, i) => (
                <div key={i} className="p-3 bg-white/5 rounded-lg border border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm">{strength.item}</span>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      Impacto: {strength.impact_score}/10
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{strength.details}</p>
                </div>
              ))}
            </div>
          </GlowCard>

          {/* Weaknesses */}
          <GlowCard glowColor="gold" className="p-6">
            <h4 className="text-red-400 font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Fraquezas
            </h4>
            <div className="space-y-3">
              {swotAnalysis.weaknesses?.map((weakness, i) => (
                <div key={i} className="p-3 bg-white/5 rounded-lg border border-red-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm">{weakness.item}</span>
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                      Impacto: {weakness.impact_score}/10
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    <strong>Ação:</strong> {weakness.action}
                  </p>
                </div>
              ))}
            </div>
          </GlowCard>

          {/* Opportunities */}
          <GlowCard glowColor="mixed" className="p-6">
            <h4 className="text-blue-400 font-semibold mb-4">Oportunidades</h4>
            <div className="space-y-3">
              {swotAnalysis.opportunities?.map((opp, i) => (
                <div key={i} className="p-3 bg-white/5 rounded-lg border border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm">{opp.item}</span>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                      {opp.impact_score}/10
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    <strong>Prazo:</strong> {opp.timeframe}
                  </p>
                </div>
              ))}
            </div>
          </GlowCard>

          {/* Threats */}
          <GlowCard glowColor="cyan" className="p-6">
            <h4 className="text-yellow-400 font-semibold mb-4">Ameaças</h4>
            <div className="space-y-3">
              {swotAnalysis.threats?.map((threat, i) => (
                <div key={i} className="p-3 bg-white/5 rounded-lg border border-yellow-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm">{threat.item}</span>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                      Severidade: {threat.severity}/10
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    <strong>Mitigação:</strong> {threat.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </GlowCard>
        </div>
      )}

      {/* Strategic Recommendations */}
      {swotAnalysis?.strategic_recommendations && (
        <GlowCard glowColor="gold" className="p-6">
          <h4 className="text-white font-semibold mb-4">Recomendações Estratégicas Priorizadas</h4>
          <div className="space-y-3">
            {swotAnalysis.strategic_recommendations.map((rec, i) => (
              <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start gap-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    rec.priority === 'Alta' || rec.priority === 'High' 
                      ? 'bg-red-500/20 text-red-400' 
                      : rec.priority === 'Média' || rec.priority === 'Medium'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {rec.priority}
                  </span>
                  <div className="flex-1">
                    <p className="text-white font-medium mb-1">{rec.recommendation}</p>
                    <p className="text-xs text-slate-400">
                      <strong>Impacto esperado:</strong> {rec.expected_impact}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlowCard>
      )}
    </div>
  );
}