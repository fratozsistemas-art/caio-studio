import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Plus, TrendingUp, Users, Target } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionTitle from "@/components/ui/SectionTitle";
import VentureList from "@/components/ventures/VentureList";
import VentureForm from "@/components/ventures/VentureForm";
import KPIManager from "@/components/ventures/KPIManager";
import TalentManager from "@/components/ventures/TalentManager";

export default function VentureManagement() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVentureForm, setShowVentureForm] = useState(false);
  const [selectedVenture, setSelectedVenture] = useState(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.role !== 'admin') {
          window.location.href = '/';
          return;
        }
        setUser(currentUser);
      } catch (error) {
        window.location.href = '/';
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
          <Button
            onClick={() => {
              setSelectedVenture(null);
              setShowVentureForm(true);
            }}
            className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F] font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Venture
          </Button>
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
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="ventures">Ventures</TabsTrigger>
            <TabsTrigger value="kpis">KPIs & Metas</TabsTrigger>
            <TabsTrigger value="talents">Talentos & Skills</TabsTrigger>
          </TabsList>

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

          <TabsContent value="kpis">
            <KPIManager ventures={ventures} />
          </TabsContent>

          <TabsContent value="talents">
            <TalentManager ventures={ventures} />
          </TabsContent>
        </Tabs>

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