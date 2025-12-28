import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Hook to trigger webhook when lead status changes
export const useLeadStatusAutomation = () => {
  const queryClient = useQueryClient();

  const triggerAutomation = useMutation({
    mutationFn: async ({ lead_id, old_status, new_status, lead_data }) => {
      const response = await base44.functions.invoke('crmLeadStatusWebhook', {
        lead_id,
        old_status,
        new_status,
        lead_data
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.automations_executed && data.automations_executed.length > 0) {
        const automations = data.automations_executed.map(a => a.type).join(', ');
        toast.success(`Automações executadas: ${automations}`);
      }
      queryClient.invalidateQueries(['stakeholderLeads']);
      queryClient.invalidateQueries(['taskReminders']);
    },
    onError: (error) => {
      toast.error('Erro ao executar automações: ' + error.message);
    }
  });

  return triggerAutomation;
};

// Component to display automation status
export default function AutomationStatus({ automations = [] }) {
  if (!automations || automations.length === 0) return null;

  const automationLabels = {
    task_reminder_created: '📅 Lembrete agendado',
    welcome_email_sent: '✉️ Email de boas-vindas enviado',
    post_pitch_reminder_created: '🎯 Follow-up pós-pitch agendado'
  };

  return (
    <div className="mt-3 p-3 bg-green-400/10 border border-green-400/20 rounded-lg">
      <div className="text-green-400 font-semibold text-sm mb-2">✓ Automações Executadas</div>
      <ul className="space-y-1">
        {automations.map((automation, idx) => (
          <li key={idx} className="text-slate-300 text-xs">
            {automationLabels[automation.type] || automation.type}
            {automation.scheduled_for && (
              <span className="text-slate-500 ml-2">
                ({new Date(automation.scheduled_for).toLocaleDateString()})
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}