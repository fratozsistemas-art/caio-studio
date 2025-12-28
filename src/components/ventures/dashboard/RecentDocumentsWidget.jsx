import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download, Eye } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CommentBox from './CommentBox';
import { format } from 'date-fns';

const categoryColors = {
  financial: 'text-green-400 bg-green-400/10',
  legal: 'text-blue-400 bg-blue-400/10',
  pitch: 'text-purple-400 bg-purple-400/10',
  technical: 'text-cyan-400 bg-cyan-400/10',
  other: 'text-slate-400 bg-slate-400/10'
};

export default function RecentDocumentsWidget({ ventureId }) {
  const [selectedDoc, setSelectedDoc] = useState(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['recent-documents', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureDocument',
        operation: 'filter',
        query: { venture_id: ventureId },
        sort: '-created_date'
      });
      return res.data?.data?.slice(0, 5) || [];
    },
    enabled: !!ventureId
  });

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <GlowCard className="p-6">
        <div className="text-slate-400">Carregando documentos...</div>
      </GlowCard>
    );
  }

  return (
    <>
      <GlowCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[#00D4FF]" />
          <h3 className="text-lg font-semibold text-white">Documentos Recentes</h3>
        </div>

        <div className="space-y-2">
          {documents?.length > 0 ? (
            documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-[#00D4FF]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {doc.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[doc.category]}`}>
                        {doc.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatFileSize(doc.file_size)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {format(new Date(doc.created_date), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Nenhum documento</p>
            </div>
          )}
        </div>
      </GlowCard>

      {/* Document Detail Modal with Comments */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="bg-[#0a1628] border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedDoc?.title}</DialogTitle>
          </DialogHeader>

          {selectedDoc && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[selectedDoc.category]}`}>
                  {selectedDoc.category}
                </span>
                <span className="text-xs text-slate-400">
                  {formatFileSize(selectedDoc.file_size)}
                </span>
                <span className="text-xs text-slate-400">
                  Enviado em {format(new Date(selectedDoc.created_date), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>

              {selectedDoc.description && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Descrição</p>
                  <p className="text-sm text-slate-300">{selectedDoc.description}</p>
                </div>
              )}

              <div className="flex gap-2">
                <a
                  href={selectedDoc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-[#00D4FF] hover:bg-[#00B8E6] text-[#06101F] rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>

              <div className="border-t border-white/10 pt-4">
                <CommentBox
                  entityType="VentureDocument"
                  entityId={selectedDoc.id}
                  entityName={selectedDoc.title}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}