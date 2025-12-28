import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Target, AlertCircle } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CommentBox from './CommentBox';

export default function KPIWidget({ ventureId }) {
  const [selectedKPI, setSelectedKPI] = useState(null);

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['kpis', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureKPI',
        operation: 'filter',
        query: { venture_id: ventureId },
        sort: '-measurement_date'
      });
      return res.data?.data?.slice(0, 6) || [];
    },
    enabled: !!ventureId
  });

  const calculateProgress = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  if (isLoading) {
    return (
      <GlowCard className="p-6">
        <div className="text-slate-400">Carregando KPIs...</div>
      </GlowCard>
    );
  }

  return (
    <>
      <GlowCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#C7A763]" />
          <h3 className="text-lg font-semibold text-white">KPIs Chave</h3>
        </div>

        <div className="space-y-3">
          {kpis?.length > 0 ? (
            kpis.map((kpi) => {
              const progress = calculateProgress(kpi.current_value, kpi.target_value);
              const isLow = progress < 50;
              
              return (
                <button
                  key={kpi.id}
                  onClick={() => setSelectedKPI(kpi)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors text-left"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{kpi.kpi_name}</p>
                      <p className="text-xs text-slate-400">{kpi.kpi_type}</p>
                    </div>
                    {isLow && <AlertCircle className="w-4 h-4 text-orange-400" />}
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-bold text-[#C7A763]">
                      {kpi.current_value} {kpi.unit}
                    </span>
                    {kpi.target_value && (
                      <span className="text-xs text-slate-400">
                        Meta: {kpi.target_value} {kpi.unit}
                      </span>
                    )}
                  </div>

                  {kpi.target_value && (
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isLow ? 'bg-orange-400' : 'bg-green-400'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Target className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Nenhum KPI registrado</p>
            </div>
          )}
        </div>
      </GlowCard>

      {/* KPI Detail Modal with Comments */}
      <Dialog open={!!selectedKPI} onOpenChange={() => setSelectedKPI(null)}>
        <DialogContent className="bg-[#0a1628] border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedKPI?.kpi_name}</DialogTitle>
          </DialogHeader>

          {selectedKPI && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Valor Atual</p>
                  <p className="text-2xl font-bold text-[#C7A763]">
                    {selectedKPI.current_value} {selectedKPI.unit}
                  </p>
                </div>
                {selectedKPI.target_value && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Meta</p>
                    <p className="text-2xl font-bold text-white">
                      {selectedKPI.target_value} {selectedKPI.unit}
                    </p>
                  </div>
                )}
              </div>

              {selectedKPI.notes && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Notas</p>
                  <p className="text-sm text-slate-300">{selectedKPI.notes}</p>
                </div>
              )}

              <div className="border-t border-white/10 pt-4">
                <CommentBox
                  entityType="VentureKPI"
                  entityId={selectedKPI.id}
                  entityName={selectedKPI.kpi_name}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}