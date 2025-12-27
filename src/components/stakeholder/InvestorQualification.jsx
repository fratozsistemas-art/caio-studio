import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Loader2, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function InvestorQualification({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    investor_type: '',
    investment_size: '',
    investment_stage: '',
    sectors_interest: '',
    investment_thesis: '',
    referral_source: ''
  });

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.email) {
      toast.error('Campos obrigatórios não preenchidos');
      return;
    }

    setLoading(true);
    try {
      let score = 70; // Higher base for investors
      if (formData.investment_size === 'large') score += 20;
      else if (formData.investment_size === 'medium') score += 10;

      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'StakeholderLead',
        operation: 'create',
        data: {
          stakeholder_type: 'investor',
          ...formData,
          qualification_answers: formData,
          qualification_score: score,
          status: 'qualified',
          stage: 'positioning',
          auto_assigned_role: 'Financial Viewer',
          next_action: 'Agendar reunião de apresentação',
          next_action_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      });

      toast.success('Interesse registrado! Entraremos em contato para próximos passos.');
      onComplete?.();
    } catch (error) {
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlowCard glowColor="gold" className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-[#C7A763]" />
        <div>
          <h2 className="text-2xl font-bold text-white">Jornada do Investidor</h2>
          <p className="text-slate-400 text-sm">Acesso Qualificado ao Portfolio</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-white/70 mb-2 block">Nome Completo *</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-white/70 mb-2 block">Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-white/70 mb-2 block">Empresa/Fundo</Label>
            <Input
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-white/70 mb-2 block">Telefone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Tipo de Investidor</Label>
          <Select value={formData.investor_type} onValueChange={(v) => setFormData(prev => ({ ...prev, investor_type: v }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vc">VC Fund</SelectItem>
              <SelectItem value="family_office">Family Office</SelectItem>
              <SelectItem value="corporate_vc">Corporate VC</SelectItem>
              <SelectItem value="angel">Angel Investor</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Ticket Típico de Investimento</Label>
          <Select value={formData.investment_size} onValueChange={(v) => setFormData(prev => ({ ...prev, investment_size: v }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Até R$ 1M</SelectItem>
              <SelectItem value="medium">R$ 1M - R$ 10M</SelectItem>
              <SelectItem value="large">R$ 10M+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Stage Preferido</Label>
          <Select value={formData.investment_stage} onValueChange={(v) => setFormData(prev => ({ ...prev, investment_stage: v }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pre_seed">Pre-Seed</SelectItem>
              <SelectItem value="seed">Seed</SelectItem>
              <SelectItem value="series_a">Series A</SelectItem>
              <SelectItem value="series_b_plus">Series B+</SelectItem>
              <SelectItem value="flexible">Flexível</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Setores de Interesse</Label>
          <Input
            value={formData.sectors_interest}
            onChange={(e) => setFormData(prev => ({ ...prev, sectors_interest: e.target.value }))}
            placeholder="Ex: FinTech, HealthTech, SaaS"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Tese de Investimento</Label>
          <Textarea
            value={formData.investment_thesis}
            onChange={(e) => setFormData(prev => ({ ...prev, investment_thesis: e.target.value }))}
            placeholder="Descreva sua tese e critérios de investimento..."
            className="bg-white/5 border-white/10 text-white h-24"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F] font-semibold mt-6"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            'Registrar Interesse'
          )}
        </Button>
      </div>
    </GlowCard>
  );
}