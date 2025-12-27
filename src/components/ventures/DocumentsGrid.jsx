import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, ExternalLink, FileImage, FileCode, FileArchive, Calendar, User, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import GlowCard from '@/components/ui/GlowCard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getFileIcon = (fileType) => {
  if (fileType?.includes('image')) return FileImage;
  if (fileType?.includes('pdf')) return FileText;
  if (fileType?.includes('zip') || fileType?.includes('rar')) return FileArchive;
  if (fileType?.includes('code') || fileType?.includes('json')) return FileCode;
  return FileText;
};

const categoryColors = {
  financial: 'bg-green-500/20 text-green-400 border-green-500/30',
  legal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  pitch: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  technical: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  other: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};

const categoryLabels = {
  financial: 'Financeiro',
  legal: 'Jurídico',
  pitch: 'Pitch',
  technical: 'Técnico',
  other: 'Outro'
};

export default function DocumentsGrid({ documents, onDocumentClick }) {
  const [hoveredDoc, setHoveredDoc] = useState(null);

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum documento encontrado</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc, index) => {
        const FileIcon = getFileIcon(doc.file_type);
        const sizeInMB = doc.file_size ? (doc.file_size / (1024 * 1024)).toFixed(2) : '0';
        
        return (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onHoverStart={() => setHoveredDoc(doc.id)}
            onHoverEnd={() => setHoveredDoc(null)}
          >
            <GlowCard 
              className="p-5 cursor-pointer h-full"
              glowColor={hoveredDoc === doc.id ? "gold" : "cyan"}
              onClick={() => onDocumentClick && onDocumentClick(doc)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#C7A763]/20 to-[#00D4FF]/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <FileIcon className="w-6 h-6 text-[#C7A763]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold text-sm mb-1 line-clamp-2">{doc.title}</h4>
                  <Badge className={`text-xs ${categoryColors[doc.category]}`}>
                    {categoryLabels[doc.category]}
                  </Badge>
                </div>
              </div>

              {doc.description && (
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{doc.description}</p>
              )}

              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>{format(new Date(doc.created_date), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  <span className="truncate">{doc.uploaded_by}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  <span>{sizeInMB} MB • {doc.file_name}</span>
                </div>
              </div>

              {doc.tags && doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-white/10">
                  <Tag className="w-3 h-3 text-slate-500" />
                  {doc.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 rounded bg-white/5 text-slate-400">
                      {tag}
                    </span>
                  ))}
                  {doc.tags.length > 3 && (
                    <span className="text-xs text-slate-500">+{doc.tags.length - 3}</span>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <a
                  href={doc.file_url}
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F] text-xs font-semibold transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </GlowCard>
          </motion.div>
        );
      })}
    </div>
  );
}