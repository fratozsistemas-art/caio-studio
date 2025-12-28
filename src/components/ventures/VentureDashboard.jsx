import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import KPIWidget from './dashboard/KPIWidget';
import UrgentTasksWidget from './dashboard/UrgentTasksWidget';
import RecentDocumentsWidget from './dashboard/RecentDocumentsWidget';
import ActivityFeedWidget from './dashboard/ActivityFeedWidget';

export default function VentureDashboard({ ventureId, ventureName }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C7A763] to-[#00D4FF] flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-sm text-slate-400">Visão consolidada de {ventureName}</p>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Row: KPIs and Urgent Tasks */}
        <KPIWidget ventureId={ventureId} />
        <UrgentTasksWidget ventureId={ventureId} />

        {/* Bottom Row: Recent Documents and Activity Feed */}
        <RecentDocumentsWidget ventureId={ventureId} />
        <ActivityFeedWidget ventureId={ventureId} />
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-[#C7A763]/10 to-[#00D4FF]/10 border border-white/10 rounded-lg p-4">
        <p className="text-sm text-slate-300">
          💡 <strong>Dica:</strong> Clique em qualquer item nos widgets para ver detalhes e adicionar comentários, 
          promovendo colaboração contextualizada com sua equipe.
        </p>
      </div>
    </div>
  );
}