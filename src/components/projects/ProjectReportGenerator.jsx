import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ProjectReportGenerator({ ventureId, ventureName }) {
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ProjectMilestone',
        operation: 'filter',
        query: ventureId ? { venture_id: ventureId } : {}
      });
      return res.data?.data || [];
    }
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTask',
        operation: 'filter',
        query: ventureId ? { venture_id: ventureId } : {}
      });
      return res.data?.data || [];
    }
  });

  const generateReport = async () => {
    setGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Gere um relatório executivo de progresso de projeto profissional e conciso.

PROJETO: ${ventureName || 'Projeto'}
DATA: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}

MILESTONES (${milestones.length}):
${milestones.map(m => `
- ${m.title}
  Status: ${m.status}
  Progresso: ${m.progress}%
  Prazo: ${m.due_date}
  ${m.completed_date ? `✓ Concluído em ${m.completed_date}` : ''}
`).join('\n')}

TAREFAS:
- Total: ${tasks.length}
- Concluídas: ${tasks.filter(t => t.status === 'completed').length}
- Em andamento: ${tasks.filter(t => t.status === 'in_progress').length}
- Pendentes: ${tasks.filter(t => t.status === 'todo').length}

Gere um relatório estruturado em JSON com:
- executive_summary: resumo executivo (2-3 frases)
- overall_progress: percentual geral de progresso
- key_achievements: array de 3-5 conquistas principais
- challenges: array de 2-3 desafios enfrentados
- next_steps: array de 3-5 próximos passos
- milestone_status: resumo do status dos milestones
- team_performance: avaliação do desempenho da equipe
- recommendations: 2-3 recomendações estratégicas`,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            overall_progress: { type: "number" },
            key_achievements: { type: "array", items: { type: "string" } },
            challenges: { type: "array", items: { type: "string" } },
            next_steps: { type: "array", items: { type: "string" } },
            milestone_status: { type: "string" },
            team_performance: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setReport({
        ...response,
        generated_at: new Date().toISOString(),
        venture_name: ventureName
      });
      toast.success('Relatório gerado!');
    } catch (error) {
      toast.error('Erro ao gerar relatório: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;

    const reportText = `
RELATÓRIO DE PROGRESSO DO PROJETO
${report.venture_name}
Gerado em: ${format(new Date(report.generated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}

═══════════════════════════════════════════════════════════

RESUMO EXECUTIVO
${report.executive_summary}

PROGRESSO GERAL: ${report.overall_progress}%

═══════════════════════════════════════════════════════════

CONQUISTAS PRINCIPAIS
${report.key_achievements.map((a, i) => `${i + 1}. ${a}`).join('\n')}

═══════════════════════════════════════════════════════════

DESAFIOS ENFRENTADOS
${report.challenges.map((c, i) => `${i + 1}. ${c}`).join('\n')}

═══════════════════════════════════════════════════════════

PRÓXIMOS PASSOS
${report.next_steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

═══════════════════════════════════════════════════════════

STATUS DOS MILESTONES
${report.milestone_status}

═══════════════════════════════════════════════════════════

DESEMPENHO DA EQUIPE
${report.team_performance}

═══════════════════════════════════════════════════════════

RECOMENDAÇÕES ESTRATÉGICAS
${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${ventureName?.toLowerCase().replace(/\s+/g, '-') || 'projeto'}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Relatório baixado!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#C7A763]" />
          Relatório Automático
        </h3>
        <div className="flex gap-2">
          {report && (
            <Button onClick={downloadReport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </Button>
          )}
          <Button
            onClick={generateReport}
            disabled={generating}
            className="bg-gradient-to-r from-[#C7A763] to-[#00D4FF] hover:from-[#A88B4A] hover:to-[#00B8E0]"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Relatório
              </>
            )}
          </Button>
        </div>
      </div>

      {report && (
        <div className="space-y-4">
          <GlowCard className="p-6 bg-gradient-to-br from-[#C7A763]/10 to-[#00D4FF]/10 border-[#C7A763]/30">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-white font-semibold">{report.venture_name}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Gerado em {format(new Date(report.generated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#C7A763]">{report.overall_progress}%</div>
                <div className="text-xs text-slate-400">Progresso</div>
              </div>
            </div>
            <p className="text-slate-300 italic">{report.executive_summary}</p>
          </GlowCard>

          <GlowCard className="p-6">
            <h4 className="text-white font-semibold mb-3">✅ Conquistas Principais</h4>
            <div className="space-y-2">
              {report.key_achievements.map((achievement, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-green-400 mt-1">•</span>
                  <span>{achievement}</span>
                </div>
              ))}
            </div>
          </GlowCard>

          <GlowCard className="p-6">
            <h4 className="text-white font-semibold mb-3">⚠️ Desafios</h4>
            <div className="space-y-2">
              {report.challenges.map((challenge, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>{challenge}</span>
                </div>
              ))}
            </div>
          </GlowCard>

          <GlowCard className="p-6">
            <h4 className="text-white font-semibold mb-3">🎯 Próximos Passos</h4>
            <div className="space-y-3">
              {report.next_steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-white/5 rounded-lg p-3">
                  <div className="w-6 h-6 rounded-full bg-[#00D4FF]/20 text-[#00D4FF] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-slate-300">{step}</span>
                </div>
              ))}
            </div>
          </GlowCard>

          <div className="grid md:grid-cols-2 gap-4">
            <GlowCard className="p-6">
              <h4 className="text-white font-semibold mb-2">Status dos Milestones</h4>
              <p className="text-sm text-slate-300">{report.milestone_status}</p>
            </GlowCard>

            <GlowCard className="p-6">
              <h4 className="text-white font-semibold mb-2">Desempenho da Equipe</h4>
              <p className="text-sm text-slate-300">{report.team_performance}</p>
            </GlowCard>
          </div>

          <GlowCard className="p-6 bg-[#C7A763]/5 border-[#C7A763]/20">
            <h4 className="text-white font-semibold mb-3">💡 Recomendações Estratégicas</h4>
            <div className="space-y-2">
              {report.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-[#C7A763] mt-1">→</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </GlowCard>
        </div>
      )}
    </div>
  );
}