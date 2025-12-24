import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Users, DollarSign, Calendar, Target, Flame } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import GlowCard from "@/components/ui/GlowCard";
import VentureMetricsOverview from "@/components/ventures/VentureMetricsOverview";
import VentureOKRManager from "@/components/ventures/VentureOKRManager";
import VentureTalentAllocation from "@/components/ventures/VentureTalentAllocation";

export default function VentureDetail() {
  const [searchParams] = useSearchParams();
  const ventureId = searchParams.get('id');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await base44.auth.me();
        setIsAdmin(user?.role === 'admin');
        if (!user || user.role !== 'admin') {
          window.location.href = createPageUrl('Home');
        }
      } catch {
        window.location.href = createPageUrl('Home');
      }
    };
    checkAdmin();
  }, []);

  const { data: venture } = useQuery({
    queryKey: ['venture', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Venture',
        operation: 'get',
        id: ventureId
      });
      return res.data?.data;
    },
    enabled: !!ventureId && isAdmin
  });

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('VentureManagement')}>
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">{venture.name}</h1>
              <p className="text-slate-400 mt-1">{venture.description}</p>
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

        {/* Quick Stats */}
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

        {/* Metrics Overview */}
        <VentureMetricsOverview 
          venture={venture}
          financials={financials || []}
          kpis={kpis || []}
        />

        {/* Talent Allocation */}
        <VentureTalentAllocation
          ventureId={ventureId}
          talents={talents || []}
        />

        {/* OKR Manager */}
        <VentureOKRManager ventureId={ventureId} />
      </div>
    </div>
  );
}