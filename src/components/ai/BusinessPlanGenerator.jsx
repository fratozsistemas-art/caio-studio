import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Sparkles, FileText, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';

export default function BusinessPlanGenerator({ onGenerated }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    venture_name: '',
    description: '',
    target_market: '',
    problem_solving: ''
  });
  const [businessPlan, setBusinessPlan] = useState(null);

  const generatePlan = async () => {
    if (!formData.venture_name || !formData.description) {
      toast.error('Nome e descrição são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const prompt = `Você é um consultor de negócios experiente. Crie um plano de negócios detalhado para a seguinte venture:

Nome: ${formData.venture_name}
Descrição: ${formData.description}
Mercado-alvo: ${formData.target_market || 'não especificado'}
Problema que resolve: ${formData.problem_solving || 'não especificado'}

Gere um plano de negócios estruturado em formato JSON com as seguintes seções:
- executive_summary: resumo executivo conciso
- value_proposition: proposta de valor única
- market_opportunity: análise de oportunidade de mercado
- business_model: modelo de negócio detalhado
- go_to_market: estratégia de entrada no mercado
- competitive_advantage: vantagens competitivas
- revenue_streams: fontes de receita
- key_metrics: métricas-chave para medir sucesso
- risks_mitigation: principais riscos e estratégias de mitigação
- team_requirements: requisitos de equipe e habilidades necessárias`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            value_proposition: { type: "string" },
            market_opportunity: { type: "string" },
            business_model: { type: "string" },
            go_to_market: { type: "string" },
            competitive_advantage: { type: "string" },
            revenue_streams: { type: "string" },
            key_metrics: { type: "string" },
            risks_mitigation: { type: "string" },
            team_requirements: { type: "string" }
          }
        }
      });

      setBusinessPlan(response);
      onGenerated?.(response);
      toast.success('Plano de negócios gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar plano: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="gold" className="p-6">
        <div className="space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C7A763]" />
            Gerador de Plano de Negócios com IA
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white/70 mb-2 block">Nome da Venture *</Label>
              <Input
                value={formData.venture_name}
                onChange={(e) => setFormData(prev => ({ ...prev, venture_name: e.target.value }))}
                placeholder="Ex: HealthTech Solutions"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white/70 mb-2 block">Mercado-alvo</Label>
              <Input
                value={formData.target_market}
                onChange={(e) => setFormData(prev => ({ ...prev, target_market: e.target.value }))}
                placeholder="Ex: Empresas de médio porte"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-white/70 mb-2 block">Descrição *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva brevemente a ideia da venture..."
              className="bg-white/5 border-white/10 text-white h-24"
            />
          </div>

          <div>
            <Label className="text-white/70 mb-2 block">Problema que resolve</Label>
            <Textarea
              value={formData.problem_solving}
              onChange={(e) => setFormData(prev => ({ ...prev, problem_solving: e.target.value }))}
              placeholder="Que problema específico a venture resolve?"
              className="bg-white/5 border-white/10 text-white h-20"
            />
          </div>

          <Button
            onClick={generatePlan}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F] font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando plano...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Plano de Negócios
              </>
            )}
          </Button>
        </div>
      </GlowCard>

      {businessPlan && (
        <div className="space-y-4">
          {Object.entries(businessPlan).map(([key, value]) => (
            <GlowCard key={key} glowColor="cyan" className="p-6">
              <h4 className="text-white font-semibold mb-3 capitalize flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#00D4FF]" />
                {key.replace(/_/g, ' ')}
              </h4>
              <div className="text-slate-300 text-sm prose prose-sm max-w-none">
                <ReactMarkdown>{value}</ReactMarkdown>
              </div>
            </GlowCard>
          ))}
        </div>
      )}
    </div>
  );
}