import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ScenarioComparison({ scenarios, onExport }) {
  const [selectedScenarios, setSelectedScenarios] = useState([]);

  const toggleScenario = (scenarioId) => {
    setSelectedScenarios(prev => 
      prev.includes(scenarioId) 
        ? prev.filter(id => id !== scenarioId)
        : prev.length < 3 ? [...prev, scenarioId] : prev
    );
  };

  const compareScenarios = scenarios.filter(s => selectedScenarios.includes(s.id));

  const prepareComparisonData = () => {
    if (compareScenarios.length === 0) return [];

    const months = compareScenarios[0]?.projections?.monthly_projections?.length || 12;
    const data = [];

    for (let i = 0; i < months; i++) {
      const monthData = { month: `M${i + 1}` };
      compareScenarios.forEach(scenario => {
        const projection = scenario.projections?.monthly_projections?.[i];
        monthData[`${scenario.scenario_name}_revenue`] = projection?.revenue || 0;
        monthData[`${scenario.scenario_name}_profit`] = projection?.net_profit || 0;
      });
      data.push(monthData);
    }

    return data;
  };

  const comparisonData = prepareComparisonData();

  const scenarioColors = ['#00D4FF', '#C7A763', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Scenario Selection */}
      <GlowCard glowColor="cyan" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Comparar Cenários</h3>
          <span className="text-sm text-slate-400">Selecione até 3 cenários</span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarios.map((scenario, index) => (
            <button
              key={scenario.id}
              onClick={() => toggleScenario(scenario.id)}
              disabled={!selectedScenarios.includes(scenario.id) && selectedScenarios.length >= 3}
              className={`p-4 rounded-xl border transition-all text-left ${
                selectedScenarios.includes(scenario.id)
                  ? 'border-[#00D4FF] bg-[#00D4FF]/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium text-sm">{scenario.scenario_name}</span>
                {selectedScenarios.includes(scenario.id) && (
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: scenarioColors[selectedScenarios.indexOf(scenario.id)] }}
                  />
                )}
              </div>
              <Badge variant="outline" className="text-xs border-white/20">
                {scenario.scenario_type}
              </Badge>
            </button>
          ))}
        </div>
      </GlowCard>

      {/* Comparison Charts */}
      {compareScenarios.length > 0 && (
        <>
          {/* Revenue Comparison */}
          <GlowCard glowColor="gold" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-[#C7A763]" />
                <h3 className="text-xl font-bold text-white">Comparação de Receita</h3>
              </div>
              <Button
                onClick={() => onExport && onExport('comparison', compareScenarios)}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Exportar Comparação
              </Button>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #ffffff20', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                {compareScenarios.map((scenario, index) => (
                  <Line
                    key={scenario.id}
                    type="monotone"
                    dataKey={`${scenario.scenario_name}_revenue`}
                    name={scenario.scenario_name}
                    stroke={scenarioColors[index]}
                    strokeWidth={2}
                    dot={{ fill: scenarioColors[index], r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </GlowCard>

          {/* Profit Comparison */}
          <GlowCard glowColor="mixed" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
              <h3 className="text-xl font-bold text-white">Comparação de Lucro Líquido</h3>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #ffffff20', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                {compareScenarios.map((scenario, index) => (
                  <Bar
                    key={scenario.id}
                    dataKey={`${scenario.scenario_name}_profit`}
                    name={scenario.scenario_name}
                    fill={scenarioColors[index]}
                    radius={[8, 8, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </GlowCard>

          {/* Key Metrics Comparison */}
          <GlowCard glowColor="cyan" className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">Principais Métricas</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/70 font-medium pb-3">Métrica</th>
                    {compareScenarios.map((scenario, index) => (
                      <th key={scenario.id} className="text-left text-white/70 font-medium pb-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: scenarioColors[index] }}
                          />
                          {scenario.scenario_name}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="py-3 text-white">Receita Total (12M)</td>
                    {compareScenarios.map(scenario => (
                      <td key={scenario.id} className="py-3 text-[#C7A763] font-semibold">
                        R$ {(scenario.projections?.key_metrics?.total_revenue || 0).toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 text-white">Lucro Total (12M)</td>
                    {compareScenarios.map(scenario => (
                      <td key={scenario.id} className="py-3 text-[#00D4FF] font-semibold">
                        R$ {(scenario.projections?.key_metrics?.total_profit || 0).toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 text-white">Margem Média</td>
                    {compareScenarios.map(scenario => (
                      <td key={scenario.id} className="py-3 text-white font-semibold">
                        {(scenario.projections?.key_metrics?.average_margin || 0).toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 text-white">Break-even (meses)</td>
                    {compareScenarios.map(scenario => (
                      <td key={scenario.id} className="py-3 text-white font-semibold">
                        {scenario.projections?.key_metrics?.break_even_month || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 text-white">ROI Projetado</td>
                    {compareScenarios.map(scenario => (
                      <td key={scenario.id} className="py-3 text-green-400 font-semibold">
                        {(scenario.projections?.key_metrics?.projected_roi || 0).toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </GlowCard>
        </>
      )}

      {compareScenarios.length === 0 && (
        <GlowCard className="p-12">
          <div className="text-center text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Selecione cenários acima para comparar</p>
          </div>
        </GlowCard>
      )}
    </div>
  );
}