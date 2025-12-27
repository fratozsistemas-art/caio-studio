import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';

export default function ChannelAISummary({ channelId, messages }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const generateSummary = async () => {
    if (!messages || messages.length === 0) {
      toast.error('Nenhuma mensagem para resumir');
      return;
    }

    setLoading(true);
    try {
      const messagesText = messages
        .slice(-50) // Last 50 messages
        .map(m => `[${m.author_name}]: ${m.message}`)
        .join('\n');

      const prompt = `Você é um assistente de colaboração. Analise as seguintes mensagens de um canal e forneça:

${messagesText}

Gere um resumo estruturado com:
1. Resumo geral da discussão
2. Principais decisões tomadas
3. Action items identificados (com responsável se mencionado)
4. Próximos passos sugeridos
5. Questões em aberto`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            decisions: { type: "array", items: { type: "string" } },
            action_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  task: { type: "string" },
                  assignee: { type: "string" }
                }
              }
            },
            next_steps: { type: "array", items: { type: "string" } },
            open_questions: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSummary(response);
      toast.success('Resumo gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar resumo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={generateSummary}
        disabled={loading}
        variant="outline"
        className="border-2 border-[#00D4FF] bg-transparent hover:bg-[#00D4FF]/10 text-[#00D4FF] font-medium"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Gerando resumo...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Resumir com IA
          </>
        )}
      </Button>

      {summary && (
        <GlowCard glowColor="cyan" className="p-6">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00D4FF]" />
            Resumo da Discussão
          </h4>

          <div className="space-y-4">
            <div>
              <h5 className="text-slate-400 text-sm mb-2">Resumo Geral</h5>
              <div className="text-white text-sm prose prose-sm max-w-none">
                <ReactMarkdown>{summary.summary}</ReactMarkdown>
              </div>
            </div>

            {summary.decisions && summary.decisions.length > 0 && (
              <div>
                <h5 className="text-slate-400 text-sm mb-2">Decisões Tomadas</h5>
                <ul className="space-y-1">
                  {summary.decisions.map((decision, i) => (
                    <li key={i} className="text-white text-sm flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      {decision}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.action_items && summary.action_items.length > 0 && (
              <div>
                <h5 className="text-slate-400 text-sm mb-2">Action Items</h5>
                <div className="space-y-2">
                  {summary.action_items.map((item, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-white text-sm">{item.task}</p>
                      {item.assignee && (
                        <span className="text-xs text-[#C7A763] mt-1 inline-block">
                          Responsável: {item.assignee}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.next_steps && summary.next_steps.length > 0 && (
              <div>
                <h5 className="text-slate-400 text-sm mb-2">Próximos Passos</h5>
                <ul className="space-y-1">
                  {summary.next_steps.map((step, i) => (
                    <li key={i} className="text-white text-sm">→ {step}</li>
                  ))}
                </ul>
              </div>
            )}

            {summary.open_questions && summary.open_questions.length > 0 && (
              <div>
                <h5 className="text-slate-400 text-sm mb-2">Questões em Aberto</h5>
                <ul className="space-y-1">
                  {summary.open_questions.map((question, i) => (
                    <li key={i} className="text-white text-sm">? {question}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </GlowCard>
      )}
    </div>
  );
}