import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Database, RefreshCw, AlertCircle } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import SectionTitle from "@/components/ui/SectionTitle";
import FileUploader from "@/components/admin/FileUploader";
import AssetGallery from "@/components/admin/AssetGallery";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication and admin role
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.role !== 'admin') {
          window.location.href = '/';
        }
      } catch (error) {
        window.location.href = '/';
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch assets
  const { data: assets = [], isLoading, refetch } = useQuery({
    queryKey: ['contentAssets'],
    queryFn: () => base44.entities.ContentAsset.list('-created_date'),
    enabled: !!user && user.role === 'admin'
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#C7A763] animate-spin mx-auto mb-4" />
          <p className="text-white/60">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <main className="min-h-screen py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C7A763]/20 to-[#C7A763]/5 border border-[#C7A763]/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#C7A763]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white font-montserrat">Admin Panel</h1>
              <p className="text-slate-400 text-sm">Gestão de Conteúdo & Assets</p>
            </div>
          </div>

          {/* Admin Info */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#00D4FF]/5 border border-[#00D4FF]/20">
            <AlertCircle className="w-5 h-5 text-[#00D4FF]" />
            <div className="flex-1">
              <p className="text-white text-sm">
                Bem-vindo, <span className="font-semibold text-[#C7A763]">{user.full_name}</span>
              </p>
              <p className="text-slate-400 text-xs">
                Esta página é visível apenas para administradores
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {[
            { label: 'Total de Assets', value: assets.length, icon: Database },
            { label: 'Imagens', value: assets.filter(a => a.type === 'image').length, icon: Database },
            { label: 'Textos', value: assets.filter(a => a.type === 'text').length, icon: Database }
          ].map((stat, index) => (
            <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-white font-montserrat mt-1">{stat.value}</p>
                </div>
                <stat.icon className="w-8 h-8 text-[#C7A763]/30" />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <FileUploader onUploadComplete={refetch} />
        </motion.div>

        {/* Gallery Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <SectionTitle
              title="Assets Salvos"
              accent="cyan"
              align="left"
            />
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          <AssetGallery assets={assets} onDelete={refetch} />
        </motion.div>

        {/* Instructions */}
        <motion.div
          className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-white/5 to-transparent border border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-white mb-3">Como usar os assets</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>• <span className="text-[#C7A763]">Imagens</span>: Clique em copiar para obter a URL e usar em {'<img src="..." />'}</li>
            <li>• <span className="text-[#C7A763]">Arquivos</span>: Use a URL copiada para links ou downloads</li>
            <li>• <span className="text-[#C7A763]">Textos</span>: Copie o conteúdo para usar em qualquer lugar do site</li>
            <li>• <span className="text-[#C7A763]">Tags</span>: Use tags para organizar e encontrar assets rapidamente</li>
          </ul>
        </motion.div>
      </div>
    </main>
  );
}