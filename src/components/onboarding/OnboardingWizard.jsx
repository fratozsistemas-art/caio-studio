import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check, Sparkles, Target, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';

const WIZARD_STEPS = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao CASIO V2 STUDIO',
    description: 'Sua plataforma completa para gestão de ventures. Vamos personalizar sua experiência.',
    icon: Sparkles,
    color: 'cyan'
  },
  {
    id: 'profile',
    title: 'Configure seu Perfil',
    description: 'Conte-nos um pouco sobre você e seus objetivos.',
    icon: Users,
    color: 'gold'
  },
  {
    id: 'interests',
    title: 'Áreas de Interesse',
    description: 'Selecione as áreas que mais te interessam para personalizar o dashboard.',
    icon: Target,
    color: 'mixed'
  },
  {
    id: 'complete',
    title: 'Tudo Pronto!',
    description: 'Sua conta está configurada. Vamos começar!',
    icon: Check,
    color: 'cyan'
  }
];

const INTEREST_OPTIONS = [
  { id: 'ventures', label: 'Gestão de Ventures', icon: BarChart3 },
  { id: 'kpis', label: 'KPIs e Métricas', icon: Target },
  { id: 'talents', label: 'Gestão de Talentos', icon: Users },
  { id: 'financials', label: 'Análise Financeira', icon: BarChart3 },
  { id: 'collaboration', label: 'Colaboração', icon: Users },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 }
];

export default function OnboardingWizard({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({
    role: '',
    company: '',
    interests: []
  });
  const [saving, setSaving] = useState(false);

  const step = WIZARD_STEPS[currentStep];
  const StepIcon = step.icon;

  const handleNext = async () => {
    if (currentStep === WIZARD_STEPS.length - 1) {
      await handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleInterest = (interestId) => {
    setUserData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(i => i !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // Save user preferences
      await base44.auth.updateMe({
        onboarding_completed: true,
        onboarding_data: userData
      });
      
      toast.success('Onboarding concluído com sucesso!');
      onComplete?.();
    } catch (error) {
      toast.error('Erro ao salvar preferências');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <GlowCard glowColor={step.color} className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C7A763]/20 to-[#00D4FF]/20 border border-white/10 flex items-center justify-center">
                <StepIcon className="w-6 h-6 text-[#C7A763]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{step.title}</h2>
                <p className="text-slate-400 text-sm mt-1">{step.description}</p>
              </div>
            </div>
            <button
              onClick={onComplete}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex gap-2">
              {WIZARD_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    index <= currentStep
                      ? 'bg-gradient-to-r from-[#C7A763] to-[#00D4FF]'
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-500">
                Passo {currentStep + 1} de {WIZARD_STEPS.length}
              </span>
            </div>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-[300px]"
            >
              {step.id === 'welcome' && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C7A763]/20 to-[#00D4FF]/20 border border-white/10 flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-[#C7A763]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    An Operating System for Venture Creation
                  </h3>
                  <p className="text-slate-400 leading-relaxed max-w-lg mx-auto">
                    Transforme complexidade em clareza estratégica através da união entre 
                    inteligência humana e artificial. Vamos configurar sua experiência.
                  </p>
                </div>
              )}

              {step.id === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-white mb-2 block">Qual seu papel?</Label>
                    <Input
                      value={userData.role}
                      onChange={(e) => setUserData({...userData, role: e.target.value})}
                      placeholder="Ex: CEO, Investidor, Gestor..."
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Empresa/Organização</Label>
                    <Input
                      value={userData.company}
                      onChange={(e) => setUserData({...userData, company: e.target.value})}
                      placeholder="Nome da sua empresa"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
              )}

              {step.id === 'interests' && (
                <div>
                  <p className="text-slate-400 mb-6 text-center">
                    Selecione as áreas que você mais utiliza no seu dia a dia
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {INTEREST_OPTIONS.map((interest) => {
                      const InterestIcon = interest.icon;
                      const isSelected = userData.interests.includes(interest.id);
                      
                      return (
                        <button
                          key={interest.id}
                          onClick={() => toggleInterest(interest.id)}
                          className={`p-4 rounded-lg border transition-all text-left ${
                            isSelected
                              ? 'bg-[#C7A763]/20 border-[#C7A763] shadow-lg'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <InterestIcon className={`w-5 h-5 ${isSelected ? 'text-[#C7A763]' : 'text-slate-400'}`} />
                            <span className={`font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                              {interest.label}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-[#C7A763] ml-auto" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step.id === 'complete' && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Configuração Concluída!
                  </h3>
                  <p className="text-slate-400 leading-relaxed max-w-lg mx-auto mb-6">
                    Seu dashboard foi personalizado com base nas suas preferências. 
                    Você pode ajustar essas configurações a qualquer momento.
                  </p>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Papel:</span>
                        <p className="text-white font-medium">{userData.role || 'Não informado'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Empresa:</span>
                        <p className="text-white font-medium">{userData.company || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="flex justify-between pt-8 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={handleNext}
              disabled={saving}
              className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F] hover:opacity-90"
            >
              {saving ? 'Salvando...' : currentStep === WIZARD_STEPS.length - 1 ? 'Começar' : 'Próximo'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </GlowCard>
      </motion.div>
    </div>
  );
}