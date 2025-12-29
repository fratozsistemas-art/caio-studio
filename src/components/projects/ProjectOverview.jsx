import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import GlowCard from '@/components/ui/GlowCard';
import { Calendar, CheckCircle, Clock, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';

export default function ProjectOverview({ project }) {
  // Fetch tasks from all linked ClickUp lists
  const { data: allTasks, isLoading } = useQuery({
    queryKey: ['project-tasks', project.id, project.clickup_list_ids],
    queryFn: async () => {
      if (!project.clickup_list_ids || project.clickup_list_ids.length === 0) {
        return [];
      }

      const taskPromises = project.clickup_list_ids.map(listId =>
        base44.functions.invoke('clickup', {
          action: 'getTasks',
          listId
        })
      );

      const results = await Promise.all(taskPromises);
      return results.flatMap(r => r.data.tasks || []);
    },
    enabled: !!project.clickup_list_ids?.length
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!allTasks) return null;

    const total = allTasks.length;
    const completed = allTasks.filter(t => 
      t.status?.status?.toLowerCase().includes('complete') || 
      t.status?.status?.toLowerCase().includes('done')
    ).length;
    const inProgress = allTasks.filter(t => 
      t.status?.status?.toLowerCase().includes('progress')
    ).length;
    const overdue = allTasks.filter(t => 
      t.due_date && isPast(new Date(parseInt(t.due_date)))
    ).length;

    // Upcoming deadlines (next 7 days)
    const upcomingDeadlines = allTasks
      .filter(t => {
        if (!t.due_date) return false;
        const dueDate = new Date(parseInt(t.due_date));
        const daysUntil = differenceInDays(dueDate, new Date());
        return daysUntil >= 0 && daysUntil <= 7;
      })
      .sort((a, b) => parseInt(a.due_date) - parseInt(b.due_date));

    // Potential bottlenecks (high priority + overdue or in progress for long time)
    const bottlenecks = allTasks.filter(t => {
      const isHighPriority = t.priority?.priority === 1 || t.priority?.priority === 2;
      const isOverdue = t.due_date && isPast(new Date(parseInt(t.due_date)));
      const isStuck = t.status?.status?.toLowerCase().includes('progress');
      return isHighPriority && (isOverdue || isStuck);
    });

    return {
      total,
      completed,
      inProgress,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      upcomingDeadlines: upcomingDeadlines.slice(0, 5),
      bottlenecks: bottlenecks.slice(0, 5)
    };
  }, [allTasks]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning': return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      case 'active': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'on_hold': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'completed': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  if (isLoading) {
    return <div className="text-slate-400">Loading project data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{project.name}</h2>
          {project.description && (
            <p className="text-slate-400">{project.description}</p>
          )}
        </div>
        <Badge variant="outline" className={getStatusColor(project.status)}>
          {project.status}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <GlowCard glowColor="gold" className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm text-slate-400">Completed</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics?.completed || 0}/{metrics?.total || 0}
          </div>
        </GlowCard>

        <GlowCard glowColor="cyan" className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-slate-400">In Progress</span>
          </div>
          <div className="text-2xl font-bold text-white">{metrics?.inProgress || 0}</div>
        </GlowCard>

        <GlowCard glowColor="mixed" className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-slate-400">Overdue</span>
          </div>
          <div className="text-2xl font-bold text-white">{metrics?.overdue || 0}</div>
        </GlowCard>

        <GlowCard glowColor="gold" className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-[#C7A763]" />
            <span className="text-sm text-slate-400">Progress</span>
          </div>
          <div className="text-2xl font-bold text-white">{metrics?.completionRate || 0}%</div>
        </GlowCard>
      </div>

      {/* Progress Bar */}
      <GlowCard glowColor="cyan" className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Overall Progress</h3>
        <Progress value={metrics?.completionRate || 0} className="h-3" />
        <div className="flex justify-between mt-2 text-sm text-slate-400">
          <span>{metrics?.completed || 0} tasks completed</span>
          <span>{metrics?.total - metrics?.completed || 0} remaining</span>
        </div>
      </GlowCard>

      {/* Timeline */}
      {(project.start_date || project.target_date) && (
        <GlowCard glowColor="gold" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#C7A763]" />
            Timeline
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {project.start_date && (
              <div>
                <div className="text-sm text-slate-400 mb-1">Start Date</div>
                <div className="text-white">{format(new Date(project.start_date), 'MMM dd, yyyy')}</div>
              </div>
            )}
            {project.target_date && (
              <div>
                <div className="text-sm text-slate-400 mb-1">Target Date</div>
                <div className="text-white">{format(new Date(project.target_date), 'MMM dd, yyyy')}</div>
                {isPast(new Date(project.target_date)) && (
                  <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 mt-1">
                    Overdue
                  </Badge>
                )}
              </div>
            )}
          </div>
        </GlowCard>
      )}

      {/* Upcoming Deadlines */}
      {metrics?.upcomingDeadlines?.length > 0 && (
        <GlowCard glowColor="mixed" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Upcoming Deadlines (Next 7 Days)</h3>
          <div className="space-y-3">
            {metrics.upcomingDeadlines.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex-1">
                  <div className="text-white font-medium">{task.name}</div>
                  <div className="text-sm text-slate-400 mt-1">
                    Due: {format(new Date(parseInt(task.due_date)), 'MMM dd, yyyy')}
                  </div>
                </div>
                <a
                  href={task.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C7A763] hover:text-[#A88B4A] text-sm"
                >
                  View →
                </a>
              </div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Bottlenecks */}
      {metrics?.bottlenecks?.length > 0 && (
        <GlowCard glowColor="gold" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Potential Bottlenecks
          </h3>
          <div className="space-y-3">
            {metrics.bottlenecks.map((task) => (
              <div key={task.id} className="flex items-start justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <div className="flex-1">
                  <div className="text-white font-medium">{task.name}</div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-xs">
                      {task.priority?.priority === 1 ? 'Urgent' : 'High Priority'}
                    </Badge>
                    <Badge variant="outline" className="bg-white/5 text-white border-white/10 text-xs">
                      {task.status?.status}
                    </Badge>
                  </div>
                </div>
                <a
                  href={task.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  View →
                </a>
              </div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Team Members */}
      {project.team_members?.length > 0 && (
        <GlowCard glowColor="cyan" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00D4FF]" />
            Team Members
          </h3>
          <div className="flex flex-wrap gap-2">
            {project.team_members.map((email, idx) => (
              <Badge key={idx} variant="outline" className="bg-white/5 text-white border-white/10">
                {email}
              </Badge>
            ))}
          </div>
        </GlowCard>
      )}
    </div>
  );
}