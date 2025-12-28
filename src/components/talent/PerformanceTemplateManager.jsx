import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, Copy, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';

export default function PerformanceTemplateManager() {
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['performance-templates'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'PerformanceTemplate',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (template) => {
      if (template.id) {
        return await base44.functions.invoke('secureEntityQuery', {
          entity_name: 'PerformanceTemplate',
          operation: 'update',
          id: template.id,
          data: template
        });
      }
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'PerformanceTemplate',
        operation: 'create',
        data: template
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['performance-templates']);
      setShowDialog(false);
      setEditingTemplate(null);
      toast.success('Template salvo!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'PerformanceTemplate',
        operation: 'delete',
        id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['performance-templates']);
      toast.success('Template removido');
    }
  });

  const addSection = () => {
    setEditingTemplate({
      ...editingTemplate,
      sections: [...(editingTemplate.sections || []), { title: '', questions: [] }]
    });
  };

  const updateSection = (index, field, value) => {
    const sections = [...editingTemplate.sections];
    sections[index][field] = value;
    setEditingTemplate({ ...editingTemplate, sections });
  };

  const removeSection = (index) => {
    const sections = editingTemplate.sections.filter((_, i) => i !== index);
    setEditingTemplate({ ...editingTemplate, sections });
  };

  const addQuestion = (sectionIndex) => {
    const sections = [...editingTemplate.sections];
    sections[sectionIndex].questions = [
      ...(sections[sectionIndex].questions || []),
      { question: '', type: 'rating', required: true }
    ];
    setEditingTemplate({ ...editingTemplate, sections });
  };

  const updateQuestion = (sectionIndex, questionIndex, field, value) => {
    const sections = [...editingTemplate.sections];
    sections[sectionIndex].questions[questionIndex][field] = value;
    setEditingTemplate({ ...editingTemplate, sections });
  };

  const removeQuestion = (sectionIndex, questionIndex) => {
    const sections = [...editingTemplate.sections];
    sections[sectionIndex].questions = sections[sectionIndex].questions.filter((_, i) => i !== questionIndex);
    setEditingTemplate({ ...editingTemplate, sections });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Templates de Avaliação</h3>
        <Button
          onClick={() => {
            setEditingTemplate({ name: '', description: '', sections: [], is_active: true });
            setShowDialog(true);
          }}
          className="bg-[#C7A763] hover:bg-[#A88B4A]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Template
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {templates.map(template => (
          <GlowCard key={template.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-white font-semibold">{template.name}</h4>
                <p className="text-sm text-slate-400 mt-1">{template.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs text-slate-500">
                    {template.sections?.length || 0} seções
                  </span>
                  <span className="text-xs text-slate-500">
                    Usado {template.usage_count || 0}x
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditingTemplate(template);
                    setShowDialog(true);
                  }}
                  className="p-2 hover:bg-white/10 rounded text-slate-400"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(template.id)}
                  className="p-2 hover:bg-red-500/10 rounded text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </GlowCard>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#0a1628] border-white/10 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingTemplate?.id ? 'Editar' : 'Criar'} Template
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <Input
              placeholder="Nome do template *"
              value={editingTemplate?.name || ''}
              onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
              className="bg-white/5 border-white/10 text-white"
            />
            <Textarea
              placeholder="Descrição"
              value={editingTemplate?.description || ''}
              onChange={(e) => setEditingTemplate({...editingTemplate, description: e.target.value})}
              className="bg-white/5 border-white/10 text-white"
            />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold">Seções</h4>
                <Button onClick={addSection} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Seção
                </Button>
              </div>

              {editingTemplate?.sections?.map((section, sectionIndex) => (
                <GlowCard key={sectionIndex} className="p-4 mb-3">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Título da seção *"
                        value={section.title}
                        onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <button
                        onClick={() => removeSection(sectionIndex)}
                        className="p-2 hover:bg-red-500/10 text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <Textarea
                      placeholder="Descrição da seção"
                      value={section.description || ''}
                      onChange={(e) => updateSection(sectionIndex, 'description', e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />

                    <div>
                      <Button
                        onClick={() => addQuestion(sectionIndex)}
                        size="sm"
                        variant="outline"
                        className="mb-2"
                      >
                        <Plus className="w-3 h-3 mr-2" />
                        Adicionar Pergunta
                      </Button>

                      {section.questions?.map((question, qIndex) => (
                        <div key={qIndex} className="bg-white/5 rounded-lg p-3 mb-2">
                          <div className="flex gap-2 mb-2">
                            <Input
                              placeholder="Pergunta *"
                              value={question.question}
                              onChange={(e) => updateQuestion(sectionIndex, qIndex, 'question', e.target.value)}
                              className="bg-white/5 border-white/10 text-white text-sm"
                            />
                            <Select
                              value={question.type}
                              onValueChange={(v) => updateQuestion(sectionIndex, qIndex, 'type', v)}
                            >
                              <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="rating">Nota (1-5)</SelectItem>
                                <SelectItem value="text">Texto</SelectItem>
                                <SelectItem value="multiple_choice">Múltipla escolha</SelectItem>
                              </SelectContent>
                            </Select>
                            <button
                              onClick={() => removeQuestion(sectionIndex, qIndex)}
                              className="p-2 hover:bg-red-500/10 text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlowCard>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => saveMutation.mutate(editingTemplate)}
                className="bg-[#C7A763] hover:bg-[#A88B4A]"
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}