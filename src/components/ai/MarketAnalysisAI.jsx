import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { TrendingUp, Target, Loader2, Users, DollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function MarketAnalysisAI({ ventureName, industry }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [searchTerm, setSearchTerm] = useState(ventureName || '');
  const [industryTerm, setIndustryTerm] = useState(industry || '');

  const performAnalysis = async () => {
    if (!searchTerm || !industryTerm) {
      toast.error('Nome da venture e indústria são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const prompt = `Analise o mercado e concorrentes para uma venture chamada "${searchTerm}" na indústria de "${industryTerm}".

Use dados e insights de mercado reais para fornecer:
1. Tamanho do mercado (TAM, SAM, SOM estimados)
2. Taxa de crescimento do mercado
3. Principais tendências
4. Principais concorrentes (diretos e indiretos)
5. Oportunidades de diferenciação
6. Barreiras de entrada
7. Análise SWOT (Forças, Fraquezas, Oportunidades, Ameaças)`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            market_size: {
              type: "object",
              properties: {
                tam: { type: "string" },
                sam: { type: "string" },
                som: { type: "string" }
              }
            },
            growth_rate: { type: "string" },
            key_trends: { type: "array", items: { type: "string" } },
            competitors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  strengths: { type: "string" },
                  market_share: { type: "string" }
                }
              }
            },
            differentiation_opportunities: { type: "array", items: { type: "string" } },
            entry_barriers: { type: "array", items: { type: "string" } },
            swot: {
              type: "object",
              properties: {
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                opportunities: { type: "array", items: { type: "string" } },
                threats: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      setAnalysis(response);
      toast.success('Análise de mercado concluída!');
    } catch (error) {
      toast.error('Erro na análise: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="cyan" className="p-6">
        <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
          Análise de Mercado com IA
        </h3>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-white/70 mb-2 block">Nome da Venture</Label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ex: MedTech Pro"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-white/70 mb-2 block">Indústria</Label>
            <Input
              value={industryTerm}
              onChange={(e) => setIndustryTerm(e.target.value)}
              placeholder="Ex: HealthTech, FinTech"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <Button
          onClick={performAnalysis}
          disabled={loading}
          className="w-full bg-[#00D4FF] hover:bg-[#00B8E6] text-[#06101F] font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando mercado...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              Analisar Mercado
            </>
          )}
        </Button>
      </GlowCard>

      {analysis && (
        <div className="space-y-4">
          {/* Market Size */}
          <GlowCard glowColor="gold" className="p-6">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#C7A763]" />
              Tamanho do Mercado
            </h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-slate-400">TAM (Total Addressable Market)</span>
                <p className="text-white font-semibold text-lg">{analysis.market_size?.tam}</p>
              </div>
              <div>
                <span className="text-sm text-slate-400">SAM (Serviceable Available Market)</span>
                <p className="text-white font-semibold text-lg">{analysis.market_size?.sam}</p>
              </div>
              <div>
                <span className="text-sm text-slate-400">SOM (Serviceable Obtainable Market)</span>
                <p className="text-white font-semibold text-lg">{analysis.market_size?.som}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <span className="text-sm text-slate-400">Taxa de Crescimento</span>
              <p className="text-white font-semibold">{analysis.growth_rate}</p>
            </div>
          </GlowCard>

          {/* Competitors */}
          <GlowCard glowColor="cyan" className="p-6">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#00D4FF]" />
              Principais Concorrentes
            </h4>
            <div className="space-y-3">
              {analysis.competitors?.map((competitor, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{competitor.name}</span>
                    <span className="text-xs bg-[#00D4FF]/20 text-[#00D4FF] px-2 py-1 rounded">
                      {competitor.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{competitor.strengths}</p>
                  <span className="text-xs text-slate-400">Market Share: {competitor.market_share}</span>
                </div>
              ))}
            </div>
          </GlowCard>

          {/* SWOT Analysis */}
          <GlowCard glowColor="mixed" className="p-6">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#C7A763]" />
              Análise SWOT
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-green-400 font-medium mb-2">Forças</h5>
                <ul className="space-y-1">
                  {analysis.swot?.strengths?.map((item, i) => (
                    <li key={i} className="text-sm text-slate-300">• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-red-400 font-medium mb-2">Fraquezas</h5>
                <ul className="space-y-1">
                  {analysis.swot?.weaknesses?.map((item, i) => (
                    <li key={i} className="text-sm text-slate-300">• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-blue-400 font-medium mb-2">Oportunidades</h5>
                <ul className="space-y-1">
                  {analysis.swot?.opportunities?.map((item, i) => (
                    <li key={i} className="text-sm text-slate-300">• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-yellow-400 font-medium mb-2">Ameaças</h5>
                <ul className="space-y-1">
                  {analysis.swot?.threats?.map((item, i) => (
                    <li key={i} className="text-sm text-slate-300">• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </GlowCard>

          {/* Opportunities & Barriers */}
          <div className="grid md:grid-cols-2 gap-4">
            <GlowCard glowColor="gold" className="p-6">
              <h4 className="text-white font-semibold mb-3">Oportunidades de Diferenciação</h4>
              <ul className="space-y-2">
                {analysis.differentiation_opportunities?.map((opp, i) => (
                  <li key={i} className="text-sm text-slate-300">✓ {opp}</li>
                ))}
              </ul>
            </GlowCard>

            <GlowCard glowColor="cyan" className="p-6">
              <h4 className="text-white font-semibold mb-3">Barreiras de Entrada</h4>
              <ul className="space-y-2">
                {analysis.entry_barriers?.map((barrier, i) => (
                  <li key={i} className="text-sm text-slate-300">⚠ {barrier}</li>
                ))}
              </ul>
            </GlowCard>
          </div>
        </div>
      )}
    </div>
  );
}