import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Briefcase, Mail, Phone, Linkedin, FileText, Github, Globe, Calendar, Award } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function TalentDetailDialog({ talent, isOpen, onClose }) {
  const [editedTalent, setEditedTalent] = useState(talent);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Talent',
        operation: 'update',
        id,
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['talents']);
      toast.success('Talento atualizado!');
      onClose();
    }
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: talent.id,
      data: {
        status: editedTalent.status,
        rating: editedTalent.rating,
        internal_notes: editedTalent.internal_notes,
        assigned_to: editedTalent.assigned_to
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-[#0a1628] border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">{talent.full_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              {talent.current_position && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Briefcase className="w-4 h-4" />
                  <span>{talent.current_position}</span>
                  {talent.current_company && <span className="text-slate-500">@ {talent.current_company}</span>}
                </div>
              )}
              {talent.location && (
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <span>{talent.location}</span>
                </div>
              )}
            </div>
            <Badge className={`px-3 py-1 ${
              talent.status === 'hired' ? 'bg-emerald-400/20 text-emerald-400' :
              talent.status === 'shortlisted' ? 'bg-green-400/20 text-green-400' :
              talent.status === 'interviewing' ? 'bg-purple-400/20 text-purple-400' :
              'bg-blue-400/20 text-blue-400'
            }`}>
              {talent.status}
            </Badge>
          </div>

          {/* Contact */}
          <div className="grid md:grid-cols-2 gap-3">
            {talent.email && (
              <a href={`mailto:${talent.email}`} className="flex items-center gap-2 text-slate-300 hover:text-white">
                <Mail className="w-4 h-4" />
                {talent.email}
              </a>
            )}
            {talent.phone && (
              <a href={`tel:${talent.phone}`} className="flex items-center gap-2 text-slate-300 hover:text-white">
                <Phone className="w-4 h-4" />
                {talent.phone}
              </a>
            )}
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-3">
            {talent.linkedin_url && (
              <a href={talent.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0077B5]/20 text-[#0077B5] hover:bg-[#0077B5]/30 transition-colors">
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
            )}
            {talent.cv_file_url && (
              <a href={talent.cv_file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">
                <FileText className="w-4 h-4" />
                Download CV
              </a>
            )}
            {talent.github_url && (
              <a href={talent.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">
                <Github className="w-4 h-4" />
                GitHub
              </a>
            )}
            {talent.portfolio_url && (
              <a href={talent.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">
                <Globe className="w-4 h-4" />
                Portfolio
              </a>
            )}
          </div>

          {/* Summary */}
          {talent.summary && (
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Resumo Profissional</h4>
              <p className="text-slate-300 text-sm leading-relaxed">{talent.summary}</p>
            </div>
          )}

          {/* Skills */}
          {talent.skills && talent.skills.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-3">Competências</h4>
              <div className="flex flex-wrap gap-2">
                {talent.skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-full bg-[#C7A763]/20 text-[#C7A763] text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {talent.education && talent.education.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Formação Acadêmica
              </h4>
              <div className="space-y-2">
                {talent.education.map((edu, idx) => (
                  <div key={idx} className="bg-white/5 rounded-lg p-3">
                    <div className="text-white font-medium">{edu.degree} {edu.field && `em ${edu.field}`}</div>
                    <div className="text-slate-400 text-sm">{edu.institution}</div>
                    {edu.year && <div className="text-slate-500 text-xs">{edu.year}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {talent.languages && talent.languages.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-3">Idiomas</h4>
              <div className="flex flex-wrap gap-2">
                {talent.languages.map((lang, idx) => (
                  <Badge key={idx} className="bg-white/5 text-slate-300">
                    {lang.language} - {lang.proficiency}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Management Section */}
          <div className="border-t border-white/10 pt-6 space-y-4">
            <h4 className="text-white font-semibold">Gestão de Candidatura</h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Status</Label>
                <Select value={editedTalent.status} onValueChange={(v) => setEditedTalent({ ...editedTalent, status: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Novo</SelectItem>
                    <SelectItem value="screening">Triagem</SelectItem>
                    <SelectItem value="interviewing">Entrevistando</SelectItem>
                    <SelectItem value="shortlisted">Pré-selecionado</SelectItem>
                    <SelectItem value="hired">Contratado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Avaliação</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditedTalent({ ...editedTalent, rating: star })}
                      className="transition-all"
                    >
                      <Star 
                        className={`w-6 h-6 ${
                          star <= (editedTalent.rating || 0)
                            ? 'fill-[#C7A763] text-[#C7A763]' 
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-white">Notas Internas</Label>
              <Textarea
                value={editedTalent.internal_notes || ''}
                onChange={(e) => setEditedTalent({ ...editedTalent, internal_notes: e.target.value })}
                placeholder="Adicione observações sobre o candidato..."
                className="bg-white/5 border-white/10 text-white min-h-[100px]"
              />
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              Adicionado em {format(new Date(talent.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-[#C7A763] hover:bg-[#A88B4A]"
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}