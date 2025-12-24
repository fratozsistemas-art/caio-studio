import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import GlowCard from "@/components/ui/GlowCard";
import moment from 'moment';

export default function KPIChart({ kpiName, kpiData }) {
  const chartData = [...kpiData]
    .reverse()
    .map(kpi => ({
      date: moment(kpi.measurement_date).format('DD/MM'),
      value: kpi.current_value,
      target: kpi.target_value
    }));

  return (
    <GlowCard glowColor="mixed" className="p-6">
      <h4 className="text-lg font-semibold text-white mb-4">{kpiName} - Evolução</h4>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
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
            stroke="#00D4FF"
            strokeWidth={2}
            dot={{ fill: '#00D4FF', r: 4 }}
            name="Valor Atual"
          />
          {chartData[0]?.target && (
            <Line
              type="monotone"
              dataKey="target"
              stroke="#C7A763"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Meta"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </GlowCard>
  );
}