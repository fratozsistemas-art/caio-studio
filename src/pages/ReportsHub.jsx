import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { FileText, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionTitle from "@/components/ui/SectionTitle";
import GlowCard from "@/components/ui/GlowCard";
import DynamicReportGenerator from "@/components/reports/DynamicReportGenerator";
import AdvancedReports from "@/components/reports/AdvancedReports";
import { createPageUrl } from "@/utils";

export default function ReportsHub() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#C7A763]/20 to-[#00D4FF]/20 border border-white/10 flex items-center justify-center">
              <FileText className="w-7 h-7 text-[#C7A763]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white font-montserrat">Hub de Relatórios</h1>
              <p className="text-slate-400 text-sm">Análises, Filtros e Exportações</p>
            </div>
          </div>
          <GlowCard glowColor="gold" className="px-4 py-3">
            <div className="flex items-center gap-2">
              <div>
                <div className="text-xs text-slate-400">Admin</div>
                <div className="text-sm font-semibold text-white">{user?.full_name}</div>
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dynamic" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="dynamic">Relatórios Dinâmicos</TabsTrigger>
            <TabsTrigger value="advanced">Relatórios Avançados</TabsTrigger>
          </TabsList>

          <TabsContent value="dynamic">
            <DynamicReportGenerator />
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedReports />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}