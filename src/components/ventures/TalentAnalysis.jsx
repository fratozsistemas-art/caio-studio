import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Loader2, Target, TrendingUp, Users, Lightbulb } from 'lucide-react';
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function TalentAnalysis({ talents, ventures }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeTalentAllocation = async () => {
    setAnalyzing(true);
    try {
      // Prepare data
      const talentData = talents.map(t => ({
        name: t.talent_name,
        current_venture: ventures.find(v => v.id === t.venture_id)?.name,
        role: t.role,
        level: t.level,
        skills: t.skills,
        allocation: t.allocation,
        performance_score: t.performance_score
      }));

      const ventureData = ventures.map(v => ({
        name: v.name,
        layer: v.layer,
        status: v.status,
        category: v.category,
        team_size: v.team_size
      }));

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em gestão de talentos e alocação de recursos humanos.

TALENTOS DISPONÍVEIS:
${JSON.stringify(talentData, null, 2)}

VENTURES NO PORTFOLIO:
${JSON.stringify(ventureData, null, 2)}

Analise e forneça:

1. REALOCAÇÕES SUGERIDAS: Liste talentos que poderiam ser melhor alocados em outras ventures, explicando os critérios (match de skills, nível de senioridade, performance, necessidades da venture).

2. GAPS DE SKILLS: Identifique skills críticas que estão faltando no portfolio para atender às necessidades das ventures.

3. OPORTUNIDADES DE OTIMIZAÇÃO: Identifique talentos subutilizados ou oportunidades de cross-functional teams.

4. DESENVOLVIMENTO PRIORITÁRIO: Sugira quais talentos devem desenvolver quais skills para aumentar a versatilidade do time.

5. RECOMENDAÇÕES DE CONTRATAÇÃO: Baseado nos gaps, sugira perfis específicos para novas contratações (role, level, skills essenciais).

Seja específico e prático nas recomendações.`,
        response_json_schema: {
          type: "object",
          properties: {
            reallocations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  talent_name: { type: "string" },
                  current_venture: { type: "string" },
                  suggested_venture: { type: "string" },
                  reason: { type: "string" },
                  impact_score: { type: "number" }
                }
              }
            },
            skill_gaps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  ventures_affected: { type: "array", items: { type: "string" } },
                  priority: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            optimization_opportunities: {
              type: "array",
              items: { type: "string" }
            },
            development_priorities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  talent_name: { type: "string" },
                  skills_to_develop: { type: "array", items: { type: "string" } },
                  rationale: { type: "string" }
                }
              }
            },
            hiring_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role: { type: "string" },
                  level: { type: "string" },
                  essential_skills: { type: "array", items: { type: "string" } },
                  target_ventures: { type: "array", items: { type: "string" } },
                  priority: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAnalysis(response);
      toast.success('Análise concluída!');
    } catch (error) {
      toast.error('Erro ao analisar: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="purple" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Análise Inteligente de Talentos</h3>
          </div>
          <Button
            onClick={analyzeTalentAllocation}
            disabled={analyzing || !talents.length}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Analisar Alocação
              </>
            )}
          </Button>
        </div>

        {!analysis && !analyzing && (
          <div className="text-center py-8 text-slate-400">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Clique para analisar a alocação de talentos com IA</p>
          </div>
        )}
      </GlowCard>

      {/* Reallocations */}
      {analysis?.reallocations && analysis.reallocations.length > 0 && (
        <GlowCard glowColor="cyan" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-[#00D4FF]" />
            <h4 className="text-lg font-bold text-white">Realocações Sugeridas</h4>
          </div>
          <div className="space-y-3">
            {analysis.reallocations.map((realloc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-white font-semibold">{realloc.talent_name}</span>
                    <div className="text-xs text-slate-400 mt-1">
                      {realloc.current_venture} → {realloc.suggested_venture}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#00D4FF]">
                      Impacto: {realloc.impact_score}/10
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-400">{realloc.reason}</p>
              </motion.div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Skill Gaps */}
      {analysis?.skill_gaps && analysis.skill_gaps.length > 0 && (
        <GlowCard glowColor="gold" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-[#C7A763]" />
            <h4 className="text-lg font-bold text-white">Gaps de Skills Críticos</h4>
          </div>
          <div className="space-y-3">
            {analysis.skill_gaps.map((gap, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-white font-semibold">{gap.skill}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    gap.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    gap.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {gap.priority}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-2">{gap.description}</p>
                <div className="flex flex-wrap gap-1">
                  {gap.ventures_affected?.map((v, j) => (
                    <span key={j} className="text-xs bg-white/5 px-2 py-1 rounded text-white/60">
                      {v}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Optimization Opportunities */}
      {analysis?.optimization_opportunities && analysis.optimization_opportunities.length > 0 && (
        <GlowCard glowColor="mixed" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h4 className="text-lg font-bold text-white">Oportunidades de Otimização</h4>
          </div>
          <ul className="space-y-2">
            {analysis.optimization_opportunities.map((opp, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="text-sm text-slate-300 flex items-start gap-2"
              >
                <span className="text-yellow-400 mt-1">•</span>
                <span>{opp}</span>
              </motion.li>
            ))}
          </ul>
        </GlowCard>
      )}

      {/* Development Priorities */}
      {analysis?.development_priorities && analysis.development_priorities.length > 0 && (
        <GlowCard glowColor="cyan" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
            <h4 className="text-lg font-bold text-white">Prioridades de Desenvolvimento</h4>
          </div>
          <div className="space-y-3">
            {analysis.development_priorities.map((dev, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="font-semibold text-white mb-2">{dev.talent_name}</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {dev.skills_to_develop?.map((skill, j) => (
                    <span key={j} className="text-xs bg-[#00D4FF]/20 text-[#00D4FF] px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-slate-400">{dev.rationale}</p>
              </motion.div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Hiring Recommendations */}
      {analysis?.hiring_recommendations && analysis.hiring_recommendations.length > 0 && (
        <GlowCard glowColor="gold" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-[#C7A763]" />
            <h4 className="text-lg font-bold text-white">Recomendações de Contratação</h4>
          </div>
          <div className="space-y-3">
            {analysis.hiring_recommendations.map((hire, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-white font-semibold">{hire.role}</span>
                    <span className="text-slate-400 text-sm ml-2">({hire.level})</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    hire.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    hire.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {hire.priority}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {hire.essential_skills?.map((skill, j) => (
                    <span key={j} className="text-xs bg-[#C7A763]/20 text-[#C7A763] px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-slate-500">
                  Para: {hire.target_ventures?.join(', ')}
                </div>
              </motion.div>
            ))}
          </div>
        </GlowCard>
      )}
    </div>
  );
}