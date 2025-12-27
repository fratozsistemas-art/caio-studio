import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Bell, X, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function ReminderForm({ tasks, meetings, currentUser, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    reminder_type: 'custom',
    scheduled_for: '',
    recipient_email: currentUser.email,
    message: '',
    task_id: '',
    meeting_id: ''
  });

  const createReminderMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'TaskReminder',
        operation: 'create',
        data: { ...data, status: 'pending' }
      });
    },
    onSuccess: () => {
      toast.success('Lembrete criado com sucesso');
      onSuccess?.();
    }
  });

  const handleSubmit = () => {
    if (!formData.scheduled_for || !formData.message) {
      toast.error('Data e mensagem são obrigatórios');
      return;
    }
    createReminderMutation.mutate(formData);
  };

  return (
    <GlowCard glowColor="gold" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#C7A763]" />
          <h3 className="text-white font-semibold">Novo Lembrete</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-white/70 mb-2 block">Tipo</Label>
            <Select value={formData.reminder_type} onValueChange={(v) => setFormData(prev => ({ ...prev, reminder_type: v }))}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task_due">Vencimento de Tarefa</SelectItem>
                <SelectItem value="meeting_upcoming">Reunião Próxima</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white/70 mb-2 block">Quando Enviar *</Label>
            <Input
              type="datetime-local"
              value={formData.scheduled_for}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_for: e.target.value }))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Para</Label>
          <Input
            value={formData.recipient_email}
            onChange={(e) => setFormData(prev => ({ ...prev, recipient_email: e.target.value }))}
            placeholder="email@exemplo.com"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Mensagem *</Label>
          <Textarea
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Lembrete sobre..."
            className="bg-white/5 border-white/10 text-white h-24"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="border-white/10 text-white">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createReminderMutation.isPending} className="flex-1 bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]">
            <Save className="w-4 h-4 mr-2" />
            Criar Lembrete
          </Button>
        </div>
      </div>
    </GlowCard>
  );
}