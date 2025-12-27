import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { Plus, Edit, Trash2, Mail, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const templateCategories = [
  { value: "event_invite", label: "Convite para Evento" },
  { value: "venture_update", label: "Atualização de Venture" },
  { value: "meeting_reminder", label: "Lembrete de Reunião" },
  { value: "newsletter", label: "Newsletter" },
  { value: "follow_up", label: "Follow-up" },
  { value: "welcome", label: "Boas-vindas" },
  { value: "custom", label: "Personalizado" }
];

const defaultTemplates = {
  event_invite: {
    subject: "Convite: {{event_name}}",
    body: "Olá {{name}},\n\nTemos o prazer de convidá-lo(a) para {{event_name}}.\n\nData: {{date}}\nLocal: {{location}}\n\nConfirme sua presença!\n\nAtenciosamente,\nEquipe CAIO Vision"
  },
  venture_update: {
    subject: "Update: {{venture_name}}",
    body: "Olá {{name}},\n\nNovas atualizações sobre {{venture_name}}:\n\n{{update_content}}\n\nFique atento para mais novidades!\n\nEquipe CAIO Vision"
  },
  meeting_reminder: {
    subject: "Lembrete: Reunião {{meeting_title}}",
    body: "Olá {{name}},\n\nLembrando da nossa reunião:\n\nTítulo: {{meeting_title}}\nData/Hora: {{datetime}}\nLink: {{meeting_link}}\n\nNos vemos lá!\n\nEquipe CAIO Vision"
  }
};

export default function TemplateManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "custom",
    subject: "",
    body: "",
    variables: []
  });

  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'EmailTemplate',
        operation: 'filter',
        query: {}
      });
      return res.data?.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'EmailTemplate',
        operation: 'create',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['emailTemplates']);
      setIsDialogOpen(false);
      resetForm();
      toast.success('Template criado com sucesso!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'EmailTemplate',
        operation: 'update',
        id,
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['emailTemplates']);
      setIsDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
      toast.success('Template atualizado!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'EmailTemplate',
        operation: 'delete',
        id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['emailTemplates']);
      toast.success('Template removido!');
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "custom",
      subject: "",
      body: "",
      variables: []
    });
  };

  const handleCategoryChange = (category) => {
    setFormData(prev => ({
      ...prev,
      category,
      ...(defaultTemplates[category] || {})
    }));
  };

  const extractVariables = (text) => {
    const matches = text.match(/\{\{(\w+)\}\}/g);
    return matches ? [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))] : [];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const allVariables = [
      ...extractVariables(formData.subject),
      ...extractVariables(formData.body)
    ];
    
    const templateData = {
      ...formData,
      variables: [...new Set(allVariables)]
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: templateData });
    } else {
      createMutation.mutate(templateData);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      subject: template.subject,
      body: template.body,
      variables: template.variables || []
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Templates de Email</h3>
          <p className="text-slate-400 text-sm mt-1">Gerencie templates reutilizáveis</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-[#C7A763] hover:bg-[#A88B4A]">
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-[#0a1628] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-white">Nome do Template</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Convite Evento Trimestral"
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>

              <div>
                <Label className="text-white">Categoria</Label>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Assunto</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Use {{variavel}} para campos dinâmicos"
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>

              <div>
                <Label className="text-white">Corpo do Email</Label>
                <Textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Use {{variavel}} para campos dinâmicos"
                  className="bg-white/5 border-white/10 text-white min-h-[200px]"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">
                  Variáveis detectadas: {extractVariables(formData.subject + formData.body).join(', ') || 'nenhuma'}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#C7A763] hover:bg-[#A88B4A]">
                  {editingTemplate ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-slate-400">Carregando templates...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <GlowCard key={template.id} glowColor="cyan" className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#00D4FF]" />
                  <div>
                    <h4 className="font-semibold text-white">{template.name}</h4>
                    <span className="text-xs text-slate-400">
                      {templateCategories.find(c => c.value === template.category)?.label}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-xs text-slate-500">Assunto:</span>
                  <p className="text-sm text-white line-clamp-1">{template.subject}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Corpo:</span>
                  <p className="text-sm text-slate-400 line-clamp-2">{template.body}</p>
                </div>
                {template.variables?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {template.variables.map((v, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-xs bg-white/5 rounded text-slate-300">
                        {v}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-slate-500 pt-2">
                  <TrendingUp className="w-3 h-3" />
                  Usado {template.usage_count || 0}x
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      )}
    </div>
  );
}