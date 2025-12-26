import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Brain, Target, CheckCircle2, Loader2, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function AIKPISuggestions({ ventures }) {
  const [selectedVentureId, setSelectedVentureId] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const queryClient = useQueryClient();

  const venture = ventures.find(v => v.id === selectedVentureId);

  const createKPI = useMutation({
    mutationFn: async (kpiData) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureKPI',
        operation: 'create',
        data: kpiData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ventureKPIs']);
      toast.success('KPI criado');
    }
  });

  const generateSuggestions = async () => {
    if (!venture) {
      toast.error('Selecione uma venture');
      return;
    }

    setSuggesting(true);
    try {
      const prompt = `
Você é um consultor estratégico especializado em definição de KPIs para startups e ventures.

VENTURE: ${venture.name}
Descrição: ${venture.description}
Layer: ${venture.layer}
Categoria/Indústria: ${venture.category}
Status: ${venture.status}

TAREFA:
Analise esta venture e sugira os KPIs mais relevantes e críticos para seu sucesso.
Considere:
1. Benchmarks da indústria ${venture.category}
2. Estágio de desenvolvimento (${venture.status})
3. Tipo de modelo de negócio (${venture.layer})
4. Métricas que investors e stakeholders valorizam
5. Indicadores de tração e crescimento

Forneça 6-8 KPIs essenciais com targets realistas em JSON:
- kpi_name (nome claro e objetivo)
- kpi_type (revenue, users, growth, efficiency, custom)
- target_value (meta realista e alcançável)
- unit (unidade de medida)
- period (monthly, quarterly, yearly)
- reasoning (por que este KPI é importante para esta venture)
- benchmark_context (contexto de mercado)
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            suggested_kpis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  kpi_name: { type: "string" },
                  kpi_type: { type: "string" },
                  target_value: { type: "number" },
                  unit: { type: "string" },
                  period: { type: "string" },
                  reasoning: { type: "string" },
                  benchmark_context: { type: "string" }
                }
              }
            },
            overall_strategy: { type: "string" },
            priority_order: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setSuggestions(response);
      toast.success('Sugestões geradas!');
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setSuggesting(false);
    }
  };

  const handleAddKPI = async (kpi) => {
    await createKPI.mutateAsync({
      venture_id: selectedVentureId,
      kpi_name: kpi.kpi_name,
      kpi_type: kpi.kpi_type,
      target_value: kpi.target_value,
      current_value: 0,
      unit: kpi.unit,
      period: kpi.period,
      notes: `${kpi.reasoning}\n\nBenchmark: ${kpi.benchmark_context}`
    });
  };

  const handleAddAllKPIs = async () => {
    if (!suggestions?.suggested_kpis) return;
    
    try {
      for (const kpi of suggestions.suggested_kpis) {
        await createKPI.mutateAsync({
          venture_id: selectedVentureId,
          kpi_name: kpi.kpi_name,
          kpi_type: kpi.kpi_type,
          target_value: kpi.target_value,
          current_value: 0,
          unit: kpi.unit,
          period: kpi.period,
          notes: `${kpi.reasoning}\n\nBenchmark: ${kpi.benchmark_context}`
        });
      }
      toast.success('Todos os KPIs foram criados!');
      setSuggestions(null);
    } catch (error) {
      toast.error('Erro ao criar KPIs: ' + error.message);
    }
  };

  const kpiTypeColors = {
    revenue: 'text-green-400',
    users: 'text-blue-400',
    growth: 'text-purple-400',
    efficiency: 'text-yellow-400',
    custom: 'text-slate-400'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-[#C7A763]" />
        <h3 className="text-lg font-semibold text-white">Sugestões de KPIs com IA</h3>
      </div>

      <GlowCard glowColor="gold" className="p-6 space-y-4">
        <Select value={selectedVentureId} onValueChange={setSelectedVentureId}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Selecione uma venture" />
          </SelectTrigger>
          <SelectContent>
            {ventures.map(v => (
              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {venture && (
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-slate-400 mb-2">Contexto da Venture</div>
            <div className="space-y-1 text-sm text-slate-300">
              <div><span className="text-white">Layer:</span> {venture.layer}</div>
              <div><span className="text-white">Categoria:</span> {venture.category}</div>
              <div><span className="text-white">Status:</span> {venture.status}</div>
            </div>
          </div>
        )}

        <Button
          onClick={generateSuggestions}
          disabled={!selectedVentureId || suggesting}
          className="w-full bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
        >
          {suggesting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando venture...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Gerar Sugestões de KPIs
            </>
          )}
        </Button>
      </GlowCard>

      {suggestions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {suggestions.overall_strategy && (
            <GlowCard glowColor="cyan" className="p-6">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#00D4FF]" />
                Estratégia Recomendada
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {suggestions.overall_strategy}
              </p>
            </GlowCard>
          )}

          <div className="flex items-center justify-between">
            <h4 className="text-white font-semibold">KPIs Sugeridos ({suggestions.suggested_kpis?.length})</h4>
            <Button
              onClick={handleAddAllKPIs}
              size="sm"
              className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Adicionar Todos
            </Button>
          </div>

          {suggestions.suggested_kpis?.map((kpi, index) => (
            <GlowCard key={index} glowColor="mixed" className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className="text-white font-medium">{kpi.kpi_name}</h5>
                    <span className={`text-xs font-medium ${kpiTypeColors[kpi.kpi_type]}`}>
                      {kpi.kpi_type}
                    </span>
                    {suggestions.priority_order?.[0] === kpi.kpi_name && (
                      <span className="text-xs bg-[#C7A763]/20 text-[#C7A763] px-2 py-0.5 rounded">
                        Prioridade #1
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-[#00D4FF] mb-3">
                    Meta: <span className="font-semibold">{kpi.target_value} {kpi.unit}</span>
                    <span className="text-slate-500 ml-2">({kpi.period})</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-400">Por que é importante:</span>
                      <p className="text-slate-300 mt-1">{kpi.reasoning}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Contexto de mercado:</span>
                      <p className="text-slate-300 mt-1">{kpi.benchmark_context}</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleAddKPI(kpi)}
                  size="sm"
                  variant="outline"
                  className="border-white/10 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </GlowCard>
          ))}
        </motion.div>
      )}
    </div>
  );
}