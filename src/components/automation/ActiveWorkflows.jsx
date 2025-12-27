import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { PlayCircle, PauseCircle, CheckCircle, Clock, User } from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const WORKFLOW_TYPES = {
  nurturing: { label: 'Nurturing', color: 'bg-blue-500/20 text-blue-400' },
  onboarding: { label: 'Onboarding', color: 'bg-green-500/20 text-green-400' },
  follow_up: { label: 'Follow-up', color: 'bg-yellow-500/20 text-yellow-400' },
  conversion: { label: 'Conversão', color: 'bg-purple-500/20 text-purple-400' }
};

const STATUS_CONFIG = {
  active: { icon: PlayCircle, label: 'Ativo', color: 'text-green-400' },
  paused: { icon: PauseCircle, label: 'Pausado', color: 'text-yellow-400' },
  completed: { icon: CheckCircle, label: 'Completo', color: 'text-blue-400' },
  cancelled: { icon: Clock, label: 'Cancelado', color: 'text-red-400' }
};

export default function ActiveWorkflows({ workflows }) {
  const { data: leadsResponse } = useQuery({
    queryKey: ['stakeholderLeads'],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'StakeholderLead',
        operation: 'list'
      });
      return response.data;
    }
  });

  const leads = leadsResponse?.data || [];

  const getLeadInfo = (leadId) => {
    return leads.find(l => l.id === leadId);
  };

  const activeWorkflows = workflows.filter(w => w.status === 'active' || w.status === 'paused');

  if (activeWorkflows.length === 0) {
    return (
      <GlowCard glowColor="mixed" className="p-12">
        <div className="text-center">
          <PlayCircle className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-white font-semibold mb-2">Nenhum workflow ativo</h3>
          <p className="text-slate-400">Workflows serão criados automaticamente quando leads entrarem no sistema</p>
        </div>
      </GlowCard>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {activeWorkflows.map((workflow, i) => {
        const lead = getLeadInfo(workflow.lead_id);
        const statusConfig = STATUS_CONFIG[workflow.status];
        const workflowType = WORKFLOW_TYPES[workflow.workflow_type];
        const StatusIcon = statusConfig.icon;
        const progress = (workflow.current_step / workflow.total_steps) * 100;

        return (
          <motion.div
            key={workflow.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlowCard glowColor="cyan" className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge className={workflowType.color}>
                    {workflowType.label}
                  </Badge>
                  <div className={`flex items-center gap-1 text-xs ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </div>
                </div>
              </div>

              {lead && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-white font-medium mb-1">
                    <User className="w-4 h-4 text-[#00D4FF]" />
                    {lead.full_name}
                  </div>
                  <div className="text-xs text-slate-400">{lead.email}</div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Progresso</span>
                  <span className="text-white font-medium">
                    {workflow.current_step} / {workflow.total_steps}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {workflow.next_action_scheduled && (
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  Próxima ação: {new Date(workflow.next_action_scheduled).toLocaleDateString('pt-BR')}
                </div>
              )}

              {workflow.completed_actions && workflow.completed_actions.length > 0 && (
                <div className="mt-3 text-xs text-slate-400">
                  {workflow.completed_actions.length} ações completadas
                </div>
              )}
            </GlowCard>
          </motion.div>
        );
      })}
    </div>
  );
}