import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { Send, Users, Mail } from "lucide-react";
import { toast } from "sonner";

export default function SendCommunication() {
  const [formData, setFormData] = useState({
    template_id: "",
    recipient_type: "manual",
    recipient_email: "",
    recipient_name: "",
    subject: "",
    body: "",
    variables: {}
  });
  const [isSending, setIsSending] = useState(false);

  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'EmailTemplate',
        operation: 'filter',
        query: { is_active: true }
      });
      return res.data?.data || [];
    }
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['stakeholderLeads'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'StakeholderLead',
        operation: 'filter',
        query: {}
      });
      return res.data?.data || [];
    }
  });

  const handleTemplateChange = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        template_id: templateId,
        subject: template.subject,
        body: template.body
      }));
    }
  };

  const handleLeadChange = (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setFormData(prev => ({
        ...prev,
        recipient_email: lead.email,
        recipient_name: lead.full_name,
        variables: {
          ...prev.variables,
          name: lead.full_name,
          company: lead.company
        }
      }));
    }
  };

  const replaceVariables = (text, vars) => {
    let result = text;
    Object.keys(vars).forEach(key => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), vars[key] || '');
    });
    return result;
  };

  const handleSend = async () => {
    if (!formData.recipient_email || !formData.subject || !formData.body) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSending(true);

    try {
      const user = await base44.auth.me();
      const finalSubject = replaceVariables(formData.subject, formData.variables);
      const finalBody = replaceVariables(formData.body, formData.variables);

      // Send email via Core integration
      await base44.integrations.Core.SendEmail({
        to: formData.recipient_email,
        subject: finalSubject,
        body: finalBody,
        from_name: "CAIO Vision"
      });

      // Log communication
      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'CommunicationLog',
        operation: 'create',
        data: {
          communication_type: 'email',
          recipient_email: formData.recipient_email,
          recipient_name: formData.recipient_name,
          subject: finalSubject,
          body: finalBody,
          template_id: formData.template_id || null,
          template_name: templates.find(t => t.id === formData.template_id)?.name,
          status: 'sent',
          sent_by: user.email,
          sent_at: new Date().toISOString(),
          metadata: formData.variables
        }
      });

      // Update template usage count
      if (formData.template_id) {
        const template = templates.find(t => t.id === formData.template_id);
        await base44.functions.invoke('secureEntityQuery', {
          entity_name: 'EmailTemplate',
          operation: 'update',
          id: formData.template_id,
          data: { usage_count: (template.usage_count || 0) + 1 }
        });
      }

      queryClient.invalidateQueries(['communicationLogs']);
      toast.success('Email enviado com sucesso!');
      
      // Reset form
      setFormData({
        template_id: "",
        recipient_type: "manual",
        recipient_email: "",
        recipient_name: "",
        subject: "",
        body: "",
        variables: {}
      });
    } catch (error) {
      toast.error('Erro ao enviar email: ' + error.message);
      
      // Log failed attempt
      const user = await base44.auth.me();
      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'CommunicationLog',
        operation: 'create',
        data: {
          communication_type: 'email',
          recipient_email: formData.recipient_email,
          recipient_name: formData.recipient_name,
          subject: formData.subject,
          body: formData.body,
          status: 'failed',
          sent_by: user.email,
          error_message: error.message
        }
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">Enviar Comunicação</h3>
        <p className="text-slate-400 text-sm mt-1">Envie emails para contatos e stakeholders</p>
      </div>

      <GlowCard glowColor="gold" className="p-6">
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Template (Opcional)</Label>
              <Select value={formData.template_id} onValueChange={handleTemplateChange}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum template</SelectItem>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Destinatário</Label>
              <Select value={formData.recipient_type} onValueChange={(v) => setFormData({ ...formData, recipient_type: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="from_crm">Selecionar do CRM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.recipient_type === 'from_crm' && (
            <div>
              <Label className="text-white">Lead do CRM</Label>
              <Select onValueChange={handleLeadChange}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione um lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.full_name} ({lead.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Email *</Label>
              <Input
                type="email"
                value={formData.recipient_email}
                onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
                placeholder="destinatario@email.com"
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-white">Nome</Label>
              <Input
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                placeholder="Nome do destinatário"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-white">Assunto *</Label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Assunto do email"
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>

          <div>
            <Label className="text-white">Mensagem *</Label>
            <Textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Corpo do email"
              className="bg-white/5 border-white/10 text-white min-h-[200px]"
              required
            />
          </div>

          {formData.template_id && (
            <div className="bg-white/5 rounded-lg p-4">
              <Label className="text-white mb-2 block">Variáveis do Template</Label>
              <div className="grid md:grid-cols-2 gap-3">
                {templates.find(t => t.id === formData.template_id)?.variables?.map((varName) => (
                  <div key={varName}>
                    <Label className="text-slate-400 text-xs">{varName}</Label>
                    <Input
                      value={formData.variables[varName] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        variables: { ...formData.variables, [varName]: e.target.value }
                      })}
                      placeholder={`Valor para {{${varName}}}`}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleSend}
            disabled={isSending}
            className="w-full bg-[#C7A763] hover:bg-[#A88B4A]"
          >
            {isSending ? (
              <>Enviando...</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Email
              </>
            )}
          </Button>
        </div>
      </GlowCard>
    </div>
  );
}