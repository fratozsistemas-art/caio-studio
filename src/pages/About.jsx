import React from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, Users, Award, Linkedin, Mail, ArrowUpRight } from 'lucide-react';
import SectionTitle from "@/components/ui/SectionTitle";
import GlowCard from "@/components/ui/GlowCard";
import NeuralBrain from "@/components/ui/NeuralBrain";

const team = [
  {
    name: "CAIO Chairman",
    role: "Founder & Chairman",
    description: "Visionário por trás da arquitetura CAIO OS. Lidera a estratégia e governança do ecossistema.",
    color: "gold"
  },
  {
    name: "Executive Anchor - Tech",
    role: "CTO & Tech Lead",
    description: "Responsável pela infraestrutura tecnológica e desenvolvimento de produtos digitais.",
    color: "cyan"
  },
  {
    name: "Executive Anchor - Growth",
    role: "CGO & Business Dev",
    description: "Lidera estratégias de crescimento, parcerias e expansão de mercado.",
    color: "gold"
  },
  {
    name: "Executive Anchor - Ops",
    role: "COO & Operations",
    description: "Orquestra operações e garante eficiência nos serviços compartilhados.",
    color: "cyan"
  }
];

const values = [
  {
    icon: Target,
    title: "Clareza Estratégica",
    description: "Transformamos complexidade em planos de ação executáveis."
  },
  {
    icon: Eye,
    title: "Visão de Longo Prazo",
    description: "Construímos para décadas, não para trimestres."
  },
  {
    icon: Users,
    title: "Colaboração Radical",
    description: "O sucesso de uma venture é o sucesso de todas."
  },
  {
    icon: Award,
    title: "Excelência Implacável",
    description: "Padrões elevados em tudo o que fazemos."
  }
];

const timeline = [
  { year: "2020", event: "Fundação da CAIO Vision", description: "Início da jornada com a visão de um venture studio diferenciado." },
  { year: "2021", event: "Lançamento do CAIO OS", description: "Desenvolvimento da arquitetura operacional proprietária." },
  { year: "2022", event: "Primeiras Ventures", description: "Lançamento de Golden Deer e QuickTech." },
  { year: "2023", event: "Expansão Fratoz", description: "Central Services totalmente operacional." },
  { year: "2024", event: "Scale-up Phase", description: "All.AI e Innova Academy em crescimento acelerado." },
  { year: "2025", event: "Deep Tech", description: "ORIX Materials inicia pesquisa de materiais avançados." }
];

export default function About() {
  return (
    <main className="min-h-screen py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <SectionTitle
              subtitle="Sobre Nós"
              title="Mais que um Venture Studio"
              accent="gold"
              align="left"
            />
            <p className="text-slate-400 text-lg mt-6 leading-relaxed">
              O CAIO Vision não é apenas uma holding ou um fundo de investimento. 
              Somos um <span className="text-[#C7A763]">Sistema Operacional para Criação de Negócios</span> — 
              uma máquina estratégica que combina o melhor do intelecto humano com o poder 
              da inteligência artificial.
            </p>
            <p className="text-slate-400 text-lg mt-4 leading-relaxed">
              Nossa missão é transformar complexidade em clareza, ideias em empresas, 
              e visão em realidade tangível.
            </p>
          </motion.div>

          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <iframe
                src="https://www.youtube.com/embed/0b4Dl-tGm6c"
                title="CAIO Vision Presentation"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>
        </div>

        {/* Values */}
        <motion.div
          className="mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-white text-center mb-12 font-montserrat">
            Nossos Valores
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                className="p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#C7A763]/10 border border-[#C7A763]/20 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-[#C7A763]" />
                </div>
                <h4 className="text-white font-semibold mb-2">{value.title}</h4>
                <p className="text-slate-400 text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          className="mb-24"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-white text-center mb-12 font-montserrat">
            Nossa Jornada
          </h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#00D4FF] via-[#C7A763] to-transparent hidden lg:block" />
            
            <div className="space-y-8">
              {timeline.map((item, index) => (
                <motion.div
                  key={index}
                  className={`flex items-center gap-8 ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                    <GlowCard glowColor={index % 2 === 0 ? 'cyan' : 'gold'} className="inline-block">
                      <div className="p-6">
                        <span className={`text-sm font-bold ${index % 2 === 0 ? 'text-[#00D4FF]' : 'text-[#C7A763]'}`}>
                          {item.year}
                        </span>
                        <h4 className="text-lg font-semibold text-white mt-1">{item.event}</h4>
                        <p className="text-slate-400 text-sm mt-2">{item.description}</p>
                      </div>
                    </GlowCard>
                  </div>
                  
                  {/* Center dot */}
                  <div className="hidden lg:flex w-4 h-4 rounded-full bg-gradient-to-r from-[#00D4FF] to-[#C7A763] z-10" />
                  
                  <div className="flex-1 hidden lg:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-white text-center mb-4 font-montserrat">
            Governança & Liderança
          </h3>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            As mentes estratégicas que operam a máquina CAIO Vision
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <GlowCard glowColor={member.color} className="h-full">
                  <div className="p-6 text-center">
                    {/* Avatar placeholder */}
                    <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                      member.color === 'gold' 
                        ? 'bg-gradient-to-br from-[#C7A763]/30 to-[#C7A763]/10 border border-[#C7A763]/30' 
                        : 'bg-gradient-to-br from-[#00D4FF]/30 to-[#00D4FF]/10 border border-[#00D4FF]/30'
                    }`}>
                      <span className={`text-2xl font-bold ${
                        member.color === 'gold' ? 'text-[#C7A763]' : 'text-[#00D4FF]'
                      }`}>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>

                    <h4 className="text-white font-semibold mb-1">{member.name}</h4>
                    <span className={`text-sm ${
                      member.color === 'gold' ? 'text-[#C7A763]' : 'text-[#00D4FF]'
                    }`}>
                      {member.role}
                    </span>
                    <p className="text-slate-400 text-sm mt-3">{member.description}</p>

                    <div className="flex justify-center gap-3 mt-4">
                      <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <Linkedin className="w-4 h-4 text-slate-400" />
                      </button>
                      <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <Mail className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          className="mt-24 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="p-12 rounded-3xl bg-gradient-to-r from-[#C7A763]/10 via-transparent to-[#00D4FF]/10 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-4 font-montserrat">
              Quer fazer parte desta história?
            </h3>
            <p className="text-slate-400 mb-6">
              Entre em contato para explorar oportunidades de parceria ou investimento.
            </p>
            <a 
              href="mailto:contato@caiovision.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F] font-semibold hover:shadow-lg hover:shadow-[#C7A763]/30 transition-all"
            >
              <Mail className="w-5 h-5" />
              contato@caiovision.com
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </main>
  );
}