import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { DollarSign, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";

export default function FinancialProjectionAI({ ventureData }) {
  const [loading, setLoading] = useState(false);
  const [projections, setProjections] = useState(null);
  const [formData, setFormData] = useState({
    business_model: 'saas',
    initial_customers: '',
    avg_ticket: '',
    growth_rate: '',
    timeline_months: '36'
  });

  const generateProjections = async () => {
    if (!formData.initial_customers || !formData.avg_ticket) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const prompt = `Você é um analista financeiro especializado em startups. Gere projeções financeiras detalhadas para uma venture com:

Modelo de Negócio: ${formData.business_model}
Clientes Iniciais: ${formData.initial_customers}
Ticket Médio: R$ ${formData.avg_ticket}
Taxa de Crescimento Mensal: ${formData.growth_rate || '10'}%
Timeline: ${formData.timeline_months} meses

Dados da Venture: ${JSON.stringify(ventureData || {})}

Forneça projeções mensais incluindo:
- Receita projetada
- Custos operacionais estimados (variáveis e fixos)
- Margem bruta
- Burn rate
- Runway estimado
- Breakeven point
- Necessidades de investimento por fase
- Métricas de CAC e LTV

Seja realista e baseie-se em benchmarks da indústria.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            monthly_projections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "number" },
                  revenue: { type: "number" },
                  costs: { type: "number" },
                  gross_margin: { type: "number" },
                  customers: { type: "number" }
                }
              }
            },
            burn_rate: { type: "string" },
            runway: { type: "string" },
            breakeven_month: { type: "number" },
            total_funding_needed: { type: "string" },
            funding_phases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase: { type: "string" },
                  amount: { type: "string" },
                  timing: { type: "string" },
                  use_of_funds: { type: "string" }
                }
              }
            },
            key_metrics: {
              type: "object",
              properties: {
                cac: { type: "string" },
                ltv: { type: "string" },
                ltv_cac_ratio: { type: "string" }
              }
            }
          }
        }
      });

      setProjections(response);
      toast.success('Projeções financeiras geradas!');
    } catch (error) {
      toast.error('Erro ao gerar projeções: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="gold" className="p-6">
        <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-[#C7A763]" />
          Projeções Financeiras com IA
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-white/70 mb-2 block">Modelo de Negócio</Label>
            <Select
              value={formData.business_model}
              onValueChange={(value) => setFormData(prev => ({ ...prev, business_model: value }))}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saas">SaaS</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
                <SelectItem value="ecommerce">E-commerce</SelectItem>
                <SelectItem value="subscription">Assinatura</SelectItem>
                <SelectItem value="transactional">Transacional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white/70 mb-2 block">Timeline (meses)</Label>
            <Input
              type="number"
              value={formData.timeline_months}
              onChange={(e) => setFormData(prev => ({ ...prev, timeline_months: e.target.value }))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <Label className="text-white/70 mb-2 block">Clientes Iniciais *</Label>
            <Input
              type="number"
              value={formData.initial_customers}
              onChange={(e) => setFormData(prev => ({ ...prev, initial_customers: e.target.value }))}
              placeholder="Ex: 50"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <Label className="text-white/70 mb-2 block">Ticket Médio (R$) *</Label>
            <Input
              type="number"
              value={formData.avg_ticket}
              onChange={(e) => setFormData(prev => ({ ...prev, avg_ticket: e.target.value }))}
              placeholder="Ex: 500"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <Label className="text-white/70 mb-2 block">Taxa de Crescimento Mensal (%)</Label>
            <Input
              type="number"
              value={formData.growth_rate}
              onChange={(e) => setFormData(prev => ({ ...prev, growth_rate: e.target.value }))}
              placeholder="Ex: 10"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <Button
          onClick={generateProjections}
          disabled={loading}
          className="w-full mt-4 bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F] font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando projeções...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              Gerar Projeções
            </>
          )}
        </Button>
      </GlowCard>

      {projections && (
        <div className="space-y-6">
          {/* Chart */}
          <GlowCard glowColor="cyan" className="p-6">
            <h4 className="text-white font-semibold mb-4">Projeção de Receita e Custos</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={projections.monthly_projections}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="month" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #ffffff20' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#00D4FF" name="Receita" strokeWidth={2} />
                <Line type="monotone" dataKey="costs" stroke="#EF4444" name="Custos" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </GlowCard>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-3 gap-4">
            <GlowCard glowColor="gold" className="p-6">
              <span className="text-sm text-slate-400">Burn Rate</span>
              <p className="text-2xl font-bold text-white mt-2">{projections.burn_rate}</p>
            </GlowCard>
            <GlowCard glowColor="cyan" className="p-6">
              <span className="text-sm text-slate-400">Runway</span>
              <p className="text-2xl font-bold text-white mt-2">{projections.runway}</p>
            </GlowCard>
            <GlowCard glowColor="mixed" className="p-6">
              <span className="text-sm text-slate-400">Breakeven (mês)</span>
              <p className="text-2xl font-bold text-white mt-2">{projections.breakeven_month}</p>
            </GlowCard>
          </div>

          {/* Funding Phases */}
          <GlowCard glowColor="gold" className="p-6">
            <h4 className="text-white font-semibold mb-4">Necessidades de Investimento</h4>
            <p className="text-slate-300 mb-4">Total: <span className="text-[#C7A763] font-bold">{projections.total_funding_needed}</span></p>
            <div className="space-y-3">
              {projections.funding_phases?.map((phase, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{phase.phase}</span>
                    <span className="text-[#C7A763] font-bold">{phase.amount}</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-1">Timing: {phase.timing}</p>
                  <p className="text-sm text-slate-300">{phase.use_of_funds}</p>
                </div>
              ))}
            </div>
          </GlowCard>

          {/* Unit Economics */}
          <GlowCard glowColor="cyan" className="p-6">
            <h4 className="text-white font-semibold mb-4">Unit Economics</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-slate-400">CAC</span>
                <p className="text-white font-semibold text-lg">{projections.key_metrics?.cac}</p>
              </div>
              <div>
                <span className="text-sm text-slate-400">LTV</span>
                <p className="text-white font-semibold text-lg">{projections.key_metrics?.ltv}</p>
              </div>
              <div>
                <span className="text-sm text-slate-400">LTV/CAC Ratio</span>
                <p className="text-white font-semibold text-lg">{projections.key_metrics?.ltv_cac_ratio}</p>
              </div>
            </div>
          </GlowCard>
        </div>
      )}
    </div>
  );
}