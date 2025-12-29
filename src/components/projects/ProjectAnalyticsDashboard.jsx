import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import GlowCard from '@/components/ui/GlowCard';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Clock, Target, Zap } from 'lucide-react';
import { isPast } from 'date-fns';

export default function ProjectAnalyticsDashboard({ ventureId }) {
  // Fetch all projects for venture
  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ['venture-projects', ventureId],
    queryFn: () => base44.entities.VentureProject.filter({ venture_id: ventureId }),
    enabled: !!ventureId
  });

  // Fetch tasks for all projects
  const { data: allProjectTasks, isLoading: loadingTasks } = useQuery({
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

  // Calculate consolidated metrics
  const metrics = useMemo(() => {
    if (!projects || !allProjectTasks) return null;

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;

    const totalTasks = allProjectTasks.length;
    const completedTasks = allProjectTasks.filter(t => 
      t.status?.status?.toLowerCase().includes('complete') || 
      t.status?.status?.toLowerCase().includes('done')
    ).length;
    const inProgressTasks = allProjectTasks.filter(t => 
      t.status?.status?.toLowerCase().includes('progress')
    ).length;
    const overdueTasks = allProjectTasks.filter(t => 
      t.due_date && isPast(new Date(parseInt(t.due_date)))
    ).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Project status distribution
    const statusDist = [
      { name: 'Active', value: projects.filter(p => p.status === 'active').length, color: '#10b981' },
      { name: 'Planning', value: projects.filter(p => p.status === 'planning').length, color: '#6366f1' },
      { name: 'On Hold', value: projects.filter(p => p.status === 'on_hold').length, color: '#f59e0b' },
      { name: 'Completed', value: projects.filter(p => p.status === 'completed').length, color: '#3b82f6' }
    ].filter(s => s.value > 0);

    // Tasks by project
    const tasksByProject = projects.map(project => {
      const projectListIds = project.clickup_list_ids || [];
      const projectTasks = allProjectTasks.filter(task => 
        projectListIds.some(listId => task.list?.id === listId)
      );
      const completed = projectTasks.filter(t => 
        t.status?.status?.toLowerCase().includes('complete')
      ).length;

      return {
        name: project.name,
        total: projectTasks.length,
        completed,
        pending: projectTasks.length - completed
      };
    });

    // Bottleneck analysis
    const bottlenecks = allProjectTasks.filter(t => {
      const isHighPriority = t.priority?.priority === 1 || t.priority?.priority === 2;
      const isOverdue = t.due_date && isPast(new Date(parseInt(t.due_date)));
      const isStuck = t.status?.status?.toLowerCase().includes('progress');
      return isHighPriority && (isOverdue || isStuck);
    }).length;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completionRate,
      statusDist,
      tasksByProject,
      bottlenecks
    };
  }, [projects, allProjectTasks]);

  if (loadingProjects || loadingTasks) {
    return <div className="text-slate-400">Loading analytics...</div>;
  }

  if (!metrics) {
    return <div className="text-slate-400">No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlowCard glowColor="gold" className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[#C7A763]/20">
              <Target className="w-5 h-5 text-[#C7A763]" />
            </div>
            <span className="text-sm text-slate-400">Total Projects</span>
          </div>
          <div className="text-3xl font-bold text-white">{metrics.totalProjects}</div>
          <div className="text-xs text-slate-500 mt-2">
            {metrics.activeProjects} active • {metrics.completedProjects} completed
          </div>
        </GlowCard>

        <GlowCard glowColor="cyan" className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-slate-400">Completion Rate</span>
          </div>
          <div className="text-3xl font-bold text-white">{metrics.completionRate}%</div>
          <div className="text-xs text-slate-500 mt-2">
            {metrics.completedTasks} of {metrics.totalTasks} tasks
          </div>
        </GlowCard>

        <GlowCard glowColor="mixed" className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-slate-400">In Progress</span>
          </div>
          <div className="text-3xl font-bold text-white">{metrics.inProgressTasks}</div>
          <div className="text-xs text-slate-500 mt-2">Active work items</div>
        </GlowCard>

        <GlowCard glowColor="gold" className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm text-slate-400">Bottlenecks</span>
          </div>
          <div className="text-3xl font-bold text-white">{metrics.bottlenecks}</div>
          <div className="text-xs text-slate-500 mt-2">
            {metrics.overdueTasks} overdue tasks
          </div>
        </GlowCard>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <GlowCard glowColor="cyan" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Project Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={metrics.statusDist}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {metrics.statusDist.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </GlowCard>

        {/* Tasks by Project */}
        <GlowCard glowColor="gold" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Tasks by Project</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={metrics.tasksByProject}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a1628', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" />
              <Bar dataKey="pending" stackId="a" fill="#6366f1" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </GlowCard>
      </div>

      {/* Overall Progress */}
      <GlowCard glowColor="mixed" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Overall Venture Progress</h3>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#C7A763]" />
            <span className="text-2xl font-bold text-white">{metrics.completionRate}%</span>
          </div>
        </div>
        <Progress value={metrics.completionRate} className="h-4" />
        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">{metrics.completedTasks}</div>
            <div className="text-sm text-slate-400">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">{metrics.inProgressTasks}</div>
            <div className="text-sm text-slate-400">In Progress</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-400">
              {metrics.totalTasks - metrics.completedTasks - metrics.inProgressTasks}
            </div>
            <div className="text-sm text-slate-400">Todo</div>
          </div>
        </div>
      </GlowCard>
    </div>
  );
}