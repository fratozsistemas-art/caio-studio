import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, TrendingUp, Users, Mail, Building2 } from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";
import { toast } from 'sonner';
import { useLeadStatusAutomation } from './AutomationTrigger';

export default function InteractiveLeadFunnel({ leads }) {
  const queryClient = useQueryClient();
  const triggerAutomation = useLeadStatusAutomation();
  
  const funnelStages = [
    { 
      key: 'new', 
      label: 'Novos', 
      color: 'from-blue-500/20 to-blue-500/5',
      borderColor: 'border-blue-500/30',
      bgColor: 'bg-blue-500/10'
    },
    { 
      key: 'qualified', 
      label: 'Qualificados', 
      color: 'from-green-500/20 to-green-500/5',
      borderColor: 'border-green-500/30',
      bgColor: 'bg-green-500/10'
    },
    { 
      key: 'contacted', 
      label: 'Contatados', 
      color: 'from-yellow-500/20 to-yellow-500/5',
      borderColor: 'border-yellow-500/30',
      bgColor: 'bg-yellow-500/10'
    },
    { 
      key: 'in_progress', 
      label: 'Em Progresso', 
      color: 'from-purple-500/20 to-purple-500/5',
      borderColor: 'border-purple-500/30',
      bgColor: 'bg-purple-500/10'
    },
    { 
      key: 'accepted', 
      label: 'Aceitos', 
      color: 'from-emerald-500/20 to-emerald-500/5',
      borderColor: 'border-emerald-500/30',
      bgColor: 'bg-emerald-500/10'
    }
  ];

  // Calculate metrics
  const metrics = useMemo(() => {
    const stageMetrics = {};
    
    funnelStages.forEach(stage => {
      const stageLeads = leads.filter(l => l.status === stage.key);
      const count = stageLeads.length;
      
      // Calculate average time in stage
      let avgTime = 0;
      if (stageLeads.length > 0) {
        const times = stageLeads.map(lead => {
          const created = new Date(lead.created_date);
          const updated = new Date(lead.updated_date);
          return Math.floor((updated - created) / (1000 * 60 * 60 * 24));
        });
        avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      }
      
      stageMetrics[stage.key] = {
        count,
        avgTime,
        leads: stageLeads
      };
    });

    // Calculate conversion rates
    const conversions = [];
    for (let i = 0; i < funnelStages.length - 1; i++) {
      const current = stageMetrics[funnelStages[i].key];
      const next = stageMetrics[funnelStages[i + 1].key];
      const rate = current.count > 0 ? Math.round((next.count / current.count) * 100) : 0;
      conversions.push({
        from: funnelStages[i].label,
        to: funnelStages[i + 1].label,
        rate
      });
    }

    return { stageMetrics, conversions };
  }, [leads]);

  const updateLeadMutation = useMutation({
    mutationFn: async ({ leadId, newStatus, leadData }) => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'StakeholderLead',
        operation: 'update',
        id: leadId,
        data: { status: newStatus }
      });
      
      // Trigger automations
      await triggerAutomation.mutateAsync({
        lead_id: leadId,
        old_status: leadData.status,
        new_status: newStatus,
        lead_data: leadData
      });
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stakeholderLeads']);
      toast.success('Lead atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar lead: ' + error.message);
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const leadId = draggableId;
    const newStatus = destination.droppableId;
    const lead = leads.find(l => l.id === leadId);
    
    if (!lead) return;

    updateLeadMutation.mutate({ 
      leadId, 
      newStatus,
      leadData: lead
    });
  };

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid md:grid-cols-5 gap-4">
        {funnelStages.map(stage => {
          const metric = metrics.stageMetrics[stage.key];
          return (
            <GlowCard key={stage.key} glowColor="cyan" className="p-4">
              <div className="text-xs text-slate-400 mb-2">{stage.label}</div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-white">{metric.count}</div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {metric.avgTime}d
                </div>
              </div>
            </GlowCard>
          );
        })}
      </div>

      {/* Conversion Rates */}
      <GlowCard glowColor="gold" className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#C7A763]" />
          <h3 className="text-white font-semibold">Taxas de Conversão</h3>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {metrics.conversions.map((conv, idx) => (
            <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-xs text-slate-400 mb-1">
                {conv.from} → {conv.to}
              </div>
              <div className="text-2xl font-bold text-white">{conv.rate}%</div>
            </div>
          ))}
        </div>
      </GlowCard>

      {/* Drag and Drop Funnel */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid md:grid-cols-5 gap-4">
          {funnelStages.map(stage => {
            const stageLeads = metrics.stageMetrics[stage.key].leads;
            
            return (
              <div key={stage.key} className="space-y-3">
                <div className={`p-3 rounded-lg border ${stage.borderColor} bg-gradient-to-b ${stage.color}`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-semibold text-sm">{stage.label}</h4>
                    <span className="text-white font-bold text-lg">{stageLeads.length}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <Clock className="w-3 h-3" />
                    Média: {metrics.stageMetrics[stage.key].avgTime} dias
                  </div>
                </div>

                <Droppable droppableId={stage.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[400px] p-3 rounded-lg border-2 border-dashed transition-colors ${
                        snapshot.isDraggingOver 
                          ? `${stage.borderColor} ${stage.bgColor}` 
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <AnimatePresence>
                        {stageLeads.map((lead, index) => (
                          <Draggable 
                            key={lead.id} 
                            draggableId={lead.id} 
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <motion.div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`mb-3 p-3 rounded-lg border border-white/20 bg-[#0a1628] cursor-move transition-all ${
                                  snapshot.isDragging ? 'shadow-xl scale-105 ring-2 ring-[#C7A763]' : 'hover:border-white/40'
                                }`}
                              >
                                <div className="flex items-start gap-2 mb-2">
                                  <Users className="w-4 h-4 text-[#C7A763] mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-white font-medium text-sm truncate">
                                      {lead.full_name}
                                    </div>
                                    {lead.company && (
                                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                        <Building2 className="w-3 h-3" />
                                        <span className="truncate">{lead.company}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Mail className="w-3 h-3" />
                                    <span className="truncate max-w-[120px]">{lead.email}</span>
                                  </div>
                                  <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-400">
                                    {lead.stakeholder_type}
                                  </span>
                                </div>
                              </motion.div>
                            )}
                          </Draggable>
                        ))}
                      </AnimatePresence>
                      {provided.placeholder}
                      
                      {stageLeads.length === 0 && (
                        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                          Arraste leads para cá
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}