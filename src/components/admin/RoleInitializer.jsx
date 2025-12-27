import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQueryClient } from '@tanstack/react-query';
import { Zap, Loader2, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

const DEFAULT_ROLES = [
  {
    role_name: 'Viewer',
    description: 'Acesso apenas para visualização',
    is_system_role: true,
    priority: 1,
    permissions: {
      ventures: { view: true, create: false, edit: false, delete: false, view_financials: false, edit_financials: false },
      tasks: { view: true, create: false, edit: false, delete: false, assign: false },
      documents: { view: true, upload: false, edit: false, delete: false },
      collaboration: { view_channels: true, create_channels: false, post_messages: true, manage_squads: false },
      analytics: { view_dashboard: true, generate_ai_insights: false, export_reports: false },
      admin: { manage_users: false, manage_roles: false, system_settings: false }
    },
    field_permissions: {
      Venture: {
        viewable_fields: ['name', 'description', 'layer', 'status', 'category'],
        editable_fields: []
      }
    }
  },
  {
    role_name: 'Editor',
    description: 'Pode editar ventures e conteúdos',
    is_system_role: true,
    priority: 3,
    permissions: {
      ventures: { view: true, create: true, edit: true, delete: false, view_financials: false, edit_financials: false },
      tasks: { view: true, create: true, edit: true, delete: false, assign: true },
      documents: { view: true, upload: true, edit: true, delete: false },
      collaboration: { view_channels: true, create_channels: true, post_messages: true, manage_squads: false },
      analytics: { view_dashboard: true, generate_ai_insights: true, export_reports: true },
      admin: { manage_users: false, manage_roles: false, system_settings: false }
    },
    field_permissions: {
      Venture: {
        viewable_fields: ['name', 'description', 'layer', 'status', 'category', 'tags', 'website'],
        editable_fields: ['name', 'description', 'status', 'category', 'tags', 'website']
      }
    }
  },
  {
    role_name: 'Financial Viewer',
    description: 'Pode visualizar dados financeiros',
    is_system_role: true,
    priority: 2,
    permissions: {
      ventures: { view: true, create: false, edit: false, delete: false, view_financials: true, edit_financials: false },
      tasks: { view: true, create: false, edit: false, delete: false, assign: false },
      documents: { view: true, upload: false, edit: false, delete: false },
      collaboration: { view_channels: true, create_channels: false, post_messages: true, manage_squads: false },
      analytics: { view_dashboard: true, generate_ai_insights: false, export_reports: true },
      admin: { manage_users: false, manage_roles: false, system_settings: false }
    },
    field_permissions: {
      Venture: {
        viewable_fields: ['name', 'description', 'layer', 'status'],
        editable_fields: []
      },
      FinancialRecord: {
        viewable_fields: ['record_type', 'amount', 'record_date', 'category'],
        editable_fields: []
      }
    }
  },
  {
    role_name: 'Financial Manager',
    description: 'Pode gerenciar dados financeiros',
    is_system_role: true,
    priority: 4,
    permissions: {
      ventures: { view: true, create: false, edit: true, delete: false, view_financials: true, edit_financials: true },
      tasks: { view: true, create: true, edit: true, delete: false, assign: true },
      documents: { view: true, upload: true, edit: true, delete: false },
      collaboration: { view_channels: true, create_channels: true, post_messages: true, manage_squads: false },
      analytics: { view_dashboard: true, generate_ai_insights: true, export_reports: true },
      admin: { manage_users: false, manage_roles: false, system_settings: false }
    },
    field_permissions: {
      Venture: {
        viewable_fields: ['name', 'description', 'layer', 'status', 'category'],
        editable_fields: ['name', 'description', 'status']
      },
      FinancialRecord: {
        viewable_fields: ['record_type', 'amount', 'record_date', 'category', 'notes'],
        editable_fields: ['record_type', 'amount', 'record_date', 'category', 'notes']
      },
      VentureKPI: {
        viewable_fields: ['kpi_name', 'current_value', 'target_value', 'unit'],
        editable_fields: ['current_value', 'target_value']
      }
    }
  },
  {
    role_name: 'Admin',
    description: 'Acesso completo ao sistema',
    is_system_role: true,
    priority: 10,
    permissions: {
      ventures: { view: true, create: true, edit: true, delete: true, view_financials: true, edit_financials: true },
      tasks: { view: true, create: true, edit: true, delete: true, assign: true },
      documents: { view: true, upload: true, edit: true, delete: true },
      collaboration: { view_channels: true, create_channels: true, post_messages: true, manage_squads: true },
      analytics: { view_dashboard: true, generate_ai_insights: true, export_reports: true },
      admin: { manage_users: true, manage_roles: true, system_settings: true }
    },
    field_permissions: {
      Venture: {
        viewable_fields: ['*'],
        editable_fields: ['*']
      },
      FinancialRecord: {
        viewable_fields: ['*'],
        editable_fields: ['*']
      },
      VentureKPI: {
        viewable_fields: ['*'],
        editable_fields: ['*']
      }
    }
  }
];

export default function RoleInitializer() {
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const queryClient = useQueryClient();

  const initializeRoles = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      
      for (const roleData of DEFAULT_ROLES) {
        await base44.functions.invoke('secureEntityQuery', {
          entity_name: 'UserRole',
          operation: 'create',
          data: roleData
        });

        // Create audit log
        await base44.functions.invoke('secureEntityQuery', {
          entity_name: 'PermissionAudit',
          operation: 'create',
          data: {
            action_type: 'role_created',
            entity_type: 'UserRole',
            performed_by: user.email,
            changes: { after: roleData },
            reason: 'Inicialização automática do sistema'
          }
        });
      }

      queryClient.invalidateQueries(['userRoles']);
      setInitialized(true);
      toast.success(`${DEFAULT_ROLES.length} roles padrão criados com sucesso!`);
    } catch (error) {
      toast.error('Erro ao inicializar roles: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialized) {
    return (
      <GlowCard glowColor="cyan" className="p-6">
        <div className="flex items-center gap-3 text-green-400">
          <CheckCircle className="w-6 h-6" />
          <div>
            <h4 className="font-semibold">Roles Inicializados!</h4>
            <p className="text-sm text-slate-400">
              {DEFAULT_ROLES.length} roles padrão foram criados com sucesso
            </p>
          </div>
        </div>
      </GlowCard>
    );
  }

  return (
    <GlowCard glowColor="gold" className="p-6">
      <div className="space-y-4">
        <div>
          <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#C7A763]" />
            Inicialização Rápida de Roles
          </h4>
          <p className="text-sm text-slate-400">
            Crie automaticamente {DEFAULT_ROLES.length} roles padrão para começar:
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {DEFAULT_ROLES.map((role, i) => (
            <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-medium text-sm">{role.role_name}</span>
                <span className="text-xs bg-[#C7A763]/20 text-[#C7A763] px-2 py-1 rounded">
                  P{role.priority}
                </span>
              </div>
              <p className="text-xs text-slate-400">{role.description}</p>
            </div>
          ))}
        </div>

        <Button
          onClick={initializeRoles}
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F] font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando roles...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Criar Roles Padrão
            </>
          )}
        </Button>
      </div>
    </GlowCard>
  );
}