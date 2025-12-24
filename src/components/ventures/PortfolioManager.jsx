import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';
import { FolderKanban, Plus, Save, Trash2, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function PortfolioManager({ ventures, financials, kpis }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    grouping_criteria: 'layer',
    venture_ids: [],
    color: '#C7A763'
  });

  const queryClient = useQueryClient();

  const { data: portfolios } = useQuery({
    queryKey: ['venturePortfolios'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VenturePortfolio',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const createPortfolioMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VenturePortfolio',
        operation: 'create',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['venturePortfolios']);
      toast.success('Portfolio criado!');
      setShowForm(false);
      setFormData({ name: '', description: '', grouping_criteria: 'layer', venture_ids: [], color: '#C7A763' });
    }
  });

  const deletePortfolioMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VenturePortfolio',
        operation: 'delete',
        id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['venturePortfolios']);
      toast.success('Portfolio removido!');
    }
  });

  const toggleVenture = (ventureId) => {
    setFormData(prev => ({
      ...prev,
      venture_ids: prev.venture_ids.includes(ventureId)
        ? prev.venture_ids.filter(id => id !== ventureId)
        : [...prev.venture_ids, ventureId]
    }));
  };

  const getPortfolioMetrics = (portfolio) => {
    const portfolioVentures = ventures.filter(v => portfolio.venture_ids?.includes(v.id));
    const portfolioFinancials = financials.filter(f => portfolio.venture_ids?.includes(f.venture_id));
    
    const totalRevenue = portfolioFinancials.reduce((sum, f) => sum + (f.revenue || 0), 0);
    const totalExpenses = portfolioFinancials.reduce((sum, f) => sum + (f.expenses || 0), 0);
    
    return {
      ventureCount: portfolioVentures.length,
      totalRevenue,
      netProfit: totalRevenue - totalExpenses
    };
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="gold" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FolderKanban className="w-5 h-5 text-[#C7A763]" />
            <h3 className="text-xl font-bold text-white">Portfolios de Ventures</h3>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Portfolio
          </Button>
        </div>

        {showForm && (
          <div className="mb-6 p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/70 mb-2 block">Nome do Portfolio</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Early Stage Ventures"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-white/70 mb-2 block">Critério de Agrupamento</label>
                <Select value={formData.grouping_criteria} onValueChange={(v) => setFormData({...formData, grouping_criteria: v})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="layer">Por Camada</SelectItem>
                    <SelectItem value="stage">Por Estágio</SelectItem>
                    <SelectItem value="category">Por Categoria</SelectItem>
                    <SelectItem value="performance">Por Performance</SelectItem>
                    <SelectItem value="custom">Customizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm text-white/70 mb-2 block">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descreva o propósito deste portfolio..."
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-white/70 mb-2 block">Selecionar Ventures</label>
              <div className="grid md:grid-cols-3 gap-2">
                {ventures.map(v => (
                  <button
                    key={v.id}
                    onClick={() => toggleVenture(v.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      formData.venture_ids.includes(v.id)
                        ? 'border-[#C7A763] bg-[#C7A763]/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-white text-sm font-medium">{v.name}</div>
                    <div className="text-xs text-slate-400">{v.layer}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => createPortfolioMutation.mutate(formData)}
                disabled={!formData.name || formData.venture_ids.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Criar Portfolio
              </Button>
              <Button
                onClick={() => setShowForm(false)}
                variant="ghost"
                className="text-white/70"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </GlowCard>

      {/* Portfolios List */}
      {portfolios && portfolios.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {portfolios.map((portfolio, i) => {
            const metrics = getPortfolioMetrics(portfolio);
            return (
              <motion.div
                key={portfolio.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlowCard glowColor="mixed" className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-white mb-1">{portfolio.name}</h4>
                      <p className="text-sm text-slate-400 mb-2">{portfolio.description}</p>
                      <Badge variant="outline" className="border-white/20 text-xs">
                        {portfolio.grouping_criteria}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => deletePortfolioMutation.mutate(portfolio.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="text-xs text-slate-400 mb-1">Ventures</div>
                      <div className="text-xl font-bold text-white">{metrics.ventureCount}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="text-xs text-slate-400 mb-1">Receita</div>
                      <div className="text-xl font-bold text-green-400">
                        {(metrics.totalRevenue / 1000).toFixed(0)}k
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="text-xs text-slate-400 mb-1">Lucro</div>
                      <div className={`text-xl font-bold ${
                        metrics.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(metrics.netProfit / 1000).toFixed(0)}k
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 mb-2">Ventures neste portfolio:</div>
                    <div className="flex flex-wrap gap-1">
                      {portfolio.venture_ids?.map(vId => {
                        const v = ventures.find(venture => venture.id === vId);
                        return v ? (
                          <span key={vId} className="text-xs bg-white/5 px-2 py-1 rounded text-white/70">
                            {v.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}