import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlowCard from '@/components/ui/GlowCard';
import { FileText, Loader2, Download, Sparkles, TrendingUp, Award, Target } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PerformanceReportGenerator({ talentId = null }) {
  const [reportType, setReportType] = useState('individual');
  const [selectedTalent, setSelectedTalent] = useState(talentId || '');
  const [generatedReport, setGeneratedReport] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Fetch talents for selection
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

  const generateReport = async () => {
    if (reportType === 'individual' && !selectedTalent) {
      toast.error('Selecione um talento');
      return;
    }

    setGenerating(true);
    try {
      if (reportType === 'individual') {
        await generateIndividualReport();
      } else {
        await generateTeamReport();
      }
      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar relatório: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const generateIndividualReport = async () => {
    const talent = talents.find(t => t.id === selectedTalent);
    if (!talent) return;

    // Fetch related data
    const [feedbackRes, goalsRes, badgesRes, onboardingRes] = await Promise.all([
      base44.functions.invoke('secureEntityQuery', {
        entity_name: 'TalentFeedback',
        operation: 'filter',
        query: { talent_id: selectedTalent }
      }),
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
        entity_name: 'TalentOnboarding',
        operation: 'filter',
        query: { talent_id: selectedTalent }
      })
    ]);

    const feedbacks = feedbackRes.data?.data || [];
    const goals = goalsRes.data?.data || [];
    const badges = badgesRes.data?.data || [];
    const onboarding = onboardingRes.data?.data?.[0];

    // Generate AI report
    const report = await base44.integrations.Core.InvokeLLM({
      prompt: `Gere um relatório completo de performance individual para o talento.

Dados do Talento:
- Nome: ${talent.full_name}
- Cargo: ${talent.current_position || 'N/A'}
- Skills: ${talent.skills?.join(', ') || 'N/A'}
- Senioridade: ${talent.seniority_level || 'N/A'}

Feedbacks Recebidos (${feedbacks.length} total):
${feedbacks.map(f => `- Tipo: ${f.feedback_type}, Rating: ${f.rating}/5, Categoria: ${f.category}
  Pontos Fortes: ${f.strengths || 'N/A'}
  Áreas de Melhoria: ${f.areas_for_improvement || 'N/A'}`).join('\n')}

Metas (${goals.length} total):
${goals.map(g => `- ${g.title} (${g.goal_type}): Status ${g.status}, Progresso ${g.progress}%`).join('\n')}

Conquistas (${badges.length} badges):
${badges.map(b => `- ${b.badge_type} (${b.points} pontos)`).join('\n')}

Onboarding: ${onboarding?.completed ? 'Completo' : 'Em andamento'}

Retorne um relatório estruturado em JSON com:
- executive_summary: resumo executivo (2-3 parágrafos)
- strengths: array de pontos fortes (3-5 itens)
- areas_for_improvement: array de áreas de melhoria (3-5 itens)
- goal_achievement: análise de atingimento de metas (texto)
- feedback_summary: resumo dos feedbacks (texto)
- recommendations: array de recomendações (3-5 itens)
- overall_rating: rating geral de 1-5
- growth_trajectory: análise de trajetória de crescimento (texto)
- next_steps: array de próximos passos sugeridos (3-5 itens)`,
      response_json_schema: {
        type: "object",
        properties: {
          executive_summary: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          areas_for_improvement: { type: "array", items: { type: "string" } },
          goal_achievement: { type: "string" },
          feedback_summary: { type: "string" },
          recommendations: { type: "array", items: { type: "string" } },
          overall_rating: { type: "number" },
          growth_trajectory: { type: "string" },
          next_steps: { type: "array", items: { type: "string" } }
        }
      }
    });

    setGeneratedReport({
      type: 'individual',
      talent: talent,
      data: report,
      generated_at: new Date().toISOString()
    });
  };

  const generateTeamReport = async () => {
    // Fetch all relevant data
    const [feedbackRes, goalsRes, talentsRes] = await Promise.all([
      base44.functions.invoke('secureEntityQuery', {
        entity_name: 'TalentFeedback',
        operation: 'list'
      }),
      base44.functions.invoke('secureEntityQuery', {
        entity_name: 'TalentGoal',
        operation: 'list'
      }),
      base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Talent',
        operation: 'list'
      })
    ]);

    const feedbacks = feedbackRes.data?.data || [];
    const goals = goalsRes.data?.data || [];
    const allTalents = talentsRes.data?.data || [];

    // Generate AI report
    const report = await base44.integrations.Core.InvokeLLM({
      prompt: `Gere um relatório completo de performance do time.

Talentos no Time: ${allTalents.length}
Total de Feedbacks: ${feedbacks.length}
Total de Metas: ${goals.length}

Distribuição de Metas por Status:
- Not Started: ${goals.filter(g => g.status === 'not_started').length}
- In Progress: ${goals.filter(g => g.status === 'in_progress').length}
- Completed: ${goals.filter(g => g.status === 'completed').length}
- Blocked: ${goals.filter(g => g.status === 'blocked').length}

Feedback Rating Médio: ${feedbacks.length > 0 ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length).toFixed(2) : 'N/A'}

Distribuição de Senioridade:
${Object.entries(allTalents.reduce((acc, t) => {
  acc[t.seniority_level || 'undefined'] = (acc[t.seniority_level || 'undefined'] || 0) + 1;
  return acc;
}, {})).map(([level, count]) => `- ${level}: ${count}`).join('\n')}

Retorne um relatório estruturado em JSON com:
- executive_summary: resumo executivo do time (3-4 parágrafos)
- team_strengths: array de pontos fortes do time (4-6 itens)
- team_challenges: array de desafios do time (4-6 itens)
- performance_highlights: array de destaques de performance (3-5 itens)
- collaboration_insights: insights sobre colaboração (texto)
- goal_completion_rate: taxa de conclusão de metas (texto com análise)
- skill_distribution: análise de distribuição de skills (texto)
- recommendations: array de recomendações estratégicas (5-7 itens)
- training_priorities: array de prioridades de treinamento (4-6 itens)
- retention_risks: análise de riscos de retenção (texto)`,
      response_json_schema: {
        type: "object",
        properties: {
          executive_summary: { type: "string" },
          team_strengths: { type: "array", items: { type: "string" } },
          team_challenges: { type: "array", items: { type: "string" } },
          performance_highlights: { type: "array", items: { type: "string" } },
          collaboration_insights: { type: "string" },
          goal_completion_rate: { type: "string" },
          skill_distribution: { type: "string" },
          recommendations: { type: "array", items: { type: "string" } },
          training_priorities: { type: "array", items: { type: "string" } },
          retention_risks: { type: "string" }
        }
      }
    });

    setGeneratedReport({
      type: 'team',
      data: report,
      generated_at: new Date().toISOString()
    });
  };

  const downloadReport = () => {
    const reportContent = JSON.stringify(generatedReport, null, 2);
    const blob = new Blob([reportContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${generatedReport.type}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Relatório baixado!');
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="cyan" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-[#00D4FF]" />
          <div>
            <h3 className="text-white font-semibold text-lg">Gerador de Relatórios de Performance</h3>
            <p className="text-slate-400 text-sm">Análises automáticas com IA baseadas em dados reais</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-white text-sm mb-2 block">Tipo de Relatório</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="team">Time Completo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === 'individual' && (
            <div>
              <label className="text-white text-sm mb-2 block">Selecionar Talento</label>
              <Select value={selectedTalent} onValueChange={setSelectedTalent}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Escolha um talento..." />
                </SelectTrigger>
                <SelectContent>
                  {talents.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Button
          onClick={generateReport}
          disabled={generating || (reportType === 'individual' && !selectedTalent)}
          className="w-full bg-gradient-to-r from-[#00D4FF] to-[#C7A763] hover:from-[#00B8E6] hover:to-[#A88B4A]"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando Relatório...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Relatório com IA
            </>
          )}
        </Button>
      </GlowCard>

      {generatedReport && (
        <GlowCard glowColor="gold" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-[#C7A763]" />
              <div>
                <h4 className="text-white font-semibold text-lg">
                  {generatedReport.type === 'individual' ? `Relatório: ${generatedReport.talent.full_name}` : 'Relatório do Time'}
                </h4>
                <p className="text-slate-400 text-xs">
                  Gerado em {format(new Date(generatedReport.generated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            <Button
              onClick={downloadReport}
              size="sm"
              variant="outline"
              className="border-[#C7A763] text-[#C7A763] hover:bg-[#C7A763]/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar JSON
            </Button>
          </div>

          {generatedReport.type === 'individual' ? (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div>
                <h5 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#C7A763]" />
                  Resumo Executivo
                </h5>
                <p className="text-slate-300 text-sm leading-relaxed">{generatedReport.data.executive_summary}</p>
                {generatedReport.data.overall_rating && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-slate-400 text-sm">Rating Geral:</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Award
                          key={i}
                          className={`w-4 h-4 ${i < generatedReport.data.overall_rating ? 'text-[#C7A763]' : 'text-slate-600'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Strengths */}
              <div>
                <h5 className="text-white font-semibold mb-2">💪 Pontos Fortes</h5>
                <ul className="space-y-2">
                  {generatedReport.data.strengths.map((item, idx) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas for Improvement */}
              <div>
                <h5 className="text-white font-semibold mb-2">🎯 Áreas de Melhoria</h5>
                <ul className="space-y-2">
                  {generatedReport.data.areas_for_improvement.map((item, idx) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Goal Achievement */}
              <div className="bg-white/5 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">Atingimento de Metas</h5>
                <p className="text-slate-300 text-sm">{generatedReport.data.goal_achievement}</p>
              </div>

              {/* Feedback Summary */}
              <div className="bg-white/5 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">Resumo dos Feedbacks</h5>
                <p className="text-slate-300 text-sm">{generatedReport.data.feedback_summary}</p>
              </div>

              {/* Growth Trajectory */}
              <div className="bg-gradient-to-br from-[#C7A763]/10 to-[#00D4FF]/10 border border-[#C7A763]/30 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">📈 Trajetória de Crescimento</h5>
                <p className="text-slate-300 text-sm">{generatedReport.data.growth_trajectory}</p>
              </div>

              {/* Recommendations */}
              <div>
                <h5 className="text-white font-semibold mb-2">💡 Recomendações</h5>
                <ul className="space-y-2">
                  {generatedReport.data.recommendations.map((item, idx) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-[#C7A763] mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Steps */}
              <div>
                <h5 className="text-white font-semibold mb-2">🚀 Próximos Passos</h5>
                <ul className="space-y-2">
                  {generatedReport.data.next_steps.map((item, idx) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-[#00D4FF] mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div>
                <h5 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#C7A763]" />
                  Resumo Executivo do Time
                </h5>
                <p className="text-slate-300 text-sm leading-relaxed">{generatedReport.data.executive_summary}</p>
              </div>

              {/* Team Strengths */}
              <div>
                <h5 className="text-white font-semibold mb-2">💪 Pontos Fortes do Time</h5>
                <ul className="space-y-2">
                  {generatedReport.data.team_strengths.map((item, idx) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Team Challenges */}
              <div>
                <h5 className="text-white font-semibold mb-2">⚠️ Desafios do Time</h5>
                <ul className="space-y-2">
                  {generatedReport.data.team_challenges.map((item, idx) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Performance Highlights */}
              <div className="bg-gradient-to-br from-[#C7A763]/10 to-[#00D4FF]/10 border border-[#C7A763]/30 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">🌟 Destaques de Performance</h5>
                <ul className="space-y-2">
                  {generatedReport.data.performance_highlights.map((item, idx) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-[#C7A763] mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Collaboration & Goals */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-2">Colaboração</h5>
                  <p className="text-slate-300 text-sm">{generatedReport.data.collaboration_insights}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-2">Taxa de Conclusão de Metas</h5>
                  <p className="text-slate-300 text-sm">{generatedReport.data.goal_completion_rate}</p>
                </div>
              </div>

              {/* Skill Distribution & Retention */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-2">Distribuição de Skills</h5>
                  <p className="text-slate-300 text-sm">{generatedReport.data.skill_distribution}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-2">Riscos de Retenção</h5>
                  <p className="text-slate-300 text-sm">{generatedReport.data.retention_risks}</p>
                </div>
              </div>

              {/* Training Priorities */}
              <div>
                <h5 className="text-white font-semibold mb-2">📚 Prioridades de Treinamento</h5>
                <ul className="space-y-2">
                  {generatedReport.data.training_priorities.map((item, idx) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div>
                <h5 className="text-white font-semibold mb-2">💡 Recomendações Estratégicas</h5>
                <ul className="space-y-2">
                  {generatedReport.data.recommendations.map((item, idx) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-[#C7A763] mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </GlowCard>
      )}
    </div>
  );
}