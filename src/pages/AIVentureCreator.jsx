import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Sparkles, TrendingUp, DollarSign, Target, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import SectionTitle from "@/components/ui/SectionTitle";
import BusinessPlanGenerator from "@/components/ai/BusinessPlanGenerator";
import MarketAnalysisAI from "@/components/ai/MarketAnalysisAI";
import FinancialProjectionAI from "@/components/ai/FinancialProjectionAI";
import VentureRecommendations from "@/components/ai/VentureRecommendations";
import PersonalizedSWOT from "@/components/ai/PersonalizedSWOT";
import RiskAssessment from "@/components/ai/RiskAssessment";
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from "@/utils";

export default function AIVentureCreator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ventureData, setVentureData] = useState(null);
  const [selectedVenture, setSelectedVenture] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          base44.auth.redirectToLogin(window.location.pathname);
          return;
        }
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(window.location.pathname);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const { data: ventures } = useQuery({
    queryKey: ['ventures'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Venture',
        operation: 'list'
      });
      return res.data?.data || [];
    },
    enabled: !!user
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <SectionTitle
          subtitle="IA PARA VENTURES"
          title="Criação Inteligente de Ventures"
          accent="cyan"
          align="left"
          className="mb-8"
        />

        <Tabs defaultValue="recommendations" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 flex-wrap">
            <TabsTrigger value="recommendations">
              <Sparkles className="w-4 h-4 mr-2" />
              Recomendações
            </TabsTrigger>
            <TabsTrigger value="business-plan">
              <Sparkles className="w-4 h-4 mr-2" />
              Plano de Negócios
            </TabsTrigger>
            <TabsTrigger value="market-analysis">
              <TrendingUp className="w-4 h-4 mr-2" />
              Análise de Mercado
            </TabsTrigger>
            <TabsTrigger value="financials">
              <DollarSign className="w-4 h-4 mr-2" />
              Projeções Financeiras
            </TabsTrigger>
            <TabsTrigger value="swot">
              <Target className="w-4 h-4 mr-2" />
              SWOT Personalizado
            </TabsTrigger>
            <TabsTrigger value="risk">
              <Shield className="w-4 h-4 mr-2" />
              Avaliação de Risco
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations">
            <VentureRecommendations userEmail={user?.email} />
          </TabsContent>

          <TabsContent value="business-plan">
            <BusinessPlanGenerator
              onGenerated={(data) => {
                setVentureData(prev => ({ ...prev, businessPlan: data }));
              }}
            />
          </TabsContent>

          <TabsContent value="market-analysis">
            <MarketAnalysisAI
              ventureName={ventureData?.businessPlan?.venture_name}
              industry={ventureData?.businessPlan?.industry}
            />
          </TabsContent>

          <TabsContent value="financials">
            <FinancialProjectionAI ventureData={ventureData} />
          </TabsContent>

          <TabsContent value="swot" className="space-y-4">
            {ventures && ventures.length > 0 && (
              <div className="mb-4">
                <Label className="text-white/70 mb-2 block">Selecione uma Venture para Análise</Label>
                <Select
                  value={selectedVenture?.id || ''}
                  onValueChange={(value) => {
                    const venture = ventures.find(v => v.id === value);
                    setSelectedVenture(venture);
                  }}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Escolha uma venture..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ventures.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} ({v.layer})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <PersonalizedSWOT venture={selectedVenture} />
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            {ventures && ventures.length > 0 && (
              <div className="mb-4">
                <Label className="text-white/70 mb-2 block">Selecione uma Venture para Avaliação</Label>
                <Select
                  value={selectedVenture?.id || ''}
                  onValueChange={(value) => {
                    const venture = ventures.find(v => v.id === value);
                    setSelectedVenture(venture);
                  }}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Escolha uma venture..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ventures.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} ({v.layer})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <RiskAssessment venture={selectedVenture} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}