import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { Plus, Users, Trash2, Pencil } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import GlowCard from "@/components/ui/GlowCard";
import TalentForm from "./TalentForm";

export default function TalentManager({ ventures }) {
  const [selectedVenture, setSelectedVenture] = useState(ventures[0]?.id || null);
  const [showTalentForm, setShowTalentForm] = useState(false);
  const [editingTalent, setEditingTalent] = useState(null);

  const { data: talentsResponse, refetch } = useQuery({
    queryKey: ['talents', selectedVenture],
    queryFn: async () => {
      if (!selectedVenture) return { data: [] };
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTalent',
        operation: 'filter',
        query: { venture_id: selectedVenture }
      });
      return response.data;
    },
    enabled: !!selectedVenture
  });

  const talents = talentsResponse?.data || [];
  const venture = ventures.find(v => v.id === selectedVenture);

  const handleDelete = async (talent) => {
    if (!confirm(`Remover ${talent.talent_name}?`)) return;

    try {
      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTalent',
        operation: 'delete',
        query: { id: talent.id }
      });
      toast.success('Talento removido');
      refetch();
    } catch (error) {
      toast.error('Erro: ' + error.message);
    }
  };

  const levelColors = {
    junior: 'bg-blue-500/20 text-blue-400',
    mid: 'bg-green-500/20 text-green-400',
    senior: 'bg-purple-500/20 text-purple-400',
    lead: 'bg-orange-500/20 text-orange-400',
    executive: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className="space-y-6">
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
          onClick={() => {
            setEditingTalent(null);
            setShowTalentForm(true);
          }}
          disabled={!selectedVenture}
          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Talento
        </Button>
      </div>

      {selectedVenture && (
        <div className="grid md:grid-cols-2 gap-4">
          {talents.map((talent, index) => (
            <motion.div
              key={talent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlowCard glowColor="mixed" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-1">{talent.talent_name}</h4>
                      <p className="text-sm text-slate-400">{talent.role}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingTalent(talent);
                          setShowTalentForm(true);
                        }}
                        className="text-[#00D4FF] hover:bg-[#00D4FF]/10"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(talent)}
                        className="text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {talent.level && (
                    <span className={`inline-block text-xs px-2 py-1 rounded-full ${levelColors[talent.level]}`}>
                      {talent.level}
                    </span>
                  )}

                  {talent.skills && talent.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {talent.skills.map((skill, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/60">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {talent.allocation && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Alocação</span>
                        <span>{talent.allocation}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${talent.allocation}%` }}
                          className="h-full bg-gradient-to-r from-[#00D4FF] to-[#C7A763] rounded-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </GlowCard>
            </motion.div>
          ))}

          {talents.length === 0 && (
            <div className="col-span-2 text-center py-12 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum talento registrado para esta venture</p>
            </div>
          )}
        </div>
      )}

      {showTalentForm && (
        <TalentForm
          ventureId={selectedVenture}
          ventureName={venture?.name}
          talent={editingTalent}
          onClose={() => {
            setShowTalentForm(false);
            setEditingTalent(null);
          }}
          onSuccess={() => {
            setShowTalentForm(false);
            setEditingTalent(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}