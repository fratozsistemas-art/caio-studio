import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Users, Filter, TrendingUp, Clock, CheckCircle, XCircle, Phone, Mail, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SectionTitle from "@/components/ui/SectionTitle";
import GlowCard from "@/components/ui/GlowCard";
import LeadCard from "@/components/leads/LeadCard";
import LeadFunnel from "@/components/leads/LeadFunnel";
import LeadDetail from "@/components/leads/LeadDetail";
import { createPageUrl } from "@/utils";

export default function LeadManagement() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          base44.auth.redirectToLogin(window.location.pathname);
          return;
        }
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.role !== 'admin') {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(window.location.pathname);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const { data: leadsResponse, isLoading: leadsLoading } = useQuery({
    queryKey: ['stakeholderLeads'],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'StakeholderLead',
        operation: 'list',
        sort: '-created_date'
      });
      return response.data;
    },
    enabled: !!user
  });

  const leads = leadsResponse?.data || [];

  const filteredLeads = leads.filter(lead => {
    const typeMatch = filterType === 'all' || lead.stakeholder_type === filterType;
    const statusMatch = filterStatus === 'all' || lead.status === filterStatus;
    return typeMatch && statusMatch;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    inProgress: leads.filter(l => l.status === 'in_progress').length,
    avgScore: leads.length > 0 ? Math.round(leads.reduce((acc, l) => acc + (l.qualification_score || 0), 0) / leads.length) : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <main className="min-h-screen py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <SectionTitle
            subtitle="PIPELINE"
            title="Lead Management"
            accent="cyan"
            align="left"
          />
          <GlowCard glowColor="gold" className="px-4 py-3">
            <div className="text-xs text-slate-400">Total Leads</div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </GlowCard>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <GlowCard glowColor="mixed" className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400">Novos</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.new}</div>
          </GlowCard>

          <GlowCard glowColor="cyan" className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-[#00D4FF]" />
              <span className="text-xs text-slate-400">Qualificados</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.qualified}</div>
          </GlowCard>

          <GlowCard glowColor="gold" className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="w-4 h-4 text-[#C7A763]" />
              <span className="text-xs text-slate-400">Contatados</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.contacted}</div>
          </GlowCard>

          <GlowCard glowColor="mixed" className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400">Em Progresso</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.inProgress}</div>
          </GlowCard>

          <GlowCard glowColor="cyan" className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[#00D4FF]" />
              <span className="text-xs text-slate-400">Score Médio</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.avgScore}</div>
          </GlowCard>
        </div>

        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="funnel">Funil</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline">
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="founder">Founders</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="partner">Partners</SelectItem>
                  <SelectItem value="investor">Investors</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="new">Novo</SelectItem>
                  <SelectItem value="qualified">Qualificado</SelectItem>
                  <SelectItem value="contacted">Contatado</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="accepted">Aceito</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Leads List */}
            {leadsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <GlowCard glowColor="mixed" className="p-12">
                <div className="text-center">
                  <Users className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                  <h3 className="text-white font-semibold mb-2">Nenhum lead encontrado</h3>
                  <p className="text-slate-400">Ajuste os filtros ou aguarde novos leads</p>
                </div>
              </GlowCard>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLeads.map((lead, i) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <LeadCard lead={lead} onClick={() => setSelectedLead(lead)} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="funnel">
            <LeadFunnel leads={leads} />
          </TabsContent>
        </Tabs>

        {/* Lead Detail Modal */}
        {selectedLead && (
          <LeadDetail
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
          />
        )}
      </div>
    </main>
  );
}