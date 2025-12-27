import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { X, Mail, Phone, Building2, Linkedin, Calendar, TrendingUp, MessageSquare, Save, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function LeadDetail({ lead, onClose }) {
  const [notes, setNotes] = useState(lead.notes || '');
  const [status, setStatus] = useState(lead.status);
  const [nextAction, setNextAction] = useState(lead.next_action || '');
  const [nextActionDate, setNextActionDate] = useState(lead.next_action_date || '');

  const queryClient = useQueryClient();

  const updateLeadMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'StakeholderLead',
        operation: 'update',
        entity_id: lead.id,
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stakeholderLeads']);
      toast.success('Lead atualizado com sucesso');
    }
  });

  const handleSave = () => {
    updateLeadMutation.mutate({
      notes,
      status,
      next_action: nextAction,
      next_action_date: nextActionDate
    });
  };

  const scoreColor = lead.qualification_score >= 80 ? 'text-green-400' : 
                     lead.qualification_score >= 60 ? 'text-yellow-400' : 
                     'text-red-400';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <GlowCard glowColor="cyan" className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{lead.full_name}</h2>
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-500/20 text-blue-400">
                  {lead.stakeholder_type}
                </Badge>
                {lead.qualification_score && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                    <span className={`font-bold ${scoreColor}`}>Score: {lead.qualification_score}</span>
                  </div>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Contact Info */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-[#00D4FF]" />
                <span className="text-sm">{lead.email}</span>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-[#00D4FF]" />
                  <span className="text-sm">{lead.phone}</span>
                </div>
              )}
              {lead.company && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Building2 className="w-4 h-4 text-[#00D4FF]" />
                  <span className="text-sm">{lead.company}</span>
                </div>
              )}
              {lead.linkedin_url && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Linkedin className="w-4 h-4 text-[#00D4FF]" />
                  <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-[#00D4FF]">
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-white/70 text-xs">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Novo</SelectItem>
                    <SelectItem value="qualified">Qualificado</SelectItem>
                    <SelectItem value="contacted">Contatado</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="accepted">Aceito</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Qualification Details */}
          {lead.qualification_answers && (
            <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-white font-semibold mb-3 text-sm">Respostas do Questionário</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(lead.qualification_answers).map(([key, value]) => {
                  if (typeof value === 'string' && value && !['full_name', 'email', 'phone', 'company'].includes(key)) {
                    return (
                      <div key={key} className="flex gap-2">
                        <span className="text-slate-400 min-w-[120px]">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-slate-200">{value}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          {/* Action Items */}
          <div className="space-y-4 mb-6">
            <div>
              <Label className="text-white/70 mb-2 block">Próxima Ação</Label>
              <Input
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="Ex: Agendar discovery call"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-white/70 mb-2 block">Data da Próxima Ação</Label>
              <Input
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-white/70 mb-2 block flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Notas Internas
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione suas observações sobre este lead..."
                className="bg-white/5 border-white/10 text-white h-32"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-white/10 text-white"
            >
              Fechar
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateLeadMutation.isPending}
              className="flex-1 bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F] font-semibold"
            >
              {updateLeadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </GlowCard>
      </motion.div>
    </div>
  );
}