import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, ExternalLink, Globe, Linkedin } from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

export default function VentureCard({ venture, index }) {
  const statusColors = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    development: "bg-[#00D4FF]/20 text-[#00D4FF] border-[#00D4FF]/30",
    research: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    scaling: "bg-[#C7A763]/20 text-[#C7A763] border-[#C7A763]/30"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link to={venture.custom_page || createPageUrl('VentureDetail') + '?id=' + venture.id}>
        <GlowCard glowColor={venture.layer === 'startup' ? 'cyan' : 'gold'} className="h-full group cursor-pointer">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-xl font-bold text-white">{venture.name.charAt(0)}</span>
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full border ${statusColors[venture.status]}`}>
              {venture.status.charAt(0).toUpperCase() + venture.status.slice(1)}
            </span>
          </div>

          {/* Content */}
          <h3 className="text-lg font-bold text-white mb-2 font-montserrat group-hover:text-[#C7A763] transition-colors">
            {venture.name}
          </h3>
          
          <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2">
            {venture.description}
          </p>

          {/* Tags */}
          {venture.tags && venture.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {venture.tags.map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium hover:bg-white/10 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{venture.category}</span>
              <div className="flex items-center gap-2">
                {venture.linkedin_url && (
                  <a 
                    href={venture.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs text-[#0077B5] hover:text-[#0099D5] transition-colors font-medium"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                )}
                {venture.website ? (
                  <a 
                    href={venture.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs text-[#C7A763] hover:text-[#D4B474] transition-colors font-medium"
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-[#C7A763] opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver detalhes
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </GlowCard>
      </Link>
    </motion.div>
  );
}