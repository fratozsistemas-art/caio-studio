import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Award, Save, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function TalentPerformance({ talents, onUpdate }) {
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [performanceScore, setPerformanceScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const talent = talents.find(t => t.id === selectedTalent);

  const handleSelectTalent = (talentId) => {
    setSelectedTalent(talentId);
    const t = talents.find(t => t.id === talentId);
    if (t) {
      setPerformanceScore(t.performance_score || 0);
      setFeedback(t.feedback_notes || '');
    }
  };

  const handleSave = async () => {
    if (!selectedTalent) return;

    setSaving(true);
    try {
      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTalent',
        operation: 'update',
        id: selectedTalent,
        data: {
          performance_score: performanceScore,
          feedback_notes: feedback,
          last_performance_review: new Date().toISOString().split('T')[0]
        }
      });

      toast.success('Performance atualizada!');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Precisa Melhorar';
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="gold" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-5 h-5 text-[#C7A763]" />
          <h3 className="text-xl font-bold text-white">Avaliação de Performance</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/70 mb-2 block">Selecionar Talento</label>
            <Select value={selectedTalent} onValueChange={handleSelectTalent}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Escolha um talento para avaliar" />
              </SelectTrigger>
              <SelectContent>
                {talents.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.talent_name} - {t.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {talent && (
            <>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Venture</div>
                    <div className="text-sm text-white">{talent.venture_id}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Level</div>
                    <div className="text-sm text-white capitalize">{talent.level}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Alocação</div>
                    <div className="text-sm text-white">{talent.allocation}%</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-2">Skills</div>
                  <div className="flex flex-wrap gap-1">
                    {talent.skills?.map((skill, i) => (
                      <span key={i} className="text-xs bg-white/5 px-2 py-1 rounded text-white/70">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-white/70 mb-2 block">
                  Score de Performance (0-100)
                </label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={performanceScore}
                    onChange={(e) => setPerformanceScore(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #C7A763 0%, #C7A763 ${performanceScore}%, rgba(255,255,255,0.1) ${performanceScore}%, rgba(255,255,255,0.1) 100%)`
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <div className={`text-4xl font-bold ${getScoreColor(performanceScore)}`}>
                      {performanceScore}
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${getScoreColor(performanceScore)}`}>
                        {getScoreLabel(performanceScore)}
                      </div>
                      {talent.last_performance_review && (
                        <div className="text-xs text-slate-400">
                          Última avaliação: {new Date(talent.last_performance_review).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-white/70 mb-2 block">
                  Feedback e Notas de Avaliação
                </label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Adicione feedback sobre a performance, pontos fortes, áreas de melhoria..."
                  className="bg-white/5 border-white/10 text-white min-h-[120px]"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Avaliação
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </GlowCard>

      {/* Performance Overview */}
      {talents.length > 0 && (
        <GlowCard glowColor="cyan" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-5 h-5 text-[#00D4FF]" />
            <h4 className="text-lg font-bold text-white">Visão Geral de Performance</h4>
          </div>
          <div className="space-y-2">
            {talents
              .filter(t => t.performance_score)
              .sort((a, b) => (b.performance_score || 0) - (a.performance_score || 0))
              .map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1">
                    <div className="text-white font-medium">{t.talent_name}</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${t.performance_score}%`,
                          backgroundColor: 
                            t.performance_score >= 80 ? '#10B981' :
                            t.performance_score >= 60 ? '#F59E0B' :
                            t.performance_score >= 40 ? '#FB923C' : '#EF4444'
                        }}
                      />
                    </div>
                    <div className={`text-lg font-bold w-12 text-right ${getScoreColor(t.performance_score)}`}>
                      {t.performance_score}
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
          {talents.filter(t => !t.performance_score).length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10 text-sm text-slate-400">
              {talents.filter(t => !t.performance_score).length} talento(s) sem avaliação
            </div>
          )}
        </GlowCard>
      )}
    </div>
  );
}