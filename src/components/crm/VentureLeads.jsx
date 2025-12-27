import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Users, Phone, Mail, Building, TrendingUp, Plus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GlowCard from '@/components/ui/GlowCard';
import QuickInteractionForm from './QuickInteractionForm';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const statusColors = {
  new: 'bg-blue-500/20 text-blue-400',
  qualified: 'bg-purple-500/20 text-purple-400',
  contacted: 'bg-yellow-500/20 text-yellow-400',
  in_progress: 'bg-orange-500/20 text-orange-400',
  accepted: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400'
};

const statusLabels = {
  new: 'Novo',
  qualified: 'Qualificado',
  contacted: 'Contatado',
  in_progress: 'Em Progresso',
  accepted: 'Aceito',
  rejected: 'Rejeitado'
};

export default function VentureLeads({ ventureId, ventureName }) {
  const [showAddLead, setShowAddLead] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showInteraction, setShowInteraction] = useState(false);
  const queryClient = useQueryClient();

  const [newLead, setNewLead] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    stakeholder_type: 'founder'
  });

  const { data: leads, isLoading } = useQuery({
    queryKey: ['venture-leads', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'StakeholderLead',
        operation: 'list',
        sort: '-created_date'
      });
      // Filter leads that mention this venture or are unassigned
      const allLeads = res.data?.data || [];
      return allLeads.filter(lead => 
        !lead.notes || lead.notes.includes(ventureName) || lead.notes.includes(ventureId)
      ).slice(0, 10);
    },
    enabled: !!ventureId
  });

  const createLeadMutation = useMutation({
    mutationFn: async (leadData) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'StakeholderLead',
        operation: 'create',
        data: {
          ...leadData,
          notes: `Relacionado à venture: ${ventureName} (${ventureId})`,
          status: 'new'
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['venture-leads', ventureId]);
      setShowAddLead(false);
      setNewLead({
        full_name: '',
        email: '',
        phone: '',
        company: '',
        stakeholder_type: 'founder'
      });
      toast.success('Lead adicionado');
    }
  });

  const handleAddLead = () => {
    if (!newLead.full_name.trim() || !newLead.email.trim()) {
      toast.error('Nome e email são obrigatórios');
      return;
    }
    createLeadMutation.mutate(newLead);
  };

  return (
    <GlowCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#C7A763]" />
          <h3 className="text-lg font-bold text-white">Leads Relacionados</h3>
          <Badge className="bg-[#C7A763]/20 text-[#C7A763]">
            {leads?.length || 0}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Link to={createPageUrl('LeadManagement')}>
            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <ExternalLink className="w-3 h-3 mr-2" />
              Ver Todos
            </Button>
          </Link>
          <Dialog open={showAddLead} onOpenChange={setShowAddLead}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]">
                <Plus className="w-3 h-3 mr-2" />
                Novo Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a1628] border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">Adicionar Lead</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Nome completo *"
                  value={newLead.full_name}
                  onChange={(e) => setNewLead({...newLead, full_name: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  type="email"
                  placeholder="Email *"
                  value={newLead.email}
                  onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  placeholder="Telefone"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  placeholder="Empresa"
                  value={newLead.company}
                  onChange={(e) => setNewLead({...newLead, company: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Select 
                  value={newLead.stakeholder_type} 
                  onValueChange={(v) => setNewLead({...newLead, stakeholder_type: v})}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="founder">Founder</SelectItem>
                    <SelectItem value="corporate">Corporativo</SelectItem>
                    <SelectItem value="partner">Parceiro</SelectItem>
                    <SelectItem value="investor">Investidor</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddLead} className="w-full bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]">
                  Adicionar Lead
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-slate-400 py-8">Carregando...</div>
      ) : leads?.length === 0 ? (
        <div className="text-center text-slate-400 py-8">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum lead relacionado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads?.map((lead) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-white font-semibold">{lead.full_name}</h4>
                    <Badge className={statusColors[lead.status]}>
                      {statusLabels[lead.status]}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-slate-400">
                    {lead.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        {lead.email}
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {lead.phone}
                      </div>
                    )}
                    {lead.company && (
                      <div className="flex items-center gap-2">
                        <Building className="w-3 h-3" />
                        {lead.company}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedLead(lead);
                    setShowInteraction(true);
                  }}
                  className="bg-[#00D4FF] hover:bg-[#00B8E6] text-[#06101F]"
                >
                  <Phone className="w-3 h-3 mr-2" />
                  Registrar Interação
                </Button>
              </div>

              {lead.next_action && (
                <div className="pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs">
                    <TrendingUp className="w-3 h-3 text-[#C7A763]" />
                    <span className="text-slate-400">Próxima ação:</span>
                    <span className="text-white">{lead.next_action}</span>
                    {lead.next_action_date && (
                      <span className="text-slate-500">
                        ({format(new Date(lead.next_action_date), "dd/MM/yyyy", { locale: ptBR })})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Interaction Dialog */}
      {selectedLead && (
        <Dialog open={showInteraction} onOpenChange={setShowInteraction}>
          <DialogContent className="bg-[#0a1628] border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                Registrar Interação - {selectedLead.full_name}
              </DialogTitle>
            </DialogHeader>
            <QuickInteractionForm
              leadId={selectedLead.id}
              onSuccess={() => {
                setShowInteraction(false);
                setSelectedLead(null);
                queryClient.invalidateQueries(['venture-leads', ventureId]);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </GlowCard>
  );
}