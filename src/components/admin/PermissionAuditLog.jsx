import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { History, User, Shield, Calendar, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { format } from 'date-fns';

const actionTypeLabels = {
  role_created: 'Role Criado',
  role_updated: 'Role Atualizado',
  role_deleted: 'Role Deletado',
  assignment_created: 'Atribuição Criada',
  assignment_updated: 'Atribuição Atualizada',
  assignment_deleted: 'Atribuição Removida',
  permission_changed: 'Permissão Modificada'
};

const actionTypeColors = {
  role_created: 'text-green-400',
  role_updated: 'text-blue-400',
  role_deleted: 'text-red-400',
  assignment_created: 'text-green-400',
  assignment_updated: 'text-blue-400',
  assignment_deleted: 'text-red-400',
  permission_changed: 'text-yellow-400'
};

export default function PermissionAuditLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['permissionAudit'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'PermissionAudit',
        operation: 'list',
        sort: '-created_date'
      });
      return res.data?.data || [];
    }
  });

  const filteredLogs = auditLogs?.filter(log => {
    const matchesSearch = !searchTerm || 
      log.performed_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.affected_user?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterAction === 'all' || log.action_type === filterAction;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <History className="w-5 h-5 text-[#C7A763]" />
          Auditoria de Permissões
        </h3>
        <span className="text-sm text-slate-400">{filteredLogs?.length || 0} registros</span>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por email..."
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>

        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Filtrar por ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {Object.entries(actionTypeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Audit Logs */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {isLoading && (
          <div className="text-center text-slate-400 py-8">Carregando...</div>
        )}
        
        {!isLoading && filteredLogs?.length === 0 && (
          <div className="text-center text-slate-400 py-8">Nenhum registro encontrado</div>
        )}

        {filteredLogs?.map((log, i) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <GlowCard glowColor="cyan" className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${actionTypeColors[log.action_type]}`}>
                      {actionTypeLabels[log.action_type]}
                    </span>
                    <span className="text-xs bg-white/5 text-slate-400 px-2 py-1 rounded">
                      {log.entity_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.performed_by}
                    </span>
                    {log.affected_user && (
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Afetou: {log.affected_user}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(log.created_date), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>

                  {log.reason && (
                    <p className="text-xs text-slate-300 italic">"{log.reason}"</p>
                  )}

                  {/* Changes details */}
                  {log.changes && (
                    <details className="text-xs mt-2">
                      <summary className="cursor-pointer text-[#00D4FF] hover:text-[#33E0FF]">
                        Ver detalhes das mudanças
                      </summary>
                      <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
                        {log.changes.before && (
                          <div className="mb-2">
                            <span className="text-red-400 font-medium">Antes:</span>
                            <pre className="text-slate-400 mt-1 overflow-x-auto">
                              {JSON.stringify(log.changes.before, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.changes.after && (
                          <div>
                            <span className="text-green-400 font-medium">Depois:</span>
                            <pre className="text-slate-400 mt-1 overflow-x-auto">
                              {JSON.stringify(log.changes.after, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
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