import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Briefcase, Mail, Phone, Linkedin, FileText, Github, Globe, Calendar, Award, Sparkles, Loader2, Plus, X, MessageSquare, Target, Trophy } from "lucide-react";
import BadgeShowcase from '@/components/gamification/BadgeShowcase';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FeedbackCollection from "@/components/talent/FeedbackCollection";
import GoalTracking from "@/components/talent/GoalTracking";
import OnboardingChecklist from "@/components/onboarding/OnboardingChecklist";

export default function TalentDetailDialog({ talent, isOpen, onClose }) {
  const [editedTalent, setEditedTalent] = useState(talent);
  const [cvSummary, setCvSummary] = useState(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showVentureDialog, setShowVentureDialog] = useState(false);
  const [selectedVentureId, setSelectedVentureId] = useState('');
  const [ventureAllocationData, setVentureAllocationData] = useState({
    role: '',
    allocation_percentage: 50,
    responsibilities: '',
    is_lead: false
  });
  const queryClient = useQueryClient();

  // Fetch available roles
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Role',
        operation: 'filter',
        query: { is_active: true },
        sort: 'name'
      });
      return res.data?.data || [];
    }
  });

  // Fetch ventures allocated to this talent
  const { data: talentVentures } = useQuery({
    queryKey: ['talent-ventures', talent.id],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTalent',
        operation: 'filter',
        query: { talent_id: talent.id }
      });
      return res.data?.data || [];
    },
    enabled: !!talent.id
  });

  // Fetch all ventures for selection
  const { data: allVentures } = useQuery({
    queryKey: ['all-ventures'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Venture',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

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

  const addVentureMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTalent',
        operation: 'create',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['talent-ventures', talent.id]);
      setShowVentureDialog(false);
      setSelectedVentureId('');
      setVentureAllocationData({
        role: '',
        allocation_percentage: 50,
        responsibilities: '',
        is_lead: false
      });
      toast.success('Venture adicionada ao talento!');
    }
  });

  const removeVentureMutation = useMutation({
    mutationFn: async (ventureAllocationId) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTalent',
        operation: 'delete',
        id: ventureAllocationId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['talent-ventures', talent.id]);
      toast.success('Venture removida do talento');
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

  const handleAddVenture = () => {
    if (!selectedVentureId || !ventureAllocationData.role) {
      toast.error('Selecione uma venture e defina o papel');
      return;
    }

    const responsibilities = ventureAllocationData.responsibilities
      .split(',')
      .map(r => r.trim())
      .filter(Boolean);

    addVentureMutation.mutate({
      venture_id: selectedVentureId,
      talent_id: talent.id,
      role: ventureAllocationData.role,
      allocation_percentage: ventureAllocationData.allocation_percentage,
      responsibilities,
      is_lead: ventureAllocationData.is_lead,
      status: 'active'
    });
  };

  const allocatedVentureIds = talentVentures?.map(tv => tv.venture_id) || [];
  const availableVentures = allVentures?.filter(v => !allocatedVentureIds.includes(v.id)) || [];

  const handleGenerateSummary = async () => {
    if (!talent.cv_file_url) {
      toast.error('CV não disponível para análise');
      return;
    }

    setGeneratingSummary(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise este CV profissional e gere um resumo executivo conciso e estruturado.

Informações do candidato:
- Nome: ${talent.full_name}
- Cargo: ${talent.current_position || 'N/A'}
- Empresa: ${talent.current_company || 'N/A'}
- Localização: ${talent.location || 'N/A'}
- Experiência: ${talent.experience_years || 'N/A'} anos
- Skills: ${talent.skills?.join(', ') || 'N/A'}
- Formação: ${talent.education?.map(e => e.degree + ' - ' + e.institution).join('; ') || 'N/A'}
- Idiomas: ${talent.languages?.map(l => l.language + ' (' + l.proficiency + ')').join(', ') || 'N/A'}
- Resumo atual: ${talent.summary || 'N/A'}

Retorne um objeto JSON com:
- highlights: array de 3-5 pontos-chave (conquistas, diferenciais, expertise única)
- fit_for_roles: array de 3-4 roles ideais baseado no perfil
- strengths: array de 3-4 pontos fortes principais
- considerations: array de 1-2 pontos de atenção ou gaps (se houver)
- recommended_ventures: array de 2-3 tipos de ventures onde o candidato se encaixaria perfeitamente
- seniority_assessment: string (junior/mid/senior/lead/executive) com justificativa
- salary_range_estimate: string com faixa salarial estimada em BRL
- one_liner: string com resumo de 1 linha (máx 150 caracteres)`,
        file_urls: [talent.cv_file_url],
        response_json_schema: {
          type: "object",
          properties: {
            highlights: { type: "array", items: { type: "string" } },
            fit_for_roles: { type: "array", items: { type: "string" } },
            strengths: { type: "array", items: { type: "string" } },
            considerations: { type: "array", items: { type: "string" } },
            recommended_ventures: { type: "array", items: { type: "string" } },
            seniority_assessment: { type: "string" },
            salary_range_estimate: { type: "string" },
            one_liner: { type: "string" }
          }
        }
      });

      setCvSummary(response);
      toast.success('Resumo gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar resumo: ' + error.message);
    } finally {
      setGeneratingSummary(false);
    }
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

          {/* Links & CV Summary */}
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
            {talent.cv_file_url && (
              <Button
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
                size="sm"
                className="bg-gradient-to-r from-[#C7A763] to-[#00D4FF] hover:from-[#A88B4A] hover:to-[#00B8E0]"
              >
                {generatingSummary ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Resumo com IA
                  </>
                )}
              </Button>
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

          {/* AI-Generated CV Summary */}
          {cvSummary && (
            <div className="bg-gradient-to-br from-[#C7A763]/10 to-[#00D4FF]/10 border border-[#C7A763]/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#C7A763]" />
                <h4 className="text-white font-semibold">Análise IA do CV</h4>
              </div>

              {/* One-liner */}
              {cvSummary.one_liner && (
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-[#C7A763] font-medium italic">"{cvSummary.one_liner}"</p>
                </div>
              )}

              {/* Highlights */}
              {cvSummary.highlights && cvSummary.highlights.length > 0 && (
                <div>
                  <h5 className="text-white text-sm font-semibold mb-2">🌟 Destaques</h5>
                  <ul className="space-y-1.5">
                    {cvSummary.highlights.map((item, idx) => (
                      <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-[#C7A763] mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strengths */}
              {cvSummary.strengths && cvSummary.strengths.length > 0 && (
                <div>
                  <h5 className="text-white text-sm font-semibold mb-2">💪 Pontos Fortes</h5>
                  <div className="flex flex-wrap gap-2">
                    {cvSummary.strengths.map((item, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-full bg-green-400/20 text-green-300 text-xs">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fit for Roles */}
              {cvSummary.fit_for_roles && cvSummary.fit_for_roles.length > 0 && (
                <div>
                  <h5 className="text-white text-sm font-semibold mb-2">🎯 Roles Ideais</h5>
                  <div className="flex flex-wrap gap-2">
                    {cvSummary.fit_for_roles.map((role, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-full bg-[#00D4FF]/20 text-[#00D4FF] text-xs">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Ventures */}
              {cvSummary.recommended_ventures && cvSummary.recommended_ventures.length > 0 && (
                <div>
                  <h5 className="text-white text-sm font-semibold mb-2">🚀 Ventures Recomendadas</h5>
                  <div className="flex flex-wrap gap-2">
                    {cvSummary.recommended_ventures.map((venture, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-full bg-purple-400/20 text-purple-300 text-xs">
                        {venture}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Seniority & Salary */}
              <div className="grid md:grid-cols-2 gap-3">
                {cvSummary.seniority_assessment && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Senioridade Avaliada</div>
                    <div className="text-white font-medium">{cvSummary.seniority_assessment}</div>
                  </div>
                )}
                {cvSummary.salary_range_estimate && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Faixa Salarial Estimada</div>
                    <div className="text-white font-medium">{cvSummary.salary_range_estimate}</div>
                  </div>
                )}
              </div>

              {/* Considerations */}
              {cvSummary.considerations && cvSummary.considerations.length > 0 && (
                <div>
                  <h5 className="text-white text-sm font-semibold mb-2">⚠️ Pontos de Atenção</h5>
                  <ul className="space-y-1.5">
                    {cvSummary.considerations.map((item, idx) => (
                      <li key={idx} className="text-slate-400 text-sm flex items-start gap-2">
                        <span className="text-yellow-400 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

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

          {/* Quiz Integration */}
          <div className="border-t border-white/10 pt-6">
            <QuizIntegration talent={talent} />
          </div>

          {/* Ventures Allocation */}
          <div className="border-t border-white/10 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-semibold">Ventures Alocadas</h4>
              <Button
                onClick={() => setShowVentureDialog(true)}
                size="sm"
                className="bg-[#00D4FF] hover:bg-[#00B8E6] text-[#06101F]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Venture
              </Button>
            </div>

            {talentVentures && talentVentures.length > 0 ? (
              <div className="space-y-2">
                {talentVentures.map((tv) => {
                  const venture = allVentures?.find(v => v.id === tv.venture_id);
                  return (
                    <div key={tv.id} className="bg-white/5 rounded-lg p-3 flex items-start justify-between group">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{venture?.name || 'Venture'}</span>
                          {tv.is_lead && (
                            <Badge className="bg-[#C7A763]/20 text-[#C7A763] text-xs">Lead</Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-400 mt-1">{tv.role}</div>
                        <div className="text-xs text-slate-500 mt-1">Alocação: {tv.allocation_percentage}%</div>
                      </div>
                      <button
                        onClick={() => removeVentureMutation.mutate(tv.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/20 rounded-lg text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 bg-white/5 rounded-lg">
                <p className="text-sm">Nenhuma venture alocada</p>
              </div>
            )}
          </div>

          {/* Performance Tracking */}
          <div className="border-t border-white/10 pt-6">
            <Tabs defaultValue="feedback">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="feedback">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Feedbacks
                </TabsTrigger>
                <TabsTrigger value="feedback360">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Feedback 360°
                </TabsTrigger>
                <TabsTrigger value="insights360">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Insights 360°
                </TabsTrigger>
                <TabsTrigger value="goals">
                  <Target className="w-4 h-4 mr-2" />
                  Metas
                </TabsTrigger>
                <TabsTrigger value="onboarding">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Onboarding
                </TabsTrigger>
                <TabsTrigger value="badges">
                  <Trophy className="w-4 h-4 mr-2" />
                  Conquistas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="feedback" className="mt-4">
                <FeedbackCollection talentId={talent.id} talentName={talent.full_name} />
              </TabsContent>

              <TabsContent value="feedback360" className="mt-4">
                <Feedback360Manager talentId={talent.id} talentName={talent.full_name} />
              </TabsContent>

              <TabsContent value="insights360" className="mt-4">
                <Feedback360Insights talentId={talent.id} talentName={talent.full_name} />
              </TabsContent>

              <TabsContent value="goals" className="mt-4">
                <GoalTracking talentId={talent.id} talentName={talent.full_name} />
              </TabsContent>

              <TabsContent value="onboarding" className="mt-4">
                <OnboardingChecklist talentId={talent.id} />
              </TabsContent>

              <TabsContent value="badges" className="mt-4">
                <BadgeShowcase talentId={talent.id} />
              </TabsContent>
            </Tabs>
          </div>

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

      {/* Add Venture Dialog */}
      <Dialog open={showVentureDialog} onOpenChange={setShowVentureDialog}>
        <DialogContent className="bg-[#0a1628] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Adicionar Venture ao Talento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-white">Selecionar Venture</Label>
              <Select value={selectedVentureId} onValueChange={setSelectedVentureId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Escolha uma venture..." />
                </SelectTrigger>
                <SelectContent>
                  {availableVentures.map(venture => (
                    <SelectItem key={venture.id} value={venture.id}>
                      {venture.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Papel na Venture *</Label>
              <Select 
                value={ventureAllocationData.role} 
                onValueChange={(v) => setVentureAllocationData({...ventureAllocationData, role: v})}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione um cargo..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Alocação (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={ventureAllocationData.allocation_percentage}
                onChange={(e) => setVentureAllocationData({...ventureAllocationData, allocation_percentage: parseInt(e.target.value) || 0})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-white">Responsabilidades (separadas por vírgula)</Label>
              <Input
                value={ventureAllocationData.responsibilities}
                onChange={(e) => setVentureAllocationData({...ventureAllocationData, responsibilities: e.target.value})}
                placeholder="ex: Desenvolvimento backend, Code reviews..."
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={ventureAllocationData.is_lead}
                onChange={(e) => setVentureAllocationData({...ventureAllocationData, is_lead: e.target.checked})}
                className="rounded"
              />
              <Label className="text-white">É líder/responsável principal?</Label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowVentureDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAddVenture}
                disabled={addVentureMutation.isPending}
                className="bg-[#00D4FF] hover:bg-[#00B8E6] text-[#06101F]"
              >
                {addVentureMutation.isPending ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}