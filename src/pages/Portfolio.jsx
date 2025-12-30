import React, { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, TrendingUp, Cpu, Zap, Grid, Search, X, Filter, Palette, Network, Eye } from 'lucide-react';
import SectionTitle from "@/components/ui/SectionTitle";
import VentureCard from "@/components/portfolio/VentureCard";
import VentureQuickView from "@/components/portfolio/VentureQuickView";
import PortfolioAnalyticsDashboard from "@/components/portfolio/PortfolioAnalyticsDashboard";
import AdvancedAnalyticsDashboard from "@/components/portfolio/AdvancedAnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import GlowCard from "@/components/ui/GlowCard";
import { useTranslation } from "react-i18next";
import "@/components/i18n";

const STATIC_VENTURES_CONFIG = [
  {
    key: "golden_deer",
    layer: "startup",
    status: "development",
    category: "FinTech",
    tags: ["Blockchain", "Investimentos", "DeFi"],
    website: "https://goldendeer.com.br"
  },
  {
    key: "quicktech_acabamentos",
    layer: "startup",
    status: "active",
    category: "SaaS",
    tags: ["Automação", "PMEs", "AI"],
    website: "https://quicktechacabamentos.com.br"
  },
  {
    key: "esu_empreendimentos",
    layer: "startup",
    status: "active",
    category: "PropTech",
    tags: ["Real Estate", "Gestão", "Empreendimentos"],
    website: "https://esuemi.com.br"
  },
  {
    key: "nexus_pay",
    layer: "startup",
    status: "development",
    category: "Payments",
    tags: ["E-commerce", "Pagamentos", "API"]
  },
  {
    key: "esios",
    layer: "startup",
    status: "active",
    category: "Platform",
    tags: ["Management", "Strategy", "Operations"],
    website: "https://esios.caiovision.com"
  },
  {
    key: "caio_vision_studio",
    layer: "platform",
    status: "active",
    category: "Institutional",
    tags: ["Portal", "Brand", "Ecosystem"],
    website: "https://caiovision.com"
  },
  {
    key: "caio_vision_brasil",
    layer: "platform",
    status: "active",
    category: "Regional Portal",
    tags: ["Portal", "Brazil", "Regional"],
    website: "https://caiovision.com.br"
  },
  {
    key: "twins",
    layer: "startup",
    status: "development",
    category: "AI Platform",
    tags: ["AI", "Digital Twins", "Simulation"],
    website: "https://twins.caiovision.com"
  },
  {
    key: "troyjo",
    layer: "startup",
    status: "active",
    category: "Analytics",
    tags: ["Strategy", "Market Intelligence", "Analytics"],
    website: "https://troyjo.caiovision.com"
  },
  {
    key: "colour_me_brazil",
    layer: "cultural",
    status: "active",
    category: "Digital Art",
    tags: ["Art", "Culture", "Brazil", "Digital"],
    website: "https://colour-me-brazil.caiovision.com"
  },
  {
    key: "i9net",
    layer: "scaleup",
    status: "scaling",
    category: "Innovation Network",
    tags: ["Network", "Innovation", "Collaboration"],
    website: "https://i9net.caiovision.com"
  },
  {
    key: "all_ai",
    layer: "scaleup",
    status: "scaling",
    category: "AI Enterprise",
    tags: ["Machine Learning", "Enterprise", "Analytics"]
  },
  {
    key: "innova_academy",
    layer: "scaleup",
    status: "active",
    category: "EdTech",
    tags: ["Educação", "Carreira", "Online"],
    website: "https://innovaacademy.com.br"
  },
  {
    key: "datasync",
    layer: "scaleup",
    status: "scaling",
    category: "Data Infra",
    tags: ["Big Data", "Real-time", "Integration"]
  },
  {
    key: "orix_materials",
    layer: "deeptech",
    status: "research",
    category: "Advanced Materials",
    tags: ["Nanotechnology", "R&D", "IP"],
    website: "https://orixmaterials.com"
  },
  {
    key: "quantum_bridge",
    layer: "deeptech",
    status: "research",
    category: "Quantum Computing",
    tags: ["Quantum", "Research", "Patents"]
  },
  {
    key: "fratoz_triple_a",
    layer: "platform",
    status: "active",
    category: "Acceleration",
    tags: ["Infra", "Shared Services", "Support"]
  },
  {
    key: "cria_incubator",
    layer: "platform",
    status: "active",
    category: "Incubation",
    tags: ["Early Stage", "Mentoring", "Seed"],
    website: "https://criaincubator.com.br"
  },
  {
    key: "arte_e_cultura_lab",
    layer: "cultural",
    status: "active",
    category: "Cultural Innovation",
    tags: ["Arts", "Culture", "Innovation", "Community"]
  },
  {
    key: "synergy_hub",
    layer: "winwin",
    status: "active",
    category: "Strategic Partnerships",
    tags: ["Partnerships", "Collaboration", "Network", "Value Creation"]
  }
];

