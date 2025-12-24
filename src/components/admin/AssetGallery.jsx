import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, File, Type, Copy, Trash2, ExternalLink, Check, Filter, Video } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import GlowCard from "@/components/ui/GlowCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AssetGallery({ assets, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('URL copiada!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (asset) => {
    if (!confirm(`Tem certeza que deseja deletar "${asset.title}"?`)) return;

    try {
      await base44.entities.ContentAsset.delete(asset.id);
      toast.success('Asset deletado');
      if (onDelete) onDelete();
    } catch (error) {
      toast.error('Erro ao deletar: ' + error.message);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || asset.category === filterCategory;
    const matchesType = filterType === 'all' || asset.type === filterType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'image': return Image;
      case 'video': return Video;
      case 'file': return File;
      case 'text': return Type;
      default: return File;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <GlowCard glowColor="cyan" className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar assets..."
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white md:w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="image">Imagens</SelectItem>
              <SelectItem value="video">Vídeos</SelectItem>
              <SelectItem value="file">Arquivos</SelectItem>
              <SelectItem value="text">Textos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white md:w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="venture">Venture</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlowCard>

      {/* Gallery */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredAssets.map((asset, index) => {
            const Icon = getIcon(asset.type);
            
            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <GlowCard glowColor="mixed" className="h-full">
                  <div className="p-4">
                    {/* Preview */}
                    {asset.type === 'image' && asset.file_url ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden mb-4 bg-white/5">
                        <img 
                          src={asset.file_url} 
                          alt={asset.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : asset.type === 'video' && asset.file_url ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden mb-4 bg-black">
                        <video 
                          src={asset.file_url} 
                          controls
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video rounded-lg bg-white/5 border border-white/10 mb-4 flex items-center justify-center">
                        <Icon className="w-12 h-12 text-white/30" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold truncate">{asset.title}</h4>
                          {asset.description && (
                            <p className="text-slate-400 text-xs mt-1 line-clamp-2">{asset.description}</p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          asset.type === 'image' ? 'bg-purple-500/20 text-purple-400' :
                          asset.type === 'video' ? 'bg-red-500/20 text-red-400' :
                          asset.type === 'file' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {asset.type}
                        </span>
                      </div>

                      {/* Tags */}
                      {asset.tags && asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {asset.tags.map((tag, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/60">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        {asset.file_url && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(asset.file_url, asset.id)}
                              className="flex-1 text-[#00D4FF] hover:bg-[#00D4FF]/10"
                            >
                              {copiedId === asset.id ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            <a href={asset.file_url} target="_blank" rel="noopener noreferrer">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-white/70 hover:bg-white/10"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </a>
                          </>
                        )}
                        {asset.type === 'text' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(asset.text_content, asset.id)}
                            className="flex-1 text-[#00D4FF] hover:bg-[#00D4FF]/10"
                          >
                            {copiedId === asset.id ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(asset)}
                          className="text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Text Content Preview */}
                      {asset.type === 'text' && asset.text_content && (
                        <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/10">
                          <p className="text-xs text-white/60 line-clamp-3">{asset.text_content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredAssets.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <File className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nenhum asset encontrado</p>
        </div>
      )}
    </div>
  );
}