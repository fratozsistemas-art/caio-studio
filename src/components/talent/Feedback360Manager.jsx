import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Send, Users, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Feedback360Manager({ talentId, talentName }) {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    cycle_name: '',
    due_date: '',
    reviewers: []
  });
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [reviewerType, setReviewerType] = useState('peer');
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['feedback-requests', talentId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'FeedbackRequest',
        operation: 'filter',
        query: { talent_id: talentId },
        sort: '-created_date'
      });
      return res.data?.data || [];
    }
  });

  const createRequestsMutation = useMutation({
    mutationFn: async (data) => {
      const promises = data.reviewers.map(reviewer =>
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'FeedbackRequest',
          operation: 'create',
          data: {
            talent_id: talentId,
            talent_name: talentName,
            requested_from_email: reviewer.email,
            requested_from_name: reviewer.name || reviewer.email,
            feedback_type: reviewer.type,
            cycle_name: data.cycle_name,
            due_date: data.due_date,
            status: 'pending'
          }
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['feedback-requests']);
      setShowDialog(false);
      setFormData({ cycle_name: '', due_date: '', reviewers: [] });
      toast.success('Solicitações de feedback enviadas!');
    }
  });

  const addReviewer = () => {
    if (!reviewerEmail) return;
    
    setFormData({
      ...formData,
      reviewers: [...formData.reviewers, {
        email: reviewerEmail,
        type: reviewerType
      }]
    });
    setReviewerEmail('');
  };

  const removeReviewer = (index) => {
    setFormData({
      ...formData,
      reviewers: formData.reviewers.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = () => {
    if (!formData.cycle_name || !formData.due_date || formData.reviewers.length === 0) {
      toast.error('Preencha todos os campos e adicione revisores');
      return;
    }
    createRequestsMutation.mutate(formData);
  };

  const groupedRequests = requests.reduce((acc, req) => {
    if (!acc[req.cycle_name]) acc[req.cycle_name] = [];
    acc[req.cycle_name].push(req);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Feedback 360°</h3>
        <Button onClick={() => setShowDialog(true)} className="bg-[#C7A763] hover:bg-[#A88B4A]">
          <Plus className="w-4 h-4 mr-2" />
          Novo Ciclo 360°
        </Button>
      </div>

      {Object.entries(groupedRequests).map(([cycleName, cycleRequests]) => {
        const completed = cycleRequests.filter(r => r.status === 'completed').length;
        const total = cycleRequests.length;
        const percentage = (completed / total) * 100;

        return (
          <GlowCard key={cycleName} className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-white font-semibold">{cycleName}</h4>
                <p className="text-sm text-slate-400 mt-1">
                  {completed} de {total} feedbacks recebidos
                </p>
              </div>
              <Badge className={percentage === 100 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                {percentage.toFixed(0)}%
              </Badge>
            </div>

            <div className="space-y-2">
              {cycleRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    {req.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-400" />
                    )}
                    <div>
                      <div className="text-sm text-white">{req.requested_from_name}</div>
                      <div className="text-xs text-slate-400 capitalize">{req.feedback_type}</div>
                    </div>
                  </div>
                  {req.due_date && (
                    <div className="text-xs text-slate-500">
                      {format(new Date(req.due_date), "dd MMM", { locale: ptBR })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlowCard>
        );
      })}

      {requests.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum ciclo de feedback 360° iniciado</p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#0a1628] border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Iniciar Ciclo de Feedback 360°</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm mb-2 block">Nome do Ciclo</label>
                <Input
                  value={formData.cycle_name}
                  onChange={(e) => setFormData({...formData, cycle_name: e.target.value})}
                  placeholder="ex: Q1 2025"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-white text-sm mb-2 block">Data Limite</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-white text-sm mb-2 block">Adicionar Revisores</label>
              <div className="flex gap-2">
                <Input
                  value={reviewerEmail}
                  onChange={(e) => setReviewerEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="bg-white/5 border-white/10 text-white flex-1"
                />
                <Select value={reviewerType} onValueChange={setReviewerType}>
                  <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="peer">Colega</SelectItem>
                    <SelectItem value="manager">Gestor</SelectItem>
                    <SelectItem value="direct_report">Subordinado</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addReviewer} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {formData.reviewers.length > 0 && (
              <div className="bg-white/5 rounded-lg p-3 space-y-2">
                <div className="text-sm text-white font-medium">Revisores ({formData.reviewers.length})</div>
                {formData.reviewers.map((reviewer, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{reviewer.email}</span>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#C7A763]/20 text-[#C7A763] capitalize">{reviewer.type}</Badge>
                      <button
                        onClick={() => removeReviewer(idx)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createRequestsMutation.isPending}
                className="bg-[#C7A763] hover:bg-[#A88B4A]"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar Solicitações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}