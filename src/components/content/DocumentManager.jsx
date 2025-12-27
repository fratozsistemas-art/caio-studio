import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, Image, Video, File, 
  Download, Trash2, History, Plus, Search, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeIcons = {
  image: Image,
  video: Video,
  file: FileText,
  text: FileText
};

const categoryColors = {
  venture: 'bg-blue-500/20 text-blue-400',
  team: 'bg-purple-500/20 text-purple-400',
  platform: 'bg-cyan-500/20 text-cyan-400',
  marketing: 'bg-pink-500/20 text-pink-400',
  other: 'bg-slate-500/20 text-slate-400'
};

export default function DocumentManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showVersions, setShowVersions] = useState(false);
  const queryClient = useQueryClient();

  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: 'other',
    tags: []
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: assets, isLoading } = useQuery({
    queryKey: ['content-assets'],
    queryFn: async () => {
      const res = await base44.asServiceRole.entities.ContentAsset.list('-created_date', 100);
      return res || [];
    }
  });

  const { data: versions } = useQuery({
    queryKey: ['asset-versions', selectedAsset?.id],
    queryFn: async () => {
      const res = await base44.asServiceRole.entities.ContentAssetVersion.filter({
        asset_id: selectedAsset.id
      }, '-version_number', 50);
      return res || [];
    },
    enabled: !!selectedAsset?.id
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, data }) => {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Determine type from file
      const fileType = file.type.startsWith('image/') ? 'image' 
        : file.type.startsWith('video/') ? 'video' 
        : 'file';

      // Create asset
      const asset = await base44.asServiceRole.entities.ContentAsset.create({
        ...data,
        type: fileType,
        file_url,
        current_version: 1,
        version_count: 1
      });

      // Create first version
      await base44.asServiceRole.entities.ContentAssetVersion.create({
        asset_id: asset.id,
        version_number: 1,
        file_url,
        created_by: (await base44.auth.me()).email,
        change_notes: 'Upload inicial'
      });

      return asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['content-assets']);
      setShowUpload(false);
      setSelectedFile(null);
      setUploadData({ title: '', description: '', category: 'other', tags: [] });
      toast.success('Documento enviado');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.asServiceRole.entities.ContentAsset.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['content-assets']);
      toast.success('Documento removido');
    }
  });

  const handleUpload = () => {
    if (!selectedFile || !uploadData.title.trim()) {
      toast.error('Selecione um arquivo e preencha o título');
      return;
    }
    uploadMutation.mutate({ file: selectedFile, data: uploadData });
  };

  const filteredAssets = assets?.filter(asset => {
    const matchesSearch = !searchQuery || 
      asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || asset.category === filterCategory;
    const matchesType = filterType === 'all' || asset.type === filterType;
    return matchesSearch && matchesCategory && matchesType;
  }) || [];

  return (
    <div className="space-y-6">
      <GlowCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Gerenciamento de Documentos</h2>
            <p className="text-slate-400 text-sm mt-1">Upload, versionamento e organização de conteúdo</p>
          </div>
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogTrigger asChild>
              <Button className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]">
                <Plus className="w-4 h-4 mr-2" />
                Novo Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a1628] border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">Upload de Documento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0])}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="text-white mb-1">
                      {selectedFile ? selectedFile.name : 'Clique para selecionar arquivo'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Imagens, vídeos, documentos
                    </p>
                  </label>
                </div>

                <Input
                  placeholder="Título do documento *"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />

                <Input
                  placeholder="Descrição"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />

                <Select 
                  value={uploadData.category} 
                  onValueChange={(v) => setUploadData({...uploadData, category: v})}
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

                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="w-full bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar documentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              <SelectItem value="venture">Venture</SelectItem>
              <SelectItem value="team">Time</SelectItem>
              <SelectItem value="platform">Plataforma</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tipos</SelectItem>
              <SelectItem value="image">Imagens</SelectItem>
              <SelectItem value="video">Vídeos</SelectItem>
              <SelectItem value="file">Arquivos</SelectItem>
              <SelectItem value="text">Texto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assets Grid */}
        {isLoading ? (
          <div className="text-center text-slate-400 py-12">Carregando...</div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            <File className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>Nenhum documento encontrado</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredAssets.map((asset) => {
                const Icon = typeIcons[asset.type] || FileText;
                return (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <GlowCard className="p-4 hover:bg-white/5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-[#C7A763]/20 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-[#C7A763]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold truncate">{asset.title}</h4>
                          {asset.description && (
                            <p className="text-xs text-slate-400 line-clamp-2">{asset.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={categoryColors[asset.category]}>
                          {asset.category}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          v{asset.current_version || 1}
                        </span>
                      </div>

                      {asset.tags && asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {asset.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} className="bg-white/10 text-slate-300 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <span className="text-xs text-slate-500">
                          {format(new Date(asset.created_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <div className="flex gap-1">
                          {asset.file_url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              asChild
                              className="h-8 w-8 p-0 text-white hover:bg-white/10"
                            >
                              <a href={asset.file_url} download target="_blank" rel="noopener noreferrer">
                                <Download className="w-3 h-3" />
                              </a>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedAsset(asset);
                              setShowVersions(true);
                            }}
                            className="h-8 w-8 p-0 text-[#00D4FF] hover:bg-white/10"
                          >
                            <History className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(asset.id)}
                            className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </GlowCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </GlowCard>

      {/* Version History Dialog */}
      <Dialog open={showVersions} onOpenChange={setShowVersions}>
        <DialogContent className="bg-[#0a1628] border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              Histórico de Versões - {selectedAsset?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {versions?.map((version) => (
              <div key={version.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">Versão {version.version_number}</span>
                  <span className="text-xs text-slate-500">
                    {format(new Date(version.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {version.change_notes && (
                  <p className="text-sm text-slate-400 mb-2">{version.change_notes}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Por: {version.created_by}</span>
                  {version.file_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="h-7 text-xs border-white/20 text-white hover:bg-white/10"
                    >
                      <a href={version.file_url} download>
                        <Download className="w-3 h-3 mr-1" />
                        Baixar
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}