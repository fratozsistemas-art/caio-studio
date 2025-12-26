import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { MessageSquare, Send, Paperclip } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";
import moment from "moment";

export default function CommentSection({ ventureId, relatedEntity, relatedEntityId }) {
  const [comment, setComment] = useState('');
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const getUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    getUser();
  }, []);

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', ventureId, relatedEntity, relatedEntityId],
    queryFn: async () => {
      const query = { venture_id: ventureId };
      if (relatedEntity) query.related_entity = relatedEntity;
      if (relatedEntityId) query.related_entity_id = relatedEntityId;

      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureComment',
        operation: 'filter',
        query,
        sort: '-created_date'
      });
      return res.data?.data || [];
    }
  });

  const addComment = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureComment',
        operation: 'create',
        data: {
          ...data,
          venture_id: ventureId,
          author_email: user?.email,
          author_name: user?.full_name,
          related_entity: relatedEntity,
          related_entity_id: relatedEntityId
        }
      });

      // Log activity
      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ActivityLog',
        operation: 'create',
        data: {
          venture_id: ventureId,
          action_type: 'comment_added',
          description: `Novo comentário adicionado`,
          user_email: user?.email,
          user_name: user?.full_name,
          related_entity: 'comment',
          related_entity_id: res.data?.id
        }
      });

      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments']);
      queryClient.invalidateQueries(['activity']);
      setComment('');
      toast.success('Comentário adicionado');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addComment.mutate({ comment });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-[#C7A763]" />
        <h3 className="text-lg font-semibold text-white">Comentários</h3>
        <span className="text-sm text-slate-400">({comments.length})</span>
      </div>

      <form onSubmit={handleSubmit}>
        <GlowCard glowColor="gold" className="p-4">
          <Textarea
            placeholder="Adicione um comentário..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="bg-white/5 border-white/10 text-white mb-3"
            rows={3}
          />
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-400"
            >
              <Paperclip className="w-4 h-4 mr-2" />
              Anexar
            </Button>
            <Button
              type="submit"
              disabled={!comment.trim() || addComment.isPending}
              className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </div>
        </GlowCard>
      </form>

      <div className="space-y-3">
        {comments.map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlowCard glowColor="cyan" className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D4FF]/20 to-[#C7A763]/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-white">
                    {c.author_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{c.author_name}</span>
                    <span className="text-xs text-slate-500">
                      {moment(c.created_date).fromNow()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {c.comment}
                  </p>
                  {c.attachments && c.attachments.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {c.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#00D4FF] hover:underline"
                        >
                          📎 {att.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </GlowCard>
          </motion.div>
        ))}
        {comments.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            Nenhum comentário ainda. Seja o primeiro a comentar!
          </div>
        )}
      </div>
    </div>
  );
}