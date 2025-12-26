import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Calendar, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function AIFinancialForecasting({ ventures }) {
  const [selectedVentureId, setSelectedVentureId] = useState('');
  const [forecastPeriod, setForecastPeriod] = useState('12');
  const [forecasting, setForecasting] = useState(false);
  const [forecast, setForecast] = useState(null);

  const venture = ventures.find(v => v.id === selectedVentureId);

  const { data: financials = [] } = useQuery({
    queryKey: ['financials', selectedVentureId],
    queryFn: async () => {
      if (!selectedVentureId) return [];
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'FinancialRecord',
        operation: 'filter',
        query: { venture_id: selectedVentureId },
        sort: 'record_date'
      });
      return res.data?.data || [];
    },
    enabled: !!selectedVentureId
  });

  const { data: kpis = [] } = useQuery({
    queryKey: ['kpis', selectedVentureId],
    queryFn: async () => {
      if (!selectedVentureId) return [];
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureKPI',
        operation: 'filter',
        query: { venture_id: selectedVentureId }
      });
      return res.data?.data || [];
    },
    enabled: !!selectedVentureId
  });

  const generateForecast = async () => {
    if (!selectedVentureId || financials.length === 0) {
      toast.error('Selecione uma venture com dados financeiros históricos');
      return;
    }

    setForecasting(true);
    try {
      // Prepare historical data
      const historicalData = financials.map(f => ({
        date: f.record_date,
        revenue: f.revenue,
        expenses: f.expenses,
        cash_balance: f.cash_balance,
        investment: f.investment || 0
      }));

      // Calculate trends
      const avgRevenue = financials.reduce((sum, f) => sum + f.revenue, 0) / financials.length;
      const avgExpenses = financials.reduce((sum, f) => sum + f.expenses, 0) / financials.length;
      const growthRate = financials.length > 1 
        ? ((financials[financials.length - 1].revenue - financials[0].revenue) / financials[0].revenue) * 100
        : 0;

      const prompt = `
Você é um analista financeiro especializado. Analise os dados históricos e gere previsões financeiras detalhadas.

VENTURE: ${venture.name}
Layer: ${venture.layer}
Categoria: ${venture.category}

DADOS HISTÓRICOS (${financials.length} períodos):
${historicalData.map(d => `${d.date}: Receita: R$ ${d.revenue}, Despesas: R$ ${d.expenses}, Caixa: R$ ${d.cash_balance}`).join('\n')}

MÉTRICAS ATUAIS:
- Receita média: R$ ${avgRevenue.toFixed(2)}
- Despesas médias: R$ ${avgExpenses.toFixed(2)}
- Taxa de crescimento: ${growthRate.toFixed(2)}%

KPIs RELEVANTES:
${kpis.slice(0, 5).map(k => `${k.kpi_name}: ${k.current_value} / ${k.target_value}`).join('\n')}

TAREFA:
Gere previsões financeiras para os próximos ${forecastPeriod} meses considerando:
1. Tendências históricas de receita e despesas
2. Sazonalidade e padrões identificados
3. Contexto de mercado e indústria ${venture.category}
4. Performance de KPIs
5. Riscos e oportunidades

Forneça em JSON:
- monthly_forecast (array de ${forecastPeriod} objetos com: month, revenue, expenses, cash_balance, confidence_level)
- key_insights (array de strings com insights principais)
- growth_drivers (array de strings com fatores de crescimento)
- risk_factors (array de strings com riscos identificados)
- recommended_actions (array de strings com ações recomendadas)
- confidence_analysis (string explicando nível de confiança)
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            monthly_forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "string" },
                  revenue: { type: "number" },
                  expenses: { type: "number" },
                  cash_balance: { type: "number" },
                  confidence_level: { type: "number" }
                }
              }
            },
            key_insights: { type: "array", items: { type: "string" } },
            growth_drivers: { type: "array", items: { type: "string" } },
            risk_factors: { type: "array", items: { type: "string" } },
            recommended_actions: { type: "array", items: { type: "string" } },
            confidence_analysis: { type: "string" }
          }
        }
      });

      setForecast(response);
      toast.success('Previsão gerada com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar previsão: ' + error.message);
    } finally {
      setForecasting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-[#00D4FF]" />
        <h3 className="text-lg font-semibold text-white">Previsão Financeira com IA</h3>
      </div>

      <GlowCard glowColor="cyan" className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Venture</label>
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
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-2 block">Período de Previsão</label>
            <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
                <SelectItem value="18">18 meses</SelectItem>
                <SelectItem value="24">24 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedVentureId && (
          <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5">
            <Calendar className="w-5 h-5 text-[#00D4FF]" />
            <div className="text-sm text-slate-300">
              Dados históricos: <span className="text-white font-medium">{financials.length} períodos</span>
            </div>
          </div>
        )}

        <Button
          onClick={generateForecast}
          disabled={!selectedVentureId || financials.length === 0 || forecasting}
          className="w-full bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]"
        >
          {forecasting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando Previsão...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Gerar Previsão com IA
            </>
          )}
        </Button>
      </GlowCard>

      {forecast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Chart */}
          <GlowCard glowColor="cyan" className="p-6">
            <h4 className="text-white font-semibold mb-4">Projeção Financeira - {forecastPeriod} meses</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecast.monthly_forecast}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C7A763" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C7A763" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #ffffff20' }}
                  labelStyle={{ color: '#ffffff' }}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#00D4FF" fillOpacity={1} fill="url(#colorRevenue)" name="Receita" />
                <Area type="monotone" dataKey="expenses" stroke="#C7A763" fillOpacity={1} fill="url(#colorExpenses)" name="Despesas" />
              </AreaChart>
            </ResponsiveContainer>
          </GlowCard>

          {/* Key Insights */}
          <GlowCard glowColor="gold" className="p-6">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#C7A763]" />
              Principais Insights
            </h4>
            <ul className="space-y-2">
              {forecast.key_insights?.map((insight, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C7A763] mt-2" />
                  {insight}
                </li>
              ))}
            </ul>
          </GlowCard>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Growth Drivers */}
            <GlowCard glowColor="cyan" className="p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Fatores de Crescimento
              </h4>
              <ul className="space-y-2">
                {forecast.growth_drivers?.map((driver, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-green-400">↗</span>
                    {driver}
                  </li>
                ))}
              </ul>
            </GlowCard>

            {/* Risk Factors */}
            <GlowCard glowColor="gold" className="p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Fatores de Risco
              </h4>
              <ul className="space-y-2">
                {forecast.risk_factors?.map((risk, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-red-400">⚠</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </GlowCard>
          </div>

          {/* Recommended Actions */}
          <GlowCard glowColor="mixed" className="p-6">
            <h4 className="text-white font-semibold mb-4">Ações Recomendadas</h4>
            <div className="space-y-3">
              {forecast.recommended_actions?.map((action, i) => (
                <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-start gap-3">
                    <span className="text-[#00D4FF] font-bold">{i + 1}</span>
                    <p className="text-sm text-slate-300">{action}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlowCard>

          {/* Confidence Analysis */}
          {forecast.confidence_analysis && (
            <GlowCard glowColor="cyan" className="p-6">
              <h4 className="text-white font-semibold mb-3">Análise de Confiança</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {forecast.confidence_analysis}
              </p>
            </GlowCard>
          )}
        </motion.div>
      )}
    </div>
  );
}