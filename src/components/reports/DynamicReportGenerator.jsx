import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Download, FileText, Filter, Calendar, TrendingUp, DollarSign, Target, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import GlowCard from "@/components/ui/GlowCard";
import SectionTitle from "@/components/ui/SectionTitle";
import { toast } from "sonner";
import { format } from 'date-fns';

export default function DynamicReportGenerator() {
  const [filters, setFilters] = useState({
    ventureId: 'all',
    metricType: 'all', // 'kpis', 'financial', 'all'
    startDate: '',
    endDate: '',
    groupBy: 'month' // 'day', 'week', 'month', 'quarter'
  });
  const [showFilters, setShowFilters] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Fetch data
  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Venture',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const { data: kpis = [] } = useQuery({
    queryKey: ['kpis'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureKPI',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const { data: financials = [] } = useQuery({
    queryKey: ['financials'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'FinancialRecord',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  // Filter and process data
  const filteredData = useMemo(() => {
    let data = [];

    // Filter by venture
    const ventureFilter = filters.ventureId === 'all' 
      ? (item) => true 
      : (item) => item.venture_id === filters.ventureId;

    // Filter by date
    const dateFilter = (item) => {
      const itemDate = new Date(item.measurement_date || item.record_date || item.created_date);
      const start = filters.startDate ? new Date(filters.startDate) : new Date('2000-01-01');
      const end = filters.endDate ? new Date(filters.endDate) : new Date('2099-12-31');
      return itemDate >= start && itemDate <= end;
    };

    // Include KPIs
    if (filters.metricType === 'all' || filters.metricType === 'kpis') {
      const filteredKPIs = kpis.filter(k => ventureFilter(k) && dateFilter(k));
      data.push(...filteredKPIs.map(k => ({
        ...k,
        type: 'KPI',
        date: k.measurement_date || k.created_date,
        value: k.current_value,
        target: k.target_value,
        name: k.kpi_name
      })));
    }

    // Include Financials
    if (filters.metricType === 'all' || filters.metricType === 'financial') {
      const filteredFinancials = financials.filter(f => ventureFilter(f) && dateFilter(f));
      data.push(...filteredFinancials.map(f => ({
        ...f,
        type: 'Financial',
        date: f.record_date,
        value: f.revenue,
        expense: f.expenses,
        name: 'Receita/Despesas'
      })));
    }

    return data.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [kpis, financials, filters]);

  // Group data by period
  const groupedData = useMemo(() => {
    const groups = {};
    
    filteredData.forEach(item => {
      const date = new Date(item.date);
      let key;

      switch (filters.groupBy) {
        case 'day':
          key = format(date, 'yyyy-MM-dd');
          break;
        case 'week':
          key = format(date, 'yyyy-ww');
          break;
        case 'month':
          key = format(date, 'yyyy-MM');
          break;
        case 'quarter':
          key = `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
          break;
        default:
          key = format(date, 'yyyy-MM');
      }

      if (!groups[key]) {
        groups[key] = { period: key, kpis: 0, revenue: 0, expenses: 0, count: 0 };
      }

      if (item.type === 'KPI') {
        groups[key].kpis += item.value || 0;
        groups[key].count++;
      } else if (item.type === 'Financial') {
        groups[key].revenue += item.value || 0;
        groups[key].expenses += item.expense || 0;
      }
    });

    return Object.values(groups);
  }, [filteredData, filters.groupBy]);

  // Export functions
  const exportToPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Title
      doc.setFontSize(20);
      doc.text('Relatório Dinâmico', 20, 20);
      
      doc.setFontSize(10);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 30);

      // Filters
      doc.setFontSize(12);
      doc.text('Filtros Aplicados:', 20, 45);
      doc.setFontSize(9);
      let y = 52;
      
      if (filters.ventureId !== 'all') {
        const venture = ventures.find(v => v.id === filters.ventureId);
        doc.text(`Venture: ${venture?.name || 'N/A'}`, 25, y);
        y += 6;
      }
      if (filters.metricType !== 'all') {
        doc.text(`Tipo: ${filters.metricType === 'kpis' ? 'KPIs' : 'Financeiro'}`, 25, y);
        y += 6;
      }
      if (filters.startDate) {
        doc.text(`Início: ${format(new Date(filters.startDate), 'dd/MM/yyyy')}`, 25, y);
        y += 6;
      }
      if (filters.endDate) {
        doc.text(`Fim: ${format(new Date(filters.endDate), 'dd/MM/yyyy')}`, 25, y);
        y += 6;
      }

      // Summary
      y += 10;
      doc.setFontSize(12);
      doc.text('Resumo:', 20, y);
      y += 7;
      doc.setFontSize(9);
      doc.text(`Total de registros: ${filteredData.length}`, 25, y);
      y += 6;
      
      const totalRevenue = groupedData.reduce((sum, g) => sum + g.revenue, 0);
      const totalExpenses = groupedData.reduce((sum, g) => sum + g.expenses, 0);
      doc.text(`Receita Total: R$ ${totalRevenue.toLocaleString('pt-BR')}`, 25, y);
      y += 6;
      doc.text(`Despesas Totais: R$ ${totalExpenses.toLocaleString('pt-BR')}`, 25, y);
      y += 6;
      doc.text(`Lucro: R$ ${(totalRevenue - totalExpenses).toLocaleString('pt-BR')}`, 25, y);

      // Data table
      y += 15;
      doc.setFontSize(12);
      doc.text('Dados Agrupados:', 20, y);
      y += 7;
      doc.setFontSize(8);

      groupedData.forEach((group, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${group.period} | Receita: R$ ${group.revenue.toFixed(2)} | Despesas: R$ ${group.expenses.toFixed(2)}`, 25, y);
        y += 5;
      });

      doc.save(`relatorio-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Relatório PDF exportado com sucesso');
    } catch (error) {
      toast.error('Erro ao exportar PDF: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    setExporting(true);
    try {
      const csvRows = [];
      
      // Headers
      csvRows.push(['Período', 'KPIs', 'Receita', 'Despesas', 'Lucro'].join(','));
      
      // Data
      groupedData.forEach(group => {
        const profit = group.revenue - group.expenses;
        csvRows.push([
          group.period,
          group.kpis.toFixed(2),
          group.revenue.toFixed(2),
          group.expenses.toFixed(2),
          profit.toFixed(2)
        ].join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('Relatório CSV exportado com sucesso');
    } catch (error) {
      toast.error('Erro ao exportar CSV: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <SectionTitle
          subtitle="RELATÓRIOS"
          title="Gerador de Relatórios Dinâmicos"
          accent="cyan"
          align="left"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-white/20 text-white"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
          </Button>
          <Button
            onClick={exportToPDF}
            disabled={exporting || filteredData.length === 0}
            className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]"
          >
            <FileText className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button
            onClick={exportToCSV}
            disabled={exporting || filteredData.length === 0}
            className="bg-[#00D4FF] hover:bg-[#0099CC] text-[#06101F]"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <GlowCard glowColor="gold" className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-white mb-2 block">Venture</Label>
                <Select value={filters.ventureId} onValueChange={(v) => setFilters(f => ({...f, ventureId: v}))}>
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
                <Label className="text-white mb-2 block">Tipo de Métrica</Label>
                <Select value={filters.metricType} onValueChange={(v) => setFilters(f => ({...f, metricType: v}))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="kpis">KPIs</SelectItem>
                    <SelectItem value="financial">Financeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white mb-2 block">Agrupar por</Label>
                <Select value={filters.groupBy} onValueChange={(v) => setFilters(f => ({...f, groupBy: v}))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Dia</SelectItem>
                    <SelectItem value="week">Semana</SelectItem>
                    <SelectItem value="month">Mês</SelectItem>
                    <SelectItem value="quarter">Trimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white mb-2 block">Data Início</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(f => ({...f, startDate: e.target.value}))}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Data Fim</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(f => ({...f, endDate: e.target.value}))}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setFilters({
                    ventureId: 'all',
                    metricType: 'all',
                    startDate: '',
                    endDate: '',
                    groupBy: 'month'
                  })}
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </GlowCard>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <GlowCard glowColor="cyan" className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-[#00D4FF]" />
            <span className="text-sm text-slate-400">Total de Registros</span>
          </div>
          <div className="text-3xl font-bold text-white">{filteredData.length}</div>
        </GlowCard>

        <GlowCard glowColor="gold" className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-[#C7A763]" />
            <span className="text-sm text-slate-400">Receita Total</span>
          </div>
          <div className="text-3xl font-bold text-white">
            R$ {groupedData.reduce((sum, g) => sum + g.revenue, 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </div>
        </GlowCard>

        <GlowCard glowColor="mixed" className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-slate-400">Lucro</span>
          </div>
          <div className="text-3xl font-bold text-white">
            R$ {(groupedData.reduce((sum, g) => sum + g.revenue - g.expenses, 0)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </div>
        </GlowCard>
      </div>

      {/* Charts */}
      {groupedData.length > 0 ? (
        <>
          <GlowCard className="p-6">
            <h3 className="text-white font-semibold mb-4">Receita vs Despesas ao Longo do Tempo</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={groupedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="period" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #ffffff20' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#C7A763" strokeWidth={2} name="Receita" />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Despesas" />
              </LineChart>
            </ResponsiveContainer>
          </GlowCard>

          {filters.metricType !== 'financial' && (
            <GlowCard className="p-6">
              <h3 className="text-white font-semibold mb-4">Performance de KPIs</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={groupedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="period" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #ffffff20' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="kpis" fill="#00D4FF" name="KPIs" />
                </BarChart>
              </ResponsiveContainer>
            </GlowCard>
          )}
        </>
      ) : (
        <GlowCard className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-white font-semibold mb-2">Nenhum dado encontrado</h3>
          <p className="text-slate-400 text-sm">
            Ajuste os filtros acima para visualizar dados do relatório
          </p>
        </GlowCard>
      )}
    </div>
  );
}