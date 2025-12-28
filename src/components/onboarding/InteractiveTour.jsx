import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TOUR_STEPS = [
  {
    target: '[data-tour="admin-hub"]',
    title: 'Admin Hub',
    description: 'Central de controle para administradores. Aqui você gerencia usuários, talentos, permissões e muito mais.',
    position: 'bottom'
  },
  {
    target: '[data-tour="talents"]',
    title: 'Gestão de Talentos',
    description: 'Visualize todos os talentos, suas skills, feedbacks e metas de desenvolvimento.',
    position: 'bottom'
  },
  {
    target: '[data-tour="skill-matrix"]',
    title: 'Matriz de Skills',
    description: 'Veja as competências de toda equipe e identifique gaps. A IA sugere desenvolvimentos.',
    position: 'left'
  },
  {
    target: '[data-tour="performance"]',
    title: 'Performance',
    description: 'Templates de avaliação, coleta de feedback 360° e insights de IA sobre a equipe.',
    position: 'left'
  },
  {
    target: '[data-tour="arquivos"]',
    title: 'Gestão de Arquivos',
    description: 'Central de documentos organizados por categoria e venture.',
    position: 'left'
  }
];

export default function InteractiveTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isActive || currentStep >= TOUR_STEPS.length) return;

    const step = TOUR_STEPS[currentStep];
    const element = document.querySelector(step.target);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        const position = calculatePosition(rect, step.position);
        setTooltipPosition(position);
        
        // Highlight effect
        element.style.position = 'relative';
        element.style.zIndex = '9999';
        element.style.boxShadow = '0 0 0 4px rgba(199, 167, 99, 0.5)';
        element.style.borderRadius = '8px';
      }, 500);
    }

    return () => {
      if (element) {
        element.style.boxShadow = '';
        element.style.zIndex = '';
      }
    };
  }, [currentStep, isActive]);

  const calculatePosition = (rect, position) => {
    const offset = 20;
    let top, left;

    switch (position) {
      case 'bottom':
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2;
        break;
      case 'top':
        top = rect.top - offset;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - offset;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + offset;
        break;
      default:
        top = rect.bottom + offset;
        left = rect.left;
    }

    return { top, left };
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    setIsActive(false);
    onComplete?.();
  };

  const handleComplete = () => {
    setIsActive(false);
    onComplete?.();
  };

  if (!isActive || currentStep >= TOUR_STEPS.length) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-[9998]" onClick={handleSkip} />

      {/* Tooltip */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed z-[9999] bg-[#0a1628] border border-[#C7A763] rounded-xl shadow-2xl max-w-sm"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translate(-50%, 0)'
          }}
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C7A763]" />
                <h4 className="text-white font-semibold">{step.title}</h4>
              </div>
              <button onClick={handleSkip} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-slate-300 text-sm mb-4">{step.description}</p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {currentStep + 1} de {TOUR_STEPS.length}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSkip}>
                  Pular Tour
                </Button>
                <Button size="sm" onClick={handleNext} className="bg-[#C7A763] hover:bg-[#A88B4A]">
                  {currentStep === TOUR_STEPS.length - 1 ? 'Concluir' : 'Próximo'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}