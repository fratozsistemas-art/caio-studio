import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, Heart, BookOpen, Palette, Leaf, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import GlowCard from "@/components/ui/GlowCard";
import SectionTitle from "@/components/ui/SectionTitle";

export default function ColourMeBrazil() {
  const legends = [
    {
      title: "A Vitória-Régia: A Estrela da Lua",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
      description: "Lenda do folclore amazônico"
    },
    {
      title: "O Curupira: O Guardião com Pés para Trás",
      image: "https://images.unsplash.com/photo-1511497584788-876760111969?w=800",
      description: "Protetor da floresta"
    },
    {
      title: "A Cobra Grande: A Serpente Gigante do Rio",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
      description: "Mistérios do Rio Amazonas"
    },
    {
      title: "A Iara: A Sereia do Rio",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
      description: "Encanto das águas"
    },
    {
      title: "O Mapinguari: O Gigante Gentil da Floresta",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
      description: "Guardião ancestral"
    },
    {
      title: "O Uirapuru: O Pássaro que Traz Desejos",
      image: "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800",
      description: "Melodia mágica"
    }
  ];

  const features = [
    {
      icon: BookOpen,
      title: "Estrutura Orientada a Dados",
      description: "Conteúdo definido em JSON, separando dados da lógica da aplicação"
    },
    {
      icon: Globe,
      title: "Escalabilidade",
      description: "Novos livros e páginas podem ser adicionados sem alterar o código"
    },
    {
      icon: Leaf,
      title: "Performance Offline",
      description: "Pré-carregamento de ativos para experiência offline robusta"
    },
    {
      icon: Palette,
      title: "Flexibilidade de Conteúdo",
      description: "Múltiplos tipos de página (story, coloring, text, credits)"
    }
  ];

  const timeline = [
    { year: "2003-2011", role: "Environment & Sustainability Manager", company: "CNI" },
    { year: "2011-2016", role: "Senior Environmental Lawyer", company: "KLA Law" },
    { year: "2016-2020", role: "Environmental and Permitting Manager", company: "Ramboll Brasil" },
    { year: "2021-2022", role: "Environmental & Permitting Manager", company: "Fortescue Future Industries" },
    { year: "2022-2025", role: "Consultora ESG/Compliance", company: "Independente" }
  ];

  return (
    <main className="min-h-screen bg-[#06101F] text-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#C7A763]/10 to-transparent" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <Link to={createPageUrl("Portfolio")} className="inline-flex items-center gap-2 text-[#C7A763] hover:text-[#E5C585] mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Portfolio
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C7A763]/10 border border-[#C7A763]/20 mb-6">
                <Heart className="w-4 h-4 text-[#C7A763]" />
                <span className="text-sm text-[#C7A763]">Cultural Legacy Project</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold font-montserrat mb-6">
                Colour Me <span className="text-[#C7A763]">Brazil</span>
              </h1>
              
              <p className="text-xl text-slate-300 leading-relaxed mb-8">
                Uma coleção de livros infantis e experiências digitais que convidam crianças de todo o mundo a explorar as ricas tradições, festivais, animais e sabores que tornam a cultura brasileira tão única.
              </p>

              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-400">Primeira Obra</div>
                  <div className="text-sm font-medium">Tales of the Amazon</div>
                </div>
                <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-400">Formato</div>
                  <div className="text-sm font-medium">Livro + Digital</div>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800"
                alt="Colour Me Brazil"
                className="rounded-2xl shadow-2xl w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06101F] to-transparent rounded-2xl" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Creator Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-[#C7A763]/5">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            subtitle="SOBRE A CRIADORA"
            title="Grace Nogueira"
            accent="gold"
            align="center"
          />

          <div className="grid lg:grid-cols-2 gap-12 mt-12">
            <GlowCard glowColor="gold" className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                A Especialista em ESG e Licenciamento Ambiental
              </h3>
              <p className="text-slate-300 leading-relaxed mb-6">
                Liderança no licenciamento ambiental para projetos industriais de grande escala, 
                incluindo o primeiro projeto de Hidrogênio Verde (GH2) em larga escala a obter 
                licença ambiental no Brasil (Fortescue Future Industries).
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#C7A763] mt-2" />
                  <p className="text-slate-400">Conformidade regulatória e planejamento de uso do solo</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#C7A763] mt-2" />
                  <p className="text-slate-400">Coordenação com IBAMA, autoridades estaduais e municipais</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#C7A763] mt-2" />
                  <p className="text-slate-400">Avaliação de risco e comunicação estratégica com stakeholders</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#C7A763] mt-2" />
                  <p className="text-slate-400">Estruturação de governança ESG para clientes multinacionais</p>
                </div>
              </div>
            </GlowCard>

            <GlowCard glowColor="mixed" className="p-8">
              <h3 className="text-2xl font-bold text-white mb-6">
                A Dupla Formação: A Semente da Síntese
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-[#00D4FF]" />
                    </div>
                    <h4 className="font-semibold text-white">Direito</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-400">
                    <li>• Bacharel em Direito - Universidade Presbiteriana Mackenzie, 1991</li>
                    <li>• LL.M. in Environmental Law - University of London, 1997</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[#C7A763]/10 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-[#C7A763]" />
                    </div>
                    <h4 className="font-semibold text-white">Línguas e Literatura</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-400">
                    <li>• Bacharel em Línguas e Literatura (Português-Inglês) - USP, 1991</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <h4 className="font-semibold text-white mb-2">Educação Executiva</h4>
                  <p className="text-sm text-slate-400">
                    Cursos em Gestão de Projetos (Austrália), Gestão de Negócios (Costa Rica) 
                    e Governança (Reino Unido)
                  </p>
                </div>
              </div>
            </GlowCard>
          </div>
        </div>
      </section>

      {/* Career Timeline */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            subtitle="TRAJETÓRIA"
            title="Uma Carreira de Duas Décadas Dedicada à Sustentabilidade no Brasil"
            accent="cyan"
            align="center"
          />

          <div className="mt-12 relative">
            <div className="absolute left-0 lg:left-1/2 transform lg:-translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-[#00D4FF] to-[#C7A763]" />
            
            <div className="space-y-12">
              {timeline.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className={`flex flex-col lg:flex-row gap-6 ${i % 2 === 0 ? 'lg:flex-row-reverse' : ''}`}
                >
                  <div className="flex-1" />
                  <div className="relative flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-[#C7A763] ring-4 ring-[#06101F]" />
                  </div>
                  <div className="flex-1">
                    <GlowCard glowColor={i % 2 === 0 ? "cyan" : "gold"} className="p-5">
                      <div className="text-[#C7A763] font-bold mb-2">{item.year}</div>
                      <h4 className="text-white font-semibold mb-1">{item.role}</h4>
                      <p className="text-slate-400 text-sm">{item.company}</p>
                    </GlowCard>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Project Origin */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#C7A763]/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white mb-6 font-montserrat">
                Protegendo a Amazônia Física. <br />
                <span className="text-[#C7A763]">Preservando sua Alma Cultural.</span>
              </h2>
              
              <p className="text-slate-300 leading-relaxed mb-6">
                "Em algum lugar ao longo do caminho, meu amor por escrever foi guardado."
              </p>
              
              <p className="text-slate-300 leading-relaxed mb-6">
                Anos depois, os ventos da vida me levaram para o campo do direito... Avance algumas décadas, 
                e me encontrei na Austrália, recentemente divorciada... Foi lá que redescobri dois antigos 
                amores: a escrita e a dança. Eles se tornaram meu santuário.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-[#00D4FF] flex-shrink-0 mt-1" />
                  <p className="text-slate-300">
                    A curiosidade das pessoas ao seu redor sobre o Brasil, especialmente a Amazônia
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-[#C7A763] flex-shrink-0 mt-1" />
                  <p className="text-slate-300">
                    A alegria contagiante de compartilhar um simples "brigadeiro" em uma festa de aniversário
                  </p>
                </div>
              </div>

              <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-[#C7A763]/10 to-[#00D4FF]/10 border border-[#C7A763]/20">
                <p className="text-[#C7A763] italic text-lg">
                  "Percebi que queria compartilhar o Brasil — não apenas seus lugares, 
                  mas suas cores, seus sons, sua alma."
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img
                src="https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800"
                alt="Amazon Rainforest"
                className="rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tales of the Amazon */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            subtitle="PRIMEIRA OBRA"
            title="Tales of the Amazon"
            accent="gold"
            align="center"
          />

          <p className="text-center text-slate-300 max-w-3xl mx-auto mt-6 mb-12">
            Um livro de histórias e colorir que explora as lendas mágicas da floresta amazônica
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {legends.map((legend, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlowCard glowColor="mixed" className="overflow-hidden h-full">
                  <img
                    src={legend.image}
                    alt={legend.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-5">
                    <h4 className="text-white font-semibold mb-2">{legend.title}</h4>
                    <p className="text-slate-400 text-sm">{legend.description}</p>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>

          <GlowCard glowColor="gold" className="p-8 text-center">
            <Palette className="w-12 h-12 text-[#C7A763] mx-auto mb-4" />
            <p className="text-slate-300 text-lg italic max-w-3xl mx-auto">
              "E assim veio a ideia: que melhor maneira de fazer isso do que através dos olhos das crianças, 
              com um livro de colorir onde cada página se torna uma jornada — e cada lápis de cor, um passaporte?"
            </p>
          </GlowCard>
        </div>
      </section>

      {/* Technical Architecture */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#00D4FF]/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            subtitle="ARQUITETURA"
            title="Flexível, Escalável e Pronta para o Futuro"
            accent="cyan"
            align="center"
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlowCard glowColor="cyan" className="p-6 h-full">
                  <feature.icon className="w-8 h-8 text-[#00D4FF] mb-4" />
                  <h4 className="text-white font-semibold mb-2">{feature.title}</h4>
                  <p className="text-slate-400 text-sm">{feature.description}</p>
                </GlowCard>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-300 text-lg mb-6">
              Construindo uma experiência digital com ferramentas modernas
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['Vue.js', 'React', 'shadcn/ui', 'Framer Motion', '@base44/sdk'].map((tech, i) => (
                <div key={i} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-[#00D4FF] font-medium">{tech}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final Message */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <GlowCard glowColor="mixed" className="p-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 font-montserrat">
                A Advogada Garante a Existência. <br />
                <span className="text-[#C7A763]">A Artista Garante o Legado.</span>
              </h2>
              
              <p className="text-slate-300 leading-relaxed mb-8">
                A profunda experiência de Grace Nogueira em navegar por complexos processos de 
                licenciamento ambiental e em desenvolver estruturas ESG para corporações não é apenas 
                um item em seu currículo. É a base que confere uma autoridade e um propósito inigualáveis 
                ao 'Colour Me Brazil'. Ela não está apenas contando histórias sobre a Amazônia; 
                ela passou a vida profissional inteira trabalhando para protegê-la.
              </p>

              <div className="inline-block p-8 rounded-2xl bg-gradient-to-br from-[#C7A763]/20 to-[#00D4FF]/20">
                <p className="text-2xl font-bold text-white mb-4">
                  Você está cordialmente convidado.
                </p>
                <p className="text-xl text-[#C7A763] mb-2">A COLORIR.</p>
                <p className="text-xl text-[#00D4FF] mb-2">A explorar.</p>
                <p className="text-xl text-white">A sonhar.</p>
                <p className="text-slate-400 mt-6 italic">
                  Grace Nogueira, Criadora de 'Colour Me Brazil'
                </p>
              </div>
            </GlowCard>
          </motion.div>
        </div>
      </section>

      {/* Embedded PDF Viewer */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#C7A763]/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            subtitle="APRESENTAÇÃO COMPLETA"
            title="Conheça Mais Sobre o Projeto"
            accent="gold"
            align="center"
          />

          <div className="mt-12">
            <GlowCard glowColor="gold" className="p-2">
              <iframe
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694bb237ea2a9785983b9883/254b03dc8_Corporate_Expertise_Creative_Legacy.pdf"
                className="w-full h-[600px] rounded-lg"
                title="Colour Me Brazil Presentation"
              />
            </GlowCard>
          </div>
        </div>
      </section>
    </main>
  );
}