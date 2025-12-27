import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Sparkles, TrendingUp, Target, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";

export default function VentureRecommendations({ userEmail }) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  const analyzeAndRecommend = async () => {
    setLoading(true);
    try {
      const [activitiesRes, venturesRes] = await Promise.all([
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'ActivityLog',
          operation: 'filter',
          query: { user_email: userEmail },
          sort: '-created_date'
        }),
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'Venture',
          operation: 'list'
        })
      ]);

      const activities = activitiesRes.data?.data || [];
      const ventures = venturesRes.data?.data || [];

      const activitySummary = activities.slice(0, 50).map(a => 
        `${a.action_type}: ${a.description}`
      ).join('\n');

      const prompt = `Você é um assistente de análise de padrões de uso. Analise as atividades recentes do usuário e as ventures disponíveis para gerar recomendações personalizadas.

Atividades recentes do usuário:
${activitySummary}

Ventures disponíveis:
${ventures.map(v => `- ${v.name} (${v.layer}, ${v.status}): ${v.description}`).join('\n')}

Com base nos padrões de interação, forneça:
1. Ventures mais relevantes para este usuário
2. Features ou áreas que o usuário deve explorar
3. Insights sobre o comportamento do usuário
4. Sugestões de próximas ações`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_ventures: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  venture_name: { type: "string" },
                  reason: { type: "string" },
                  relevance_score: { type: "number" }
                }
              }
            },
            suggested_features: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  feature: { type: "string" },
                  benefit: { type: "string" }
                }
              }
            },
            user_behavior_insights: { type: "array", items: { type: "string" } },
            next_actions: { type: "array", items: { type: "string" } }
          }
        }
      });

      setRecommendations(response);
      toast.success('Recomendações geradas!');
    } catch (error) {
      toast.error('Erro ao analisar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="cyan" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00D4FF]" />
            Recomendações Personalizadas com IA
          </h3>
          <Button
            onClick={analyzeAndRecommend}
            disabled={loading}
            className="bg-[#00D4FF] hover:bg-[#00B8E6] text-[#06101F]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Recomendações
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-slate-400">
          Análise baseada em padrões de interação e histórico de atividades
        </p>
      </GlowCard>

      {recommendations && (
        <div className="space-y-4">
          {/* Recommended Ventures */}
          {recommendations.recommended_ventures?.length > 0 && (
            <GlowCard glowColor="gold" className="p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#C7A763]" />
                Ventures Recomendadas para Você
              </h4>
              <div className="space-y-3">
                {recommendations.recommended_ventures.map((rec, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-white font-medium">{rec.venture_name}</span>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-20 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#00D4FF] to-[#C7A763]"
                            style={{ width: `${rec.relevance_score}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{rec.relevance_score}%</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Suggested Features */}
          {recommendations.suggested_features?.length > 0 && (
            <GlowCard glowColor="mixed" className="p-6">
              <h4 className="text-white font-semibold mb-4">Features para Explorar</h4>
              <div className="grid md:grid-cols-2 gap-3">
                {recommendations.suggested_features.map((feature, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <h5 className="text-white font-medium mb-1">{feature.feature}</h5>
                    <p className="text-xs text-slate-400">{feature.benefit}</p>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {/* Behavior Insights */}
            {recommendations.user_behavior_insights?.length > 0 && (
              <GlowCard glowColor="cyan" className="p-6">
                <h4 className="text-white font-semibold mb-3">Insights sobre seu Uso</h4>
                <ul className="space-y-2">
                  {recommendations.user_behavior_insights.map((insight, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-[#00D4FF] mt-0.5 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </GlowCard>
            )}

            {/* Next Actions */}
            {recommendations.next_actions?.length > 0 && (
              <GlowCard glowColor="gold" className="p-6">
                <h4 className="text-white font-semibold mb-3">Próximas Ações Sugeridas</h4>
                <ul className="space-y-2">
                  {recommendations.next_actions.map((action, i) => (
                    <li key={i} className="text-sm text-slate-300">→ {action}</li>
                  ))}
                </ul>
              </GlowCard>
            )}
          </div>
        </div>
      )}
    </div>
  );
}