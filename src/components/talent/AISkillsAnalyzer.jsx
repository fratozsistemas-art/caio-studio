import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, TrendingUp, AlertCircle, Users, Zap, Loader2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlowCard from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AISkillsAnalyzer() {
  const [analysis, setAnalysis] = useState(null);
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

  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Venture',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const { data: skills = [] } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Skill',
        operation: 'filter',
        query: { is_active: true }
      });
      return res.data?.data || [];
    }
  });

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise o ecossistema de talentos e habilidades da organização e forneça insights preditivos estratégicos:

**DADOS DO ECOSSISTEMA:**

**Talentos (${talents.length}):**
${talents.map(t => `- ${t.full_name}: ${t.current_position || 'N/A'}
  Skills: ${t.skills?.slice(0, 8).join(', ') || 'N/A'}
  Senioridade: ${t.seniority_level || 'N/A'}
  Experiência: ${t.experience_years || 'N/A'} anos`).join('\n')}

**Metas Ativas (${goals.filter(g => g.status !== 'completed').length}):**
${goals.filter(g => g.status !== 'completed').slice(0, 20).map(g => `- ${g.title} (${g.goal_type}, ${g.progress}%)`).join('\n')}

**Feedbacks Recentes (${feedbacks.length}):**
${feedbacks.slice(0, 30).map(f => `- Para talento: Rating ${f.rating}/5, Categoria: ${f.category}
  Áreas de melhoria: ${f.areas_for_improvement || 'N/A'}`).join('\n')}

**Ventures (${ventures.length}):**
${ventures.map(v => `- ${v.name}: ${v.description?.substring(0, 100) || 'N/A'}
  Layer: ${v.layer}, Status: ${v.status}
  Tech Stack: ${v.tech_stack ? Object.keys(v.tech_stack).join(', ') : 'N/A'}`).join('\n')}

**Skills Disponíveis no Sistema (${skills.length}):**
${skills.map(s => `- ${s.name} (${s.category})`).join(', ')}

**ANÁLISE SOLICITADA:**

1. **Desenvolvimento de Habilidades por Talento**: Para cada talento, sugira 2-3 habilidades prioritárias para desenvolvimento com base em:
   - Suas metas atuais
   - Feedbacks recebidos (especialmente áreas de melhoria)
   - Gaps em relação a seu cargo/senioridade

2. **Gaps de Competências Futuras**: Identifique 5-7 habilidades críticas que a organização precisará nos próximos 12-24 meses, considerando:
   - Tendências tecnológicas atuais (2025: IA, Cloud Native, Blockchain, Web3, etc)
   - Objetivos e natureza das ventures (especialmente as em scaling/desenvolvimento)
   - Evolução necessária da stack tecnológica

3. **Recomendações de Matching Talento-Projeto**: Para cada venture, sugira os 2-3 talentos mais adequados com base em:
   - Skills atuais e proficiência
   - Experiência e senioridade
   - Fit com a natureza do projeto

