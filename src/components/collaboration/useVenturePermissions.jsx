import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useVenturePermissions(ventureId, permissionType) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setIsAdmin(currentUser?.role === 'admin');
      } catch {
        setUser(null);
        setIsAdmin(false);
      }
    };
    checkUser();
  }, []);

  const { data: permissions } = useQuery({
    queryKey: ['venture-permissions', ventureId, user?.email, permissionType],
    queryFn: async () => {
      if (!user?.email) return null;
      
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VenturePermission',
        operation: 'filter',
        query: {
          venture_id: ventureId,
          user_email: user.email,
          permission_type: permissionType
        }
      });
      return res.data?.data || [];
    },
    enabled: !!user?.email && !!ventureId
  });

  // Admins have full access
  if (isAdmin) {
    return {
      canView: true,
      canEdit: true,
      canAdmin: true,
      isLoading: false
    };
  }

  // Check specific permissions
  const allPermissions = permissions?.filter(p => 
    p.permission_type === permissionType || p.permission_type === 'all'
  ) || [];

  const hasPermission = (level) => {
    return allPermissions.some(p => {
      // Check if permission is expired
      if (p.expires_at && new Date(p.expires_at) < new Date()) {
        return false;
      }

      if (level === 'view') return true;
      if (level === 'edit') return ['edit', 'admin'].includes(p.access_level);
      if (level === 'admin') return p.access_level === 'admin';
      return false;
    });
  };

  return {
    canView: allPermissions.length > 0 || isAdmin,
    canEdit: hasPermission('edit'),
    canAdmin: hasPermission('admin'),
    isLoading: !user
  };
}