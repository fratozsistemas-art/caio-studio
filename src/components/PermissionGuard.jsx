import React from 'react';
import { usePermissions } from "@/components/usePermissions";
import { AlertCircle } from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";

export default function PermissionGuard({ 
  children, 
  category, 
  permission, 
  fallback = null,
  showMessage = true 
}) {
  const { hasPermission, isAdmin } = usePermissions();

  if (isAdmin || hasPermission(category, permission)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showMessage) {
    return null;
  }

  return (
    <GlowCard glowColor="gold" className="p-8">
      <div className="text-center space-y-4">
        <AlertCircle className="w-12 h-12 mx-auto text-yellow-400 opacity-50" />
        <div>
          <h3 className="text-white font-semibold mb-2">Acesso Negado</h3>
          <p className="text-slate-400 text-sm">
            Você não tem permissão para acessar este recurso.
          </p>
        </div>
      </div>
    </GlowCard>
  );
}