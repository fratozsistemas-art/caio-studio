import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommentBox({ entityType, entityId, entityName }) {
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const getUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    getUser();
  }, []);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureComment',
        operation: 'filter',
        query: { entity_type: entityType, entity_id: entityId },
        sort: '-created_date'
      });
      return res.data?.data || [];
    },
    enabled: !!entityId
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentText) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureComment',
        operation: 'create',
        data: {
          entity_type: entityType,
          entity_id: entityId,
          comment_text: commentText,
          author_email: user?.email,
          author_name: user?.full_name
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', entityType, entityId]);
      setNewComment('');
      toast.success('Comentário adicionado');
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureComment',
        operation: 'delete',
        id: commentId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', entityType, entityId]);
      toast.success('Comentário removido');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error('Escreva um comentário');
      return;
    }
    addCommentMutation.mutate(newComment);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <MessageSquare className="w-4 h-4" />
        <span>Comentários em {entityName}</span>
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Adicione um comentário..."
          className="bg-white/5 border-white/10 text-white resize-none"
          rows={2}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={addCommentMutation.isPending}
            className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]"
          >
            <Send className="w-3 h-3 mr-2" />
            Comentar
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-xs text-slate-400">Carregando comentários...</p>
        ) : comments?.length > 0 ? (
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/5 border border-white/10 rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {comment.author_name || comment.author_email}
                    </p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(comment.created_date), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  {user?.email === comment.author_email && (
                    <button
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-300">{comment.comment_text}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <p className="text-xs text-slate-400">Nenhum comentário ainda</p>
        )}
      </div>
    </div>
  );
}