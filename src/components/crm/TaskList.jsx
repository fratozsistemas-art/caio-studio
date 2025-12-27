import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const PRIORITY_CONFIG = {
  low: { color: 'bg-blue-500/20 text-blue-400' },
  medium: { color: 'bg-yellow-500/20 text-yellow-400' },
  high: { color: 'bg-orange-500/20 text-orange-400' },
  urgent: { color: 'bg-red-500/20 text-red-400' }
};

export default function TaskList({ tasks, leads, currentUser }) {
  const queryClient = useQueryClient();

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTask',
        operation: 'update',
        entity_id: taskId,
        data: { status: 'completed', completed_at: new Date().toISOString() }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allTasks']);
      toast.success('Tarefa concluída');
    }
  });

  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');

  if (tasks.length === 0) {
    return (
      <GlowCard glowColor="mixed" className="p-12">
        <div className="text-center">
          <CheckSquare className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-white font-semibold mb-2">Nenhuma tarefa</h3>
          <p className="text-slate-400">Crie sua primeira tarefa</p>
        </div>
      </GlowCard>
    );
  }

  return (
    <div className="space-y-3">
      {pendingTasks.map((task) => {
        const isOverdue = task.due_date && new Date(task.due_date) < new Date();
        const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

        return (
          <GlowCard key={task.id} glowColor={isOverdue ? "gold" : "cyan"} className="p-5">
            <div className="flex items-start gap-4">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => completeTaskMutation.mutate(task.id)}
                className="flex-shrink-0 mt-1"
              >
                <CheckSquare className="w-5 h-5 text-slate-400" />
              </Button>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-white font-medium">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-slate-400 mt-1">{task.description}</p>
                    )}
                  </div>
                  <Badge className={priority.color}>{task.priority}</Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  {task.due_date && (
                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
                      {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {new Date(task.due_date).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  <span>•</span>
                  <span>Atribuído a: {task.assigned_to}</span>
                </div>
              </div>
            </div>
          </GlowCard>
        );
      })}
    </div>
  );
}