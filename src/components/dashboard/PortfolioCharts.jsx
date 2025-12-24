import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import GlowCard from "@/components/ui/GlowCard";

export default function PortfolioCharts({ data, type = 'performance' }) {
  if (!data) return null;

  const { ventures, kpis, financials } = data;

  // Ventures by Layer
  const layerData = Object.entries(
    ventures.reduce((acc, v) => {
      acc[v.layer] = (acc[v.layer] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // KPIs by Type
  const kpiTypeData = Object.entries(
    kpis.reduce((acc, k) => {
      acc[k.kpi_type] = (acc[k.kpi_type] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Financial Trend
  const financialTrend = financials
    .sort((a, b) => new Date(a.record_date) - new Date(b.record_date))
    .slice(-12)
    .map(f => ({
      date: new Date(f.record_date).toLocaleDateString('pt-BR', { month: 'short' }),
      revenue: f.revenue,
      expenses: f.expenses
    }));

  const COLORS = ['#00D4FF', '#C7A763', '#A88B4A', '#8B7355', '#6B5B4F', '#4A4238'];

  if (type === 'financial') {
    return (
      <div className="space-y-6">
        <GlowCard glowColor="gold" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Tendência Financeira</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={financialTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#94a3b8" />
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
            </LineChart>
          </ResponsiveContainer>
        </GlowCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Layer Distribution */}
        <GlowCard glowColor="cyan" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Distribuição por Camada</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={layerData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {layerData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </GlowCard>

        {/* KPI Types */}
        <GlowCard glowColor="gold" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">KPIs por Tipo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={kpiTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a1628',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="#C7A763" />
            </BarChart>
          </ResponsiveContainer>
        </GlowCard>
      </div>
    </div>
  );
}