Retorne em JSON:
{
  "talent_development": [
    {
      "talent_name": "...",
      "current_role": "...",
      "recommended_skills": [
        {
          "skill": "...",
          "priority": "high|medium|low",
          "reasoning": "...",
          "estimated_time_to_proficiency": "...",
          "resources": ["..."]
        }
      ]
    }
  ],
  "future_skill_gaps": [
    {
      "skill": "...",
      "urgency": "critical|high|medium",
      "reasoning": "...",
      "market_trend": "...",
      "recommended_actions": ["..."],
      "timeline": "..."
    }
  ],
  "talent_project_matching": [
    {
      "venture_name": "...",
      "recommended_talents": [
        {
          "talent_name": "...",
          "match_score": 85,
          "matching_skills": ["..."],
          "value_proposition": "...",
          "potential_contribution": "..."
        }
      ]
    }
  ],
  "strategic_insights": {
    "overall_team_health": "...",
    "strengths": ["..."],
    "risks": ["..."],
    "opportunities": ["..."]
  }
}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            talent_development: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  talent_name: { type: "string" },
                  current_role: { type: "string" },
                  recommended_skills: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        skill: { type: "string" },
                        priority: { type: "string" },
                        reasoning: { type: "string" },
                        estimated_time_to_proficiency: { type: "string" },
                        resources: { type: "array", items: { type: "string" } }
                      }
                    }
                  }
                }
              }
            },
            future_skill_gaps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  urgency: { type: "string" },
                  reasoning: { type: "string" },
                  market_trend: { type: "string" },
                  recommended_actions: { type: "array", items: { type: "string" } },
                  timeline: { type: "string" }
                }
              }
            },
            talent_project_matching: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  venture_name: { type: "string" },
                  recommended_talents: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        talent_name: { type: "string" },
                        match_score: { type: "number" },
                        matching_skills: { type: "array", items: { type: "string" } },
                        value_proposition: { type: "string" },
                        potential_contribution: { type: "string" }
                      }
                    }
                  }
                }
              }
            },
            strategic_insights: {
              type: "object",
              properties: {
                overall_team_health: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                risks: { type: "array", items: { type: "string" } },
                opportunities: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      setAnalysis(response);
      toast.success('Análise preditiva concluída!');
    } catch (error) {
      toast.error('Erro na análise: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const urgencyColors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  };

  const priorityColors = {
    high: 'bg-red-400/20 text-red-400',
    medium: 'bg-yellow-400/20 text-yellow-400',
    low: 'bg-blue-400/20 text-blue-400'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Análise Preditiva de Habilidades</h3>
          <p className="text-sm text-slate-400">IA para desenvolvimento estratégico de talentos</p>
        </div>
        <Button
          onClick={runAnalysis}
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
              <Sparkles className="w-4 h-4 mr-2" />
              Executar Análise
            </>
          )}
        </Button>
      </div>

      {analysis && (
        <div className="space-y-6">
          {/* Strategic Insights */}
          {analysis.strategic_insights && (
            <GlowCard glowColor="gold" className="p-6">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#C7A763]" />
                Visão Estratégica
              </h4>
              <p className="text-slate-300 mb-4">{analysis.strategic_insights.overall_team_health}</p>
              
              <div className="grid md:grid-cols-3 gap-4">
                {analysis.strategic_insights.strengths?.length > 0 && (
                  <div>
                    <div className="text-xs text-green-400 mb-2">Forças</div>
                    <ul className="space-y-1">
                      {analysis.strategic_insights.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-slate-300">• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.strategic_insights.risks?.length > 0 && (
                  <div>
                    <div className="text-xs text-red-400 mb-2">Riscos</div>
                    <ul className="space-y-1">
                      {analysis.strategic_insights.risks.map((r, i) => (
                        <li key={i} className="text-sm text-slate-300">• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.strategic_insights.opportunities?.length > 0 && (
                  <div>
                    <div className="text-xs text-blue-400 mb-2">Oportunidades</div>
                    <ul className="space-y-1">
                      {analysis.strategic_insights.opportunities.map((o, i) => (
                        <li key={i} className="text-sm text-slate-300">• {o}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </GlowCard>
          )}

          {/* Future Skill Gaps */}
          {analysis.future_skill_gaps?.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Gaps de Competências Futuras
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.future_skill_gaps.map((gap, idx) => (
                  <GlowCard key={idx} className={`p-5 border ${urgencyColors[gap.urgency]}`}>
                    <div className="flex items-start justify-between mb-3">
                      <h5 className="text-white font-semibold">{gap.skill}</h5>
                      <Badge className={urgencyColors[gap.urgency]}>
                        {gap.urgency}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-slate-400">Justificativa:</span>
                        <p className="text-slate-300 mt-1">{gap.reasoning}</p>
                      </div>
                      
                      <div>
                        <span className="text-slate-400">Tendência de Mercado:</span>
                        <p className="text-slate-300 mt-1">{gap.market_trend}</p>
                      </div>

                      {gap.timeline && (
                        <div>
                          <span className="text-slate-400">Prazo:</span>
                          <p className="text-slate-300 mt-1">{gap.timeline}</p>
                        </div>
                      )}
                      
                      {gap.recommended_actions?.length > 0 && (
                        <div>
                          <span className="text-slate-400">Ações Recomendadas:</span>
                          <ul className="mt-1 space-y-1">
                            {gap.recommended_actions.map((action, i) => (
                              <li key={i} className="text-slate-300">• {action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </GlowCard>
                ))}
              </div>
            </div>
          )}

          {/* Talent Development Plans */}
          {analysis.talent_development?.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#C7A763]" />
                Planos de Desenvolvimento por Talento
              </h4>
              <div className="space-y-3">
                {analysis.talent_development.map((plan, idx) => (
                  <GlowCard key={idx} className="p-5">
                    <div className="mb-4">
                      <h5 className="text-white font-semibold">{plan.talent_name}</h5>
                      <p className="text-sm text-slate-400">{plan.current_role}</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {plan.recommended_skills?.map((skill, i) => (
                        <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-white font-medium text-sm">{skill.skill}</span>
                            <Badge className={priorityColors[skill.priority]}>
                              {skill.priority}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-slate-400 mb-2">{skill.reasoning}</p>
                          
                          {skill.estimated_time_to_proficiency && (
                            <div className="text-xs text-slate-500 mb-2">
                              Tempo estimado: {skill.estimated_time_to_proficiency}
                            </div>
                          )}
                          
                          {skill.resources?.length > 0 && (
                            <div className="text-xs">
                              <span className="text-slate-400">Recursos:</span>
                              <ul className="mt-1 space-y-0.5">
                                {skill.resources.slice(0, 2).map((resource, j) => (
                                  <li key={j} className="text-slate-500">• {resource}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </GlowCard>
                ))}
              </div>
            </div>
          )}

          {/* Talent-Project Matching */}
          {analysis.talent_project_matching?.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00D4FF]" />
                Matching Talento-Projeto
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.talent_project_matching.map((match, idx) => (
                  <GlowCard key={idx} glowColor="cyan" className="p-5">
                    <h5 className="text-white font-semibold mb-4">{match.venture_name}</h5>
                    
                    <div className="space-y-3">
                      {match.recommended_talents?.map((talent, i) => (
                        <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-white font-medium">{talent.talent_name}</span>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-[#00D4FF]" />
                              <span className="text-sm font-semibold text-[#00D4FF]">
                                {talent.match_score}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-slate-400">Skills relevantes:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {talent.matching_skills?.map((skill, j) => (
                                  <span key={j} className="bg-[#00D4FF]/20 text-[#00D4FF] px-2 py-0.5 rounded">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-slate-400">Proposta de valor:</span>
                              <p className="text-slate-300 mt-1">{talent.value_proposition}</p>
                            </div>
                            
                            {talent.potential_contribution && (
                              <div>
                                <span className="text-slate-400">Contribuição potencial:</span>
                                <p className="text-slate-300 mt-1">{talent.potential_contribution}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlowCard>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}