import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle, Award, Target, DollarSign, Globe } from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";

export default function VentureScore({ score, compact = false }) {
  if (!score) return null;

  const getScoreColor = (value) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-blue-400';
    if (value >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreGradient = (value) => {
    if (value >= 80) return 'from-green-500/20 to-transparent';
    if (value >= 60) return 'from-blue-500/20 to-transparent';
    if (value >= 40) return 'from-yellow-500/20 to-transparent';
    return 'from-red-500/20 to-transparent';
  };

  const getScoreBorder = (value) => {
    if (value >= 80) return 'border-green-500/30';
    if (value >= 60) return 'border-blue-500/30';
    if (value >= 40) return 'border-yellow-500/30';
    return 'border-red-500/30';
  };

  const scoreCategories = [
    { key: 'financial_health_score', label: 'Saúde Financeira', icon: DollarSign },
    { key: 'kpi_performance_score', label: 'Performance KPIs', icon: Target },
    { key: 'market_position_score', label: 'Posição no Mercado', icon: Globe },
    { key: 'growth_potential_score', label: 'Potencial de Crescimento', icon: TrendingUp }
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Award className={`w-5 h-5 ${getScoreColor(score.overall_score)}`} />
        <span className={`text-2xl font-bold ${getScoreColor(score.overall_score)}`}>
          {score.overall_score.toFixed(0)}
        </span>
        <span className="text-sm text-slate-400">/100</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <GlowCard glowColor="mixed" className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Venture Score</h3>
            <p className="text-sm text-slate-400">
              Atualizado em {new Date(score.calculated_at).toLocaleString('pt-BR')}
            </p>
          </div>
          <div className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${getScoreGradient(score.overall_score)} border ${getScoreBorder(score.overall_score)} flex items-center justify-center`}>
            <div>
              <div className={`text-4xl font-bold text-center ${getScoreColor(score.overall_score)}`}>
                {score.overall_score.toFixed(0)}
              </div>
              <div className="text-xs text-slate-400 text-center">/ 100</div>
            </div>
          </div>
        </div>

        {/* Category Scores */}
        <div className="grid md:grid-cols-2 gap-4">
          {scoreCategories.map((category, i) => {
            const value = score[category.key] || 0;
            const Icon = category.icon;
            return (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-white">{category.label}</span>
                  </div>
                  <span className={`text-lg font-bold ${getScoreColor(value)}`}>
                    {value.toFixed(0)}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${getScoreGradient(value).replace('to-transparent', 'to-white/30')}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlowCard>

      {/* Insights */}
      {score.insights && score.insights.length > 0 && (
        <GlowCard glowColor="cyan" className="p-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#00D4FF]" />
            Insights
          </h4>
          <div className="space-y-2">
            {score.insights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-2 text-sm text-slate-300"
              >
                <span className="text-[#00D4FF]">•</span>
                <span>{insight}</span>
              </motion.div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Recommendations */}
      {score.recommendations && score.recommendations.length > 0 && (
        <GlowCard glowColor="gold" className="p-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#C7A763]" />
            Recomendações
          </h4>
          <div className="space-y-2">
            {score.recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-2 text-sm text-slate-300"
              >
                <span className="text-[#C7A763]">→</span>
                <span>{rec}</span>
              </motion.div>
            ))}
          </div>
        </GlowCard>
      )}
    </div>
  );
}