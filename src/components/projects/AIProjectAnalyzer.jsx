import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Brain, AlertTriangle, TrendingUp, Users, Calendar, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlowCard from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export default function AIProjectAnalyzer({ ventureId }) {
  const [analysis, setAnalysis] = useState(null);
  const [generating, setGenerating] = useState(false);

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ProjectMilestone',
        operation: 'filter',
        query: ventureId ? { venture_id: ventureId } : {},
        sort: 'due_date'
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

  const { data: talents = [] } = useQuery({
    queryKey: ['venture-talents', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTalent',
        operation: 'filter',
        query: ventureId ? { venture_id: ventureId } : {}
      });
      return res.data?.data || [];
    }
  });

  const analyzeProject = async () => {
    setGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise este projeto e forneça insights preditivos sobre prazos, riscos e alocação de recursos.

MILESTONES (${milestones.length}):
${milestones.map(m => `
- ${m.title} (${m.status})
  Prazo: ${m.due_date}
  Progresso: ${m.progress}%
  ${m.completed_date ? `Concluído: ${m.completed_date}` : 'Em andamento'}
`).join('\n')}

TAREFAS (${tasks.length}):
${tasks.map(t => `
- ${t.title} (${t.status}, Prioridade: ${t.priority})
  Atribuído: ${t.assigned_to}
  Prazo: ${t.due_date || 'Não definido'}
`).join('\n')}

EQUIPE (${talents.length} membros):
${talents.map(t => `- ${t.role} (Alocação: ${t.allocation_percentage}%)`).join('\n')}

Baseado em padrões de dados históricos e melhores práticas de gestão de projetos, gere:

1. delay_predictions: array de milestones em risco com probabilidade de atraso (0-100)
2. resource_optimization: sugestões de realocação de recursos
3. bottlenecks: gargalos identificados no projeto
4. recommendations: 3-5 recomendações acionáveis
5. timeline_forecast: previsão realista de conclusão
6. risk_level: "low", "medium" ou "high"
7. efficiency_score: score de eficiência (0-100)
8. summary: resumo executivo (máx 200 caracteres)`,
        response_json_schema: {
          type: "object",
          properties: {
            delay_predictions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  milestone: { type: "string" },
                  probability: { type: "number" },
                  reason: { type: "string" }
                }
              }
            },
            resource_optimization: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  suggestion: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            bottlenecks: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            timeline_forecast: { type: "string" },
            risk_level: { type: "string" },
            efficiency_score: { type: "number" },
            summary: { type: "string" }
          }
        }
      });

      setAnalysis(response);
      toast.success('Análise preditiva gerada!');
    } catch (error) {
      toast.error('Erro ao gerar análise: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const riskColors = {
    low: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-[#C7A763]" />
          Análise Preditiva com IA
        </h3>
        <Button
          onClick={analyzeProject}
          disabled={generating || milestones.length === 0}
          className="bg-gradient-to-r from-[#C7A763] to-[#00D4FF] hover:from-[#A88B4A] hover:to-[#00B8E0]"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Análise
            </>
          )}
        </Button>
      </div>

      {analysis && (
        <div className="space-y-4">
          {/* Summary Card */}
          <GlowCard className="p-6 bg-gradient-to-br from-[#C7A763]/10 to-[#00D4FF]/10 border-[#C7A763]/30">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-white font-semibold">Resumo Executivo</h4>
              <Badge className={riskColors[analysis.risk_level]}>
                Risco: {analysis.risk_level}
              </Badge>
            </div>
            <p className="text-slate-300 italic mb-4">{analysis.summary}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Eficiência do Projeto</div>
                <div className="text-2xl font-bold text-white">{analysis.efficiency_score}%</div>
                <Progress value={analysis.efficiency_score} className="h-2 mt-2" />
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Previsão de Conclusão</div>
                <div className="text-lg font-semibold text-white">{analysis.timeline_forecast}</div>
              </div>
            </div>
          </GlowCard>

          {/* Delay Predictions */}
          {analysis.delay_predictions?.length > 0 && (
            <GlowCard className="p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Previsão de Atrasos
              </h4>
              <div className="space-y-3">
                {analysis.delay_predictions.map((pred, idx) => (
                  <div key={idx} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-white font-medium">{pred.milestone}</span>
                      <Badge className={
                        pred.probability > 70 ? 'bg-red-500/20 text-red-400' :
                        pred.probability > 40 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }>
                        {pred.probability}% de risco
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">{pred.reason}</p>
                    <Progress value={pred.probability} className="h-2 mt-2" />
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Resource Optimization */}
          {analysis.resource_optimization?.length > 0 && (
            <GlowCard className="p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00D4FF]" />
                Otimização de Recursos
              </h4>
              <div className="space-y-3">
                {analysis.resource_optimization.map((opt, idx) => (
                  <div key={idx} className="bg-white/5 rounded-lg p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00D4FF]/20 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-[#00D4FF]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white mb-1">{opt.suggestion}</p>
                      <p className="text-xs text-slate-500">Impacto: {opt.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Bottlenecks */}
          {analysis.bottlenecks?.length > 0 && (
            <GlowCard className="p-6 bg-red-500/5 border-red-500/20">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Gargalos Identificados
              </h4>
              <div className="space-y-2">
                {analysis.bottlenecks.map((bottleneck, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className="text-red-400 mt-1">⚠</span>
                    <span>{bottleneck}</span>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Recommendations */}
          <GlowCard className="p-6">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#C7A763]" />
              Recomendações
            </h4>
            <div className="space-y-3">
              {analysis.recommendations?.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-white/5 rounded-lg p-3">
                  <div className="w-6 h-6 rounded-full bg-[#C7A763]/20 text-[#C7A763] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-slate-300">{rec}</span>
                </div>
              ))}
            </div>
          </GlowCard>
        </div>
      )}

      {milestones.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Adicione milestones ao projeto para gerar análise preditiva</p>
        </div>
      )}
    </div>
  );
}