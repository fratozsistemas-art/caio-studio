import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Calendar, X, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function MeetingForm({ leads, currentUser, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meeting_type: 'discovery',
    lead_id: '',
    scheduled_date: '',
    duration_minutes: 60,
    location: '',
    is_virtual: true
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Meeting',
        operation: 'create',
        data: {
          ...data,
          organizer: currentUser.email,
          attendees: [currentUser.email],
          status: 'scheduled'
        }
      });
    },
    onSuccess: () => {
      toast.success('Reunião agendada com sucesso');
      onSuccess?.();
    }
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.scheduled_date) {
      toast.error('Título e data são obrigatórios');
      return;
    }
    createMeetingMutation.mutate(formData);
  };

  return (
    <GlowCard glowColor="gold" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#C7A763]" />
          <h3 className="text-white font-semibold">Agendar Reunião</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-white/70 mb-2 block">Título *</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Ex: Discovery call - Nome do Lead"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-white/70 mb-2 block">Tipo de Reunião</Label>
            <Select value={formData.meeting_type} onValueChange={(v) => setFormData(prev => ({ ...prev, meeting_type: v }))}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discovery">Discovery</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
                <SelectItem value="pitch">Pitch</SelectItem>
                <SelectItem value="negotiation">Negociação</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white/70 mb-2 block">Lead Relacionado</Label>
            <Select value={formData.lead_id} onValueChange={(v) => setFormData(prev => ({ ...prev, lead_id: v }))}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {leads.map(lead => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-white/70 mb-2 block">Data e Hora *</Label>
            <Input
              type="datetime-local"
              value={formData.scheduled_date}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <Label className="text-white/70 mb-2 block">Duração (minutos)</Label>
            <Input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Local / Link</Label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder={formData.is_virtual ? "Ex: meet.google.com/..." : "Ex: Escritório - Sala 3"}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Descrição/Agenda</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Pauta da reunião..."
            className="bg-white/5 border-white/10 text-white h-24"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="border-white/10 text-white">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createMeetingMutation.isPending} className="flex-1 bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]">
            <Save className="w-4 h-4 mr-2" />
            Agendar
          </Button>
        </div>
      </div>
    </GlowCard>
  );
}