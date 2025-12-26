import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Send, Hash, Lock, Globe, Paperclip, Smile, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CollaborationChannels({ portfolios, squads }) {
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [channelFormData, setChannelFormData] = useState({
    name: '',
    description: '',
    type: 'general',
    portfolio_id: '',
    squad_id: '',
    is_private: false
  });

  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    const getUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };
    getUser();
  }, []);

  const { data: channels } = useQuery({
    queryKey: ['collaborationChannels'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'CollaborationChannel',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['channelMessages', selectedChannel?.id],
    queryFn: async () => {
      if (!selectedChannel) return [];
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ChannelMessage',
        operation: 'filter',
        query: { channel_id: selectedChannel.id }
      });
      return res.data?.data || [];
    },
    enabled: !!selectedChannel,
    refetchInterval: 5000 // Auto-refresh every 5 seconds
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'CollaborationChannel',
        operation: 'create',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['collaborationChannels']);
      toast.success('Canal criado!');
      setShowChannelForm(false);
      setChannelFormData({ name: '', description: '', type: 'general', portfolio_id: '', squad_id: '', is_private: false });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ChannelMessage',
        operation: 'create',
        data: messageData
      });
    },
    onSuccess: () => {
      refetchMessages();
      setMessageText('');
    }
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedChannel || !user) return;

    sendMessageMutation.mutate({
      channel_id: selectedChannel.id,
      author_email: user.email,
      author_name: user.full_name || user.email,
      message: messageText,
      message_type: 'text'
    });
  };

  const getChannelIcon = (type) => {
    switch (type) {
      case 'portfolio': return <Hash className="w-4 h-4 text-[#C7A763]" />;
      case 'squad': return <MessageSquare className="w-4 h-4 text-[#00D4FF]" />;
      case 'strategic_objective': return <Globe className="w-4 h-4 text-purple-400" />;
      default: return <Hash className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      portfolio: 'Portfolio',
      squad: 'Squad',
      strategic_objective: 'Objetivo Estratégico',
      knowledge_sharing: 'Conhecimento',
      general: 'Geral'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-[#00D4FF]" />
          <h3 className="text-xl font-bold text-white">Canais de Colaboração</h3>
        </div>
        <Button
          onClick={() => setShowChannelForm(!showChannelForm)}
          className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Canal
        </Button>
      </div>

      {/* Channel Creation Form */}
      <AnimatePresence>
        {showChannelForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlowCard glowColor="cyan" className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/70 mb-2 block">Nome do Canal *</label>
                  <Input
                    value={channelFormData.name}
                    onChange={(e) => setChannelFormData({...channelFormData, name: e.target.value})}
                    placeholder="Ex: #marketing-estrategico"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70 mb-2 block">Tipo *</label>
                  <Select value={channelFormData.type} onValueChange={(v) => setChannelFormData({...channelFormData, type: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portfolio">Portfolio</SelectItem>
                      <SelectItem value="squad">Squad</SelectItem>
                      <SelectItem value="strategic_objective">Objetivo Estratégico</SelectItem>
                      <SelectItem value="knowledge_sharing">Compartilhamento de Conhecimento</SelectItem>
                      <SelectItem value="general">Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm text-white/70 mb-2 block">Descrição</label>
                <Textarea
                  value={channelFormData.description}
                  onChange={(e) => setChannelFormData({...channelFormData, description: e.target.value})}
                  placeholder="Descreva o propósito deste canal..."
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              {channelFormData.type === 'portfolio' && portfolios && (
                <div>
                  <label className="text-sm text-white/70 mb-2 block">Portfolio</label>
                  <Select value={channelFormData.portfolio_id} onValueChange={(v) => setChannelFormData({...channelFormData, portfolio_id: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Selecione um portfolio" />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolios.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {channelFormData.type === 'squad' && squads && (
                <div>
                  <label className="text-sm text-white/70 mb-2 block">Squad</label>
                  <Select value={channelFormData.squad_id} onValueChange={(v) => setChannelFormData({...channelFormData, squad_id: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Selecione um squad" />
                    </SelectTrigger>
                    <SelectContent>
                      {squads.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={channelFormData.is_private}
                  onChange={(e) => setChannelFormData({...channelFormData, is_private: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="private" className="text-sm text-white/70 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Canal Privado
                </label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => createChannelMutation.mutate(channelFormData)}
                  disabled={!channelFormData.name}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Criar Canal
                </Button>
                <Button
                  onClick={() => setShowChannelForm(false)}
                  variant="ghost"
                  className="text-white/70"
                >
                  Cancelar
                </Button>
              </div>
            </GlowCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Channels and Messages */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Channels Sidebar */}
        <GlowCard glowColor="mixed" className="p-4 lg:col-span-1">
          <h4 className="text-sm font-semibold text-white/80 mb-3">Canais</h4>
          <ScrollArea className="h-[500px]">
            <div className="space-y-1">
              {channels && channels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedChannel?.id === channel.id
                      ? 'bg-[#00D4FF]/20 border border-[#00D4FF]/30'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getChannelIcon(channel.type)}
                    <span className="text-sm font-medium text-white truncate">
                      {channel.name}
                    </span>
                    {channel.is_private && <Lock className="w-3 h-3 text-slate-400" />}
                  </div>
                  <Badge variant="outline" className="border-white/20 text-xs">
                    {getTypeLabel(channel.type)}
                  </Badge>
                </button>
              ))}
            </div>
          </ScrollArea>
        </GlowCard>

        {/* Messages Area */}
        <GlowCard glowColor="gold" className="p-6 lg:col-span-3">
          {selectedChannel ? (
            <div className="flex flex-col h-[500px]">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getChannelIcon(selectedChannel.type)}
                    <h4 className="text-lg font-bold text-white">{selectedChannel.name}</h4>
                  </div>
                  {selectedChannel.description && (
                    <p className="text-sm text-slate-400">{selectedChannel.description}</p>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-3 pr-4">
                  {messages && messages.length > 0 ? (
                    messages.map((msg, i) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#C7A763] flex items-center justify-center text-white text-xs font-bold">
                            {msg.author_name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-white">{msg.author_name}</span>
                              <span className="text-xs text-slate-500">
                                {new Date(msg.created_date).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-sm text-slate-300 whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Nenhuma mensagem ainda</p>
                      <p className="text-xs mt-1">Seja o primeiro a iniciar a conversa!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-white/5 border-white/10 text-white"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  className="bg-[#00D4FF] hover:bg-[#0099CC] text-[#06101F]"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-[500px] flex items-center justify-center text-slate-400">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Selecione um canal para ver as mensagens</p>
              </div>
            </div>
          )}
        </GlowCard>
      </div>
    </div>
  );
}