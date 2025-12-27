import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import GlowCard from '@/components/ui/GlowCard';
import { TrendingUp } from 'lucide-react';

export default function KPIHistoryChart({ kpis }) {
  // Group KPIs by name and create time series
  const kpiGroups = kpis.reduce((acc, kpi) => {
    if (!acc[kpi.kpi_name]) {
      acc[kpi.kpi_name] = [];
    }
    acc[kpi.kpi_name].push({
      date: new Date(kpi.updated_date || kpi.created_date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      value: kpi.current_value,
      target: kpi.target_value
    });
    return acc;
  }, {});

  // Take top 3 KPIs with most data points
  const topKPIs = Object.entries(kpiGroups)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);

  if (topKPIs.length === 0) {
    return null;
  }

  const colors = ['#00D4FF', '#C7A763', '#10B981'];

  return (
    <GlowCard glowColor="cyan" className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
        <h4 className="text-lg font-bold text-white">Histórico de KPIs</h4>
      </div>

      <div className="space-y-6">
        {topKPIs.map(([name, data], idx) => (
          <div key={name}>
            <h5 className="text-sm font-semibold text-white mb-3">{name}</h5>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a1628',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={colors[idx]} 
                  strokeWidth={2} 
                  name="Valor Atual"
                  dot={{ fill: colors[idx], r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#94a3b8" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  name="Meta"
                  dot={{ fill: '#94a3b8', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </GlowCard>
  );
}