import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Brain, Users, Target, Loader2, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function AICollaborationAssistant({ venture, ventures, currentUser }) {
  const [taskDescription, setTaskDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const { data: allTalentsResponse } = useQuery({
    queryKey: ['allTalents'],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTalent',
        operation: 'list'
      });
      return response.data;
    }
  });

  const allTalents = allTalentsResponse?.data || [];
  const ventureTalents = allTalents.filter(t => t.venture_id === venture.id);

  const suggestCollaborators = async () => {
    if (!taskDescription.trim()) {
      toast.error('Descreva a tarefa ou desafio');
      return;
    }

    setAnalyzing(true);
    try {
      const prompt = `
Você é um consultor de colaboração e gestão de talentos.

CONTEXTO:
Venture: ${venture.name}
Descrição: ${venture.description}
Layer: ${venture.layer}

TALENTOS DISPONÍVEIS:
${allTalents.map(t => `- ${t.talent_name} (${t.role}) - Skills: ${t.skills?.join(', ')} - Venture: ${ventures.find(v => v.id === t.venture_id)?.name}`).join('\n')}

TAREFA/DESAFIO:
${taskDescription}

ANÁLISE:
Sugira os melhores colaboradores para esta tarefa considerando:
1. Skills relevantes
2. Experiência (nível de senioridade)
3. Disponibilidade (alocação atual)
4. Sinergia com a venture
5. Possibilidade de colaboração cross-venture

Forneça recomendações em JSON.
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            primary_collaborators: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  role: { type: "string" },
                  reasoning: { type: "string" },
                  skills_match: { type: "string" }
                }
              }
            },
            alternative_collaborators: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  role: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            },
            cross_venture_opportunities: {
              type: "array",
              items: { type: "string" }
            },
            collaboration_strategy: { type: "string" }
          }
        }
      });

      setSuggestions(response);
      toast.success('Análise concluída!');
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="gold" className="p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-[#C7A763]" />
          Assistente de Colaboração IA
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          Descreva uma tarefa ou desafio e a IA sugerirá os melhores colaboradores
        </p>
        <Textarea
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          placeholder="Ex: Precisamos desenvolver uma nova feature de IA para o produto..."
          className="bg-white/5 border-white/10 text-white mb-4"
          rows={4}
        />
        <Button
          onClick={suggestCollaborators}
          disabled={analyzing || !taskDescription.trim()}
          className="w-full bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Sugerir Colaboradores
            </>
          )}
        </Button>
      </GlowCard>

      {suggestions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {suggestions.collaboration_strategy && (
            <GlowCard glowColor="cyan" className="p-6">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#00D4FF]" />
                Estratégia de Colaboração
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                {suggestions.collaboration_strategy}
              </p>
            </GlowCard>
          )}

          {suggestions.primary_collaborators?.length > 0 && (
            <GlowCard glowColor="gold" className="p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C7A763]" />
                Colaboradores Recomendados
              </h4>
              <div className="space-y-3">
                {suggestions.primary_collaborators.map((collab, i) => (
                  <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="text-white font-medium">{collab.name}</h5>
                        <p className="text-sm text-[#C7A763]">{collab.role}</p>
                      </div>
                      {i === 0 && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          Melhor Match
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{collab.reasoning}</p>
                    <p className="text-xs text-slate-400">
                      <span className="text-[#00D4FF]">Skills:</span> {collab.skills_match}
                    </p>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          {suggestions.alternative_collaborators?.length > 0 && (
            <GlowCard glowColor="mixed" className="p-6">
              <h4 className="text-white font-semibold mb-4">Alternativas</h4>
              <div className="space-y-2">
                {suggestions.alternative_collaborators.map((collab, i) => (
                  <div key={i} className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white text-sm">{collab.name}</span>
                        <span className="text-slate-400 text-xs ml-2">({collab.role})</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{collab.reasoning}</p>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          {suggestions.cross_venture_opportunities?.length > 0 && (
            <GlowCard glowColor="cyan" className="p-6">
              <h4 className="text-white font-semibold mb-3">Oportunidades Cross-Venture</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                {suggestions.cross_venture_opportunities.map((opp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#00D4FF] mt-1">→</span>
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            </GlowCard>
          )}
        </motion.div>
      )}

      {!suggestions && (
        <GlowCard glowColor="mixed" className="p-12">
          <div className="text-center space-y-3">
            <Brain className="w-12 h-12 mx-auto text-[#C7A763] opacity-30" />
            <p className="text-slate-400">
              Descreva uma tarefa acima para receber sugestões de colaboradores
            </p>
          </div>
        </GlowCard>
      )}
    </div>
  );
}