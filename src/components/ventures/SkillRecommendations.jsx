import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Brain, Users, Zap, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function SkillRecommendations({ ventures, talents }) {
  const [selectedVentureId, setSelectedVentureId] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  const venture = ventures.find(v => v.id === selectedVentureId);

  const getRecommendations = async () => {
    if (!selectedVentureId && !taskDescription) {
      toast.error('Selecione uma venture ou descreva uma tarefa');
      return;
    }

    setAnalyzing(true);
    try {
      // Prepare talent data
      const talentData = talents.map(t => ({
        name: t.talent_name,
        role: t.role,
        skills: t.skills || [],
        level: t.level,
        allocation: t.allocation,
        performance_score: t.performance_score || 0
      }));

      const prompt = `
Analise os talentos disponíveis e recomende os mais adequados:

${venture ? `VENTURE: ${venture.name} (${venture.layer} - ${venture.category})` : ''}
${taskDescription ? `TAREFA/NECESSIDADE: ${taskDescription}` : ''}

TALENTOS DISPONÍVEIS:
${talentData.map(t => `
- ${t.name} (${t.role}, ${t.level})
  Skills: ${t.skills.join(', ')}
  Alocação: ${t.allocation}%
  Performance: ${t.performance_score}/100
`).join('\n')}

Forneça recomendações em JSON:
- top_matches (array de objetos com: talent_name, match_score, reasoning, suggested_role)
- skill_alignment (análise de skills)
- allocation_recommendations (sugestões de alocação)
- alternative_suggestions (backups)
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            top_matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  talent_name: { type: "string" },
                  match_score: { type: "number" },
                  reasoning: { type: "string" },
                  suggested_role: { type: "string" }
                }
              }
            },
            skill_alignment: { type: "string" },
            allocation_recommendations: { type: "string" },
            alternative_suggestions: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setRecommendations(response);
      toast.success('Recomendações geradas!');
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const getMatchColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-[#C7A763]" />
        <h3 className="text-lg font-semibold text-white">Recomendações de Talentos com IA</h3>
      </div>

      <GlowCard glowColor="gold" className="p-6 space-y-4">
        <Select value={selectedVentureId} onValueChange={setSelectedVentureId}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Selecione uma venture (opcional)" />
          </SelectTrigger>
          <SelectContent>
            {ventures.map(v => (
              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div>
          <label className="text-sm text-slate-300 mb-2 block">
            Descreva a tarefa ou necessidade
          </label>
          <Textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Ex: Precisamos de um desenvolvedor full-stack com experiência em React e Node.js para construir um dashboard..."
            className="bg-white/5 border-white/10 text-white"
            rows={4}
          />
        </div>

        <Button
          onClick={getRecommendations}
          disabled={analyzing || (!selectedVentureId && !taskDescription)}
          className="w-full bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Gerar Recomendações
            </>
          )}
        </Button>
      </GlowCard>

      {recommendations && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h4 className="text-white font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#00D4FF]" />
            Top Matches
          </h4>

          {recommendations.top_matches?.map((match, index) => (
            <GlowCard key={index} glowColor="cyan" className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className="text-white font-medium">{match.talent_name}</h5>
                    <span className={`text-sm font-bold ${getMatchColor(match.match_score)}`}>
                      {match.match_score}% match
                    </span>
                  </div>
                  <div className="text-sm text-[#00D4FF] mb-2">{match.suggested_role}</div>
                  <p className="text-sm text-slate-300">{match.reasoning}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`text-2xl font-bold ${getMatchColor(match.match_score)}`}>
                    {match.match_score}
                  </div>
                  <div className="text-xs text-slate-400">score</div>
                </div>
              </div>
            </GlowCard>
          ))}

          <GlowCard glowColor="mixed" className="p-4">
            <h5 className="text-white font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#C7A763]" />
              Análise de Skills
            </h5>
            <p className="text-sm text-slate-300 leading-relaxed">
              {recommendations.skill_alignment}
            </p>
          </GlowCard>

          <GlowCard glowColor="gold" className="p-4">
            <h5 className="text-white font-medium mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#C7A763]" />
              Recomendações de Alocação
            </h5>
            <p className="text-sm text-slate-300 leading-relaxed">
              {recommendations.allocation_recommendations}
            </p>
          </GlowCard>

          {recommendations.alternative_suggestions?.length > 0 && (
            <GlowCard glowColor="cyan" className="p-4">
              <h5 className="text-white font-medium mb-2">Alternativas</h5>
              <ul className="space-y-1">
                {recommendations.alternative_suggestions.map((alt, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#00D4FF]" />
                    {alt}
                  </li>
                ))}
              </ul>
            </GlowCard>
          )}
        </motion.div>
      )}
    </div>
  );
}