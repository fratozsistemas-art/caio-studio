import React from 'react';
import { TrendingUp, Mail, CheckCircle, Clock } from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AutomationAnalytics({ workflows, sequences }) {
  const workflowsByType = {
    nurturing: workflows.filter(w => w.workflow_type === 'nurturing').length,
    onboarding: workflows.filter(w => w.workflow_type === 'onboarding').length,
    follow_up: workflows.filter(w => w.workflow_type === 'follow_up').length,
    conversion: workflows.filter(w => w.workflow_type === 'conversion').length
  };

  const chartData = [
    { name: 'Nurturing', value: workflowsByType.nurturing },
    { name: 'Onboarding', value: workflowsByType.onboarding },
    { name: 'Follow-up', value: workflowsByType.follow_up },
    { name: 'Conversion', value: workflowsByType.conversion }
  ];

  const completionRate = workflows.length > 0 
    ? Math.round((workflows.filter(w => w.status === 'completed').length / workflows.length) * 100)
    : 0;

  const avgStepsCompleted = workflows.length > 0
    ? Math.round(workflows.reduce((acc, w) => acc + (w.current_step || 0), 0) / workflows.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <GlowCard glowColor="cyan" className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
            <span className="text-xs text-slate-400">Taxa de Conclusão</span>
          </div>
          <div className="text-3xl font-bold text-white">{completionRate}%</div>
        </GlowCard>

        <GlowCard glowColor="gold" className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-5 h-5 text-[#C7A763]" />
            <span className="text-xs text-slate-400">Emails Enviados</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {sequences.reduce((acc, s) => acc + (s.success_metrics?.sent_count || 0), 0)}
          </div>
        </GlowCard>

        <GlowCard glowColor="mixed" className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-slate-400">Média de Etapas</span>
          </div>
          <div className="text-3xl font-bold text-white">{avgStepsCompleted}</div>
        </GlowCard>

        <GlowCard glowColor="cyan" className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-[#00D4FF]" />
            <span className="text-xs text-slate-400">Workflows Ativos</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {workflows.filter(w => w.status === 'active').length}
          </div>
        </GlowCard>
      </div>

      <GlowCard glowColor="mixed" className="p-6">
        <h3 className="text-white font-semibold mb-6">Workflows por Tipo</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #ffffff20', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="value" fill="#00D4FF" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlowCard>
    </div>
  );
}