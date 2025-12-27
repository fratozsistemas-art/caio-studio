import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Phone, Mail, MessageSquare, FileText, X, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function InteractionForm({ leadId, currentUser, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    interaction_type: 'call',
    direction: 'outbound',
    title: '',
    description: '',
    outcome: 'neutral',
    next_steps: '',
    duration_minutes: 30
  });

  const createInteractionMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'LeadInteraction',
        operation: 'create',
        data: {
          lead_id: leadId,
          performed_by: currentUser.email,
          ...data
        }
      });
    },
    onSuccess: () => {
      toast.success('Interação registrada com sucesso');
      onSuccess?.();
    }
  });

  const handleSubmit = () => {
    if (!formData.title) {
      toast.error('Título é obrigatório');
      return;
    }
    createInteractionMutation.mutate(formData);
  };

  const interactionIcons = {
    call: Phone,
    email: Mail,
    meeting: MessageSquare,
    note: FileText
  };

  const Icon = interactionIcons[formData.interaction_type] || Phone;

  return (
    <GlowCard glowColor="gold" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-[#C7A763]" />
          <h3 className="text-white font-semibold">Nova Interação</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-white/70 mb-2 block">Tipo *</Label>
            <Select value={formData.interaction_type} onValueChange={(v) => setFormData(prev => ({ ...prev, interaction_type: v }))}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Ligação</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="meeting">Reunião</SelectItem>
                <SelectItem value="note">Nota</SelectItem>
                <SelectItem value="proposal">Proposta</SelectItem>
                <SelectItem value="contract">Contrato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white/70 mb-2 block">Direção</Label>
            <Select value={formData.direction} onValueChange={(v) => setFormData(prev => ({ ...prev, direction: v }))}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inbound">Entrada (eles nos contataram)</SelectItem>
                <SelectItem value="outbound">Saída (nós contatamos)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Título *</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Ex: Discovery call inicial"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Descrição</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Detalhes da interação..."
            className="bg-white/5 border-white/10 text-white h-24"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-white/70 mb-2 block">Resultado</Label>
            <Select value={formData.outcome} onValueChange={(v) => setFormData(prev => ({ ...prev, outcome: v }))}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">Positivo</SelectItem>
                <SelectItem value="neutral">Neutro</SelectItem>
                <SelectItem value="negative">Negativo</SelectItem>
              </SelectContent>
            </Select>
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
          <Label className="text-white/70 mb-2 block">Próximos Passos</Label>
          <Textarea
            value={formData.next_steps}
            onChange={(e) => setFormData(prev => ({ ...prev, next_steps: e.target.value }))}
            placeholder="O que fazer em seguida..."
            className="bg-white/5 border-white/10 text-white h-20"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="border-white/10 text-white">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createInteractionMutation.isPending} className="flex-1 bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]">
            <Save className="w-4 h-4 mr-2" />
            Salvar Interação
          </Button>
        </div>
      </div>
    </GlowCard>
  );
}