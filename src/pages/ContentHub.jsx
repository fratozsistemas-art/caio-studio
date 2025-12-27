import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, BarChart3, Upload, Edit3 } from 'lucide-react';
import DocumentManager from '@/components/content/DocumentManager';
import ContentEditor from '@/components/content/ContentEditor';
import ContentAnalytics from '@/components/content/ContentAnalytics';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function ContentHub() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setIsAdmin(currentUser?.role === 'admin');
        
        if (currentUser?.role !== 'admin') {
          navigate(createPageUrl('Home'));
        }
      } catch {
        navigate(createPageUrl('Home'));
      }
    };
    checkAuth();
  }, [navigate]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#06101F] p-6 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06101F] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-montserrat">Content Hub</h1>
            <p className="text-slate-400 mt-1">
              Gerenciamento completo de conteúdo e documentos
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="documents">
              <Upload className="w-4 h-4 mr-2" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="editor">
              <Edit3 className="w-4 h-4 mr-2" />
              Editor de Conteúdo
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <DocumentManager />
          </TabsContent>

          <TabsContent value="editor">
            <ContentEditor />
          </TabsContent>

          <TabsContent value="analytics">
            <ContentAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}