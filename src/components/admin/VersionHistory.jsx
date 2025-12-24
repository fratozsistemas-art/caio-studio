import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RotateCcw, Eye, X, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import GlowCard from "@/components/ui/GlowCard";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";

export default function VersionHistory({ asset, onClose, onRevert }) {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [reverting, setReverting] = useState(false);

  const { data: versionsData, isLoading } = useQuery({
    queryKey: ['assetVersions', asset.id],
    queryFn: async () => {
      const response = await base44.functions.invoke('manageAssetVersion', {
        action: 'list_versions',
        asset_id: asset.id
      });
      return response.data;
    }
  });

  const versions = versionsData?.data || [];

  const handleRevert = async (version) => {
    if (!confirm(`Reverter para versão ${version.version_number}? Isso criará uma nova versão com esse conteúdo.`)) {
      return;
    }

    setReverting(true);
    try {
      await base44.functions.invoke('manageAssetVersion', {
        action: 'revert_to_version',
        asset_id: asset.id,
        version_number: version.version_number
      });

      toast.success(`Revertido para versão ${version.version_number}`);
      if (onRevert) onRevert();
      onClose();
    } catch (error) {
      toast.error('Erro ao reverter: ' + error.message);
    } finally {
      setReverting(false);
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
        className="w-full max-w-4xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <GlowCard glowColor="cyan" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Histórico de Versões</h3>
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

          {isLoading ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p>Carregando versões...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Nenhuma versão anterior encontrada</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {versions.map((version, index) => (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-xl border transition-colors ${
                    version.version_number === asset.current_version
                      ? 'bg-[#00D4FF]/10 border-[#00D4FF]/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-sm font-bold ${
                          version.version_number === asset.current_version
                            ? 'text-[#00D4FF]'
                            : 'text-white/70'
                        }`}>
                          Versão {version.version_number}
                        </span>
                        {version.version_number === asset.current_version && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#00D4FF]/20 text-[#00D4FF]">
                            Atual
                          </span>
                        )}
                        <span className="text-xs text-slate-400">
                          {moment(version.created_date).format('DD/MM/YYYY HH:mm')}
                        </span>
                      </div>
                      
                      {version.change_notes && (
                        <p className="text-sm text-slate-300 mb-2">{version.change_notes}</p>
                      )}
                      
                      {version.text_content && (
                        <div className="mt-2 p-3 rounded-lg bg-black/30 border border-white/10">
                          <p className="text-xs text-white/60 line-clamp-2">{version.text_content}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {version.file_url && (
                        <a href={version.file_url} target="_blank" rel="noopener noreferrer">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white/70 hover:bg-white/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                      
                      {version.version_number !== asset.current_version && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRevert(version)}
                          disabled={reverting}
                          className="text-[#C7A763] hover:bg-[#C7A763]/10"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlowCard>
      </motion.div>
    </motion.div>
  );
}