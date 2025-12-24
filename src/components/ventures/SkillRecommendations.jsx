import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, TrendingUp, Book, Award } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SkillRecommendations({ talents }) {
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  const generateRecommendations = async () => {
    if (!selectedTalent) {
      toast.error('Selecione um talento');
      return;
    }

    const talent = talents.find(t => t.id === selectedTalent);
    if (!talent) return;

    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em desenvolvimento de carreira e tendências de mercado tech.

PERFIL DO TALENTO:
- Nome: ${talent.talent_name}
- Role: ${talent.role}
- Level: ${talent.level}
- Skills Atuais: ${talent.skills?.join(', ')}
- Performance Score: ${talent.performance_score || 'N/A'}

Com base em tendências de mercado 2025, necessidades futuras de venture studios, e o perfil atual do talento, forneça:

1. SKILLS EMERGENTES: Liste 5-7 skills emergentes que este talento deveria desenvolver, considerando sua trajetória de carreira e o mercado.

2. RECURSOS DE APRENDIZADO: Para cada skill sugerida, recomende recursos práticos (cursos, certificações, projetos práticos).

3. ROADMAP DE DESENVOLVIMENTO: Estruture um plano de desenvolvimento de 6-12 meses, priorizando skills por trimestre.

4. CERTIFICAÇÕES RELEVANTES: Sugira certificações profissionais que agregariam valor ao perfil.

5. PROJETOS PRÁTICOS: Sugira projetos hands-on que o talento pode fazer para desenvolver as skills recomendadas.

Seja específico e prático, considerando o nível atual do talento.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            emerging_skills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  relevance: { type: "string" },
                  market_demand: { type: "string" },
                  time_to_learn: { type: "string" }
                }
              }
            },
            learning_resources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  resources: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        type: { type: "string" },
                        url: { type: "string" },
                        duration: { type: "string" }
                      }
                    }
                  }
                }
              }
            },
            development_roadmap: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  quarter: { type: "string" },
                  focus_skills: { type: "array", items: { type: "string" } },
                  milestones: { type: "array", items: { type: "string" } }
                }
              }
            },
            certifications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  provider: { type: "string" },
                  relevance: { type: "string" },
                  estimated_cost: { type: "string" }
                }
              }
            },
            practical_projects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  project: { type: "string" },
                  skills_developed: { type: "array", items: { type: "string" } },
                  complexity: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });

      setRecommendations(response);
      toast.success('Recomendações geradas!');
    } catch (error) {
      toast.error('Erro ao gerar recomendações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="gold" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-5 h-5 text-[#C7A763]" />
          <h3 className="text-xl font-bold text-white">Recomendações de Desenvolvimento</h3>
        </div>

        <div className="flex gap-3">
          <Select value={selectedTalent} onValueChange={setSelectedTalent}>
            <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecione um talento" />
            </SelectTrigger>
            <SelectContent>
              {talents.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.talent_name} - {t.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={generateRecommendations}
            disabled={loading || !selectedTalent}
            className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </Button>
        </div>
      </GlowCard>

      {/* Emerging Skills */}
      {recommendations?.emerging_skills && (
        <GlowCard glowColor="cyan" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
            <h4 className="text-lg font-bold text-white">Skills Emergentes</h4>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {recommendations.emerging_skills.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-white font-semibold">{item.skill}</span>
                  <span className="text-xs bg-[#00D4FF]/20 text-[#00D4FF] px-2 py-1 rounded">
                    {item.time_to_learn}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-2">{item.relevance}</p>
                <div className="text-xs text-slate-500">Demanda: {item.market_demand}</div>
              </motion.div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Learning Resources */}
      {recommendations?.learning_resources && (
        <GlowCard glowColor="mixed" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Book className="w-5 h-5 text-purple-400" />
            <h4 className="text-lg font-bold text-white">Recursos de Aprendizado</h4>
          </div>
          <div className="space-y-4">
            {recommendations.learning_resources.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h5 className="text-white font-semibold mb-3">{item.skill}</h5>
                <div className="space-y-2">
                  {item.resources?.map((resource, j) => (
                    <div key={j} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                          {resource.type}
                        </span>
                        <span className="text-sm text-white">{resource.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{resource.duration}</span>
                        {resource.url && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#00D4FF] hover:underline"
                          >
                            Link
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Development Roadmap */}
      {recommendations?.development_roadmap && (
        <GlowCard glowColor="gold" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-[#C7A763]" />
            <h4 className="text-lg font-bold text-white">Roadmap de Desenvolvimento</h4>
          </div>
          <div className="space-y-4">
            {recommendations.development_roadmap.map((quarter, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <h5 className="text-[#C7A763] font-semibold mb-3">{quarter.quarter}</h5>
                <div className="mb-3">
                  <span className="text-xs text-slate-400 block mb-2">Foco em Skills:</span>
                  <div className="flex flex-wrap gap-2">
                    {quarter.focus_skills?.map((skill, j) => (
                      <span key={j} className="text-xs bg-[#C7A763]/20 text-[#C7A763] px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-2">Milestones:</span>
                  <ul className="space-y-1">
                    {quarter.milestones?.map((milestone, j) => (
                      <li key={j} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-[#C7A763]">•</span>
                        <span>{milestone}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Certifications */}
      {recommendations?.certifications && (
        <GlowCard glowColor="cyan" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-5 h-5 text-[#00D4FF]" />
            <h4 className="text-lg font-bold text-white">Certificações Recomendadas</h4>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {recommendations.certifications.map((cert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-white font-semibold">{cert.name}</div>
                    <div className="text-xs text-slate-400">{cert.provider}</div>
                  </div>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                    {cert.estimated_cost}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{cert.relevance}</p>
              </motion.div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Practical Projects */}
      {recommendations?.practical_projects && (
        <GlowCard glowColor="mixed" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h4 className="text-lg font-bold text-white">Projetos Práticos</h4>
          </div>
          <div className="space-y-3">
            {recommendations.practical_projects.map((project, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-white font-semibold">{project.project}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    project.complexity === 'high' ? 'bg-red-500/20 text-red-400' :
                    project.complexity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {project.complexity}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-2">{project.description}</p>
                <div className="flex flex-wrap gap-1">
                  {project.skills_developed?.map((skill, j) => (
                    <span key={j} className="text-xs bg-white/5 px-2 py-1 rounded text-white/60">
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </GlowCard>
      )}
    </div>
  );
}