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

export default function VentureForm({ venture, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: venture?.name || '',
    description: venture?.description || '',
    layer: venture?.layer || 'startup',
    status: venture?.status || 'development',
    category: venture?.category || '',
    tags: venture?.tags?.join(', ') || '',
    website: venture?.website || '',
    team_size: venture?.team_size || 0,
    business_model: venture?.business_model || '',
    target_audience: venture?.target_audience || '',
    competitive_advantages: venture?.competitive_advantages?.join(', ') || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        competitive_advantages: formData.competitive_advantages.split(',').map(t => t.trim()).filter(t => t),
        team_size: parseInt(formData.team_size) || 0
      };

      if (venture) {
        await base44.functions.invoke('secureEntityQuery', {
          entity_name: 'Venture',
          operation: 'update',
          data: { ...data, id: venture.id }
        });
        toast.success('Venture atualizada');
      } else {
        await base44.functions.invoke('secureEntityQuery', {
          entity_name: 'Venture',
          operation: 'create',
          data
        });
        toast.success('Venture criada');
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
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <GlowCard glowColor="cyan" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              {venture ? 'Editar Venture' : 'Nova Venture'}
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white/70">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Nome</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Camada</label>
                <Select value={formData.layer} onValueChange={(value) => setFormData({...formData, layer: value})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup</SelectItem>
                    <SelectItem value="scaleup">Scale-up</SelectItem>
                    <SelectItem value="deeptech">Deep Tech</SelectItem>
                    <SelectItem value="platform">Platform</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="winwin">Win-Win</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">Status</label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="scaling">Scaling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Categoria</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Tags (separadas por vírgula)</label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
                placeholder="AI, Tech, Innovation"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Website</label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Tamanho da Equipe</label>
              <Input
                type="number"
                value={formData.team_size}
                onChange={(e) => setFormData({...formData, team_size: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Modelo de Negócio</label>
              <Input
                value={formData.business_model}
                onChange={(e) => setFormData({...formData, business_model: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
                placeholder="B2B, B2C, SaaS, etc."
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Público-Alvo</label>
              <Input
                value={formData.target_audience}
                onChange={(e) => setFormData({...formData, target_audience: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Descrição do público-alvo"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Vantagens Competitivas (separadas por vírgula)</label>
              <Textarea
                value={formData.competitive_advantages}
                onChange={(e) => setFormData({...formData, competitive_advantages: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Tecnologia proprietária, Equipe experiente, etc."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="border-white/10 text-white">
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]">
                {saving ? 'Salvando...' : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </form>
        </GlowCard>
      </motion.div>
    </motion.div>
  );
}