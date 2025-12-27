import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Bell, Plus, Clock, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";
import ReminderForm from "@/components/crm/ReminderForm";
import { toast } from "sonner";

export default function ReminderCenter({ reminders, tasks, meetings, currentUser }) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const pendingReminders = reminders.filter(r => r.status === 'pending');
  const overdueReminders = pendingReminders.filter(r => new Date(r.scheduled_for) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Central de Lembretes</h3>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Lembrete
        </Button>
      </div>

      {overdueReminders.length > 0 && (
        <GlowCard glowColor="gold" className="p-5 border-2 border-red-500/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <div className="text-white font-medium">Lembretes Vencidos</div>
              <div className="text-sm text-slate-400">{overdueReminders.length} lembretes precisam de atenção</div>
            </div>
          </div>
        </GlowCard>
      )}

      {showForm && (
        <ReminderForm
          tasks={tasks}
          meetings={meetings}
          currentUser={currentUser}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries(['taskReminders']);
          }}
        />
      )}

      <div className="space-y-3">
        {pendingReminders.length === 0 ? (
          <GlowCard glowColor="mixed" className="p-12">
            <div className="text-center">
              <Bell className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-white font-semibold mb-2">Nenhum lembrete pendente</h3>
              <p className="text-slate-400">Crie lembretes para não perder prazos importantes</p>
            </div>
          </GlowCard>
        ) : (
          pendingReminders.map((reminder) => {
            const isOverdue = new Date(reminder.scheduled_for) < new Date();
            const task = tasks.find(t => t.id === reminder.task_id);
            const meeting = meetings.find(m => m.id === reminder.meeting_id);

            return (
              <GlowCard key={reminder.id} glowColor={isOverdue ? "gold" : "cyan"} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className={`w-4 h-4 ${isOverdue ? 'text-red-400' : 'text-[#00D4FF]'}`} />
                      <Badge className={isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}>
                        {reminder.reminder_type}
                      </Badge>
                    </div>
                    <p className="text-white text-sm mb-2">{reminder.message}</p>
                    {(task || meeting) && (
                      <p className="text-xs text-slate-400">
                        Relacionado: {task?.title || meeting?.title}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(reminder.scheduled_for).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </GlowCard>
            );
          })
        )}
      </div>
    </div>
  );
}