import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlowCard from '@/components/ui/GlowCard';
import { Webhook, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WebhookManager({ selectedTeam, selectedList }) {
  const queryClient = useQueryClient();
  const [webhookUrl, setWebhookUrl] = useState('');

  React.useEffect(() => {
    // Auto-generate webhook URL
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin;
      setWebhookUrl(`${baseUrl}/api/functions/clickupWebhook`);
    }
  }, []);

  // Fetch existing webhooks
  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['clickup-webhooks', selectedTeam],
    queryFn: async () => {
      if (!selectedTeam) return [];
      const response = await base44.functions.invoke('clickup', {
        action: 'listWebhooks',
        teamId: selectedTeam
      });
      return response.data.webhooks || [];
    },
    enabled: !!selectedTeam
  });

  // Create webhook mutation
  const createWebhookMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('clickup', {
        action: 'createWebhook',
        listId: selectedList,
        endpoint: webhookUrl,
        events: ['taskCreated', 'taskUpdated', 'taskDeleted', 'taskCommentPosted']
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clickup-webhooks'] });
      toast.success('Webhook criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar webhook: ' + error.message);
    }
  });

  // Delete webhook mutation
  const deleteWebhookMutation = useMutation({
    mutationFn: async (webhookId) => {
      return await base44.functions.invoke('clickup', {
        action: 'deleteWebhook',
        webhookId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clickup-webhooks'] });
      toast.success('Webhook removido');
    },
    onError: (error) => {
      toast.error('Erro ao remover webhook: ' + error.message);
    }
  });

  const listWebhooks = webhooks?.filter(w => w.list_id === selectedList) || [];

  if (!selectedTeam || !selectedList) {
    return (
      <GlowCard className="p-6">
        <p className="text-slate-400 text-center">
          Selecione um time e uma lista para gerenciar webhooks
        </p>
      </GlowCard>
    );
  }

  return (
    <div className="space-y-6">
      <GlowCard glowColor="cyan" className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4FF]/20 to-[#C7A763]/20 border border-white/10 flex items-center justify-center">
            <Webhook className="w-5 h-5 text-[#00D4FF]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Webhooks em Tempo Real</h3>
            <p className="text-sm text-slate-400">Sincronização automática de atualizações do ClickUp</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 mb-4">
          <p className="text-xs text-blue-400 mb-2">
            ℹ️ Webhooks permitem que o ESIOS receba notificações instantâneas quando tarefas são criadas, atualizadas ou deletadas no ClickUp.
          </p>
          <p className="text-xs text-slate-400">
            <strong>URL do Webhook:</strong> {webhookUrl}
          </p>
        </div>

        {listWebhooks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">Nenhum webhook configurado para esta lista</p>
            <Button
              onClick={() => createWebhookMutation.mutate()}
              disabled={createWebhookMutation.isPending}
              className="bg-[#00D4FF] hover:bg-[#00B8E6] text-[#06101F]"
            >
              {createWebhookMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Ativar Webhooks
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {listWebhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-white">Webhook Ativo</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">
                    Endpoint: {webhook.endpoint}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {webhook.events?.map((event) => (
                      <Badge key={event} className="text-xs bg-[#00D4FF]/20 text-[#00D4FF]">
                        {event}
                      </Badge>
                    ))}
                  </div>
                  {webhook.health && (
                    <div className="mt-2">
                      <Badge className={`text-xs ${
                        webhook.health.status === 'active' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {webhook.health.status === 'active' ? 'Saudável' : 'Com problemas'}
                      </Badge>
                      {webhook.health.fail_count > 0 && (
                        <span className="ml-2 text-xs text-yellow-400">
                          {webhook.health.fail_count} falhas
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Deseja desativar este webhook?')) {
                      deleteWebhookMutation.mutate(webhook.id);
                    }
                  }}
                  disabled={deleteWebhookMutation.isPending}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </GlowCard>

      <GlowCard glowColor="gold" className="p-6">
        <h4 className="text-sm font-semibold text-white mb-3">Como Funciona</h4>
        <div className="space-y-3 text-xs text-slate-400">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#00D4FF]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#00D4FF] font-semibold">1</span>
            </div>
            <p>Webhook é registrado com o ClickUp para esta lista</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#00D4FF]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#00D4FF] font-semibold">2</span>
            </div>
            <p>Quando uma tarefa é modificada no ClickUp, ele envia uma notificação instantânea</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#00D4FF]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#00D4FF] font-semibold">3</span>
            </div>
            <p>ESIOS atualiza automaticamente as VentureTasks e dispara automações configuradas</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#00D4FF]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#00D4FF] font-semibold">4</span>
            </div>
            <p>Notificações são enviadas aos usuários responsáveis pelas tarefas</p>
          </div>
        </div>
      </GlowCard>
    </div>
  );
}