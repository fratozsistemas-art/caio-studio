import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Upload, File, Search, Filter, Download, Trash2, Eye, Folder, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FileManager() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ventureFilter, setVentureFilter] = useState('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadData, setUploadData] = useState({
    name: '',
    category: 'other',
    venture_id: '',
    description: '',
    tags: '',
    is_public: false
  });
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const getUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    getUser();
  }, []);

  const { data: files = [] } = useQuery({
    queryKey: ['arquivos'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Arquivo',
        operation: 'list',
        sort: '-created_date'
      });
      return res.data?.data || [];
    }
  });

  const { data: ventures = [] } = useQuery({
    queryKey: ['all-ventures'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Venture',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Arquivo',
        operation: 'delete',
        id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['arquivos']);
      toast.success('Arquivo removido');
    }
  });

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const venture = ventures.find(v => v.id === uploadData.venture_id);
      const tags = uploadData.tags.split(',').map(t => t.trim()).filter(Boolean);

      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Arquivo',
        operation: 'create',
        data: {
          name: uploadData.name || file.name,
          file_url,
          file_size: file.size,
          file_type: file.type,
          category: uploadData.category,
          venture_id: uploadData.venture_id || null,
          venture_name: venture?.name || null,
          description: uploadData.description,
          tags,
          uploaded_by: user?.email,
          is_public: uploadData.is_public
        }
      });

      queryClient.invalidateQueries(['arquivos']);
      setShowUploadDialog(false);
      setUploadData({
        name: '',
        category: 'other',
        venture_id: '',
        description: '',
        tags: '',
        is_public: false
      });
      toast.success('Arquivo enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = search === '' || 
      file.name.toLowerCase().includes(search.toLowerCase()) ||
      file.description?.toLowerCase().includes(search.toLowerCase()) ||
      file.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter;
    const matchesVenture = ventureFilter === 'all' || file.venture_id === ventureFilter;
    
    return matchesSearch && matchesCategory && matchesVenture;
  });

  const categories = {
    marketing: { label: 'Marketing', color: 'bg-purple-500/20 text-purple-400' },
    financial: { label: 'Financeiro', color: 'bg-green-500/20 text-green-400' },
    kpis: { label: 'KPIs', color: 'bg-blue-500/20 text-blue-400' },
    technical: { label: 'Técnico', color: 'bg-cyan-500/20 text-cyan-400' },
    legal: { label: 'Legal', color: 'bg-red-500/20 text-red-400' },
    design: { label: 'Design', color: 'bg-pink-500/20 text-pink-400' },
    presentation: { label: 'Apresentação', color: 'bg-orange-500/20 text-orange-400' },
    documentation: { label: 'Documentação', color: 'bg-slate-500/20 text-slate-400' },
    other: { label: 'Outro', color: 'bg-gray-500/20 text-gray-400' }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filesByCategory = filteredFiles.reduce((acc, file) => {
    acc[file.category] = (acc[file.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <GlowCard className="p-5">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">{files.length}</div>
            <div className="text-xs text-slate-400">Total de Arquivos</div>
          </div>
        </GlowCard>
        <GlowCard className="p-5">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#C7A763] mb-1">
              {formatFileSize(files.reduce((sum, f) => sum + (f.file_size || 0), 0))}
            </div>
            <div className="text-xs text-slate-400">Espaço Utilizado</div>
          </div>
        </GlowCard>
        <GlowCard className="p-5">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#00D4FF] mb-1">
              {files.filter(f => f.venture_id).length}
            </div>
            <div className="text-xs text-slate-400">Vinculados a Ventures</div>
          </div>
        </GlowCard>
        <GlowCard className="p-5">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">
              {Object.keys(filesByCategory).length}
            </div>
            <div className="text-xs text-slate-400">Categorias em Uso</div>
          </div>
        </GlowCard>
      </div>

      {/* Filters & Upload */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar arquivos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {Object.entries(categories).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={ventureFilter} onValueChange={setVentureFilter}>
          <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
            <Folder className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Venture" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Ventures</SelectItem>
            {ventures.map(v => (
              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={() => setShowUploadDialog(true)}
          className="bg-[#C7A763] hover:bg-[#A88B4A]"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </div>

      {/* Files Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map(file => {
          const categoryInfo = categories[file.category] || categories.other;
          return (
            <GlowCard key={file.id} className="p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <File className="w-5 h-5 text-[#C7A763]" />
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-sm line-clamp-1">{file.name}</h4>
                    <span className="text-xs text-slate-500">{formatFileSize(file.file_size)}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setSelectedFile(file);
                      setShowDetailsDialog(true);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded text-slate-400"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-white/10 rounded text-slate-400"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => deleteMutation.mutate(file.id)}
                    className="p-1.5 hover:bg-red-500/10 rounded text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className={`text-xs px-2 py-1 rounded ${categoryInfo.color}`}>
                  {categoryInfo.label}
                </span>

                {file.venture_name && (
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Folder className="w-3 h-3" />
                    {file.venture_name}
                  </div>
                )}

                {file.tags && file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {file.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-xs bg-white/5 px-1.5 py-0.5 rounded text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-xs text-slate-500 pt-2 border-t border-white/5">
                  {format(new Date(file.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </div>
              </div>
            </GlowCard>
          );
        })}
      </div>

      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <File className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400">Nenhum arquivo encontrado</p>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-[#0a1628] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Upload de Arquivo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="bg-white/5 border-white/10 text-white"
            />

            <Input
              placeholder="Nome do arquivo (opcional)"
              value={uploadData.name}
              onChange={(e) => setUploadData({...uploadData, name: e.target.value})}
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
                {Object.entries(categories).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={uploadData.venture_id}
              onValueChange={(v) => setUploadData({...uploadData, venture_id: v})}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Venture (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Nenhuma</SelectItem>
                {ventures.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Descrição"
              value={uploadData.description}
              onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
              className="bg-white/5 border-white/10 text-white"
            />

            <Input
              placeholder="Tags (separadas por vírgula)"
              value={uploadData.tags}
              onChange={(e) => setUploadData({...uploadData, tags: e.target.value})}
              className="bg-white/5 border-white/10 text-white"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={uploadData.is_public}
                onChange={(e) => setUploadData({...uploadData, is_public: e.target.checked})}
                className="rounded"
              />
              <label className="text-sm text-white">Arquivo público</label>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-[#0a1628] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedFile?.name}</DialogTitle>
          </DialogHeader>

          {selectedFile && (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-400 mb-1">Categoria</div>
                <span className={`text-sm px-2 py-1 rounded ${categories[selectedFile.category]?.color}`}>
                  {categories[selectedFile.category]?.label}
                </span>
              </div>

              {selectedFile.description && (
                <div>
                  <div className="text-xs text-slate-400 mb-1">Descrição</div>
                  <p className="text-sm text-slate-300">{selectedFile.description}</p>
                </div>
              )}

              {selectedFile.venture_name && (
                <div>
                  <div className="text-xs text-slate-400 mb-1">Venture</div>
                  <p className="text-sm text-white">{selectedFile.venture_name}</p>
                </div>
              )}

              {selectedFile.tags && selectedFile.tags.length > 0 && (
                <div>
                  <div className="text-xs text-slate-400 mb-1">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedFile.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs bg-white/5 px-2 py-1 rounded text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Tamanho</div>
                  <p className="text-sm text-white">{formatFileSize(selectedFile.file_size)}</p>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Tipo</div>
                  <p className="text-sm text-white">{selectedFile.file_type}</p>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Enviado por</div>
                  <p className="text-sm text-white">{selectedFile.uploaded_by}</p>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Data</div>
                  <p className="text-sm text-white">
                    {format(new Date(selectedFile.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <Button
                asChild
                className="w-full bg-[#C7A763] hover:bg-[#A88B4A]"
              >
                <a href={selectedFile.file_url} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}