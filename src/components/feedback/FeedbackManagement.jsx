import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GlowCard from "@/components/ui/GlowCard";
import { MessageSquare, Star, Search, Filter, Eye, Edit, CheckCircle, AlertCircle, Clock, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const statusConfig = {
  new: { icon: AlertCircle, color: "text-blue-400", bg: "bg-blue-400/10", label: "Novo" },
  reviewing: { icon: Eye, color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Em Revisão" },
  in_progress: { icon: Clock, color: "text-purple-400", bg: "bg-purple-400/10", label: "Em Andamento" },
  resolved: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-400/10", label: "Resolvido" },
  closed: { icon: X, color: "text-slate-400", bg: "bg-slate-400/10", label: "Fechado" }
};

const priorityColors = {
  low: "text-slate-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  urgent: "text-red-400"
};

export default function FeedbackManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ventureFilter, setVentureFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['ventureFeedback'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureFeedback',
        operation: 'filter',
        query: {}
      });
      return (res.data?.data || []).sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
    }
  });

  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: () => base44.entities.Venture.list()
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureFeedback',
        operation: 'update',
        id,
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ventureFeedback']);
      setIsEditDialogOpen(false);
      toast.success('Feedback atualizado!');
    }
  });

  const filteredFeedbacks = feedbacks.filter(fb => {
    const matchesSearch = 
      fb.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fb.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fb.submitter_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVenture = ventureFilter === 'all' || fb.venture_id === ventureFilter;
    const matchesStatus = statusFilter === 'all' || fb.status === statusFilter;
    
    return matchesSearch && matchesVenture && matchesStatus;
  });

  const stats = {
    total: feedbacks.length,
    new: feedbacks.filter(f => f.status === 'new').length,
    in_progress: feedbacks.filter(f => f.status === 'in_progress' || f.status === 'reviewing').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length
  };

  const handleEdit = (feedback) => {
    setSelectedFeedback(feedback);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedFeedback) return;
    
    updateMutation.mutate({
      id: selectedFeedback.id,
      data: {
        status: selectedFeedback.status,
        priority: selectedFeedback.priority,
        assigned_to: selectedFeedback.assigned_to,
        admin_notes: selectedFeedback.admin_notes,
        response: selectedFeedback.response,
        responded_at: selectedFeedback.response ? new Date().toISOString() : null
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">Gestão de Feedback</h3>
        <p className="text-slate-400 text-sm mt-1">Visualize e gerencie feedback de stakeholders</p>
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
            <div className="text-2xl font-bold text-blue-400">{stats.new}</div>
            <div className="text-xs text-slate-400">Novos</div>
          </div>
        </GlowCard>
        <GlowCard glowColor="mixed" className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.in_progress}</div>
            <div className="text-xs text-slate-400">Em Andamento</div>
          </div>
        </GlowCard>
        <GlowCard glowColor="cyan" className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats.resolved}</div>
            <div className="text-xs text-slate-400">Resolvidos</div>
          </div>
        </GlowCard>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar feedback..."
            className="bg-white/5 border-white/10 text-white pl-10"
          />
        </div>
        <Select value={ventureFilter} onValueChange={setVentureFilter}>
          <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Todas ventures" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Ventures</SelectItem>
            {ventures.map(v => (
              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="new">Novos</SelectItem>
            <SelectItem value="reviewing">Em Revisão</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="resolved">Resolvidos</SelectItem>
            <SelectItem value="closed">Fechados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feedback List */}
      {isLoading ? (
        <div className="text-slate-400">Carregando feedback...</div>
      ) : filteredFeedbacks.length === 0 ? (
        <GlowCard className="p-8 text-center">
          <MessageSquare className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">Nenhum feedback encontrado</p>
        </GlowCard>
      ) : (
        <div className="space-y-3">
          {filteredFeedbacks.map((feedback) => {
            const StatusIcon = statusConfig[feedback.status]?.icon || MessageSquare;
            
            return (
              <GlowCard key={feedback.id} glowColor="cyan" className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <StatusIcon className={`w-5 h-5 ${statusConfig[feedback.status]?.color} mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-white">
                          {feedback.venture_name}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${statusConfig[feedback.status]?.bg} ${statusConfig[feedback.status]?.color}`}>
                          {statusConfig[feedback.status]?.label}
                        </span>
                        {feedback.rating > 0 && (
                          <div className="flex items-center gap-0.5">
                            {[...Array(feedback.rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-[#C7A763] text-[#C7A763]" />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-white font-medium mb-1">
                        {feedback.subject}
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                        {feedback.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{feedback.submitter_name || feedback.submitter_email}</span>
                        <span>{format(new Date(feedback.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                        {feedback.priority && (
                          <span className={priorityColors[feedback.priority]}>
                            Prioridade: {feedback.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(feedback)}
                    className="text-[#C7A763] hover:text-[#D4B474]"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </GlowCard>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#0a1628] border-white/10 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Gerenciar Feedback</DialogTitle>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Venture</div>
                <div className="text-white font-medium">{selectedFeedback.venture_name}</div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Assunto</div>
                <div className="text-white font-medium">{selectedFeedback.subject}</div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Mensagem</div>
                <div className="text-white">{selectedFeedback.message}</div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Status</Label>
                  <Select 
                    value={selectedFeedback.status} 
                    onValueChange={(v) => setSelectedFeedback({ ...selectedFeedback, status: v })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="reviewing">Em Revisão</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                      <SelectItem value="closed">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Prioridade</Label>
                  <Select 
                    value={selectedFeedback.priority || "medium"} 
                    onValueChange={(v) => setSelectedFeedback({ ...selectedFeedback, priority: v })}
                  >
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
              </div>

              <div>
                <Label className="text-white">Notas Internas</Label>
                <Textarea
                  value={selectedFeedback.admin_notes || ''}
                  onChange={(e) => setSelectedFeedback({ ...selectedFeedback, admin_notes: e.target.value })}
                  placeholder="Adicione notas para uso interno..."
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label className="text-white">Resposta ao Stakeholder</Label>
                <Textarea
                  value={selectedFeedback.response || ''}
                  onChange={(e) => setSelectedFeedback({ ...selectedFeedback, response: e.target.value })}
                  placeholder="Escreva uma resposta para o stakeholder..."
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                  className="bg-[#C7A763] hover:bg-[#A88B4A]"
                >
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}