import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Send, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';

export default function FeedbackSubmission() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({
    category: 'general',
    rating: 3,
    strengths: '',
    areas_for_improvement: '',
    comments: ''
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => await base44.auth.me()
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['my-feedback-requests', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'FeedbackRequest',
        operation: 'filter',
        query: { 
          requested_from_email: user.email,
          status: 'pending'
        }
      });
      return res.data?.data || [];
    },
    enabled: !!user?.email
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data) => {
      // Create feedback
      const feedback = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'TalentFeedback',
        operation: 'create',
        data: {
          talent_id: selectedRequest.talent_id,
          from_email: user.email,
          from_name: user.full_name,
          feedback_type: selectedRequest.feedback_type,
          category: data.category,
          rating: data.rating,
          strengths: data.strengths,
          areas_for_improvement: data.areas_for_improvement,
          comments: data.comments,
          is_anonymous: true
        }
      });

      // Update request status
      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'FeedbackRequest',
        operation: 'update',
        id: selectedRequest.id,
        data: {
          status: 'completed',
          submitted_at: new Date().toISOString(),
          feedback_id: feedback.data.id
        }
      });

      return feedback;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-feedback-requests']);
      setSelectedRequest(null);
      setFormData({
        category: 'general',
        rating: 3,
        strengths: '',
        areas_for_improvement: '',
        comments: ''
      });
      toast.success('Feedback enviado com sucesso!');
    }
  });

  const handleSubmit = () => {
    if (!formData.strengths || !formData.comments) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    submitFeedbackMutation.mutate(formData);
  };

  if (pendingRequests.length === 0) {
    return (
      <GlowCard className="p-8 text-center">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-400 opacity-30" />
        <p className="text-slate-400">Você não tem solicitações de feedback pendentes</p>
      </GlowCard>
    );
  }

  if (!selectedRequest) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#C7A763]" />
          Feedback Solicitado
        </h3>
        {pendingRequests.map((request) => (
          <GlowCard key={request.id} className="p-5 cursor-pointer hover:border-[#C7A763]/40" onClick={() => setSelectedRequest(request)}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-semibold">{request.talent_name}</h4>
                <p className="text-sm text-slate-400 mt-1">
                  Ciclo: {request.cycle_name} • Tipo: {request.feedback_type}
                </p>
              </div>
              <Button variant="outline" size="sm">
                Responder
              </Button>
            </div>
          </GlowCard>
        ))}
      </div>
    );
  }

  return (
    <GlowCard className="p-6">
      <div className="mb-6">
        <button
          onClick={() => setSelectedRequest(null)}
          className="text-sm text-slate-400 hover:text-white mb-4"
        >
          ← Voltar
        </button>
        <h3 className="text-xl font-bold text-white">Feedback para {selectedRequest.talent_name}</h3>
        <p className="text-sm text-slate-400 mt-1">
          {selectedRequest.cycle_name} • Seu feedback será anônimo
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-white text-sm mb-2 block">Categoria</label>
            <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Técnico</SelectItem>
                <SelectItem value="communication">Comunicação</SelectItem>
                <SelectItem value="leadership">Liderança</SelectItem>
                <SelectItem value="teamwork">Trabalho em Equipe</SelectItem>
                <SelectItem value="general">Geral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-white text-sm mb-2 block">Avaliação (1-5)</label>
            <Select value={String(formData.rating)} onValueChange={(v) => setFormData({...formData, rating: parseInt(v)})}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Precisa melhorar</SelectItem>
                <SelectItem value="2">2 - Abaixo da expectativa</SelectItem>
                <SelectItem value="3">3 - Atende expectativas</SelectItem>
                <SelectItem value="4">4 - Acima da expectativa</SelectItem>
                <SelectItem value="5">5 - Excepcional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-white text-sm mb-2 block">Pontos Fortes *</label>
          <Textarea
            value={formData.strengths}
            onChange={(e) => setFormData({...formData, strengths: e.target.value})}
            placeholder="O que essa pessoa faz bem?"
            className="bg-white/5 border-white/10 text-white h-24"
          />
        </div>

        <div>
          <label className="text-white text-sm mb-2 block">Áreas de Melhoria</label>
          <Textarea
            value={formData.areas_for_improvement}
            onChange={(e) => setFormData({...formData, areas_for_improvement: e.target.value})}
            placeholder="Onde essa pessoa pode melhorar?"
            className="bg-white/5 border-white/10 text-white h-24"
          />
        </div>

        <div>
          <label className="text-white text-sm mb-2 block">Comentários Gerais *</label>
          <Textarea
            value={formData.comments}
            onChange={(e) => setFormData({...formData, comments: e.target.value})}
            placeholder="Feedback adicional ou contexto"
            className="bg-white/5 border-white/10 text-white h-32"
          />
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2">
          <Shield className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-400">
            Seu feedback será completamente anônimo. O talento não verá quem forneceu este feedback.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setSelectedRequest(null)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitFeedbackMutation.isPending}
            className="bg-[#C7A763] hover:bg-[#A88B4A]"
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar Feedback
          </Button>
        </div>
      </div>
    </GlowCard>
  );
}