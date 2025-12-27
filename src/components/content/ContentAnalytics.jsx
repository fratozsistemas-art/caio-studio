import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, FileText, Eye, Download, 
  Clock, Users, Target, Activity 
} from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#C7A763', '#00D4FF', '#8B5CF6', '#10B981', '#F59E0B'];

export default function ContentAnalytics() {
  const [timeRange, setTimeRange] = React.useState('30');

  const { data: assets } = useQuery({
    queryKey: ['content-assets-analytics'],
    queryFn: async () => {
      const res = await base44.asServiceRole.entities.ContentAsset.list('-created_date', 100);
      return res || [];
    }
  });

  const { data: versions } = useQuery({
    queryKey: ['content-versions-analytics'],
    queryFn: async () => {
      const res = await base44.asServiceRole.entities.ContentAssetVersion.list('-created_date', 500);
      return res || [];
    }
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!assets) return null;

    const daysAgo = parseInt(timeRange);
    const cutoffDate = subDays(new Date(), daysAgo);

    const recentAssets = assets.filter(a => 
      new Date(a.created_date) >= cutoffDate
    );

    const recentVersions = versions?.filter(v => 
      new Date(v.created_date) >= cutoffDate
    ) || [];

    const totalAssets = assets.length;
    const newAssets = recentAssets.length;
    const totalVersions = versions?.length || 0;
    const newVersions = recentVersions.length;
    const avgVersionsPerAsset = totalAssets > 0 ? (totalVersions / totalAssets).toFixed(1) : 0;

    // Group by category
    const byCategory = assets.reduce((acc, asset) => {
      acc[asset.category] = (acc[asset.category] || 0) + 1;
      return acc;
    }, {});

    // Group by type
    const byType = assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {});

    // Timeline data
    const timeline = {};
    recentAssets.forEach(asset => {
      const date = format(new Date(asset.created_date), 'dd/MM');
      timeline[date] = (timeline[date] || 0) + 1;
    });

    // Most updated assets
    const mostUpdated = [...assets]
      .sort((a, b) => (b.current_version || 1) - (a.current_version || 1))
      .slice(0, 5);

    return {
      totalAssets,
      newAssets,
      totalVersions,
      newVersions,
      avgVersionsPerAsset,
      byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
      byType: Object.entries(byType).map(([name, value]) => ({ name, value })),
      timeline: Object.entries(timeline).map(([date, count]) => ({ date, count })),
      mostUpdated
    };
  }, [assets, versions, timeRange]);

  if (!metrics) {
    return <div className="text-white">Carregando analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics de Conteúdo</h2>
          <p className="text-slate-400 text-sm mt-1">Métricas e desempenho do conteúdo publicado</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <GlowCard glowColor="gold" className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#C7A763]" />
            <div>
              <div className="text-xs text-slate-400">Total de Assets</div>
              <div className="text-2xl font-bold text-white">{metrics.totalAssets}</div>
              <div className="text-xs text-green-400">+{metrics.newAssets} novos</div>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="cyan" className="p-4">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-[#00D4FF]" />
            <div>
              <div className="text-xs text-slate-400">Total Versões</div>
              <div className="text-2xl font-bold text-white">{metrics.totalVersions}</div>
              <div className="text-xs text-green-400">+{metrics.newVersions} recentes</div>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="mixed" className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-xs text-slate-400">Média Versões/Asset</div>
              <div className="text-2xl font-bold text-white">{metrics.avgVersionsPerAsset}</div>
              <div className="text-xs text-slate-500">por documento</div>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="gold" className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-400" />
            <div>
              <div className="text-xs text-slate-400">Atividade</div>
              <div className="text-2xl font-bold text-white">
                {((metrics.newAssets + metrics.newVersions) / parseInt(timeRange)).toFixed(1)}
              </div>
              <div className="text-xs text-slate-500">updates/dia</div>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Timeline */}
        <GlowCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Timeline de Criação</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={metrics.timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a1628', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#C7A763" 
                strokeWidth={2}
                name="Novos Assets"
              />
            </LineChart>
          </ResponsiveContainer>
        </GlowCard>

        {/* By Category */}
        <GlowCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Distribuição por Categoria</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={metrics.byCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {metrics.byCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a1628', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </GlowCard>
      </div>

      {/* By Type */}
      <GlowCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Assets por Tipo</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={metrics.byType}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0a1628', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="value" fill="#00D4FF" name="Quantidade" />
          </BarChart>
        </ResponsiveContainer>
      </GlowCard>

      {/* Most Updated Assets */}
      <GlowCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Assets Mais Atualizados</h3>
        <div className="space-y-3">
          {metrics.mostUpdated.map((asset, idx) => (
            <div 
              key={asset.id} 
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C7A763]/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#C7A763]">#{idx + 1}</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold">{asset.title}</h4>
                  <p className="text-xs text-slate-400">{asset.category}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-[#00D4FF]/20 text-[#00D4FF]">
                  {asset.current_version || 1} versões
                </Badge>
                <p className="text-xs text-slate-500 mt-1">
                  {format(new Date(asset.updated_date || asset.created_date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}