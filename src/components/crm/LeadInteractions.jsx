import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Plus, Phone, Mail, MessageSquare, FileText, TrendingUp, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import InteractionForm from "@/components/crm/InteractionForm";
import InteractionTimeline from "@/components/crm/InteractionTimeline";

export default function LeadInteractions({ leads, selectedLeadId, onSelectLead, currentUser }) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: interactionsResponse } = useQuery({
    queryKey: ['leadInteractions', selectedLeadId],
    queryFn: async () => {
      if (!selectedLeadId) return { data: [] };
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'LeadInteraction',
        operation: 'filter',
        query: { lead_id: selectedLeadId },
        sort: '-created_date'
      });
      return response.data;
    },
    enabled: !!selectedLeadId
  });

  const interactions = interactionsResponse?.data || [];
  const selectedLead = leads.find(l => l.id === selectedLeadId);

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Select value={selectedLeadId || ''} onValueChange={onSelectLead}>
          <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Selecione um lead" />
          </SelectTrigger>
          <SelectContent>
            {leads.map(lead => (
              <SelectItem key={lead.id} value={lead.id}>
                {lead.full_name} - {lead.company || lead.stakeholder_type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedLeadId && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Interação
          </Button>
        )}
      </div>

      {selectedLeadId && selectedLead && (
        <>
          <GlowCard glowColor="cyan" className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-semibold text-lg mb-1">{selectedLead.full_name}</h3>
                <p className="text-slate-400 text-sm">{selectedLead.email}</p>
                {selectedLead.company && (
                  <p className="text-slate-400 text-sm">{selectedLead.company}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Score</div>
                <div className="text-2xl font-bold text-[#00D4FF]">{selectedLead.qualification_score || 0}</div>
              </div>
            </div>
          </GlowCard>

          {showForm && (
            <InteractionForm
              leadId={selectedLeadId}
              currentUser={currentUser}
              onClose={() => setShowForm(false)}
              onSuccess={() => {
                setShowForm(false);
                queryClient.invalidateQueries(['leadInteractions', selectedLeadId]);
              }}
            />
          )}

          <InteractionTimeline interactions={interactions} />
        </>
      )}

      {!selectedLeadId && (
        <GlowCard glowColor="mixed" className="p-12">
          <div className="text-center">
            <TrendingUp className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-white font-semibold mb-2">Selecione um Lead</h3>
            <p className="text-slate-400">Escolha um lead para visualizar e registrar interações</p>
          </div>
        </GlowCard>
      )}
    </div>
  );
}