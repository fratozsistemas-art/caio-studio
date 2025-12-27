import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Settings, Zap } from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";
import { Button } from "@/components/ui/button";

export default function WorkflowManager() {
  return (
    <div className="space-y-6">
      <GlowCard glowColor="mixed" className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-[#C7A763]" />
          <h3 className="text-white font-semibold text-lg">Configurações de Automação</h3>
        </div>

        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h4 className="text-white font-medium mb-2">Workflows Automáticos</h4>
            <p className="text-slate-400 text-sm mb-4">
              Workflows são criados automaticamente quando um lead é qualificado
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20">
                <div className="text-blue-400 font-medium text-sm mb-1">Founders</div>
                <div className="text-xs text-slate-400">Nurturing → Discovery Call → Onboarding</div>
              </div>
              <div className="p-3 rounded bg-green-500/10 border border-green-500/20">
                <div className="text-green-400 font-medium text-sm mb-1">Corporate</div>
                <div className="text-xs text-slate-400">Awareness → Discovery → Proposal</div>
              </div>
              <div className="p-3 rounded bg-purple-500/10 border border-purple-500/20">
                <div className="text-purple-400 font-medium text-sm mb-1">Partners</div>
                <div className="text-xs text-slate-400">Outreach → Evaluation → Onboarding</div>
              </div>
              <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/20">
                <div className="text-yellow-400 font-medium text-sm mb-1">Investors</div>
                <div className="text-xs text-slate-400">Positioning → Presentation → Due Diligence</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h4 className="text-white font-medium mb-2">Regras de Automação</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-[#C7A763] mt-0.5" />
                <span>Leads com score ≥ 60 recebem workflow de nurturing automaticamente</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-[#C7A763] mt-0.5" />
                <span>Emails são enviados automaticamente baseado no cronograma da sequência</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-[#C7A763] mt-0.5" />
                <span>Workflows pausam automaticamente se o lead responder ou avançar de stage</span>
              </div>
            </div>
          </div>
        </div>
      </GlowCard>
    </div>
  );
}