import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, TrendingDown, Newspaper, Users, BarChart3, AlertCircle } from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function CompanyIntelligenceView({ company }) {
  const [refreshing, setRefreshing] = useState(false);

  const { data: intelligence, isLoading, refetch } = useQuery({
    queryKey: ['companyIntelligence', company.id],
    queryFn: async () => {
      const response = await base44.functions.invoke('companyIntelligence', {
        company_name: company.company_name,
        stock_symbol: company.stock_symbol,
        cnpj: company.cnpj
      });
      return response.data?.intelligence || null;
    },
    enabled: !!company
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    toast.success('Dados atualizados');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  const sentiment = intelligence?.market_sentiment;
  const stock = intelligence?.stock_data;
  const news = intelligence?.news || [];
  const metrics = intelligence?.financial_metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{company.company_name}</h2>
          <p className="text-slate-400 text-sm">{company.sector}</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar'}
        </Button>
      </div>

      {/* Stock Data */}
      {stock && (
        <GlowCard glowColor="cyan" className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#00D4FF]" />
            <h3 className="text-white font-semibold">Dados da Ação</h3>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">Preço</div>
              <div className="text-2xl font-bold text-white">R$ {stock.price}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Variação</div>
              <div className={`text-xl font-bold ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stock.change >= 0 ? <TrendingUp className="inline w-4 h-4" /> : <TrendingDown className="inline w-4 h-4" />}
                {stock.change_percent}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Volume</div>
              <div className="text-xl font-bold text-white">{stock.volume?.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Última Negociação</div>
              <div className="text-sm text-white">{stock.latest_trading_day}</div>
            </div>
          </div>
        </GlowCard>
      )}

      {/* Market Sentiment */}
      {sentiment && (
        <GlowCard glowColor="gold" className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-[#C7A763]" />
            <h3 className="text-white font-semibold">Sentimento de Mercado</h3>
          </div>
          <div className="mb-4">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-sm">
              {sentiment.overall_sentiment}
            </span>
          </div>
          <p className="text-slate-300 mb-4">{sentiment.summary}</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-white font-medium mb-2">Oportunidades</h4>
              <ul className="space-y-1">
                {sentiment.opportunities?.map((opp, idx) => (
                  <li key={idx} className="text-sm text-slate-400">• {opp}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Riscos</h4>
              <ul className="space-y-1">
                {sentiment.risks?.map((risk, idx) => (
                  <li key={idx} className="text-sm text-slate-400">• {risk}</li>
                ))}
              </ul>
            </div>
          </div>
        </GlowCard>
      )}

      {/* Financial Metrics */}
      {metrics && (
        <GlowCard glowColor="mixed" className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">Indicadores Financeiros</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {metrics.market_cap && (
              <div>
                <div className="text-xs text-slate-400">Market Cap</div>
                <div className="text-white font-medium">{metrics.market_cap}</div>
              </div>
            )}
            {metrics.pe_ratio && (
              <div>
                <div className="text-xs text-slate-400">P/L</div>
                <div className="text-white font-medium">{metrics.pe_ratio}</div>
              </div>
            )}
            {metrics.roe && (
              <div>
                <div className="text-xs text-slate-400">ROE</div>
                <div className="text-white font-medium">{metrics.roe}</div>
              </div>
            )}
            {metrics.profit_margin && (
              <div>
                <div className="text-xs text-slate-400">Margem Líquida</div>
                <div className="text-white font-medium">{metrics.profit_margin}</div>
              </div>
            )}
            {metrics.dividend_yield && (
              <div>
                <div className="text-xs text-slate-400">Dividend Yield</div>
                <div className="text-white font-medium">{metrics.dividend_yield}</div>
              </div>
            )}
          </div>
          {metrics.description && (
            <p className="text-sm text-slate-400 mt-4">{metrics.description}</p>
          )}
        </GlowCard>
      )}

      {/* News */}
      {news.length > 0 && (
        <GlowCard glowColor="cyan" className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="w-5 h-5 text-[#00D4FF]" />
            <h3 className="text-white font-semibold">Notícias Recentes</h3>
          </div>
          <div className="space-y-4">
            {news.map((article, idx) => (
              <div key={idx} className="border-l-2 border-[#00D4FF]/30 pl-4">
                <h4 className="text-white font-medium mb-1">{article.title}</h4>
                <p className="text-sm text-slate-400 mb-2">{article.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{article.source}</span>
                  <span>•</span>
                  <span>{article.published_at}</span>
                </div>
              </div>
            ))}
          </div>
        </GlowCard>
      )}
    </div>
  );
}