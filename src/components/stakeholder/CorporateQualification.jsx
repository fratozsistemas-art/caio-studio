import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Loader2, Building2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function CorporateQualification({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    company_size: '',
    innovation_mandate: '',
    budget_range: '',
    timeline_expectations: '',
    innovation_challenges: '',
    venture_ideas: ''
  });

  const calculateScore = () => {
    let score = 30; // Base score for corporate
    
    if (formData.company_size === 'large' || formData.company_size === 'enterprise') score += 25;
    else if (formData.company_size === 'medium') score += 15;
    
    if (formData.budget_range === 'high') score += 30;
    else if (formData.budget_range === 'medium') score += 20;
    
    if (formData.innovation_mandate === 'established') score += 15;
    
    return Math.min(score, 100);
  };

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.email || !formData.company) {
      toast.error('Campos obrigatórios não preenchidos');
      return;
    }

    setLoading(true);
    try {
      const score = calculateScore();
      
      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'StakeholderLead',
        operation: 'create',
        data: {
          stakeholder_type: 'corporate',
          ...formData,
          qualification_answers: formData,
          qualification_score: score,
          status: score >= 60 ? 'qualified' : 'new',
          stage: 'awareness',
          auto_assigned_role: 'Financial Viewer',
          next_action: 'Agendar discovery call',
          next_action_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      });

      toast.success('Informações enviadas! Entraremos em contato em breve.');
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
        <Building2 className="w-6 h-6 text-[#C7A763]" />
        <div>
          <h2 className="text-2xl font-bold text-white">Jornada Corporativa</h2>
          <p className="text-slate-400 text-sm">Venture Building para Corporações</p>
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
            <Label className="text-white/70 mb-2 block">Email Corporativo *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-white/70 mb-2 block">Empresa *</Label>
            <Input
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-white/70 mb-2 block">Cargo</Label>
            <Input
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              placeholder="Ex: Diretor de Inovação"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Porte da Empresa</Label>
          <Select value={formData.company_size} onValueChange={(v) => setFormData(prev => ({ ...prev, company_size: v }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Pequena (até 50 funcionários)</SelectItem>
              <SelectItem value="medium">Média (50-500)</SelectItem>
              <SelectItem value="large">Grande (500-5000)</SelectItem>
              <SelectItem value="enterprise">Enterprise (5000+)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Mandato de Inovação</Label>
          <Select value={formData.innovation_mandate} onValueChange={(v) => setFormData(prev => ({ ...prev, innovation_mandate: v }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="established">Programa estabelecido</SelectItem>
              <SelectItem value="starting">Começando agora</SelectItem>
              <SelectItem value="exploring">Explorando possibilidades</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Faixa de Budget para Inovação</Label>
          <Select value={formData.budget_range} onValueChange={(v) => setFormData(prev => ({ ...prev, budget_range: v }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Até R$ 500k</SelectItem>
              <SelectItem value="medium">R$ 500k - R$ 2M</SelectItem>
              <SelectItem value="high">R$ 2M+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Desafios de Inovação</Label>
          <Textarea
            value={formData.innovation_challenges}
            onChange={(e) => setFormData(prev => ({ ...prev, innovation_challenges: e.target.value }))}
            placeholder="Quais os principais desafios de inovação da sua empresa?"
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
            'Solicitar Contato'
          )}
        </Button>
      </div>
    </GlowCard>
  );
}