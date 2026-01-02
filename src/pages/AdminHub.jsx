import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Shield, BarChart3, Users, MessageSquare, Settings, Loader2, Lock, Award, FileText, HelpCircle, TrendingUp } from 'lucide-react';
import InteractiveTour from '@/components/onboarding/InteractiveTour';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
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
import DocumentKnowledgeExtractor from "@/components/knowledge/DocumentKnowledgeExtractor";
import RoleSkillManager from "@/components/admin/RoleSkillManager";
import CodeAuditDashboard from "@/components/admin/CodeAuditDashboard";
import TalentSkillMatrix from "@/components/talent/TalentSkillMatrix";
import PerformanceTemplateManager from "@/components/talent/PerformanceTemplateManager";
import TeamPerformanceInsights from "@/components/talent/TeamPerformanceInsights";
import PerformanceReportGenerator from "@/components/talent/PerformanceReportGenerator";
import UpskillingRecommendations from "@/components/talent/UpskillingRecommendations";
import CareerProgressionPath from "@/components/talent/CareerProgressionPath";
import FileManager from "@/components/admin/FileManager";
import LinkedInProfile from "@/components/profile/LinkedInProfile";
import { createPageUrl } from "@/utils";

export default function AdminHub() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portfolioData, setPortfolioData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user needs onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      if (user && !user.onboarding_completed) {
        setShowOnboarding(true);
      }
    };
    checkOnboarding();
  }, [user]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
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
          <div className="flex gap-4">
            <LinkedInProfile />
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
          <TabsList className="bg-white/5 border border-white/10 flex-wrap h-auto" data-tour="admin-hub">
            <TabsTrigger value="dashboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="talent" data-tour="talents">
              <Users className="w-4 h-4 mr-2" />
              Talentos
            </TabsTrigger>
            <TabsTrigger value="skill-matrix" data-tour="skill-matrix">
              <Award className="w-4 h-4 mr-2" />
              Skill Matrix
            </TabsTrigger>
            <TabsTrigger value="performance" data-tour="performance">
              <Settings className="w-4 h-4 mr-2" />
              Performance
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
            <TabsTrigger value="predictive">
              <TrendingUp className="w-4 h-4 mr-2" />
              Análise Preditiva
            </TabsTrigger>
            <TabsTrigger value="roles-skills">
              <Settings className="w-4 h-4 mr-2" />
              Cargos & Skills
            </TabsTrigger>
            <TabsTrigger value="code-audit">
              <Shield className="w-4 h-4 mr-2" />
              Code Auditor
            </TabsTrigger>
            <TabsTrigger value="arquivos" data-tour="arquivos">
              <FileText className="w-4 h-4 mr-2" />
              Arquivos
            </TabsTrigger>
            <TabsTrigger value="content">
              <Settings className="w-4 h-4 mr-2" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="finances">
              <Settings className="w-4 h-4 mr-2" />
              Finanças
            </TabsTrigger>
            <TabsTrigger value="projects">
              <Settings className="w-4 h-4 mr-2" />
              Projetos
            </TabsTrigger>
            <TabsTrigger value="reports">
              <BarChart3 className="w-4 h-4 mr-2" />
              Relatórios
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

          {/* Skill Matrix Tab */}
          <TabsContent value="skill-matrix" className="space-y-6">
            <SectionTitle
              title="Matriz de Habilidades"
              subtitle="Visualização e Análise de Competências"
              accent="cyan"
              align="left"
            />
            <TalentSkillMatrix />
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <SectionTitle
              title="Performance e Desenvolvimento"
              subtitle="Gestão de Avaliações, Feedback e Insights"
              accent="gold"
              align="left"
            />
            
            <Tabs defaultValue="templates" className="space-y-4">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="insights">Insights IA</TabsTrigger>
                <TabsTrigger value="reports">Relatórios</TabsTrigger>
                <TabsTrigger value="upskilling">Upskilling</TabsTrigger>
                <TabsTrigger value="career">Progressão</TabsTrigger>
              </TabsList>

              <TabsContent value="templates">
                <PerformanceTemplateManager />
              </TabsContent>

              <TabsContent value="insights">
                <TeamPerformanceInsights />
              </TabsContent>

              <TabsContent value="reports">
                <PerformanceReportGenerator />
              </TabsContent>

              <TabsContent value="upskilling">
                <UpskillingRecommendations />
              </TabsContent>

              <TabsContent value="career">
                <CareerProgressionPath />
              </TabsContent>
            </Tabs>
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

          {/* Roles & Skills Tab */}
          <TabsContent value="roles-skills" className="space-y-6">
            <SectionTitle
              title="Cargos e Habilidades"
              subtitle="Padronização do Sistema"
              accent="gold"
              align="left"
            />
            <RoleSkillManager />
          </TabsContent>

          {/* Code Audit Tab */}
          <TabsContent value="code-audit" className="space-y-6">
            <CodeAuditDashboard />
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

          {/* Predictive Analytics Tab */}
          <TabsContent value="predictive" className="space-y-6">
            <SectionTitle
              title="Análise Preditiva"
              subtitle="IA Avançada para Sucesso e Riscos"
              accent="gold"
              align="left"
            />
            <PredictiveAnalytics ventureId="all" />
          </TabsContent>

          {/* Arquivos Tab */}
          <TabsContent value="arquivos" className="space-y-6">
            <SectionTitle
              title="Gestão de Arquivos"
              subtitle="Central de Documentos e Mídias"
              accent="cyan"
              align="left"
            />
            <FileManager />
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

            <SectionTitle
              title="Extração de Conhecimento com IA"
              subtitle="Automatize a Importação de Dados"
              accent="cyan"
              align="left"
              className="mt-12"
            />
            <DocumentKnowledgeExtractor ventureId={null} />
          </TabsContent>

          {/* Finances Tab */}
          <TabsContent value="finances" className="space-y-6">
            <SectionTitle
              title="Gestão Financeira"
              subtitle="Orçamentos e Despesas"
              accent="gold"
              align="left"
            />
            <GlowCard className="p-8 text-center">
              <Settings className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-400">Módulo financeiro em desenvolvimento</p>
            </GlowCard>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <SectionTitle
              title="Gestão de Projetos"
              subtitle="Timeline, Análise Preditiva e Relatórios"
              accent="cyan"
              align="left"
            />
            <GlowCard className="p-8 text-center">
              <Settings className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-400">Módulo de projetos em desenvolvimento</p>
            </GlowCard>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <SectionTitle
              title="Relatórios Avançados"
              subtitle="Visualizações e Analytics"
              accent="gold"
              align="left"
            />
            <GlowCard className="p-8 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-400">Módulo de relatórios em desenvolvimento</p>
            </GlowCard>
          </TabsContent>
        </Tabs>

        {/* Interactive Tour */}
        {showTour && <InteractiveTour onComplete={() => setShowTour(false)} />}
        
        {/* Onboarding Wizard */}
        {showOnboarding && <OnboardingWizard onComplete={() => setShowOnboarding(false)} />}
      </div>
    </main>
  );
}