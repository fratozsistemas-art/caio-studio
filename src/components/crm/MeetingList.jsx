import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Video, User, Clock } from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  scheduled: { label: 'Agendado', color: 'bg-blue-500/20 text-blue-400' },
  confirmed: { label: 'Confirmado', color: 'bg-green-500/20 text-green-400' },
  completed: { label: 'Realizado', color: 'bg-purple-500/20 text-purple-400' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400' }
};

export default function MeetingList({ meetings, leads }) {
  const upcomingMeetings = meetings.filter(m => new Date(m.scheduled_date) > new Date());
  const pastMeetings = meetings.filter(m => new Date(m.scheduled_date) <= new Date());

  const getLeadInfo = (leadId) => leads.find(l => l.id === leadId);

  if (meetings.length === 0) {
    return (
      <GlowCard glowColor="mixed" className="p-12">
        <div className="text-center">
          <Calendar className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-white font-semibold mb-2">Nenhuma reunião agendada</h3>
          <p className="text-slate-400">Agende a primeira reunião com seus leads</p>
        </div>
      </GlowCard>
    );
  }

  return (
    <div className="space-y-6">
      {upcomingMeetings.length > 0 && (
        <div>
          <h4 className="text-white font-medium mb-3">Próximas Reuniões</h4>
          <div className="space-y-3">
            {upcomingMeetings.map((meeting, i) => {
              const lead = getLeadInfo(meeting.lead_id);
              const status = STATUS_CONFIG[meeting.status];

              return (
                <motion.div
                  key={meeting.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GlowCard glowColor="cyan" className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">{meeting.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(meeting.scheduled_date).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(meeting.scheduled_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <span>•</span>
                          <span>{meeting.duration_minutes} min</span>
                        </div>
                      </div>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>

                    {lead && (
                      <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                        <User className="w-4 h-4" />
                        {lead.full_name}
                      </div>
                    )}

                    {meeting.location && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        {meeting.is_virtual ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                        {meeting.location}
                      </div>
                    )}

                    {meeting.description && (
                      <p className="text-sm text-slate-400 mt-2">{meeting.description}</p>
                    )}
                  </GlowCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {pastMeetings.length > 0 && (
        <div>
          <h4 className="text-white font-medium mb-3">Reuniões Passadas</h4>
          <div className="space-y-3 opacity-70">
            {pastMeetings.slice(0, 5).map((meeting, i) => {
              const lead = getLeadInfo(meeting.lead_id);
              const status = STATUS_CONFIG[meeting.status];

              return (
                <GlowCard key={meeting.id} glowColor="mixed" className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white text-sm font-medium">{meeting.title}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(meeting.scheduled_date).toLocaleDateString('pt-BR')} - {lead?.full_name}
                      </div>
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                </GlowCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}