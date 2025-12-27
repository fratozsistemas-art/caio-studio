import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Loader2, Handshake } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function PartnerQualification({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company: '',
    phone: '',
    service_category: '',
    target_clients: '',
    pricing_model: '',
    portfolio_discount: '',
    service_description: '',
    why_partner: ''
  });

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.email || !formData.company) {
      toast.error('Campos obrigatórios não preenchidos');
      return;
    }

    setLoading(true);
    try {
      let score = 50;
      if (formData.portfolio_discount === 'yes') score += 30;
      if (formData.target_clients === 'startups') score += 20;

      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'StakeholderLead',
        operation: 'create',
        data: {
          stakeholder_type: 'partner',
          ...formData,
          qualification_answers: formData,
          qualification_score: score,
          status: 'qualified',
          stage: 'outreach',
          auto_assigned_role: 'Viewer',
          next_action: 'Avaliar parceria',
          next_action_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      });

      toast.success('Aplicação de parceria recebida! Retornaremos em breve.');
      onComplete?.();
    } catch (error) {
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlowCard glowColor="mixed" className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Handshake className="w-6 h-6 text-purple-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Programa de Parceiros</h2>
          <p className="text-slate-400 text-sm">Junte-se aos Central Services</p>
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
            <Label className="text-white/70 mb-2 block">Empresa *</Label>
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
          <Label className="text-white/70 mb-2 block">Categoria de Serviço</Label>
          <Select value={formData.service_category} onValueChange={(v) => setFormData(prev => ({ ...prev, service_category: v }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="legal">Jurídico</SelectItem>
              <SelectItem value="accounting">Contabilidade</SelectItem>
              <SelectItem value="cloud">Cloud/Infraestrutura</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="hr">RH/Recrutamento</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Trabalha com Startups?</Label>
          <Select value={formData.target_clients} onValueChange={(v) => setFormData(prev => ({ ...prev, target_clients: v }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="startups">Sim, foco em startups</SelectItem>
              <SelectItem value="mixed">Clientes variados</SelectItem>
              <SelectItem value="enterprise">Apenas grandes empresas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Oferece desconto para portfolio?</Label>
          <Select value={formData.portfolio_discount} onValueChange={(v) => setFormData(prev => ({ ...prev, portfolio_discount: v }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Sim, posso oferecer desconto</SelectItem>
              <SelectItem value="negotiate">Aberto a negociar</SelectItem>
              <SelectItem value="no">Tabela fixa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Descrição dos Serviços</Label>
          <Textarea
            value={formData.service_description}
            onChange={(e) => setFormData(prev => ({ ...prev, service_description: e.target.value }))}
            placeholder="Descreva os serviços que oferece..."
            className="bg-white/5 border-white/10 text-white h-24"
          />
        </div>

        <div>
          <Label className="text-white/70 mb-2 block">Por que parceria com CAIO Vision?</Label>
          <Textarea
            value={formData.why_partner}
            onChange={(e) => setFormData(prev => ({ ...prev, why_partner: e.target.value }))}
            placeholder="O que você espera dessa parceria?"
            className="bg-white/5 border-white/10 text-white h-20"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold mt-6"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            'Aplicar para Parceria'
          )}
        </Button>
      </div>
    </GlowCard>
  );
}