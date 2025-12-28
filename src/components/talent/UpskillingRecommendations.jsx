import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlowCard from '@/components/ui/GlowCard';
import { GraduationCap, Loader2, ExternalLink, Sparkles, BookOpen, Award, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function UpskillingRecommendations({ talentId = null }) {
  const [selectedTalent, setSelectedTalent] = useState(talentId || '');
  const [recommendations, setRecommendations] = useState(null);
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

  // Fetch skills
  const { data: allSkills = [] } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Skill',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const generateRecommendations = async () => {
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

      // Identify skill gaps (skills the talent doesn't have or has low proficiency)
      const skillGaps = allSkills.filter(skill => {
        const proficiency = talentSkillProficiency[skill.name] || 0;
        return proficiency < 3; // Below intermediate level
      });

      // Get talent's ventures and roles
      const venturesRes = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTalent',
        operation: 'filter',
        query: { talent_id: selectedTalent }
      });
      const ventures = venturesRes.data?.data || [];

      // Get talent's goals
      const goalsRes = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'TalentGoal',
        operation: 'filter',
        query: { talent_id: selectedTalent }
      });
      const goals = goalsRes.data?.data || [];

      // Generate AI recommendations
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Gere recomendações personalizadas de upskilling para o talento.

Perfil do Talento:
- Nome: ${talent.full_name}
- Cargo Atual: ${talent.current_position || 'N/A'}
- Senioridade: ${talent.seniority_level || 'N/A'}
- Skills Atuais: ${currentSkills.join(', ') || 'Nenhuma registrada'}
- Proficiências: ${Object.entries(talentSkillProficiency).map(([skill, level]) => `${skill}: ${level}/5`).join(', ') || 'N/A'}

Lacunas de Habilidades Identificadas:
${skillGaps.map(s => `- ${s.name} (${s.category}) - Proficiência atual: ${talentSkillProficiency[s.name] || 0}/5`).join('\n')}

Ventures Alocadas: ${ventures.length > 0 ? ventures.map(v => v.role).join(', ') : 'Nenhuma'}

Metas Ativas:
${goals.filter(g => g.status !== 'completed').map(g => `- ${g.title} (${g.goal_type})`).join('\n') || 'Nenhuma'}

Com base nessas informações, gere recomendações de cursos, treinamentos e recursos de aprendizado.

Retorne um JSON com:
- priority_skills: array de 5-7 habilidades prioritárias para desenvolver
- courses: array de 5-8 cursos recomendados, cada um com:
  - title: nome do curso
  - provider: plataforma (Udemy, Coursera, LinkedIn Learning, Alura, etc)
  - skill: skill que desenvolve
  - level: nível (beginner/intermediate/advanced)
  - duration: duração estimada
  - url: URL fictícia baseada no provider e título
  - priority: alta/média/baixa
  - reason: por que esse curso é recomendado (1 frase)
- learning_path: caminho de aprendizado sugerido (texto de 2-3 parágrafos)
- quick_wins: array de 3-4 ações rápidas que o talento pode fazer para começar a melhorar
- long_term_goals: array de 2-3 objetivos de longo prazo de desenvolvimento`,
        response_json_schema: {
          type: "object",
          properties: {
            priority_skills: { type: "array", items: { type: "string" } },
            courses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  provider: { type: "string" },
                  skill: { type: "string" },
                  level: { type: "string" },
                  duration: { type: "string" },
                  url: { type: "string" },
                  priority: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            learning_path: { type: "string" },
            quick_wins: { type: "array", items: { type: "string" } },
            long_term_goals: { type: "array", items: { type: "string" } }
          }
        }
      });

      setRecommendations({
        talent: talent,
        data: result,
        generated_at: new Date().toISOString()
      });
      toast.success('Recomendações geradas com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar recomendações: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const priorityColors = {
    alta: 'bg-red-400/20 text-red-400',
    média: 'bg-yellow-400/20 text-yellow-400',
    baixa: 'bg-green-400/20 text-green-400'
  };

  const levelColors = {
    beginner: 'bg-blue-400/20 text-blue-400',
    intermediate: 'bg-purple-400/20 text-purple-400',
    advanced: 'bg-orange-400/20 text-orange-400'
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="gold" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <GraduationCap className="w-6 h-6 text-[#C7A763]" />
          <div>
            <h3 className="text-white font-semibold text-lg">Sistema de Upskilling</h3>
            <p className="text-slate-400 text-sm">Recomendações personalizadas baseadas em skill gaps</p>
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
            onClick={generateRecommendations}
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
                Gerar Recomendações
              </>
            )}
          </Button>
        </div>
      </GlowCard>

      {recommendations && (
        <div className="space-y-6">
          {/* Priority Skills */}
          <GlowCard glowColor="cyan" className="p-6">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
              Habilidades Prioritárias para {recommendations.talent.full_name}
            </h4>
            <div className="flex flex-wrap gap-2">
              {recommendations.data.priority_skills.map((skill, idx) => (
                <Badge key={idx} className="bg-[#00D4FF]/20 text-[#00D4FF] px-3 py-1">
                  {skill}
                </Badge>
              ))}
            </div>
          </GlowCard>

          {/* Learning Path */}
          <GlowCard glowColor="gold" className="p-6">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#C7A763]" />
              Caminho de Aprendizado Recomendado
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">{recommendations.data.learning_path}</p>
          </GlowCard>

          {/* Quick Wins */}
          <GlowCard glowColor="mixed" className="p-6">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C7A763]" />
              Ações Rápidas (Quick Wins)
            </h4>
            <ul className="space-y-2">
              {recommendations.data.quick_wins.map((item, idx) => (
                <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                  <span className="text-[#C7A763] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </GlowCard>

          {/* Courses */}
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#C7A763]" />
              Cursos e Treinamentos Recomendados ({recommendations.data.courses.length})
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              {recommendations.data.courses.map((course, idx) => (
                <GlowCard key={idx} glowColor="cyan" className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h5 className="text-white font-semibold mb-1">{course.title}</h5>
                      <p className="text-slate-400 text-xs mb-2">{course.provider}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge className={priorityColors[course.priority]}>
                        {course.priority}
                      </Badge>
                      <Badge className={levelColors[course.level]}>
                        {course.level}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-3">
                    <Badge className="bg-white/5 text-slate-300 mb-2">
                      <Award className="w-3 h-3 mr-1" />
                      {course.skill}
                    </Badge>
                    <p className="text-slate-400 text-xs">{course.duration}</p>
                  </div>

                  <p className="text-slate-300 text-sm mb-3 italic">{course.reason}</p>

                  <a
                    href={course.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#00D4FF] hover:text-[#00B8E6] text-sm transition-colors"
                  >
                    Ver Curso
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </GlowCard>
              ))}
            </div>
          </div>

          {/* Long Term Goals */}
          <GlowCard glowColor="gold" className="p-6">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#C7A763]" />
              Objetivos de Longo Prazo
            </h4>
            <ul className="space-y-3">
              {recommendations.data.long_term_goals.map((goal, idx) => (
                <li key={idx} className="text-slate-300 text-sm flex items-start gap-2 bg-white/5 rounded-lg p-3">
                  <span className="text-[#C7A763] mt-1">{idx + 1}.</span>
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </GlowCard>
        </div>
      )}
    </div>
  );
}

const Target = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);