import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Lightbulb, Target, CheckCircle2, Globe } from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";
import moment from 'moment';

export default function AnalysisReport({ analysis }) {
  const sections = [
    {
      title: "Pontos Fortes",
      icon: CheckCircle2,
      color: "text-green-400",
      glowColor: "gold",
      data: analysis.strengths,
      emptyMessage: "Nenhum ponto forte identificado"
    },
    {
      title: "Riscos e Alertas",
      icon: AlertTriangle,
      color: "text-orange-400",
      glowColor: "mixed",
      data: analysis.risks,
      emptyMessage: "Nenhum risco crítico identificado"
    },
    {
      title: "Insights Preditivos",
      icon: TrendingUp,
      color: "text-cyan-400",
      glowColor: "cyan",
      data: analysis.predictive_insights,
      emptyMessage: "Nenhum insight preditivo disponível"
    },
    {
      title: "Recomendações",
      icon: Lightbulb,
      color: "text-yellow-400",
      glowColor: "gold",
      data: analysis.recommendations,
      emptyMessage: "Nenhuma recomendação disponível"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <GlowCard glowColor="mixed" className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Análise de {analysis.venture_name}
            </h3>
            <p className="text-slate-400 text-sm">
              Gerado em {moment(analysis.generated_at).format('DD/MM/YYYY HH:mm')}
            </p>
          </div>
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            IA Analysis
          </Badge>
        </div>

        {/* Performance Overview */}
        {analysis.performance_overview && (
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-sm font-semibold text-[#C7A763] mb-2">Resumo Executivo</h4>
            <p className="text-white/90 leading-relaxed">{analysis.performance_overview}</p>
          </div>
        )}
      </GlowCard>

      {/* Main Sections */}
      <div className="grid lg:grid-cols-2 gap-6">
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlowCard glowColor={section.glowColor} className="p-6 h-full">
              <div className="flex items-center gap-3 mb-4">
                <section.icon className={`w-5 h-5 ${section.color}`} />
                <h4 className="text-lg font-semibold text-white">{section.title}</h4>
              </div>
              
              {section.data && section.data.length > 0 ? (
                <ul className="space-y-3">
                  {section.data.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="text-white/50 mt-1">•</span>
                      <span className="text-white/80 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm italic">{section.emptyMessage}</p>
              )}
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* Suggested KPIs */}
      {analysis.suggested_kpis && analysis.suggested_kpis.length > 0 && (
        <GlowCard glowColor="cyan" className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-5 h-5 text-[#00D4FF]" />
            <h4 className="text-lg font-semibold text-white">Novos KPIs Sugeridos</h4>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {analysis.suggested_kpis.map((kpi, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-3">
                  <h5 className="font-semibold text-white">{kpi.name}</h5>
                  <Badge className="bg-[#00D4FF]/20 text-[#00D4FF] border-[#00D4FF]/30 text-xs">
                    {kpi.measurement_frequency}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 mb-3">{kpi.reason}</p>
                {kpi.target_suggestion && (
                  <div className="text-xs text-slate-500">
                    Meta sugerida: <span className="text-[#00D4FF]">{kpi.target_suggestion}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* KPI Adjustments */}
      {analysis.kpi_adjustments && analysis.kpi_adjustments.length > 0 && (
        <GlowCard glowColor="gold" className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-5 h-5 text-[#C7A763]" />
            <h4 className="text-lg font-semibold text-white">Ajustes de Metas Recomendados</h4>
          </div>
          
          <div className="space-y-4">
            {analysis.kpi_adjustments.map((adjustment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-white">{adjustment.kpi_name}</h5>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-400">
                      {adjustment.current_target}
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className="text-[#C7A763] font-semibold">
                      {adjustment.suggested_target}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-400">{adjustment.rationale}</p>
              </motion.div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Market Insights */}
      {analysis.market_insights && analysis.market_insights.length > 0 && (
        <GlowCard glowColor="mixed" className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-purple-400" />
            <h4 className="text-lg font-semibold text-white">Insights de Mercado</h4>
          </div>
          
          <div className="space-y-3">
            {analysis.market_insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20"
              >
                <span className="text-purple-400 mt-1">•</span>
                <p className="text-white/90 text-sm leading-relaxed">{insight}</p>
              </motion.div>
            ))}
          </div>
        </GlowCard>
      )}
    </motion.div>
  );
}