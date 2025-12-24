import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Save, X, Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function VentureOKRManager({ ventureId }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    objective: '',
    description: '',
    quarter: '',
    owner: '',
    status: 'on_track',
    key_results: [{ description: '', target: 0, current: 0, unit: '' }]
  });

  const queryClient = useQueryClient();

  const { data: okrs } = useQuery({
    queryKey: ['ventureOKRs', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureOKR',
        operation: 'filter',
        query: { venture_id: ventureId }
      });
      return res.data?.data || [];
    },
    enabled: !!ventureId
  });

  const createOKRMutation = useMutation({
    mutationFn: async (data) => {
      // Calculate overall progress
      const progress = data.key_results.reduce((sum, kr) => {
        const krProgress = kr.target > 0 ? (kr.current / kr.target * 100) : 0;
        return sum + krProgress;
      }, 0) / data.key_results.length;

      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureOKR',
        operation: 'create',
        data: { ...data, progress: Math.round(progress) }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ventureOKRs', ventureId]);
      toast.success('OKR criado com sucesso!');
      setShowForm(false);
      resetForm();
    }
  });

  const updateOKRMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const progress = data.key_results.reduce((sum, kr) => {
        const krProgress = kr.target > 0 ? (kr.current / kr.target * 100) : 0;
        return sum + krProgress;
      }, 0) / data.key_results.length;

      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureOKR',
        operation: 'update',
        id,
        data: { ...data, progress: Math.round(progress) }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ventureOKRs', ventureId]);
      toast.success('OKR atualizado!');
    }
  });

  const resetForm = () => {
    setFormData({
      objective: '',
      description: '',
      quarter: '',
      owner: '',
      status: 'on_track',
      key_results: [{ description: '', target: 0, current: 0, unit: '' }]
    });
  };

  const addKeyResult = () => {
    setFormData(prev => ({
      ...prev,
      key_results: [...prev.key_results, { description: '', target: 0, current: 0, unit: '' }]
    }));
  };

  const removeKeyResult = (index) => {
    setFormData(prev => ({
      ...prev,
      key_results: prev.key_results.filter((_, i) => i !== index)
    }));
  };

  const updateKeyResult = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      key_results: prev.key_results.map((kr, i) => 
        i === index ? { ...kr, [field]: value } : kr
      )
    }));
  };

  const handleSubmit = () => {
    if (!formData.objective || !formData.quarter) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    createOKRMutation.mutate({
      venture_id: ventureId,
      ...formData
    });
  };

  const updateKRProgress = (okrId, krIndex, newCurrent) => {
    const okr = okrs.find(o => o.id === okrId);
    if (!okr) return;

    const updatedKRs = okr.key_results.map((kr, i) => 
      i === krIndex ? { ...kr, current: parseFloat(newCurrent) } : kr
    );

    updateOKRMutation.mutate({
      id: okrId,
      data: { ...okr, key_results: updatedKRs }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'on_track': return 'bg-green-500/20 text-green-400';
      case 'at_risk': return 'bg-yellow-500/20 text-yellow-400';
      case 'off_track': return 'bg-red-500/20 text-red-400';
      case 'completed': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-white/10 text-white';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'on_track': return 'No Prazo';
      case 'at_risk': return 'Em Risco';
      case 'off_track': return 'Atrasado';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="purple" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-purple-400" />
            <h3 className="text-xl font-bold text-white">OKRs (Objectives & Key Results)</h3>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo OKR
          </Button>
        </div>

        {/* OKR Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-6 rounded-xl bg-white/5 border border-white/10 space-y-4"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/70 mb-2 block">Objetivo *</label>
                  <Input
                    value={formData.objective}
                    onChange={(e) => setFormData({...formData, objective: e.target.value})}
                    placeholder="Ex: Aumentar receita recorrente"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70 mb-2 block">Trimestre *</label>
                  <Input
                    value={formData.quarter}
                    onChange={(e) => setFormData({...formData, quarter: e.target.value})}
                    placeholder="Ex: Q1 2025"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-white/70 mb-2 block">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva o objetivo..."
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/70 mb-2 block">Responsável</label>
                  <Input
                    value={formData.owner}
                    onChange={(e) => setFormData({...formData, owner: e.target.value})}
                    placeholder="Nome do responsável"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70 mb-2 block">Status</label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_track">No Prazo</SelectItem>
                      <SelectItem value="at_risk">Em Risco</SelectItem>
                      <SelectItem value="off_track">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-white/70">Key Results</label>
                  <Button
                    onClick={addKeyResult}
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar KR
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.key_results.map((kr, i) => (
                    <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-start gap-2 mb-2">
                        <Input
                          value={kr.description}
                          onChange={(e) => updateKeyResult(i, 'description', e.target.value)}
                          placeholder="Descrição do Key Result"
                          className="flex-1 bg-white/5 border-white/10 text-white text-sm"
                        />
                        <Button
                          onClick={() => removeKeyResult(i)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="number"
                          value={kr.target}
                          onChange={(e) => updateKeyResult(i, 'target', parseFloat(e.target.value))}
                          placeholder="Meta"
                          className="bg-white/5 border-white/10 text-white text-sm"
                        />
                        <Input
                          type="number"
                          value={kr.current}
                          onChange={(e) => updateKeyResult(i, 'current', parseFloat(e.target.value))}
                          placeholder="Atual"
                          className="bg-white/5 border-white/10 text-white text-sm"
                        />
                        <Input
                          value={kr.unit}
                          onChange={(e) => updateKeyResult(i, 'unit', e.target.value)}
                          placeholder="Unidade"
                          className="bg-white/5 border-white/10 text-white text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={createOKRMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {createOKRMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar OKR
                </Button>
                <Button
                  onClick={() => { setShowForm(false); resetForm(); }}
                  variant="ghost"
                  className="text-white/70"
                >
                  Cancelar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OKRs List */}
        {okrs && okrs.length > 0 ? (
          <div className="space-y-4">
            {okrs.map((okr, i) => (
              <motion.div
                key={okr.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlowCard glowColor="cyan" className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-white">{okr.objective}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(okr.status)}`}>
                          {getStatusLabel(okr.status)}
                        </span>
                      </div>
                      {okr.description && (
                        <p className="text-sm text-slate-400 mb-2">{okr.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{okr.quarter}</span>
                        {okr.owner && <span>• {okr.owner}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-purple-400">{okr.progress}%</div>
                      <div className="text-xs text-slate-400">Progresso</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {okr.key_results?.map((kr, krIndex) => {
                      const krProgress = kr.target > 0 ? (kr.current / kr.target * 100) : 0;
                      return (
                        <div key={krIndex} className="p-3 rounded-lg bg-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-white">{kr.description}</span>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={kr.current}
                                onChange={(e) => updateKRProgress(okr.id, krIndex, e.target.value)}
                                className="w-20 h-8 bg-white/5 border-white/10 text-white text-sm"
                              />
                              <span className="text-xs text-slate-400">
                                / {kr.target} {kr.unit}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  krProgress >= 100 ? 'bg-green-500' :
                                  krProgress >= 70 ? 'bg-blue-500' :
                                  krProgress >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(krProgress, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 w-12 text-right">
                              {krProgress.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum OKR criado ainda</p>
          </div>
        )}
      </GlowCard>
    </div>
  );
}