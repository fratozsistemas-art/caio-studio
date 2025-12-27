import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { MessageSquare, Star, Send } from "lucide-react";
import { toast } from "sonner";

const feedbackTypes = [
  { value: "suggestion", label: "Sugestão" },
  { value: "complaint", label: "Reclamação" },
  { value: "praise", label: "Elogio" },
  { value: "question", label: "Pergunta" },
  { value: "bug_report", label: "Reportar Bug" },
  { value: "feature_request", label: "Solicitar Funcionalidade" }
];

const roleOptions = [
  { value: "customer", label: "Cliente" },
  { value: "partner", label: "Parceiro" },
  { value: "investor", label: "Investidor" },
  { value: "team_member", label: "Membro da Equipe" },
  { value: "other", label: "Outro" }
];

export default function FeedbackForm({ ventureId, ventureName, onSuccess }) {
  const [formData, setFormData] = useState({
    venture_id: ventureId || "",
    venture_name: ventureName || "",
    feedback_type: "suggestion",
    subject: "",
    message: "",
    rating: 0,
    submitter_name: "",
    submitter_email: "",
    submitter_role: "other"
  });

  const queryClient = useQueryClient();

  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: () => base44.entities.Venture.list(),
    enabled: !ventureId
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureFeedback',
        operation: 'create',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ventureFeedback']);
      toast.success('Feedback enviado com sucesso!');
      
      // Reset form
      setFormData({
        venture_id: ventureId || "",
        venture_name: ventureName || "",
        feedback_type: "suggestion",
        subject: "",
        message: "",
        rating: 0,
        submitter_name: "",
        submitter_email: "",
        submitter_role: "other"
      });
      
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error('Erro ao enviar feedback: ' + error.message);
    }
  });

  const handleVentureChange = (selectedVentureId) => {
    const venture = ventures.find(v => v.id === selectedVentureId);
    setFormData(prev => ({
      ...prev,
      venture_id: selectedVentureId,
      venture_name: venture?.name || ""
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.venture_id || !formData.subject || !formData.message) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    submitMutation.mutate(formData);
  };

  return (
    <GlowCard glowColor="cyan" className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-6 h-6 text-[#00D4FF]" />
        <div>
          <h3 className="text-xl font-bold text-white">Enviar Feedback</h3>
          <p className="text-sm text-slate-400">Compartilhe sua opinião sobre as ventures</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!ventureId && (
          <div>
            <Label className="text-white">Venture *</Label>
            <Select value={formData.venture_id} onValueChange={handleVentureChange}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Selecione uma venture" />
              </SelectTrigger>
              <SelectContent>
                {ventures.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-white">Tipo de Feedback *</Label>
            <Select value={formData.feedback_type} onValueChange={(v) => setFormData({ ...formData, feedback_type: v })}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {feedbackTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white">Seu Papel</Label>
            <Select value={formData.submitter_role} onValueChange={(v) => setFormData({ ...formData, submitter_role: v })}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-white">Avaliação (Opcional)</Label>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData({ ...formData, rating: star })}
                className="transition-all"
              >
                <Star 
                  className={`w-6 h-6 ${
                    star <= formData.rating 
                      ? 'fill-[#C7A763] text-[#C7A763]' 
                      : 'text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-white">Seu Nome</Label>
            <Input
              value={formData.submitter_name}
              onChange={(e) => setFormData({ ...formData, submitter_name: e.target.value })}
              placeholder="Nome completo"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <Label className="text-white">Seu Email *</Label>
            <Input
              type="email"
              value={formData.submitter_email}
              onChange={(e) => setFormData({ ...formData, submitter_email: e.target.value })}
              placeholder="email@exemplo.com"
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>
        </div>

        <div>
          <Label className="text-white">Assunto *</Label>
          <Input
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Resuma seu feedback em uma linha"
            className="bg-white/5 border-white/10 text-white"
            required
          />
        </div>

        <div>
          <Label className="text-white">Mensagem *</Label>
          <Textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Descreva seu feedback detalhadamente..."
            className="bg-white/5 border-white/10 text-white min-h-[150px]"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={submitMutation.isPending}
          className="w-full bg-[#C7A763] hover:bg-[#A88B4A]"
        >
          {submitMutation.isPending ? (
            <>Enviando...</>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Enviar Feedback
            </>
          )}
        </Button>
      </form>
    </GlowCard>
  );
}