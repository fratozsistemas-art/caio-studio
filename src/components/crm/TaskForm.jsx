import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { CheckSquare, X, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function TaskForm({ leads, currentUser, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to: currentUser.email
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTask',
        operation: 'create',
        data: {
          ...data,
          status: 'todo',
          assigned_by: currentUser.email,
          venture_id: '' // CRM tasks não precisam de venture_id
        }
      });
    },
    onSuccess: () => {
      toast.success('Tarefa criada com sucesso');
      onSuccess?.();
    }
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.assigned_to) {
      toast.error('Título e responsável são obrigatórios');
      return;
    }
    createTaskMutation.mutate(formData);
  };

  return (
    <GlowCard glowColor="gold" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-[#C7A763]" />
          <h3 className="text-white font-semibold">Nova Tarefa</h3>
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
            placeholder="Ex: Enviar proposta para Lead X"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Descrição</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Detalhes da tarefa..."
            className="bg-white/5 border-white/10 text-white h-24"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-white/70 mb-2 block">Prioridade</Label>
            <Select value={formData.priority} onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v }))}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white/70 mb-2 block">Data de Vencimento</Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Responsável *</Label>
          <Input
            value={formData.assigned_to}
            onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
            placeholder="email@exemplo.com"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="border-white/10 text-white">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createTaskMutation.isPending} className="flex-1 bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]">
            <Save className="w-4 h-4 mr-2" />
            Criar Tarefa
          </Button>
        </div>
      </div>
    </GlowCard>
  );
}