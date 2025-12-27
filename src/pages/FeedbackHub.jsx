import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Send, Settings } from "lucide-react";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import FeedbackManagement from "@/components/feedback/FeedbackManagement";

export default function FeedbackHub() {
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
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white font-montserrat">
            Central de Feedback
          </h1>
          <p className="text-slate-400 text-lg">
            Colete e gerencie feedback de stakeholders sobre as ventures
          </p>
        </div>

        <Tabs defaultValue="management" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="management" className="data-[state=active]:bg-[#C7A763]">
              <Settings className="w-4 h-4 mr-2" />
              Gerenciar
            </TabsTrigger>
            <TabsTrigger value="send" className="data-[state=active]:bg-[#C7A763]">
              <Send className="w-4 h-4 mr-2" />
              Enviar Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="management">
            <FeedbackManagement />
          </TabsContent>

          <TabsContent value="send">
            <FeedbackForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}