import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlowCard from '@/components/ui/GlowCard';
import { TrendingUp, Loader2, Award, ArrowRight, CheckCircle, Circle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function CareerProgressionPath({ talentId = null }) {
  const [selectedTalent, setSelectedTalent] = useState(talentId || '');
  const [progression, setProgression] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Fetch talents
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

  // Fetch roles
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Role',
        operation: 'filter',
        query: { is_active: true }
      });
      return res.data?.data || [];
    }
  });

  const generateProgression = async () => {
    if (!selectedTalent) {
      toast.error('Selecione um talento');
      return;
    }

    setGenerating(true);
    try {
      const talent = talents.find(t => t.id === selectedTalent);
      if (!talent) return;

      // Get talent's current skills and proficiency
      const currentSkills = talent.skills || [];
      const talentSkillProficiency = talent.skill_proficiency || {};

      // Get talent's ventures and roles
      const venturesRes = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTalent',
        operation: 'filter',
        query: { talent_id: selectedTalent }
      });
      const ventures = venturesRes.data?.data || [];

      // Get talent's goals and achievements
      const [goalsRes, badgesRes, feedbackRes] = await Promise.all([
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'TalentGoal',
          operation: 'filter',
          query: { talent_id: selectedTalent }
        }),
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'TalentBadge',
          operation: 'filter',
          query: { talent_id: selectedTalent }
        }),
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'TalentFeedback',
          operation: 'filter',
          query: { talent_id: selectedTalent }
        })
      ]);

      const goals = goalsRes.data?.data || [];
      const badges = badgesRes.data?.data || [];
      const feedbacks = feedbackRes.data?.data || [];

      // Generate AI progression path
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Gere um plano detalhado de progressão de carreira para o talento.

Perfil do Talento:
- Nome: ${talent.full_name}
- Cargo Atual: ${talent.current_position || 'N/A'}
- Senioridade Atual: ${talent.seniority_level || 'N/A'}
- Skills: ${currentSkills.join(', ') || 'Nenhuma'}
- Proficiências: ${Object.entries(talentSkillProficiency).map(([skill, level]) => `${skill}: ${level}/5`).join(', ') || 'N/A'}
- Anos de Experiência: ${talent.experience_years || 'N/A'}

Conquistas:
- Metas completadas: ${goals.filter(g => g.status === 'completed').length}/${goals.length}
- Badges ganhas: ${badges.length}
- Feedbacks recebidos: ${feedbacks.length} (Rating médio: ${feedbacks.length > 0 ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length).toFixed(1) : 'N/A'})

Ventures Alocadas: ${ventures.map(v => v.role).join(', ') || 'Nenhuma'}

Roles disponíveis no sistema:
${roles.map(r => `- ${r.name} (${r.seniority_level}) - ${r.description}`).join('\n')}

Com base nessas informações, crie um plano de progressão de carreira realista e acionável.

Retorne um JSON com:
- current_position: análise da posição atual (texto)
- career_stages: array de 4-5 estágios de carreira, cada um com:
  - title: nome do cargo/posição
  - seniority: nível de senioridade
  - timeframe: prazo estimado para atingir
  - key_responsibilities: array de 3-4 responsabilidades principais
  - required_skills: array de 5-7 skills necessárias
  - achievements_needed: array de 2-3 conquistas necessárias
  - completed: boolean (true apenas para o estágio atual)
- skills_to_develop: array de 6-8 skills críticas para desenvolver para avançar
- milestones: array de 5-7 marcos importantes no caminho, cada um com:
  - title: nome do marco
  - description: descrição breve
  - target_date: prazo estimado (ex: "6 meses", "1 ano", "2 anos")
  - status: not_started/in_progress/completed
