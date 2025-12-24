import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import GlowCard from "@/components/ui/GlowCard";

export default function DashboardCustomizer({ config, onSave, onClose }) {
  const [localConfig, setLocalConfig] = useState(config);

  const toggleOption = (key) => {
    setLocalConfig(prev => ({ ...prev, [key]: !prev[key] }));
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
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <GlowCard glowColor="cyan" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Customizar Dashboard</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5 text-white/70" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <Label htmlFor="financials" className="text-white">Mostrar Financeiro</Label>
              <Switch
                id="financials"
                checked={localConfig.showFinancials}
                onCheckedChange={() => toggleOption('showFinancials')}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <Label htmlFor="kpis" className="text-white">Mostrar KPIs</Label>
              <Switch
                id="kpis"
                checked={localConfig.showKPIs}
                onCheckedChange={() => toggleOption('showKPIs')}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <Label htmlFor="talents" className="text-white">Mostrar Talentos</Label>
              <Switch
                id="talents"
                checked={localConfig.showTalents}
                onCheckedChange={() => toggleOption('showTalents')}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <Label htmlFor="market" className="text-white">Mostrar Market Data</Label>
              <Switch
                id="market"
                checked={localConfig.showMarket}
                onCheckedChange={() => toggleOption('showMarket')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button variant="outline" onClick={onClose} className="border-white/10 text-white">
              Cancelar
            </Button>
            <Button onClick={() => onSave(localConfig)} className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#06101F]">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </GlowCard>
      </motion.div>
    </motion.div>
  );
}