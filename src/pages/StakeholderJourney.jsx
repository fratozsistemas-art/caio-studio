import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Building2, Handshake, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";
import SectionTitle from "@/components/ui/SectionTitle";
import FounderQualification from "@/components/stakeholder/FounderQualification";
import CorporateQualification from "@/components/stakeholder/CorporateQualification";
import PartnerQualification from "@/components/stakeholder/PartnerQualification";
import InvestorQualification from "@/components/stakeholder/InvestorQualification";

const STAKEHOLDER_TYPES = [
  {
    type: 'founder',
    icon: Rocket,
    title: 'Sou Fundador',
    subtitle: 'Tenho uma ideia e quero construir uma venture',
    description: 'Transforme sua visão em realidade em 6 meses com acesso a infraestrutura, capital e expertise.',
    color: 'cyan',
    benefits: ['Infraestrutura completa', 'Acesso a capital', 'Mentoria estratégica', 'Time compartilhado']
  },
  {
    type: 'corporate',
    icon: Building2,
    title: 'Sou Corporação',
    subtitle: 'Quero inovar através de venture building',
    description: 'Construa ventures sem criar um studio interno. Remova fricção e acelere inovação corporativa.',
    color: 'gold',
    benefits: ['Venture building externo', 'Redução de risco', 'Acesso a metodologia', 'Time especializado']
  },
  {
    type: 'partner',
    icon: Handshake,
    title: 'Sou Parceiro',
    subtitle: 'Quero fornecer serviços ao ecossistema',
    description: 'Junte-se aos nossos Central Services e acesse um portfolio de ventures em crescimento.',
    color: 'mixed',
    benefits: ['Acesso ao portfolio', 'Volume previsível', 'Co-marketing', 'Network qualificado']
  },
  {
    type: 'investor',
    icon: TrendingUp,
    title: 'Sou Investidor',
    subtitle: 'Quero investir em venture creation sistemática',
    description: 'Participe do mecanismo de criação de ventures com portfolio diversificado e inteligência proprietária.',
    color: 'gold',
    benefits: ['Portfolio diversificado', 'Processo sistemático', 'CAIO TSI Intelligence', 'Deal flow exclusivo']
  }
];

export default function StakeholderJourney() {
  const [selectedType, setSelectedType] = useState(null);
  const [showQualification, setShowQualification] = useState(false);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setShowQualification(true);
  };

  const handleBack = () => {
    setShowQualification(false);
    setSelectedType(null);
  };

  if (showQualification && selectedType) {
    return (
      <main className="min-h-screen py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={handleBack}
            variant="ghost"
            className="text-white/70 hover:text-white mb-6"
          >
            ← Voltar
          </Button>
          
          {selectedType === 'founder' && <FounderQualification onComplete={handleBack} />}
          {selectedType === 'corporate' && <CorporateQualification onComplete={handleBack} />}
          {selectedType === 'partner' && <PartnerQualification onComplete={handleBack} />}
          {selectedType === 'investor' && <InvestorQualification onComplete={handleBack} />}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <SectionTitle
          subtitle="SUA JORNADA"
          title="Escolha seu Caminho"
          accent="cyan"
          align="center"
          className="mb-12"
        />

        <p className="text-center text-slate-300 text-lg mb-12 max-w-2xl mx-auto">
          Cada jornada é única. Selecione seu perfil para uma experiência personalizada.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {STAKEHOLDER_TYPES.map((stakeholder, i) => {
            const Icon = stakeholder.icon;
            return (
              <motion.div
                key={stakeholder.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlowCard 
                  glowColor={stakeholder.color} 
                  className="p-8 h-full cursor-pointer group"
                  onClick={() => handleTypeSelect(stakeholder.type)}
                >
                  <div className="flex flex-col h-full">
                    <div className="mb-4">
                      <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon className="w-8 h-8 text-[#00D4FF]" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{stakeholder.title}</h3>
                      <p className="text-slate-400 text-sm mb-4">{stakeholder.subtitle}</p>
                    </div>

                    <p className="text-slate-300 mb-6 flex-grow">{stakeholder.description}</p>

                    <div className="space-y-2 mb-6">
                      {stakeholder.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-slate-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#C7A763]" />
                          {benefit}
                        </div>
                      ))}
                    </div>

                    <Button className="w-full bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F] font-semibold group-hover:scale-105 transition-transform">
                      Começar Jornada
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </main>
  );
}