- recommended_moves: array de 2-3 movimentos estratégicos recomendados (texto)
- potential_blockers: array de 2-3 possíveis bloqueadores para progressão (texto)`,
        response_json_schema: {
          type: "object",
          properties: {
            current_position: { type: "string" },
            career_stages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  seniority: { type: "string" },
                  timeframe: { type: "string" },
                  key_responsibilities: { type: "array", items: { type: "string" } },
                  required_skills: { type: "array", items: { type: "string" } },
                  achievements_needed: { type: "array", items: { type: "string" } },
                  completed: { type: "boolean" }
                }
              }
            },
            skills_to_develop: { type: "array", items: { type: "string" } },
            milestones: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  target_date: { type: "string" },
                  status: { type: "string" }
                }
              }
            },
            recommended_moves: { type: "array", items: { type: "string" } },
            potential_blockers: { type: "array", items: { type: "string" } }
          }
        }
      });

      setProgression({
        talent: talent,
        data: result,
        generated_at: new Date().toISOString()
      });
      toast.success('Plano de progressão gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar progressão: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const statusIcons = {
    completed: <CheckCircle className="w-5 h-5 text-green-400" />,
    in_progress: <Circle className="w-5 h-5 text-yellow-400" />,
    not_started: <Circle className="w-5 h-5 text-slate-600" />
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="mixed" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-[#C7A763]" />
          <div>
            <h3 className="text-white font-semibold text-lg">Progressão de Carreira</h3>
            <p className="text-slate-400 text-sm">Visualize e planeje o caminho de crescimento</p>
          </div>
        </div>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-white text-sm mb-2 block">Selecionar Talento</label>
            <Select value={selectedTalent} onValueChange={setSelectedTalent}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Escolha um talento..." />
              </SelectTrigger>
              <SelectContent>
                {talents.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name} - {t.current_position || 'Sem cargo'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={generateProgression}
            disabled={generating || !selectedTalent}
            className="bg-gradient-to-r from-[#C7A763] to-[#00D4FF] hover:from-[#A88B4A] hover:to-[#00B8E6]"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Plano
              </>
            )}
          </Button>
        </div>
      </GlowCard>

      {progression && (
        <div className="space-y-6">
          {/* Current Position */}
          <GlowCard glowColor="cyan" className="p-6">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#00D4FF]" />
              Posição Atual: {progression.talent.full_name}
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">{progression.data.current_position}</p>
          </GlowCard>

          {/* Career Stages Path */}
          <div>
            <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#C7A763]" />
              Caminho de Progressão
            </h4>
            <div className="space-y-4">
              {progression.data.career_stages.map((stage, idx) => (
                <div key={idx} className="relative">
                  {idx < progression.data.career_stages.length - 1 && (
                    <div className="absolute left-6 top-full h-4 w-0.5 bg-gradient-to-b from-[#C7A763] to-transparent" />
                  )}
                  <GlowCard 
                    glowColor={stage.completed ? "gold" : "cyan"} 
                    className={`p-5 ${stage.completed ? 'border-[#C7A763]' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        stage.completed 
                          ? 'bg-[#C7A763]/20 border-2 border-[#C7A763]' 
                          : 'bg-white/5 border-2 border-white/10'
                      }`}>
                        {stage.completed ? (
                          <CheckCircle className="w-6 h-6 text-[#C7A763]" />
                        ) : (
                          <span className="text-white font-semibold">{idx + 1}</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h5 className="text-white font-semibold text-lg mb-1">{stage.title}</h5>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-[#00D4FF]/20 text-[#00D4FF]">
                                {stage.seniority}
                              </Badge>
                              <span className="text-slate-400 text-sm">{stage.timeframe}</span>
                            </div>
                          </div>
                          {stage.completed && (
                            <Badge className="bg-[#C7A763]/20 text-[#C7A763]">
                              Posição Atual
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h6 className="text-white text-sm font-semibold mb-2">📋 Responsabilidades Principais</h6>
                            <ul className="space-y-1">
                              {stage.key_responsibilities.map((resp, i) => (
                                <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                                  <span className="text-[#C7A763] mt-1">•</span>
                                  <span>{resp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h6 className="text-white text-sm font-semibold mb-2">🎯 Skills Necessárias</h6>
                            <div className="flex flex-wrap gap-2">
                              {stage.required_skills.map((skill, i) => (
                                <Badge key={i} className="bg-white/5 text-slate-300 text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h6 className="text-white text-sm font-semibold mb-2">🏆 Conquistas Necessárias</h6>
                            <ul className="space-y-1">
                              {stage.achievements_needed.map((achievement, i) => (
                                <li key={i} className="text-slate-400 text-sm flex items-start gap-2">
                                  <span className="text-[#00D4FF] mt-1">✓</span>
                                  <span>{achievement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </GlowCard>
                </div>
              ))}
            </div>
          </div>

          {/* Skills to Develop */}
          <GlowCard glowColor="gold" className="p-6">
            <h4 className="text-white font-semibold mb-4">🎓 Skills Críticas para Desenvolver</h4>
            <div className="flex flex-wrap gap-2">
              {progression.data.skills_to_develop.map((skill, idx) => (
                <Badge key={idx} className="bg-[#C7A763]/20 text-[#C7A763] px-3 py-1.5">
                  {skill}
                </Badge>
              ))}
            </div>
          </GlowCard>

          {/* Milestones */}
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#C7A763]" />
              Marcos Importantes
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              {progression.data.milestones.map((milestone, idx) => (
                <GlowCard key={idx} glowColor="cyan" className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    {statusIcons[milestone.status]}
                    <div className="flex-1">
                      <h5 className="text-white font-semibold mb-1">{milestone.title}</h5>
                      <Badge className="bg-white/5 text-slate-400 text-xs">
                        {milestone.target_date}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm">{milestone.description}</p>
                </GlowCard>
              ))}
            </div>
          </div>

          {/* Recommended Moves */}
          <GlowCard glowColor="mixed" className="p-6">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-[#C7A763]" />
              Movimentos Estratégicos Recomendados
            </h4>
            <ul className="space-y-3">
              {progression.data.recommended_moves.map((move, idx) => (
                <li key={idx} className="text-slate-300 text-sm flex items-start gap-2 bg-white/5 rounded-lg p-3">
                  <span className="text-[#C7A763] mt-1">{idx + 1}.</span>
                  <span>{move}</span>
                </li>
              ))}
            </ul>
          </GlowCard>

          {/* Potential Blockers */}
          <GlowCard glowColor="gold" className="p-6">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              ⚠️ Possíveis Bloqueadores
            </h4>
            <ul className="space-y-3">
              {progression.data.potential_blockers.map((blocker, idx) => (
                <li key={idx} className="text-slate-300 text-sm flex items-start gap-2 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                  <span className="text-red-400 mt-1">!</span>
                  <span>{blocker}</span>
                </li>
              ))}
            </ul>
          </GlowCard>
        </div>
      )}
    </div>
  );
}