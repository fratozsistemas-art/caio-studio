import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, AlertCircle, CheckCircle2, Clock, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";
import moment from 'moment';

export default function NotificationsAlerts({ ventureId }) {
  const [filter, setFilter] = useState('active');
  const queryClient = useQueryClient();

  const { data: alerts } = useQuery({
    queryKey: ['ventureAlerts', ventureId, filter],
    queryFn: async () => {
      const query = { venture_id: ventureId };
      if (filter !== 'all') {
        query.status = filter;
      }
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureAlert',
        operation: 'filter',
        query,
        sort: '-created_date'
      });
      return res.data?.data || [];
    },
    enabled: !!ventureId
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      const user = await base44.auth.me();
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureAlert',
        operation: 'update',
        query: { id: alertId },
        data: {
          status: 'acknowledged',
          acknowledged_by: user.email,
          acknowledged_at: new Date().toISOString()
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ventureAlerts']);
      toast.success('Alerta reconhecido');
    }
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureAlert',
        operation: 'update',
        query: { id: alertId },
        data: { status: 'resolved' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ventureAlerts']);
      toast.success('Alerta resolvido');
    }
  });

  const severityConfig = {
    critical: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', icon: AlertTriangle },
    high: { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', icon: AlertCircle },
    medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', icon: Clock },
    low: { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', icon: Bell }
  };

  const activeAlerts = alerts?.filter(a => a.status === 'active').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-[#00D4FF]" />
          <h3 className="text-xl font-bold text-white">Notificações & Alertas</h3>
          {activeAlerts > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              {activeAlerts} ativos
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'acknowledged', 'resolved'].map((status) => (
            <Button
              key={status}
              size="sm"
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              className={filter === status ? 'bg-[#00D4FF] text-[#06101F]' : 'border-white/10 text-white'}
            >
              {status === 'all' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {alerts && alerts.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence>
            {alerts.map((alert, i) => {
              const config = severityConfig[alert.severity] || severityConfig.medium;
              const Icon = config.icon;
              
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GlowCard glowColor="mixed" className={`p-4 ${config.bg} border ${config.border}`}>
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${config.bg} border ${config.border}`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-white font-semibold">{alert.title}</h4>
                            <p className="text-sm text-slate-400 mt-1">{alert.message}</p>
                          </div>
                          <Badge variant="outline" className={`${config.color} border-current`}>
                            {alert.severity}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="text-xs text-slate-500">
                            {moment(alert.created_date).fromNow()}
                            {alert.acknowledged_by && (
                              <span className="ml-2">
                                • Reconhecido por {alert.acknowledged_by}
                              </span>
                            )}
                          </div>
                          
                          {alert.status === 'active' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                                className="border-white/10 text-white text-xs"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Reconhecer
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => resolveAlertMutation.mutate(alert.id)}
                                className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30 text-xs"
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Resolver
                              </Button>
                            </div>
                          )}
                          
                          {alert.status === 'acknowledged' && (
                            <Button
                              size="sm"
                              onClick={() => resolveAlertMutation.mutate(alert.id)}
                              className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30 text-xs"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Resolver
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <GlowCard glowColor="cyan" className="p-12">
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400 opacity-50" />
            <p className="text-slate-400">
              {filter === 'active' ? 'Nenhum alerta ativo' : 'Nenhum alerta encontrado'}
            </p>
          </div>
        </GlowCard>
      )}
    </div>
  );
}