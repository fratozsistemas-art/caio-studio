import React, { useEffect, useState } from 'react';
import { base44 } from "@/api/base44Client";
import { MessageSquare, Loader2 } from 'lucide-react';
import SectionTitle from '@/components/ui/SectionTitle';
import FeedbackSubmission from '@/components/talent/FeedbackSubmission';

export default function MyFeedback() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          base44.auth.redirectToLogin(window.location.pathname);
          return;
        }
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(window.location.pathname);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <main className="min-h-screen py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#C7A763]/20 to-[#00D4FF]/20 border border-white/10 flex items-center justify-center">
            <MessageSquare className="w-7 h-7 text-[#C7A763]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white font-montserrat">Meus Feedbacks</h1>
            <p className="text-slate-400 text-sm">Responda às solicitações de feedback pendentes</p>
          </div>
        </div>

        <FeedbackSubmission />
      </div>
    </main>
  );
}