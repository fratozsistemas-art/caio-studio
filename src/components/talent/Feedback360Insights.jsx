import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Brain, TrendingUp, AlertCircle, Target, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlowCard from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Feedback360Insights({ talentId, talentName }) {
  const [insights, setInsights] = useState(null);
  const [generating, setGenerating] = useState(false);

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['talent-all-feedback', talentId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'TalentFeedback',
        operation: 'filter',
        query: { talent_id: talentId }
      });
      return res.data?.data || [];
    }
  });

  const generateInsights = async () => {
    if (feedbacks.length === 0) {
      toast.error('Não há feedbacks suficientes para gerar insights');
      return;
    }

    setGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise este conjunto de feedbacks 360° e gere insights acionáveis para desenvolvimento de carreira.

Talento: ${talentName}
Total de Feedbacks: ${feedbacks.length}

Feedbacks por tipo:
${feedbacks.map(f => `
- Tipo: ${f.feedback_type}
- Categoria: ${f.category}
- Avaliação: ${f.rating}/5
- Pontos Fortes: ${f.strengths}
- Áreas de Melhoria: ${f.areas_for_improvement}
- Comentários: ${f.comments}
`).join('\n')}

Gere um objeto JSON com:
- overall_rating: número médio (1-5)
- top_strengths: array de 3-5 pontos fortes mais mencionados
- development_areas: array de 3-5 áreas de melhoria identificadas
- patterns_by_source: objeto com insights separados por fonte (peers, managers, direct_reports)
- action_plan: array de 3-5 ações concretas de desenvolvimento
- career_recommendations: array de 2-3 recomendações de carreira
- summary: string com resumo executivo (máx 300 caracteres)`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_rating: { type: "number" },
            top_strengths: { type: "array", items: { type: "string" } },
            development_areas: { type: "array", items: { type: "string" } },
            patterns_by_source: {
              type: "object",
              properties: {
                peers: { type: "string" },
                managers: { type: "string" },
                direct_reports: { type: "string" }
              }
            },
            action_plan: { type: "array", items: { type: "string" } },
            career_recommendations: { type: "array", items: { type: "string" } },
            summary: { type: "string" }
          }
        }
      });

      setInsights(response);
      toast.success('Insights gerados com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar insights: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const avgRating = feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length
    : 0;

  const feedbacksByType = feedbacks.reduce((acc, f) => {
    acc[f.feedback_type] = (acc[f.feedback_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-[#C7A763]" />
          Insights 360°
        </h3>
        <Button
          onClick={generateInsights}
          disabled={generating || feedbacks.length === 0}
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
              Gerar Insights com IA
            </>
          )}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <GlowCard glowColor="cyan" className="p-4">
          <div className="text-xs text-slate-400 mb-1">Total de Feedbacks</div>
          <div className="text-2xl font-bold text-white">{feedbacks.length}</div>
        </GlowCard>

        <GlowCard glowColor="gold" className="p-4">
          <div className="text-xs text-slate-400 mb-1">Avaliação Média</div>
          <div className="text-2xl font-bold text-white">{avgRating.toFixed(1)}/5</div>
        </GlowCard>

        <GlowCard glowColor="mixed" className="p-4">
          <div className="text-xs text-slate-400 mb-1">Colegas</div>
          <div className="text-2xl font-bold text-white">{feedbacksByType.peer || 0}</div>
        </GlowCard>

        <GlowCard glowColor="cyan" className="p-4">
          <div className="text-xs text-slate-400 mb-1">Gestores</div>
          <div className="text-2xl font-bold text-white">{feedbacksByType.manager || 0}</div>
        </GlowCard>
      </div>

      {/* AI Insights */}
      {insights && (
        <div className="space-y-4">
          {/* Summary */}
          <GlowCard className="p-6 bg-gradient-to-br from-[#C7A763]/10 to-[#00D4FF]/10 border-[#C7A763]/30">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#C7A763] mt-1 flex-shrink-0" />
              <div>
                <h4 className="text-white font-semibold mb-2">Resumo Executivo</h4>
                <p className="text-slate-300 italic">{insights.summary}</p>
              </div>
            </div>
          </GlowCard>

          {/* Strengths */}
          <GlowCard className="p-6">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Pontos Fortes
            </h4>
            <div className="space-y-2">
              {insights.top_strengths?.map((strength, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-green-400 mt-1">•</span>
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          </GlowCard>

          {/* Development Areas */}
          <GlowCard className="p-6">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              Áreas de Desenvolvimento
            </h4>
            <div className="space-y-2">
              {insights.development_areas?.map((area, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>{area}</span>
                </div>
              ))}
            </div>
          </GlowCard>

          {/* Action Plan */}
          <GlowCard className="p-6">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#C7A763]" />
              Plano de Ação
            </h4>
            <div className="space-y-3">
              {insights.action_plan?.map((action, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-white/5 rounded-lg p-3">
                  <div className="w-6 h-6 rounded-full bg-[#C7A763]/20 text-[#C7A763] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-slate-300">{action}</span>
                </div>
              ))}
            </div>
          </GlowCard>

          {/* Career Recommendations */}
          {insights.career_recommendations && insights.career_recommendations.length > 0 && (
            <GlowCard className="p-6 bg-[#00D4FF]/5 border-[#00D4FF]/20">
              <h4 className="text-white font-semibold mb-3">🚀 Recomendações de Carreira</h4>
              <div className="space-y-2">
                {insights.career_recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className="text-[#00D4FF] mt-1">→</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}
        </div>
      )}

      {feedbacks.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aguardando feedbacks para gerar insights</p>
        </div>
      )}
    </div>
  );
}