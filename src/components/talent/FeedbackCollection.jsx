import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Send, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FeedbackCollection({ talentId, talentName }) {
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const getUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    getUser();
  }, []);

  const [feedback, setFeedback] = useState({
    feedback_type: 'peer',
    category: 'general',
    rating: 3,
    strengths: '',
    areas_for_improvement: '',
    comments: '',
    is_anonymous: false
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['talent-feedback', talentId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'TalentFeedback',
        operation: 'filter',
        query: { talent_id: talentId },
        sort: '-created_date'
      });
      return res.data?.data || [];
    },
    enabled: !!talentId
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'TalentFeedback',
        operation: 'create',
        data: {
          ...data,
          talent_id: talentId,
          from_email: user?.email,
          from_name: data.is_anonymous ? 'Anônimo' : user?.full_name
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['talent-feedback', talentId]);
      setShowForm(false);
      setFeedback({
        feedback_type: 'peer',
        category: 'general',
        rating: 3,
        strengths: '',
        areas_for_improvement: '',
        comments: '',
        is_anonymous: false
      });
      toast.success('Feedback enviado!');
    }
  });

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Feedbacks</h3>
          <p className="text-sm text-slate-400">{feedbacks.length} feedbacks recebidos</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-[#00D4FF] hover:bg-[#00B8E6]"
        >
          <Send className="w-4 h-4 mr-2" />
          Dar Feedback
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <GlowCard className="p-5">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#C7A763] mb-1">{avgRating}</div>
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${star <= avgRating ? 'fill-[#C7A763] text-[#C7A763]' : 'text-slate-600'}`}
                />
              ))}
            </div>
            <div className="text-xs text-slate-400">Avaliação Média</div>
          </div>
        </GlowCard>

        <GlowCard className="p-5">
          <div className="space-y-2">
            {['peer', 'manager', 'self'].map(type => {
              const count = feedbacks.filter(f => f.feedback_type === type).length;
              return (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 capitalize">{type}</span>
                  <span className="text-sm font-semibold text-white">{count}</span>
                </div>
              );
            })}
          </div>
        </GlowCard>
      </div>

      <div className="space-y-3">
        {feedbacks.map(fb => (
          <GlowCard key={fb.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-white font-medium">{fb.from_name}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400 capitalize">{fb.feedback_type}</span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400">
                    {format(new Date(fb.created_date), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${star <= fb.rating ? 'fill-[#C7A763] text-[#C7A763]' : 'text-slate-600'}`}
                  />
                ))}
              </div>
            </div>

            {fb.strengths && (
              <div className="mb-2">
                <div className="text-xs text-green-400 mb-1">Pontos Fortes:</div>
                <p className="text-sm text-slate-300">{fb.strengths}</p>
              </div>
            )}

            {fb.areas_for_improvement && (
              <div className="mb-2">
                <div className="text-xs text-yellow-400 mb-1">Áreas de Melhoria:</div>
                <p className="text-sm text-slate-300">{fb.areas_for_improvement}</p>
              </div>
            )}

            {fb.comments && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Comentários:</div>
                <p className="text-sm text-slate-300">{fb.comments}</p>
              </div>
            )}
          </GlowCard>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-[#0a1628] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Dar Feedback para {talentName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Select
              value={feedback.feedback_type}
              onValueChange={(v) => setFeedback({...feedback, feedback_type: v})}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="peer">Colega</SelectItem>
                <SelectItem value="manager">Gestor</SelectItem>
                <SelectItem value="self">Auto-avaliação</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={feedback.category}
              onValueChange={(v) => setFeedback({...feedback, category: v})}
            >
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

            <div>
              <label className="text-sm text-white mb-2 block">Avaliação Geral</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setFeedback({...feedback, rating: star})}
                  >
                    <Star
                      className={`w-8 h-8 ${star <= feedback.rating ? 'fill-[#C7A763] text-[#C7A763]' : 'text-slate-600'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              placeholder="Pontos fortes..."
              value={feedback.strengths}
              onChange={(e) => setFeedback({...feedback, strengths: e.target.value})}
              className="bg-white/5 border-white/10 text-white"
            />

            <Textarea
              placeholder="Áreas de melhoria..."
              value={feedback.areas_for_improvement}
              onChange={(e) => setFeedback({...feedback, areas_for_improvement: e.target.value})}
              className="bg-white/5 border-white/10 text-white"
            />

            <Textarea
              placeholder="Comentários gerais..."
              value={feedback.comments}
              onChange={(e) => setFeedback({...feedback, comments: e.target.value})}
              className="bg-white/5 border-white/10 text-white"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={feedback.is_anonymous}
                onChange={(e) => setFeedback({...feedback, is_anonymous: e.target.checked})}
                className="rounded"
              />
              <label className="text-sm text-white">Enviar como anônimo</label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => submitMutation.mutate(feedback)}
                className="bg-[#00D4FF] hover:bg-[#00B8E6]"
              >
                Enviar Feedback
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}