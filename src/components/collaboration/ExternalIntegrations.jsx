import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { MessageSquare, HardDrive, Plus, Trash2, RefreshCw, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const integrationIcons = {
  slack: MessageSquare,
  google_drive: HardDrive
};

const integrationLabels = {
  slack: 'Slack',
  google_drive: 'Google Drive'
};

const integrationDescriptions = {
  slack: 'Sincronize mensagens do chat com um canal do Slack',
  google_drive: 'Sincronize documentos com uma pasta do Google Drive'
};

export default function ExternalIntegrations({ ventureId }) {
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  const [newIntegration, setNewIntegration] = useState({
    integration_type: 'slack',
    slack_channel_id: '',
    slack_webhook_url: '',
    google_drive_folder_id: '',
    sync_enabled: true,
    auto_notify: true
  });

  React.useEffect(() => {
    const getUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    getUser();
  }, []);

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['external-integrations', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ExternalIntegration',
        operation: 'filter',
        query: { venture_id: ventureId },
        sort: '-created_date'
      });
      return res.data?.data || [];
    },
    enabled: !!ventureId
  });

  const createIntegrationMutation = useMutation({
    mutationFn: async (integrationData) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ExternalIntegration',
        operation: 'create',
        data: integrationData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['external-integrations', ventureId]);
      setShowAddIntegration(false);
      setNewIntegration({
        integration_type: 'slack',
        slack_channel_id: '',
        slack_webhook_url: '',
        google_drive_folder_id: '',
        sync_enabled: true,
        auto_notify: true
      });
      toast.success('Integração adicionada');
    }
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ExternalIntegration',
        operation: 'update',
        id,
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['external-integrations', ventureId]);
      toast.success('Integração atualizada');
    }
  });

  const deleteIntegrationMutation = useMutation({
    mutationFn: async (integrationId) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ExternalIntegration',
        operation: 'delete',
        id: integrationId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['external-integrations', ventureId]);
      toast.success('Integração removida');
    }
  });

  const handleAddIntegration = () => {
    const config = {
      sync_enabled: newIntegration.sync_enabled,
      auto_notify: newIntegration.auto_notify
    };

    if (newIntegration.integration_type === 'slack') {
      if (!newIntegration.slack_channel_id || !newIntegration.slack_webhook_url) {
        toast.error('Preencha todos os campos do Slack');
        return;
      }
      config.slack_channel_id = newIntegration.slack_channel_id;
      config.slack_webhook_url = newIntegration.slack_webhook_url;
    } else if (newIntegration.integration_type === 'google_drive') {
      if (!newIntegration.google_drive_folder_id) {
        toast.error('Preencha o ID da pasta do Google Drive');
        return;
      }
      config.google_drive_folder_id = newIntegration.google_drive_folder_id;
    }

    createIntegrationMutation.mutate({
      venture_id: ventureId,
      integration_type: newIntegration.integration_type,
      config,
      created_by: user?.email,
      status: 'active'
    });
  };

  const toggleSync = (integration) => {
    updateIntegrationMutation.mutate({
      id: integration.id,
      data: {
        config: {
          ...integration.config,
          sync_enabled: !integration.config.sync_enabled
        }
      }
    });
  };

  const syncNow = async (integration) => {
    toast.info('Sincronizando...');
    await updateIntegrationMutation.mutateAsync({
      id: integration.id,
      data: { last_sync: new Date().toISOString() }
    });
    toast.success('Sincronização concluída');
  };

  return (
    <GlowCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#C7A763]" />
          <h3 className="text-lg font-bold text-white">Integrações Externas</h3>
        </div>

        <Dialog open={showAddIntegration} onOpenChange={setShowAddIntegration}>
          <DialogTrigger asChild>
            <Button className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]">
              <Plus className="w-4 h-4 mr-2" />
              Nova Integração
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0a1628] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Adicionar Integração</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select 
                value={newIntegration.integration_type} 
                onValueChange={(v) => setNewIntegration({...newIntegration, integration_type: v})}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Tipo de Integração" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="google_drive">Google Drive</SelectItem>
                </SelectContent>
              </Select>

              {newIntegration.integration_type === 'slack' && (
                <>
                  <Input
                    placeholder="ID do Canal (ex: C01234567)"
                    value={newIntegration.slack_channel_id}
                    onChange={(e) => setNewIntegration({...newIntegration, slack_channel_id: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Input
                    placeholder="Webhook URL"
                    value={newIntegration.slack_webhook_url}
                    onChange={(e) => setNewIntegration({...newIntegration, slack_webhook_url: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </>
              )}

              {newIntegration.integration_type === 'google_drive' && (
                <Input
                  placeholder="ID da Pasta do Google Drive"
                  value={newIntegration.google_drive_folder_id}
                  onChange={(e) => setNewIntegration({...newIntegration, google_drive_folder_id: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
              )}

              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-sm text-white">Sincronização automática</span>
                <Switch
                  checked={newIntegration.sync_enabled}
                  onCheckedChange={(checked) => setNewIntegration({...newIntegration, sync_enabled: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-sm text-white">Notificações automáticas</span>
                <Switch
                  checked={newIntegration.auto_notify}
                  onCheckedChange={(checked) => setNewIntegration({...newIntegration, auto_notify: checked})}
                />
              </div>

              <Button onClick={handleAddIntegration} className="w-full bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]">
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {integrations?.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            Nenhuma integração configurada
          </div>
        )}

        {integrations?.map((integration) => {
          const Icon = integrationIcons[integration.integration_type];
          return (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C7A763]/20 to-[#00D4FF]/20 border border-white/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#C7A763]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {integrationLabels[integration.integration_type]}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {integrationDescriptions[integration.integration_type]}
                    </p>
                  </div>
                </div>
                <Badge className={
                  integration.status === 'active' 
                    ? 'bg-green-500/20 text-green-400'
                    : integration.status === 'error'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-slate-500/20 text-slate-400'
                }>
                  {integration.status === 'active' ? 'Ativa' : integration.status === 'error' ? 'Erro' : 'Inativa'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Sincronização:</span>
                    <Switch
                      checked={integration.config.sync_enabled}
                      onCheckedChange={() => toggleSync(integration)}
                      className="scale-75"
                    />
                  </div>
                  {integration.last_sync && (
                    <span className="text-xs text-slate-500">
                      Última sync: {format(new Date(integration.last_sync), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => syncNow(integration)}
                    className="text-[#00D4FF] hover:text-[#00B8E6] hover:bg-[#00D4FF]/10"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteIntegrationMutation.mutate(integration.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlowCard>
  );
}