import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Clock, User } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CommentBox from './CommentBox';
import { format } from 'date-fns';

const priorityColors = {
  urgent: 'text-red-400 bg-red-400/10',
  high: 'text-orange-400 bg-orange-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  low: 'text-blue-400 bg-blue-400/10'
};

const statusColors = {
  todo: 'text-slate-400',
  in_progress: 'text-blue-400',
  review: 'text-purple-400',
  completed: 'text-green-400'
};

export default function UrgentTasksWidget({ ventureId }) {
  const [selectedTask, setSelectedTask] = useState(null);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['urgent-tasks', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTask',
        operation: 'filter',
        query: { 
          venture_id: ventureId,
          status: { $in: ['todo', 'in_progress'] }
        },
        sort: '-priority'
      });
      
      // Filter urgent/high priority tasks
      const allTasks = res.data?.data || [];
      return allTasks
        .filter(t => t.priority === 'urgent' || t.priority === 'high')
        .slice(0, 5);
    },
    enabled: !!ventureId
  });

  if (isLoading) {
    return (
      <GlowCard className="p-6">
        <div className="text-slate-400">Carregando tarefas...</div>
      </GlowCard>
    );
  }

  return (
    <>
      <GlowCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">Tarefas Urgentes</h3>
        </div>

        <div className="space-y-2">
          {tasks?.length > 0 ? (
            tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-white line-clamp-1">
                    {task.title}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {task.due_date && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(task.due_date), 'dd/MM/yyyy')}
                    </div>
                  )}
                  {task.assigned_to && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {task.assigned_to.split('@')[0]}
                    </div>
                  )}
                  <span className={statusColors[task.status]}>
                    {task.status}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Nenhuma tarefa urgente</p>
            </div>
          )}
        </div>
      </GlowCard>

      {/* Task Detail Modal with Comments */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="bg-[#0a1628] border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedTask?.title}</DialogTitle>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[selectedTask.priority]}`}>
                  {selectedTask.priority}
                </span>
                <span className={`text-xs ${statusColors[selectedTask.status]}`}>
                  {selectedTask.status}
                </span>
              </div>

              {selectedTask.description && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Descrição</p>
                  <p className="text-sm text-slate-300">{selectedTask.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedTask.assigned_to && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Responsável</p>
                    <p className="text-sm text-white">{selectedTask.assigned_to}</p>
                  </div>
                )}
                {selectedTask.due_date && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Prazo</p>
                    <p className="text-sm text-white">
                      {format(new Date(selectedTask.due_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-4">
                <CommentBox
                  entityType="VentureTask"
                  entityId={selectedTask.id}
                  entityName={selectedTask.title}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}