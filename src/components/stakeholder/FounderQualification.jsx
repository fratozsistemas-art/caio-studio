import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Loader2, Rocket } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function FounderQualification({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    linkedin_url: '',
    venture_stage: '',
    domain_expertise: '',
    commitment_level: '',
    biggest_gap: '',
    timeline: '',
    venture_description: '',
    problem_solving: '',
    target_market: ''
  });

  const calculateScore = () => {
    let score = 0;
    
    if (formData.commitment_level === 'full_time') score += 30;
    else if (formData.commitment_level === 'planning') score += 15;
    
    if (formData.venture_stage === 'revenue') score += 25;
    else if (formData.venture_stage === 'mvp') score += 20;
    else if (formData.venture_stage === 'idea') score += 10;
    
    if (formData.domain_expertise === 'both') score += 25;
    else if (formData.domain_expertise === 'tech' || formData.domain_expertise === 'industry') score += 15;
    
    if (formData.timeline === '3mo' || formData.timeline === '6mo') score += 20;
    
    return score;
  };

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.email) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const score = calculateScore();
      const status = score >= 60 ? 'qualified' : 'new';
      const stage = 'discovery';
      
      // Determine auto role based on score
      let autoRole = 'Viewer';
      if (score >= 80) autoRole = 'Editor';
      else if (score >= 60) autoRole = 'Viewer';

      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'StakeholderLead',
        operation: 'create',
        data: {
          stakeholder_type: 'founder',
          ...formData,
          qualification_answers: formData,
          qualification_score: score,
          status,
          stage,
          auto_assigned_role: autoRole,
          next_action: score >= 60 ? 'Agendar discovery call' : 'Revisar aplicação',
          next_action_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      });

      toast.success('Aplicação enviada com sucesso!');
      
      if (score >= 60) {
        toast.success('Parabéns! Você foi qualificado para próxima etapa.');
      } else {
        toast.info('Recebemos sua aplicação. Em breve entraremos em contato.');
      }

      onComplete?.();
    } catch (error) {
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="cyan" className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <Rocket className="w-6 h-6 text-[#00D4FF]" />
          <div>
            <h2 className="text-2xl font-bold text-white">Jornada do Fundador</h2>
            <p className="text-slate-400 text-sm">Etapa {step} de 2</p>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-white font-semibold mb-4">Informações de Contato</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70 mb-2 block">Nome Completo *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Seu nome"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white/70 mb-2 block">Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="seu@email.com"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white/70 mb-2 block">Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+55 11 99999-9999"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white/70 mb-2 block">LinkedIn</Label>
                <Input
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                  placeholder="linkedin.com/in/..."
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!formData.full_name || !formData.email}
              className="w-full bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F] font-semibold mt-6"
            >
              Continuar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-white font-semibold mb-4">Qualificação da Venture</h3>

            <div>
              <Label className="text-white/70 mb-2 block">Em que estágio está sua venture? *</Label>
              <Select value={formData.venture_stage} onValueChange={(v) => setFormData(prev => ({ ...prev, venture_stage: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">Apenas ideia</SelectItem>
                  <SelectItem value="mvp">MVP desenvolvido</SelectItem>
                  <SelectItem value="revenue">Gerando receita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white/70 mb-2 block">Qual sua expertise? *</Label>
              <Select value={formData.domain_expertise} onValueChange={(v) => setFormData(prev => ({ ...prev, domain_expertise: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech">Técnica</SelectItem>
                  <SelectItem value="industry">Indústria/Domínio</SelectItem>
                  <SelectItem value="both">Ambas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white/70 mb-2 block">Está dedicado full-time? *</Label>
              <Select value={formData.commitment_level} onValueChange={(v) => setFormData(prev => ({ ...prev, commitment_level: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Sim, full-time</SelectItem>
                  <SelectItem value="planning">Planejo transicionar</SelectItem>
                  <SelectItem value="part_time">Apenas part-time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white/70 mb-2 block">Qual seu maior gap? *</Label>
              <Select value={formData.biggest_gap} onValueChange={(v) => setFormData(prev => ({ ...prev, biggest_gap: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech">Tecnologia</SelectItem>
                  <SelectItem value="business">Negócio/Gestão</SelectItem>
                  <SelectItem value="capital">Capital</SelectItem>
                  <SelectItem value="all">Tudo acima</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white/70 mb-2 block">Timeline esperado? *</Label>
              <Select value={formData.timeline} onValueChange={(v) => setFormData(prev => ({ ...prev, timeline: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3mo">3 meses</SelectItem>
                  <SelectItem value="6mo">6 meses</SelectItem>
                  <SelectItem value="12mo">12 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white/70 mb-2 block">Descreva sua venture</Label>
              <Textarea
                value={formData.venture_description}
                onChange={(e) => setFormData(prev => ({ ...prev, venture_description: e.target.value }))}
                placeholder="O que você está construindo?"
                className="bg-white/5 border-white/10 text-white h-24"
              />
            </div>

            <div>
              <Label className="text-white/70 mb-2 block">Que problema resolve?</Label>
              <Textarea
                value={formData.problem_solving}
                onChange={(e) => setFormData(prev => ({ ...prev, problem_solving: e.target.value }))}
                placeholder="Problema específico que a venture endereça"
                className="bg-white/5 border-white/10 text-white h-20"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="border-white/10 text-white"
              >
                Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.venture_stage || !formData.commitment_level}
                className="flex-1 bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F] font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Aplicação'
                )}
              </Button>
            </div>
          </div>
        )}
      </GlowCard>
    </div>
  );
}