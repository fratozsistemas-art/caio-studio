import React from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, ExternalLink, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import GlowCard from "@/components/ui/GlowCard";
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";

export default function VentureList({ ventures, onEdit, onRefresh }) {
  const handleDelete = async (venture) => {
    if (!confirm(`Deletar "${venture.name}"?`)) return;

    try {
      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Venture',
        operation: 'delete',
        query: { id: venture.id }
      });
      toast.success('Venture deletada');
      onRefresh();
    } catch (error) {
      toast.error('Erro ao deletar: ' + error.message);
    }
  };

  const layerColors = {
    startup: 'text-blue-400',
    scaleup: 'text-purple-400',
    deeptech: 'text-cyan-400',
    platform: 'text-yellow-400',
    cultural: 'text-pink-400',
    winwin: 'text-green-400'
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {ventures.map((venture, index) => (
        <motion.div
          key={venture.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <GlowCard glowColor="mixed" className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{venture.name}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2">{venture.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-1 rounded-full bg-white/10 ${layerColors[venture.layer]}`}>
                  {venture.layer}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70">
                  {venture.status}
                </span>
                {venture.category && (
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">
                    {venture.category}
                  </span>
                )}
              </div>

              {venture.tags && venture.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {venture.tags.map((tag, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/50">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <Link to={`${createPageUrl('VentureDetail')}?id=${venture.id}`}>
                  <Button size="sm" variant="ghost" className="text-[#C7A763] hover:bg-[#C7A763]/10">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
                {venture.website && (
                  <a href={venture.website} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="ghost" className="text-white/70 hover:bg-white/10">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(venture)}
                  className="text-[#00D4FF] hover:bg-[#00D4FF]/10"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(venture)}
                  className="text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </GlowCard>
        </motion.div>
      ))}
    </div>
  );
}