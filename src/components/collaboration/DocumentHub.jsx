import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Upload, File, FileText, Image, Video, Download, Trash2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";
import moment from 'moment';

export default function DocumentHub({ ventureId, ventureName, currentUser }) {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'venture'
  });
  const queryClient = useQueryClient();

  const { data: documentsResponse, refetch } = useQuery({
    queryKey: ['ventureDocuments', ventureId],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ContentAsset',
        operation: 'list',
        sort: '-created_date'
      });
      return response.data;
    }
  });

  const documents = documentsResponse?.data || [];

  const deleteDocument = useMutation({
    mutationFn: async (docId) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ContentAsset',
        operation: 'delete',
        id: docId
      });
    },
    onSuccess: () => {
      refetch();
      toast.success('Documento removido');
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.title) {
      toast.error('Adicione um título para o documento');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const fileType = file.type.startsWith('image/') ? 'image' 
        : file.type.startsWith('video/') ? 'video' 
        : 'file';

      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ContentAsset',
        operation: 'create',
        data: {
          title: formData.title,
          description: formData.description,
          type: fileType,
          file_url,
          category: formData.category,
          tags: [ventureName, ventureId]
        }
      });

      setFormData({ title: '', description: '', category: 'venture' });
      refetch();
      toast.success('Documento enviado!');
    } catch (error) {
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="gold" className="p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Enviar Documento
        </h3>
        <div className="space-y-4">
          <Input
            placeholder="Título do documento *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="bg-white/5 border-white/10 text-white"
          />
          <Textarea
            placeholder="Descrição (opcional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="bg-white/5 border-white/10 text-white"
            rows={2}
          />
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="venture">Venture</SelectItem>
              <SelectItem value="team">Time</SelectItem>
              <SelectItem value="platform">Plataforma</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading || !formData.title}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                type="button"
                disabled={uploading || !formData.title}
                className="w-full bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
                onClick={() => document.getElementById('file-upload').click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Escolher Arquivo
                  </>
                )}
              </Button>
            </label>
          </div>
        </div>
      </GlowCard>

      <div className="grid md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlowCard glowColor="cyan" className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-[#00D4FF] mt-1">
                    {getFileIcon(doc.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{doc.title}</h4>
                    {doc.description && (
                      <p className="text-sm text-slate-400 line-clamp-2 mt-1">
                        {doc.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <span className="px-2 py-0.5 rounded bg-white/5">{doc.category}</span>
                      <span>{moment(doc.created_date).fromNow()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button size="sm" variant="ghost" className="text-white/70 hover:text-white">
                      <Download className="w-4 h-4" />
                    </Button>
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteDocument.mutate(doc.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {documents.length === 0 && (
        <GlowCard glowColor="mixed" className="p-12">
          <div className="text-center space-y-3">
            <FileText className="w-12 h-12 mx-auto text-slate-500 opacity-30" />
            <p className="text-slate-400">Nenhum documento compartilhado ainda</p>
          </div>
        </GlowCard>
      )}
    </div>
  );
}