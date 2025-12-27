import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";

export function usePermissions() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setIsAdmin(currentUser?.role === 'admin');
      } catch (error) {
        setUser(null);
        setIsAdmin(false);
      }
    };
    fetchUser();
  }, []);

  const { data: roleAssignments } = useQuery({
    queryKey: ['roleAssignments', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'RoleAssignment',
        operation: 'filter',
        query: { user_email: user.email }
      });
      return res.data?.data || [];
    },
    enabled: !!user?.email && !isAdmin
  });

  const { data: roles } = useQuery({
    queryKey: ['userRoles'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'UserRole',
        operation: 'list'
      });
      return res.data?.data || [];
    },
    enabled: !!user
  });

  const getInheritedPermissions = (roleId, visited = new Set()) => {
    if (visited.has(roleId)) return {}; // Prevent circular inheritance
    visited.add(roleId);

    const role = roles?.find(r => r.id === roleId);
    if (!role) return {};

    let permissions = { ...role.permissions };

    // Inherit from parent role
    if (role.parent_role_id) {
      const parentPerms = getInheritedPermissions(role.parent_role_id, visited);
      
      // Merge parent permissions (child overrides parent)
      Object.keys(parentPerms).forEach(category => {
        if (!permissions[category]) {
          permissions[category] = {};
        }
        Object.keys(parentPerms[category]).forEach(permission => {
          if (permissions[category][permission] === undefined) {
            permissions[category][permission] = parentPerms[category][permission];
          }
        });
      });
    }

    return permissions;
  };

  const getUserPermissions = () => {
    // Admin has all permissions
    if (isAdmin) {
      return {
        ventures: { view: true, create: true, edit: true, delete: true, view_financials: true, edit_financials: true },
        tasks: { view: true, create: true, edit: true, delete: true, assign: true },
        documents: { view: true, upload: true, edit: true, delete: true },
        collaboration: { view_channels: true, create_channels: true, post_messages: true, manage_squads: true },
        analytics: { view_dashboard: true, generate_ai_insights: true, export_reports: true },
        admin: { manage_users: true, manage_roles: true, system_settings: true }
      };
    }

    if (!roleAssignments || roleAssignments.length === 0) {
      return null;
    }

    // Merge permissions from all assigned roles (with inheritance)
    const mergedPermissions = {};
    
    roleAssignments.forEach(assignment => {
      const rolePerms = getInheritedPermissions(assignment.role_id);
      
      Object.keys(rolePerms).forEach(category => {
        if (!mergedPermissions[category]) {
          mergedPermissions[category] = {};
        }
        Object.keys(rolePerms[category]).forEach(permission => {
          // If any role grants permission, user has it
          if (rolePerms[category][permission]) {
            mergedPermissions[category][permission] = true;
          }
        });
      });
    });

    return mergedPermissions;
  };

  const hasPermission = (category, permission) => {
    if (isAdmin) return true;
    
    const permissions = getUserPermissions();
    if (!permissions) return false;
    
    return permissions[category]?.[permission] === true;
  };

  const canAccessVenture = (ventureId) => {
    if (isAdmin) return true;
    
    if (!roleAssignments || roleAssignments.length === 0) return false;

    // Check if user has global access or specific venture access
    return roleAssignments.some(assignment => {
      if (assignment.scope === 'global') return true;
      if (assignment.scope === 'venture_specific') {
        return assignment.venture_ids?.includes(ventureId);
      }
      return false;
    });
  };

  const canViewField = (entityType, fieldName) => {
    if (isAdmin) return true;
    
    if (!roleAssignments || roleAssignments.length === 0) return false;

    return roleAssignments.some(assignment => {
      const role = roles?.find(r => r.id === assignment.role_id);
      const fieldPerms = role?.field_permissions?.[entityType];
      
      if (!fieldPerms) return true; // No field restrictions = can view all
      
      return fieldPerms.viewable_fields?.includes(fieldName) || 
             fieldPerms.viewable_fields?.includes('*');
    });
  };

  const canEditField = (entityType, fieldName) => {
    if (isAdmin) return true;
    
    if (!roleAssignments || roleAssignments.length === 0) return false;

    return roleAssignments.some(assignment => {
      const role = roles?.find(r => r.id === assignment.role_id);
      const fieldPerms = role?.field_permissions?.[entityType];
      
      if (!fieldPerms) return true; // No field restrictions = can edit all
      
      return fieldPerms.editable_fields?.includes(fieldName) || 
             fieldPerms.editable_fields?.includes('*');
    });
  };

  return {
    user,
    isAdmin,
    permissions: getUserPermissions(),
    hasPermission,
    canAccessVenture,
    canViewField,
    canEditField,
    roleAssignments,
    roles
  };
}