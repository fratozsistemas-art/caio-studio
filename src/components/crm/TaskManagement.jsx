import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Plus, CheckSquare, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";
import TaskForm from "@/components/crm/TaskForm";
import TaskList from "@/components/crm/TaskList";

export default function TaskManagement({ tasks, leads, currentUser }) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const overdueTasks = tasks.filter(t => 
    t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Gerenciamento de Tarefas</h3>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {overdueTasks.length > 0 && (
        <GlowCard glowColor="gold" className="p-4 border-2 border-red-500/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <div className="text-white font-medium">Tarefas Atrasadas</div>
              <div className="text-sm text-slate-400">{overdueTasks.length} tarefas precisam de atenção</div>
            </div>
          </div>
        </GlowCard>
      )}

      {showForm && (
        <TaskForm
          leads={leads}
          currentUser={currentUser}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries(['allTasks']);
          }}
        />
      )}

      <TaskList tasks={tasks} leads={leads} currentUser={currentUser} />
    </div>
  );
}