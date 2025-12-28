import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Users, Target, Briefcase, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao CAIO Vision!',
    icon: Sparkles,
    component: WelcomeStep
  },
  {
    id: 'culture',
    title: 'Nossa Cultura',
    icon: Users,
    component: CultureStep
  },
  {
    id: 'goals',
    title: 'Suas Metas',
    icon: Target,
    component: GoalsStep
  },
  {
    id: 'connections',
    title: 'Conexões',
    icon: Users,
    component: ConnectionsStep
  },
  {
    id: 'complete',
    title: 'Tudo Pronto!',
    icon: CheckCircle,
    component: CompleteStep
  }
];

function WelcomeStep({ talent, onNext }) {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#C7A763] to-[#00D4FF] flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">Olá, {talent?.full_name?.split(' ')[0]}! 👋</h2>
      <p className="text-slate-300 mb-6 max-w-md mx-auto">
        Estamos muito felizes em tê-lo(a) na equipe! Vamos fazer um tour rápido para você conhecer nossa cultura, 
        definir suas metas e conectar-se com a equipe.
      </p>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-2xl mb-2">🚀</div>
          <div className="text-sm text-white font-medium">Inovação</div>
          <div className="text-xs text-slate-400">Venture Building</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-2xl mb-2">🤝</div>
          <div className="text-sm text-white font-medium">Colaboração</div>
          <div className="text-xs text-slate-400">Time First</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-2xl mb-2">📈</div>
          <div className="text-sm text-white font-medium">Crescimento</div>
          <div className="text-xs text-slate-400">Desenvolvimento</div>
        </div>
      </div>
      <Button onClick={onNext} className="bg-[#C7A763] hover:bg-[#A88B4A]">
        Começar Tour
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

function CultureStep({ onNext }) {
  return (
    <div className="py-6">
      <h3 className="text-2xl font-bold text-white mb-6 text-center">Nossa Cultura & Valores</h3>
      
      <div className="space-y-4 mb-8">
        <div className="bg-gradient-to-r from-[#C7A763]/10 to-transparent border-l-4 border-[#C7A763] p-4 rounded-r-lg">
          <h4 className="text-white font-semibold mb-2">🎯 Foco em Resultados</h4>
          <p className="text-slate-300 text-sm">
            Trabalhamos com objetivos claros (OKRs) e métricas definidas. Cada venture tem KPIs específicos e acompanhamos o progresso continuamente.
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-[#00D4FF]/10 to-transparent border-l-4 border-[#00D4FF] p-4 rounded-r-lg">
          <h4 className="text-white font-semibold mb-2">🤝 Colaboração Radical</h4>
          <p className="text-slate-300 text-sm">
            Valorizamos a transparência e comunicação aberta. Use nossos canais de colaboração livremente e não hesite em pedir ajuda.
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500/10 to-transparent border-l-4 border-purple-500 p-4 rounded-r-lg">
          <h4 className="text-white font-semibold mb-2">📚 Aprendizado Contínuo</h4>
          <p className="text-slate-300 text-sm">
            Incentivamos o desenvolvimento constante. Defina metas de aprendizado, participe de feedbacks 360° e compartilhe conhecimento.
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-green-500/10 to-transparent border-l-4 border-green-500 p-4 rounded-r-lg">
          <h4 className="text-white font-semibold mb-2">⚡ Agilidade & Autonomia</h4>
          <p className="text-slate-300 text-sm">
            Confiamos na sua capacidade de tomar decisões. Trabalhe com autonomia, experimente e aprenda rápido.
          </p>
        </div>
      </div>
      
      <div className="flex justify-center">
        <Button onClick={onNext} className="bg-[#C7A763] hover:bg-[#A88B4A]">
          Próximo
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function GoalsStep({ talent, onNext }) {
  const [goals, setGoals] = useState([
    { title: '', goal_type: 'skill_development', target_date: '' }
  ]);

  const saveMutation = useMutation({
    mutationFn: async (goalsData) => {
      const promises = goalsData.map(goal =>
        base44.functions.invoke('secureEntityQuery', {
          entity_name: 'TalentGoal',
          operation: 'create',
          data: {
            talent_id: talent.id,
            ...goal,
            status: 'not_started',
            progress: 0
          }
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success('Metas definidas!');
      onNext();
    }
  });

  const addGoal = () => {
    setGoals([...goals, { title: '', goal_type: 'skill_development', target_date: '' }]);
  };

  return (
    <div className="py-6">
      <h3 className="text-2xl font-bold text-white mb-4 text-center">Defina Suas Primeiras Metas</h3>
      <p className="text-slate-400 text-center mb-6 text-sm">
        Quais são seus objetivos para os próximos 3 meses? (Você pode adicionar mais depois)
      </p>
      
      <div className="space-y-3 mb-6">
        {goals.map((goal, idx) => (
          <div key={idx} className="bg-white/5 rounded-lg p-4 space-y-3">
            <Input
              placeholder="Ex: Dominar React Hooks"
              value={goal.title}
              onChange={(e) => {
                const newGoals = [...goals];
                newGoals[idx].title = e.target.value;
                setGoals(newGoals);
              }}
              className="bg-white/5 border-white/10 text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={goal.goal_type}
                onChange={(e) => {
                  const newGoals = [...goals];
                  newGoals[idx].goal_type = e.target.value;
                  setGoals(newGoals);
                }}
                className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm"
              >
                <option value="skill_development">Desenvolvimento</option>
                <option value="project">Projeto</option>
                <option value="performance">Performance</option>
                <option value="career">Carreira</option>
              </select>
              <Input
                type="date"
                value={goal.target_date}
                onChange={(e) => {
                  const newGoals = [...goals];
                  newGoals[idx].target_date = e.target.value;
                  setGoals(newGoals);
                }}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between">
        <Button onClick={addGoal} variant="outline" size="sm">
          + Adicionar Meta
        </Button>
        <Button 
          onClick={() => saveMutation.mutate(goals.filter(g => g.title))}
          className="bg-[#C7A763] hover:bg-[#A88B4A]"
        >
          Salvar & Continuar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function ConnectionsStep({ talent, onNext, onboardingData, setOnboardingData }) {
  const { data: talents = [] } = useQuery({
    queryKey: ['talents'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Talent',
        operation: 'list'
      });
      return res.data?.data?.filter(t => t.id !== talent.id) || [];
    }
  });

  const [selectedMentor, setSelectedMentor] = useState('');
  const [selectedBuddies, setSelectedBuddies] = useState([]);

  const handleNext = () => {
    setOnboardingData({
      ...onboardingData,
      assigned_mentor: selectedMentor,
      buddy_matches: selectedBuddies
    });
    onNext();
  };

  const seniorTalents = talents.filter(t => 
    t.seniority_level === 'senior' || t.seniority_level === 'lead' || t.seniority_level === 'executive'
  );

  return (
    <div className="py-6">
      <h3 className="text-2xl font-bold text-white mb-4 text-center">Conecte-se com a Equipe</h3>
      
      <div className="space-y-6">
        <div>
          <label className="text-white font-medium mb-3 block">Escolha um Mentor (opcional)</label>
          <p className="text-slate-400 text-sm mb-3">
            Um mentor pode guiá-lo(a) nos primeiros meses e ajudar no desenvolvimento de carreira.
          </p>
          <select
            value={selectedMentor}
            onChange={(e) => setSelectedMentor(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
          >
            <option value="">Selecionar depois</option>
            {seniorTalents.map(t => (
              <option key={t.id} value={t.email}>
                {t.full_name} - {t.current_position}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-white font-medium mb-3 block">Buddies / Colegas (opcional)</label>
          <p className="text-slate-400 text-sm mb-3">
            Conecte-se com colegas para almoços, cafés ou apenas trocar ideias.
          </p>
          <div className="grid md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {talents.slice(0, 10).map(t => (
              <label key={t.id} className="flex items-center gap-2 bg-white/5 p-2 rounded cursor-pointer hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={selectedBuddies.includes(t.email)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBuddies([...selectedBuddies, t.email]);
                    } else {
                      setSelectedBuddies(selectedBuddies.filter(b => b !== t.email));
                    }
                  }}
                  className="rounded"
                />
                <span className="text-white text-sm">{t.full_name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-6">
        <Button onClick={handleNext} className="bg-[#C7A763] hover:bg-[#A88B4A]">
          Finalizar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function CompleteStep({ onClose }) {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-400" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">Onboarding Concluído! 🎉</h2>
      <p className="text-slate-300 mb-6 max-w-md mx-auto">
        Você está pronto(a) para começar! Explore o sistema, conecte-se com sua equipe e não hesite em pedir ajuda.
      </p>
      
      <div className="bg-white/5 rounded-lg p-6 max-w-md mx-auto mb-6">
        <h4 className="text-white font-semibold mb-3">Próximos Passos:</h4>
        <ul className="text-left text-slate-300 text-sm space-y-2">
          <li>✅ Complete seu perfil na aba "Talentos"</li>
          <li>✅ Explore as ventures ativas</li>
          <li>✅ Confira seu checklist de onboarding</li>
          <li>✅ Agende um café virtual com seu mentor/buddy</li>
        </ul>
      </div>
      
      <Button onClick={onClose} className="bg-gradient-to-r from-[#C7A763] to-[#00D4FF]">
        Começar a Trabalhar!
      </Button>
    </div>
  );
}

export default function OnboardingWizard({ talent, isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({
    talent_id: talent?.id,
    current_step: 0,
    completed_steps: [],
    assigned_mentor: '',
    buddy_matches: []
  });
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'TalentOnboarding',
        operation: 'create',
        data: {
          ...data,
          completed: true,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['talent-onboarding']);
      onClose();
    }
  });

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setOnboardingData({
        ...onboardingData,
        current_step: currentStep + 1,
        completed_steps: [...onboardingData.completed_steps, ONBOARDING_STEPS[currentStep].id]
      });
    } else {
      saveMutation.mutate(onboardingData);
    }
  };

  const CurrentStepComponent = ONBOARDING_STEPS[currentStep].component;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-[#0a1628] border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">
                Etapa {currentStep + 1} de {ONBOARDING_STEPS.length}
              </span>
              <span className="text-sm text-[#C7A763] font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps */}
          <div className="flex justify-center gap-2 mb-4">
            {ONBOARDING_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    idx === currentStep
                      ? 'bg-[#C7A763]/20 text-[#C7A763]'
                      : idx < currentStep
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-white/5 text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium hidden md:inline">{step.title}</span>
                </div>
              );
            })}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentStepComponent
                talent={talent}
                onNext={handleNext}
                onboardingData={onboardingData}
                setOnboardingData={setOnboardingData}
                onClose={() => saveMutation.mutate(onboardingData)}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}