import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Users, DollarSign, Calendar, Target, Flame, Globe, Linkedin, ExternalLink, Tag, MessageSquare, CheckSquare, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createPageUrl } from "@/utils";
import GlowCard from "@/components/ui/GlowCard";
import VentureMetricsOverview from "@/components/ventures/VentureMetricsOverview";
import VentureOKRManager from "@/components/ventures/VentureOKRManager";
import VentureTalentAllocation from "@/components/ventures/VentureTalentAllocation";
import RelatedVentures from "@/components/portfolio/RelatedVentures";
import VentureChat from "@/components/collaboration/VentureChat";
import VentureTaskBoard from "@/components/collaboration/VentureTaskBoard";
import VentureDocuments from "@/components/collaboration/VentureDocuments";

export default function VentureDetail() {
  const [searchParams] = useSearchParams();
  const ventureId = searchParams.get('id');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        // Allow public access to venture details
      }
    };
    checkAuth();
  }, []);

  const { data: venture } = useQuery({
    queryKey: ['venture', ventureId],
    queryFn: async () => {
      if (user?.role === 'admin') {
        const res = await base44.functions.invoke('secureEntityQuery', {
          entity_name: 'Venture',
          operation: 'get',
          id: ventureId
        });
        return res.data?.data;
      } else {
        const ventures = await base44.entities.Venture.list();
        return ventures.find(v => v.id === ventureId);
      }
    },
    enabled: !!ventureId
  });

  const isAdmin = user?.role === 'admin';

  const { data: financials } = useQuery({
    queryKey: ['ventureFinancials', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'FinancialRecord',
        operation: 'filter',
        query: { venture_id: ventureId }
      });
      return res.data?.data || [];
    },
    enabled: !!ventureId && isAdmin
  });

  const { data: kpis } = useQuery({
    queryKey: ['ventureKPIs', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureKPI',
        operation: 'filter',
        query: { venture_id: ventureId }
      });
      return res.data?.data || [];
    },
    enabled: !!ventureId && isAdmin
  });

  const { data: talents } = useQuery({
    queryKey: ['ventureTalents', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTalent',
        operation: 'filter',
        query: { venture_id: ventureId }
      });
      return res.data?.data || [];
    },
    enabled: !!ventureId && isAdmin
  });

  if (!venture) {
    return (
      <div className="min-h-screen bg-[#06101F] p-6 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06101F] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link to={isAdmin ? createPageUrl('VentureManagement') : createPageUrl('Portfolio')}>
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">{venture.name}</h1>
              <p className="text-slate-400 mt-1">{venture.description}</p>
              <div className="flex items-center gap-3 mt-2">
                {venture.website && (
                  <a 
                    href={venture.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-[#C7A763] hover:text-[#D4B474] transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {venture.linkedin_url && (
                  <a 
                    href={venture.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-[#0077B5] hover:text-[#0099D5] transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full bg-[#C7A763]/20 text-[#C7A763] text-sm">
              {venture.layer}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#00D4FF]/20 text-[#00D4FF] text-sm">
              {venture.status}
            </span>
          </div>
        </div>

        {/* Quick Stats - Only for Admin */}
        {isAdmin && (
        <div className="grid md:grid-cols-4 gap-4">
          <GlowCard glowColor="gold" className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-[#C7A763]" />
              <div>
                <div className="text-xs text-slate-400">Receita Total</div>
                <div className="text-xl font-bold text-white">
                  R$ {(financials?.reduce((sum, f) => sum + (f.revenue || 0), 0) || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="cyan" className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#00D4FF]" />
              <div>
                <div className="text-xs text-slate-400">Time</div>
                <div className="text-xl font-bold text-white">
                  {talents?.length || 0} talentos
                </div>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="mixed" className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-xs text-slate-400">KPIs</div>
                <div className="text-xl font-bold text-white">
                  {kpis?.length || 0} ativos
                </div>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="gold" className="p-4">
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-orange-400" />
              <div>
                <div className="text-xs text-slate-400">Burn Rate</div>
                <div className="text-xl font-bold text-white">
                  R$ {(financials?.[0]?.expenses || 0).toLocaleString()}/mês
                </div>
              </div>
            </div>
          </GlowCard>
        </div>
        )}

        {/* Public Info Card with Extended Details */}
        {!isAdmin && (
          <div className="space-y-6">
            <GlowCard glowColor="mixed" className="p-8">
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="text-lg text-white">
                    {venture.name} - {venture.layer}
                  </div>
                  <div className="text-slate-400">
                    {venture.description}
                  </div>
                </div>

                {/* Extended Public Information */}
                <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-white/10">
                  {venture.category && (
                    <div>
                      <span className="text-sm text-slate-500 block mb-1">Categoria</span>
                      <span className="text-white font-medium">{venture.category}</span>
                    </div>
                  )}
                  
                  {venture.founded_date && (
                    <div>
                      <span className="text-sm text-slate-500 block mb-1">Fundada em</span>
                      <span className="text-white font-medium">
                        {new Date(venture.founded_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  
                  {venture.team_size && (
                    <div>
                      <span className="text-sm text-slate-500 block mb-1">Tamanho do Time</span>
                      <span className="text-white font-medium">{venture.team_size} pessoas</span>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm text-slate-500 block mb-1">Status</span>
                    <span className="text-white font-medium capitalize">{venture.status}</span>
                  </div>
                </div>

                {/* Tags */}
                {venture.tags && venture.tags.length > 0 && (
                  <div className="pt-6 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500">Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {venture.tags.map((tag, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1 rounded-full bg-white/5 text-slate-300 text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </GlowCard>

            {/* Related Ventures for Public */}
            <RelatedVentures currentVenture={venture} />
          </div>
        )}

        {/* Metrics Overview - Admin Only */}
        {isAdmin && <VentureMetricsOverview 
          venture={venture}
          financials={financials || []}
          kpis={kpis || []}
        />}

        {/* Talent Allocation - Admin Only */}
        {isAdmin && <VentureTalentAllocation
          ventureId={ventureId}
          talents={talents || []}
        />}

        {/* OKR Manager - Admin Only */}
        {isAdmin && <VentureOKRManager ventureId={ventureId} />}

        {/* Collaboration Section - Admin Only */}
        {isAdmin && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-6 font-montserrat">Colaboração</h2>
            <Tabs defaultValue="chat" className="space-y-6">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="chat">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="tasks">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Tarefas
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <FileText className="w-4 h-4 mr-2" />
                  Documentos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat">
                <VentureChat ventureId={ventureId} ventureName={venture.name} />
              </TabsContent>

              <TabsContent value="tasks">
                <VentureTaskBoard ventureId={ventureId} ventureName={venture.name} />
              </TabsContent>

              <TabsContent value="documents">
                <VentureDocuments ventureId={ventureId} ventureName={venture.name} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Related Ventures for Admin */}
        {isAdmin && <RelatedVentures currentVenture={venture} />}
      </div>
    </div>
  );
}