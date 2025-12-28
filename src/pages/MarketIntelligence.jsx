import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from 'framer-motion';
import { Search, TrendingUp, Building2, Plus, BarChart3, FileText, Bell, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlowCard from "@/components/ui/GlowCard";
import SectionTitle from "@/components/ui/SectionTitle";
import { toast } from 'sonner';
import CompanyIntelligenceView from "@/components/market/CompanyIntelligenceView";
import CVMCompanyBrowser from "@/components/market/CVMCompanyBrowser";
import ReportManager from "@/components/market/ReportManager";

export default function MarketIntelligence() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companyProfiles'],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'CompanyProfile',
        operation: 'list'
      });
      return response.data?.data || [];
    }
  });

  const addCompanyMutation = useMutation({
    mutationFn: async (companyData) => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'CompanyProfile',
        operation: 'create',
        data: companyData
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companyProfiles']);
      toast.success('Empresa adicionada com sucesso');
    }
  });

  const filteredCompanies = companies?.filter(c =>
    c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnpj?.includes(searchTerm) ||
    c.stock_symbol?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <main className="min-h-screen py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#C7A763]/20 to-[#00D4FF]/20 border border-white/10 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-[#C7A763]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white font-montserrat">Market Intelligence</h1>
              <p className="text-slate-400 text-sm">Inteligência de Mercado e Monitoramento</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <GlowCard glowColor="cyan" className="p-5">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-[#00D4FF]" />
              <div>
                <div className="text-xs text-slate-400">Empresas Monitoradas</div>
                <div className="text-2xl font-bold text-white">{companies?.length || 0}</div>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="gold" className="p-5">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-[#C7A763]" />
              <div>
                <div className="text-xs text-slate-400">Ativas</div>
                <div className="text-2xl font-bold text-white">
                  {companies?.filter(c => c.monitoring_enabled)?.length || 0}
                </div>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="mixed" className="p-5">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-xs text-slate-400">Relatórios Agendados</div>
                <div className="text-2xl font-bold text-white">0</div>
              </div>
            </div>
          </GlowCard>
        </div>

        <Tabs defaultValue="companies" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="companies">
              <Building2 className="w-4 h-4 mr-2" />
              Empresas
            </TabsTrigger>
            <TabsTrigger value="cvm">
              <Search className="w-4 h-4 mr-2" />
              Buscar CVM
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="w-4 h-4 mr-2" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="space-y-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nome, CNPJ ou símbolo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            {selectedCompany ? (
              <div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedCompany(null)}
                  className="mb-4"
                >
                  ← Voltar
                </Button>
                <CompanyIntelligenceView company={selectedCompany} />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCompanies.map((company) => (
                  <GlowCard
                    key={company.id}
                    glowColor="cyan"
                    className="p-5 cursor-pointer"
                    onClick={() => setSelectedCompany(company)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold mb-1">{company.company_name}</h3>
                        <p className="text-xs text-slate-400">{company.cnpj}</p>
                      </div>
                      {company.monitoring_enabled && (
                        <Bell className="w-4 h-4 text-[#C7A763]" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {company.stock_symbol && (
                        <span className="text-xs px-2 py-1 rounded bg-[#00D4FF]/10 text-[#00D4FF]">
                          {company.stock_symbol}
                        </span>
                      )}
                      <span className="text-xs text-slate-500">{company.sector}</span>
                    </div>
                  </GlowCard>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cvm">
            <CVMCompanyBrowser onAddCompany={addCompanyMutation.mutate} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportManager companies={companies || []} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}