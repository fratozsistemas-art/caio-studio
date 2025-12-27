import React from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, Globe, Linkedin, Tag, Calendar, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import GlowCard from '@/components/ui/GlowCard';

const statusColors = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  development: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  research: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  scaling: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
};

const layerColors = {
  startup: 'text-cyan-400',
  scaleup: 'text-green-400',
  deeptech: 'text-purple-400',
  platform: 'text-yellow-400',
  cultural: 'text-pink-400',
  winwin: 'text-orange-400'
};

const layerLabels = {
  startup: 'Startup',
  scaleup: 'Scale-up',
  deeptech: 'Deep Tech',
  platform: 'Platform',
  cultural: 'Cluster Cultural',
  winwin: 'Win-Win'
};

export default function VentureQuickView({ venture, onClose }) {
  if (!venture) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <GlowCard glowColor="mixed" className="p-6 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start gap-4 mb-4">
              {venture.logo_url ? (
                <img src={venture.logo_url} alt={venture.name} className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#C7A763]/30 to-[#00D4FF]/30 border border-white/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {venture.name?.charAt(0)}
                  </span>
                </div>
              )}

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2 font-montserrat">
                  {venture.name}
                </h2>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[venture.status]}`}>
                    {venture.status}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 ${layerColors[venture.layer]}`}>
                    {layerLabels[venture.layer]}
                  </span>
                  {venture.category && (
                    <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                      {venture.category}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed">
              {venture.description}
            </p>
          </div>

          {/* Quick Info Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {venture.founded_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-[#C7A763]" />
                <span className="text-slate-400">
                  Fundada em {new Date(venture.founded_date).getFullYear()}
                </span>
              </div>
            )}
            {venture.team_size && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-[#00D4FF]" />
                <span className="text-slate-400">
                  {venture.team_size} pessoas
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-slate-400">
                {venture.status === 'scaling' ? 'Em expansão' : venture.status === 'active' ? 'Ativo' : 'Em desenvolvimento'}
              </span>
            </div>
          </div>

          {/* Tags */}
          {venture.tags && venture.tags.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-white">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {venture.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-3 mb-6">
            {venture.website && (
              <a
                href={venture.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white transition-colors"
              >
                <Globe className="w-4 h-4" />
                Website
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {venture.linkedin_url && (
              <a
                href={venture.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Link to={createPageUrl('VentureDetail') + '?id=' + venture.id} className="flex-1">
              <Button className="w-full bg-gradient-to-r from-[#C7A763] to-[#A88B4A] hover:from-[#A88B4A] hover:to-[#8A7339] text-[#06101F]">
                Ver Detalhes Completos
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Fechar
            </Button>
          </div>
        </GlowCard>
      </motion.div>
    </motion.div>
  );
}