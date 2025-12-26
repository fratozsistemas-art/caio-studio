import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Users, DollarSign, Calendar, Target, Flame, Globe, Linkedin, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import GlowCard from "@/components/ui/GlowCard";
import VentureMetricsOverview from "@/components/ventures/VentureMetricsOverview";
import VentureOKRManager from "@/components/ventures/VentureOKRManager";
import VentureTalentAllocation from "@/components/ventures/VentureTalentAllocation";

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

        {/* Public Info Card */}
        {!isAdmin && (
          <GlowCard glowColor="mixed" className="p-8">
            <div className="text-center space-y-4">
              <div className="text-lg text-white">
                Esta é uma página pública de venture. 
              </div>
              <div className="text-slate-400">
                Para acessar métricas detalhadas, KPIs e informações financeiras, 
                é necessário ter permissões de administrador.
              </div>
              {venture.category && (
                <div className="pt-4 border-t border-white/10">
                  <span className="text-sm text-slate-500">Categoria: </span>
                  <span className="text-white">{venture.category}</span>
                </div>
              )}
            </div>
          </GlowCard>
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
      </div>
    </div>
  );
}