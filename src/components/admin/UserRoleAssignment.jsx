import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { UserPlus, UserCog, Trash2, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function UserRoleAssignment({ ventures }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    user_email: '',
    role_id: '',
    scope: 'global',
    venture_ids: []
  });

  const queryClient = useQueryClient();

  const { data: assignments } = useQuery({
    queryKey: ['roleAssignments'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'RoleAssignment',
        operation: 'list',
        sort: '-created_date'
      });
      return res.data?.data || [];
    }
  });

  const { data: roles } = useQuery({
    queryKey: ['userRoles'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'UserRole',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      
      // Create audit log
      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'PermissionAudit',
        operation: 'create',
        data: {
          action_type: 'assignment_created',
          entity_type: 'RoleAssignment',
          performed_by: user.email,
          affected_user: data.user_email,
          changes: { after: data }
        }
      });

      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'RoleAssignment',
        operation: 'create',
        data: { ...data, assigned_by: user.email }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['roleAssignments']);
      toast.success('Role atribuído com sucesso');
      setShowForm(false);
      setFormData({ user_email: '', role_id: '', scope: 'global', venture_ids: [] });
    }
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async ({ id, assignment }) => {
      const user = await base44.auth.me();
      
      // Create audit log
      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'PermissionAudit',
        operation: 'create',
        data: {
          action_type: 'assignment_deleted',
          entity_type: 'RoleAssignment',
          entity_id: id,
          performed_by: user.email,
          affected_user: assignment.user_email,
          changes: { before: assignment }
        }
      });

      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'RoleAssignment',
        operation: 'delete',
        entity_id: id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['roleAssignments']);
      toast.success('Atribuição removida');
    }
  });

  const handleSubmit = () => {
    if (!formData.user_email || !formData.role_id) {
      toast.error('Email e Role são obrigatórios');
      return;
    }

    createAssignmentMutation.mutate(formData);
  };

  const getRoleName = (roleId) => {
    return roles?.find(r => r.id === roleId)?.role_name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <UserCog className="w-5 h-5 text-[#C7A763]" />
          Atribuir Roles a Usuários
        </h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Atribuir Role
        </Button>
      </div>

      {showForm && (
        <GlowCard glowColor="gold" className="p-6">
          <div className="space-y-4">
            <div>
              <Label className="text-white/70 mb-2 block">Email do Usuário *</Label>
              <Input
                type="email"
                value={formData.user_email}
                onChange={(e) => setFormData(prev => ({ ...prev, user_email: e.target.value }))}
                placeholder="user@example.com"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-white/70 mb-2 block">Role *</Label>
              <Select
                value={formData.role_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, role_id: value }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione um role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white/70 mb-2 block">Escopo</Label>
              <Select
                value={formData.scope}
                onValueChange={(value) => setFormData(prev => ({ ...prev, scope: value, venture_ids: [] }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (todas ventures)</SelectItem>
                  <SelectItem value="venture_specific">Ventures Específicas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.scope === 'venture_specific' && ventures && (
              <div>
                <Label className="text-white/70 mb-2 block">Ventures</Label>
                <div className="max-h-40 overflow-y-auto space-y-2 p-3 rounded-lg bg-white/5 border border-white/10">
                  {ventures.map(venture => (
                    <label key={venture.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.venture_ids.includes(venture.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              venture_ids: [...prev.venture_ids, venture.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              venture_ids: prev.venture_ids.filter(id => id !== venture.id)
                            }));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-white">{venture.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                className="border-white/10 text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Atribuir
              </Button>
            </div>
          </div>
        </GlowCard>
      )}

      {/* Assignments List */}
      <div className="space-y-3">
        {assignments?.map((assignment, i) => (
          <motion.div
            key={assignment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlowCard glowColor="cyan" className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">{assignment.user_email}</span>
                    <span className="text-xs bg-[#C7A763]/20 text-[#C7A763] px-2 py-1 rounded">
                      {getRoleName(assignment.role_id)}
                    </span>
                    <span className="text-xs bg-white/10 text-slate-400 px-2 py-1 rounded">
                      {assignment.scope === 'global' ? 'Global' : `${assignment.venture_ids?.length || 0} ventures`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Atribuído por: {assignment.assigned_by}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Remover esta atribuição?')) {
                      deleteAssignmentMutation.mutate({ id: assignment.id, assignment });
                    }
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}