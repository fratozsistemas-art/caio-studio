import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';

export default function RelatedVentures({ currentVenture }) {
  const { data: relatedVentures, isLoading } = useQuery({
    queryKey: ['related-ventures', currentVenture?.id],
    queryFn: async () => {
      if (!currentVenture) return [];
      
      const allVentures = await base44.entities.Venture.list('-created_date', 50);
      
      // Find related ventures based on layer, tags, and category
      const related = allVentures
        .filter(v => v.id !== currentVenture.id)
        .map(v => {
          let score = 0;
          
          // Same layer = high priority
          if (v.layer === currentVenture.layer) score += 3;
          
          // Shared tags
          const sharedTags = (v.tags || []).filter(tag => 
            (currentVenture.tags || []).includes(tag)
          );
          score += sharedTags.length;
          
          // Same category
          if (v.category === currentVenture.category) score += 2;
          
          // Same status
          if (v.status === currentVenture.status) score += 1;
          
          return { ...v, score };
        })
        .filter(v => v.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      
      return related;
    },
    enabled: !!currentVenture
  });

  if (isLoading || !relatedVentures?.length) return null;

  const layerColors = {
    startup: 'cyan',
    scaleup: 'mixed',
    deeptech: 'cyan',
    platform: 'gold',
    cultural: 'mixed',
    winwin: 'gold'
  };

  return (
    <div className="mt-16 pt-16 border-t border-white/10">
      <h3 className="text-2xl font-bold text-white mb-8 font-montserrat">
        Ventures Relacionadas
      </h3>
      
      <div className="grid md:grid-cols-3 gap-6">
        {relatedVentures.map((venture, i) => (
          <motion.div
            key={venture.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link to={createPageUrl(`VentureDetail?id=${venture.id}`)}>
              <GlowCard 
                glowColor={layerColors[venture.layer] || 'cyan'} 
                className="h-full group cursor-pointer"
              >
                <div className="p-5">
                  {venture.logo_url ? (
                    <img 
                      src={venture.logo_url} 
                      alt={venture.name}
                      className="w-12 h-12 rounded-lg object-cover mb-3 border border-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                      <span className="text-lg font-bold text-[#C7A763]">
                        {venture.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  <h4 className="text-white font-semibold mb-2 group-hover:text-[#C7A763] transition-colors">
                    {venture.name}
                  </h4>
                  
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                    {venture.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-xs text-slate-500">{venture.layer}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#C7A763] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </GlowCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}