import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import SectionTitle from '@/components/ui/SectionTitle';
import ClickUpIntegration from '@/components/clickup/ClickUpIntegration';
import AutomationRuleManager from '@/components/clickup/AutomationRuleManager';
import TaskSyncPanel from '@/components/clickup/TaskSyncPanel';
import WebhookManager from '@/components/clickup/WebhookManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ClickUpDashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedList, setSelectedList] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.role !== 'admin') {
          base44.auth.redirectToLogin(window.location.pathname);
          return;
        }
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(window.location.pathname);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C7A763]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <SectionTitle
            subtitle="Gestão de Tarefas"
            title="ClickUp Integration"
            accent="cyan"
            align="left"
            className="mb-8"
          />

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <GlowCard glowColor="gold" className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-[#C7A763]/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-[#C7A763]" />
                </div>
                <h4 className="text-sm font-medium text-slate-400">Concluídas</h4>
              </div>
              <div className="text-2xl font-bold text-white">
                Sincronizado
              </div>
            </GlowCard>

            <GlowCard glowColor="cyan" className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#00D4FF]" />
                </div>
                <h4 className="text-sm font-medium text-slate-400">Em Progresso</h4>
              </div>
              <div className="text-2xl font-bold text-white">
                Ativo
              </div>
            </GlowCard>

            <GlowCard glowColor="mixed" className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-purple-400" />
                </div>
                <h4 className="text-sm font-medium text-slate-400">Pendentes</h4>
              </div>
              <div className="text-2xl font-bold text-white">
                Carregando
              </div>
            </GlowCard>

            <GlowCard glowColor="gold" className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <h4 className="text-sm font-medium text-slate-400">Produtividade</h4>
              </div>
              <div className="text-2xl font-bold text-white">
                Alta
              </div>
            </GlowCard>
          </div>

          <Tabs defaultValue="tasks" className="space-y-6">
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="sync">Sync</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks">
              <GlowCard glowColor="cyan" className="p-8">
                <ClickUpIntegration onListChange={setSelectedList} />
              </GlowCard>
            </TabsContent>

            <TabsContent value="automation">
              <GlowCard glowColor="gold" className="p-8">
                {selectedList ? (
                  <AutomationRuleManager selectedList={selectedList} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-400">Select a list in the Tasks tab to create automation rules</p>
                  </div>
                )}
              </GlowCard>
            </TabsContent>

            <TabsContent value="webhooks">
              <WebhookManager selectedTeam={selectedList ? 'auto' : null} selectedList={selectedList} />
            </TabsContent>

            <TabsContent value="sync">
              <GlowCard glowColor="mixed" className="p-8">
                {selectedList ? (
                  <TaskSyncPanel selectedList={selectedList} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-400">Select a list in the Tasks tab to configure sync</p>
                  </div>
                )}
              </GlowCard>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </main>
  );
}