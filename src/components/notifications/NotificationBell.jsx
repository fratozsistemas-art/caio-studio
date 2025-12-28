import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Check, X, Trophy, Star, Target, MessageSquare, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";

const NOTIFICATION_ICONS = {
  badge_earned: Trophy,
  recognition_received: Star,
  recognition_sent: Star,
  goal_assigned: Target,
  feedback_received: MessageSquare,
  venture_update: Briefcase,
  task_assigned: Target,
  milestone_reached: Trophy
};

const NOTIFICATION_COLORS = {
  badge_earned: 'from-yellow-500 to-orange-500',
  recognition_received: 'from-purple-500 to-pink-500',
  recognition_sent: 'from-blue-500 to-cyan-500',
  goal_assigned: 'from-green-500 to-emerald-500',
  feedback_received: 'from-indigo-500 to-blue-500',
  venture_update: 'from-[#C7A763] to-[#A88B4A]',
  task_assigned: 'from-cyan-500 to-blue-500',
  milestone_reached: 'from-yellow-500 to-yellow-600'
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Notification',
        operation: 'list',
        sort: '-created_date'
      });
      return res.data?.data?.slice(0, 20) || [];
    },
    refetchInterval: 30000 // Refetch every 30s
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Notification',
        operation: 'update',
        id,
        data: { read: true }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Notification',
        operation: 'delete',
        id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      return Promise.all(
        unreadIds.map(id =>
          base44.functions.invoke('secureEntityQuery', {
            entity_name: 'Notification',
            operation: 'update',
            id,
            data: { read: true }
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification) => {
    markAsReadMutation.mutate(notification.id);
    if (notification.action_url) {
      navigate(notification.action_url);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 bg-[#0a1628] border-white/10 p-0" align="end">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-white font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              className="text-xs text-[#C7A763] hover:text-[#A88B4A]"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                const colorClass = NOTIFICATION_COLORS[notification.type] || 'from-slate-500 to-slate-600';

                return (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group relative ${
                      !notification.read ? 'bg-white/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-sm">{notification.title}</h4>
                            <p className="text-slate-400 text-xs mt-1 line-clamp-2">{notification.message}</p>
                            <span className="text-slate-500 text-xs mt-1 inline-block">
                              {format(new Date(notification.created_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotificationMutation.mutate(notification.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {!notification.read && (
                          <div className="absolute top-4 right-4 w-2 h-2 bg-[#C7A763] rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}