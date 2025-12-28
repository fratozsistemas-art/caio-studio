import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Users, Calendar, CheckSquare, Bell, TrendingUp, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionTitle from "@/components/ui/SectionTitle";
import GlowCard from "@/components/ui/GlowCard";
import LeadInteractions from "@/components/crm/LeadInteractions";
import MeetingCalendar from "@/components/crm/MeetingCalendar";
import TaskManagement from "@/components/crm/TaskManagement";
import ReminderCenter from "@/components/crm/ReminderCenter";
import InteractiveLeadFunnel from "@/components/crm/InteractiveLeadFunnel";
import { createPageUrl } from "@/utils";

export default function CRMHub() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

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

  const { data: leadsResponse } = useQuery({
    queryKey: ['stakeholderLeads'],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'StakeholderLead',
        operation: 'list',
        sort: '-created_date'
      });
      return response.data;
    },
    enabled: !!user
  });

  const { data: meetingsResponse } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Meeting',
        operation: 'list',
        sort: 'scheduled_date'
      });
      return response.data;
    },
    enabled: !!user
  });

  const { data: tasksResponse } = useQuery({
    queryKey: ['allTasks'],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTask',
        operation: 'list',
        sort: 'due_date'
      });
      return response.data;
    },
    enabled: !!user
  });

  const { data: remindersResponse } = useQuery({
    queryKey: ['taskReminders'],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'TaskReminder',
        operation: 'filter',
        query: { status: 'pending' },
        sort: 'scheduled_for'
      });
      return response.data;
    },
    enabled: !!user
  });

  const leads = leadsResponse?.data || [];
  const meetings = meetingsResponse?.data || [];
  const tasks = tasksResponse?.data || [];
  const reminders = remindersResponse?.data || [];

  const upcomingMeetings = meetings.filter(m => 
    m.status === 'scheduled' && new Date(m.scheduled_date) > new Date()
  );
  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const overdueReminders = reminders.filter(r => new Date(r.scheduled_for) < new Date());

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
            subtitle="CRM SYSTEM"
            title="Centro de Relacionamento"
            accent="cyan"
            align="left"
          />
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <GlowCard glowColor="cyan" className="p-5">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#00D4FF]" />
              <div>
                <div className="text-xs text-slate-400">Total Leads</div>
                <div className="text-2xl font-bold text-white">{leads.length}</div>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="gold" className="p-5">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#C7A763]" />
              <div>
                <div className="text-xs text-slate-400">Reuniões Agendadas</div>
                <div className="text-2xl font-bold text-white">{upcomingMeetings.length}</div>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="mixed" className="p-5">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-xs text-slate-400">Tarefas Pendentes</div>
                <div className="text-2xl font-bold text-white">{pendingTasks.length}</div>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="cyan" className="p-5">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#00D4FF]" />
              <div>
                <div className="text-xs text-slate-400">Lembretes</div>
                <div className="text-2xl font-bold text-white">{overdueReminders.length}</div>
              </div>
            </div>
          </GlowCard>
        </div>

        <Tabs defaultValue="funnel" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="funnel">
              <TrendingUp className="w-4 h-4 mr-2" />
              Funil Interativo
            </TabsTrigger>
            <TabsTrigger value="interactions">
              <Users className="w-4 h-4 mr-2" />
              Interações
            </TabsTrigger>
            <TabsTrigger value="meetings">
              <Calendar className="w-4 h-4 mr-2" />
              Reuniões
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <CheckSquare className="w-4 h-4 mr-2" />
              Tarefas
            </TabsTrigger>
            <TabsTrigger value="reminders">
              <Bell className="w-4 h-4 mr-2" />
              Lembretes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="funnel">
            <InteractiveLeadFunnel leads={leads} />
          </TabsContent>

          <TabsContent value="interactions">
            <LeadInteractions 
              leads={leads} 
              selectedLeadId={selectedLeadId}
              onSelectLead={setSelectedLeadId}
              currentUser={user}
            />
          </TabsContent>

          <TabsContent value="meetings">
            <MeetingCalendar 
              meetings={meetings}
              leads={leads}
              currentUser={user}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskManagement 
              tasks={tasks}
              leads={leads}
              currentUser={user}
            />
          </TabsContent>

          <TabsContent value="reminders">
            <ReminderCenter 
              reminders={reminders}
              tasks={tasks}
              meetings={meetings}
              currentUser={user}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}