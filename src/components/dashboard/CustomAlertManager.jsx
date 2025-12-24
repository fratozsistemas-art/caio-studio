import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, X, Trash2, Edit, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function CustomAlertManager({ ventures }) {
  const [showForm, setShowForm] = useState(false);
  const [alerts, setAlerts] = useState([
    { id: 1, venture: 'all', metric: 'revenue', condition: 'below', value: 10000, enabled: true },
    { id: 2, venture: 'all', metric: 'burn_rate', condition: 'above', value: 50000, enabled: true }
  ]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    venture: 'all',
    metric: 'revenue',
    condition: 'below',
    value: 0
  });

  const metrics = [
    { value: 'revenue', label: 'Receita' },
    { value: 'expenses', label: 'Despesas' },
    { value: 'burn_rate', label: 'Burn Rate' },
    { value: 'runway', label: 'Runway (meses)' },
    { value: 'kpi_achievement', label: 'Atingimento de KPI' },
    { value: 'cash_balance', label: 'Saldo de Caixa' },
    { value: 'team_size', label: 'Tamanho do Time' }
  ];

  const conditions = [
    { value: 'below', label: 'Abaixo de' },
    { value: 'above', label: 'Acima de' },
    { value: 'equals', label: 'Igual a' }
  ];

  const handleSave = () => {
    if (editingId) {
      setAlerts(alerts.map(a => a.id === editingId ? { ...formData, id: editingId, enabled: true } : a));
      toast.success('Alerta atualizado');
    } else {
      const newAlert = {
        ...formData,
        id: Date.now(),
        enabled: true
      };
      setAlerts([...alerts, newAlert]);
      toast.success('Alerta criado');
    }
    
    setShowForm(false);
    setEditingId(null);
    setFormData({ venture: 'all', metric: 'revenue', condition: 'below', value: 0 });
  };

  const handleEdit = (alert) => {
    setFormData(alert);
    setEditingId(alert.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
    toast.success('Alerta removido');
  };

  const toggleAlert = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const getMetricLabel = (value) => metrics.find(m => m.value === value)?.label || value;
  const getConditionLabel = (value) => conditions.find(c => c.value === value)?.label || value;
  const getVentureName = (id) => {
    if (id === 'all') return 'Todas as Ventures';
    return ventures.find(v => v.id === id)?.name || 'Desconhecida';
  };

  return (
    <GlowCard glowColor="mixed" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-[#C7A763]" />
          <h3 className="text-xl font-bold text-white">Alertas Personalizados</h3>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ venture: 'all', metric: 'revenue', condition: 'below', value: 0 });
          }}
          size="sm"
          className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] hover:from-[#D4B474] hover:to-[#B99B5A] text-[#06101F]"
        >
          <Plus className="w-4 h-4 mr-1" />
          Novo Alerta
        </Button>
      </div>

      {/* Alert Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <h4 className="text-sm font-semibold text-white mb-4">
              {editingId ? 'Editar Alerta' : 'Novo Alerta'}
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/70 mb-2 block">Venture</label>
                <Select value={formData.venture} onValueChange={(value) => setFormData({...formData, venture: value})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Ventures</SelectItem>
                    {ventures.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-white/70 mb-2 block">Métrica</label>
                <Select value={formData.metric} onValueChange={(value) => setFormData({...formData, metric: value})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {metrics.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-white/70 mb-2 block">Condição</label>
                <Select value={formData.condition} onValueChange={(value) => setFormData({...formData, condition: value})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-white/70 mb-2 block">Valor</label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value)})}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                <Save className="w-4 h-4 mr-1" />
                Salvar
              </Button>
              <Button 
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                size="sm" 
                variant="ghost" 
                className="text-white/70"
              >
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border transition-all ${
              alert.enabled
                ? 'bg-white/5 border-white/10'
                : 'bg-white/[0.02] border-white/5 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => toggleAlert(alert.id)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${
                      alert.enabled ? 'bg-green-600' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                      alert.enabled ? 'left-5' : 'left-1'
                    }`} />
                  </button>
                  <span className="text-sm text-white/80 font-medium">
                    {getVentureName(alert.venture)}
                  </span>
                </div>
                <p className="text-sm text-white/60">
                  {getMetricLabel(alert.metric)} {getConditionLabel(alert.condition).toLowerCase()}{' '}
                  <span className="text-[#C7A763] font-semibold">
                    {alert.value.toLocaleString()}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleEdit(alert)}
                  size="sm"
                  variant="ghost"
                  className="text-[#00D4FF] hover:bg-[#00D4FF]/10"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(alert.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum alerta configurado</p>
        </div>
      )}
    </GlowCard>
  );
}