import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Download, Settings, TrendingUp, DollarSign, Target, Users, FileText, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionTitle from "@/components/ui/SectionTitle";
import GlowCard from "@/components/ui/GlowCard";
import PortfolioMetrics from "@/components/dashboard/PortfolioMetrics";
import PortfolioCharts from "@/components/dashboard/PortfolioCharts";
import DashboardCustomizer from "@/components/dashboard/DashboardCustomizer";
import VentureHeatmap from "@/components/dashboard/VentureHeatmap";
import ResourceAllocation from "@/components/dashboard/ResourceAllocation";
import CustomAlertManager from "@/components/dashboard/CustomAlertManager";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function PortfolioDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dashboardConfig, setDashboardConfig] = useState({
    showFinancials: true,
    showKPIs: true,
    showTalents: true,
    showMarket: true
  });

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

  const { data: portfolioData, isLoading: dataLoading } = useQuery({
    queryKey: ['portfolioData'],
    queryFn: async () => {
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

      return {
        ventures: venturesRes.data?.data || [],
        kpis: kpisRes.data?.data || [],
        talents: talentsRes.data?.data || [],
        financials: financialsRes.data?.data || []
      };
    },
    enabled: !!user
  });

  const exportReport = async (format) => {
    setExporting(true);
    try {
      if (format === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.text('Portfolio Report', 20, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);

        // Summary
        doc.setFontSize(14);
        doc.text('Portfolio Summary', 20, 45);
        doc.setFontSize(10);
        let y = 55;
        
        const ventures = portfolioData?.ventures || [];
        doc.text(`Total Ventures: ${ventures.length}`, 20, y);
        y += 8;
        doc.text(`Active: ${ventures.filter(v => v.status === 'active').length}`, 20, y);
        y += 8;
        doc.text(`Scaling: ${ventures.filter(v => v.status === 'scaling').length}`, 20, y);

        // Ventures
        y += 15;
        doc.setFontSize(14);
        doc.text('Ventures', 20, y);
        y += 10;
        doc.setFontSize(9);

        ventures.forEach(venture => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`${venture.name} - ${venture.layer} (${venture.status})`, 20, y);
          y += 6;
        });

        doc.save('portfolio-report.pdf');
        toast.success('Relatório PDF exportado');
      } else if (format === 'csv') {
        const ventures = portfolioData?.ventures || [];
        const csvContent = [
          ['Name', 'Layer', 'Status', 'Category', 'Team Size'].join(','),
          ...ventures.map(v => [
            v.name,
            v.layer,
            v.status,
            v.category || '',
            v.team_size || ''
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'portfolio-data.csv';
        a.click();
        toast.success('Dados CSV exportados');
      }
    } catch (error) {
      toast.error('Erro ao exportar: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

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
          <SectionTitle
            subtitle="Portfolio"
            title="Dashboard Executivo"
            accent="cyan"
            align="left"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCustomizer(true)}
              variant="outline"
              className="border-white/10 text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              Customizar
            </Button>
            <Button
              onClick={() => exportReport('pdf')}
              disabled={exporting}
              variant="outline"
              className="border-white/10 text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button
              onClick={() => exportReport('csv')}
              disabled={exporting}
              className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]"
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <GlowCard glowColor="cyan" className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
              <span className="text-sm text-slate-400">Total Ventures</span>
            </div>
            <div className="text-3xl font-bold text-white">{portfolioData?.ventures?.length || 0}</div>
          </GlowCard>

          <GlowCard glowColor="gold" className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-[#C7A763]" />
              <span className="text-sm text-slate-400">Total KPIs</span>
            </div>
            <div className="text-3xl font-bold text-white">{portfolioData?.kpis?.length || 0}</div>
          </GlowCard>

          <GlowCard glowColor="mixed" className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-slate-400">Talentos</span>
            </div>
            <div className="text-3xl font-bold text-white">{portfolioData?.talents?.length || 0}</div>
          </GlowCard>

          <GlowCard glowColor="gold" className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-[#C7A763]" />
              <span className="text-sm text-slate-400">Registros Financeiros</span>
            </div>
            <div className="text-3xl font-bold text-white">{portfolioData?.financials?.length || 0}</div>
          </GlowCard>
        </div>

        {/* Dashboard Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="financials">Financeiro</TabsTrigger>
            <TabsTrigger value="insights">Insights IA</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <PortfolioMetrics data={portfolioData} config={dashboardConfig} />
          </TabsContent>

          <TabsContent value="performance">
            <PortfolioCharts data={portfolioData} />
          </TabsContent>

          <TabsContent value="financials">
            <PortfolioCharts data={portfolioData} type="financial" />
          </TabsContent>

          <TabsContent value="insights">
            <GlowCard glowColor="mixed" className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Insights Consolidados</h3>
                <p className="text-slate-400 mb-6">
                  Análises agregadas do portfolio serão geradas aqui com base em todas as ventures
                </p>
              </div>
            </GlowCard>
          </TabsContent>
        </Tabs>

        {/* Customizer Modal */}
        {showCustomizer && (
          <DashboardCustomizer
            config={dashboardConfig}
            onSave={(newConfig) => {
              setDashboardConfig(newConfig);
              setShowCustomizer(false);
              toast.success('Dashboard customizado');
            }}
            onClose={() => setShowCustomizer(false)}
          />
        )}
      </div>
    </main>
  );
}