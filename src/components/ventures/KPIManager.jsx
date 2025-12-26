import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GlowCard from "@/components/ui/GlowCard";
import KPIForm from "./KPIForm";
import KPIChart from "./KPIChart";
import AIKPISuggestions from "./AIKPISuggestions";

export default function KPIManager({ ventures }) {
  const [selectedVenture, setSelectedVenture] = useState(ventures[0]?.id || null);
  const [showKPIForm, setShowKPIForm] = useState(false);

  const { data: kpisResponse, refetch } = useQuery({
    queryKey: ['kpis', selectedVenture],
    queryFn: async () => {
      if (!selectedVenture) return { data: [] };
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureKPI',
        operation: 'filter',
        query: { venture_id: selectedVenture },
        sort: '-measurement_date'
      });
      return response.data;
    },
    enabled: !!selectedVenture
  });

  const kpis = kpisResponse?.data || [];
  const venture = ventures.find(v => v.id === selectedVenture);

  // Group KPIs by name to calculate progress
  const kpiGroups = kpis.reduce((acc, kpi) => {
    if (!acc[kpi.kpi_name]) {
      acc[kpi.kpi_name] = [];
    }
    acc[kpi.kpi_name].push(kpi);
    return acc;
  }, {});

  return (
    <Tabs defaultValue="manage" className="space-y-6">
      <TabsList className="bg-white/5 border border-white/10">
        <TabsTrigger value="manage">Gerenciar KPIs</TabsTrigger>
        <TabsTrigger value="suggestions">Sugestões IA</TabsTrigger>
      </TabsList>

      <TabsContent value="manage" className="space-y-6">
        <div className="flex items-center justify-between">
          <Select value={selectedVenture} onValueChange={setSelectedVenture}>
            <SelectTrigger className="w-64 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecione uma venture" />
            </SelectTrigger>
            <SelectContent>
              {ventures.map(venture => (
                <SelectItem key={venture.id} value={venture.id}>
                  {venture.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => setShowKPIForm(true)}
            disabled={!selectedVenture}
            className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar KPI
          </Button>
        </div>

      {selectedVenture && (
        <>
          {/* KPI Summary Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(kpiGroups).map(([kpiName, kpiList]) => {
              const latest = kpiList[0];
              const progress = latest.target_value
                ? (latest.current_value / latest.target_value) * 100
                : 0;
              const isPositive = progress >= 100;

              return (
                <motion.div
                  key={kpiName}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <GlowCard glowColor={isPositive ? "gold" : "cyan"} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-sm text-slate-400 mb-1">{kpiName}</h4>
                        <div className="text-2xl font-bold text-white">
                          {latest.current_value}
                          {latest.unit && <span className="text-lg ml-1 text-slate-400">{latest.unit}</span>}
                        </div>
                      </div>
                      {isPositive ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-orange-400" />
                      )}
                    </div>

                    {latest.target_value && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Meta: {latest.target_value}{latest.unit}</span>
                          <span>{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(progress, 100)}%` }}
                            className={`h-full rounded-full ${
                              isPositive ? 'bg-green-500' : 'bg-orange-500'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </GlowCard>
                </motion.div>
              );
            })}
          </div>

          {/* KPI Charts */}
          {Object.entries(kpiGroups).map(([kpiName, kpiList]) => (
            <KPIChart key={kpiName} kpiName={kpiName} kpiData={kpiList} />
          ))}

          {kpis.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum KPI registrado para esta venture</p>
            </div>
          )}
        </>
      )}

        {showKPIForm && (
          <KPIForm
            ventureId={selectedVenture}
            ventureName={venture?.name}
            onClose={() => setShowKPIForm(false)}
            onSuccess={() => {
              setShowKPIForm(false);
              refetch();
            }}
          />
        )}
      </TabsContent>

      <TabsContent value="suggestions">
        <AIKPISuggestions ventures={ventures} />
      </TabsContent>
    </Tabs>
  );
}