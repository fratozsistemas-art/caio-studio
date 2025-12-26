import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Users, DollarSign, Target, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";
import VentureScore from "./VentureScore";
import MarketDataFeed from "./MarketDataFeed";
import AnalysisReport from "./AnalysisReport";
import PerformanceReport from "../analytics/PerformanceReport";
import SuccessDrivers from "../analytics/SuccessDrivers";
import BenchmarkComparison from "../analytics/BenchmarkComparison";

export default function VentureAnalytics({ ventures }) {
  const [selectedVentureId, setSelectedVentureId] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [calculatingScore, setCalculatingScore] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const venture = ventures.find(v => v.id === selectedVentureId);

  const { data: ventureKPIs } = useQuery({
    queryKey: ['ventureKPIs', selectedVentureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureKPI',
        operation: 'filter',
        query: { venture_id: selectedVentureId }
      });
      return res.data?.data || [];
    },
    enabled: !!selectedVentureId
  });

  const { data: ventureTalents } = useQuery({
    queryKey: ['ventureTalents', selectedVentureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTalent',
        operation: 'filter',
        query: { venture_id: selectedVentureId }
      });
      return res.data?.data || [];
    },
    enabled: !!selectedVentureId
  });

  const { data: ventureFinancials } = useQuery({
    queryKey: ['ventureFinancials', selectedVentureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'FinancialRecord',
        operation: 'filter',
        query: { venture_id: selectedVentureId }
      });
      return res.data?.data || [];
    },
    enabled: !!selectedVentureId
  });

  const { data: ventureScore, refetch: refetchScore } = useQuery({
    queryKey: ['ventureScore', selectedVentureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureScore',
        operation: 'filter',
        query: { venture_id: selectedVentureId },
        sort: '-calculated_at'
      });
      return res.data?.data?.[0] || null;
    },
    enabled: !!selectedVentureId
  });

  // Fetch all data for ML analysis
  const { data: allKPIs } = useQuery({
    queryKey: ['allKPIs'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureKPI',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const { data: allFinancials } = useQuery({
    queryKey: ['allFinancials'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'FinancialRecord',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const { data: allTalents } = useQuery({
    queryKey: ['allTalents'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTalent',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const calculateScore = async () => {
    setCalculatingScore(true);
    try {
      await base44.functions.invoke('calculateVentureScore', {
        venture_id: selectedVentureId
      });
      await refetchScore();
      toast.success('Score calculado com sucesso');
    } catch (error) {
      toast.error('Erro ao calcular score: ' + error.message);
    } finally {
      setCalculatingScore(false);
    }
  };

  const runAnalysis = async () => {
    if (!venture || !ventureKPIs) {
      toast.error('Selecione uma venture com dados');
      return;
    }

    setAnalyzing(true);
    try {
      const prompt = `
Analise os dados desta venture e forneça insights estratégicos:

VENTURE: ${venture.name}
Layer: ${venture.layer}
Status: ${venture.status}

KPIs: ${ventureKPIs.map(k => `${k.kpi_name}: ${k.current_value}/${k.target_value}`).join(', ')}
Talentos: ${ventureTalents?.length || 0}

Forneça análise completa em JSON com:
- performance_overview
- strengths (array)
- risks (array)
- recommendations (array)
- predictive_insights (array)
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            performance_overview: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            predictive_insights: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAnalysis(response);
      toast.success('Análise gerada!');
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="drivers">Drivers ML</TabsTrigger>
          <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="flex gap-4">
            <Select value={selectedVentureId} onValueChange={setSelectedVentureId}>
              <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Selecione uma venture" />
              </SelectTrigger>
              <SelectContent>
                {ventures.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={calculateScore}
              disabled={!selectedVentureId || calculatingScore}
              className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]"
            >
              {calculatingScore ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Target className="w-4 h-4 mr-2" />
              )}
              Calcular Score
            </Button>
            <Button
              onClick={runAnalysis}
              disabled={!selectedVentureId || analyzing}
              className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              Analisar com IA
            </Button>
          </div>

          {selectedVentureId && ventureKPIs && (
            <div className="grid md:grid-cols-4 gap-4">
              <GlowCard glowColor="cyan" className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-[#00D4FF]" />
                  <div>
                    <div className="text-2xl font-bold text-white">{ventureKPIs.length}</div>
                    <div className="text-xs text-slate-400">KPIs Ativos</div>
                  </div>
                </div>
              </GlowCard>

              <GlowCard glowColor="gold" className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-[#C7A763]" />
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {ventureKPIs.filter(k => k.target_value && k.current_value >= k.target_value).length}
                    </div>
                    <div className="text-xs text-slate-400">Acima da Meta</div>
                  </div>
                </div>
              </GlowCard>

              <GlowCard glowColor="mixed" className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">
                      R$ {ventureFinancials?.[ventureFinancials.length - 1]?.cash_balance || 0}
                    </div>
                    <div className="text-xs text-slate-400">Caixa Atual</div>
                  </div>
                </div>
              </GlowCard>

              <GlowCard glowColor="mixed" className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{ventureTalents?.length || 0}</div>
                    <div className="text-xs text-slate-400">Talentos</div>
                  </div>
                </div>
              </GlowCard>
            </div>
          )}

          {ventureScore && <VentureScore score={ventureScore} />}
          {selectedVentureId && venture && <MarketDataFeed venture={venture} compact={false} />}
          {analysis && <AnalysisReport analysis={analysis} />}
        </TabsContent>

        <TabsContent value="reports">
          {selectedVentureId && venture ? (
            <PerformanceReport
              venture={venture}
              kpis={ventureKPIs || []}
              financials={ventureFinancials || []}
              talents={ventureTalents || []}
            />
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Selecione uma venture para gerar relatórios</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="drivers">
          <SuccessDrivers
            ventures={ventures}
            kpis={allKPIs || []}
            financials={allFinancials || []}
            talents={allTalents || []}
          />
        </TabsContent>

        <TabsContent value="benchmark">
          <BenchmarkComparison
            ventures={ventures}
            kpis={allKPIs || []}
            financials={allFinancials || []}
            talents={allTalents || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}