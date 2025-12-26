import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { TrendingUp, Award, Star, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function TalentPerformance({ talents }) {
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [reviewData, setReviewData] = useState({
    performance_score: '',
    feedback_notes: '',
    last_performance_review: new Date().toISOString().split('T')[0]
  });
  const queryClient = useQueryClient();

  const updatePerformance = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTalent',
        operation: 'update',
        id,
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ventureTalents']);
      setSelectedTalent(null);
      toast.success('Performance atualizada');
    }
  });

  const handleSaveReview = () => {
    if (!selectedTalent) return;
    
    updatePerformance.mutate({
      id: selectedTalent.id,
      data: {
        performance_score: parseFloat(reviewData.performance_score) || 0,
        feedback_notes: reviewData.feedback_notes,
        last_performance_review: reviewData.last_performance_review
      }
    });
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getPerformanceLabel = (score) => {
    if (score >= 90) return 'Excepcional';
    if (score >= 80) return 'Ótimo';
    if (score >= 70) return 'Bom';
    if (score >= 60) return 'Regular';
    return 'Necessita Melhoria';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-[#C7A763]" />
        <h3 className="text-lg font-semibold text-white">Acompanhamento de Performance</h3>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {talents.map((talent) => (
          <GlowCard
            key={talent.id}
            glowColor={talent.performance_score >= 80 ? 'gold' : 'cyan'}
            className="p-4 cursor-pointer"
            onClick={() => {
              setSelectedTalent(talent);
              setReviewData({
                performance_score: talent.performance_score?.toString() || '',
                feedback_notes: talent.feedback_notes || '',
                last_performance_review: talent.last_performance_review || new Date().toISOString().split('T')[0]
              });
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-white font-medium">{talent.talent_name}</h4>
                <div className="text-sm text-slate-400">{talent.role}</div>
              </div>
              {talent.performance_score ? (
                <div className="flex flex-col items-center">
                  <div className={`text-2xl font-bold ${getPerformanceColor(talent.performance_score)}`}>
                    {talent.performance_score}
                  </div>
                  <Star className={`w-4 h-4 ${getPerformanceColor(talent.performance_score)}`} />
                </div>
              ) : (
                <div className="text-xs text-slate-500">Sem avaliação</div>
              )}
            </div>

            {talent.performance_score && (
              <div className="space-y-2">
                <div className={`text-xs font-medium ${getPerformanceColor(talent.performance_score)}`}>
                  {getPerformanceLabel(talent.performance_score)}
                </div>
                {talent.last_performance_review && (
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Última revisão: {new Date(talent.last_performance_review).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            {talent.feedback_notes && (
              <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                {talent.feedback_notes}
              </p>
            )}
          </GlowCard>
        ))}
      </div>

      {selectedTalent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlowCard glowColor="mixed" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-white font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
                  Avaliar Performance: {selectedTalent.talent_name}
                </h4>
                <p className="text-sm text-slate-400">{selectedTalent.role}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTalent(null)}
                className="border-white/10 text-white"
              >
                Cancelar
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  Score de Performance (0-100)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={reviewData.performance_score}
                  onChange={(e) => setReviewData({...reviewData, performance_score: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  Data da Avaliação
                </label>
                <Input
                  type="date"
                  value={reviewData.last_performance_review}
                  onChange={(e) => setReviewData({...reviewData, last_performance_review: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  Feedback e Notas
                </label>
                <Textarea
                  value={reviewData.feedback_notes}
                  onChange={(e) => setReviewData({...reviewData, feedback_notes: e.target.value})}
                  placeholder="Pontos fortes, áreas de melhoria, conquistas..."
                  className="bg-white/5 border-white/10 text-white"
                  rows={5}
                />
              </div>

              <Button
                onClick={handleSaveReview}
                disabled={!reviewData.performance_score}
                className="w-full bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
              >
                Salvar Avaliação
              </Button>
            </div>
          </GlowCard>
        </motion.div>
      )}
    </div>
  );
}