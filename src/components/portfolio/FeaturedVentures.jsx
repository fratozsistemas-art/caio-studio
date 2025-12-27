import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SectionTitle from '@/components/ui/SectionTitle';
import GlowCard from '@/components/ui/GlowCard';

export default function FeaturedVentures() {
  const { data: ventures, isLoading } = useQuery({
    queryKey: ['featured-ventures'],
    queryFn: async () => {
      const allVentures = await base44.entities.Venture.list('-created_date', 50);
      // Filter for active, scaling or development ventures in specific layers
      return allVentures
        .filter(v => 
          ['active', 'scaling', 'development'].includes(v.status) &&
          ['scaleup', 'deeptech', 'platform'].includes(v.layer)
        )
        .slice(0, 3);
    }
  });

  if (isLoading || !ventures?.length) return null;

  const layerColors = {
    startup: { border: 'border-blue-500/30', glow: 'cyan', text: 'text-blue-400' },
    scaleup: { border: 'border-purple-500/30', glow: 'mixed', text: 'text-purple-400' },
    deeptech: { border: 'border-cyan-500/30', glow: 'cyan', text: 'text-cyan-400' },
    platform: { border: 'border-[#C7A763]/30', glow: 'gold', text: 'text-[#C7A763]' },
    cultural: { border: 'border-pink-500/30', glow: 'mixed', text: 'text-pink-400' },
    winwin: { border: 'border-green-500/30', glow: 'gold', text: 'text-green-400' }
  };

  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#C7A763]/5 via-transparent to-transparent" />
      
      <div className="max-w-7xl mx-auto relative">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-[#C7A763]" />
            <SectionTitle
              subtitle="DESTAQUES"
              title="Ventures em Foco"
              accent="gold"
              align="left"
            />
          </div>
          
          <Link to={createPageUrl('Portfolio')}>
            <motion.button
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              whileHover={{ x: 5 }}
            >
              Ver Portfolio Completo
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {ventures.map((venture, i) => {
            const colors = layerColors[venture.layer] || layerColors.startup;
            
            return (
              <motion.div
                key={venture.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Link to={createPageUrl(`VentureDetail?id=${venture.id}`)}>
                  <GlowCard glowColor={colors.glow} className="h-full group cursor-pointer">
                    <div className="p-6">
                      {/* Logo/Icon */}
                      {venture.logo_url ? (
                        <img 
                          src={venture.logo_url} 
                          alt={venture.name}
                          className="w-16 h-16 rounded-xl object-cover mb-4 border border-white/10"
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-xl border ${colors.border} bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center mb-4`}>
                          <span className={`text-2xl font-bold ${colors.text}`}>
                            {venture.name.charAt(0)}
                          </span>
                        </div>
                      )}

                      {/* Header */}
                      <div className="mb-3">
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#C7A763] transition-colors">
                          {venture.name}
                        </h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors.text} bg-white/5`}>
                          {venture.layer}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-slate-400 text-sm mb-4 line-clamp-3">
                        {venture.description}
                      </p>

                      {/* Tags */}
                      {venture.tags && venture.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {venture.tags.slice(0, 3).map((tag, idx) => (
                            <span 
                              key={idx}
                              className="text-xs px-2 py-1 rounded bg-white/5 text-slate-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <span className="text-xs text-slate-500">
                          {venture.category || 'Technology'}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#C7A763] group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </GlowCard>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}