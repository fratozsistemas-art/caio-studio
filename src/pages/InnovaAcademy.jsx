import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lightbulb, Users, Target, BookOpen, Award, Rocket, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import GlowCard from "@/components/ui/GlowCard";
import SectionTitle from "@/components/ui/SectionTitle";
import YouTubeVideoGrid from "@/components/youtube/YouTubeVideoGrid";

export default function InnovaAcademy() {
  const programs = [
    {
      icon: Rocket,
      title: "Programa de Aceleração",
      description: "Acelere seu negócio com mentoria especializada e acesso a recursos estratégicos",
      color: "cyan"
    },
    {
      icon: Users,
      title: "Capacitação Corporativa",
      description: "Desenvolva equipes de alta performance com metodologias ágeis e inovadoras",
      color: "gold"
    },
    {
      icon: Lightbulb,
      title: "Inovação & Criatividade",
      description: "Workshops e programas para estimular a cultura de inovação",
      color: "cyan"
    },
    {
      icon: Award,
      title: "Certificações",
      description: "Certificações reconhecidas em metodologias ágeis e gestão de inovação",
      color: "gold"
    }
  ];

  const pillars = [
    {
      icon: Target,
      title: "Foco em Resultados",
      description: "Metodologias práticas com impacto mensurável"
    },
    {
      icon: Users,
      title: "Aprendizado Colaborativo",
      description: "Networking e troca de experiências entre participantes"
    },
    {
      icon: BookOpen,
      title: "Conteúdo Atualizado",
      description: "Sempre alinhado com as melhores práticas do mercado"
    }
  ];

  return (
    <main className="min-h-screen bg-[#06101F] text-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00D4FF]/10 to-transparent" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <Link to={createPageUrl("Portfolio")} className="inline-flex items-center gap-2 text-[#00D4FF] hover:text-[#00B8E6] mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Portfolio
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/20 mb-6">
              <Lightbulb className="w-4 h-4 text-[#00D4FF]" />
              <span className="text-sm text-[#00D4FF]">Education & Innovation</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold font-montserrat mb-6">
              Innova <span className="text-[#00D4FF]">Academy</span>
            </h1>
            
            <p className="text-xl text-slate-300 leading-relaxed mb-8">
              Transformando conhecimento em inovação através de programas educacionais 
              que preparam profissionais e organizações para os desafios do futuro
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-5 py-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-[#00D4FF]">500+</div>
                <div className="text-xs text-slate-400">Profissionais Capacitados</div>
              </div>
              <div className="px-5 py-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-[#C7A763]">50+</div>
                <div className="text-xs text-slate-400">Empresas Parceiras</div>
              </div>
              <div className="px-5 py-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-[#00D4FF]">95%</div>
                <div className="text-xs text-slate-400">Satisfação</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <SectionTitle
                subtitle="NOSSA MISSÃO"
                title="Educação que Transforma"
                accent="cyan"
                align="left"
              />
              
              <p className="text-slate-300 leading-relaxed mt-6 mb-6">
                A Innova Academy nasceu da necessidade de conectar o conhecimento teórico 
                com a prática do mercado, criando programas educacionais que realmente 
                preparam profissionais para os desafios da transformação digital e da inovação.
              </p>

              <p className="text-slate-300 leading-relaxed mb-8">
                Combinamos metodologias ágeis, design thinking e práticas de inovação 
                corporativa para criar experiências de aprendizado que geram impacto real 
                nos negócios e nas carreiras dos participantes.
              </p>

              <div className="space-y-4">
                {pillars.map((pillar, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center flex-shrink-0">
                      <pillar.icon className="w-5 h-5 text-[#00D4FF]" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">{pillar.title}</h4>
                      <p className="text-slate-400 text-sm">{pillar.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800"
                alt="Innovation Academy"
                className="rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#00D4FF]/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            subtitle="PROGRAMAS"
            title="Soluções para Cada Necessidade"
            accent="cyan"
            align="center"
          />

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {programs.map((program, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlowCard glowColor={program.color} className="p-8 h-full">
                  <program.icon className={`w-12 h-12 mb-4 ${program.color === 'cyan' ? 'text-[#00D4FF]' : 'text-[#C7A763]'}`} />
                  <h3 className="text-xl font-bold text-white mb-3">{program.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{program.description}</p>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionTitle
            subtitle="CONHEÇA MAIS"
            title="Veja Como Funciona"
            accent="gold"
            align="center"
          />

          <div className="mt-12">
            <GlowCard glowColor="cyan" className="p-2">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src="https://www.youtube.com/embed/Q1NYAokK29I"
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  title="Innova Academy Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </GlowCard>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#C7A763]/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            subtitle="METODOLOGIA"
            title="Aprendizado na Prática"
            accent="gold"
            align="center"
          />

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <GlowCard glowColor="cyan" className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#00D4FF]">1</span>
              </div>
              <h4 className="text-white font-semibold mb-2">Teoria Aplicada</h4>
              <p className="text-slate-400 text-sm">
                Conceitos fundamentais conectados com casos reais do mercado
              </p>
            </GlowCard>

            <GlowCard glowColor="gold" className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[#C7A763]/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#C7A763]">2</span>
              </div>
              <h4 className="text-white font-semibold mb-2">Prática Orientada</h4>
              <p className="text-slate-400 text-sm">
                Exercícios e projetos com mentoria de especialistas
              </p>
            </GlowCard>

            <GlowCard glowColor="cyan" className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#00D4FF]">3</span>
              </div>
              <h4 className="text-white font-semibold mb-2">Implementação Real</h4>
              <p className="text-slate-400 text-sm">
                Aplicação imediata do conhecimento em projetos reais
              </p>
            </GlowCard>
          </div>
        </div>
      </section>

      {/* YouTube Content Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#00D4FF]/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            subtitle="APRENDA MAIS"
            title="Vídeos e Tutoriais"
            accent="cyan"
            align="center"
          />
          <div className="mt-12">
            <YouTubeVideoGrid category="education" limit={6} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <GlowCard glowColor="mixed" className="p-12 text-center">
            <Lightbulb className="w-16 h-16 text-[#00D4FF] mx-auto mb-6" />
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 font-montserrat">
              Pronto para Transformar sua Carreira?
            </h2>
            <p className="text-slate-300 text-lg mb-8">
              Entre em contato e descubra como nossos programas podem acelerar 
              seu desenvolvimento profissional e de sua equipe.
            </p>
            <Link 
              to={createPageUrl("About")}
              className="inline-block px-8 py-4 bg-[#00D4FF] hover:bg-[#00B8E6] text-white font-semibold rounded-full transition-colors"
            >
              Fale Conosco
            </Link>
          </GlowCard>
        </div>
      </section>
    </main>
  );
}