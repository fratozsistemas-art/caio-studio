import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Smile, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function VentureChat({ ventureId, ventureName }) {
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const getUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    getUser();
  }, []);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['venture-chat', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureComment',
        operation: 'filter',
        query: { venture_id: ventureId },
        sort: 'created_date'
      });
      return res.data?.data || [];
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    enabled: !!ventureId
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureComment',
        operation: 'create',
        data: messageData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['venture-chat', ventureId]);
      setMessage('');
      scrollToBottom();
    },
    onError: (error) => {
      toast.error('Erro ao enviar mensagem');
      console.error(error);
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (commentId) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureComment',
        operation: 'delete',
        id: commentId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['venture-chat', ventureId]);
      toast.success('Mensagem removida');
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const handleSend = () => {
    if (!message.trim() || !user) return;

    sendMessageMutation.mutate({
      venture_id: ventureId,
      comment: message.trim(),
      author_email: user.email,
      author_name: user.full_name,
      related_entity: 'chat'
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <GlowCard className="p-6">
        <div className="text-center text-slate-400">Carregando chat...</div>
      </GlowCard>
    );
  }

  return (
    <GlowCard className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Chat - {ventureName}</h3>
        <p className="text-xs text-slate-400">{comments?.length || 0} mensagens</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {comments?.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex gap-3 ${comment.author_email === user?.email ? 'flex-row-reverse' : ''}`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C7A763]/30 to-[#00D4FF]/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-white">
                  {comment.author_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>

              <div className={`flex-1 max-w-[70%] ${comment.author_email === user?.email ? 'items-end' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-white">{comment.author_name}</span>
                  <span className="text-xs text-slate-500">
                    {format(new Date(comment.created_date), "HH:mm", { locale: ptBR })}
                  </span>
                </div>

                <div className={`relative group rounded-2xl p-3 ${
                  comment.author_email === user?.email
                    ? 'bg-[#C7A763]/20 border border-[#C7A763]/30'
                    : 'bg-white/5 border border-white/10'
                }`}>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap break-words">
                    {comment.comment}
                  </p>

                  {comment.author_email === user?.email && (
                    <button
                      onClick={() => deleteMessageMutation.mutate(comment.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-white/5 border-white/10 text-white"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </GlowCard>
  );
}