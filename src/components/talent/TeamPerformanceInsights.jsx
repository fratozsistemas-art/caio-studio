import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, AlertTriangle, Users, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';

export default function TeamPerformanceInsights() {
  const [insights, setInsights] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const { data: talents = [] } = useQuery({
    queryKey: ['talents'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Talent',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['all-feedbacks'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'TalentFeedback',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['all-goals'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'TalentGoal',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const generateInsights = async () => {
    setAnalyzing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise os seguintes dados de performance da equipe e forneça insights acionáveis:

**Talentos:** ${talents.length} no total
**Feedbacks:** ${feedbacks.length} feedbacks coletados
**Metas:** ${goals.length} metas definidas

**Detalhes dos Talentos:**
${talents.map(t => `- ${t.full_name}: ${t.current_position || 'N/A'}, Skills: ${t.skills?.slice(0, 5).join(', ') || 'N/A'}`).join('\n')}

**Feedbacks Recentes:**
${feedbacks.slice(0, 20).map(f => `- Tipo: ${f.feedback_type}, Rating: ${f.rating}/5, Categoria: ${f.category}`).join('\n')}

**Metas:**
${goals.map(g => `- ${g.title}: ${g.status} (${g.progress}%)`).join('\n')}

Forneça análise em JSON:
{
  "summary": "Resumo executivo da saúde da equipe",
  "top_performers": [{"name": "...", "reason": "..."}],
  "areas_of_concern": [{"area": "...", "description": "...", "severity": "high|medium|low"}],
  "bottlenecks": [{"bottleneck": "...", "impact": "...", "recommendation": "..."}],
  "skill_gaps": [{"skill": "...", "impact": "...", "priority": "high|medium|low"}],
  "team_strengths": ["..."],
  "recommendations": [{"action": "...", "expected_impact": "...", "priority": "high|medium|low"}]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            top_performers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            areas_of_concern: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string" }
                }
              }
            },
            bottlenecks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  bottleneck: { type: "string" },
                  impact: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            skill_gaps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  impact: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            team_strengths: { type: "array", items: { type: "string" } },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  expected_impact: { type: "string" },
                  priority: { type: "string" }
                }
              }
            }
          }
        }
      });

      setInsights(response);
      toast.success('Análise concluída!');
    } catch (error) {
      toast.error('Erro ao gerar insights: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const severityColors = {
    high: 'text-red-400 bg-red-500/10 border-red-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    low: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Insights de Performance da Equipe</h3>
          <p className="text-sm text-slate-400">Análise com IA dos dados da equipe</p>
        </div>
        <Button
          onClick={generateInsights}
          disabled={analyzing}
          className="bg-gradient-to-r from-[#C7A763] to-[#00D4FF] hover:from-[#A88B4A] hover:to-[#00B8E0]"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Gerar Insights
            </>
          )}
        </Button>
      </div>

      {insights && (
        <div className="space-y-6">
          {/* Summary */}
          <GlowCard glowColor="gold" className="p-6">
            <h4 className="text-white font-semibold mb-3">Resumo Executivo</h4>
            <p className="text-slate-300">{insights.summary}</p>
          </GlowCard>

          {/* Top Performers */}
          {insights.top_performers?.length > 0 && (
            <GlowCard glowColor="cyan" className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
                <h4 className="text-white font-semibold">Destaques da Equipe</h4>
              </div>
              <div className="space-y-3">
                {insights.top_performers.map((performer, idx) => (
                  <div key={idx} className="bg-white/5 rounded-lg p-3">
                    <div className="text-white font-medium">{performer.name}</div>
                    <div className="text-sm text-slate-400 mt-1">{performer.reason}</div>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Bottlenecks */}
          {insights.bottlenecks?.length > 0 && (
            <GlowCard glowColor="mixed" className="p-6 border-red-500/20">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h4 className="text-white font-semibold">Gargalos Identificados</h4>
              </div>
              <div className="space-y-3">
                {insights.bottlenecks.map((bottleneck, idx) => (
                  <div key={idx} className="bg-red-500/5 rounded-lg p-4 border border-red-500/20">
                    <div className="text-red-400 font-medium mb-2">{bottleneck.bottleneck}</div>
                    <div className="text-sm text-slate-300 mb-2">
                      <span className="text-slate-500">Impacto:</span> {bottleneck.impact}
                    </div>
                    <div className="text-sm text-slate-300">
                      <span className="text-slate-500">Recomendação:</span> {bottleneck.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Areas of Concern */}
          {insights.areas_of_concern?.length > 0 && (
            <GlowCard className="p-6">
              <h4 className="text-white font-semibold mb-4">Áreas de Atenção</h4>
              <div className="space-y-2">
                {insights.areas_of_concern.map((concern, idx) => (
                  <div key={idx} className={`rounded-lg p-3 border ${severityColors[concern.severity]}`}>
                    <div className="font-medium mb-1">{concern.area}</div>
                    <div className="text-sm opacity-90">{concern.description}</div>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Skill Gaps */}
          {insights.skill_gaps?.length > 0 && (
            <GlowCard className="p-6">
              <h4 className="text-white font-semibold mb-4">Gaps de Habilidades</h4>
              <div className="grid md:grid-cols-2 gap-3">
                {insights.skill_gaps.map((gap, idx) => (
                  <div key={idx} className={`rounded-lg p-3 border ${severityColors[gap.priority]}`}>
                    <div className="font-medium mb-1">{gap.skill}</div>
                    <div className="text-sm opacity-90">{gap.impact}</div>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Recommendations */}
          {insights.recommendations?.length > 0 && (
            <GlowCard glowColor="gold" className="p-6">
              <h4 className="text-white font-semibold mb-4">Recomendações de Ação</h4>
              <div className="space-y-3">
                {insights.recommendations.map((rec, idx) => (
                  <div key={idx} className={`rounded-lg p-4 border ${severityColors[rec.priority]}`}>
                    <div className="font-medium mb-2">{rec.action}</div>
                    <div className="text-sm opacity-90">
                      <span className="text-slate-400">Impacto esperado:</span> {rec.expected_impact}
                    </div>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Team Strengths */}
          {insights.team_strengths?.length > 0 && (
            <GlowCard glowColor="cyan" className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#00D4FF]" />
                <h4 className="text-white font-semibold">Pontos Fortes da Equipe</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {insights.team_strengths.map((strength, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-full bg-[#00D4FF]/20 text-[#00D4FF] text-sm">
                    {strength}
                  </span>
                ))}
              </div>
            </GlowCard>
          )}
        </div>
      )}
    </div>
  );
}