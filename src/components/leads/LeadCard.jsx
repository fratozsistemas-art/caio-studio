import React from 'react';
import { Rocket, Building2, Handshake, TrendingUp, Mail, Phone, Calendar } from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";

const TYPE_CONFIG = {
  founder: { icon: Rocket, label: 'Founder', color: 'cyan' },
  corporate: { icon: Building2, label: 'Corporate', color: 'gold' },
  partner: { icon: Handshake, label: 'Partner', color: 'mixed' },
  investor: { icon: TrendingUp, label: 'Investor', color: 'gold' }
};

const STATUS_CONFIG = {
  new: { label: 'Novo', class: 'bg-blue-500/20 text-blue-400' },
  qualified: { label: 'Qualificado', class: 'bg-green-500/20 text-green-400' },
  contacted: { label: 'Contatado', class: 'bg-yellow-500/20 text-yellow-400' },
  in_progress: { label: 'Em Progresso', class: 'bg-purple-500/20 text-purple-400' },
  accepted: { label: 'Aceito', class: 'bg-emerald-500/20 text-emerald-400' },
  rejected: { label: 'Rejeitado', class: 'bg-red-500/20 text-red-400' }
};

export default function LeadCard({ lead, onClick }) {
  const typeConfig = TYPE_CONFIG[lead.stakeholder_type] || TYPE_CONFIG.founder;
  const statusConfig = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
  const Icon = typeConfig.icon;

  const scoreColor = lead.qualification_score >= 80 ? 'text-green-400' : 
                     lead.qualification_score >= 60 ? 'text-yellow-400' : 
                     'text-red-400';

  return (
    <GlowCard 
      glowColor={typeConfig.color} 
      className="p-5 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon className="w-5 h-5 text-[#00D4FF]" />
          </div>
          <div>
            <Badge className={statusConfig.class}>{statusConfig.label}</Badge>
          </div>
        </div>
        {lead.qualification_score && (
          <div className={`text-2xl font-bold ${scoreColor}`}>
            {lead.qualification_score}
          </div>
        )}
      </div>

      <h3 className="text-white font-semibold text-lg mb-1">{lead.full_name}</h3>
      <p className="text-slate-400 text-sm mb-3">{lead.company || typeConfig.label}</p>

      <div className="space-y-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Mail className="w-3 h-3" />
          <span className="truncate">{lead.email}</span>
        </div>
        {lead.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.next_action_date && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <span>{new Date(lead.next_action_date).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
      </div>

      {lead.next_action && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs text-[#C7A763]">Próxima ação:</div>
          <div className="text-xs text-white">{lead.next_action}</div>
        </div>
      )}
    </GlowCard>
  );
}