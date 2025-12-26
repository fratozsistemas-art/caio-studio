import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Calendar, Target, CheckCircle2, Circle, Loader2, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function SquadManager({ ventures, talents }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_objective: '',
    venture_ids: [],
    talent_ids: [],
    start_date: '',
    end_date: '',
    status: 'planning',
    deliverables: [],
    shared_resources: []
  });

  const queryClient = useQueryClient();

  const { data: squads } = useQuery({
    queryKey: ['ventureSquads'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureSquad',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const createSquadMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureSquad',
        operation: 'create',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ventureSquads']);
      toast.success('Squad criado com sucesso!');
      setShowForm(false);
      resetForm();
    }
  });

  const updateSquadMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureSquad',
        operation: 'update',
        id,
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ventureSquads']);
      toast.success('Squad atualizado!');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      project_objective: '',
      venture_ids: [],
      talent_ids: [],
      start_date: '',
      end_date: '',
      status: 'planning',
      deliverables: [],
      shared_resources: []
    });
  };

  const toggleVenture = (ventureId) => {
    setFormData(prev => ({
      ...prev,
      venture_ids: prev.venture_ids.includes(ventureId)
        ? prev.venture_ids.filter(id => id !== ventureId)
        : [...prev.venture_ids, ventureId]
    }));
  };

  const toggleTalent = (talentId) => {
    setFormData(prev => ({
      ...prev,
      talent_ids: prev.talent_ids.includes(talentId)
        ? prev.talent_ids.filter(id => id !== talentId)
        : [...prev.talent_ids, talentId]
    }));
  };

  const addDeliverable = () => {
    setFormData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, { name: '', completed: false, due_date: '' }]
    }));
  };

  const updateDeliverable = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((d, i) => 
        i === index ? { ...d, [field]: value } : d
      )
    }));
  };

  const toggleDeliverableComplete = async (squadId, deliverableIndex) => {
    const squad = squads.find(s => s.id === squadId);
    if (!squad) return;

    const updatedDeliverables = squad.deliverables.map((d, i) =>
      i === deliverableIndex ? { ...d, completed: !d.completed } : d
    );

    updateSquadMutation.mutate({
      id: squadId,
      data: { ...squad, deliverables: updatedDeliverables }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'planning': return 'bg-blue-500/20 text-blue-400';
      case 'on_hold': return 'bg-yellow-500/20 text-yellow-400';
      case 'completed': return 'bg-purple-500/20 text-purple-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-white/10 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="cyan" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-[#00D4FF]" />
            <h3 className="text-xl font-bold text-white">Squads Inter-Venture</h3>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Squad
          </Button>
        </div>

        {/* Squad Form */}
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
                  <label className="text-sm text-white/70 mb-2 block">Nome do Squad *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Squad Marketing Cross-Venture"
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
                      <SelectItem value="planning">Planejamento</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="on_hold">Em Espera</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm text-white/70 mb-2 block">Objetivo do Projeto *</label>
                <Textarea
                  value={formData.project_objective}
                  onChange={(e) => setFormData({...formData, project_objective: e.target.value})}
                  placeholder="Descreva o objetivo específico deste squad..."
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-white/70 mb-2 block">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detalhes adicionais sobre o squad..."
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/70 mb-2 block">Data Início</label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70 mb-2 block">Data Término</label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-white/70 mb-2 block">Ventures Participantes *</label>
                <div className="grid md:grid-cols-3 gap-2">
                  {ventures.map(v => (
                    <button
                      key={v.id}
                      onClick={() => toggleVenture(v.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        formData.venture_ids.includes(v.id)
                          ? 'border-[#00D4FF] bg-[#00D4FF]/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-white text-sm font-medium">{v.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-white/70 mb-2 block">Talentos Alocados</label>
                <div className="grid md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {talents.map(t => (
                    <button
                      key={t.id}
                      onClick={() => toggleTalent(t.id)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        formData.talent_ids.includes(t.id)
                          ? 'border-[#C7A763] bg-[#C7A763]/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-white text-xs">{t.talent_name} - {t.role}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-white/70">Entregas</label>
                  <Button
                    onClick={addDeliverable}
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white h-7 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.deliverables.map((del, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={del.name}
                        onChange={(e) => updateDeliverable(i, 'name', e.target.value)}
                        placeholder="Nome da entrega"
                        className="flex-1 bg-white/5 border-white/10 text-white text-sm h-9"
                      />
                      <Input
                        type="date"
                        value={del.due_date}
                        onChange={(e) => updateDeliverable(i, 'due_date', e.target.value)}
                        className="w-40 bg-white/5 border-white/10 text-white text-sm h-9"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => createSquadMutation.mutate(formData)}
                  disabled={!formData.name || !formData.project_objective || formData.venture_ids.length < 2}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {createSquadMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Criar Squad
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

        {/* Squads List */}
        {squads && squads.length > 0 ? (
          <div className="space-y-4">
            {squads.map((squad, i) => (
              <motion.div
                key={squad.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlowCard glowColor="mixed" className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-white">{squad.name}</h4>
                        <Badge className={getStatusColor(squad.status)}>
                          {squad.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 mb-2">{squad.project_objective}</p>
                      {squad.description && (
                        <p className="text-xs text-slate-500">{squad.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="text-xs text-slate-400 mb-1">Ventures</div>
                      <div className="text-lg font-bold text-[#00D4FF]">
                        {squad.venture_ids?.length || 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="text-xs text-slate-400 mb-1">Talentos</div>
                      <div className="text-lg font-bold text-[#C7A763]">
                        {squad.talent_ids?.length || 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="text-xs text-slate-400 mb-1">Entregas</div>
                      <div className="text-lg font-bold text-green-400">
                        {squad.deliverables?.filter(d => d.completed).length || 0} / {squad.deliverables?.length || 0}
                      </div>
                    </div>
                  </div>

                  {squad.deliverables && squad.deliverables.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400 mb-2">Entregas:</div>
                      {squad.deliverables.map((del, j) => (
                        <div key={j} className="flex items-center justify-between p-2 rounded bg-white/5">
                          <div className="flex items-center gap-2 flex-1">
                            <button
                              onClick={() => toggleDeliverableComplete(squad.id, j)}
                              className="text-white/50 hover:text-white transition-colors"
                            >
                              {del.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>
                            <span className={`text-sm ${del.completed ? 'line-through text-white/50' : 'text-white'}`}>
                              {del.name}
                            </span>
                          </div>
                          {del.due_date && (
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Calendar className="w-3 h-3" />
                              {new Date(del.due_date).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {squad.venture_ids && squad.venture_ids.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="text-xs text-slate-400 mb-2">Ventures colaborando:</div>
                      <div className="flex flex-wrap gap-2">
                        {squad.venture_ids.map(vId => {
                          const v = ventures.find(venture => venture.id === vId);
                          return v ? (
                            <span key={vId} className="text-xs bg-white/5 px-2 py-1 rounded text-white/70">
                              {v.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </GlowCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum squad criado ainda</p>
            <p className="text-xs mt-2">Crie squads para colaboração entre ventures</p>
          </div>
        )}
      </GlowCard>
    </div>
  );
}