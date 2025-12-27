import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import GlowCard from "@/components/ui/GlowCard";
import SectionTitle from "@/components/ui/SectionTitle";
import AddTalentDialog from "./AddTalentDialog";
import TalentDetailDialog from "./TalentDetailDialog";
import TalentKPIDashboard from "./TalentKPIDashboard";
import { Users, Search, Plus, Star, MapPin, Briefcase, Linkedin, FileText, Mail, Phone, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const statusConfig = {
  new: { label: "Novo", color: "bg-blue-400/20 text-blue-400" },
  screening: { label: "Triagem", color: "bg-yellow-400/20 text-yellow-400" },
  interviewing: { label: "Entrevistando", color: "bg-purple-400/20 text-purple-400" },
  shortlisted: { label: "Pré-selecionado", color: "bg-green-400/20 text-green-400" },
  hired: { label: "Contratado", color: "bg-emerald-400/20 text-emerald-400" },
  rejected: { label: "Rejeitado", color: "bg-red-400/20 text-red-400" },
  archived: { label: "Arquivado", color: "bg-slate-400/20 text-slate-400" }
};

export default function TalentManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [seniorityFilter, setSeniorityFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState(null);

  const queryClient = useQueryClient();

  const { data: talents = [], isLoading } = useQuery({
    queryKey: ['talents'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Talent',
        operation: 'filter',
        query: {}
      });
      return (res.data?.data || []).sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
    }
  });

  const filteredTalents = talents.filter(talent => {
    const matchesSearch = 
      talent.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      talent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      talent.current_position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      talent.skills?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || talent.status === statusFilter;
    const matchesSeniority = seniorityFilter === 'all' || talent.seniority_level === seniorityFilter;
    const matchesAvailability = availabilityFilter === 'all' || talent.availability === availabilityFilter;
    
    return matchesSearch && matchesStatus && matchesSeniority && matchesAvailability;
  });

  const stats = {
    total: talents.length,
    new: talents.filter(t => t.status === 'new').length,
    interviewing: talents.filter(t => t.status === 'interviewing').length,
    shortlisted: talents.filter(t => t.status === 'shortlisted').length,
    hired: talents.filter(t => t.status === 'hired').length
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Gestão de Talentos"
        subtitle="PIPELINE & ANALYTICS"
        accent="gold"
        align="left"
      />

      <Tabs defaultValue="talents" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="talents">
              <Users className="w-4 h-4 mr-2" />
              Talentos
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-[#C7A763] hover:bg-[#A88B4A]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Talento
          </Button>
        </div>

        <TabsContent value="talents" className="space-y-6">

      {/* Stats */}
      <div className="grid md:grid-cols-5 gap-4">
        <GlowCard glowColor="cyan" className="p-4">
          <div className="text-center">
            <Users className="w-5 h-5 text-[#00D4FF] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-slate-400">Total</div>
          </div>
        </GlowCard>
        <GlowCard glowColor="gold" className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.new}</div>
            <div className="text-xs text-slate-400">Novos</div>
          </div>
        </GlowCard>
        <GlowCard glowColor="mixed" className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.interviewing}</div>
            <div className="text-xs text-slate-400">Entrevistando</div>
          </div>
        </GlowCard>
        <GlowCard glowColor="cyan" className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats.shortlisted}</div>
            <div className="text-xs text-slate-400">Pré-selecionados</div>
          </div>
        </GlowCard>
        <GlowCard glowColor="gold" className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{stats.hired}</div>
            <div className="text-xs text-slate-400">Contratados</div>
          </div>
        </GlowCard>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, email, cargo ou skills..."
            className="bg-white/5 border-white/10 text-white pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={seniorityFilter} onValueChange={setSeniorityFilter}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Nível" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Níveis</SelectItem>
            <SelectItem value="junior">Junior</SelectItem>
            <SelectItem value="mid">Mid-level</SelectItem>
            <SelectItem value="senior">Senior</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="executive">Executive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
          <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Disponibilidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="available">Disponível</SelectItem>
            <SelectItem value="open_to_opportunities">Aberto</SelectItem>
            <SelectItem value="not_available">Indisponível</SelectItem>
            <SelectItem value="passive">Passivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Talent Grid */}
      {isLoading ? (
        <div className="text-slate-400">Carregando talentos...</div>
      ) : filteredTalents.length === 0 ? (
        <GlowCard className="p-8 text-center">
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">Nenhum talento encontrado</p>
        </GlowCard>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTalents.map((talent) => (
            <GlowCard
              key={talent.id}
              glowColor="cyan"
              className="p-5 cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => setSelectedTalent(talent)}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-lg mb-1">
                      {talent.full_name}
                    </h4>
                    {talent.current_position && (
                      <p className="text-slate-400 text-sm flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {talent.current_position}
                        {talent.current_company && ` @ ${talent.current_company}`}
                      </p>
                    )}
                  </div>
                  <Badge className={statusConfig[talent.status]?.color}>
                    {statusConfig[talent.status]?.label}
                  </Badge>
                </div>

                {/* Info */}
                <div className="space-y-1.5 text-xs text-slate-400">
                  {talent.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      {talent.location}
                    </div>
                  )}
                  {talent.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3" />
                      {talent.email}
                    </div>
                  )}
                  {talent.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3" />
                      {talent.phone}
                    </div>
                  )}
                </div>

                {/* Skills */}
                {talent.skills && talent.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {talent.skills.slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full bg-white/5 text-slate-300 text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {talent.skills.length > 5 && (
                      <span className="px-2 py-0.5 text-slate-500 text-xs">
                        +{talent.skills.length - 5}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    {talent.linkedin_url && (
                      <a
                        href={talent.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#0077B5] hover:text-[#0099D5]"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {talent.cv_file_url && (
                      <a
                        href={talent.cv_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-white"
                      >
                        <FileText className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  {talent.rating > 0 && (
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < talent.rating
                              ? 'fill-[#C7A763] text-[#C7A763]'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      )}

        </TabsContent>

        <TabsContent value="analytics">
          <TalentKPIDashboard talents={talents} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddTalentDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
      {selectedTalent && (
        <TalentDetailDialog
          talent={selectedTalent}
          isOpen={!!selectedTalent}
          onClose={() => setSelectedTalent(null)}
        />
      )}
    </div>
  );
}