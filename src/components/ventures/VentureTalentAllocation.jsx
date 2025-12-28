import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Star, Briefcase, Plus, X } from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function VentureTalentAllocation({ ventureId, talents }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTalentId, setSelectedTalentId] = useState('');
  const [allocationData, setAllocationData] = useState({
    role: '',
    allocation_percentage: 50,
    responsibilities: '',
    is_lead: false
  });
  const queryClient = useQueryClient();

  // Fetch available roles
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Role',
        operation: 'filter',
        query: { is_active: true },
        sort: 'name'
      });
      return res.data?.data || [];
    }
  });

  // Fetch all talents for selection
  const { data: allTalents } = useQuery({
    queryKey: ['all-talents'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Talent',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const addTalentMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTalent',
        operation: 'create',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ventureTalents', ventureId]);
      setShowAddDialog(false);
      setSelectedTalentId('');
      setAllocationData({
        role: '',
        allocation_percentage: 50,
        responsibilities: '',
        is_lead: false
      });
      toast.success('Talento adicionado à venture!');
    }
  });

  const removeTalentMutation = useMutation({
    mutationFn: async (talentAllocationId) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTalent',
        operation: 'delete',
        id: talentAllocationId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ventureTalents', ventureId]);
      toast.success('Talento removido da venture');
    }
  });

  const handleAddTalent = () => {
    if (!selectedTalentId || !allocationData.role) {
      toast.error('Selecione um talento e defina o papel');
      return;
    }

    const responsibilities = allocationData.responsibilities
      .split(',')
      .map(r => r.trim())
      .filter(Boolean);

    addTalentMutation.mutate({
      venture_id: ventureId,
      talent_id: selectedTalentId,
      role: allocationData.role,
      allocation_percentage: allocationData.allocation_percentage,
      responsibilities,
      is_lead: allocationData.is_lead,
      status: 'active'
    });
  };

  // Filter out already allocated talents
  const allocatedTalentIds = talents.map(t => t.talent_id);
  const availableTalents = allTalents?.filter(t => !allocatedTalentIds.includes(t.id)) || [];
  const totalAllocation = talents.reduce((sum, t) => sum + (t.allocation || 0), 0);
  const avgPerformance = talents.length > 0 
    ? talents.reduce((sum, t) => sum + (t.performance_score || 0), 0) / talents.length 
    : 0;

  const talentsByLevel = talents.reduce((acc, t) => {
    acc[t.level] = (acc[t.level] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <GlowCard glowColor="cyan" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-[#00D4FF]" />
            <h3 className="text-xl font-bold text-white">Alocação de Talentos</h3>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            size="sm"
            className="bg-[#00D4FF] hover:bg-[#00B8E6] text-[#06101F]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Talento
          </Button>
        </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs text-slate-400 mb-1">Total Talentos</div>
          <div className="text-2xl font-bold text-white">{talents.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs text-slate-400 mb-1">Alocação Total</div>
          <div className="text-2xl font-bold text-[#00D4FF]">{totalAllocation}%</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs text-slate-400 mb-1">Performance Média</div>
          <div className="text-2xl font-bold text-[#C7A763]">{avgPerformance.toFixed(0)}</div>
        </div>
      </div>

      {/* Talents by Level */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-white/80 mb-3">Distribuição por Nível</h4>
        <div className="flex gap-2">
          {Object.entries(talentsByLevel).map(([level, count]) => (
            <div key={level} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-slate-400 capitalize">{level}</div>
              <div className="text-lg font-bold text-white">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Talent List */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-white/80 mb-3">Time Alocado</h4>
        {talents.map((talent, i) => (
          <motion.div
            key={talent.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-medium">{talent.talent_name}</span>
                  <Badge variant="outline" className="border-white/20 text-xs capitalize">
                    {talent.level}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-3 h-3 text-slate-400" />
                  <span className="text-sm text-slate-400">{talent.role}</span>
                </div>
                {talent.skills && (
                  <div className="flex flex-wrap gap-1">
                    {talent.skills.slice(0, 4).map((skill, j) => (
                      <span key={j} className="text-xs bg-white/5 px-2 py-1 rounded text-white/60">
                        {skill}
                      </span>
                    ))}
                    {talent.skills.length > 4 && (
                      <span className="text-xs text-slate-500">+{talent.skills.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right space-y-2">
                <div>
                  <div className="text-xs text-slate-400">Alocação</div>
                  <div className="text-lg font-bold text-[#00D4FF]">{talent.allocation}%</div>
                </div>
                {talent.performance_score && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-[#C7A763]" />
                    <span className="text-sm font-semibold text-[#C7A763]">
                      {talent.performance_score}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => removeTalentMutation.mutate(talent.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/20 rounded-lg text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {talents.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum talento alocado nesta venture</p>
        </div>
      )}
    </GlowCard>

    {/* Add Talent Dialog */}
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogContent className="bg-[#0a1628] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Adicionar Talento à Venture</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-white">Selecionar Talento</Label>
            <Select value={selectedTalentId} onValueChange={setSelectedTalentId}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Escolha um talento..." />
              </SelectTrigger>
              <SelectContent>
                {availableTalents.map(talent => (
                  <SelectItem key={talent.id} value={talent.id}>
                    {talent.full_name} - {talent.current_position || 'N/A'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white">Papel na Venture *</Label>
            <Select 
              value={allocationData.role} 
              onValueChange={(v) => setAllocationData({...allocationData, role: v})}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Selecione um cargo..." />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.name}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white">Alocação (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={allocationData.allocation_percentage}
              onChange={(e) => setAllocationData({...allocationData, allocation_percentage: parseInt(e.target.value) || 0})}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <Label className="text-white">Responsabilidades (separadas por vírgula)</Label>
            <Input
              value={allocationData.responsibilities}
              onChange={(e) => setAllocationData({...allocationData, responsibilities: e.target.value})}
              placeholder="ex: Desenvolvimento backend, Code reviews..."
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allocationData.is_lead}
              onChange={(e) => setAllocationData({...allocationData, is_lead: e.target.checked})}
              className="rounded"
            />
            <Label className="text-white">É líder/responsável principal?</Label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddTalent}
              disabled={addTalentMutation.isPending}
              className="bg-[#00D4FF] hover:bg-[#00B8E6] text-[#06101F]"
            >
              {addTalentMutation.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}