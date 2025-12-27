import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MessageSquare, FileText, ThumbsUp, ThumbsDown, Minus, Clock } from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";

const INTERACTION_ICONS = {
  call: Phone,
  email: Mail,
  meeting: MessageSquare,
  note: FileText,
  proposal: FileText,
  contract: FileText
};

const OUTCOME_CONFIG = {
  positive: { icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/20' },
  neutral: { icon: Minus, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  negative: { icon: ThumbsDown, color: 'text-red-400', bg: 'bg-red-500/20' }
};

export default function InteractionTimeline({ interactions }) {
  if (interactions.length === 0) {
    return (
      <GlowCard glowColor="mixed" className="p-12">
        <div className="text-center">
          <Clock className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-white font-semibold mb-2">Nenhuma interação registrada</h3>
          <p className="text-slate-400">Registre a primeira interação com este lead</p>
        </div>
      </GlowCard>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold">Histórico de Interações</h3>
      {interactions.map((interaction, i) => {
        const Icon = INTERACTION_ICONS[interaction.interaction_type] || Phone;
        const outcome = OUTCOME_CONFIG[interaction.outcome] || OUTCOME_CONFIG.neutral;
        const OutcomeIcon = outcome.icon;

        return (
          <motion.div
            key={interaction.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlowCard glowColor="cyan" className="p-5">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#00D4FF]" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-white font-medium">{interaction.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span>{new Date(interaction.created_date).toLocaleDateString('pt-BR')}</span>
                        <span>•</span>
                        <span>{interaction.direction === 'inbound' ? 'Entrada' : 'Saída'}</span>
                        {interaction.duration_minutes && (
                          <>
                            <span>•</span>
                            <span>{interaction.duration_minutes} min</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded ${outcome.bg}`}>
                      <OutcomeIcon className={`w-3 h-3 ${outcome.color}`} />
                    </div>
                  </div>

                  {interaction.description && (
                    <p className="text-slate-300 text-sm mb-3">{interaction.description}</p>
                  )}

                  {interaction.next_steps && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-xs text-[#C7A763] mb-1">Próximos passos:</div>
                      <div className="text-sm text-slate-300">{interaction.next_steps}</div>
                    </div>
                  )}
                </div>
              </div>
            </GlowCard>
          </motion.div>
        );
      })}
    </div>
  );
}