const STATIC_LAYERS_CONFIG = [
  { id: "all", icon: Grid },
  { id: "startup", icon: Rocket },
  { id: "scaleup", icon: TrendingUp },
  { id: "deeptech", icon: Cpu },
  { id: "platform", icon: Zap },
  { id: "cultural", icon: Palette },
  { id: "winwin", icon: Network }
];

export default function Portfolio() {
  const { t } = useTranslation();
  
  const [activeLayer, setActiveLayer] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [quickViewVenture, setQuickViewVenture] = useState(null);

  // Refs for scrolling to sections
  const sectionRefs = {
    startup: useRef(null),
    scaleup: useRef(null),
    deeptech: useRef(null),
    platform: useRef(null),
    cultural: useRef(null),
    winwin: useRef(null)
  };

  const scrollToLayer = (layerId) => {
    if (sectionRefs[layerId]?.current) {
      sectionRefs[layerId].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Fetch ventures from database
  const { data: dbVentures, isLoading } = useQuery({
    queryKey: ['ventures'],
    queryFn: () => base44.entities.Venture.list('-created_date', 100)
  });

  // Combine database and translated static ventures
  const allVentures = useMemo(() => {
    const translatedStaticVentures = STATIC_VENTURES_CONFIG.map(v => ({
      ...v,
      name: t.portfolio.ventures[v.key].name,
      description: t.portfolio.ventures[v.key].description
    }));

    const combined = [...(dbVentures || []), ...translatedStaticVentures];
    const unique = combined.reduce((acc, current) => {
      const exists = acc.find(v => v.name === current.name);
      if (!exists) {
        return [...acc, current];
      }
      return acc;
    }, []);
    return unique;
  }, [dbVentures, t.portfolio.ventures]);

  // Extract all unique tags from ventures
  const allTags = useMemo(() => {
    const tagsSet = new Set();
    allVentures.forEach(venture => {
      venture.tags?.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [allVentures]);

  // Extract all unique statuses
  const allStatuses = useMemo(() => {
    const statusSet = new Set();
    allVentures.forEach(venture => statusSet.add(venture.status));
    return Array.from(statusSet);
  }, [allVentures]);

  // Extract all unique categories
  const allCategories = useMemo(() => {
    const cats = new Set(allVentures.map(v => v.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [allVentures]);

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
    setSelectedCategory("all");
    setActiveLayer("all");
  };

  // Advanced filtering logic
  const filteredVentures = useMemo(() => {
    return allVentures.filter(venture => {
      // Layer filter
      const matchesLayer = activeLayer === "all" || venture.layer === activeLayer;
      
      // Status filter
      const matchesStatus = selectedStatus === "all" || venture.status === selectedStatus;
      
      // Category filter
      const matchesCategory = selectedCategory === "all" || venture.category === selectedCategory;
      
      // Tag filter
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => venture.tags?.includes(tag));
      
      // Search query filter (searches in title, description, tags, category, team, roadmap, funding)
      const matchesSearch = searchQuery === "" || 
        venture.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venture.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venture.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venture.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        venture.team_bios?.some(member => 
          member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.role?.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        venture.roadmap?.some(phase => 
          phase.phase?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          phase.milestones?.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()))
        ) ||
        venture.funding_history?.some(round => 
          round.round?.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchesLayer && matchesStatus && matchesCategory && matchesTags && matchesSearch;
    });
  }, [allVentures, activeLayer, selectedStatus, selectedCategory, selectedTags, searchQuery]);

  const activeFiltersCount = 
    (activeLayer !== "all" ? 1 : 0) +
    (selectedStatus !== "all" ? 1 : 0) +
    (selectedCategory !== "all" ? 1 : 0) +
    selectedTags.length +
    (searchQuery ? 1 : 0);

  return (
    <main className="min-h-screen py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <span className="text-sm font-medium tracking-[0.3em] uppercase text-[#C7A763] mb-6 block">
              {t.portfolio.subtitle}
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white font-montserrat leading-tight mb-8">
              {t.portfolio.hero.title}
            </h1>
            <p className="text-slate-300 text-xl md:text-2xl leading-relaxed mb-12">
              {t.portfolio.hero.description}
            </p>
          </motion.div>
        </div>

        {/* Problem Statement - OTTO Style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <GlowCard glowColor="mixed" className="p-10 md:p-14">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white font-montserrat mb-6">
                {t.portfolio.problem.title}
              </h2>
              <div className="space-y-4 text-slate-300 text-lg leading-relaxed">
                <p dangerouslySetInnerHTML={{ __html: t.portfolio.problem.p1 }} />
                <p>{t.portfolio.problem.p2}</p>
                <ul className="space-y-2 ml-6 list-disc text-slate-400">
                  <li>{t.portfolio.problem.li1}</li>
                  <li>{t.portfolio.problem.li2}</li>
                  <li>{t.portfolio.problem.li3}</li>
                </ul>
                <p className="pt-4" dangerouslySetInnerHTML={{ __html: t.portfolio.problem.p3 }} />
              </div>
            </div>
          </GlowCard>
        </motion.div>

        {/* Portfolio Approach */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <SectionTitle
              subtitle={t.portfolio.approach.subtitle}
              title={t.portfolio.approach.title}
              accent="cyan"
            />
            <p className="text-slate-400 text-lg mt-6 max-w-2xl mx-auto">
              {t.portfolio.approach.description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {STATIC_LAYERS_CONFIG.filter(l => l.id !== 'all').map((layer, idx) => (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <button
                  onClick={() => scrollToLayer(layer.id)}
                  className="w-full text-left"
                >
                  <GlowCard 
                    glowColor={idx % 2 === 0 ? "cyan" : "gold"} 
                    className="p-6 h-full cursor-pointer"
                    hover={true}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C7A763]/20 to-[#00D4FF]/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <layer.icon className="w-6 h-6 text-[#C7A763]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {t.portfolio.filters[layer.id]}
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {allVentures.filter(v => v.layer === layer.id).length} {t.portfolio.venturesCount}
                        </p>
                      </div>
                    </div>
                  </GlowCard>
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Analytics Dashboard */}
        <PortfolioAnalyticsDashboard ventures={allVentures} />

        {/* Advanced Analytics Dashboard */}
        <AdvancedAnalyticsDashboard ventures={allVentures} />

        {/* Ventures Explorer Section */}
        <div className="mb-12">
          <SectionTitle
            subtitle={t.portfolio.explore.subtitle}
            title={t.portfolio.explore.title}
            accent="gold"
            align="left"
          />
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
                  placeholder={t.portfolio.search.placeholder}
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
                {t.portfolio.search.advancedFilters}
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
                        {t.portfolio.filters.layersTitle}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {STATIC_LAYERS_CONFIG.map((layer) => (
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
                            {t.portfolio.filters[layer.id]}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Status Filters */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#00D4FF]" />
                        {t.common.status}
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
                          {t.common.all}
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
                            {t.portfolio.status[status] || status.charAt(0).toUpperCase() + status.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Tag Filters */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[#C7A763]" />
                        {t.portfolio.filters.tagsTitle}
                        {selectedTags.length > 0 && (
                          <span className="text-xs text-[#C7A763]">
                            ({selectedTags.length} {t.portfolio.filters.tagsSelected})
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
                          {t.portfolio.resultsSummary.showing} <span className="text-[#C7A763] font-semibold">{filteredVentures.length}</span> {t.portfolio.resultsSummary.of} <span className="text-white">{allVentures.length}</span> {t.portfolio.resultsSummary.venturesFound}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={clearAllFilters}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4 mr-1.5" />
                          {t.portfolio.resultsSummary.clearFilters}
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
              <span className="text-sm text-slate-400">{t.portfolio.activeFilters.title}:</span>
              {activeLayer !== "all" && (
                <Badge 
                  variant="secondary" 
                  className="bg-[#C7A763]/20 text-[#C7A763] border border-[#C7A763]/30 hover:bg-[#C7A763]/30"
                >
                  {t.portfolio.filters[activeLayer]}
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
                  {t.portfolio.status[selectedStatus] || selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
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
                  {t.portfolio.activeFilters.search}: "{searchQuery}"
                  <button onClick={() => setSearchQuery("")} className="ml-1.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Ventures by Layer */}
        {filteredVentures.length > 0 ? (
          <>
            <div className="space-y-16">
              {STATIC_LAYERS_CONFIG.filter(l => l.id !== 'all').map((layer) => {
                const layerVentures = filteredVentures.filter(v => v.layer === layer.id);
                if (layerVentures.length === 0) return null;

                return (
                  <div key={layer.id} ref={sectionRefs[layer.id]} className="scroll-mt-24">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      className="mb-8"
                    >
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C7A763]/20 to-[#00D4FF]/20 border border-white/10 flex items-center justify-center">
                          <layer.icon className="w-5 h-5 text-[#C7A763]" />
                        </div>
                        <h2 className="text-3xl font-bold text-white font-montserrat">
                          {t.portfolio.filters[layer.id]}
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                      </div>
                      <p className="text-slate-400 ml-14">
                        {layerVentures.length} {t.portfolio.venturesCount}
                      </p>
                    </motion.div>

                    <motion.div 
                      className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                      layout
                    >
                      <AnimatePresence mode="popLayout">
                        {layerVentures.map((venture, index) => (
                          <div key={venture.id || venture.name} className="relative group">
                            <Link to={venture.id ? createPageUrl(`VenturePublicPage?ventureId=${venture.id}`) : '#'}>
                              <VentureCard venture={venture} index={index} />
                            </Link>
                            <button
                              onClick={() => setQuickViewVenture(venture)}
                              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                              title={t.portfolio.quickView}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                );
              })}
            </div>

            {/* Quick View Modal */}
            <AnimatePresence>
              {quickViewVenture && (
                <VentureQuickView 
                  venture={quickViewVenture} 
                  onClose={() => setQuickViewVenture(null)} 
                />
              )}
            </AnimatePresence>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{t.portfolio.noVentures.title}</h3>
            <p className="text-slate-400 mb-6">
              {t.portfolio.noVentures.description}
            </p>
            <Button
              onClick={clearAllFilters}
              variant="outline"
              className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
            >
              {t.portfolio.noVentures.clearFilters}
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
            { value: "15+", labelKey: "activeVentures" },
            { value: "6", labelKey: "strategicLayers" },
            { value: "50+", labelKey: "professionals" },
            { value: "R$2M+", labelKey: "capitalDeployed" }
          ].map((stat, index) => (
            <div key={index} className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-3xl md:text-4xl font-bold text-[#C7A763] font-montserrat mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-slate-400">{t.portfolio.stats[stat.labelKey]}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}