import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Loader2, Building2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from 'sonner';

export default function CVMCompanyBrowser({ onAddCompany }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);

  const { data: cvmCompanies, isLoading } = useQuery({
    queryKey: ['cvmCompanies'],
    queryFn: async () => {
      const response = await base44.functions.invoke('cvmCompanies', {
        action: 'list'
      });
      return response.data?.companies || [];
    }
  });

  const handleAddCompany = async (company) => {
    await onAddCompany({
      cnpj: company.cnpj,
      company_name: company.name,
      trading_name: company.tradingName,
      status: company.status,
      sector: company.sector,
      category: company.category,
      registration_date: company.registrationDate,
      monitoring_enabled: true
    });
    setSelectedCompany(null);
  };

  const filteredCompanies = cvmCompanies?.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnpj?.includes(searchTerm) ||
    c.tradingName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar empresas na CVM..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-white"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompanies.slice(0, 50).map((company) => (
          <GlowCard key={company.cnpj} glowColor="gold" className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <Building2 className="w-5 h-5 text-[#C7A763] mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold mb-1 truncate">{company.name}</h3>
                <p className="text-xs text-slate-400 mb-1">{company.cnpj}</p>
                <p className="text-xs text-slate-500">{company.sector}</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => handleAddCompany(company)}
              className="w-full bg-[#C7A763] hover:bg-[#A88B4A]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </GlowCard>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          Nenhuma empresa encontrada
        </div>
      )}
    </div>
  );
}