import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, TrendingUp, Cpu, Zap, Grid, Search, X, Filter } from 'lucide-react';
import SectionTitle from "@/components/ui/SectionTitle";
import VentureCard from "@/components/portfolio/VentureCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import GlowCard from "@/components/ui/GlowCard";

const ventures = [
  // Startup Projects
  {
    name: "Golden Deer",
    description: "Plataforma de investimentos alternativos com foco em ativos digitais e tokenização.",
    layer: "startup",
    status: "development",
    category: "FinTech",
    tags: ["Blockchain", "Investimentos", "DeFi"],
    website: "https://goldendeer.com.br"
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
  {
    name: "ESIOS",
    description: "Sistema operacional para gestão estratégica de ventures e portfolios.",
    layer: "startup",
    status: "active",
    category: "Platform",
    tags: ["Management", "Strategy", "Operations"],
    website: "https://esios.caiovision.com"
  },
  {
    name: "Twins",
    description: "Plataforma de inteligência artificial para criação de gêmeos digitais.",
    layer: "startup",
    status: "development",
    category: "AI Platform",
    tags: ["AI", "Digital Twins", "Simulation"],
    website: "https://twins.caiovision.com"
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
    tags: ["Educação", "Carreira", "Online"],
    website: "https://innovaacademy.com.br"
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
    tags: ["Nanotechnology", "R&D", "IP"],
    website: "https://orixmaterials.com"
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
    tags: ["Early Stage", "Mentoring", "Seed"],
    website: "https://criaincubator.com.br"
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Extract all unique tags from ventures
  const allTags = useMemo(() => {
    const tagsSet = new Set();
    ventures.forEach(venture => {
      venture.tags?.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, []);

  // Extract all unique statuses
  const allStatuses = useMemo(() => {
    const statusSet = new Set();
    ventures.forEach(venture => statusSet.add(venture.status));
    return Array.from(statusSet);
  }, []);

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setSelectedStatus("all");
    setActiveLayer("all");
  };

  // Advanced filtering logic
  const filteredVentures = useMemo(() => {
    return ventures.filter(venture => {
      // Layer filter
      const matchesLayer = activeLayer === "all" || venture.layer === activeLayer;
      
      // Status filter
      const matchesStatus = selectedStatus === "all" || venture.status === selectedStatus;
      
      // Tag filter
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => venture.tags?.includes(tag));
      
      // Search query filter (searches in title, description, tags, and category)
      const matchesSearch = searchQuery === "" || 
        venture.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venture.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venture.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venture.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesLayer && matchesStatus && matchesTags && matchesSearch;
    });
  }, [activeLayer, selectedStatus, selectedTags, searchQuery]);

  const activeFiltersCount = 
    (activeLayer !== "all" ? 1 : 0) +
    (selectedStatus !== "all" ? 1 : 0) +
    selectedTags.length +
    (searchQuery ? 1 : 0);

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

        {/* Search & Filters Section */}
        <div className="space-y-4 mb-8">
          {/* Search Bar */}
          <GlowCard glowColor="cyan" className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar ventures por nome, descrição, categoria ou tags..."
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`border-white/20 text-white transition-all ${
                  showFilters ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros Avançados
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 bg-[#C7A763] text-[#06101F] hover:bg-[#C7A763]">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
          </GlowCard>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <GlowCard glowColor="gold" className="p-6">
                  <div className="space-y-6">
                    {/* Layer Filters */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Grid className="w-4 h-4 text-[#C7A763]" />
                        Camadas do Portfolio
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {layers.map((layer) => (
                          <Button
                            key={layer.id}
                            size="sm"
                            variant={activeLayer === layer.id ? "default" : "outline"}
                            onClick={() => setActiveLayer(layer.id)}
                            className={`rounded-full transition-all duration-300 ${
                              activeLayer === layer.id
                                ? "bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F] border-transparent"
                                : "border-white/20 bg-white/5 text-white hover:bg-white/10"
                            }`}
                          >
                            <layer.icon className="w-3 h-3 mr-1.5" />
                            {layer.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Status Filters */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#00D4FF]" />
                        Status
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={selectedStatus === "all" ? "default" : "outline"}
                          onClick={() => setSelectedStatus("all")}
                          className={`rounded-full ${
                            selectedStatus === "all"
                              ? "bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]"
                              : "border-white/20 bg-white/5 text-white hover:bg-white/10"
                          }`}
                        >
                          Todos
                        </Button>
                        {allStatuses.map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={selectedStatus === status ? "default" : "outline"}
                            onClick={() => setSelectedStatus(status)}
                            className={`rounded-full ${
                              selectedStatus === status
                                ? "bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]"
                                : "border-white/20 bg-white/5 text-white hover:bg-white/10"
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Tag Filters */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[#C7A763]" />
                        Filtrar por Tags
                        {selectedTags.length > 0 && (
                          <span className="text-xs text-[#C7A763]">
                            ({selectedTags.length} selecionada{selectedTags.length > 1 ? 's' : ''})
                          </span>
                        )}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {allTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              selectedTags.includes(tag)
                                ? "bg-[#C7A763] text-[#06101F] border border-[#C7A763]"
                                : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:border-white/20"
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clear Filters */}
                    {activeFiltersCount > 0 && (
                      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                        <span className="text-sm text-slate-400">
                          {filteredVentures.length} venture{filteredVentures.length !== 1 ? 's' : ''} encontrada{filteredVentures.length !== 1 ? 's' : ''}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={clearAllFilters}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4 mr-1.5" />
                          Limpar Filtros
                        </Button>
                      </div>
                    )}
                  </div>
                </GlowCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Filters Display */}
          {(activeFiltersCount > 0 && !showFilters) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-400">Filtros ativos:</span>
              {activeLayer !== "all" && (
                <Badge 
                  variant="secondary" 
                  className="bg-[#C7A763]/20 text-[#C7A763] border border-[#C7A763]/30 hover:bg-[#C7A763]/30"
                >
                  {layers.find(l => l.id === activeLayer)?.label}
                  <button onClick={() => setActiveLayer("all")} className="ml-1.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedStatus !== "all" && (
                <Badge 
                  variant="secondary" 
                  className="bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30 hover:bg-[#00D4FF]/30"
                >
                  {selectedStatus}
                  <button onClick={() => setSelectedStatus("all")} className="ml-1.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedTags.map(tag => (
                <Badge 
                  key={tag}
                  variant="secondary" 
                  className="bg-white/10 text-white border border-white/20 hover:bg-white/20"
                >
                  {tag}
                  <button onClick={() => toggleTag(tag)} className="ml-1.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {searchQuery && (
                <Badge 
                  variant="secondary" 
                  className="bg-white/10 text-white border border-white/20 hover:bg-white/20"
                >
                  Busca: "{searchQuery}"
                  <button onClick={() => setSearchQuery("")} className="ml-1.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-slate-400">
            Mostrando <span className="text-[#C7A763] font-semibold">{filteredVentures.length}</span> de <span className="text-white">{ventures.length}</span> ventures
          </div>
        </div>

        {/* Portfolio Grid */}
        {filteredVentures.length > 0 ? (
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
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhuma venture encontrada</h3>
            <p className="text-slate-400 mb-6">
              Tente ajustar seus filtros ou termos de busca
            </p>
            <Button
              onClick={clearAllFilters}
              variant="outline"
              className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
            >
              Limpar todos os filtros
            </Button>
          </motion.div>
        )}

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