import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, ThumbsUp, Flag, Shield, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PublicComments({ ventureId, ventureName }) {
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          setIsAuthenticated(true);
          setName(user.full_name);
          setEmail(user.email);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['public-comments', ventureId],
    queryFn: async () => {
      const res = await base44.entities.VentureComment.filter({
        venture_id: ventureId,
        related_entity: 'public_feedback'
      }, '-created_date', 50);
      return res || [];
    },
    enabled: !!ventureId
  });

  const submitCommentMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.VentureComment.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['public-comments', ventureId]);
      setComment('');
      if (!isAuthenticated) {
        setName('');
        setEmail('');
      }
      toast.success('Comentário enviado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao enviar comentário');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      toast.error('Por favor, escreva um comentário');
      return;
    }

    if (!isAuthenticated && !isAnonymous && (!name.trim() || !email.trim())) {
      toast.error('Por favor, preencha nome e email ou comente anonimamente');
      return;
    }

    submitCommentMutation.mutate({
      venture_id: ventureId,
      comment: comment.trim(),
      author_name: isAnonymous ? 'Anônimo' : name.trim(),
      author_email: isAnonymous ? 'anonymous@system' : email.trim(),
      related_entity: 'public_feedback'
    });
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="cyan" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4FF]/20 to-[#C7A763]/20 border border-white/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-[#00D4FF]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Comentários e Feedback</h3>
            <p className="text-xs text-slate-400">{comments?.length || 0} comentários</p>
          </div>
        </div>

        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isAuthenticated && (
            <>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-white">Comentar anonimamente</span>
                </div>
                <Switch
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
              </div>
              {!isAnonymous && (
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Seu nome *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Seu email *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
              )}
            </>
          )}

          <Textarea
            placeholder="Compartilhe sua opinião, sugestão ou pergunta sobre esta venture..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="bg-white/5 border-white/10 text-white min-h-[100px]"
            required
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {isAuthenticated ? 'Comentando como usuário autenticado' : 'Comentários públicos são moderados'}
            </span>
            <Button
              type="submit"
              disabled={submitCommentMutation.isPending}
              className="bg-[#00D4FF] hover:bg-[#00B8E6] text-[#06101F]"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar Comentário
            </Button>
          </div>
        </form>
      </GlowCard>

      {/* Comments List */}
      <div className="space-y-4">
        <AnimatePresence>
          {isLoading ? (
            <div className="text-center text-slate-400 py-8">Carregando comentários...</div>
          ) : comments?.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
            </div>
          ) : (
            comments?.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <GlowCard className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C7A763]/30 to-[#00D4FF]/30 flex items-center justify-center flex-shrink-0">
                      {c.author_name === 'Anônimo' ? (
                        <EyeOff className="w-5 h-5 text-slate-400" />
                      ) : (
                        <span className="text-sm font-semibold text-white">
                          {c.author_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-white">
                          {c.author_name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(c.created_date), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>

                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {c.comment}
                      </p>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}