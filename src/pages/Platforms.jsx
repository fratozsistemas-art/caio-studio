import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Users, Lightbulb, ArrowRight, Check, Building, GraduationCap, Rocket, Shield } from 'lucide-react';
import SectionTitle from "@/components/ui/SectionTitle";
import GlowCard from "@/components/ui/GlowCard";
import { Button } from "@/components/ui/button";

const platforms = [
  {
    id: "fratoz",
    name: "Fratoz Triple A",
    tagline: "Acceleration, Automation, Analytics",
    description: "Infraestrutura completa de aceleração que fornece recursos compartilhados para todas as ventures do ecossistema CAIO Vision.",
    icon: Zap,
    color: "gold",
    features: [
      "Shared Services (Jurídico, Financeiro, RH)",
      "Automação de Processos Operacionais",
      "Analytics & Business Intelligence",
      "Infraestrutura Cloud Otimizada"
    ],
    stats: [
      { value: "40%", label: "Redução de custos" },
      { value: "3x", label: "Velocidade de operação" },
      { value: "24/7", label: "Suporte dedicado" }
    ]
  },
  {
    id: "cria",
    name: "CRIA Incubator",
    tagline: "Create, Research, Innovate, Accelerate",
    description: "Incubadora de ideias transformadoras que oferece mentoria estratégica, capital semente e acesso ao ecossistema para founders visionários.",
    icon: Lightbulb,
    color: "cyan",
    features: [
      "Programa de Mentoria Intensiva",
      "Capital Semente (até R$500k)",
      "Acesso à Rede de Investidores",
      "Workspace e Infraestrutura"
    ],
    stats: [
      { value: "15+", label: "Startups graduadas" },
      { value: "R$5M", label: "Capital mobilizado" },
      { value: "85%", label: "Taxa de sucesso" }
    ]
  }
];

const benefits = [
  {
    icon: Building,
    title: "Infraestrutura Enterprise",
    description: "Acesso a recursos de grande empresa desde o primeiro dia."
  },
  {
    icon: Users,
    title: "Network Exclusiva",
    description: "Conexão com investidores, mentores e parceiros estratégicos."
  },
  {
    icon: GraduationCap,
    title: "Conhecimento Aplicado",
    description: "Metodologias validadas e frameworks proprietários."
  },
  {
    icon: Shield,
    title: "Suporte Contínuo",
    description: "Acompanhamento desde a ideação até o scale-up."
  }
];

export default function Platforms() {
  return (
    <main className="min-h-screen py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16 text-center">
          <SectionTitle
            subtitle="Enabling Platforms"
            title="A Infraestrutura do Futuro"
            accent="cyan"
          />
          <p className="text-slate-400 text-lg mt-6 max-w-2xl mx-auto">
            Nossas plataformas habilitadoras são a fundação que permite a cada venture 
            operar com eficiência e escalar com velocidade.
          </p>
        </div>

        {/* Platform Cards */}
        <div className="space-y-12 mb-24">
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <GlowCard glowColor={platform.color} className="overflow-hidden">
                <div className="grid lg:grid-cols-2 gap-8 p-8 lg:p-12">
                  {/* Content */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl ${
                        platform.color === 'gold' 
                          ? 'bg-[#C7A763]/10 border border-[#C7A763]/20' 
                          : 'bg-[#00D4FF]/10 border border-[#00D4FF]/20'
                      }`}>
                        <platform.icon className={`w-8 h-8 ${
                          platform.color === 'gold' ? 'text-[#C7A763]' : 'text-[#00D4FF]'
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white font-montserrat">
                          {platform.name}
                        </h3>
                        <span className={`text-sm ${
                          platform.color === 'gold' ? 'text-[#C7A763]' : 'text-[#00D4FF]'
                        }`}>
                          {platform.tagline}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-400 leading-relaxed">
                      {platform.description}
                    </p>

                    <ul className="space-y-3">
                      {platform.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            platform.color === 'gold' 
                              ? 'bg-[#C7A763]/20' 
                              : 'bg-[#00D4FF]/20'
                          }`}>
                            <Check className={`w-3 h-3 ${
                              platform.color === 'gold' ? 'text-[#C7A763]' : 'text-[#00D4FF]'
                            }`} />
                          </div>
                          <span className="text-white/80 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className={`mt-4 ${
                        platform.color === 'gold'
                          ? 'bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]'
                          : 'bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]'
                      }`}
                    >
                      Saiba mais
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col justify-center">
                    <div className="grid grid-cols-3 gap-4">
                      {platform.stats.map((stat, sIndex) => (
                        <div 
                          key={sIndex} 
                          className="text-center p-6 rounded-2xl bg-white/5 border border-white/10"
                        >
                          <div className={`text-2xl lg:text-3xl font-bold font-montserrat mb-1 ${
                            platform.color === 'gold' ? 'text-[#C7A763]' : 'text-[#00D4FF]'
                          }`}>
                            {stat.value}
                          </div>
                          <div className="text-xs text-slate-400">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Visual element */}
                    <div className="mt-8 relative h-32 overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-transparent">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`text-6xl font-bold opacity-10 ${
                          platform.color === 'gold' ? 'text-[#C7A763]' : 'text-[#00D4FF]'
                        }`}>
                          {platform.name.split(' ')[0]}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>

        {/* Benefits Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-white text-center mb-12 font-montserrat">
            Por que fazer parte do ecossistema?
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-[#C7A763]/10 border border-[#C7A763]/20 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-[#C7A763]" />
                </div>
                <h4 className="text-white font-semibold mb-2">{benefit.title}</h4>
                <p className="text-slate-400 text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}