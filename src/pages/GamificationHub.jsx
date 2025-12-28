import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Trophy, Sparkles, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionTitle from "@/components/ui/SectionTitle";
import Leaderboard from "@/components/gamification/Leaderboard";
import RecognitionWall from "@/components/gamification/RecognitionWall";
import BadgeShowcase from "@/components/gamification/BadgeShowcase";
import { createPageUrl } from "@/utils";

export default function GamificationHub() {
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
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white font-montserrat">Hub de Gamificação</h1>
            <p className="text-slate-400 text-sm">Reconhecimento, Conquistas e Rankings</p>
          </div>
        </div>

        <Tabs defaultValue="wall" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="wall">
              <Sparkles className="w-4 h-4 mr-2" />
              Mural
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Trophy className="w-4 h-4 mr-2" />
              Ranking
            </TabsTrigger>
            <TabsTrigger value="badges">
              <Award className="w-4 h-4 mr-2" />
              Minhas Conquistas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wall">
            <RecognitionWall />
          </TabsContent>

          <TabsContent value="leaderboard">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Leaderboard />
              </div>
              <div>
                <SectionTitle
                  title="Como Ganhar Pontos"
                  subtitle="dicas"
                  accent="gold"
                  align="left"
                  className="mb-4"
                />
                <div className="space-y-3">
                  {[
                    { points: 10, action: 'Completar uma meta' },
                    { points: 5, action: 'Receber reconhecimento' },
                    { points: 15, action: 'Ser mentor' },
                    { points: 20, action: 'Conquistar um badge especial' },
                    { points: 3, action: 'Dar feedback positivo' }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">{item.action}</span>
                        <span className="text-[#C7A763] font-bold">+{item.points}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="badges">
            <BadgeShowcase talentId={user?.talent_id} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}