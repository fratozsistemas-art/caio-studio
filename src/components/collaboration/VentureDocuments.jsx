import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Download, Trash2, Eye, Tag, Filter, Sparkles } from 'lucide-react';
import DocumentAIAnalysis from '@/components/ventures/DocumentAIAnalysis';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';
import { useVenturePermissions } from './useVenturePermissions';
import { Lock } from 'lucide-react';
import DocumentsGrid from '@/components/ventures/DocumentsGrid';

const categories = [
  { value: 'financial', label: 'Financeiro', color: 'text-green-400' },
  { value: 'legal', label: 'Jurídico', color: 'text-blue-400' },
  { value: 'pitch', label: 'Pitch/Apresentação', color: 'text-purple-400' },
  { value: 'technical', label: 'Técnico', color: 'text-cyan-400' },
  { value: 'other', label: 'Outros', color: 'text-slate-400' }
];

export default function VentureDocuments({ ventureId, ventureName }) {
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const { canView, canEdit } = useVenturePermissions(ventureId, 'documents');

  const [newDoc, setNewDoc] = useState({
    title: '',
    description: '',
    category: 'other',
    tags: '',
    file: null
  });
  const [analyzingDoc, setAnalyzingDoc] = useState(null);

  React.useEffect(() => {
    const getUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    getUser();
  }, []);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['venture-documents', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureDocument',
        operation: 'filter',
        query: { venture_id: ventureId },
        sort: '-created_date'
      });
      return res.data?.data || [];
    },
    enabled: !!ventureId
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (docId) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureDocument',
        operation: 'delete',
        id: docId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['venture-documents', ventureId]);
      toast.success('Documento removido');
    }
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewDoc({...newDoc, file, title: newDoc.title || file.name});
    }
  };

  const handleUpload = async () => {
    if (!newDoc.file || !newDoc.title.trim()) {
      toast.error('Arquivo e título são obrigatórios');
      return;
    }

    setUploading(true);
    try {
      // Upload file
      const uploadRes = await base44.integrations.Core.UploadFile({
        file: newDoc.file
      });

      // Create document record
      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureDocument',
        operation: 'create',
        data: {
          venture_id: ventureId,
          title: newDoc.title,
          description: newDoc.description,
          file_url: uploadRes.file_url,
          file_name: newDoc.file.name,
          file_size: newDoc.file.size,
          file_type: newDoc.file.type,
          category: newDoc.category,
          uploaded_by: user?.email,
          tags: newDoc.tags.split(',').map(t => t.trim()).filter(Boolean)
        }
      });

      queryClient.invalidateQueries(['venture-documents', ventureId]);
      setShowUpload(false);
      setNewDoc({
        title: '',
        description: '',
        category: 'other',
        tags: '',
        file: null
      });
      toast.success('Documento enviado com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar documento');
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = documents?.filter(doc => 
    filterCategory === 'all' || doc.category === filterCategory
  ) || [];

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!canView) {
    return (
      <GlowCard className="p-8 text-center">
        <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-400">Você não tem permissão para visualizar os documentos desta venture.</p>
      </GlowCard>
    );
  }

  if (isLoading) {
    return (
      <GlowCard className="p-6">
        <div className="text-center text-slate-400">Carregando documentos...</div>
      </GlowCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Documentos</h3>
          <p className="text-sm text-slate-400">{documents?.length || 0} documentos</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canEdit && (
            <Dialog open={showUpload} onOpenChange={setShowUpload}>
              <DialogTrigger asChild>
                <Button className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-[#0a1628] border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">Enviar Documento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Arquivo *</label>
                  <Input
                    type="file"
                    onChange={handleFileSelect}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  {newDoc.file && (
                    <p className="text-xs text-slate-400 mt-1">
                      {newDoc.file.name} ({formatFileSize(newDoc.file.size)})
                    </p>
                  )}
                </div>

                <Input
                  placeholder="Título *"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({...newDoc, title: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />

                <Textarea
                  placeholder="Descrição"
                  value={newDoc.description}
                  onChange={(e) => setNewDoc({...newDoc, description: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />

                <Select value={newDoc.category} onValueChange={(v) => setNewDoc({...newDoc, category: v})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Tags (separadas por vírgula)"
                  value={newDoc.tags}
                  onChange={(e) => setNewDoc({...newDoc, tags: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowUpload(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]"
                  >
                    {uploading ? 'Enviando...' : 'Enviar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => {
          const category = categories.find(c => c.value === doc.category);
          return (
            <motion.div key={doc.id} layout>
              <GlowCard className="p-4 h-full">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-[#C7A763]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {doc.title}
                    </h4>
                    {doc.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {doc.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-xs ${category?.color}`}>
                        {category?.label}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatFileSize(doc.file_size)}
                      </span>
                    </div>

                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {doc.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#00D4FF] hover:text-[#00B8E6] flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </a>
                      <button
                        onClick={() => setAnalyzingDoc(doc)}
                        className="text-xs text-[#C7A763] hover:text-[#D4B474] flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        Analyze
                      </button>
                      <button
                        onClick={() => deleteDocMutation.mutate(doc.id)}
                        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          );
        })}
      </div>

      {filteredDocs.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">Nenhum documento encontrado</p>
        </div>
      )}

      {/* AI Analysis Modal */}
      <AnimatePresence>
        {analyzingDoc && (
          <DocumentAIAnalysis
            document={analyzingDoc}
            ventureId={ventureId}
            onClose={() => setAnalyzingDoc(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}