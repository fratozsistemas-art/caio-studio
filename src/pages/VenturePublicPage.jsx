import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Globe, Linkedin, Users, Info, DollarSign, Lightbulb, Tag, ArrowLeft, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import GlowCard from '@/components/ui/GlowCard';
import SectionTitle from '@/components/ui/SectionTitle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function VenturePublicPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const ventureId = urlParams.get('ventureId');

  const { data: venture, isLoading } = useQuery({
    queryKey: ['venture', ventureId],
    queryFn: async () => {
      const ventures = await base44.entities.Venture.list();
      return ventures.find(v => v.id === ventureId);
    },
    enabled: !!ventureId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!venture) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <p className="text-red-400 mb-4">Venture não encontrada.</p>
        <Link to={createPageUrl('Portfolio')}>
          <Button variant="outline">← Voltar ao Portfólio</Button>
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-24 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link to={createPageUrl('Portfolio')}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Portfólio
          </Button>
        </Link>

        <SectionTitle
          title={venture.name}
          subtitle={venture.category || 'Venture'}
          accent="gold"
          align="left"
        />

        <GlowCard glowColor="cyan" className="p-6 space-y-4">
          <h3 className="text-xl font-semibold text-white">Descrição</h3>
          <p className="text-slate-300 leading-relaxed">{venture.description}</p>
        </GlowCard>

        <div className="grid md:grid-cols-2 gap-4">
          <GlowCard glowColor="gold" className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-[#C7A763]">
              <Info className="w-5 h-5" />
              <h4 className="font-semibold">Detalhes Principais</h4>
            </div>
            <div className="text-slate-300 space-y-2">
              <div>
                <strong>Camada:</strong> <Badge variant="outline" className="ml-2 bg-[#C7A763]/10 text-[#C7A763] border-[#C7A763]/20">{venture.layer}</Badge>
              </div>
              <div>
                <strong>Status:</strong> <Badge variant="outline" className="ml-2 bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/20">{venture.status}</Badge>
              </div>
              {venture.founded_date && <p><strong>Fundada em:</strong> {new Date(venture.founded_date).toLocaleDateString('pt-BR')}</p>}
              {venture.team_size && <p><strong>Tamanho da Equipe:</strong> {venture.team_size}</p>}
            </div>
          </GlowCard>

          {(venture.business_model || (venture.revenue_streams && venture.revenue_streams.length > 0)) && (
            <GlowCard glowColor="mixed" className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-purple-400">
                <DollarSign className="w-5 h-5" />
                <h4 className="font-semibold">Modelo de Negócios</h4>
              </div>
              <div className="text-slate-300 space-y-2">
                {venture.business_model && <p><strong>Modelo:</strong> {venture.business_model}</p>}
                {venture.revenue_streams && venture.revenue_streams.length > 0 && (
                  <div>
                    <p className="mb-1"><strong>Fontes de Receita:</strong></p>
                    <ul className="list-disc list-inside ml-2 space-y-1 text-sm">
                      {venture.revenue_streams.map((stream, idx) => (
                        <li key={idx}>{stream}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </GlowCard>
          )}
        </div>

        {venture.target_audience && (
          <GlowCard glowColor="cyan" className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-[#00D4FF]">
              <Users className="w-5 h-5" />
              <h4 className="font-semibold">Público-Alvo</h4>
            </div>
            <p className="text-slate-300">{venture.target_audience}</p>
          </GlowCard>
        )}

        {venture.competitive_advantages && venture.competitive_advantages.length > 0 && (
          <GlowCard glowColor="gold" className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-[#C7A763]">
              <Lightbulb className="w-5 h-5" />
              <h4 className="font-semibold">Vantagens Competitivas</h4>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
              {venture.competitive_advantages.map((advantage, idx) => (
                <li key={idx}>{advantage}</li>
              ))}
            </ul>
          </GlowCard>
        )}

        {venture.tags && venture.tags.length > 0 && (
          <GlowCard glowColor="mixed" className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-purple-400">
              <Tag className="w-5 h-5" />
              <h4 className="font-semibold">Tags</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {venture.tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="bg-white/10 text-white border-white/20">{tag}</Badge>
              ))}
            </div>
          </GlowCard>
        )}

        {venture.team_bios && venture.team_bios.length > 0 && (
          <GlowCard glowColor="cyan" className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#00D4FF]">
              <Users className="w-5 h-5" />
              <h4 className="font-semibold">Time</h4>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {venture.team_bios.map((member, idx) => (
                <div key={idx} className="flex gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                  {member.photo_url && (
                    <img src={member.photo_url} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold text-white">{member.name}</h5>
                      {member.linkedin_url && (
                        <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[#00D4FF] hover:text-[#00B8E6]">
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-[#C7A763] mb-2">{member.role}</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlowCard>
        )}

        {venture.roadmap && venture.roadmap.length > 0 && (
          <GlowCard glowColor="gold" className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#C7A763]">
              <Calendar className="w-5 h-5" />
              <h4 className="font-semibold">Roadmap</h4>
            </div>
            <div className="space-y-4">
              {venture.roadmap.map((phase, idx) => (
                <div key={idx} className="border-l-2 border-[#C7A763]/30 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-semibold text-white">{phase.phase}</h5>
                    <Badge variant="outline" className={
                      phase.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                      phase.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/30'
                    }>
                      {phase.status === 'completed' ? 'Completo' : phase.status === 'in_progress' ? 'Em Andamento' : 'Planejado'}
                    </Badge>
                    {phase.target_date && (
                      <span className="text-xs text-slate-400">{new Date(phase.target_date).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                  {phase.milestones && phase.milestones.length > 0 && (
                    <ul className="space-y-1 text-sm text-slate-300">
                      {phase.milestones.map((milestone, mIdx) => (
                        <li key={mIdx} className="flex items-start gap-2">
                          <span className="text-[#C7A763] mt-1">•</span>
                          <span>{milestone}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </GlowCard>
        )}

        {venture.funding_history && venture.funding_history.length > 0 && (
          <GlowCard glowColor="mixed" className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <DollarSign className="w-5 h-5" />
              <h4 className="font-semibold">Histórico de Investimento</h4>
            </div>
            <div className="space-y-3">
              {venture.funding_history.map((round, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-white">{round.round}</h5>
                    {round.date && (
                      <span className="text-xs text-slate-400">{new Date(round.date).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {round.amount && <div><span className="text-slate-400">Valor:</span> <span className="text-white">{round.amount}</span></div>}
                    {round.valuation && <div><span className="text-slate-400">Valuation:</span> <span className="text-white">{round.valuation}</span></div>}
                  </div>
                  {round.lead_investors && round.lead_investors.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-slate-400">Investidores: </span>
                      <span className="text-xs text-slate-300">{round.lead_investors.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlowCard>
        )}

        <div className="flex gap-4 justify-center">
          {venture.website && (
            <a href={venture.website} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <Globe className="w-4 h-4" /> Visitar Website
              </Button>
            </a>
          )}
          {venture.linkedin_url && (
            <a href={venture.linkedin_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <Linkedin className="w-4 h-4" /> LinkedIn
              </Button>
            </a>
          )}
        </div>
      </div>
    </main>
  );
}