import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Plus, Shield, Edit, Trash2, Check, X, GitBranch } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import FieldPermissionsEditor from "@/components/admin/FieldPermissionsEditor";
import { toast } from "sonner";

const permissionCategories = {
  ventures: {
    label: 'Ventures',
    permissions: [
      { key: 'view', label: 'Visualizar' },
      { key: 'create', label: 'Criar' },
      { key: 'edit', label: 'Editar' },
      { key: 'delete', label: 'Deletar' },
      { key: 'view_financials', label: 'Ver Financeiro' },
      { key: 'edit_financials', label: 'Editar Financeiro' }
    ]
  },
  tasks: {
    label: 'Tarefas',
    permissions: [
      { key: 'view', label: 'Visualizar' },
      { key: 'create', label: 'Criar' },
      { key: 'edit', label: 'Editar' },
      { key: 'delete', label: 'Deletar' },
      { key: 'assign', label: 'Atribuir' }
    ]
  },
  documents: {
    label: 'Documentos',
    permissions: [
      { key: 'view', label: 'Visualizar' },
      { key: 'upload', label: 'Upload' },
      { key: 'edit', label: 'Editar' },
      { key: 'delete', label: 'Deletar' }
    ]
  },
  collaboration: {
    label: 'Colaboração',
    permissions: [
      { key: 'view_channels', label: 'Ver Canais' },
      { key: 'create_channels', label: 'Criar Canais' },
      { key: 'post_messages', label: 'Postar Mensagens' },
      { key: 'manage_squads', label: 'Gerenciar Squads' }
    ]
  },
  analytics: {
    label: 'Analytics',
    permissions: [
      { key: 'view_dashboard', label: 'Ver Dashboard' },
      { key: 'generate_ai_insights', label: 'Gerar Insights IA' },
      { key: 'export_reports', label: 'Exportar Relatórios' }
    ]
  },
  admin: {
    label: 'Administração',
    permissions: [
      { key: 'manage_users', label: 'Gerenciar Usuários' },
      { key: 'manage_roles', label: 'Gerenciar Roles' },
      { key: 'system_settings', label: 'Configurações' }
    ]
  }
};

export default function RoleManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    role_name: '',
    description: '',
    parent_role_id: '',
    permissions: {},
    field_permissions: {},
    priority: 1
  });

  const queryClient = useQueryClient();

  const { data: roles } = useQuery({
    queryKey: ['userRoles'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'UserRole',
        operation: 'list',
        sort: '-priority'
      });
      return res.data?.data || [];
    }
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      
      // Create audit log
      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'PermissionAudit',
        operation: 'create',
        data: {
          action_type: 'role_created',
          entity_type: 'UserRole',
          performed_by: user.email,
          changes: { after: data }
        }
      });

      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'UserRole',
        operation: 'create',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userRoles']);
      toast.success('Role criado com sucesso');
      resetForm();
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data, oldData }) => {
      const user = await base44.auth.me();
      
      // Create audit log
      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'PermissionAudit',
        operation: 'create',
        data: {
          action_type: 'role_updated',
          entity_type: 'UserRole',
          entity_id: id,
          performed_by: user.email,
          changes: { before: oldData, after: data }
        }
      });

      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'UserRole',
        operation: 'update',
        entity_id: id,
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userRoles']);
      toast.success('Role atualizado');
      resetForm();
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'UserRole',
        operation: 'delete',
        entity_id: id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userRoles']);
      toast.success('Role deletado');
    }
  });

  const resetForm = () => {
    setFormData({ role_name: '', description: '', parent_role_id: '', permissions: {}, field_permissions: {}, priority: 1 });
    setEditingRole(null);
    setShowForm(false);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      role_name: role.role_name,
      description: role.description || '',
      parent_role_id: role.parent_role_id || '',
      permissions: role.permissions || {},
      field_permissions: role.field_permissions || {},
      priority: role.priority || 1
    });
    setShowForm(true);
  };

  const handlePermissionToggle = (category, permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [category]: {
          ...prev.permissions[category],
          [permission]: !prev.permissions[category]?.[permission]
        }
      }
    }));
  };

  const handleSubmit = () => {
    if (!formData.role_name.trim()) {
      toast.error('Nome do role é obrigatório');
      return;
    }

    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data: formData, oldData: editingRole });
    } else {
      createRoleMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#C7A763]" />
          Gerenciamento de Roles
        </h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Role
        </Button>
      </div>

      {showForm && (
        <GlowCard glowColor="gold" className="p-6">
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70 mb-2 block">Nome do Role *</Label>
                <Input
                  value={formData.role_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, role_name: e.target.value }))}
                  placeholder="Ex: Editor, Viewer"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white/70 mb-2 block">Prioridade</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-white/70 mb-2 block">Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do role..."
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-white/70 mb-2 block flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Role Pai (Herança)
              </Label>
              <Select
                value={formData.parent_role_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, parent_role_id: value }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Nenhum (sem herança)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {roles?.filter(r => r.id !== editingRole?.id).map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400 mt-1">
                Herda permissões do role pai automaticamente
              </p>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">Permissões</h4>
              <div className="space-y-4">
                {Object.entries(permissionCategories).map(([catKey, category]) => (
                  <div key={catKey} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <h5 className="text-white text-sm font-medium mb-3">{category.label}</h5>
                    <div className="grid md:grid-cols-3 gap-3">
                      {category.permissions.map(perm => (
                        <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                          <Switch
                            checked={formData.permissions[catKey]?.[perm.key] || false}
                            onCheckedChange={() => handlePermissionToggle(catKey, perm.key)}
                          />
                          <span className="text-sm text-slate-300">{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <FieldPermissionsEditor
              fieldPermissions={formData.field_permissions}
              onChange={(newFieldPerms) => setFormData(prev => ({ ...prev, field_permissions: newFieldPerms }))}
            />

            <div className="flex gap-3">
              <Button onClick={resetForm} variant="outline" className="border-white/10 text-white">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSubmit} className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]">
                <Check className="w-4 h-4 mr-2" />
                {editingRole ? 'Atualizar' : 'Criar'} Role
              </Button>
            </div>
          </div>
        </GlowCard>
      )}

      {/* Roles List */}
      <div className="space-y-3">
        {roles?.map((role, i) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlowCard glowColor="cyan" className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-[#00D4FF]" />
                    <h4 className="text-white font-semibold">{role.role_name}</h4>
                    <span className="text-xs bg-[#00D4FF]/20 text-[#00D4FF] px-2 py-1 rounded">
                      Prioridade: {role.priority}
                    </span>
                    {role.parent_role_id && (
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        Herda: {roles?.find(r => r.id === role.parent_role_id)?.role_name}
                      </span>
                    )}
                    {role.is_system_role && (
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                        Sistema
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-sm text-slate-400 mb-3">{role.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(role.permissions || {}).map(([cat, perms]) => {
                      const enabledPerms = Object.entries(perms).filter(([, enabled]) => enabled);
                      if (enabledPerms.length === 0) return null;
                      return (
                        <span key={cat} className="text-xs bg-white/5 text-slate-300 px-2 py-1 rounded">
                          {permissionCategories[cat]?.label}: {enabledPerms.length}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(role)}
                    className="text-white/70 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!role.is_system_role && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Deletar role "${role.role_name}"?`)) {
                          deleteRoleMutation.mutate(role.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}