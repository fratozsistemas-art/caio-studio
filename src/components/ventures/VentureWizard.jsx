import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check, Sparkles, Target, Users, Lightbulb, Rocket } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const steps = [
  { id: 1, title: 'Informações Básicas', icon: Sparkles },
  { id: 2, title: 'Proposta de Valor', icon: Lightbulb },
  { id: 3, title: 'Equipe', icon: Users },
  { id: 4, title: 'Metas Iniciais', icon: Target },
  { id: 5, title: 'Revisão', icon: Rocket }
];

export default function VentureWizard({ onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    layer: 'startup',
    status: 'development',
    category: '',
    website: '',
    tags: '',
    core_idea: '',
    target_market: '',
    value_proposition: '',
    team_members: [{ name: '', role: '', email: '' }],
    initial_goals: '',
    team_size: 1
  });

  React.useEffect(() => {
    const getUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    getUser();
  }, []);

  const createVenture = useMutation({
    mutationFn: async () => {
      // Create venture
      const ventureRes = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Venture',
        operation: 'create',
        data: {
          name: formData.name,
          description: formData.description,
          layer: formData.layer,
          status: formData.status,
          category: formData.category,
          website: formData.website,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          team_size: formData.team_size
        }
      });

      const ventureId = ventureRes.data?.id;

      // Create initial comment with core idea
      if (formData.core_idea) {
        await base44.functions.invoke('secureEntityQuery', {
          entity_name: 'VentureComment',
          operation: 'create',
          data: {
            venture_id: ventureId,
            comment: `💡 **Core Idea:** ${formData.core_idea}\n\n📊 **Target Market:** ${formData.target_market}\n\n✨ **Value Proposition:** ${formData.value_proposition}`,
            author_email: user?.email,
            author_name: user?.full_name
          }
        });
      }

      // Create team talents
      const validMembers = formData.team_members.filter(m => m.name && m.role);
      for (const member of validMembers) {
        await base44.functions.invoke('secureEntityQuery', {
          entity_name: 'VentureTalent',
          operation: 'create',
          data: {
            venture_id: ventureId,
            talent_name: member.name,
            role: member.role,
            email: member.email,
            level: 'mid',
            allocation: 100
          }
        });
      }

      // Create initial goals as tasks
      if (formData.initial_goals) {
        const goals = formData.initial_goals.split('\n').filter(g => g.trim());
        for (const goal of goals) {
          if (goal.trim()) {
            await base44.functions.invoke('secureEntityQuery', {
              entity_name: 'VentureTask',
              operation: 'create',
              data: {
                venture_id: ventureId,
                title: goal.trim(),
                status: 'todo',
                priority: 'high',
                assigned_to: user?.email,
                assigned_by: user?.email
              }
            });
          }
        }
      }

      // Log activity
      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ActivityLog',
        operation: 'create',
        data: {
          venture_id: ventureId,
          action_type: 'venture_updated',
          description: `Nova venture criada: ${formData.name}`,
          user_email: user?.email,
          user_name: user?.full_name
        }
      });

      return ventureRes.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ventures']);
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['activity']);
      toast.success('Venture criada com sucesso! 🚀');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Erro ao criar venture: ' + error.message);
    }
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTeamMember = () => {
    setFormData(prev => ({
      ...prev,
      team_members: [...prev.team_members, { name: '', role: '', email: '' }]
    }));
  };

  const updateTeamMember = (index, field, value) => {
    const updated = [...formData.team_members];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, team_members: updated }));
  };

  const removeTeamMember = (index) => {
    setFormData(prev => ({
      ...prev,
      team_members: prev.team_members.filter((_, i) => i !== index)
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.description && formData.category;
      case 2:
        return formData.core_idea;
      case 3:
        return formData.team_members.some(m => m.name && m.role);
      case 4:
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = () => {
    createVenture.mutate();
  };

  const StepIcon = steps[currentStep - 1]?.icon || Sparkles;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-3xl bg-[#0a1628] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[#00D4FF]/10 to-[#C7A763]/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white font-montserrat">Nova Venture</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    currentStep > step.id
                      ? 'bg-[#C7A763] border-[#C7A763] text-[#06101F]'
                      : currentStep === step.id
                      ? 'border-[#00D4FF] text-[#00D4FF]'
                      : 'border-white/20 text-slate-400'
                  }`}>
                    {currentStep > step.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">{step.id}</span>
                    )}
                  </div>
                  <span className={`text-xs hidden md:block ${
                    currentStep >= step.id ? 'text-white' : 'text-slate-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-full mx-2 ${
                    currentStep > step.id ? 'bg-[#C7A763]' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20">
                      <Sparkles className="w-6 h-6 text-[#00D4FF]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Informações Básicas</h3>
                      <p className="text-sm text-slate-400">Defina os detalhes fundamentais da venture</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Nome da Venture *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Ex: All.AI, Golden Deer..."
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Descrição *</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Descreva brevemente a venture..."
                      className="bg-white/5 border-white/10 text-white"
                      rows={3}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-300 mb-2 block">Camada *</label>
                      <Select value={formData.layer} onValueChange={(v) => updateField('layer', v)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="startup">Startup</SelectItem>
                          <SelectItem value="scaleup">Scale-up</SelectItem>
                          <SelectItem value="deeptech">Deep Tech</SelectItem>
                          <SelectItem value="platform">Platform</SelectItem>
                          <SelectItem value="cultural">Cultural</SelectItem>
                          <SelectItem value="winwin">Win-Win</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-300 mb-2 block">Status</label>
                      <Select value={formData.status} onValueChange={(v) => updateField('status', v)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="research">Research</SelectItem>
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="scaling">Scaling</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Categoria/Indústria *</label>
                    <Input
                      value={formData.category}
                      onChange={(e) => updateField('category', e.target.value)}
                      placeholder="Ex: AI, Fintech, Education..."
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Website (opcional)</label>
                    <Input
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://..."
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Tags (separadas por vírgula)</label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => updateField('tags', e.target.value)}
                      placeholder="ai, automation, b2b..."
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Value Proposition */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-[#C7A763]/10 border border-[#C7A763]/20">
                      <Lightbulb className="w-6 h-6 text-[#C7A763]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Proposta de Valor</h3>
                      <p className="text-sm text-slate-400">Qual é a essência da sua venture?</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Ideia Central *</label>
                    <Textarea
                      value={formData.core_idea}
                      onChange={(e) => updateField('core_idea', e.target.value)}
                      placeholder="Qual problema você está resolvendo e como?"
                      className="bg-white/5 border-white/10 text-white"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Mercado Alvo</label>
                    <Textarea
                      value={formData.target_market}
                      onChange={(e) => updateField('target_market', e.target.value)}
                      placeholder="Quem são seus clientes ideais?"
                      className="bg-white/5 border-white/10 text-white"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Proposta de Valor</label>
                    <Textarea
                      value={formData.value_proposition}
                      onChange={(e) => updateField('value_proposition', e.target.value)}
                      placeholder="Por que seu cliente deveria escolher você?"
                      className="bg-white/5 border-white/10 text-white"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Team */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20">
                      <Users className="w-6 h-6 text-[#00D4FF]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Equipe Inicial</h3>
                      <p className="text-sm text-slate-400">Adicione os membros fundadores</p>
                    </div>
                  </div>

                  {formData.team_members.map((member, index) => (
                    <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Membro {index + 1}</span>
                        {formData.team_members.length > 1 && (
                          <button
                            onClick={() => removeTeamMember(index)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                      <Input
                        value={member.name}
                        onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                        placeholder="Nome *"
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Input
                        value={member.role}
                        onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                        placeholder="Função/Cargo *"
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Input
                        value={member.email}
                        onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                        placeholder="Email"
                        type="email"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  ))}

                  <Button
                    onClick={addTeamMember}
                    variant="outline"
                    className="w-full border-white/10 text-white"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Adicionar Membro
                  </Button>
                </div>
              )}

              {/* Step 4: Goals */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-[#C7A763]/10 border border-[#C7A763]/20">
                      <Target className="w-6 h-6 text-[#C7A763]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Metas Iniciais</h3>
                      <p className="text-sm text-slate-400">Defina os primeiros objetivos (opcional)</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Objetivos (um por linha)</label>
                    <Textarea
                      value={formData.initial_goals}
                      onChange={(e) => updateField('initial_goals', e.target.value)}
                      placeholder="Validar MVP&#10;Conquistar primeiros 10 clientes&#10;Definir pricing strategy..."
                      className="bg-white/5 border-white/10 text-white"
                      rows={8}
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Estes objetivos serão criados como tarefas no sistema
                    </p>
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-[#00D4FF]/20 to-[#C7A763]/20 border border-white/20">
                      <Rocket className="w-6 h-6 text-[#C7A763]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Revisão Final</h3>
                      <p className="text-sm text-slate-400">Confirme os dados antes de criar</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="text-sm font-semibold text-[#00D4FF] mb-3">Informações Básicas</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-slate-400">Nome:</span> <span className="text-white">{formData.name}</span></div>
                        <div><span className="text-slate-400">Camada:</span> <span className="text-white">{formData.layer}</span></div>
                        <div><span className="text-slate-400">Categoria:</span> <span className="text-white">{formData.category}</span></div>
                        <div><span className="text-slate-400">Status:</span> <span className="text-white">{formData.status}</span></div>
                      </div>
                    </div>

                    {formData.core_idea && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <h4 className="text-sm font-semibold text-[#C7A763] mb-2">Ideia Central</h4>
                        <p className="text-sm text-slate-300">{formData.core_idea}</p>
                      </div>
                    )}

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="text-sm font-semibold text-[#00D4FF] mb-3">Equipe ({formData.team_members.filter(m => m.name).length})</h4>
                      <div className="space-y-2">
                        {formData.team_members.filter(m => m.name && m.role).map((m, i) => (
                          <div key={i} className="text-sm text-slate-300">
                            <span className="text-white">{m.name}</span> - {m.role}
                          </div>
                        ))}
                      </div>
                    </div>

                    {formData.initial_goals && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <h4 className="text-sm font-semibold text-[#C7A763] mb-3">
                          Metas ({formData.initial_goals.split('\n').filter(g => g.trim()).length})
                        </h4>
                        <div className="space-y-1">
                          {formData.initial_goals.split('\n').filter(g => g.trim()).map((goal, i) => (
                            <div key={i} className="text-sm text-slate-300 flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-[#C7A763]" />
                              {goal}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          <Button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1 || createVenture.isPending}
            variant="outline"
            className="border-white/10 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="flex gap-2">
            {currentStep < 5 ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]"
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={createVenture.isPending}
                className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
              >
                {createVenture.isPending ? (
                  <>Criando...</>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Criar Venture
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}