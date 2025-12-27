import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Zap, Mail, Clock, PlayCircle, PauseCircle, Settings, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionTitle from "@/components/ui/SectionTitle";
import GlowCard from "@/components/ui/GlowCard";
import WorkflowManager from "@/components/automation/WorkflowManager";
import EmailSequenceBuilder from "@/components/automation/EmailSequenceBuilder";
import ActiveWorkflows from "@/components/automation/ActiveWorkflows";
import AutomationAnalytics from "@/components/automation/AutomationAnalytics";
import { createPageUrl } from "@/utils";

export default function LeadAutomation() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const { data: workflowsResponse } = useQuery({
    queryKey: ['leadWorkflows'],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'LeadWorkflow',
        operation: 'list',
        sort: '-created_date'
      });
      return response.data;
    },
    enabled: !!user
  });

  const { data: sequencesResponse } = useQuery({
    queryKey: ['emailSequences'],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'EmailSequence',
        operation: 'list',
        sort: '-created_date'
      });
      return response.data;
    },
    enabled: !!user
  });

  const workflows = workflowsResponse?.data || [];
  const sequences = sequencesResponse?.data || [];

  const stats = {
    activeWorkflows: workflows.filter(w => w.status === 'active').length,
    totalSequences: sequences.length,
    activeSequences: sequences.filter(s => s.is_active).length,
    completedWorkflows: workflows.filter(w => w.status === 'completed').length
  };

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
        <div className="flex items-start justify-between mb-8">
          <SectionTitle
            subtitle="AUTOMAÇÃO"
            title="Lead Nurturing & Follow-ups"
            accent="cyan"
            align="left"
          />
          <GlowCard glowColor="gold" className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#C7A763]" />
              <div>
                <div className="text-xs text-slate-400">Workflows Ativos</div>
                <div className="text-xl font-bold text-white">{stats.activeWorkflows}</div>
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <GlowCard glowColor="cyan" className="p-5">
            <div className="flex items-center gap-3">
              <PlayCircle className="w-5 h-5 text-[#00D4FF]" />
              <div>
                <div className="text-xs text-slate-400">Workflows Ativos</div>
                <div className="text-2xl font-bold text-white">{stats.activeWorkflows}</div>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="gold" className="p-5">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#C7A763]" />
              <div>
                <div className="text-xs text-slate-400">Sequências Totais</div>
                <div className="text-2xl font-bold text-white">{stats.totalSequences}</div>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="mixed" className="p-5">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-xs text-slate-400">Sequências Ativas</div>
                <div className="text-2xl font-bold text-white">{stats.activeSequences}</div>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="cyan" className="p-5">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#00D4FF]" />
              <div>
                <div className="text-xs text-slate-400">Completados</div>
                <div className="text-2xl font-bold text-white">{stats.completedWorkflows}</div>
              </div>
            </div>
          </GlowCard>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="active">
              <PlayCircle className="w-4 h-4 mr-2" />
              Workflows Ativos
            </TabsTrigger>
            <TabsTrigger value="sequences">
              <Mail className="w-4 h-4 mr-2" />
              Sequências de Email
            </TabsTrigger>
            <TabsTrigger value="manager">
              <Settings className="w-4 h-4 mr-2" />
              Gerenciar
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <Zap className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <ActiveWorkflows workflows={workflows} />
          </TabsContent>

          <TabsContent value="sequences">
            <EmailSequenceBuilder sequences={sequences} />
          </TabsContent>

          <TabsContent value="manager">
            <WorkflowManager />
          </TabsContent>

          <TabsContent value="analytics">
            <AutomationAnalytics 
              workflows={workflows}
              sequences={sequences}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}