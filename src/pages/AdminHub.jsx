import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Shield, BarChart3, Users, MessageSquare, Settings, Loader2, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionTitle from "@/components/ui/SectionTitle";
import GlowCard from "@/components/ui/GlowCard";
import PortfolioMetrics from "@/components/dashboard/PortfolioMetrics";
import PortfolioCharts from "@/components/dashboard/PortfolioCharts";
import AIInsightsDashboard from "@/components/analytics/AIInsightsDashboard";
import RoleManager from "@/components/admin/RoleManager";
import UserRoleAssignment from "@/components/admin/UserRoleAssignment";
import PermissionAuditLog from "@/components/admin/PermissionAuditLog";
import CollaborationChannels from "@/components/collaboration/CollaborationChannels";
import YouTubeSyncManager from "@/components/admin/YouTubeSyncManager";
import UserManagement from "@/components/admin/UserManagement";
import TalentManagement from "@/components/talent/TalentManagement";
import { createPageUrl } from "@/utils";

export default function AdminHub() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portfolioData, setPortfolioData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
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

  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      try {
        const [venturesRes, kpisRes, talentsRes, financialsRes] = await Promise.all([
          base44.functions.invoke('secureEntityQuery', {
            entity_name: 'Venture',
            operation: 'list'
          }),
          base44.functions.invoke('secureEntityQuery', {
            entity_name: 'VentureKPI',
            operation: 'list'
          }),
          base44.functions.invoke('secureEntityQuery', {
            entity_name: 'VentureTalent',
            operation: 'list'
          }),
          base44.functions.invoke('secureEntityQuery', {
            entity_name: 'FinancialRecord',
            operation: 'list',
            sort: '-record_date'
          })
        ]);

        setPortfolioData({
          ventures: venturesRes.data?.data || [],
          kpis: kpisRes.data?.data || [],
          talents: talentsRes.data?.data || [],
          financials: financialsRes.data?.data || []
        });
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading || dataLoading) {
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
              <Shield className="w-7 h-7 text-[#C7A763]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white font-montserrat">Admin Hub</h1>
              <p className="text-slate-400 text-sm">Dashboard, Permissões & Colaboração</p>
            </div>
          </div>
          <GlowCard glowColor="gold" className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#C7A763]" />
              <div>
                <div className="text-xs text-slate-400">Admin</div>
                <div className="text-sm font-semibold text-white">{user?.full_name}</div>
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <GlowCard glowColor="cyan" className="p-5">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-[#00D4FF]" />
              <div>
                <div className="text-xs text-slate-400">Ventures</div>
                <div className="text-2xl font-bold text-white">{portfolioData?.ventures?.length || 0}</div>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="gold" className="p-5">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#C7A763]" />
              <div>
                <div className="text-xs text-slate-400">Talentos</div>
                <div className="text-2xl font-bold text-white">{portfolioData?.talents?.length || 0}</div>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="mixed" className="p-5">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-xs text-slate-400">KPIs</div>
                <div className="text-2xl font-bold text-white">{portfolioData?.kpis?.length || 0}</div>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="cyan" className="p-5">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-[#00D4FF]" />
              <div>
                <div className="text-xs text-slate-400">Financeiros</div>
                <div className="text-2xl font-bold text-white">{portfolioData?.financials?.length || 0}</div>
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 flex-wrap h-auto">
            <TabsTrigger value="dashboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="talent">
              <Users className="w-4 h-4 mr-2" />
              Talentos
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <Shield className="w-4 h-4 mr-2" />
              Permissões
            </TabsTrigger>
            <TabsTrigger value="collaboration">
              <MessageSquare className="w-4 h-4 mr-2" />
              Colaboração
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Settings className="w-4 h-4 mr-2" />
              Insights IA
            </TabsTrigger>
            <TabsTrigger value="content">
              <Settings className="w-4 h-4 mr-2" />
              Conteúdo
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <SectionTitle
              title="Portfolio Dashboard"
              subtitle="Métricas e Performance"
              accent="cyan"
              align="left"
            />
            <PortfolioMetrics data={portfolioData} config={{ showFinancials: true, showKPIs: true, showTalents: true, showMarket: true }} />
            <PortfolioCharts data={portfolioData} />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <SectionTitle
              title="Gerenciamento de Usuários"
              subtitle="Convites, Permissões e Acessos"
              accent="gold"
              align="left"
            />
            <UserManagement />
          </TabsContent>

          {/* Talent Tab */}
          <TabsContent value="talent" className="space-y-6">
            <TalentManagement />
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <SectionTitle
              title="Gerenciamento de Permissões"
              subtitle="Roles, Atribuições e Auditoria"
              accent="gold"
              align="left"
            />
            
            <Tabs defaultValue="roles" className="space-y-4">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="roles">Roles</TabsTrigger>
                <TabsTrigger value="assignments">Atribuições</TabsTrigger>
                <TabsTrigger value="audit">Auditoria</TabsTrigger>
              </TabsList>

              <TabsContent value="roles">
                <RoleManager />
              </TabsContent>

              <TabsContent value="assignments">
                <UserRoleAssignment ventures={portfolioData?.ventures || []} />
              </TabsContent>

              <TabsContent value="audit">
                <PermissionAuditLog />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Collaboration Tab */}
          <TabsContent value="collaboration" className="space-y-6">
            <SectionTitle
              title="Hub de Colaboração"
              subtitle="Canais e Comunicação Interna"
              accent="mixed"
              align="left"
            />
            <CollaborationChannels />
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <SectionTitle
              title="Insights Inteligentes"
              subtitle="Análises Avançadas com IA"
              accent="cyan"
              align="left"
            />
            <AIInsightsDashboard
              ventures={portfolioData?.ventures || []}
              financials={portfolioData?.financials || []}
              kpis={portfolioData?.kpis || []}
              talents={portfolioData?.talents || []}
            />
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <SectionTitle
              title="Gestão de Conteúdo"
              subtitle="YouTube e Integrações"
              accent="gold"
              align="left"
            />
            <div className="grid lg:grid-cols-2 gap-6">
              <YouTubeSyncManager />
              
              <GlowCard glowColor="gold" className="p-6">
                <h3 className="text-white font-semibold mb-2">Sobre a Integração</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Os vídeos do canal @artificiallysmarter são sincronizados automaticamente e categorizados por IA.
                </p>
                <ul className="text-slate-500 text-xs space-y-2">
                  <li>• Vídeos exibidos na Home (3 mais recentes)</li>
                  <li>• Filtrados por categoria nas páginas específicas</li>
                  <li>• Sincronização sob demanda via botão acima</li>
                </ul>
              </GlowCard>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}