import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Users, UserPlus, Shield, Mail, Trash2, Key, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function UserManagement() {
  const [showInvite, setShowInvite] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'user'
  });

  const [newPermission, setNewPermission] = useState({
    venture_id: '',
    permission_type: 'all',
    access_level: 'view'
  });

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'User',
        operation: 'list',
        sort: '-created_date'
      });
      return res.data?.data || [];
    }
  });

  // Fetch all ventures for permission assignment
  const { data: ventures } = useQuery({
    queryKey: ['ventures-list'],
    queryFn: () => base44.entities.Venture.list('-created_date', 100)
  });

  // Fetch permissions for selected user
  const { data: userPermissions } = useQuery({
    queryKey: ['user-permissions', selectedUser?.email],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VenturePermission',
        operation: 'filter',
        query: { user_email: selectedUser.email },
        sort: '-created_date'
      });
      return res.data?.data || [];
    },
    enabled: !!selectedUser?.email
  });

  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      return await base44.users.inviteUser(email, role);
    },
    onSuccess: () => {
      toast.success('Convite enviado com sucesso');
      setShowInvite(false);
      setInviteData({ email: '', role: 'user' });
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao enviar convite');
    }
  });

  const addPermissionMutation = useMutation({
    mutationFn: async (permData) => {
      const currentUser = await base44.auth.me();
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VenturePermission',
        operation: 'create',
        data: {
          ...permData,
          user_email: selectedUser.email,
          granted_by: currentUser.email
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-permissions', selectedUser?.email]);
      setNewPermission({ venture_id: '', permission_type: 'all', access_level: 'view' });
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
      queryClient.invalidateQueries(['user-permissions', selectedUser?.email]);
      toast.success('Permissão removida');
    }
  });

  const handleInvite = () => {
    if (!inviteData.email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }
    inviteUserMutation.mutate(inviteData);
  };

  const handleAddPermission = () => {
    if (!newPermission.venture_id) {
      toast.error('Selecione uma venture');
      return;
    }
    addPermissionMutation.mutate(newPermission);
  };

  const filteredUsers = users?.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C7A763]/20 to-[#00D4FF]/20 border border-white/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#C7A763]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Gerenciamento de Usuários</h2>
            <p className="text-sm text-slate-400">{users?.length || 0} usuários no sistema</p>
          </div>
        </div>

        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogTrigger asChild>
            <Button className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]">
              <UserPlus className="w-4 h-4 mr-2" />
              Convidar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0a1628] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Convidar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Email *"
                value={inviteData.email}
                onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
              
              <Select 
                value={inviteData.role} 
                onValueChange={(v) => setInviteData({...inviteData, role: v})}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Papel no Sistema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-xs text-blue-400">
                  Um convite será enviado por email. O usuário poderá criar sua conta ao clicar no link.
                </p>
              </div>

              <Button 
                onClick={handleInvite} 
                disabled={inviteUserMutation.isPending}
                className="w-full bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]"
              >
                <Mail className="w-4 h-4 mr-2" />
                Enviar Convite
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <GlowCard className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar usuários por email ou nome..."
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>
      </GlowCard>

      {/* Users List */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlowCard className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C7A763]/30 to-[#00D4FF]/30 flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || user.email.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white">{user.full_name || 'Sem nome'}</h4>
                    <p className="text-xs text-slate-400">{user.email}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge className={user.role === 'admin' ? 'bg-[#C7A763]/20 text-[#C7A763]' : 'bg-slate-500/20 text-slate-400'}>
                        {user.role === 'admin' ? 'Admin' : 'Usuário'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedUser(user);
                  setShowPermissions(true);
                }}
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                <Shield className="w-3 h-3 mr-2" />
                Gerenciar Permissões
              </Button>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* Permissions Dialog */}
      <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
        <DialogContent className="bg-[#0a1628] border-white/10 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              Permissões - {selectedUser?.full_name || selectedUser?.email}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Add Permission */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h4 className="text-sm font-semibold text-white mb-3">Adicionar Nova Permissão</h4>
              <div className="space-y-3">
                <Select 
                  value={newPermission.venture_id} 
                  onValueChange={(v) => setNewPermission({...newPermission, venture_id: v})}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Selecione uma Venture" />
                  </SelectTrigger>
                  <SelectContent>
                    {ventures?.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-2 gap-3">
                  <Select 
                    value={newPermission.permission_type} 
                    onValueChange={(v) => setNewPermission({...newPermission, permission_type: v})}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="chat">Chat</SelectItem>
                      <SelectItem value="tasks">Tarefas</SelectItem>
                      <SelectItem value="documents">Documentos</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select 
                    value={newPermission.access_level} 
                    onValueChange={(v) => setNewPermission({...newPermission, access_level: v})}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">Visualizar</SelectItem>
                      <SelectItem value="edit">Editar</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleAddPermission}
                  disabled={addPermissionMutation.isPending}
                  className="w-full bg-[#00D4FF] hover:bg-[#00B8E6] text-[#06101F]"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Adicionar Permissão
                </Button>
              </div>
            </div>

            {/* Current Permissions */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Permissões Atuais</h4>
              <div className="space-y-2">
                {userPermissions?.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    Nenhuma permissão específica atribuída
                  </p>
                ) : (
                  userPermissions?.map((perm) => {
                    const venture = ventures?.find(v => v.id === perm.venture_id);
                    return (
                      <div
                        key={perm.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">
                              {venture?.name || 'Venture Desconhecida'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Badge className="text-xs bg-[#00D4FF]/20 text-[#00D4FF]">
                              {permissionTypeLabels[perm.permission_type]}
                            </Badge>
                            <Badge className="text-xs bg-[#C7A763]/20 text-[#C7A763]">
                              {accessLevelLabels[perm.access_level]}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deletePermissionMutation.mutate(perm.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}