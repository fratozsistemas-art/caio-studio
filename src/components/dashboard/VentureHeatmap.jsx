import React from 'react';
import { motion } from 'framer-motion';
import GlowCard from "@/components/ui/GlowCard";
import { Layers, Activity } from 'lucide-react';

export default function VentureHeatmap({ ventures }) {
  const layers = ['startup', 'scaleup', 'deeptech', 'platform', 'cultural', 'winwin'];
  const statuses = ['active', 'development', 'research', 'scaling'];

  const layerLabels = {
    startup: 'Startups',
    scaleup: 'Scale-ups',
    deeptech: 'Deep Tech',
    platform: 'Platforms',
    cultural: 'Cultural',
    winwin: 'Win-Win'
  };

  const statusLabels = {
    active: 'Ativo',
    development: 'Desenvolvimento',
    research: 'Pesquisa',
    scaling: 'Escala'
  };

  // Calculate distribution
  const distribution = {};
  layers.forEach(layer => {
    distribution[layer] = {};
    statuses.forEach(status => {
      distribution[layer][status] = ventures.filter(
        v => v.layer === layer && v.status === status
      ).length;
    });
  });

  // Get max value for color scaling
  const maxValue = Math.max(
    ...layers.flatMap(layer => 
      statuses.map(status => distribution[layer][status])
    )
  );

  const getHeatColor = (value) => {
    if (value === 0) return 'bg-white/5';
    const intensity = value / maxValue;
    if (intensity > 0.7) return 'bg-gradient-to-br from-[#C7A763] to-[#A88B4A]';
    if (intensity > 0.4) return 'bg-gradient-to-br from-[#00D4FF] to-[#0099CC]';
    return 'bg-gradient-to-br from-purple-500 to-purple-600';
  };

  return (
    <GlowCard glowColor="mixed" className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Layers className="w-5 h-5 text-[#C7A763]" />
        <h3 className="text-xl font-bold text-white">Mapa de Calor - Distribuição de Ventures</h3>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header */}
          <div className="grid grid-cols-[150px_repeat(4,1fr)] gap-2 mb-2">
            <div></div>
            {statuses.map(status => (
              <div key={status} className="text-center text-xs text-white/70 font-medium">
                {statusLabels[status]}
              </div>
            ))}
          </div>

          {/* Heatmap Grid */}
          <div className="space-y-2">
            {layers.map((layer, layerIndex) => (
              <motion.div
                key={layer}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: layerIndex * 0.1 }}
                className="grid grid-cols-[150px_repeat(4,1fr)] gap-2"
              >
                <div className="flex items-center text-sm text-white/80 font-medium">
                  {layerLabels[layer]}
                </div>
                {statuses.map(status => {
                  const value = distribution[layer][status];
                  return (
                    <motion.div
                      key={`${layer}-${status}`}
                      whileHover={{ scale: 1.05 }}
                      className={`
                        aspect-square rounded-lg flex items-center justify-center
                        ${getHeatColor(value)}
                        border border-white/10
                        transition-all duration-300
                        cursor-pointer
                      `}
                    >
                      <span className={`text-lg font-bold ${
                        value === 0 ? 'text-white/30' : 'text-white'
                      }`}>
                        {value}
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-white/60">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white/5 border border-white/10"></div>
              <span>Vazio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-purple-600"></div>
              <span>Baixo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-[#00D4FF] to-[#0099CC]"></div>
              <span>Médio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-[#C7A763] to-[#A88B4A]"></div>
              <span>Alto</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-[#C7A763]">{ventures.length}</div>
          <div className="text-xs text-white/60">Total Ventures</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-[#00D4FF]">{layers.length}</div>
          <div className="text-xs text-white/60">Camadas</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-400">{statuses.length}</div>
          <div className="text-xs text-white/60">Status</div>
        </div>
      </div>
    </GlowCard>
  );
}