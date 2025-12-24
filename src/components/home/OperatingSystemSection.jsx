import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Layers, Cog, Shield, Zap, Network } from 'lucide-react';
import SectionTitle from "@/components/ui/SectionTitle";

const coreModules = [
  {
    icon: Brain,
    title: "CAIO TSI",
    subtitle: "The Strategic Intelligence",
    description: "Núcleo de inteligência estratégica que processa dados de mercado e gera insights acionáveis."
  },
  {
    icon: Layers,
    title: "CAIO OS",
    subtitle: "Operating System",
    description: "Arquitetura proprietária que padroniza processos de criação e escala de ventures."
  },
  {
    icon: Network,
    title: "Central Services",
    subtitle: "Shared Infrastructure",
    description: "Recursos compartilhados: jurídico, financeiro, RH, marketing e tecnologia."
  }
];

const features = [
  { icon: Cog, label: "Automação Inteligente" },
  { icon: Shield, label: "Governança Integrada" },
  { icon: Zap, label: "Escala Acelerada" }
];

export default function OperatingSystemSection() {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00D4FF]/5 via-transparent to-[#C7A763]/5" />
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <SectionTitle
          subtitle="The Kernel"
          title="Sistema Operacional para Ventures"
          accent="cyan"
          className="mb-16"
        />

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {coreModules.map((module, index) => (
            <motion.div
              key={index}
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#00D4FF]/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative p-8 rounded-3xl border border-white/10 bg-[#0a1628]/50 backdrop-blur-sm h-full">
                {/* Icon */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-[#00D4FF]/20 blur-xl rounded-full" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00D4FF]/20 to-[#00D4FF]/5 border border-[#00D4FF]/20 flex items-center justify-center">
                    <module.icon className="w-8 h-8 text-[#00D4FF]" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2 mb-4">
                  <h3 className="text-xl font-bold text-white font-montserrat">
                    {module.title}
                  </h3>
                  <span className="text-[#00D4FF] text-sm font-medium">
                    {module.subtitle}
                  </span>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed">
                  {module.description}
                </p>

                {/* Connection line */}
                {index < coreModules.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-[#00D4FF]/30 to-transparent" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features bar */}
        <motion.div
          className="flex flex-wrap justify-center gap-6 md:gap-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C7A763]/10 border border-[#C7A763]/20 flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-[#C7A763]" />
              </div>
              <span className="text-white/80 text-sm font-medium">{feature.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Quote */}
        <motion.blockquote
          className="mt-16 max-w-3xl mx-auto text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <p className="text-2xl md:text-3xl font-light text-white/80 italic leading-relaxed">
            "Strategic insight at{' '}
            <span className="text-[#C7A763] font-normal not-italic">thought speed</span>"
          </p>
          <cite className="mt-4 block text-slate-500 text-sm not-italic">
            — CAIO Vision Philosophy
          </cite>
        </motion.blockquote>
      </div>
    </section>
  );
}