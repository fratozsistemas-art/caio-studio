import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Award, Search, Filter, Users, AlertCircle, TrendingUp, Target, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GlowCard from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/badge';
import AISkillsAnalyzer from './AISkillsAnalyzer';

const proficiencyLevels = {
  beginner: { label: 'Iniciante', color: 'bg-slate-500/20 text-slate-400', value: 1 },
  intermediate: { label: 'Intermediário', color: 'bg-blue-500/20 text-blue-400', value: 2 },
  advanced: { label: 'Avançado', color: 'bg-purple-500/20 text-purple-400', value: 3 },
  expert: { label: 'Expert', color: 'bg-[#C7A763]/20 text-[#C7A763]', value: 4 }
};

export default function TalentSkillMatrix() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSkillCategory, setFilterSkillCategory] = useState('all');
  const [filterSkill, setFilterSkill] = useState('all');
  const [viewMode, setViewMode] = useState('matrix'); // matrix or list

  // Fetch skills
  const { data: skills = [], isLoading: loadingSkills } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Skill',
        operation: 'filter',
        query: { is_active: true },
        sort: 'name'
      });
      return res.data?.data || [];
    }
  });

  // Fetch talents
  const { data: talents = [], isLoading: loadingTalents } = useQuery({
    queryKey: ['talents'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Talent',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  // Process data
  const { filteredSkills, filteredTalents, skillGaps, experts, matrix } = useMemo(() => {
    // Filter skills
    let filtered = skills.filter(skill => {
      const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterSkillCategory === 'all' || skill.category === filterSkillCategory;
      return matchesSearch && matchesCategory;
    });

    if (filterSkill !== 'all') {
      filtered = filtered.filter(s => s.id === filterSkill);
    }

    // Build matrix
    const matrixData = [];
    const gaps = [];
    const expertsList = [];

    filtered.forEach(skill => {
      const talentsWithSkill = talents.filter(t => 
        t.skills?.some(s => 
          typeof s === 'string' 
            ? s.toLowerCase() === skill.name.toLowerCase()
            : s.name?.toLowerCase() === skill.name.toLowerCase()
        )
      );

      const experts = talentsWithSkill.filter(t => {
        const skillData = Array.isArray(t.skills) 
          ? t.skills.find(s => 
              typeof s === 'string' 
                ? s.toLowerCase() === skill.name.toLowerCase()
                : s.name?.toLowerCase() === skill.name.toLowerCase()
            )
          : null;
        return skillData?.proficiency === 'expert' || skillData?.proficiency === 'advanced';
      });

      matrixData.push({
        skill,
        talentCount: talentsWithSkill.length,
        talents: talentsWithSkill,
        expertCount: experts.length
      });

      // Identify gaps (skills with no or few talents)
      if (talentsWithSkill.length === 0) {
        gaps.push({ skill, count: 0, severity: 'critical' });
      } else if (talentsWithSkill.length < 2) {
        gaps.push({ skill, count: talentsWithSkill.length, severity: 'high' });
      }

      // Identify experts
      experts.forEach(talent => {
        expertsList.push({ talent, skill, proficiency: 'expert' });
      });
    });

    // Filter talents by search
    const filteredTal = talents.filter(t => 
      t.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
      filteredSkills: filtered,
      filteredTalents: filteredTal,
      skillGaps: gaps,
      experts: expertsList,
      matrix: matrixData
    };
  }, [skills, talents, searchTerm, filterSkillCategory, filterSkill]);

  const getTalentProficiency = (talent, skillName) => {
    if (!talent.skills || !Array.isArray(talent.skills)) return null;
    
    const skillData = talent.skills.find(s => {
      if (typeof s === 'string') return s.toLowerCase() === skillName.toLowerCase();
      return s.name?.toLowerCase() === skillName.toLowerCase();
    });

    if (!skillData) return null;
    return skillData.proficiency || 'intermediate';
  };

  const skillCategories = [
    { value: 'all', label: 'Todas Categorias' },
    { value: 'technical', label: 'Técnicas' },
    { value: 'business', label: 'Negócios' },
    { value: 'soft_skills', label: 'Soft Skills' },
    { value: 'languages', label: 'Idiomas' },
    { value: 'tools', label: 'Ferramentas' },
    { value: 'frameworks', label: 'Frameworks' }
  ];

  if (loadingSkills || loadingTalents) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400">Carregando matriz de habilidades...</div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="matrix" className="space-y-6">
      <TabsList className="bg-white/5 border border-white/10">
        <TabsTrigger value="matrix">Matriz de Skills</TabsTrigger>
        <TabsTrigger value="ai-analysis">
          <Sparkles className="w-4 h-4 mr-2" />
          Análise Preditiva IA
        </TabsTrigger>
      </TabsList>

      <TabsContent value="matrix" className="space-y-6">
        {/* Header & Stats */}
        <div className="grid md:grid-cols-4 gap-4">
        <GlowCard glowColor="cyan" className="p-5">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-[#00D4FF]" />
            <div>
              <div className="text-xs text-slate-400">Total Skills</div>
              <div className="text-2xl font-bold text-white">{skills.length}</div>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="gold" className="p-5">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-[#C7A763]" />
            <div>
              <div className="text-xs text-slate-400">Talentos</div>
              <div className="text-2xl font-bold text-white">{talents.length}</div>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="mixed" className="p-5">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <div className="text-xs text-slate-400">Gaps Críticos</div>
              <div className="text-2xl font-bold text-white">{skillGaps.length}</div>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="cyan" className="p-5">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-[#C7A763]" />
            <div>
              <div className="text-xs text-slate-400">Experts</div>
              <div className="text-2xl font-bold text-white">{experts.length}</div>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Filters */}
      <GlowCard className="p-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar skills ou talentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>

          <Select value={filterSkillCategory} onValueChange={setFilterSkillCategory}>
            <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {skillCategories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSkill} onValueChange={setFilterSkill}>
            <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
              <Target className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Skill específica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Skills</SelectItem>
              {skills.map(skill => (
                <SelectItem key={skill.id} value={skill.id}>{skill.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="matrix">Matriz</SelectItem>
              <SelectItem value="list">Lista</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlowCard>

      {/* Skill Gaps Alert */}
      {skillGaps.length > 0 && (
        <GlowCard glowColor="mixed" className="p-6 bg-red-500/5 border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-2">Gaps de Habilidades Identificados</h4>
              <div className="flex flex-wrap gap-2">
                {skillGaps.slice(0, 10).map(gap => (
                  <Badge 
                    key={gap.skill.id}
                    className={`${gap.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}
                  >
                    {gap.skill.name} {gap.count > 0 && `(${gap.count})`}
                  </Badge>
                ))}
                {skillGaps.length > 10 && (
                  <span className="text-xs text-slate-400 self-center">+{skillGaps.length - 10} mais</span>
                )}
              </div>
            </div>
          </div>
        </GlowCard>
      )}

      {/* Matrix View */}
      {viewMode === 'matrix' && (
        <GlowCard className="p-6">
          <h3 className="text-white font-semibold mb-4">Matriz de Habilidades</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 text-sm font-semibold text-white sticky left-0 bg-[#0a1628] z-10">
                    Skill
                  </th>
                  {filteredTalents.slice(0, 15).map(talent => (
                    <th key={talent.id} className="p-3 text-xs text-slate-400 min-w-[120px]">
                      <div className="transform -rotate-45 origin-left whitespace-nowrap">
                        {talent.full_name}
                      </div>
                    </th>
                  ))}
                  <th className="text-right p-3 text-sm text-slate-400">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredSkills.map(skill => (
                  <tr key={skill.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3 text-sm text-white sticky left-0 bg-[#0a1628] z-10">
                      {skill.name}
                      <div className="text-xs text-slate-500">{skill.category}</div>
                    </td>
                    {filteredTalents.slice(0, 15).map(talent => {
                      const proficiency = getTalentProficiency(talent, skill.name);
                      const config = proficiency ? proficiencyLevels[proficiency] : null;
                      
                      return (
                        <td key={talent.id} className="p-3 text-center">
                          {config && (
                            <div 
                              className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center mx-auto`}
                              title={`${talent.full_name} - ${config.label}`}
                            >
                              <span className="text-xs font-bold">{config.value}</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-right text-sm font-semibold text-white">
                      {matrix.find(m => m.skill.id === skill.id)?.talentCount || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredTalents.length > 15 && (
            <div className="text-xs text-slate-400 mt-4 text-center">
              Mostrando 15 de {filteredTalents.length} talentos. Use os filtros para refinar a visualização.
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="text-xs text-slate-400 mb-2">Legenda de Proficiência:</div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(proficiencyLevels).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded ${config.color} flex items-center justify-center text-xs font-bold`}>
                    {config.value}
                  </div>
                  <span className="text-xs text-slate-400">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </GlowCard>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {matrix.map(item => (
            <motion.div key={item.skill.id} layout>
              <GlowCard className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{item.skill.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{item.skill.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{item.talentCount}</div>
                    <div className="text-xs text-slate-400">talentos</div>
                  </div>
                </div>

                {item.talents.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.talents.map(talent => {
                      const proficiency = getTalentProficiency(talent, item.skill.name);
                      const config = proficiency ? proficiencyLevels[proficiency] : proficiencyLevels.intermediate;
                      
                      return (
                        <Badge key={talent.id} className={config.color}>
                          {talent.full_name} • {config.label}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-3 text-red-400 text-sm bg-red-500/5 rounded-lg">
                    ⚠️ Nenhum talento com esta skill
                  </div>
                )}
              </GlowCard>
            </motion.div>
          ))}
        </div>
      )}

      {filteredSkills.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-30" />
          <p className="text-slate-400">Nenhuma skill encontrada com os filtros aplicados</p>
        </div>
      )}
      </TabsContent>

      <TabsContent value="ai-analysis">
        <AISkillsAnalyzer />
      </TabsContent>
    </Tabs>
  );
}