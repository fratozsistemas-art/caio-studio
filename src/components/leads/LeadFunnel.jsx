import React from 'react';
import { motion } from 'framer-motion';
import GlowCard from "@/components/ui/GlowCard";

export default function LeadFunnel({ leads }) {
  const funnelStages = [
    { 
      key: 'new', 
      label: 'Novos Leads', 
      color: 'from-blue-500/20 to-blue-500/5',
      borderColor: 'border-blue-500/30'
    },
    { 
      key: 'qualified', 
      label: 'Qualificados', 
      color: 'from-green-500/20 to-green-500/5',
      borderColor: 'border-green-500/30'
    },
    { 
      key: 'contacted', 
      label: 'Contatados', 
      color: 'from-yellow-500/20 to-yellow-500/5',
      borderColor: 'border-yellow-500/30'
    },
    { 
      key: 'in_progress', 
      label: 'Em Progresso', 
      color: 'from-purple-500/20 to-purple-500/5',
      borderColor: 'border-purple-500/30'
    },
    { 
      key: 'accepted', 
      label: 'Aceitos', 
      color: 'from-emerald-500/20 to-emerald-500/5',
      borderColor: 'border-emerald-500/30'
    }
  ];

  const stageCounts = funnelStages.map(stage => ({
    ...stage,
    count: leads.filter(l => l.status === stage.key).length,
    percentage: leads.length > 0 ? Math.round((leads.filter(l => l.status === stage.key).length / leads.length) * 100) : 0
  }));

  const maxCount = Math.max(...stageCounts.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      <GlowCard glowColor="mixed" className="p-6">
        <h3 className="text-white font-semibold mb-6">Funil de Conversão</h3>
        
        <div className="space-y-4">
          {stageCounts.map((stage, index) => {
            const widthPercent = (stage.count / maxCount) * 100;
            
            return (
              <motion.div
                key={stage.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">{stage.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-sm">{stage.percentage}%</span>
                    <span className="text-white font-bold text-lg">{stage.count}</span>
                  </div>
                </div>
                <div className="relative h-12 rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${stage.color} border-r-2 ${stage.borderColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPercent}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlowCard>

      {/* Conversion Rates */}
      <div className="grid md:grid-cols-4 gap-4">
        {stageCounts.slice(0, -1).map((stage, index) => {
          const nextStage = stageCounts[index + 1];
          const conversionRate = stage.count > 0 
            ? Math.round((nextStage.count / stage.count) * 100) 
            : 0;

          return (
            <GlowCard key={`conversion-${stage.key}`} glowColor="cyan" className="p-4">
              <div className="text-xs text-slate-400 mb-1">
                {stage.label} → {nextStage.label}
              </div>
              <div className="text-2xl font-bold text-white">{conversionRate}%</div>
            </GlowCard>
          );
        })}
      </div>
    </div>
  );
}