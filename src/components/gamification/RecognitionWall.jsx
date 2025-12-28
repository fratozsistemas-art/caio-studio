import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, MessageCircle, Award, Sparkles, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { createPageUrl } from "@/utils";

const RECOGNITION_TYPES = {
  excellent_work: { label: 'Trabalho Excelente', icon: '⭐', color: 'from-yellow-500 to-yellow-600' },
  team_collaboration: { label: 'Colaboração em Equipe', icon: '🤝', color: 'from-blue-500 to-blue-600' },
  innovation: { label: 'Inovação', icon: '💡', color: 'from-purple-500 to-purple-600' },
  helping_others: { label: 'Ajudando Outros', icon: '🙌', color: 'from-green-500 to-green-600' },
  leadership: { label: 'Liderança', icon: '👑', color: 'from-indigo-500 to-indigo-600' },
  dedication: { label: 'Dedicação', icon: '🔥', color: 'from-red-500 to-red-600' },
  problem_solving: { label: 'Resolução de Problemas', icon: '🧩', color: 'from-cyan-500 to-cyan-600' }
};

export default function RecognitionWall() {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    to_talent_id: '',
    recognition_type: 'excellent_work',
    message: '',
    is_public: true
  });
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const fetchUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  const { data: recognitions = [] } = useQuery({
    queryKey: ['public-recognitions'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Recognition',
        operation: 'filter',
        query: { is_public: true },
        sort: '-created_date'
      });
      return res.data?.data || [];
    }
  });

  const { data: talents = [] } = useQuery({
    queryKey: ['talents'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Talent',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const recognition = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Recognition',
        operation: 'create',
        data
      });
      
      // Create notification for recipient
      const talent = talents.find(t => t.id === data.to_talent_id);
      if (talent?.email) {
        await base44.functions.invoke('createNotification', {
          user_email: talent.email,
          type: 'recognition_received',
          title: '🌟 Você recebeu um reconhecimento!',
          message: `${data.from_name} reconheceu você por ${RECOGNITION_TYPES[data.recognition_type]?.label}`,
          action_url: createPageUrl('GamificationHub')
        });
      }
      
      return recognition;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['public-recognitions']);
      setShowDialog(false);
      setFormData({
        to_talent_id: '',
        recognition_type: 'excellent_work',
        message: '',
        is_public: true
      });
      toast.success('Reconhecimento enviado! 🎉');
    }
  });

  const likeMutation = useMutation({
    mutationFn: async ({ id, likes }) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Recognition',
        operation: 'update',
        id,
        data: { likes }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['public-recognitions']);
    }
  });

  const handleSubmit = () => {
    if (!formData.to_talent_id || !formData.message) {
      toast.error('Preencha todos os campos');
      return;
    }

    const selectedTalent = talents.find(t => t.id === formData.to_talent_id);
    createMutation.mutate({
      ...formData,
      from_email: currentUser.email,
      from_name: currentUser.full_name,
      to_name: selectedTalent?.full_name,
      likes: []
    });
  };

  const handleLike = (recognition) => {
    const likes = recognition.likes || [];
    const userEmail = currentUser?.email;
    
    if (likes.includes(userEmail)) {
      likeMutation.mutate({
        id: recognition.id,
        likes: likes.filter(email => email !== userEmail)
      });
    } else {
      likeMutation.mutate({
        id: recognition.id,
        likes: [...likes, userEmail]
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#C7A763]" />
            Mural de Reconhecimento
          </h3>
          <p className="text-sm text-slate-400 mt-1">Celebre conquistas e destaque o trabalho da equipe</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-gradient-to-r from-[#C7A763] to-[#00D4FF]">
          <Plus className="w-4 h-4 mr-2" />
          Reconhecer Alguém
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {recognitions.map((recognition, idx) => {
          const config = RECOGNITION_TYPES[recognition.recognition_type];
          const isLiked = recognition.likes?.includes(currentUser?.email);
          
          return (
            <motion.div
              key={recognition.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <GlowCard className="p-5 hover:scale-[1.02] transition-transform">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${config?.color} flex items-center justify-center text-2xl mb-3`}>
                  {config?.icon}
                </div>
                
                <div className="mb-3">
                  <div className="text-sm text-[#C7A763] font-medium">{config?.label}</div>
                  <div className="text-white font-semibold mt-1">{recognition.to_name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    por {recognition.from_name} • {format(new Date(recognition.created_date), "dd MMM", { locale: ptBR })}
                  </div>
                </div>

                <p className="text-slate-300 text-sm mb-4 italic">"{recognition.message}"</p>

                <div className="flex items-center gap-4 pt-3 border-t border-white/10">
                  <button
                    onClick={() => handleLike(recognition)}
                    className={`flex items-center gap-1.5 transition-colors ${
                      isLiked ? 'text-red-400' : 'text-slate-400 hover:text-red-400'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="text-sm">{recognition.likes?.length || 0}</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Award className="w-4 h-4" />
                    <span className="text-sm">+{recognition.points_awarded || 5} pts</span>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          );
        })}
      </div>

      {recognitions.length === 0 && (
        <GlowCard className="p-12 text-center">
          <Sparkles className="w-16 h-16 text-slate-400 mx-auto mb-4 opacity-30" />
          <p className="text-slate-400 mb-4">Seja o primeiro a reconhecer alguém da equipe!</p>
          <Button onClick={() => setShowDialog(true)} variant="outline">
            Começar Agora
          </Button>
        </GlowCard>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#0a1628] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Reconhecer Colega</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-white text-sm mb-2 block">Quem você quer reconhecer?</label>
              <Select value={formData.to_talent_id} onValueChange={(v) => setFormData({...formData, to_talent_id: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione um talento..." />
                </SelectTrigger>
                <SelectContent>
                  {talents.map(talent => (
                    <SelectItem key={talent.id} value={talent.id}>
                      {talent.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white text-sm mb-2 block">Tipo de Reconhecimento</label>
              <Select value={formData.recognition_type} onValueChange={(v) => setFormData({...formData, recognition_type: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RECOGNITION_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.icon} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white text-sm mb-2 block">Mensagem</label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Escreva uma mensagem de reconhecimento..."
                className="bg-white/5 border-white/10 text-white min-h-[100px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                className="rounded"
              />
              <label className="text-white text-sm">Tornar público no mural</label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="bg-gradient-to-r from-[#C7A763] to-[#00D4FF]"
              >
                Enviar Reconhecimento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}