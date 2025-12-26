import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Target, AlertTriangle, TrendingUp, Users, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function TalentAnalysis({ talents, ventures }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeSkillGaps = async () => {
    setAnalyzing(true);
    try {
      // Aggregate all skills
      const allSkills = [...new Set(talents.flatMap(t => t.skills || []))];
      
      // Calculate skill coverage
      const skillCoverage = allSkills.map(skill => ({
        skill,
        count: talents.filter(t => t.skills?.includes(skill)).length,
        levels: talents.filter(t => t.skills?.includes(skill)).map(t => t.level)
      }));

      // Prepare data for AI analysis
      const venturesByLayer = ventures.reduce((acc, v) => {
        acc[v.layer] = (acc[v.layer] || 0) + 1;
        return acc;
      }, {});

      const prompt = `
Analise os gaps de skills da organização:

PORTFOLIO:
${Object.entries(venturesByLayer).map(([layer, count]) => `- ${count} ${layer}`).join('\n')}

TALENTOS (${talents.length} total):
${talents.map(t => `
- ${t.talent_name} (${t.level} ${t.role})
  Skills: ${(t.skills || []).join(', ')}
  Alocação: ${t.allocation}%
  Performance: ${t.performance_score || 'N/A'}
`).join('\n')}

COBERTURA DE SKILLS:
${skillCoverage.map(s => `${s.skill}: ${s.count} pessoas (${s.levels.join(', ')})`).join('\n')}

Forneça análise em JSON:
- critical_gaps (skills críticos faltando)
- skill_saturation (skills com excesso)
- development_priorities (prioridades de desenvolvimento)
- hiring_recommendations (contratações recomendadas)
- skill_distribution (distribuição por senioridade)
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            critical_gaps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  impact: { type: "string" },
                  urgency: { type: "string" }
                }
              }
            },
            skill_saturation: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  count: { type: "number" },
                  recommendation: { type: "string" }
                }
              }
            },
            development_priorities: {
              type: "array",
              items: { type: "string" }
            },
            hiring_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role: { type: "string" },
                  priority: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            },
            skill_distribution: { type: "string" }
          }
        }
      });

      setAnalysis(response);
      toast.success('Análise concluída!');
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const urgencyColors = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-green-400'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#00D4FF]" />
          <h3 className="text-lg font-semibold text-white">Análise de Gaps de Skills</h3>
        </div>
        <Button
          onClick={analyzeSkillGaps}
          disabled={analyzing}
          className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            'Analisar Gaps'
          )}
        </Button>
      </div>

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Critical Gaps */}
          {analysis.critical_gaps?.length > 0 && (
            <GlowCard glowColor="cyan" className="p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Gaps Críticos
              </h4>
              <div className="space-y-3">
                {analysis.critical_gaps.map((gap, i) => (
                  <div key={i} className="p-4 rounded-lg bg-white/5 border border-red-400/20">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <span className="text-white font-medium">{gap.skill}</span>
                      <span className={`text-xs font-bold uppercase ${urgencyColors[gap.urgency?.toLowerCase()] || 'text-slate-400'}`}>
                        {gap.urgency}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{gap.impact}</p>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Hiring Recommendations */}
          {analysis.hiring_recommendations?.length > 0 && (
            <GlowCard glowColor="gold" className="p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C7A763]" />
                Recomendações de Contratação
              </h4>
              <div className="space-y-3">
                {analysis.hiring_recommendations.map((rec, i) => (
                  <div key={i} className="p-4 rounded-lg bg-white/5 border border-[#C7A763]/20">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <span className="text-white font-medium">{rec.role}</span>
                      <span className={`text-xs font-bold uppercase ${urgencyColors[rec.priority?.toLowerCase()] || 'text-slate-400'}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{rec.rationale}</p>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Development Priorities */}
          {analysis.development_priorities?.length > 0 && (
            <GlowCard glowColor="mixed" className="p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
                Prioridades de Desenvolvimento
              </h4>
              <ul className="space-y-2">
                {analysis.development_priorities.map((priority, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-[#C7A763] font-bold">{i + 1}.</span>
                    {priority}
                  </li>
                ))}
              </ul>
            </GlowCard>
          )}

          {/* Skill Saturation */}
          {analysis.skill_saturation?.length > 0 && (
            <GlowCard glowColor="cyan" className="p-6">
              <h4 className="text-white font-semibold mb-4">Skills com Saturação</h4>
              <div className="space-y-3">
                {analysis.skill_saturation.map((sat, i) => (
                  <div key={i} className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{sat.skill}</span>
                      <span className="text-sm text-[#00D4FF]">{sat.count} pessoas</span>
                    </div>
                    <p className="text-xs text-slate-400">{sat.recommendation}</p>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Distribution Analysis */}
          {analysis.skill_distribution && (
            <GlowCard glowColor="gold" className="p-6">
              <h4 className="text-white font-semibold mb-3">Distribuição por Senioridade</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {analysis.skill_distribution}
              </p>
            </GlowCard>
          )}
        </motion.div>
      )}

      {!analysis && !analyzing && (
        <div className="text-center py-12 text-slate-400">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Clique em "Analisar Gaps" para identificar oportunidades</p>
        </div>
      )}
    </div>
  );
}