import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Plus, Mail, Trash2, Edit, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function EmailSequenceBuilder({ sequences }) {
  const [showForm, setShowForm] = useState(false);
  const [editingSequence, setEditingSequence] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    stakeholder_type: 'all',
    trigger_stage: 'new',
    emails: []
  });

  const queryClient = useQueryClient();

  const createSequenceMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'EmailSequence',
        operation: 'create',
        data: {
          ...data,
          is_active: true,
          success_metrics: { sent_count: 0, open_rate: 0, response_rate: 0 }
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['emailSequences']);
      toast.success('Sequência criada com sucesso');
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({ name: '', stakeholder_type: 'all', trigger_stage: 'new', emails: [] });
    setShowForm(false);
    setEditingSequence(null);
  };

  const addEmailStep = () => {
    setFormData(prev => ({
      ...prev,
      emails: [
        ...prev.emails,
        {
          step: prev.emails.length + 1,
          delay_days: prev.emails.length === 0 ? 0 : 3,
          subject: '',
          body_template: '',
          call_to_action: ''
        }
      ]
    }));
  };

  const updateEmailStep = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails.map((email, i) => 
        i === index ? { ...email, [field]: value } : email
      )
    }));
  };

  const removeEmailStep = (index) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index).map((email, i) => ({
        ...email,
        step: i + 1
      }))
    }));
  };

  const handleSubmit = () => {
    if (!formData.name || formData.emails.length === 0) {
      toast.error('Nome e pelo menos 1 email são obrigatórios');
      return;
    }
    createSequenceMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Sequências de Email</h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Sequência
        </Button>
      </div>

      {showForm && (
        <GlowCard glowColor="gold" className="p-6">
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70 mb-2 block">Nome da Sequência *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Welcome Founders"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white/70 mb-2 block">Tipo de Stakeholder</Label>
                <Select value={formData.stakeholder_type} onValueChange={(v) => setFormData(prev => ({ ...prev, stakeholder_type: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="founder">Founders</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="partner">Partners</SelectItem>
                    <SelectItem value="investor">Investors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-white/70 mb-2 block">Emails da Sequência</Label>
              <div className="space-y-3">
                {formData.emails.map((email, index) => (
                  <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-[#00D4FF]/20 text-[#00D4FF]">
                        Email {email.step} - Dia {email.delay_days}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeEmailStep(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <Input
                        value={email.subject}
                        onChange={(e) => updateEmailStep(index, 'subject', e.target.value)}
                        placeholder="Assunto do email"
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Textarea
                        value={email.body_template}
                        onChange={(e) => updateEmailStep(index, 'body_template', e.target.value)}
                        placeholder="Corpo do email (use {{name}} para personalizar)"
                        className="bg-white/5 border-white/10 text-white h-24"
                      />
                      <Input
                        value={email.call_to_action}
                        onChange={(e) => updateEmailStep(index, 'call_to_action', e.target.value)}
                        placeholder="Call to action (opcional)"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={addEmailStep}
                variant="outline"
                className="w-full mt-3 border-white/10 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Email
              </Button>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={resetForm} variant="outline" className="border-white/10 text-white">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]">
                <Check className="w-4 h-4 mr-2" />
                Criar Sequência
              </Button>
            </div>
          </div>
        </GlowCard>
      )}

      {/* Sequences List */}
      <div className="grid md:grid-cols-2 gap-4">
        {sequences.map((sequence, i) => (
          <GlowCard key={sequence.id} glowColor="cyan" className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-white font-semibold mb-1">{sequence.name}</h4>
                <Badge className="bg-blue-500/20 text-blue-400">
                  {sequence.stakeholder_type}
                </Badge>
              </div>
              <Badge className={sequence.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                {sequence.is_active ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="w-4 h-4" />
                {sequence.emails?.length || 0} emails na sequência
              </div>
              {sequence.success_metrics && (
                <div className="text-xs text-slate-400">
                  {sequence.success_metrics.sent_count} enviados
                </div>
              )}
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}