import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Plus, Rocket, Building2, Package, Globe, Sparkles, Loader2, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FinancialScenarios({ ventureId }) {
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [scenarioType, setScenarioType] = useState('funding_round');
  const [formData, setFormData] = useState({
    scenario_name: '',
    description: '',
    assumptions: {}
  });

  const queryClient = useQueryClient();

  const { data: scenarios } = useQuery({
    queryKey: ['financialScenarios', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'FinancialScenario',
        operation: 'filter',
        query: { venture_id: ventureId }
      });
      return res.data?.data || [];
    },
    enabled: !!ventureId
  });

  const createScenarioMutation = useMutation({
    mutationFn: async (scenarioData) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'FinancialScenario',
        operation: 'create',
        data: scenarioData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['financialScenarios', ventureId]);
      toast.success('Cenário criado com sucesso');
      setShowForm(false);
      setFormData({ scenario_name: '', description: '', assumptions: {} });
    }
  });

  const generateScenario = async () => {
    if (!formData.scenario_name) {
      toast.error('Por favor, adicione um nome para o cenário');
      return;
    }

    setGenerating(true);
    try {
      const scenarioPrompts = {
        funding_round: 'Simule uma rodada de funding Series A de $2M-5M com diluição de 20-25%, incluindo impacto no runway, capacidade de contratação e aceleração de crescimento.',
        mna: 'Analise possibilidades de M&A: acquisition premium, sinergias operacionais, impacto na estrutura de custos e ROI projetado.',
        product_launch: 'Modele o lançamento de um novo produto: custos de desenvolvimento e marketing, projeção de adoção, impacto na receita e break-even.',
        market_expansion: 'Simule expansão para novo mercado: investimento inicial, curva de adoção, revenue potential e payback period.',
        custom: formData.description || 'Cenário customizado'
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um CFO experiente com expertise em modelagem financeira e análise de cenários estratégicos. Crie uma simulação financeira detalhada e realista.
        
CONTEXTO:
Venture ID: ${ventureId}

TIPO DE CENÁRIO: ${scenarioType}
DESCRIÇÃO: ${scenarioPrompts[scenarioType]}
PREMISSAS CUSTOMIZADAS: ${formData.description}
VARIÁVEIS DEFINIDAS: ${JSON.stringify(formData.assumptions)}

TAREFA:
Simule este cenário com análise de mercado e dados reais quando possível.
Considere:
1. Condições de mercado atuais e tendências da indústria
2. Benchmarks de empresas similares
3. Impactos de fatores macroeconômicos
4. Sazonalidade e ciclos de negócio
5. Riscos específicos do cenário

Forneça projeções mensais detalhadas para 12 meses com métricas realistas.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            monthly_projections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "string" },
                  revenue: { type: "number" },
                  expenses: { type: "number" },
                  cash_flow: { type: "number" },
                  cumulative_cash: { type: "number" }
                }
              }
            },
            key_metrics: {
              type: "object",
              properties: {
                total_investment_needed: { type: "number" },
                break_even_month: { type: "number" },
                roi_12_months: { type: "number" },
                runway_extension_months: { type: "number" }
              }
            },
            assumptions_used: {
              type: "array",
              items: { type: "string" }
            },
            risks: {
              type: "array",
              items: { type: "string" }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            },
            market_conditions: { type: "string" },
            sensitivity_analysis: { type: "string" }
          }
        }
      });

      await createScenarioMutation.mutateAsync({
        venture_id: ventureId,
        scenario_name: formData.scenario_name,
        scenario_type: scenarioType,
        description: formData.description,
        assumptions: formData.assumptions,
        projections: response,
        created_by_ai: true
      });
    } catch (error) {
      toast.error('Erro ao gerar cenário: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const scenarioTypes = [
    { value: 'funding_round', label: 'Rodada de Funding', icon: Rocket },
    { value: 'mna', label: 'M&A / Aquisição', icon: Building2 },
    { value: 'product_launch', label: 'Lançamento de Produto', icon: Package },
    { value: 'market_expansion', label: 'Expansão de Mercado', icon: Globe },
    { value: 'custom', label: 'Cenário Customizado', icon: Sparkles }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Cenários Financeiros</h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cenário
        </Button>
      </div>

      {/* Scenario Form */}
      {showForm && (
        <GlowCard glowColor="gold" className="p-6">
          <div className="space-y-4">
            <div>
              <Label className="text-white/70 mb-2 block">Tipo de Cenário</Label>
              <div className="grid md:grid-cols-5 gap-3">
                {scenarioTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setScenarioType(type.value)}
                      className={`p-4 rounded-xl border transition-all ${
                        scenarioType === type.value
                          ? 'border-[#C7A763] bg-[#C7A763]/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${
                        scenarioType === type.value ? 'text-[#C7A763]' : 'text-white/50'
                      }`} />
                      <span className={`text-xs block ${
                        scenarioType === type.value ? 'text-[#C7A763]' : 'text-white/70'
                      }`}>
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-white/70 mb-2 block">Nome do Cenário *</Label>
              <Input
                value={formData.scenario_name}
                onChange={(e) => setFormData(prev => ({ ...prev, scenario_name: e.target.value }))}
                placeholder="Ex: Series A - Q1 2025"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-white/70 mb-2 block">Descrição e Premissas</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o cenário e suas premissas principais..."
                className="bg-white/5 border-white/10 text-white min-h-[100px]"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                className="border-white/10 text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={generateScenario}
                disabled={generating}
                className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Cenário
                  </>
                )}
              </Button>
            </div>
          </div>
        </GlowCard>
      )}

      {/* Scenarios List */}
      {scenarios && scenarios.length > 0 ? (
        <div className="space-y-4">
          {scenarios.map((scenario, i) => {
            const Icon = scenarioTypes.find(t => t.value === scenario.scenario_type)?.icon || Sparkles;
            return (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlowCard glowColor="mixed" className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#C7A763]/10 border border-[#C7A763]/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#C7A763]" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">{scenario.scenario_name}</h4>
                        <p className="text-sm text-slate-400">{scenario.description}</p>
                      </div>
                    </div>
                    {scenario.created_by_ai && (
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                        AI Generated
                      </span>
                    )}
                  </div>

                  {scenario.projections?.monthly_projections && (
                    <div className="mt-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={scenario.projections.monthly_projections}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                          <XAxis dataKey="month" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0a1628',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px'
                            }}
                            formatter={(value) => `$${value.toLocaleString()}`}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="revenue" stroke="#00D4FF" strokeWidth={2} name="Receita" />
                          <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Despesas" />
                          <Line type="monotone" dataKey="cash_flow" stroke="#C7A763" strokeWidth={2} name="Cash Flow" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {scenario.projections?.key_metrics && (
                    <div className="grid md:grid-cols-4 gap-4 mt-6">
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-xs text-slate-400 mb-1">Investimento</div>
                        <div className="text-lg font-bold text-white">
                          ${scenario.projections.key_metrics.total_investment_needed?.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-xs text-slate-400 mb-1">Break-even</div>
                        <div className="text-lg font-bold text-white">
                          Mês {scenario.projections.key_metrics.break_even_month}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-xs text-slate-400 mb-1">ROI 12M</div>
                        <div className="text-lg font-bold text-green-400">
                          {scenario.projections.key_metrics.roi_12_months?.toFixed(1)}%
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-xs text-slate-400 mb-1">Extensão Runway</div>
                        <div className="text-lg font-bold text-white">
                          +{scenario.projections.key_metrics.runway_extension_months} meses
                        </div>
                      </div>
                    </div>
                  )}
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum cenário criado ainda</p>
        </div>
      )}
    </div>
  );
}