import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import GlowCard from "@/components/ui/GlowCard";
import { Users, DollarSign, TrendingUp } from 'lucide-react';

export default function ResourceAllocation({ ventures, talents, financials }) {
  // Aggregate data by venture
  const resourceData = ventures.map(venture => {
    const ventureTalents = talents.filter(t => t.venture_id === venture.id);
    const ventureFinancials = financials.filter(f => f.venture_id === venture.id);
    
    const totalAllocation = ventureTalents.reduce((sum, t) => sum + (t.allocation || 0), 0);
    const totalInvestment = ventureFinancials.reduce((sum, f) => sum + (f.investment || 0), 0);
    const totalRevenue = ventureFinancials.reduce((sum, f) => sum + (f.revenue || 0), 0);

    return {
      name: venture.name.length > 15 ? venture.name.substring(0, 15) + '...' : venture.name,
      talentos: Math.round(totalAllocation / 100), // Convert percentage to FTE count
      investimento: totalInvestment / 1000, // In thousands
      receita: totalRevenue / 1000 // In thousands
    };
  }).sort((a, b) => (b.investimento + b.talentos) - (a.investimento + a.talentos))
    .slice(0, 10); // Top 10 ventures

  const totalTalents = resourceData.reduce((sum, v) => sum + v.talentos, 0);
  const totalInvestment = resourceData.reduce((sum, v) => sum + v.investimento, 0);
  const totalRevenue = resourceData.reduce((sum, v) => sum + v.receita, 0);

  return (
    <GlowCard glowColor="gold" className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-5 h-5 text-[#C7A763]" />
        <h3 className="text-xl font-bold text-white">Alocação de Recursos por Venture</h3>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[#00D4FF]" />
            <span className="text-xs text-white/70">Total Talentos (FTE)</span>
          </div>
          <div className="text-2xl font-bold text-[#00D4FF]">{totalTalents.toFixed(1)}</div>
        </div>
        
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-[#C7A763]" />
            <span className="text-xs text-white/70">Investimento Total</span>
          </div>
          <div className="text-2xl font-bold text-[#C7A763]">R$ {totalInvestment.toFixed(0)}k</div>
        </div>
        
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-white/70">Receita Total</span>
          </div>
          <div className="text-2xl font-bold text-green-400">R$ {totalRevenue.toFixed(0)}k</div>
        </div>
      </div>

      {/* Stacked Bar Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={resourceData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis type="number" stroke="#94a3b8" />
          <YAxis dataKey="name" type="category" width={120} stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0a1628', 
              border: '1px solid #ffffff20', 
              borderRadius: '8px' 
            }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend />
          <Bar 
            dataKey="talentos" 
            name="Talentos (FTE)" 
            fill="#00D4FF" 
            stackId="a" 
            radius={[0, 4, 4, 0]}
          />
          <Bar 
            dataKey="investimento" 
            name="Investimento (R$ mil)" 
            fill="#C7A763" 
            stackId="b" 
            radius={[0, 4, 4, 0]}
          />
          <Bar 
            dataKey="receita" 
            name="Receita (R$ mil)" 
            fill="#10B981" 
            stackId="c" 
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Efficiency Metrics */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h4 className="text-sm font-semibold text-white/80 mb-3">Métricas de Eficiência</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-white/60">Receita por Talento:</span>
            <span className="ml-2 text-green-400 font-semibold">
              R$ {totalTalents > 0 ? ((totalRevenue * 1000) / totalTalents).toFixed(0) : 0}
            </span>
          </div>
          <div>
            <span className="text-white/60">ROI Médio:</span>
            <span className="ml-2 text-[#C7A763] font-semibold">
              {totalInvestment > 0 ? ((totalRevenue / totalInvestment - 1) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>
    </GlowCard>
  );
}