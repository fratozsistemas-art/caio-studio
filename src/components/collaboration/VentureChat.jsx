import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Brain } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";
import moment from 'moment';

export default function VentureChat({ venture, currentUser }) {
  const [message, setMessage] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: commentsResponse, refetch } = useQuery({
    queryKey: ['ventureComments', venture.id],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureComment',
        operation: 'filter',
        query: { venture_id: venture.id, related_entity: null },
        sort: 'created_date'
      });
      return response.data;
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const comments = commentsResponse?.data || [];

  const sendMessage = useMutation({
    mutationFn: async (messageData) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureComment',
        operation: 'create',
        data: messageData
      });
    },
    onSuccess: () => {
      refetch();
      setMessage('');
    }
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    await sendMessage.mutateAsync({
      venture_id: venture.id,
      comment: message,
      author_email: currentUser.email,
      author_name: currentUser.full_name
    });
  };

  const generateSummary = async () => {
    if (comments.length === 0) {
      toast.error('Não há discussões para resumir');
      return;
    }

    setSummarizing(true);
    try {
      const discussionText = comments
        .map(c => `${c.author_name}: ${c.comment}`)
        .join('\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Resuma as seguintes discussões da venture "${venture.name}":

${discussionText}

Forneça um resumo executivo estruturado com:
- Principais tópicos discutidos
- Decisões tomadas
- Ações pendentes
- Pontos de atenção`,
        response_json_schema: {
          type: "object",
          properties: {
            main_topics: { type: "array", items: { type: "string" } },
            decisions: { type: "array", items: { type: "string" } },
            pending_actions: { type: "array", items: { type: "string" } },
            attention_points: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSummary(response);
      toast.success('Resumo gerado!');
    } catch (error) {
      toast.error('Erro ao gerar resumo: ' + error.message);
    } finally {
      setSummarizing(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  return (
    <div className="space-y-4">
      {summary && (
        <GlowCard glowColor="gold" className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-[#C7A763]" />
            <h4 className="text-white font-semibold">Resumo da Discussão (IA)</h4>
          </div>
          <div className="space-y-3 text-sm">
            {summary.main_topics?.length > 0 && (
              <div>
                <div className="text-slate-400 mb-1">Principais Tópicos:</div>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  {summary.main_topics.map((topic, i) => (
                    <li key={i}>{topic}</li>
                  ))}
                </ul>
              </div>
            )}
            {summary.decisions?.length > 0 && (
              <div>
                <div className="text-slate-400 mb-1">Decisões:</div>
                <ul className="list-disc list-inside text-green-400 space-y-1">
                  {summary.decisions.map((decision, i) => (
                    <li key={i}>{decision}</li>
                  ))}
                </ul>
              </div>
            )}
            {summary.pending_actions?.length > 0 && (
              <div>
                <div className="text-slate-400 mb-1">Ações Pendentes:</div>
                <ul className="list-disc list-inside text-orange-400 space-y-1">
                  {summary.pending_actions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </GlowCard>
      )}

      <GlowCard glowColor="cyan" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Chat da Venture</h3>
          <Button
            onClick={generateSummary}
            disabled={summarizing || comments.length === 0}
            size="sm"
            variant="outline"
            className="border-white/10 text-white"
          >
            {summarizing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Brain className="w-4 h-4 mr-2" />
            )}
            Resumir Discussão
          </Button>
        </div>

        <div className="space-y-3 mb-4 h-96 overflow-y-auto bg-white/5 rounded-lg p-4">
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${comment.author_email === currentUser.email ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    comment.author_email === currentUser.email
                      ? 'bg-[#C7A763]/20 text-white'
                      : 'bg-white/10 text-slate-200'
                  }`}
                >
                  <div className="text-xs text-slate-400 mb-1">{comment.author_name}</div>
                  <div className="text-sm whitespace-pre-wrap">{comment.comment}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {moment(comment.created_date).fromNow()}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-white/5 border-white/10 text-white resize-none"
            rows={2}
          />
          <Button
            type="submit"
            disabled={!message.trim() || sendMessage.isPending}
            className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </GlowCard>
    </div>
  );
}