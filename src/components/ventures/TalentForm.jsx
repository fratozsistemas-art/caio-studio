import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import GlowCard from "@/components/ui/GlowCard";

export default function TalentForm({ ventureId, ventureName, talent, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    talent_name: talent?.talent_name || '',
    role: talent?.role || '',
    skills: talent?.skills?.join(', ') || '',
    level: talent?.level || 'mid',
    allocation: talent?.allocation || 100,
    email: talent?.email || '',
    linkedin: talent?.linkedin || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        venture_id: ventureId,
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        allocation: parseInt(formData.allocation)
      };

      if (talent) {
        await base44.functions.invoke('secureEntityQuery', {
          entity_name: 'VentureTalent',
          operation: 'update',
          data: { ...data, id: talent.id }
        });
        toast.success('Talento atualizado');
      } else {
        await base44.functions.invoke('secureEntityQuery', {
          entity_name: 'VentureTalent',
          operation: 'create',
          data
        });
        toast.success('Talento adicionado');
      }

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
        <GlowCard glowColor="mixed" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">
                {talent ? 'Editar Talento' : 'Adicionar Talento'}
              </h3>
              <p className="text-sm text-slate-400">{ventureName}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5 text-white/70" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Nome</label>
                <Input
                  value={formData.talent_name}
                  onChange={(e) => setFormData({...formData, talent_name: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">Função</label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Skills (separadas por vírgula)</label>
              <Input
                value={formData.skills}
                onChange={(e) => setFormData({...formData, skills: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
                placeholder="React, TypeScript, Node.js"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Nível</label>
                <Select value={formData.level} onValueChange={(value) => setFormData({...formData, level: value})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">Alocação (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.allocation}
                  onChange={(e) => setFormData({...formData, allocation: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">LinkedIn</label>
                <Input
                  value={formData.linkedin}
                  onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="border-white/10 text-white">
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                {saving ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" />Salvar</>}
              </Button>
            </div>
          </form>
        </GlowCard>
      </motion.div>
    </motion.div>
  );
}