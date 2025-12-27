import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Linkedin, Upload, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

export default function AddTalentDialog({ isOpen, onClose }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [manualData, setManualData] = useState({
    full_name: '',
    email: '',
    phone: '',
    linkedin_url: '',
    current_position: '',
    current_company: '',
    location: '',
    skills: '',
    seniority_level: 'mid',
    availability: 'passive',
    summary: '',
    source: 'direct_application'
  });

  const queryClient = useQueryClient();

  const createTalentMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Talent',
        operation: 'create',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['talents']);
      toast.success('Talento adicionado com sucesso!');
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao adicionar talento: ' + error.message);
    }
  });

  const resetForm = () => {
    setLinkedinUrl('');
    setCvFile(null);
    setManualData({
      full_name: '',
      email: '',
      phone: '',
      linkedin_url: '',
      current_position: '',
      current_company: '',
      location: '',
      skills: '',
      seniority_level: 'mid',
      availability: 'passive',
      summary: '',
      source: 'direct_application'
    });
  };

  const handleLinkedinExtract = async () => {
    if (!linkedinUrl) {
      toast.error('Insira uma URL do LinkedIn');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract professional information from this LinkedIn profile URL: ${linkedinUrl}
        
        Return a JSON object with the following structure:
        {
          "full_name": "string",
          "current_position": "string",
          "current_company": "string",
          "location": "string",
          "summary": "string",
          "skills": ["skill1", "skill2"],
          "experience_years": number
        }
        
        If you cannot access the URL, return what you can infer from the URL structure itself.`,
        response_json_schema: {
          type: "object",
          properties: {
            full_name: { type: "string" },
            current_position: { type: "string" },
            current_company: { type: "string" },
            location: { type: "string" },
            summary: { type: "string" },
            skills: { type: "array", items: { type: "string" } },
            experience_years: { type: "number" }
          }
        }
      });

      const extractedData = {
        ...response,
        linkedin_url: linkedinUrl,
        skills: response.skills || [],
        source: 'linkedin',
        status: 'new'
      };

      createTalentMutation.mutate(extractedData);
    } catch (error) {
      toast.error('Erro ao extrair dados do LinkedIn');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCVUpload = async () => {
    if (!cvFile) {
      toast.error('Selecione um arquivo de CV');
      return;
    }

    setIsProcessing(true);
    try {
      // Upload CV file
      const uploadResponse = await base44.integrations.Core.UploadFile({ file: cvFile });
      const cvUrl = uploadResponse.file_url;

      // Extract data from CV using AI
      const extractResponse = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: cvUrl,
        json_schema: {
          type: "object",
          properties: {
            full_name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            current_position: { type: "string" },
            current_company: { type: "string" },
            location: { type: "string" },
            summary: { type: "string" },
            skills: { type: "array", items: { type: "string" } },
            experience_years: { type: "number" },
            education: { 
              type: "array", 
              items: {
                type: "object",
                properties: {
                  degree: { type: "string" },
                  institution: { type: "string" },
                  field: { type: "string" },
                  year: { type: "string" }
                }
              }
            },
            languages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  language: { type: "string" },
                  proficiency: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (extractResponse.status === 'success') {
        const talentData = {
          ...extractResponse.output,
          cv_file_url: cvUrl,
          source: 'cv_upload',
          status: 'new'
        };

        createTalentMutation.mutate(talentData);
      } else {
        toast.error('Erro ao processar CV: ' + extractResponse.details);
      }
    } catch (error) {
      toast.error('Erro ao fazer upload do CV');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    
    const talentData = {
      ...manualData,
      skills: manualData.skills ? manualData.skills.split(',').map(s => s.trim()) : [],
      status: 'new'
    };

    createTalentMutation.mutate(talentData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-[#0a1628] border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">Adicionar Talento</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="linkedin" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 grid grid-cols-3">
            <TabsTrigger value="linkedin">
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </TabsTrigger>
            <TabsTrigger value="cv">
              <Upload className="w-4 h-4 mr-2" />
              Upload CV
            </TabsTrigger>
            <TabsTrigger value="manual">
              <FileText className="w-4 h-4 mr-2" />
              Manual
            </TabsTrigger>
          </TabsList>

          {/* LinkedIn Tab */}
          <TabsContent value="linkedin" className="space-y-4">
            <div>
              <Label className="text-white">URL do LinkedIn</Label>
              <Input
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/nome-pessoa"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <Button
              onClick={handleLinkedinExtract}
              disabled={isProcessing}
              className="w-full bg-[#0077B5] hover:bg-[#006399]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extraindo dados...
                </>
              ) : (
                <>
                  <Linkedin className="w-4 h-4 mr-2" />
                  Extrair dados do LinkedIn
                </>
              )}
            </Button>
            <p className="text-xs text-slate-400">
              A IA irá extrair informações do perfil automaticamente
            </p>
          </TabsContent>

          {/* CV Upload Tab */}
          <TabsContent value="cv" className="space-y-4">
            <div>
              <Label className="text-white">Arquivo de CV</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setCvFile(e.target.files[0])}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            {cvFile && (
              <div className="text-sm text-slate-400">
                Arquivo selecionado: {cvFile.name}
              </div>
            )}
            <Button
              onClick={handleCVUpload}
              disabled={isProcessing || !cvFile}
              className="w-full bg-[#C7A763] hover:bg-[#A88B4A]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando CV...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Processar e Adicionar
                </>
              )}
            </Button>
            <p className="text-xs text-slate-400">
              A IA irá extrair informações do currículo automaticamente
            </p>
          </TabsContent>

          {/* Manual Entry Tab */}
          <TabsContent value="manual">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Nome Completo *</Label>
                  <Input
                    value={manualData.full_name}
                    onChange={(e) => setManualData({ ...manualData, full_name: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
                <div>
                  <Label className="text-white">Email *</Label>
                  <Input
                    type="email"
                    value={manualData.email}
                    onChange={(e) => setManualData({ ...manualData, email: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Telefone</Label>
                  <Input
                    value={manualData.phone}
                    onChange={(e) => setManualData({ ...manualData, phone: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">LinkedIn</Label>
                  <Input
                    value={manualData.linkedin_url}
                    onChange={(e) => setManualData({ ...manualData, linkedin_url: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Cargo Atual</Label>
                  <Input
                    value={manualData.current_position}
                    onChange={(e) => setManualData({ ...manualData, current_position: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Empresa Atual</Label>
                  <Input
                    value={manualData.current_company}
                    onChange={(e) => setManualData({ ...manualData, current_company: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Localização</Label>
                  <Input
                    value={manualData.location}
                    onChange={(e) => setManualData({ ...manualData, location: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Nível</Label>
                  <Select value={manualData.seniority_level} onValueChange={(v) => setManualData({ ...manualData, seniority_level: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="mid">Mid-level</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-white">Skills (separadas por vírgula)</Label>
                <Input
                  value={manualData.skills}
                  onChange={(e) => setManualData({ ...manualData, skills: e.target.value })}
                  placeholder="React, Node.js, Python..."
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label className="text-white">Resumo Profissional</Label>
                <Textarea
                  value={manualData.summary}
                  onChange={(e) => setManualData({ ...manualData, summary: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                disabled={createTalentMutation.isPending}
                className="w-full bg-[#C7A763] hover:bg-[#A88B4A]"
              >
                {createTalentMutation.isPending ? 'Adicionando...' : 'Adicionar Talento'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}