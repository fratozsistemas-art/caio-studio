import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, MessageCircle, Archive, Lock, Users, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useVenturePermissions } from './useVenturePermissions';

const priorityColors = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  normal: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  urgent: 'bg-red-500/20 text-red-400 border-red-500/30'
};

export default function ThreadedChat({ ventureId, ventureName }) {
  const [selectedThread, setSelectedThread] = useState(null);
  const [message, setMessage] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { canView, canEdit } = useVenturePermissions(ventureId, 'chat');

  const [newThread, setNewThread] = useState({
    title: '',
    description: '',
    priority: 'normal',
    tags: ''
  });

  useEffect(() => {
    const getUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    getUser();
  }, []);

  const { data: threads, isLoading: threadsLoading } = useQuery({
    queryKey: ['chat-threads', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ChatThread',
        operation: 'filter',
        query: { venture_id: ventureId },
        sort: '-created_date'
      });
      return res.data?.data || [];
    },
    enabled: !!ventureId && canView
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['thread-messages', selectedThread?.id],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureComment',
        operation: 'filter',
        query: { 
          venture_id: ventureId,
          related_entity: 'chat_thread',
          related_entity_id: selectedThread.id
        },
        sort: 'created_date'
      });
      return res.data?.data || [];
    },
    refetchInterval: 5000,
    enabled: !!selectedThread?.id && canView
  });

  const createThreadMutation = useMutation({
    mutationFn: async (threadData) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ChatThread',
        operation: 'create',
        data: threadData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-threads', ventureId]);
      setShowNewThread(false);
      setNewThread({ title: '', description: '', priority: 'normal', tags: '' });
      toast.success('Tópico criado');
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureComment',
        operation: 'create',
        data: messageData
      });
    },
    onSuccess: async () => {
      // Update thread message count
      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ChatThread',
        operation: 'update',
        id: selectedThread.id,
        data: { message_count: (selectedThread.message_count || 0) + 1 }
      });
      
      queryClient.invalidateQueries(['thread-messages', selectedThread?.id]);
      queryClient.invalidateQueries(['chat-threads', ventureId]);
      setMessage('');
    }
  });

  const handleCreateThread = () => {
    if (!newThread.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    createThreadMutation.mutate({
      venture_id: ventureId,
      title: newThread.title,
      description: newThread.description,
      priority: newThread.priority,
      tags: newThread.tags.split(',').map(t => t.trim()).filter(Boolean),
      created_by: user?.email,
      participants: [user?.email]
    });
  };

  const handleSendMessage = () => {
    if (!message.trim() || !selectedThread) return;

    sendMessageMutation.mutate({
      venture_id: ventureId,
      comment: message.trim(),
      author_email: user?.email,
      author_name: user?.full_name,
      related_entity: 'chat_thread',
      related_entity_id: selectedThread.id
    });
  };

  if (!canView) {
    return (
      <GlowCard className="p-8 text-center">
        <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-400">Você não tem permissão para visualizar o chat desta venture.</p>
      </GlowCard>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4 h-[700px]">
      {/* Threads List */}
      <GlowCard className="p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Tópicos</h3>
          {canEdit && (
            <Dialog open={showNewThread} onOpenChange={setShowNewThread}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]">
                  <Plus className="w-3 h-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0a1628] border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Novo Tópico</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Título *"
                    value={newThread.title}
                    onChange={(e) => setNewThread({...newThread, title: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Textarea
                    placeholder="Descrição"
                    value={newThread.description}
                    onChange={(e) => setNewThread({...newThread, description: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Select value={newThread.priority} onValueChange={(v) => setNewThread({...newThread, priority: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Tags (separadas por vírgula)"
                    value={newThread.tags}
                    onChange={(e) => setNewThread({...newThread, tags: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Button onClick={handleCreateThread} className="w-full bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]">
                    Criar Tópico
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-2">
          {threads?.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setSelectedThread(thread)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                selectedThread?.id === thread.id
                  ? 'bg-[#C7A763]/20 border border-[#C7A763]/30'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium text-white line-clamp-1">{thread.title}</h4>
                <Badge className={`text-xs ${priorityColors[thread.priority]}`}>
                  {thread.priority}
                </Badge>
              </div>
              {thread.description && (
                <p className="text-xs text-slate-400 line-clamp-2 mb-2">{thread.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MessageCircle className="w-3 h-3" />
                {thread.message_count || 0} mensagens
              </div>
            </button>
          ))}
        </div>
      </GlowCard>

      {/* Messages */}
      <GlowCard className="lg:col-span-2 flex flex-col">
        {selectedThread ? (
          <>
            <div className="p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white mb-1">{selectedThread.title}</h3>
              {selectedThread.description && (
                <p className="text-sm text-slate-400">{selectedThread.description}</p>
              )}
              {selectedThread.tags && selectedThread.tags.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {selectedThread.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages?.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.author_email === user?.email ? 'flex-row-reverse' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C7A763]/30 to-[#00D4FF]/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-white">
                      {msg.author_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>

                  <div className="flex-1 max-w-[70%]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-white">{msg.author_name}</span>
                      <span className="text-xs text-slate-500">
                        {format(new Date(msg.created_date), "HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className={`rounded-2xl p-3 ${
                      msg.author_email === user?.email
                        ? 'bg-[#C7A763]/20 border border-[#C7A763]/30'
                        : 'bg-white/5 border border-white/10'
                    }`}>
                      <p className="text-sm text-slate-200 whitespace-pre-wrap">{msg.comment}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {canEdit && (
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 bg-white/5 border-white/10 text-white"
                  />
                  <Button onClick={handleSendMessage} className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">Selecione um tópico para ver as mensagens</p>
            </div>
          </div>
        )}
      </GlowCard>
    </div>
  );
}