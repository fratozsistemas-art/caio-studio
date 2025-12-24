import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, TrendingUp, Cpu, Zap, Grid, List } from 'lucide-react';
import SectionTitle from "@/components/ui/SectionTitle";
import VentureCard from "@/components/portfolio/VentureCard";
import { Button } from "@/components/ui/button";

const ventures = [
  // Startup Projects
  {
    name: "Golden Deer",
    description: "Plataforma de investimentos alternativos com foco em ativos digitais e tokenização.",
    layer: "startup",
    status: "development",
    category: "FinTech",
    tags: ["Blockchain", "Investimentos", "DeFi"]
  },
  {
    name: "QuickTech",
    description: "Soluções de automação para pequenas e médias empresas com IA integrada.",
    layer: "startup",
    status: "active",
    category: "SaaS",
    tags: ["Automação", "PMEs", "AI"]
  },
  {
    name: "Nexus Pay",
    description: "Gateway de pagamentos unificado para e-commerce com checkout otimizado.",
    layer: "startup",
    status: "development",
    category: "Payments",
    tags: ["E-commerce", "Pagamentos", "API"]
  },
  // Scale-Up
  {
    name: "All.AI",
    description: "Plataforma enterprise de inteligência artificial para transformação digital.",
    layer: "scaleup",
    status: "scaling",
    category: "AI Enterprise",
    tags: ["Machine Learning", "Enterprise", "Analytics"]
  },
  {
    name: "Innova Academy",
    description: "EdTech focada em capacitação profissional com metodologias imersivas.",
    layer: "scaleup",
    status: "active",
    category: "EdTech",
    tags: ["Educação", "Carreira", "Online"]
  },
  {
    name: "DataSync",
    description: "Orquestração de dados em tempo real para operações críticas de negócios.",
    layer: "scaleup",
    status: "scaling",
    category: "Data Infra",
    tags: ["Big Data", "Real-time", "Integration"]
  },
  // Deep Tech
  {
    name: "ORIX Materials",
    description: "Desenvolvimento de materiais avançados com propriedades programáveis.",
    layer: "deeptech",
    status: "research",
    category: "Advanced Materials",
    tags: ["Nanotechnology", "R&D", "IP"]
  },
  {
    name: "QuantumBridge",
    description: "Pesquisa em computação quântica aplicada a problemas de otimização.",
    layer: "deeptech",
    status: "research",
    category: "Quantum Computing",
    tags: ["Quantum", "Research", "Patents"]
  },
  // Enabling Platforms
  {
    name: "Fratoz Triple A",
    description: "Infraestrutura de aceleração com recursos compartilhados para o ecossistema.",
    layer: "platform",
    status: "active",
    category: "Acceleration",
    tags: ["Infra", "Shared Services", "Support"]
  },
  {
    name: "CRIA Incubator",
    description: "Incubadora de ideias transformadoras com mentoria e capital semente.",
    layer: "platform",
    status: "active",
    category: "Incubation",
    tags: ["Early Stage", "Mentoring", "Seed"]
  }
];

const layers = [
  { id: "all", label: "Todos", icon: Grid },
  { id: "startup", label: "Startups", icon: Rocket },
  { id: "scaleup", label: "Scale-ups", icon: TrendingUp },
  { id: "deeptech", label: "Deep Tech", icon: Cpu },
  { id: "platform", label: "Platforms", icon: Zap }
];

export default function Portfolio() {
  const [activeLayer, setActiveLayer] = useState("all");

  const filteredVentures = activeLayer === "all" 
    ? ventures 
    : ventures.filter(v => v.layer === activeLayer);

  return (
    <main className="min-h-screen py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <SectionTitle
            subtitle="Portfolio"
            title="Nosso Ecossistema de Ventures"
            accent="gold"
            align="left"
          />
          <p className="text-slate-400 text-lg mt-6 max-w-2xl">
            Cada venture representa uma peça única do nosso sistema operacional, 
            trabalhando em sincronia para criar valor exponencial.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-12">
          {layers.map((layer) => (
            <Button
              key={layer.id}
              variant={activeLayer === layer.id ? "default" : "outline"}
              onClick={() => setActiveLayer(layer.id)}
              className={`rounded-full px-5 py-2 transition-all duration-300 ${
                activeLayer === layer.id
                  ? "bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F] border-transparent shadow-lg shadow-[#C7A763]/20"
                  : "border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30"
              }`}
            >
              <layer.icon className="w-4 h-4 mr-2" />
              {layer.label}
            </Button>
          ))}
        </div>

        {/* Portfolio Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredVentures.map((venture, index) => (
              <VentureCard key={venture.name} venture={venture} index={index} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {[
            { value: "10+", label: "Ventures Ativas" },
            { value: "4", label: "Camadas Estratégicas" },
            { value: "50+", label: "Profissionais" },
            { value: "R$2M+", label: "Capital Deployado" }
          ].map((stat, index) => (
            <div key={index} className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-3xl md:text-4xl font-bold text-[#C7A763] font-montserrat mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}