import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Target, DollarSign } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ['#C7A763', '#00D4FF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function AdvancedReports() {
  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Venture',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const { data: kpis = [] } = useQuery({
    queryKey: ['kpis'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureKPI',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const { data: talents = [] } = useQuery({
    queryKey: ['talents'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Talent',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Expense',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const venturePerformanceData = useMemo(() => {
    return ventures.map(venture => {
      const ventureKpis = kpis.filter(k => k.venture_id === venture.id);
      const avgPerformance = ventureKpis.length > 0
        ? ventureKpis.reduce((sum, k) => {
            const performance = k.target_value > 0 ? (k.current_value / k.target_value) * 100 : 0;
            return sum + performance;
          }, 0) / ventureKpis.length
        : 0;
      
      return {
        name: venture.name,
        performance: Math.round(avgPerformance),
        kpis: ventureKpis.length
      };
    });
  }, [ventures, kpis]);

  const venturesByLayer = useMemo(() => {
    const layers = ventures.reduce((acc, v) => {
      acc[v.layer] = (acc[v.layer] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(layers).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  }, [ventures]);

  const expensesByCategory = useMemo(() => {
    const categories = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    
    return Object.entries(categories).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round(value)
    }));
  }, [expenses]);

  const talentEngagement = useMemo(() => {
    return talents.slice(0, 10).map(talent => ({
      name: talent.full_name?.split(' ')[0] || 'Talento',
      skills: talent.skills?.length || 0,
      rating: talent.rating || 0
    }));
  }, [talents]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="performance">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="performance">
            <TrendingUp className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="finances">
            <DollarSign className="w-4 h-4 mr-2" />
            Finanças
          </TabsTrigger>
          <TabsTrigger value="talents">
            <Users className="w-4 h-4 mr-2" />
            Talentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <GlowCard className="p-6">
            <h3 className="text-white font-semibold mb-4">Performance por Venture</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={venturePerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #ffffff20' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="performance" fill="#C7A763" name="Performance (%)" />
              </BarChart>
            </ResponsiveContainer>
          </GlowCard>

          <GlowCard className="p-6">
            <h3 className="text-white font-semibold mb-4">Ventures por Camada</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={venturesByLayer}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {venturesByLayer.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </GlowCard>
        </TabsContent>

        <TabsContent value="finances" className="space-y-6">
          <GlowCard className="p-6">
            <h3 className="text-white font-semibold mb-4">Despesas por Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expensesByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #ffffff20' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#00D4FF" name="Valor (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </GlowCard>
        </TabsContent>

        <TabsContent value="talents" className="space-y-6">
          <GlowCard className="p-6">
            <h3 className="text-white font-semibold mb-4">Engajamento de Talentos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={talentEngagement}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #ffffff20' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="skills" fill="#8B5CF6" name="Skills" />
                <Bar dataKey="rating" fill="#10B981" name="Rating" />
              </BarChart>
            </ResponsiveContainer>
          </GlowCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}