import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, Image, Type, Loader2, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import GlowCard from "@/components/ui/GlowCard";

export default function FileUploader({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [assetType, setAssetType] = useState('image');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [textContent, setTextContent] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name }));
      }
    }
  };

  const handleUpload = async () => {
    if (!formData.title) {
      toast.error('Por favor, adicione um título');
      return;
    }

    if (assetType !== 'text' && !selectedFile) {
      toast.error('Por favor, selecione um arquivo');
      return;
    }

    if (assetType === 'text' && !textContent) {
      toast.error('Por favor, adicione o conteúdo de texto');
      return;
    }

    setUploading(true);

    try {
      let fileUrl = null;

      // Upload file if not text
      if (assetType !== 'text' && selectedFile) {
        const uploadResult = await base44.integrations.Core.UploadFile({
          file: selectedFile
        });
        fileUrl = uploadResult.file_url;
      }

      // Create asset record
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await base44.entities.ContentAsset.create({
        title: formData.title,
        type: assetType,
        file_url: fileUrl,
        text_content: assetType === 'text' ? textContent : null,
        description: formData.description,
        tags: tagsArray,
        category: formData.category
      });

      toast.success('Asset enviado com sucesso!');
      
      // Reset form
      setFormData({ title: '', description: '', category: 'other', tags: '' });
      setSelectedFile(null);
      setTextContent('');
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      toast.error('Erro ao fazer upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <GlowCard glowColor="gold" className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#C7A763]/10 border border-[#C7A763]/20 flex items-center justify-center">
          <Upload className="w-5 h-5 text-[#C7A763]" />
        </div>
        <h3 className="text-xl font-bold text-white font-montserrat">Novo Asset</h3>
      </div>

      <div className="space-y-4">
        {/* Asset Type */}
        <div>
          <Label className="text-white/70 mb-2 block">Tipo de Asset</Label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'image', label: 'Imagem', icon: Image },
              { value: 'file', label: 'Arquivo', icon: File },
              { value: 'text', label: 'Texto', icon: Type }
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setAssetType(type.value)}
                className={`p-4 rounded-xl border transition-all ${
                  assetType === type.value
                    ? 'border-[#C7A763] bg-[#C7A763]/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <type.icon className={`w-6 h-6 mx-auto mb-2 ${
                  assetType === type.value ? 'text-[#C7A763]' : 'text-white/50'
                }`} />
                <span className={`text-sm ${
                  assetType === type.value ? 'text-[#C7A763]' : 'text-white/70'
                }`}>
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* File Upload or Text Input */}
        {assetType === 'text' ? (
          <div>
            <Label className="text-white/70 mb-2 block">Conteúdo de Texto</Label>
            <Textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Cole ou escreva o texto aqui..."
              className="bg-white/5 border-white/10 text-white min-h-[200px]"
            />
          </div>
        ) : (
          <div>
            <Label className="text-white/70 mb-2 block">
              {assetType === 'image' ? 'Selecionar Imagem' : 'Selecionar Arquivo'}
            </Label>
            <label className="block">
              <input
                type="file"
                onChange={handleFileSelect}
                accept={assetType === 'image' ? 'image/*' : '*'}
                className="hidden"
              />
              <div className="p-8 border-2 border-dashed border-white/20 rounded-xl hover:border-[#C7A763]/50 transition-colors cursor-pointer text-center bg-white/5">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2 text-[#C7A763]">
                    <Check className="w-5 h-5" />
                    <span className="text-sm">{selectedFile.name}</span>
                  </div>
                ) : (
                  <div className="text-white/50">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Clique para selecionar ou arraste aqui</p>
                  </div>
                )}
              </div>
            </label>
          </div>
        )}

        {/* Title */}
        <div>
          <Label className="text-white/70 mb-2 block">Título *</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Nome ou título do asset"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        {/* Description */}
        <div>
          <Label className="text-white/70 mb-2 block">Descrição</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descrição ou notas sobre este asset"
            className="bg-white/5 border-white/10 text-white"
            rows={3}
          />
        </div>

        {/* Category */}
        <div>
          <Label className="text-white/70 mb-2 block">Categoria</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="venture">Venture</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div>
          <Label className="text-white/70 mb-2 block">Tags (separadas por vírgula)</Label>
          <Input
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="exemplo, portfolio, hero"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-gradient-to-r from-[#C7A763] to-[#A88B4A] hover:from-[#D4B474] hover:to-[#B99B5A] text-[#06101F] font-semibold"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Fazer Upload
            </>
          )}
        </Button>
      </div>
    </GlowCard>
  );
}