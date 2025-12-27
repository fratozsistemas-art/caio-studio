import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Shield, Plus, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';

export default function PermissionsManager({ ventureId }) {
  const [showAddPermission, setShowAddPermission] = useState(false);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  const [newPermission, setNewPermission] = useState({
    user_email: '',
    permission_type: 'chat',
    access_level: 'view'
  });

  React.useEffect(() => {
    const getUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    getUser();
  }, []);

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['venture-permissions', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VenturePermission',
        operation: 'filter',
        query: { venture_id: ventureId },
        sort: '-created_date'
      });
      return res.data?.data || [];
    },
    enabled: !!ventureId
  });

  const addPermissionMutation = useMutation({
    mutationFn: async (permData) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VenturePermission',
        operation: 'create',
        data: permData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['venture-permissions', ventureId]);
      setShowAddPermission(false);
      setNewPermission({ user_email: '', permission_type: 'chat', access_level: 'view' });
      toast.success('Permissão adicionada');
    }
  });

  const deletePermissionMutation = useMutation({
    mutationFn: async (permId) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VenturePermission',
        operation: 'delete',
        id: permId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['venture-permissions', ventureId]);
      toast.success('Permissão removida');
    }
  });

  const handleAddPermission = () => {
    if (!newPermission.user_email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    addPermissionMutation.mutate({
      venture_id: ventureId,
      ...newPermission,
      granted_by: user?.email
    });
  };

  const permissionTypeLabels = {
    chat: 'Chat',
    tasks: 'Tarefas',
    documents: 'Documentos',
    all: 'Todos'
  };

  const accessLevelLabels = {
    view: 'Visualizar',
    edit: 'Editar',
    admin: 'Administrador'
  };

  return (
    <GlowCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#C7A763]" />
          <h3 className="text-lg font-bold text-white">Gerenciar Permissões</h3>
        </div>
        
        <Dialog open={showAddPermission} onOpenChange={setShowAddPermission}>
          <DialogTrigger asChild>
            <Button className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]">
              <UserPlus className="w-4 h-4 mr-2" />
              Adicionar Permissão
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0a1628] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Nova Permissão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Email do usuário *"
                value={newPermission.user_email}
                onChange={(e) => setNewPermission({...newPermission, user_email: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
              
              <Select 
                value={newPermission.permission_type} 
                onValueChange={(v) => setNewPermission({...newPermission, permission_type: v})}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Tipo de Permissão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="tasks">Tarefas</SelectItem>
                  <SelectItem value="documents">Documentos</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={newPermission.access_level} 
                onValueChange={(v) => setNewPermission({...newPermission, access_level: v})}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Nível de Acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">Visualizar</SelectItem>
                  <SelectItem value="edit">Editar</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleAddPermission} className="w-full bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]">
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {permissions?.map((perm) => (
          <motion.div
            key={perm.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-white">{perm.user_email}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#00D4FF]/20 text-[#00D4FF]">
                  {permissionTypeLabels[perm.permission_type]}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#C7A763]/20 text-[#C7A763]">
                  {accessLevelLabels[perm.access_level]}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Concedido por: {perm.granted_by}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deletePermissionMutation.mutate(perm.id)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
        
        {permissions?.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            Nenhuma permissão específica definida
          </div>
        )}
      </div>
    </GlowCard>
  );
}