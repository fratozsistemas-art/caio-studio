import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, File, Image as ImageIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import GlowCard from "@/components/ui/GlowCard";

export default function VersionUploader({ asset, onClose, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [changeNotes, setChangeNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (asset.type !== 'text' && !file) {
      toast.error('Selecione um arquivo');
      return;
    }

    if (asset.type === 'text' && !textContent.trim()) {
      toast.error('Digite o conteúdo do texto');
      return;
    }

    setUploading(true);

    try {
      let fileUrl = null;

      // Upload file if not text type
      if (asset.type !== 'text' && file) {
        const uploadResponse = await base44.integrations.Core.UploadFile({ file });
        fileUrl = uploadResponse.file_url;
      }

      // Create new version
      await base44.functions.invoke('manageAssetVersion', {
        action: 'create_version',
        asset_id: asset.id,
        file_url: fileUrl,
        text_content: asset.type === 'text' ? textContent : null,
        change_notes: changeNotes || 'Nova versão carregada'
      });

      toast.success('Nova versão criada com sucesso!');
      onSuccess();
    } catch (error) {
      toast.error('Erro ao criar versão: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <GlowCard glowColor="gold" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Upload Nova Versão</h3>
              <p className="text-slate-400 text-sm">{asset.title}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/70 hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File or Text Input */}
            {asset.type === 'text' ? (
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Novo Conteúdo</label>
                <Textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Digite o novo conteúdo..."
                  className="bg-white/5 border-white/10 text-white min-h-[200px]"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  Novo Arquivo ({asset.type})
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    accept={asset.type === 'image' ? 'image/*' : '*'}
                    className="hidden"
                    id="version-file-upload"
                    required
                  />
                  <label
                    htmlFor="version-file-upload"
                    className="flex items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-[#C7A763]/40 transition-all cursor-pointer"
                  >
                    {file ? (
                      <>
                        <File className="w-6 h-6 text-[#C7A763]" />
                        <span className="text-white">{file.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-400" />
                        <span className="text-slate-400">
                          Clique para selecionar novo arquivo
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}

            {/* Change Notes */}
            <div>
              <label className="text-sm text-slate-300 mb-2 block">
                Notas da Mudança (opcional)
              </label>
              <Input
                value={changeNotes}
                onChange={(e) => setChangeNotes(e.target.value)}
                placeholder="Ex: Correção de erros, atualização de design..."
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={uploading}
                className="border-white/10 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={uploading}
                className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F] font-semibold"
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-pulse" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Criar Nova Versão
                  </>
                )}
              </Button>
            </div>
          </form>
        </GlowCard>
      </motion.div>
    </motion.div>
  );
}