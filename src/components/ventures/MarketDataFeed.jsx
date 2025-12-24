import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Globe, TrendingUp, Newspaper, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";
import moment from 'moment';

export default function MarketDataFeed({ venture, compact = false }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: marketData, isLoading, refetch } = useQuery({
    queryKey: ['marketData', venture?.id, refreshKey],
    queryFn: async () => {
      if (!venture) return null;

      const query = `${venture.category || venture.name} industry trends news 2025 market analysis`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um analista de mercado especializado. Pesquise e analise informações atualizadas sobre o setor e mercado relacionado a: "${query}".

Forneça uma análise estruturada e atual incluindo:
1. Tendências chave da indústria
2. Notícias relevantes e desenvolvimentos recentes
3. Indicadores econômicos do setor
4. Análise competitiva do mercado
5. Oportunidades e riscos emergentes

Seja específico, use dados quantitativos quando possível, e foque em informações acionáveis.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            industry_trends: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string", enum: ["high", "medium", "low"] }
                }
              }
            },
            recent_news: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  summary: { type: "string" },
                  relevance: { type: "string" }
                }
              }
            },
            economic_indicators: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  indicator: { type: "string" },
                  value: { type: "string" },
                  trend: { type: "string", enum: ["up", "down", "stable"] }
                }
              }
            },
            competitive_landscape: {
              type: "object",
              properties: {
                market_size: { type: "string" },
                growth_rate: { type: "string" },
                key_players: { type: "array", items: { type: "string" } },
                market_dynamics: { type: "string" }
              }
            },
            opportunities: {
              type: "array",
              items: { type: "string" }
            },
            risks: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      return {
        ...response,
        updated_at: new Date().toISOString()
      };
    },
    enabled: !!venture,
    staleTime: 1000 * 60 * 30 // 30 minutes
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  if (!venture) return null;

  if (isLoading) {
    return (
      <GlowCard glowColor="mixed" className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF]" />
        </div>
      </GlowCard>
    );
  }

  if (compact && marketData) {
    return (
      <GlowCard glowColor="cyan" className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#00D4FF]" />
            <span className="text-sm font-semibold text-white">Market Insights</span>
          </div>
          <Button size="sm" variant="ghost" onClick={handleRefresh} className="text-slate-400 hover:text-white">
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
        <div className="space-y-2">
          {marketData.industry_trends?.slice(0, 2).map((trend, i) => (
            <div key={i} className="text-xs text-slate-300 flex gap-2">
              <TrendingUp className="w-3 h-3 mt-0.5 text-[#C7A763] flex-shrink-0" />
              <span>{trend.title}</span>
            </div>
          ))}
        </div>
      </GlowCard>
    );
  }

  if (!marketData) return null;

  const impactColors = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-green-500/20 text-green-400 border-green-500/30'
  };

  const trendIcons = {
    up: <TrendingUp className="w-4 h-4 text-green-400" />,
    down: <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />,
    stable: <div className="w-4 h-0.5 bg-slate-400" />
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-[#00D4FF]" />
          <div>
            <h3 className="text-lg font-semibold text-white">Dados de Mercado em Tempo Real</h3>
            <p className="text-xs text-slate-400">
              Atualizado em {moment(marketData.updated_at).format('DD/MM/YYYY HH:mm')}
            </p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading} variant="outline" className="border-white/10 text-white">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Industry Trends */}
      <GlowCard glowColor="cyan" className="p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
          Tendências da Indústria
        </h4>
        <div className="space-y-4">
          {marketData.industry_trends?.map((trend, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-semibold text-white">{trend.title}</h5>
                <Badge className={impactColors[trend.impact]}>{trend.impact}</Badge>
              </div>
              <p className="text-sm text-slate-400">{trend.description}</p>
            </motion.div>
          ))}
        </div>
      </GlowCard>

      {/* Recent News */}
      <GlowCard glowColor="gold" className="p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-[#C7A763]" />
          Notícias Recentes
        </h4>
        <div className="space-y-3">
          {marketData.recent_news?.map((news, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <h5 className="font-semibold text-white text-sm mb-1">{news.headline}</h5>
              <p className="text-xs text-slate-400 mb-2">{news.summary}</p>
              <span className="text-xs text-[#C7A763]">{news.relevance}</span>
            </motion.div>
          ))}
        </div>
      </GlowCard>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Economic Indicators */}
        <GlowCard glowColor="mixed" className="p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Indicadores Econômicos</h4>
          <div className="space-y-3">
            {marketData.economic_indicators?.map((indicator, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <div className="text-sm text-white">{indicator.indicator}</div>
                  <div className="text-xs text-slate-400">{indicator.value}</div>
                </div>
                {trendIcons[indicator.trend]}
              </div>
            ))}
          </div>
        </GlowCard>

        {/* Competitive Landscape */}
        <GlowCard glowColor="mixed" className="p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Cenário Competitivo</h4>
          {marketData.competitive_landscape && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-xs text-slate-400 mb-1">Tamanho do Mercado</div>
                <div className="text-sm text-white">{marketData.competitive_landscape.market_size}</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-xs text-slate-400 mb-1">Taxa de Crescimento</div>
                <div className="text-sm text-white">{marketData.competitive_landscape.growth_rate}</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-xs text-slate-400 mb-1">Principais Players</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {marketData.competitive_landscape.key_players?.map((player, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{player}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </GlowCard>
      </div>

      {/* Opportunities & Risks */}
      <div className="grid md:grid-cols-2 gap-6">
        <GlowCard glowColor="gold" className="p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Oportunidades</h4>
          <ul className="space-y-2">
            {marketData.opportunities?.map((opp, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300">
                <span className="text-green-400">✓</span>
                <span>{opp}</span>
              </li>
            ))}
          </ul>
        </GlowCard>

        <GlowCard glowColor="mixed" className="p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Riscos</h4>
          <ul className="space-y-2">
            {marketData.risks?.map((risk, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300">
                <span className="text-orange-400">⚠</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </GlowCard>
      </div>
    </div>
  );
}