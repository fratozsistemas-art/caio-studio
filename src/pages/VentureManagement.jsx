import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Plus, TrendingUp, Users, Target } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionTitle from "@/components/ui/SectionTitle";
import { createPageUrl } from "@/utils";
import VentureList from "@/components/ventures/VentureList";
import VentureForm from "@/components/ventures/VentureForm";
import VentureWizard from "@/components/ventures/VentureWizard";
import KPIManager from "@/components/ventures/KPIManager";
import TalentManager from "@/components/ventures/TalentManager";
import TalentAnalysis from "@/components/ventures/TalentAnalysis";
import SkillRecommendations from "@/components/ventures/SkillRecommendations";
import TalentPerformance from "@/components/ventures/TalentPerformance";
import VentureAnalytics from "@/components/ventures/VentureAnalytics";
import FinancialModeling from "@/components/ventures/FinancialModeling";
import FinancialScenarios from "@/components/ventures/FinancialScenarios";
import AIFinancialForecasting from "@/components/ventures/AIFinancialForecasting";
import NotificationsAlerts from "@/components/ventures/NotificationsAlerts";
import PortfolioManager from "@/components/ventures/PortfolioManager";
import SquadManager from "@/components/collaboration/SquadManager";
import CollaborationChannels from "@/components/collaboration/CollaborationChannels";
import InternalMarketplace from "@/components/marketplace/InternalMarketplace";
import TaskManager from "@/components/collaboration/TaskManager";
import CommentSection from "@/components/collaboration/CommentSection";
import ActivityFeed from "@/components/collaboration/ActivityFeed";
import VenturePortfolioDashboard from "@/components/ventures/VenturePortfolioDashboard";

