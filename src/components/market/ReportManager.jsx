import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, Trash2, Edit, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from 'sonner';

export default function ReportManager({ companies }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    report_name: '',
    report_type: 'daily',
    companies: [],
    scheduled_time: '09:00',
    recipients: [''],
    report_sections: ['news', 'stock_prices', 'sentiment'],
    active: true
  });

  const { data: reports } = useQuery({
    queryKey: ['marketReports'],
    queryFn: async () => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'MarketReport',
        operation: 'list'
      });
      return response.data?.data || [];
    }
  });

  const createReportMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'MarketReport',
        operation: 'create',
        data
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['marketReports']);
      toast.success('Relatório criado com sucesso');
      setOpen(false);
      setFormData({
        report_name: '',
        report_type: 'daily',
        companies: [],
        scheduled_time: '09:00',
        recipients: [''],
        report_sections: ['news', 'stock_prices', 'sentiment'],
        active: true
      });
    }
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (id) => {
      const response = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'MarketReport',
        operation: 'delete',
        id
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['marketReports']);
      toast.success('Relatório excluído');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createReportMutation.mutate({
      ...formData,
      recipients: formData.recipients.filter(r => r.trim() !== '')
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-semibold">Relatórios Agendados</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#C7A763] hover:bg-[#A88B4A]">
              <Plus className="w-4 h-4 mr-2" />
              Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0a1628] border-white/10 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Relatório Agendado</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome do Relatório</Label>
                <Input
                  value={formData.report_name}
                  onChange={(e) => setFormData({ ...formData, report_name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>

              <div>
                <Label>Tipo</Label>
                <Select
                  value={formData.report_type}
                  onValueChange={(value) => setFormData({ ...formData, report_type: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Horário de Envio</Label>
                <Input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label>Empresas</Label>
                <Select
                  onValueChange={(value) => {
                    if (!formData.companies.includes(value)) {
                      setFormData({ ...formData, companies: [...formData.companies, value] });
                    }
                  }}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Selecionar empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.companies.map((companyId) => {
                    const company = companies.find(c => c.id === companyId);
                    return (
                      <span
                        key={companyId}
                        className="px-2 py-1 bg-[#C7A763]/20 text-[#C7A763] rounded text-xs"
                      >
                        {company?.company_name}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Destinatários (emails)</Label>
                {formData.recipients.map((recipient, idx) => (
                  <Input
                    key={idx}
                    type="email"
                    value={recipient}
                    onChange={(e) => {
                      const newRecipients = [...formData.recipients];
                      newRecipients[idx] = e.target.value;
                      setFormData({ ...formData, recipients: newRecipients });
                    }}
                    className="bg-white/5 border-white/10 text-white mb-2"
                    placeholder="email@exemplo.com"
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, recipients: [...formData.recipients, ''] })}
                >
                  + Adicionar destinatário
                </Button>
              </div>

              <div className="flex gap-4 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#C7A763] hover:bg-[#A88B4A]">
                  Criar Relatório
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {reports?.map((report) => (
          <GlowCard key={report.id} glowColor="cyan" className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-white font-semibold mb-1">{report.report_name}</h4>
                <p className="text-xs text-slate-400">{report.report_type}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteReportMutation.mutate(report.id)}
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                Enviado às {report.scheduled_time}
              </div>
              <div className="text-slate-500">
                {report.companies.length} empresas monitoradas
              </div>
              <div className="text-slate-500">
                {report.recipients.length} destinatários
              </div>
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}