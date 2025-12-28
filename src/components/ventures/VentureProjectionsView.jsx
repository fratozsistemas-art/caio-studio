import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Target, DollarSign, Users } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';

export default function VentureProjectionsView({ ventureId }) {
  const { data: projections = [], isLoading } = useQuery({
    queryKey: ['venture-projections', ventureId],
    queryFn: () => base44.entities.VentureProjection.filter({ venture_id: ventureId }),
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading projections...</div>;
  }

  if (projections.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No projections available yet.</p>
      </div>
    );
  }

  // Group by type
  const userProjections = projections.filter(p => p.projection_type === 'users');
  const revenueProjections = projections.filter(p => p.projection_type === 'revenue');
  const marketProjections = projections.filter(p => p.projection_type === 'market_share');

  const scenarioColors = {
    pessimistic: '#ef4444',
    realistic: '#3b82f6',
    optimistic: '#10b981'
  };

  const confidenceIcons = {
    low: '🔴',
    medium: '🟡',
    high: '🟢'
  };

  return (
    <div className="space-y-8">
      {/* Users Projections */}
      {userProjections.length > 0 && (
        <GlowCard glowColor="cyan" className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-[#00D4FF]" />
            <h3 className="text-xl font-semibold">User Growth Projections</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userProjections}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="period" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                formatter={(value, name, props) => [
                  `${value.toLocaleString()} ${props.payload.unit}`,
                  props.payload.scenario
                ]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="projected_value" 
                stroke="#00D4FF" 
                strokeWidth={2}
                dot={{ fill: '#00D4FF', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {userProjections.map((proj, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm p-3 rounded-lg bg-background/50">
                <div>
                  <span className="font-medium">{proj.period}</span>
                  <span className="ml-2 text-muted-foreground">{confidenceIcons[proj.confidence_level]} {proj.confidence_level} confidence</span>
                </div>
                <div className="text-[#00D4FF] font-semibold">
                  {proj.projected_value.toLocaleString()} {proj.unit}
                </div>
              </div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Revenue Projections */}
      {revenueProjections.length > 0 && (
        <GlowCard glowColor="gold" className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-5 h-5 text-[#C7A763]" />
            <h3 className="text-xl font-semibold">Revenue Projections</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueProjections}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="period" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                formatter={(value) => `R$ ${value.toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="projected_value" fill="#C7A763" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {revenueProjections.map((proj, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-background/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{proj.period}</span>
                  <span className="text-[#C7A763] font-semibold">R$ {proj.projected_value.toLocaleString()}</span>
                </div>
                {proj.assumptions && proj.assumptions.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <div className="font-medium mb-1">Assumptions:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {proj.assumptions.map((assumption, i) => (
                        <li key={i}>{assumption}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Market Share */}
      {marketProjections.length > 0 && (
        <GlowCard glowColor="cyan" className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
            <h3 className="text-xl font-semibold">Market Share Projections</h3>
          </div>
          <div className="space-y-4">
            {marketProjections.map((proj, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-background/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">{proj.period}</span>
                  <span className="text-3xl font-bold text-[#00D4FF]">{proj.projected_value}%</span>
                </div>
                {proj.assumptions && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    {proj.assumptions.map((assumption, i) => (
                      <div key={i}>• {assumption}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlowCard>
      )}
    </div>
  );
}