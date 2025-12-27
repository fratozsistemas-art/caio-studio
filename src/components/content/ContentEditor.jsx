import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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
import { Badge } from '@/components/ui/badge';
import { X, Save, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '@/components/ui/GlowCard';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['link', 'image', 'video'],
    ['clean']
  ],
};

export default function ContentEditor({ asset, onClose, onSave }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    const getUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    getUser();
  }, []);

  const [content, setContent] = useState({
    title: asset?.title || '',
    description: asset?.description || '',
    text_content: asset?.text_content || '',
    category: asset?.category || 'venture',
    tags: asset?.tags || []
  });

  const [newTag, setNewTag] = useState('');
  const [preview, setPreview] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (asset?.id) {
        // Update existing
        await base44.asServiceRole.entities.ContentAsset.update(asset.id, {
          ...data,
          current_version: (asset.current_version || 1) + 1
        });
        
        // Create version
        await base44.asServiceRole.entities.ContentAssetVersion.create({
          asset_id: asset.id,
          version_number: (asset.current_version || 1) + 1,
          content: data.text_content,
          created_by: user?.email,
          change_notes: 'Atualização via editor'
        });

        return asset.id;
      } else {
        // Create new
        const newAsset = await base44.asServiceRole.entities.ContentAsset.create({
          ...data,
          type: 'text',
          current_version: 1
        });

        // Create first version
        await base44.asServiceRole.entities.ContentAssetVersion.create({
          asset_id: newAsset.id,
          version_number: 1,
          content: data.text_content,
          created_by: user?.email,
          change_notes: 'Versão inicial'
        });

        return newAsset.id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['content-assets']);
      toast.success('Conteúdo salvo');
      if (onSave) onSave();
    }
  });

  const handleSave = () => {
    if (!content.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    saveMutation.mutate(content);
  };

  const addTag = () => {
    if (newTag.trim() && !content.tags.includes(newTag.trim())) {
      setContent({...content, tags: [...content.tags, newTag.trim()]});
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setContent({...content, tags: content.tags.filter(t => t !== tag)});
  };

  return (
    <GlowCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#C7A763]" />
          <h3 className="text-xl font-bold text-white">
            {asset ? 'Editar Conteúdo' : 'Novo Conteúdo'}
          </h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreview(!preview)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Eye className="w-4 h-4 mr-2" />
            {preview ? 'Editar' : 'Preview'}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {!preview ? (
        <div className="space-y-4">
          <Input
            placeholder="Título *"
            value={content.title}
            onChange={(e) => setContent({...content, title: e.target.value})}
            className="bg-white/5 border-white/10 text-white text-lg font-semibold"
          />

          <Textarea
            placeholder="Descrição curta"
            value={content.description}
            onChange={(e) => setContent({...content, description: e.target.value})}
            className="bg-white/5 border-white/10 text-white"
          />

          <Select 
            value={content.category} 
            onValueChange={(v) => setContent({...content, category: v})}
          >
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

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="bg-white/5 border-white/10 text-white"
              />
              <Button onClick={addTag} size="sm" className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]">
                Adicionar
              </Button>
            </div>
            {content.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {content.tags.map((tag, idx) => (
                  <Badge key={idx} className="bg-white/10 text-white">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-2">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Rich Text Editor */}
          <div className="bg-white rounded-lg">
            <ReactQuill 
              theme="snow"
              value={content.text_content}
              onChange={(value) => setContent({...content, text_content: value})}
              modules={modules}
              className="min-h-[400px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {onClose && (
              <Button variant="outline" onClick={onClose} className="border-white/20 text-white">
                Cancelar
              </Button>
            )}
            <Button 
              onClick={handleSave} 
              disabled={saveMutation.isPending}
              className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      ) : (
        <div className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-white mb-2">{content.title}</h1>
          {content.description && (
            <p className="text-slate-400 text-lg mb-6">{content.description}</p>
          )}
          {content.tags.length > 0 && (
            <div className="flex gap-2 mb-6">
              {content.tags.map((tag, idx) => (
                <Badge key={idx} className="bg-[#C7A763]/20 text-[#C7A763]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <div 
            className="text-white"
            dangerouslySetInnerHTML={{ __html: content.text_content }}
          />
        </div>
      )}
    </GlowCard>
  );
}