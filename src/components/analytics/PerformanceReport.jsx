import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function PerformanceReport({ venture, kpis, financials, talents }) {
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const prompt = `
You are an expert business analyst. Generate a comprehensive performance report for this venture:

VENTURE INFO:
- Name: ${venture.name}
- Stage: ${venture.status}
- Layer: ${venture.layer}
- Team Size: ${venture.team_size || 'N/A'}

KPI METRICS:
${kpis.map(k => `- ${k.kpi_name}: ${k.current_value}/${k.target_value} ${k.unit} (${((k.current_value / k.target_value) * 100).toFixed(1)}% achieved)`).join('\n')}

FINANCIAL DATA:
- Latest Revenue: R$ ${financials[financials.length - 1]?.revenue || 0}
- Latest Expenses: R$ ${financials[financials.length - 1]?.expenses || 0}
- Cash Balance: R$ ${financials[financials.length - 1]?.cash_balance || 0}
- Burn Rate: R$ ${financials.length > 1 ? (financials[financials.length - 2].cash_balance - financials[financials.length - 1].cash_balance) : 0}/month

TALENT METRICS:
- Total Talents: ${talents.length}
- Average Performance: ${(talents.reduce((sum, t) => sum + (t.performance_score || 0), 0) / talents.length).toFixed(1)}/100

Generate a JSON report with:
{
  "executive_summary": "Brief overview",
  "key_strengths": ["strength1", "strength2", "strength3"],
  "areas_of_concern": ["concern1", "concern2"],
  "financial_health": "assessment",
  "kpi_performance": "assessment",
  "talent_assessment": "assessment",
  "recommendations": ["rec1", "rec2", "rec3"],
  "risk_level": "low|medium|high",
  "growth_trajectory": "positive|stable|negative"
}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            key_strengths: { type: "array", items: { type: "string" } },
            areas_of_concern: { type: "array", items: { type: "string" } },
            financial_health: { type: "string" },
            kpi_performance: { type: "string" },
            talent_assessment: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } },
            risk_level: { type: "string" },
            growth_trajectory: { type: "string" }
          }
        }
      });

      setReport(response);
      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar relatório: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'high': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getTrajectoryIcon = (trajectory) => {
    switch (trajectory?.toLowerCase()) {
      case 'positive': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'negative': return <TrendingDown className="w-5 h-5 text-red-400" />;
      default: return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <GlowCard glowColor="gold" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-[#C7A763]" />
          <h3 className="text-xl font-bold text-white">Relatório de Performance</h3>
        </div>
        <Button
          onClick={generateReport}
          disabled={generating}
          className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          Gerar Relatório
        </Button>
      </div>

      {report ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                {getTrajectoryIcon(report.growth_trajectory)}
                <span className="text-sm text-slate-400">Trajetória de Crescimento</span>
              </div>
              <div className="text-lg font-bold text-white capitalize">
                {report.growth_trajectory}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-slate-400">Nível de Risco</span>
              </div>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(report.risk_level)}`}>
                {report.risk_level?.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="p-5 rounded-lg bg-gradient-to-br from-[#C7A763]/10 to-transparent border border-[#C7A763]/20">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Resumo Executivo
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">{report.executive_summary}</p>
          </div>

          {/* Key Strengths */}
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Principais Forças
            </h4>
            <div className="space-y-2">
              {report.key_strengths?.map((strength, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  <span className="text-sm text-slate-300">{strength}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Areas of Concern */}
          {report.areas_of_concern?.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Áreas de Atenção
              </h4>
              <div className="space-y-2">
                {report.areas_of_concern.map((concern, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <span className="text-sm text-slate-300">{concern}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assessments Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h5 className="text-xs text-slate-400 mb-2">Saúde Financeira</h5>
              <p className="text-sm text-white">{report.financial_health}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h5 className="text-xs text-slate-400 mb-2">Performance KPIs</h5>
              <p className="text-sm text-white">{report.kpi_performance}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h5 className="text-xs text-slate-400 mb-2">Avaliação de Talentos</h5>
              <p className="text-sm text-white">{report.talent_assessment}</p>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00D4FF]" />
              Recomendações
            </h4>
            <div className="space-y-2">
              {report.recommendations?.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20">
                  <div className="w-6 h-6 rounded-full bg-[#00D4FF]/20 flex items-center justify-center text-[#00D4FF] text-xs font-bold mt-0.5">
                    {i + 1}
                  </div>
                  <span className="text-sm text-slate-300">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Clique no botão acima para gerar um relatório de performance completo</p>
          <p className="text-xs mt-2">Análise alimentada por IA</p>
        </div>
      )}
    </GlowCard>
  );
}