import React, { useState } from 'react';
import { Youtube, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';

export default function YouTubeSyncManager() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await base44.functions.invoke('syncYouTubeVideos', {});
      
      if (response.data.success) {
        setLastSync(new Date());
        toast.success(`${response.data.synced} vídeos sincronizados com sucesso!`);
      } else {
        toast.error('Erro ao sincronizar vídeos');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <GlowCard glowColor="cyan" className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-600/10 flex items-center justify-center">
            <Youtube className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Sincronização YouTube</h3>
            <p className="text-slate-400 text-sm">Canal @artificiallysmarter</p>
          </div>
        </div>
        
        {lastSync && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Sincronizado</span>
          </div>
        )}
      </div>

      <p className="text-slate-300 text-sm mb-4">
        Sincronize automaticamente os últimos vídeos do canal YouTube para exibir no site.
      </p>

      {lastSync && (
        <p className="text-slate-500 text-xs mb-4">
          Última sincronização: {lastSync.toLocaleString('pt-BR')}
        </p>
      )}

      <Button
        onClick={handleSync}
        disabled={syncing}
        className="w-full bg-red-600 hover:bg-red-700 text-white"
      >
        {syncing ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Sincronizando...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Sincronizar Vídeos
          </>
        )}
      </Button>
    </GlowCard>
  );
}