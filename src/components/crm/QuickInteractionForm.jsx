import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

export default function QuickInteractionForm({ leadId, onSuccess }) {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  const [interaction, setInteraction] = useState({
    interaction_type: 'call',
    direction: 'outbound',
    title: '',
    description: '',
    outcome: 'neutral',
    next_steps: '',
    duration_minutes: ''
  });

  React.useEffect(() => {
    const getUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    getUser();
  }, []);

  const createInteractionMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'LeadInteraction',
        operation: 'create',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lead-interactions']);
      toast.success('Interação registrada');
      if (onSuccess) onSuccess();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!interaction.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    createInteractionMutation.mutate({
      lead_id: leadId,
      ...interaction,
      duration_minutes: interaction.duration_minutes ? parseInt(interaction.duration_minutes) : undefined,
      performed_by: user?.email
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select 
          value={interaction.interaction_type} 
          onValueChange={(v) => setInteraction({...interaction, interaction_type: v})}
        >
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="call">Ligação</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="meeting">Reunião</SelectItem>
            <SelectItem value="note">Nota</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={interaction.direction} 
          onValueChange={(v) => setInteraction({...interaction, direction: v})}
        >
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Direção" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inbound">Recebida</SelectItem>
            <SelectItem value="outbound">Enviada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Input
        placeholder="Título da interação *"
        value={interaction.title}
        onChange={(e) => setInteraction({...interaction, title: e.target.value})}
        className="bg-white/5 border-white/10 text-white"
        required
      />

      <Textarea
        placeholder="Descrição detalhada"
        value={interaction.description}
        onChange={(e) => setInteraction({...interaction, description: e.target.value})}
        className="bg-white/5 border-white/10 text-white min-h-[100px]"
      />

      <div className="grid grid-cols-2 gap-4">
        <Select 
          value={interaction.outcome} 
          onValueChange={(v) => setInteraction({...interaction, outcome: v})}
        >
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Resultado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="positive">Positivo</SelectItem>
            <SelectItem value="neutral">Neutro</SelectItem>
            <SelectItem value="negative">Negativo</SelectItem>
          </SelectContent>
        </Select>

        {(interaction.interaction_type === 'call' || interaction.interaction_type === 'meeting') && (
          <Input
            type="number"
            placeholder="Duração (minutos)"
            value={interaction.duration_minutes}
            onChange={(e) => setInteraction({...interaction, duration_minutes: e.target.value})}
            className="bg-white/5 border-white/10 text-white"
          />
        )}
      </div>

      <Textarea
        placeholder="Próximos passos / Follow-up"
        value={interaction.next_steps}
        onChange={(e) => setInteraction({...interaction, next_steps: e.target.value})}
        className="bg-white/5 border-white/10 text-white"
      />

      <Button
        type="submit"
        disabled={createInteractionMutation.isPending}
        className="w-full bg-[#00D4FF] hover:bg-[#00B8E6] text-[#06101F]"
      >
        Registrar Interação
      </Button>
    </form>
  );
}