import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionTitle from "@/components/ui/SectionTitle";
import BusinessPlanGenerator from "@/components/ai/BusinessPlanGenerator";
import MarketAnalysisAI from "@/components/ai/MarketAnalysisAI";
import FinancialProjectionAI from "@/components/ai/FinancialProjectionAI";
import { createPageUrl } from "@/utils";

export default function AIVentureCreator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ventureData, setVentureData] = useState(null);

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

        <Tabs defaultValue="business-plan" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
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
          </TabsList>

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
        </Tabs>
      </div>
    </main>
  );
}