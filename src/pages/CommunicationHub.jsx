import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Send, History, FileText } from "lucide-react";
import TemplateManager from "@/components/communication/TemplateManager";
import SendCommunication from "@/components/communication/SendCommunication";
import CommunicationHistory from "@/components/communication/CommunicationHistory";

export default function CommunicationHub() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.role !== 'admin') {
          window.location.href = '/';
          return;
        }
        setUser(currentUser);
      } catch (error) {
        window.location.href = '/';
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06101F] flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06101F] p-6 pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white font-montserrat">
            Central de Comunicação
          </h1>
          <p className="text-slate-400 text-lg">
            Gerencie emails, templates e histórico de comunicações
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="send" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="send" className="data-[state=active]:bg-[#C7A763]">
              <Send className="w-4 h-4 mr-2" />
              Enviar
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-[#C7A763]">
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-[#C7A763]">
              <History className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send">
            <SendCommunication />
          </TabsContent>

          <TabsContent value="templates">
            <TemplateManager />
          </TabsContent>

          <TabsContent value="history">
            <CommunicationHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}