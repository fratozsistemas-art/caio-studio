import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, ExternalLink, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GlowCard from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const QUIZ_URL = 'https://esuemi.com.br';

export default function QuizIntegration({ talent }) {
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualScore, setManualScore] = useState('');
  const queryClient = useQueryClient();

  const updateQuizMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Talent',
        operation: 'update',
        id: talent.id,
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['talents']);
      queryClient.invalidateQueries(['talent', talent.id]);
      setShowManualDialog(false);
      setManualScore('');
      toast.success('Resultado do quiz atualizado!');
    }
  });

  const handleManualSubmit = () => {
    const score = parseFloat(manualScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error('Insira uma pontuação válida (0-100)');
      return;
    }

    updateQuizMutation.mutate({
      quiz_completed: true,
      quiz_score: score,
      quiz_completed_at: new Date().toISOString()
    });
  };

  const openQuiz = () => {
    window.open(`${QUIZ_URL}?talent_id=${talent.id}&email=${talent.email}`, '_blank');
    toast.info('Quiz aberto em nova aba. Após conclusão, registre o resultado manualmente.');
  };

  return (
    <GlowCard className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-white font-semibold flex items-center gap-2">
            Quiz de Avaliação esuemi
            {talent.quiz_completed && (
              <Badge className="bg-green-500/20 text-green-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completo
              </Badge>
            )}
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Avaliação comportamental e de competências
          </p>
        </div>
      </div>

      {talent.quiz_completed ? (
        <div className="space-y-3">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Pontuação</span>
              <span className="text-2xl font-bold text-[#C7A763]">
                {talent.quiz_score}/100
              </span>
            </div>
            {talent.quiz_completed_at && (
              <p className="text-xs text-slate-500">
                Concluído em {format(new Date(talent.quiz_completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>

          <Button
            onClick={() => setShowManualDialog(true)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Atualizar Resultado
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            O candidato ainda não completou o quiz de avaliação.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={openQuiz}
              className="flex-1 bg-[#C7A763] hover:bg-[#A88B4A]"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir Quiz
            </Button>
            <Button
              onClick={() => setShowManualDialog(true)}
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              Registrar
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="bg-[#0a1628] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Registrar Resultado do Quiz</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-white text-sm mb-2 block">Pontuação (0-100)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={manualScore}
                onChange={(e) => setManualScore(e.target.value)}
                placeholder="Ex: 85"
                className="bg-white/5 border-white/10 text-white"
              />
              <p className="text-xs text-slate-400 mt-1">
                Insira a pontuação obtida no quiz esuemi
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowManualDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleManualSubmit}
                disabled={updateQuizMutation.isPending}
                className="bg-[#C7A763] hover:bg-[#A88B4A]"
              >
                {updateQuizMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Resultado'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </GlowCard>
  );
}