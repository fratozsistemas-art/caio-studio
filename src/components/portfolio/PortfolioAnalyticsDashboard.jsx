import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Layers, DollarSign, Rocket } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { motion } from 'framer-motion';

const COLORS = {
  startup: '#00D4FF',
  scaleup: '#C7A763',
  deeptech: '#9333EA',
  platform: '#10B981',
  cultural: '#F59E0B',
  winwin: '#EC4899'
};

export default function PortfolioAnalyticsDashboard({ ventures }) {
  const analytics = useMemo(() => {
    const byLayer = ventures.reduce((acc, v) => {
      acc[v.layer] = (acc[v.layer] || 0) + 1;
      return acc;
    }, {});

    const byStatus = ventures.reduce((acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    }, {});

    const totalFunding = ventures.reduce((sum, v) => {
      if (!v.funding_history) return sum;
      return sum + v.funding_history.reduce((fSum, round) => {
        const amount = parseFloat(round.amount?.replace(/[^0-9.]/g, '') || 0);
        return fSum + amount;
      }, 0);
    }, 0);

    const layerData = Object.entries(byLayer).map(([layer, count]) => ({
      name: layer.charAt(0).toUpperCase() + layer.slice(1),
      value: count,
      color: COLORS[layer]
    }));

    const statusData = Object.entries(byStatus).map(([status, count]) => ({
      name: status,
      ventures: count
    }));

    const activeVentures = ventures.filter(v => v.status === 'active' || v.status === 'scaling').length;
    const inDevelopment = ventures.filter(v => v.status === 'development' || v.status === 'ideation' || v.status === 'validation').length;

    return {
      layerData,
      statusData,
      totalFunding,
      activeVentures,
      inDevelopment,
      totalVentures: ventures.length
    };
  }, [ventures]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6 mb-12"
    >
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlowCard glowColor="cyan" className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/20 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-[#00D4FF]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{analytics.totalVentures}</div>
              <div className="text-xs text-slate-400">Total Ventures</div>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="gold" className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#C7A763]/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#C7A763]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{analytics.activeVentures}</div>
              <div className="text-xs text-slate-400">Ativas</div>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="mixed" className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{analytics.inDevelopment}</div>
              <div className="text-xs text-slate-400">Em Desenvolvimento</div>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="gold" className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#C7A763]/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#C7A763]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {analytics.totalFunding > 0 ? `R$${(analytics.totalFunding / 1000000).toFixed(1)}M` : 'N/A'}
              </div>
              <div className="text-xs text-slate-400">Capital Total</div>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Ventures por Camada */}
        <GlowCard glowColor="cyan" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Ventures por Camada</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analytics.layerData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.layerData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(10, 22, 40, 0.95)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </GlowCard>

        {/* Ventures por Status */}
        <GlowCard glowColor="gold" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Ventures por Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(10, 22, 40, 0.95)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="ventures" fill="#C7A763" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlowCard>
      </div>
    </motion.div>
  );
}