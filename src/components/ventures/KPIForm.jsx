import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import GlowCard from "@/components/ui/GlowCard";

export default function KPIForm({ ventureId, ventureName, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    kpi_name: '',
    kpi_type: 'custom',
    current_value: '',
    target_value: '',
    unit: '',
    period: 'monthly',
    measurement_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureKPI',
        operation: 'create',
        data: {
          venture_id: ventureId,
          ...formData,
          current_value: parseFloat(formData.current_value),
          target_value: formData.target_value ? parseFloat(formData.target_value) : null
        }
      });

      toast.success('KPI registrado');
      onSuccess();
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <GlowCard glowColor="gold" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Adicionar KPI</h3>
              <p className="text-sm text-slate-400">{ventureName}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5 text-white/70" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Nome do KPI</label>
                <Input
                  value={formData.kpi_name}
                  onChange={(e) => setFormData({...formData, kpi_name: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Ex: MRR, Usuários Ativos"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">Tipo</label>
                <Select value={formData.kpi_type} onValueChange={(value) => setFormData({...formData, kpi_type: value})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="efficiency">Efficiency</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Valor Atual</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.current_value}
                  onChange={(e) => setFormData({...formData, current_value: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">Meta</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.target_value}
                  onChange={(e) => setFormData({...formData, target_value: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">Unidade</label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="R$, %, #"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Período</label>
                <Select value={formData.period} onValueChange={(value) => setFormData({...formData, period: value})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">Data da Medição</label>
                <Input
                  type="date"
                  value={formData.measurement_date}
                  onChange={(e) => setFormData({...formData, measurement_date: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Notas</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Observações sobre este KPI..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="border-white/10 text-white">
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]">
                {saving ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" />Salvar</>}
              </Button>
            </div>
          </form>
        </GlowCard>
      </motion.div>
    </motion.div>
  );
}