import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Rocket, TrendingUp, Cpu, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import GlowCard from "@/components/ui/GlowCard";
import SectionTitle from "@/components/ui/SectionTitle";

const portfolioLayers = [
  {
    title: "Startup Projects",
    description: "Ideias em estágio inicial sendo validadas e desenvolvidas com metodologias ágeis.",
    icon: Rocket,
    color: "cyan",
    ventures: ["Golden Deer", "ESIOS", "Twins", "Troyjo", "Colour Me Brazil"],
    stats: "8 projetos ativos"
  },
  {
    title: "Scale-Up Ventures",
    description: "Empresas em crescimento acelerado, prontas para conquistar novos mercados.",
    icon: TrendingUp,
    color: "gold",
    ventures: ["All.AI", "Innova Academy", "i9net", "DataSync"],
    stats: "4 em expansão"
  },
  {
    title: "Deep Tech & IP",
    description: "Inovações de fronteira com propriedade intelectual e potencial transformador.",
    icon: Cpu,
    color: "cyan",
    ventures: ["ORIX Materials", "QuantumBridge"],
    stats: "2 patentes"
  },
  {
    title: "Enabling Platforms",
    description: "Infraestrutura que potencializa todo o ecossistema de ventures.",
    icon: Zap,
    color: "gold",
    ventures: ["Fratoz Triple A", "CRIA Incubator"],
    stats: "Core infrastructure"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function PortfolioPreview() {
  return (
    <section className="relative py-24 px-6">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a1628]/50 to-transparent" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <SectionTitle
          subtitle="Portfolio Layers"
          title="Camadas do Ecossistema"
          accent="gold"
          className="mb-16"
        />

        <motion.div
          className="grid md:grid-cols-2 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {portfolioLayers.map((layer, index) => (
            <motion.div key={index} variants={itemVariants}>
              <GlowCard glowColor={layer.color} className="h-full">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-3 rounded-xl ${layer.color === 'cyan' ? 'bg-[#00D4FF]/10' : 'bg-[#C7A763]/10'}`}>
                      <layer.icon className={`w-6 h-6 ${layer.color === 'cyan' ? 'text-[#00D4FF]' : 'text-[#C7A763]'}`} />
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                      layer.color === 'cyan' 
                        ? 'bg-[#00D4FF]/10 text-[#00D4FF]' 
                        : 'bg-[#C7A763]/10 text-[#C7A763]'
                    }`}>
                      {layer.stats}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 font-montserrat">
                    {layer.title}
                  </h3>
                  
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    {layer.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {layer.ventures.map((venture, vIndex) => (
                      <span
                        key={vIndex}
                        className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs"
                      >
                        {venture}
                      </span>
                    ))}
                  </div>

                  <Link 
                    to={createPageUrl("Portfolio")}
                    className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
                      layer.color === 'cyan'
                        ? 'text-[#00D4FF] hover:text-[#33DDFF]'
                        : 'text-[#C7A763] hover:text-[#D4B474]'
                    }`}
                  >
                    Explorar
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link 
            to={createPageUrl("Portfolio")}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-[#C7A763]/30 bg-[#C7A763]/5 text-[#C7A763] font-medium hover:bg-[#C7A763]/10 transition-all duration-300"
          >
            Ver Portfolio Completo
            <ArrowUpRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}