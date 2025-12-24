import React, { useState } from 'react';
import { FileDown, Loader2, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";
import jsPDF from 'jspdf';

export default function FinancialReportExporter({ scenario, venture }) {
  const [exporting, setExporting] = useState(false);
  const [reportType, setReportType] = useState('all');

  const generateDRE = (projections) => {
    const dre = [];
    projections.monthly_projections?.forEach((month, index) => {
      dre.push({
        period: `Mês ${index + 1}`,
        receita_bruta: month.revenue || 0,
        deducoes: month.revenue * 0.15 || 0,
        receita_liquida: (month.revenue * 0.85) || 0,
        custos_variaveis: month.variable_costs || 0,
        margem_contribuicao: ((month.revenue * 0.85) - (month.variable_costs || 0)),
        custos_fixos: month.fixed_costs || 0,
        ebitda: ((month.revenue * 0.85) - (month.variable_costs || 0) - (month.fixed_costs || 0)),
        depreciacao: month.depreciation || 0,
        ebit: ((month.revenue * 0.85) - (month.variable_costs || 0) - (month.fixed_costs || 0) - (month.depreciation || 0)),
        impostos: month.taxes || 0,
        lucro_liquido: month.net_profit || 0
      });
    });
    return dre;
  };

  const generateFluxoCaixa = (projections) => {
    const fluxo = [];
    let saldo_acumulado = projections.key_metrics?.initial_cash || 0;
    
    projections.monthly_projections?.forEach((month, index) => {
      const entradas = month.revenue || 0;
      const saidas = (month.variable_costs || 0) + (month.fixed_costs || 0);
      const fluxo_operacional = entradas - saidas;
      saldo_acumulado += fluxo_operacional;

      fluxo.push({
        period: `Mês ${index + 1}`,
        entradas_operacionais: entradas,
        saidas_operacionais: saidas,
        fluxo_operacional,
        investimentos: month.investments || 0,
        financiamentos: month.financing || 0,
        fluxo_total: fluxo_operacional - (month.investments || 0) + (month.financing || 0),
        saldo_acumulado
      });
    });
    return fluxo;
  };

  const generateBalanco = (projections) => {
    const balanco = [];
    let ativo_total = 100000;
    let passivo_total = 50000;

    projections.monthly_projections?.forEach((month, index) => {
      const caixa = month.cash_balance || 0;
      const contas_receber = (month.revenue || 0) * 0.3;
      const estoque = (month.variable_costs || 0) * 0.2;
      const ativo_circulante = caixa + contas_receber + estoque;
      const ativo_permanente = ativo_total - ativo_circulante;

      const fornecedores = (month.variable_costs || 0) * 0.3;
      const impostos_pagar = (month.taxes || 0);
      const passivo_circulante = fornecedores + impostos_pagar;
      const passivo_longo_prazo = passivo_total - passivo_circulante;
      const patrimonio_liquido = ativo_circulante + ativo_permanente - passivo_circulante - passivo_longo_prazo;

      balanco.push({
        period: `Mês ${index + 1}`,
        ativo_circulante,
        ativo_permanente,
        ativo_total: ativo_circulante + ativo_permanente,
        passivo_circulante,
        passivo_longo_prazo,
        patrimonio_liquido,
        passivo_pl_total: passivo_circulante + passivo_longo_prazo + patrimonio_liquido
      });
    });
    return balanco;
  };

  const exportToPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const projections = scenario.projections;
      
      // Header
      doc.setFontSize(20);
      doc.text(`Relatórios Financeiros - ${venture.name}`, 14, 20);
      doc.setFontSize(12);
      doc.text(`Cenário: ${scenario.scenario_name}`, 14, 28);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 35);

      let yPos = 45;

      // DRE
      if (reportType === 'all' || reportType === 'dre') {
        doc.setFontSize(14);
        doc.text('Demonstração do Resultado do Exercício (DRE)', 14, yPos);
        yPos += 8;

        const dre = generateDRE(projections);
        doc.setFontSize(9);
        
        // Summary only for PDF
        const total_receita = dre.reduce((sum, item) => sum + item.receita_liquida, 0);
        const total_lucro = dre.reduce((sum, item) => sum + item.lucro_liquido, 0);
        
        doc.text(`Receita Líquida Total (12M): R$ ${total_receita.toLocaleString('pt-BR')}`, 14, yPos);
        doc.text(`Lucro Líquido Total (12M): R$ ${total_lucro.toLocaleString('pt-BR')}`, 14, yPos + 6);
        doc.text(`Margem Líquida Média: ${((total_lucro / total_receita) * 100).toFixed(1)}%`, 14, yPos + 12);
        yPos += 25;
      }

      // Fluxo de Caixa
      if (reportType === 'all' || reportType === 'fluxo') {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.text('Demonstração do Fluxo de Caixa (DFC)', 14, yPos);
        yPos += 8;

        const fluxo = generateFluxoCaixa(projections);
        doc.setFontSize(9);
        
        const total_entradas = fluxo.reduce((sum, item) => sum + item.entradas_operacionais, 0);
        const total_saidas = fluxo.reduce((sum, item) => sum + item.saidas_operacionais, 0);
        const saldo_final = fluxo[fluxo.length - 1]?.saldo_acumulado || 0;
        
        doc.text(`Entradas Operacionais Total: R$ ${total_entradas.toLocaleString('pt-BR')}`, 14, yPos);
        doc.text(`Saídas Operacionais Total: R$ ${total_saidas.toLocaleString('pt-BR')}`, 14, yPos + 6);
        doc.text(`Saldo Final (12M): R$ ${saldo_final.toLocaleString('pt-BR')}`, 14, yPos + 12);
        yPos += 25;
      }

      // Balanço Patrimonial
      if (reportType === 'all' || reportType === 'balanco') {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.text('Balanço Patrimonial Projetado', 14, yPos);
        yPos += 8;

        const balanco = generateBalanco(projections);
        const ultimo_balanco = balanco[balanco.length - 1];
        
        doc.setFontSize(9);
        doc.text('ATIVO', 14, yPos);
        doc.text(`Circulante: R$ ${ultimo_balanco.ativo_circulante.toLocaleString('pt-BR')}`, 14, yPos + 6);
        doc.text(`Permanente: R$ ${ultimo_balanco.ativo_permanente.toLocaleString('pt-BR')}`, 14, yPos + 12);
        doc.text(`TOTAL: R$ ${ultimo_balanco.ativo_total.toLocaleString('pt-BR')}`, 14, yPos + 18);
        
        doc.text('PASSIVO + PL', 110, yPos);
        doc.text(`Circulante: R$ ${ultimo_balanco.passivo_circulante.toLocaleString('pt-BR')}`, 110, yPos + 6);
        doc.text(`Longo Prazo: R$ ${ultimo_balanco.passivo_longo_prazo.toLocaleString('pt-BR')}`, 110, yPos + 12);
        doc.text(`Patrimônio Líquido: R$ ${ultimo_balanco.patrimonio_liquido.toLocaleString('pt-BR')}`, 110, yPos + 18);
        doc.text(`TOTAL: R$ ${ultimo_balanco.passivo_pl_total.toLocaleString('pt-BR')}`, 110, yPos + 24);
      }

      doc.save(`relatorio_financeiro_${scenario.scenario_name.replace(/\s/g, '_')}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    setExporting(true);
    try {
      const projections = scenario.projections;
      let csvContent = '';

      if (reportType === 'all' || reportType === 'dre') {
        csvContent += 'DRE - Demonstração do Resultado do Exercício\n';
        csvContent += 'Período,Receita Bruta,Deduções,Receita Líquida,Custos Variáveis,Margem Contribuição,Custos Fixos,EBITDA,Depreciação,EBIT,Impostos,Lucro Líquido\n';
        
        const dre = generateDRE(projections);
        dre.forEach(row => {
          csvContent += `${row.period},${row.receita_bruta},${row.deducoes},${row.receita_liquida},${row.custos_variaveis},${row.margem_contribuicao},${row.custos_fixos},${row.ebitda},${row.depreciacao},${row.ebit},${row.impostos},${row.lucro_liquido}\n`;
        });
        csvContent += '\n\n';
      }

      if (reportType === 'all' || reportType === 'fluxo') {
        csvContent += 'DFC - Demonstração do Fluxo de Caixa\n';
        csvContent += 'Período,Entradas Operacionais,Saídas Operacionais,Fluxo Operacional,Investimentos,Financiamentos,Fluxo Total,Saldo Acumulado\n';
        
        const fluxo = generateFluxoCaixa(projections);
        fluxo.forEach(row => {
          csvContent += `${row.period},${row.entradas_operacionais},${row.saidas_operacionais},${row.fluxo_operacional},${row.investimentos},${row.financiamentos},${row.fluxo_total},${row.saldo_acumulado}\n`;
        });
        csvContent += '\n\n';
      }

      if (reportType === 'all' || reportType === 'balanco') {
        csvContent += 'Balanço Patrimonial Projetado\n';
        csvContent += 'Período,Ativo Circulante,Ativo Permanente,Ativo Total,Passivo Circulante,Passivo Longo Prazo,Patrimônio Líquido,Passivo + PL Total\n';
        
        const balanco = generateBalanco(projections);
        balanco.forEach(row => {
          csvContent += `${row.period},${row.ativo_circulante},${row.ativo_permanente},${row.ativo_total},${row.passivo_circulante},${row.passivo_longo_prazo},${row.patrimonio_liquido},${row.passivo_pl_total}\n`;
        });
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio_financeiro_${scenario.scenario_name.replace(/\s/g, '_')}.csv`;
      link.click();
      
      toast.success('CSV gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar CSV: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <GlowCard glowColor="gold" className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileDown className="w-5 h-5 text-[#C7A763]" />
        <h3 className="text-xl font-bold text-white">Exportar Relatórios Financeiros</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-white/70 mb-2 block">Tipo de Relatório</label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos (DRE + DFC + Balanço)</SelectItem>
              <SelectItem value="dre">DRE - Demonstração do Resultado</SelectItem>
              <SelectItem value="fluxo">DFC - Fluxo de Caixa</SelectItem>
              <SelectItem value="balanco">Balanço Patrimonial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={exportToPDF}
            disabled={exporting}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Exportar PDF
          </Button>
          
          <Button
            onClick={exportToCSV}
            disabled={exporting}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Exportar CSV
          </Button>
        </div>

        <div className="text-xs text-slate-400 space-y-1">
          <p>• <strong>DRE:</strong> Receitas, custos, despesas e lucro projetados</p>
          <p>• <strong>DFC:</strong> Entradas e saídas de caixa operacionais</p>
          <p>• <strong>Balanço:</strong> Ativos, passivos e patrimônio líquido projetados</p>
        </div>
      </div>
    </GlowCard>
  );
}