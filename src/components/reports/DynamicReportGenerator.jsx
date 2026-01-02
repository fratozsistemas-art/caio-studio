import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, Filter, Calendar, TrendingUp, DollarSign, Target, X, Bell, Plus, Trash2, AlertTriangle, CheckCircle2, AreaChart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, AreaChart as RechartsAreaChart, Area, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import GlowCard from "@/components/ui/GlowCard";
import SectionTitle from "@/components/ui/SectionTitle";
import { Badge } from "@/components/ui/badge";
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
  const [showAlertConfig, setShowAlertConfig] = useState(false);
  const [newAlert, setNewAlert] = useState({
    metric: 'revenue',
    threshold: '',
    condition: 'above', // 'above', 'below'
    notification: true
  });
  const [alerts, setAlerts] = useState([]);

  const queryClient = useQueryClient();

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
        groups[key] = { period: key, kpis: 0, revenue: 0, expenses: 0, profit: 0, count: 0 };
      }

      if (item.type === 'KPI') {
        groups[key].kpis += item.value || 0;
        groups[key].count++;
      } else if (item.type === 'Financial') {
        groups[key].revenue += item.value || 0;
        groups[key].expenses += item.expense || 0;
        groups[key].profit = groups[key].revenue - groups[key].expenses;
      }
    });

    return Object.values(groups);
  }, [filteredData, filters.groupBy]);

  // Check alerts
  const triggeredAlerts = useMemo(() => {
    const triggered = [];
    const latestData = groupedData[groupedData.length - 1];
    
    if (!latestData) return triggered;

    alerts.forEach(alert => {
      const value = latestData[alert.metric];
      const threshold = parseFloat(alert.threshold);
      
      if (alert.condition === 'above' && value > threshold) {
        triggered.push({...alert, currentValue: value});
      } else if (alert.condition === 'below' && value < threshold) {
        triggered.push({...alert, currentValue: value});
      }
    });

    return triggered;
  }, [groupedData, alerts]);

  const addAlert = () => {
    if (!newAlert.threshold) {
      toast.error('Defina um valor de threshold');
      return;
    }

    const alert = {
      ...newAlert,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    setAlerts(prev => [...prev, alert]);
    setNewAlert({ metric: 'revenue', threshold: '', condition: 'above', notification: true });
    toast.success('Alerta configurado');
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast.success('Alerta removido');
  };

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
            variant="outline"
            onClick={() => setShowAlertConfig(!showAlertConfig)}
            className="border-[#C7A763]/30 text-[#C7A763]"
          >
            <Bell className="w-4 h-4 mr-2" />
            Alertas ({alerts.length})
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

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {triggeredAlerts.map(alert => (
            <GlowCard key={alert.id} glowColor="gold" className="p-4 border-2 border-yellow-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-white font-semibold mb-1">Alerta Disparado!</div>
                  <p className="text-sm text-slate-300">
                    {alert.metric === 'revenue' ? 'Receita' : alert.metric === 'expenses' ? 'Despesas' : alert.metric === 'profit' ? 'Lucro' : 'KPIs'} está{' '}
                    {alert.condition === 'above' ? 'acima' : 'abaixo'} do threshold de{' '}
                    R$ {parseFloat(alert.threshold).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-yellow-400 mt-1">
                    Valor atual: R$ {alert.currentValue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </GlowCard>
          ))}
        </motion.div>
      )}

      {/* Alert Configuration */}
      <AnimatePresence>
        {showAlertConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlowCard glowColor="gold" className="p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#C7A763]" />
                Configurar Alertas Automáticos
              </h3>
              
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label className="text-white mb-2 block">Métrica</Label>
                  <Select value={newAlert.metric} onValueChange={(v) => setNewAlert({...newAlert, metric: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Receita</SelectItem>
                      <SelectItem value="expenses">Despesas</SelectItem>
                      <SelectItem value="profit">Lucro</SelectItem>
                      <SelectItem value="kpis">KPIs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Condição</Label>
                  <Select value={newAlert.condition} onValueChange={(v) => setNewAlert({...newAlert, condition: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Acima de</SelectItem>
                      <SelectItem value="below">Abaixo de</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Threshold (R$)</Label>
                  <Input
                    type="number"
                    value={newAlert.threshold}
                    onChange={(e) => setNewAlert({...newAlert, threshold: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="Ex: 50000"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={addAlert}
                    className="w-full bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {alerts.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-white block mb-2">Alertas Ativos</Label>
                  {alerts.map(alert => (
                    <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-white">
                          {alert.metric === 'revenue' ? 'Receita' : alert.metric === 'expenses' ? 'Despesas' : alert.metric === 'profit' ? 'Lucro' : 'KPIs'}{' '}
                          {alert.condition === 'above' ? '>' : '<'} R$ {parseFloat(alert.threshold).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAlert(alert.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </GlowCard>
          </motion.div>
        )}
      </AnimatePresence>

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
          {/* Advanced Timeline - Revenue & Expenses with Area */}
          <GlowCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <AreaChart className="w-5 h-5 text-[#C7A763]" />
                Timeline Financeiro Completo
              </h3>
              <Badge className="bg-[#C7A763]/20 text-[#C7A763]">
                {groupedData.length} períodos
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={groupedData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C7A763" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C7A763" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="period" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #ffffff20', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff', marginBottom: '8px' }}
                  formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#C7A763" fillOpacity={1} fill="url(#colorRevenue)" name="Receita" />
                <Area type="monotone" dataKey="expenses" stroke="#EF4444" fillOpacity={1} fill="url(#colorExpenses)" name="Despesas" />
                <Line type="monotone" dataKey="profit" stroke="#00D4FF" strokeWidth={3} name="Lucro" dot={{ fill: '#00D4FF', r: 4 }} />
                {alerts.filter(a => a.metric === 'revenue').map(alert => (
                  <ReferenceLine 
                    key={alert.id} 
                    y={parseFloat(alert.threshold)} 
                    stroke="#FFD700" 
                    strokeDasharray="5 5"
                    label={{ value: `Threshold: R$ ${parseFloat(alert.threshold).toLocaleString('pt-BR')}`, position: 'right', fill: '#FFD700' }}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </GlowCard>

          {/* KPI Performance Timeline */}
          {filters.metricType !== 'financial' && (
            <GlowCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#00D4FF]" />
                  Timeline de Performance de KPIs
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={groupedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="period" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #ffffff20', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="kpis" fill="#00D4FF" name="KPIs Totais" radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey="count" stroke="#C7A763" strokeWidth={2} name="Número de KPIs" dot={{ fill: '#C7A763', r: 3 }} />
                  {alerts.filter(a => a.metric === 'kpis').map(alert => (
                    <ReferenceLine 
                      key={alert.id} 
                      y={parseFloat(alert.threshold)} 
                      stroke="#FFD700" 
                      strokeDasharray="5 5"
                      label={{ value: `Threshold: ${parseFloat(alert.threshold)}`, position: 'right', fill: '#FFD700' }}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </GlowCard>
          )}

          {/* Profit Margin Analysis */}
          <GlowCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Análise de Margem de Lucro
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={groupedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="period" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #ffffff20', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`}
                />
                <Legend />
                <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} name="Lucro Líquido" dot={{ fill: '#10B981', r: 5 }} />
                <ReferenceLine y={0} stroke="#ffffff30" strokeDasharray="3 3" />
                {alerts.filter(a => a.metric === 'profit').map(alert => (
                  <ReferenceLine 
                    key={alert.id} 
                    y={parseFloat(alert.threshold)} 
                    stroke="#FFD700" 
                    strokeDasharray="5 5"
                    label={{ value: `Threshold: R$ ${parseFloat(alert.threshold).toLocaleString('pt-BR')}`, position: 'right', fill: '#FFD700' }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </GlowCard>
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