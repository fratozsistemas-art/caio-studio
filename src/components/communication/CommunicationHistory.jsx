import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { Mail, Search, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CommunicationHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['communicationLogs'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'CommunicationLog',
        operation: 'filter',
        query: {}
      });
      return (res.data?.data || []).sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
    }
  });

  const statusIcons = {
    sent: { icon: CheckCircle, color: "text-green-400", label: "Enviado" },
    failed: { icon: XCircle, color: "text-red-400", label: "Falhou" },
    pending: { icon: Clock, color: "text-yellow-400", label: "Pendente" }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.recipient_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === 'sent').length,
    failed: logs.filter(l => l.status === 'failed').length,
    pending: logs.filter(l => l.status === 'pending').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">Histórico de Comunicações</h3>
        <p className="text-slate-400 text-sm mt-1">Acompanhe todas as comunicações enviadas</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <GlowCard glowColor="cyan" className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-slate-400">Total</div>
          </div>
        </GlowCard>
        <GlowCard glowColor="gold" className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats.sent}</div>
            <div className="text-xs text-slate-400">Enviados</div>
          </div>
        </GlowCard>
        <GlowCard glowColor="mixed" className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
            <div className="text-xs text-slate-400">Falharam</div>
          </div>
        </GlowCard>
        <GlowCard glowColor="cyan" className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-xs text-slate-400">Pendentes</div>
          </div>
        </GlowCard>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por email, nome ou assunto..."
              className="bg-white/5 border-white/10 text-white pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="sent">Enviados</SelectItem>
            <SelectItem value="failed">Falharam</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      {isLoading ? (
        <div className="text-slate-400">Carregando histórico...</div>
      ) : filteredLogs.length === 0 ? (
        <GlowCard className="p-8 text-center">
          <Mail className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">Nenhuma comunicação encontrada</p>
        </GlowCard>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const StatusIcon = statusIcons[log.status]?.icon || Mail;
            const statusColor = statusIcons[log.status]?.color || "text-slate-400";
            const statusLabel = statusIcons[log.status]?.label || log.status;

            return (
              <GlowCard key={log.id} glowColor="cyan" className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <StatusIcon className={`w-5 h-5 ${statusColor} mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">
                          {log.recipient_name || log.recipient_email}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${statusColor} bg-white/5`}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className="text-sm text-slate-400 mb-2">
                        {log.recipient_email}
                      </div>
                      <div className="text-white font-medium mb-1">
                        {log.subject}
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                        {log.body}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>
                          {format(new Date(log.created_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {log.template_name && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {log.template_name}
                          </span>
                        )}
                        <span>Por: {log.sent_by}</span>
                      </div>
                      {log.error_message && (
                        <div className="mt-2 text-xs text-red-400 bg-red-500/10 rounded p-2">
                          Erro: {log.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </GlowCard>
            );
          })}
        </div>
      )}
    </div>
  );
}