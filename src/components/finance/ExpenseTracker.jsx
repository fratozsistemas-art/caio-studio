import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Filter, Receipt, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlowCard from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ExpenseTracker({ ventureId }) {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    category: 'operational',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    status: 'pending'
  });
  const queryClient = useQueryClient();

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Expense',
        operation: 'filter',
        query: ventureId ? { venture_id: ventureId } : {},
        sort: '-expense_date'
      });
      return res.data?.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Expense',
        operation: 'create',
        data: { ...data, venture_id: ventureId }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['budgets']);
      setShowDialog(false);
      setFormData({
        category: 'operational',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        status: 'pending'
      });
      toast.success('Despesa registrada!');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Expense',
        operation: 'update',
        id,
        data: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      toast.success('Status atualizado!');
    }
  });

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-blue-500/20 text-blue-400',
    paid: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Despesas</h3>
        <Button onClick={() => setShowDialog(true)} className="bg-[#C7A763] hover:bg-[#A88B4A]">
          <Plus className="w-4 h-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      <div className="space-y-3">
        {expenses.map((expense) => (
          <GlowCard key={expense.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Receipt className="w-4 h-4 text-slate-400" />
                  <span className="text-white font-medium">{expense.description}</span>
                  <Badge className={statusColors[expense.status]}>
                    {expense.status}
                  </Badge>
                </div>
                <div className="text-sm text-slate-400">
                  {format(new Date(expense.expense_date), "dd MMM yyyy", { locale: ptBR })} • {expense.category}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xl font-bold text-white">
                  R$ {expense.amount.toLocaleString('pt-BR')}
                </div>
                {expense.status === 'pending' && (
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: expense.id, status: 'approved' })}
                      className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: expense.id, status: 'rejected' })}
                      className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </GlowCard>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#0a1628] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Registrar Despesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-white text-sm mb-2 block">Categoria</label>
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operacional</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="technology">Tecnologia</SelectItem>
                  <SelectItem value="personnel">Pessoal</SelectItem>
                  <SelectItem value="infrastructure">Infraestrutura</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white text-sm mb-2 block">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm mb-2 block">Valor (R$)</label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-white text-sm mb-2 block">Data</label>
                <Input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createMutation.mutate(formData)}
                className="bg-[#C7A763] hover:bg-[#A88B4A]"
              >
                Registrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}