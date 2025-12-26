import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Loader2, Award, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function BenchmarkComparison({ ventures, kpis, financials, talents }) {
  const [selectedVenture, setSelectedVenture] = useState('');
  const [loading, setLoading] = useState(false);
  const [benchmark, setBenchmark] = useState(null);

  const generateBenchmark = async () => {
    if (!selectedVenture) return;
    
    setLoading(true);
    try {
      const venture = ventures.find(v => v.id === selectedVenture);
      const ventureKPIs = kpis.filter(k => k.venture_id === selectedVenture);
      const ventureFinancials = financials.filter(f => f.venture_id === selectedVenture);
      const ventureTalents = talents.filter(t => t.venture_id === selectedVenture);

      const prompt = `
You are a market research analyst. Generate industry benchmark comparisons for this venture:

VENTURE: ${venture.name}
Layer: ${venture.layer}
Status: ${venture.status}
Team Size: ${venture.team_size || 'N/A'}

CURRENT METRICS:
KPIs: ${ventureKPIs.map(k => `${k.kpi_name}: ${k.current_value}${k.unit}`).join(', ')}
Latest Revenue: R$ ${ventureFinancials[ventureFinancials.length - 1]?.revenue || 0}
Team Performance Avg: ${ventureTalents.length > 0 ? (ventureTalents.reduce((s, t) => s + (t.performance_score || 0), 0) / ventureTalents.length).toFixed(1) : 'N/A'}

Generate realistic industry benchmarks and comparisons. Return JSON:
{
  "industry_benchmarks": {
    "revenue_growth": { "industry_avg": 0-100, "venture_score": 0-100, "percentile": 0-100 },
    "team_efficiency": { "industry_avg": 0-100, "venture_score": 0-100, "percentile": 0-100 },
    "profitability": { "industry_avg": 0-100, "venture_score": 0-100, "percentile": 0-100 },
    "innovation_index": { "industry_avg": 0-100, "venture_score": 0-100, "percentile": 0-100 },
    "market_position": { "industry_avg": 0-100, "venture_score": 0-100, "percentile": 0-100 }
  },
  "competitive_position": "leader|strong|average|developing",
  "similar_ventures": [
    { "name": "Example Venture", "similarity": 0-100, "performance": "outperforming|matching|underperforming" }
  ],
  "performance_gaps": [
    { "metric": "metric name", "gap": "positive|negative", "magnitude": 0-100, "recommendation": "text" }
  ],
  "strengths_vs_industry": ["strength1", "strength2"],
  "areas_for_improvement": ["area1", "area2"]
}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            industry_benchmarks: {
              type: "object",
              properties: {
                revenue_growth: {
                  type: "object",
                  properties: {
                    industry_avg: { type: "number" },
                    venture_score: { type: "number" },
                    percentile: { type: "number" }
                  }
                },
                team_efficiency: {
                  type: "object",
                  properties: {
                    industry_avg: { type: "number" },
                    venture_score: { type: "number" },
                    percentile: { type: "number" }
                  }
                },
                profitability: {
                  type: "object",
                  properties: {
                    industry_avg: { type: "number" },
                    venture_score: { type: "number" },
                    percentile: { type: "number" }
                  }
                },
                innovation_index: {
                  type: "object",
                  properties: {
                    industry_avg: { type: "number" },
                    venture_score: { type: "number" },
                    percentile: { type: "number" }
                  }
                },
                market_position: {
                  type: "object",
                  properties: {
                    industry_avg: { type: "number" },
                    venture_score: { type: "number" },
                    percentile: { type: "number" }
                  }
                }
              }
            },
            competitive_position: { type: "string" },
            similar_ventures: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  similarity: { type: "number" },
                  performance: { type: "string" }
                }
              }
            },
            performance_gaps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  metric: { type: "string" },
                  gap: { type: "string" },
                  magnitude: { type: "number" },
                  recommendation: { type: "string" }
                }
              }
            },
            strengths_vs_industry: { type: "array", items: { type: "string" } },
            areas_for_improvement: { type: "array", items: { type: "string" } }
          }
        }
      });

      setBenchmark(response);
      toast.success('Benchmark gerado!');
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getPositionColor = (position) => {
    switch (position?.toLowerCase()) {
      case 'leader': return 'text-green-400 bg-green-500/20';
      case 'strong': return 'text-blue-400 bg-blue-500/20';
      case 'average': return 'text-yellow-400 bg-yellow-500/20';
      case 'developing': return 'text-orange-400 bg-orange-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const radarData = benchmark ? Object.entries(benchmark.industry_benchmarks).map(([key, value]) => ({
    metric: key.replace(/_/g, ' '),
    'Indústria': value.industry_avg,
    'Venture': value.venture_score
  })) : [];

  const barData = benchmark ? Object.entries(benchmark.industry_benchmarks).map(([key, value]) => ({
    name: key.replace(/_/g, ' '),
    Indústria: value.industry_avg,
    Venture: value.venture_score,
    Percentil: value.percentile
  })) : [];

  return (
    <GlowCard glowColor="mixed" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-[#C7A763]" />
          <h3 className="text-xl font-bold text-white">Benchmark vs Indústria</h3>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <Select value={selectedVenture} onValueChange={setSelectedVenture}>
          <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Selecione uma venture" />
          </SelectTrigger>
          <SelectContent>
            {ventures?.map(v => (
              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={generateBenchmark}
          disabled={!selectedVenture || loading}
          className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <BarChart3 className="w-4 h-4 mr-2" />
          )}
          Comparar
        </Button>
      </div>

      {benchmark ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Competitive Position */}
          <div className="p-5 rounded-lg bg-gradient-to-br from-[#C7A763]/10 to-transparent border border-[#C7A763]/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-semibold mb-1">Posição Competitiva</h4>
                <p className="text-sm text-slate-400">Classificação vs indústria</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-lg font-bold ${getPositionColor(benchmark.competitive_position)}`}>
                {benchmark.competitive_position?.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="p-5 rounded-lg bg-white/5 border border-white/10">
            <h4 className="text-white font-semibold mb-4">Comparação Multi-Dimensional</h4>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#ffffff20" />
                <PolarAngleAxis dataKey="metric" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis stroke="#ffffff20" />
                <Radar name="Indústria" dataKey="Indústria" stroke="#C7A763" fill="#C7A763" fillOpacity={0.3} />
                <Radar name="Venture" dataKey="Venture" stroke="#00D4FF" fill="#00D4FF" fillOpacity={0.5} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="p-5 rounded-lg bg-white/5 border border-white/10">
            <h4 className="text-white font-semibold mb-4">Métricas Detalhadas</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #ffffff20', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="Indústria" fill="#C7A763" />
                <Bar dataKey="Venture" fill="#00D4FF" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Gaps */}
          <div>
            <h4 className="text-white font-semibold mb-3">Gaps de Performance</h4>
            <div className="space-y-3">
              {benchmark.performance_gaps?.map((gap, i) => (
                <div key={i} className={`p-4 rounded-lg ${
                  gap.gap === 'positive' 
                    ? 'bg-green-500/10 border border-green-500/20' 
                    : 'bg-red-500/10 border border-red-500/20'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h5 className="text-white font-semibold">{gap.metric}</h5>
                      <p className="text-sm text-slate-300 mt-1">{gap.recommendation}</p>
                    </div>
                    <div className={`ml-4 text-2xl font-bold ${
                      gap.gap === 'positive' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {gap.gap === 'positive' ? '+' : '-'}{gap.magnitude}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Similar Ventures */}
          {benchmark.similar_ventures?.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-3">Ventures Similares</h4>
              <div className="grid md:grid-cols-2 gap-3">
                {benchmark.similar_ventures.map((similar, i) => (
                  <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="text-white font-semibold">{similar.name}</h5>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          similar.performance === 'outperforming' ? 'bg-green-500/20 text-green-400' :
                          similar.performance === 'matching' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {similar.performance}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#C7A763]">{similar.similarity}%</div>
                        <div className="text-xs text-slate-400">similaridade</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Improvements */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-green-400" />
                Forças vs Indústria
              </h5>
              <ul className="space-y-2">
                {benchmark.strengths_vs_industry?.map((strength, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <h5 className="text-white font-semibold mb-3">Áreas para Melhoria</h5>
              <ul className="space-y-2">
                {benchmark.areas_for_improvement?.map((area, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0" />
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Selecione uma venture e clique em comparar</p>
          <p className="text-xs mt-2">Benchmarks baseados em dados da indústria</p>
        </div>
      )}
    </GlowCard>
  );
}