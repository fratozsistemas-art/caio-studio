import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";
import MeetingForm from "@/components/crm/MeetingForm";
import MeetingList from "@/components/crm/MeetingList";

export default function MeetingCalendar({ meetings, leads, currentUser }) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Agenda de Reuniões</h3>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agendar Reunião
        </Button>
      </div>

      {showForm && (
        <MeetingForm
          leads={leads}
          currentUser={currentUser}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries(['meetings']);
          }}
        />
      )}

      <MeetingList meetings={meetings} leads={leads} />
    </div>
  );
}