export default function VentureManagement() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVentureForm, setShowVentureForm] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedVenture, setSelectedVenture] = useState(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          window.location.href = createPageUrl('Login') + '?next=' + encodeURIComponent(window.location.pathname);
          return;
        }
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.role !== 'admin') {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch (error) {
        window.location.href = createPageUrl('Login') + '?next=' + encodeURIComponent(window.location.pathname);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const { data: venturesResponse, refetch } = useQuery({
    queryKey: ['ventures'],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Venture',
        operation: 'list',
        sort: '-created_date'
      });
      return response.data;
    },
    enabled: !!user
  });

  const ventures = venturesResponse?.data || [];

  const { data: financialsResponse } = useQuery({
    queryKey: ['allFinancials'],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'FinancialRecord',
        operation: 'list'
      });
      return response.data;
    },
    enabled: !!user
  });

  const { data: kpisResponse } = useQuery({
    queryKey: ['allKPIs'],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureKPI',
        operation: 'list'
      });
      return response.data;
    },
    enabled: !!user
  });

  const { data: talentsResponse } = useQuery({
    queryKey: ['allTalents'],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTalent',
        operation: 'list'
      });
      return response.data;
    },
    enabled: !!user
  });

  const financials = financialsResponse?.data || [];
  const kpis = kpisResponse?.data || [];
  const talents = talentsResponse?.data || [];

  const { data: portfoliosResponse } = useQuery({
    queryKey: ['venturePortfolios'],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VenturePortfolio',
        operation: 'list'
      });
      return response.data;
    },
    enabled: !!user
  });

  const { data: squadsResponse } = useQuery({
    queryKey: ['ventureSquads'],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureSquad',
        operation: 'list'
      });
      return response.data;
    },
    enabled: !!user
  });

  const portfolios = portfoliosResponse?.data || [];
  const squadsData = squadsResponse?.data || [];

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
        <div className="flex items-center justify-between mb-8">
          <SectionTitle
            subtitle="Admin"
            title="Gestão de Ventures"
            accent="cyan"
            align="left"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => setShowWizard(true)}
              className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F] font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Venture (Wizard)
            </Button>
            <Button
              onClick={() => {
                setSelectedVenture(null);
                setShowVentureForm(true);
              }}
              variant="outline"
              className="border-white/10 text-white"
            >
              Formulário Rápido
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-gradient-to-br from-[#00D4FF]/10 to-transparent border border-[#00D4FF]/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
              <span className="text-sm text-slate-400">Total Ventures</span>
            </div>
            <div className="text-3xl font-bold text-white">{ventures.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-gradient-to-br from-[#C7A763]/10 to-transparent border border-[#C7A763]/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-[#C7A763]" />
              <span className="text-sm text-slate-400">Ativas</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {ventures.filter(v => v.status === 'active').length}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-slate-400">Em Scaling</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {ventures.filter(v => v.status === 'scaling').length}
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ventures" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 flex-wrap h-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="ventures">Ventures</TabsTrigger>
            <TabsTrigger value="tasks">Tarefas</TabsTrigger>
            <TabsTrigger value="activity">Atividades</TabsTrigger>
            <TabsTrigger value="portfolios">Portfolios</TabsTrigger>
            <TabsTrigger value="collaboration">Colaboração</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="kpis">KPIs & Metas</TabsTrigger>
            <TabsTrigger value="talents">Talentos & Skills</TabsTrigger>
            <TabsTrigger value="financial">Modelagem Financeira</TabsTrigger>
            <TabsTrigger value="scenarios">Cenários Avançados</TabsTrigger>
            <TabsTrigger value="alerts">Notificações</TabsTrigger>
            <TabsTrigger value="analytics">Análise com IA</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <VenturePortfolioDashboard ventures={ventures} />
          </TabsContent>

          <TabsContent value="ventures">
            <VentureList
              ventures={ventures}
              onEdit={(venture) => {
                setSelectedVenture(venture);
                setShowVentureForm(true);
              }}
              onRefresh={refetch}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskManager ventureId={null} ventures={ventures} />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityFeed ventureId={null} limit={50} />
          </TabsContent>

          <TabsContent value="portfolios">
            <PortfolioManager 
              ventures={ventures}
              financials={financials}
              kpis={kpis}
            />
          </TabsContent>

          <TabsContent value="collaboration" className="space-y-6">
            <SquadManager 
              ventures={ventures}
              talents={talents}
            />
            <CollaborationChannels 
              portfolios={portfolios}
              squads={squadsData}
            />
          </TabsContent>

          <TabsContent value="marketplace">
            <InternalMarketplace 
              ventures={ventures}
              talents={talents}
            />
          </TabsContent>

          <TabsContent value="kpis">
            <KPIManager ventures={ventures} />
          </TabsContent>

          <TabsContent value="talents">
            <Tabs defaultValue="management" className="space-y-6">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="management">Gerenciar</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="recommendations">Recomendações IA</TabsTrigger>
                <TabsTrigger value="analysis">Análise de Gaps</TabsTrigger>
              </TabsList>

              <TabsContent value="management">
                <TalentManager ventures={ventures} />
              </TabsContent>

              <TabsContent value="performance">
                <TalentPerformance talents={talents} />
              </TabsContent>

              <TabsContent value="recommendations">
                <SkillRecommendations ventures={ventures} talents={talents} />
              </TabsContent>

              <TabsContent value="analysis">
                <TalentAnalysis talents={talents} ventures={ventures} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="financial">
            <Tabs defaultValue="modeling" className="space-y-6">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="modeling">Modelagem</TabsTrigger>
                <TabsTrigger value="forecasting">Previsão IA</TabsTrigger>
              </TabsList>

              <TabsContent value="modeling">
                <FinancialModeling ventures={ventures} />
              </TabsContent>

              <TabsContent value="forecasting">
                <AIFinancialForecasting ventures={ventures} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="scenarios">
            <FinancialScenarios ventureId={ventures[0]?.id} />
          </TabsContent>

          <TabsContent value="alerts">
            <NotificationsAlerts ventureId={ventures[0]?.id} />
          </TabsContent>

          <TabsContent value="analytics">
            <VentureAnalytics ventures={ventures} />
          </TabsContent>
        </Tabs>

        {/* Venture Wizard */}
        {showWizard && (
          <VentureWizard
            onClose={() => setShowWizard(false)}
            onSuccess={() => {
              setShowWizard(false);
              refetch();
            }}
          />
        )}

        {/* Venture Form Modal */}
        {showVentureForm && (
          <VentureForm
            venture={selectedVenture}
            onClose={() => {
              setShowVentureForm(false);
              setSelectedVenture(null);
            }}
            onSuccess={() => {
              setShowVentureForm(false);
              setSelectedVenture(null);
              refetch();
            }}
          />
        )}
      </div>
    </main>
  );
}