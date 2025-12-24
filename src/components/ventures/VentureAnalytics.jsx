import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Brain, Loader2, TrendingUp, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import AnalysisReport from "./AnalysisReport";
import MarketDataFeed from "./MarketDataFeed";
import VentureScore from "./VentureScore";
import { toast } from "sonner";

export default function VentureAnalytics({ ventures }) {
  const [selectedVenture, setSelectedVenture] = useState(ventures[0]?.id || null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const { data: ventureData } = useQuery({
    queryKey: ['ventureFullData', selectedVenture],
    queryFn: async () => {
      if (!selectedVenture) return null;

      const [kpisResponse, talentsResponse] = await Promise.all([
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'VentureKPI',
          operation: 'filter',
          query: { venture_id: selectedVenture },
          sort: '-measurement_date'
        }),
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'VentureTalent',
          operation: 'filter',
          query: { venture_id: selectedVenture }
        })
      ]);

      return {
        kpis: kpisResponse.data?.data || [],
        talents: talentsResponse.data?.data || []
      };
    },
    enabled: !!selectedVenture
  });

  const venture = ventures.find(v => v.id === selectedVenture);

  const analyzeVenture = async () => {
    if (!venture || !ventureData) {
      toast.error('Selecione uma venture com dados');
      return;
    }

    setAnalyzing(true);
    setAnalysis(null);

    try {
      // Prepare comprehensive data for AI analysis
      const analysisContext = {
        venture: {
          name: venture.name,
          description: venture.description,
          layer: venture.layer,
          status: venture.status,
          category: venture.category,
          team_size: venture.team_size,
          founded_date: venture.founded_date
        },
        kpis: ventureData.kpis.map(kpi => ({
          name: kpi.kpi_name,
          type: kpi.kpi_type,
          current_value: kpi.current_value,
          target_value: kpi.target_value,
          unit: kpi.unit,
          period: kpi.period,
          measurement_date: kpi.measurement_date,
          achievement_rate: kpi.target_value ? (kpi.current_value / kpi.target_value * 100).toFixed(1) : null
        })),
        talents: ventureData.talents.map(t => ({
          role: t.role,
          level: t.level,
          skills: t.skills,
          allocation: t.allocation
        })),
        stats: {
          total_kpis: ventureData.kpis.length,
          total_talents: ventureData.talents.length,
          kpis_above_target: ventureData.kpis.filter(k => k.target_value && k.current_value >= k.target_value).length,
          kpis_below_target: ventureData.kpis.filter(k => k.target_value && k.current_value < k.target_value).length
        }
      };

      // Fetch market data for enriched analysis
      let marketContext = '';
      try {
        const marketQuery = `${venture.category || venture.name} industry trends market analysis 2025`;
        const marketResponse = await base44.integrations.Core.InvokeLLM({
          prompt: `Forneça um breve resumo de tendências de mercado e dados relevantes para: ${marketQuery}`,
          add_context_from_internet: true
        });
        marketContext = typeof marketResponse === 'string' ? marketResponse : JSON.stringify(marketResponse);
      } catch (error) {
        console.warn('Market data fetch failed:', error);
      }

      const prompt = `Você é um consultor especialista em análise de ventures de venture studios e startups. Analise os dados da venture abaixo e forneça insights estratégicos detalhados.

DADOS DA VENTURE:
${JSON.stringify(analysisContext, null, 2)}

CONTEXTO DE MERCADO:
${marketContext}

Por favor, forneça uma análise completa no formato JSON especificado, incluindo:

1. PERFORMANCE_OVERVIEW: Resumo executivo da performance atual (2-3 frases)

2. STRENGTHS: Liste 3-5 pontos fortes identificados com base nos dados

3. RISKS: Identifique 3-5 riscos ou pontos de atenção críticos

4. PREDICTIVE_INSIGHTS: Forneça 3-5 insights preditivos sobre o futuro da venture baseado nas tendências dos KPIs

5. RECOMMENDATIONS: Sugira 4-6 ações específicas e práticas para otimizar o desempenho

6. SUGGESTED_KPIS: Sugira 3-4 novos KPIs que deveriam ser rastreados, cada um com:
   - name: nome do KPI
   - reason: por que este KPI é importante
   - target_suggestion: sugestão de meta inicial
   - measurement_frequency: frequência recomendada (daily/weekly/monthly/quarterly)

7. KPI_ADJUSTMENTS: Para KPIs existentes abaixo da meta, sugira ajustes específicos:
   - kpi_name: nome do KPI
   - current_target: meta atual
   - suggested_target: nova meta sugerida
   - rationale: justificativa para o ajuste

8. MARKET_INSIGHTS: Considerando o contexto de mercado e a camada/categoria da venture, forneça 2-3 insights sobre tendências e benchmarks do setor.

Seja específico, acionável e use dados quantitativos sempre que possível.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            performance_overview: { type: "string" },
            strengths: {
              type: "array",
              items: { type: "string" }
            },
            risks: {
              type: "array",
              items: { type: "string" }
            },
            predictive_insights: {
              type: "array",
              items: { type: "string" }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            },
            suggested_kpis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  reason: { type: "string" },
                  target_suggestion: { type: "string" },
                  measurement_frequency: { type: "string" }
                }
              }
            },
            kpi_adjustments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  kpi_name: { type: "string" },
                  current_target: { type: "number" },
                  suggested_target: { type: "number" },
                  rationale: { type: "string" }
                }
              }
            },
            market_insights: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setAnalysis({
        ...response,
        generated_at: new Date().toISOString(),
        venture_name: venture.name
      });

      toast.success('Análise completa gerada!');
    } catch (error) {
      toast.error('Erro ao gerar análise: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Select value={selectedVenture} onValueChange={setSelectedVenture}>
          <SelectTrigger className="w-64 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Selecione uma venture" />
          </SelectTrigger>
          <SelectContent>
            {ventures.map(venture => (
              <SelectItem key={venture.id} value={venture.id}>
                {venture.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={analyzeVenture}
          disabled={!selectedVenture || analyzing || !ventureData?.kpis?.length}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando com IA...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Analisar com IA
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      {selectedVenture && ventureData && (
        <div className="grid md:grid-cols-4 gap-4">
          <GlowCard glowColor="cyan" className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-[#00D4FF]" />
              <div>
                <div className="text-2xl font-bold text-white">{ventureData.kpis.length}</div>
                <div className="text-xs text-slate-400">KPIs Ativos</div>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="gold" className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-[#C7A763]" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {ventureData.kpis.filter(k => k.target_value && k.current_value >= k.target_value).length}
                </div>
                <div className="text-xs text-slate-400">Acima da Meta</div>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="mixed" className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {ventureData.kpis.filter(k => k.target_value && k.current_value < k.target_value).length}
                </div>
                <div className="text-xs text-slate-400">Abaixo da Meta</div>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="mixed" className="p-4">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-white">{ventureData.talents.length}</div>
                <div className="text-xs text-slate-400">Talentos</div>
              </div>
            </div>
          </GlowCard>
        </div>
      )}

      {/* Info Message */}
      {selectedVenture && (!ventureData?.kpis?.length) && (
        <GlowCard glowColor="mixed" className="p-6">
          <div className="text-center text-slate-400">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="mb-2">Esta venture ainda não possui KPIs registrados.</p>
            <p className="text-sm">Adicione KPIs para habilitar a análise com IA.</p>
          </div>
        </GlowCard>
      )}

      {/* Venture Score */}
      {ventureScore && <VentureScore score={ventureScore} />}

      {/* Market Data Feed */}
      {selectedVenture && venture && (
        <MarketDataFeed venture={venture} compact={false} />
      )}

      {/* Analysis Report */}
      {analysis && <AnalysisReport analysis={analysis} />}

      {/* Analysis Placeholder */}
      {!analysis && selectedVenture && ventureData?.kpis?.length > 0 && !analyzing && (
        <GlowCard glowColor="mixed" className="p-12">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 flex items-center justify-center">
              <Brain className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Análise Inteligente de Ventures</h3>
            <p className="text-slate-400 max-w-2xl mx-auto mb-6">
              Nossa IA analisa o desempenho atual, identifica riscos, gera insights preditivos e 
              sugere otimizações baseadas em dados de mercado e benchmarks do setor.
            </p>
            <Button
              onClick={analyzeVenture}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
            >
              <Brain className="w-5 h-5 mr-2" />
              Iniciar Análise com IA
            </Button>
          </div>
        </GlowCard>
      )}
    </div>
  );
}