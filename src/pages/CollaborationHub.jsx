import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { MessageSquare, FileText, Users, Brain, Target, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SectionTitle from "@/components/ui/SectionTitle";
import GlowCard from "@/components/ui/GlowCard";
import TaskManager from "@/components/collaboration/TaskManager";
import VentureChat from "@/components/collaboration/VentureChat";
import DocumentHub from "@/components/collaboration/DocumentHub";
import AICollaborationAssistant from "@/components/collaboration/AICollaborationAssistant";
import { createPageUrl } from "@/utils";

export default function CollaborationHub() {
  const [user, setUser] = useState(null);
  const [selectedVentureId, setSelectedVentureId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          window.location.href = createPageUrl('Login') + '?next=' + encodeURIComponent(window.location.pathname);
          return;
        }
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        window.location.href = createPageUrl('Login') + '?next=' + encodeURIComponent(window.location.pathname);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const { data: venturesResponse } = useQuery({
    queryKey: ['ventures'],
    queryFn: async () => {
      if (user?.role === 'admin') {
        const response = await base44.functions.invoke('secureEntityQuery', {
          entity_name: 'Venture',
          operation: 'list',
          sort: '-created_date'
        });
        return response.data;
      } else {
        return { data: await base44.entities.Venture.list() };
      }
    },
    enabled: !!user
  });

  const ventures = venturesResponse?.data || [];
  const venture = ventures.find(v => v.id === selectedVentureId);

  const { data: myTasksResponse } = useQuery({
    queryKey: ['myTasks', user?.email],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTask',
        operation: 'filter',
        query: { assigned_to: user.email },
        sort: '-created_date'
      });
      return response.data;
    },
    enabled: !!user
  });

  const myTasks = myTasksResponse?.data || [];
  const pendingTasks = myTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-24 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <SectionTitle
            subtitle="Trabalho em equipe"
            title="Collaboration Hub"
            accent="cyan"
            align="left"
          />
          <div className="text-right">
            <div className="text-sm text-slate-400">Bem-vindo,</div>
            <div className="text-white font-semibold">{user?.full_name}</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlowCard glowColor="cyan" className="p-4">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-[#00D4FF]" />
                <div>
                  <div className="text-xs text-slate-400">Minhas Tarefas</div>
                  <div className="text-2xl font-bold text-white">{pendingTasks.length}</div>
                </div>
              </div>
            </GlowCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlowCard glowColor="gold" className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#C7A763]" />
                <div>
                  <div className="text-xs text-slate-400">Concluídas</div>
                  <div className="text-2xl font-bold text-white">
                    {myTasks.filter(t => t.status === 'completed').length}
                  </div>
                </div>
              </div>
            </GlowCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlowCard glowColor="mixed" className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-xs text-slate-400">Ventures Ativas</div>
                  <div className="text-2xl font-bold text-white">{ventures.length}</div>
                </div>
              </div>
            </GlowCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlowCard glowColor="cyan" className="p-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-[#00D4FF]" />
                <div>
                  <div className="text-xs text-slate-400">Colaboração</div>
                  <div className="text-lg font-bold text-white">Ativa</div>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        </div>

        {/* Venture Selector */}
        <GlowCard glowColor="mixed" className="p-6">
          <div className="flex items-center gap-4">
            <Users className="w-5 h-5 text-[#C7A763]" />
            <Select value={selectedVentureId} onValueChange={setSelectedVentureId}>
              <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Selecione uma venture para colaborar" />
              </SelectTrigger>
              <SelectContent>
                {ventures.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </GlowCard>

        {selectedVentureId && venture && (
          <Tabs defaultValue="tasks" className="space-y-6">
            <TabsList className="bg-white/5 border border-white/10 flex-wrap h-auto">
              <TabsTrigger value="tasks">
                <Target className="w-4 h-4 mr-2" />
                Tarefas
              </TabsTrigger>
              <TabsTrigger value="chat">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="w-4 h-4 mr-2" />
                Documentos
              </TabsTrigger>
              <TabsTrigger value="ai">
                <Brain className="w-4 h-4 mr-2" />
                Assistente IA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks">
              <TaskManager 
                ventureId={selectedVentureId} 
                ventures={ventures}
                currentUser={user}
              />
            </TabsContent>

            <TabsContent value="chat">
              <VentureChat 
                venture={venture}
                currentUser={user}
              />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentHub 
                ventureId={selectedVentureId}
                ventureName={venture.name}
                currentUser={user}
              />
            </TabsContent>

            <TabsContent value="ai">
              <AICollaborationAssistant 
                venture={venture}
                ventures={ventures}
                currentUser={user}
              />
            </TabsContent>
          </Tabs>
        )}

        {!selectedVentureId && (
          <GlowCard glowColor="gold" className="p-12">
            <div className="text-center space-y-4">
              <Users className="w-16 h-16 mx-auto text-[#C7A763] opacity-30" />
              <h3 className="text-xl font-semibold text-white">Selecione uma Venture</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Escolha uma venture acima para acessar tarefas, chat, documentos e colaborar com o time
              </p>
            </div>
          </GlowCard>
        )}
      </div>
    </main>
  );
}