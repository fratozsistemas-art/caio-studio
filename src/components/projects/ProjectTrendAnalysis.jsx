import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import GlowCard from '@/components/ui/GlowCard';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import { format, subDays, startOfDay, differenceInDays } from 'date-fns';

export default function ProjectTrendAnalysis({ ventureId }) {
  // Fetch projects and tasks
  const { data: projects } = useQuery({
    queryKey: ['venture-projects', ventureId],
    queryFn: () => base44.entities.VentureProject.filter({ venture_id: ventureId }),
    enabled: !!ventureId
  });

  const { data: allProjectTasks } = useQuery({
    queryKey: ['all-project-tasks', ventureId],
    queryFn: async () => {
      if (!projects || projects.length === 0) return [];
      
      const allListIds = projects.flatMap(p => p.clickup_list_ids || []);
      if (allListIds.length === 0) return [];

      const taskPromises = allListIds.map(listId =>
        base44.functions.invoke('clickup', { action: 'getTasks', listId })
      );

      const results = await Promise.all(taskPromises);
      return results.flatMap(r => r.data.tasks || []);
    },
    enabled: !!projects?.length
  });

  // Calculate trend data
  const trendData = useMemo(() => {
    if (!allProjectTasks) return { completionTrend: [], bottleneckTrend: [], velocityTrend: [] };

    const last30Days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i));

    // Completion rate trend (last 30 days)
    const completionTrend = last30Days.map(date => {
      const dayStart = startOfDay(date).getTime();
      const dayEnd = dayStart + 86400000;

      const tasksUpToDate = allProjectTasks.filter(t => {
        const createdDate = new Date(t.date_created).getTime();
        return createdDate <= dayEnd;
      });

      const completedUpToDate = tasksUpToDate.filter(t => {
        if (!t.date_closed) return false;
        const closedDate = new Date(parseInt(t.date_closed)).getTime();
        return closedDate <= dayEnd;
      });

      const rate = tasksUpToDate.length > 0 
        ? Math.round((completedUpToDate.length / tasksUpToDate.length) * 100) 
        : 0;

      return {
        date: format(date, 'MMM dd'),
        rate,
        completed: completedUpToDate.length,
        total: tasksUpToDate.length
      };
    });

    // Bottleneck trend
    const bottleneckTrend = last30Days.map(date => {
      const dayEnd = startOfDay(date).getTime() + 86400000;

      const highPriorityOverdue = allProjectTasks.filter(t => {
        const isHighPriority = t.priority?.priority === 1 || t.priority?.priority === 2;
        const isOverdue = t.due_date && parseInt(t.due_date) < dayEnd && parseInt(t.due_date) > 0;
        const notCompleted = !t.status?.status?.toLowerCase().includes('complete');
        return isHighPriority && isOverdue && notCompleted;
      }).length;

      return {
        date: format(date, 'MMM dd'),
        bottlenecks: highPriorityOverdue
      };
    });

    // Velocity trend (tasks completed per week)
    const last12Weeks = Array.from({ length: 12 }, (_, i) => subDays(new Date(), (11 - i) * 7));
    const velocityTrend = last12Weeks.map(weekStart => {
      const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

      const completedThisWeek = allProjectTasks.filter(t => {
        if (!t.date_closed) return false;
        const closedDate = new Date(parseInt(t.date_closed));
        return closedDate >= weekStart && closedDate < weekEnd;
      }).length;

      return {
        week: format(weekStart, 'MMM dd'),
        completed: completedThisWeek
      };
    });

    return { completionTrend, bottleneckTrend, velocityTrend };
  }, [allProjectTasks]);

  // Calculate insights
  const insights = useMemo(() => {
    if (!trendData.completionTrend.length) return null;

    const current = trendData.completionTrend[trendData.completionTrend.length - 1];
    const previous = trendData.completionTrend[trendData.completionTrend.length - 8];

    const completionChange = current.rate - previous.rate;
    const velocityAvg = Math.round(
      trendData.velocityTrend.reduce((sum, w) => sum + w.completed, 0) / trendData.velocityTrend.length
    );

    const currentBottlenecks = trendData.bottleneckTrend[trendData.bottleneckTrend.length - 1].bottlenecks;

    return {
      completionChange,
      currentRate: current.rate,
      velocityAvg,
      currentBottlenecks
    };
  }, [trendData]);

  if (!insights) {
    return <div className="text-slate-400">Loading trend data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <div className="grid md:grid-cols-3 gap-4">
        <GlowCard glowColor="cyan" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Completion Rate Trend</span>
            {insights.completionChange >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div className="text-3xl font-bold text-white">{insights.currentRate}%</div>
          <div className={`text-sm mt-2 ${insights.completionChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {insights.completionChange >= 0 ? '+' : ''}{insights.completionChange}% vs last week
          </div>
        </GlowCard>

        <GlowCard glowColor="gold" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Avg Weekly Velocity</span>
            <Activity className="w-5 h-5 text-[#C7A763]" />
          </div>
          <div className="text-3xl font-bold text-white">{insights.velocityAvg}</div>
          <div className="text-sm text-slate-400 mt-2">tasks/week</div>
        </GlowCard>

        <GlowCard glowColor="mixed" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Current Bottlenecks</span>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-white">{insights.currentBottlenecks}</div>
          <div className="text-sm text-slate-400 mt-2">high priority overdue</div>
        </GlowCard>
      </div>

      {/* Completion Rate Trend Chart */}
      <GlowCard glowColor="cyan" className="p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Completion Rate Trend (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trendData.completionTrend}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0a1628', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="rate" 
              stroke="#10b981" 
              fillOpacity={1} 
              fill="url(#colorRate)" 
              name="Completion Rate (%)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </GlowCard>

      {/* Bottleneck Trend Chart */}
      <GlowCard glowColor="gold" className="p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Bottleneck Trend (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData.bottleneckTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0a1628', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="bottlenecks" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ fill: '#ef4444' }}
              name="Bottlenecks"
            />
          </LineChart>
        </ResponsiveContainer>
      </GlowCard>

      {/* Velocity Trend Chart */}
      <GlowCard glowColor="mixed" className="p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Team Velocity (Last 12 Weeks)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={trendData.velocityTrend}>
            <defs>
              <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C7A763" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#C7A763" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0a1628', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="completed" 
              stroke="#C7A763" 
              fillOpacity={1} 
              fill="url(#colorVelocity)" 
              name="Tasks Completed"
            />
          </AreaChart>
        </ResponsiveContainer>
      </GlowCard>
    </div>
  );
}