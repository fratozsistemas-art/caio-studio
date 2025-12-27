import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Shield, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionTitle from "@/components/ui/SectionTitle";
import RoleManager from "@/components/admin/RoleManager";
import UserRoleAssignment from "@/components/admin/UserRoleAssignment";
import { createPageUrl } from "@/utils";

export default function PermissionsManagement() {
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
        if (!currentUser || currentUser.role !== 'admin') {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(window.location.pathname);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const { data: venturesResponse } = useQuery({
    queryKey: ['ventures'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Venture',
        operation: 'list'
      });
      return res.data;
    },
    enabled: !!user
  });

  const ventures = venturesResponse?.data || [];

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
        <SectionTitle
          subtitle="SEGURANÇA"
          title="Gestão de Permissões"
          accent="gold"
          align="left"
          className="mb-8"
        />

        <Tabs defaultValue="roles" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="roles">
              <Shield className="w-4 h-4 mr-2" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="assignments">
              <Users className="w-4 h-4 mr-2" />
              Atribuições
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roles">
            <RoleManager />
          </TabsContent>

          <TabsContent value="assignments">
            <UserRoleAssignment ventures={ventures} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}