import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Target, AlertTriangle, Sparkles, 
  DollarSign, BarChart3, LineChart, Settings, Eye, EyeOff, 
  ArrowUpRight, ArrowDownRight, Brain, Newspaper
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import GlowCard from '@/components/ui/GlowCard';
import { 
  LineChart as RechartsLine, 
  Line, 
  BarChart, 
  Bar, 
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  Area
} from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function AdvancedAnalyticsDashboard({ ventures = [] }) {
  const [customization, setCustomization] = useState({
    showROI: true,
    showSentiment: true,
    showComparison: true,
    showProjections: true
  });

  const [selectedVentures, setSelectedVentures] = useState([]);

  // Fetch ROI data for selected ventures
  const { data: roiData, isLoading: loadingROI } = useQuery({
    queryKey: ['venture-roi', selectedVentures],
    queryFn: async () => {
      if (selectedVentures.length === 0) return [];
      
      const results = await Promise.all(
        selectedVentures.map(ventureId => 
          base44.functions.invoke('calculateVentureROI', { ventureId })
            .then(res => res.data)
            .catch(() => null)
        )
      );
      return results.filter(Boolean);
    },
    enabled: selectedVentures.length > 0
  });

  // Fetch market sentiment for ventures
  const { data: sentimentData } = useQuery({
    queryKey: ['venture-sentiment', ventures.map(v => v.id)],
    queryFn: async () => {
      const venturesWithIds = ventures.filter(v => v.id).slice(0, 10); // Limit to 10
      const results = await Promise.all(
        venturesWithIds.map(v =>
          base44.functions.invoke('ventureMarketAnalysis', {
            ventureName: v.name,
            category: v.category,
            tags: v.tags
          })
          .then(res => ({ ventureId: v.id, ventureName: v.name, ...res.data }))
          .catch(() => null)
        )
      );
      return results.filter(Boolean);
    },
    enabled: ventures.filter(v => v.id).length > 0,
    staleTime: 1000 * 60 * 30 // 30 minutes
  });

  // Calculate layer-based ROI averages
  const layerROIAverages = useMemo(() => {
    if (!roiData || roiData.length === 0) return [];
    
    const layerMap = {};
    ventures.forEach(v => {
      if (!layerMap[v.layer]) {
        layerMap[v.layer] = { layer: v.layer, ventures: [], avgROI: 0 };
      }
    });

    roiData.forEach(roi => {
      const venture = ventures.find(v => v.id === roi.venture_id);
      if (venture && layerMap[venture.layer]) {
        layerMap[venture.layer].ventures.push(roi);
      }
    });

    return Object.values(layerMap).map(layer => ({
      layer: layer.layer,
      avgROI: layer.ventures.length > 0 
        ? layer.ventures.reduce((sum, v) => sum + v.current_metrics.actual_roi, 0) / layer.ventures.length
        : 0,
      count: layer.ventures.length
    }));
  }, [roiData, ventures]);

  // Prepare comparison data
  const comparisonData = useMemo(() => {
    if (!roiData || roiData.length === 0) return [];

    return roiData.map(roi => {
      const venture = ventures.find(v => v.id === roi.venture_id);
      return {
        name: venture?.name || 'Unknown',
        layer: venture?.layer || 'unknown',
        roi: roi.current_metrics.actual_roi,
        revenue: roi.current_metrics.revenue,
        valuation: roi.current_metrics.current_valuation,
        projected_12m: roi.projections?.month_12?.realistic || 0,
        projected_24m: roi.projections?.month_24?.realistic || 0,
        projected_36m: roi.projections?.month_36?.realistic || 0
      };
    });
  }, [roiData, ventures]);

  // Sentiment summary
  const sentimentSummary = useMemo(() => {
    if (!sentimentData || sentimentData.length === 0) return null;

    const sentiments = sentimentData.map(s => s.analysis?.sentiment_score || 0);
    const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;

    const positive = sentimentData.filter(s => s.analysis?.overall_sentiment?.includes('positive')).length;
    const neutral = sentimentData.filter(s => s.analysis?.overall_sentiment === 'neutral').length;
    const negative = sentimentData.filter(s => s.analysis?.overall_sentiment?.includes('negative')).length;

    return {
      average: avgSentiment,
      positive,
      neutral,
      negative,
      total: sentimentData.length
    };
  }, [sentimentData]);

  const getSentimentColor = (score) => {
    if (score >= 50) return 'text-green-400';
    if (score >= 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSentimentIcon = (score) => {
    if (score >= 50) return <TrendingUp className="w-5 h-5" />;
    if (score >= 0) return <TrendingUp className="w-5 h-5 opacity-50" />;
    return <TrendingDown className="w-5 h-5" />;
  };

  return (
    <div className="space-y-8 mb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold text-white font-montserrat mb-2">
            Advanced Analytics
          </h2>
          <p className="text-slate-400">
            AI-powered insights, ROI projections, and market sentiment analysis
          </p>
        </div>

        {/* Dashboard Customization */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10">
              <Settings className="w-4 h-4 mr-2" />
              Customize
            </Button>
          </PopoverTrigger>
          <PopoverContent className="bg-[#0a1628] border-white/10 w-64">
            <h4 className="text-white font-semibold mb-4">Dashboard Widgets</h4>
            <div className="space-y-3">
              {Object.entries(customization).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) =>
                      setCustomization({ ...customization, [key]: checked })
                    }
                  />
                  <label
                    htmlFor={key}
                    className="text-sm text-slate-300 cursor-pointer"
                  >
                    {key.replace('show', '').replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </motion.div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
          <TabsTrigger value="sentiment">Market Sentiment</TabsTrigger>
          <TabsTrigger value="comparison">Performance Comparison</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlowCard glowColor="gold" className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#C7A763]/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[#C7A763]" />
                </div>
                <h4 className="text-sm font-medium text-slate-400">Avg ROI</h4>
              </div>
              <div className="text-2xl font-bold text-white">
                {roiData && roiData.length > 0
                  ? `${(roiData.reduce((sum, r) => sum + r.current_metrics.actual_roi, 0) / roiData.length).toFixed(1)}%`
                  : 'N/A'}
              </div>
            </GlowCard>

            <GlowCard glowColor="cyan" className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/20 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-[#00D4FF]" />
                </div>
                <h4 className="text-sm font-medium text-slate-400">Market Sentiment</h4>
              </div>
              <div className={`text-2xl font-bold ${getSentimentColor(sentimentSummary?.average || 0)}`}>
                {sentimentSummary ? `${sentimentSummary.average.toFixed(0)}/100` : 'Analyzing...'}
              </div>
            </GlowCard>

            <GlowCard glowColor="mixed" className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <h4 className="text-sm font-medium text-slate-400">Top Performer</h4>
              </div>
              <div className="text-lg font-bold text-white truncate">
                {comparisonData.length > 0
                  ? comparisonData.reduce((max, v) => v.roi > max.roi ? v : max).name
                  : 'N/A'}
              </div>
            </GlowCard>

            <GlowCard glowColor="gold" className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-green-400" />
                </div>
                <h4 className="text-sm font-medium text-slate-400">Positive Outlook</h4>
              </div>
              <div className="text-2xl font-bold text-white">
                {sentimentSummary ? `${sentimentSummary.positive}/${sentimentSummary.total}` : 'N/A'}
              </div>
            </GlowCard>
          </div>

          {customization.showROI && layerROIAverages.length > 0 && (
            <GlowCard glowColor="cyan" className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">ROI by Layer</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={layerROIAverages}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="layer" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #ffffff20', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="avgROI" fill="#C7A763" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </GlowCard>
          )}
        </TabsContent>

        {/* ROI Analysis Tab */}
        <TabsContent value="roi" className="space-y-6">
          <div className="mb-4">
            <p className="text-slate-400 text-sm mb-3">Select ventures to analyze ROI projections:</p>
            <div className="flex flex-wrap gap-2">
              {ventures.filter(v => v.id).slice(0, 15).map(venture => (
                <Badge
                  key={venture.id}
                  variant="outline"
                  className={`cursor-pointer transition-all ${
                    selectedVentures.includes(venture.id)
                      ? 'bg-[#C7A763] text-[#06101F] border-[#C7A763]'
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                  onClick={() => {
                    setSelectedVentures(prev =>
                      prev.includes(venture.id)
                        ? prev.filter(id => id !== venture.id)
                        : [...prev, venture.id]
                    );
                  }}
                >
                  {venture.name}
                </Badge>
              ))}
            </div>
          </div>

          {loadingROI && (
            <GlowCard glowColor="mixed" className="p-12 text-center">
              <div className="animate-pulse text-slate-400">Analyzing ROI projections...</div>
            </GlowCard>
          )}

          {!loadingROI && comparisonData.length > 0 && (
            <>
              <GlowCard glowColor="gold" className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">ROI Projections (12-36 months)</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #ffffff20', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="roi" fill="#C7A763" name="Current ROI" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="projected_12m" stroke="#00D4FF" strokeWidth={2} name="12M Proj" />
                    <Line type="monotone" dataKey="projected_24m" stroke="#A88B4A" strokeWidth={2} name="24M Proj" />
                    <Line type="monotone" dataKey="projected_36m" stroke="#C7A763" strokeWidth={2} name="36M Proj" strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
              </GlowCard>

              <div className="grid md:grid-cols-2 gap-4">
                {roiData?.map((roi, idx) => (
                  <GlowCard key={idx} glowColor={idx % 2 === 0 ? 'cyan' : 'gold'} className="p-6">
                    <h4 className="text-white font-semibold mb-3">{roi.venture_name}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current ROI:</span>
                        <span className={`font-bold ${roi.current_metrics.actual_roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {roi.current_metrics.actual_roi.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Valuation:</span>
                        <span className="text-white font-medium">
                          R$ {(roi.current_metrics.current_valuation / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">12M Projection:</span>
                        <span className="text-[#00D4FF] font-medium">
                          {roi.projections?.month_12?.realistic?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="pt-2 border-t border-white/10">
                        <span className="text-xs text-slate-500">
                          Confidence: {roi.analysis?.confidence_level || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </GlowCard>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Market Sentiment Tab */}
        <TabsContent value="sentiment" className="space-y-6">
          {sentimentData && sentimentData.length > 0 ? (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                <GlowCard glowColor="gold" className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-400">{sentimentSummary.positive}</div>
                  <div className="text-sm text-slate-400">Positive Sentiment</div>
                </GlowCard>
                <GlowCard glowColor="cyan" className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-yellow-400 opacity-50 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-400">{sentimentSummary.neutral}</div>
                  <div className="text-sm text-slate-400">Neutral Sentiment</div>
                </GlowCard>
                <GlowCard glowColor="mixed" className="p-6 text-center">
                  <TrendingDown className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-400">{sentimentSummary.negative}</div>
                  <div className="text-sm text-slate-400">Negative Sentiment</div>
                </GlowCard>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {sentimentData.map((sentiment, idx) => (
                  <GlowCard key={idx} glowColor={idx % 2 === 0 ? 'cyan' : 'gold'} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-white font-semibold">{sentiment.ventureName}</h4>
                        <Badge
                          variant="outline"
                          className={`mt-2 ${
                            sentiment.analysis?.overall_sentiment?.includes('positive')
                              ? 'bg-green-500/10 text-green-400 border-green-500/30'
                              : sentiment.analysis?.overall_sentiment === 'neutral'
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {sentiment.analysis?.overall_sentiment || 'N/A'}
                        </Badge>
                      </div>
                      <div className={`text-2xl font-bold ${getSentimentColor(sentiment.analysis?.sentiment_score || 0)}`}>
                        {sentiment.analysis?.sentiment_score || 0}
                      </div>
                    </div>

                    <p className="text-sm text-slate-400 mb-4 line-clamp-3">
                      {sentiment.analysis?.summary || 'No summary available'}
                    </p>

                    {sentiment.analysis?.growth_opportunities && sentiment.analysis.growth_opportunities.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-xs font-semibold text-[#C7A763] mb-2 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Opportunities
                        </h5>
                        <ul className="space-y-1">
                          {sentiment.analysis.growth_opportunities.slice(0, 2).map((opp, i) => (
                            <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                              <ArrowUpRight className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{opp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {sentiment.analysis?.risks && sentiment.analysis.risks.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Risks
                        </h5>
                        <ul className="space-y-1">
                          {sentiment.analysis.risks.slice(0, 2).map((risk, i) => (
                            <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                              <ArrowDownRight className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </GlowCard>
                ))}
              </div>
            </>
          ) : (
            <GlowCard glowColor="mixed" className="p-12 text-center">
              <Newspaper className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">Loading market sentiment analysis...</p>
            </GlowCard>
          )}
        </TabsContent>

        {/* Performance Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          {comparisonData.length > 0 ? (
            <>
              <GlowCard glowColor="mixed" className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Multi-Metric Comparison</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={comparisonData.slice(0, 6)}>
                    <PolarGrid stroke="#ffffff20" />
                    <PolarAngleAxis dataKey="name" stroke="#94a3b8" />
                    <PolarRadiusAxis stroke="#94a3b8" />
                    <Radar name="ROI" dataKey="roi" stroke="#C7A763" fill="#C7A763" fillOpacity={0.3} />
                    <Radar name="12M Projection" dataKey="projected_12m" stroke="#00D4FF" fill="#00D4FF" fillOpacity={0.2} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #ffffff20', borderRadius: '8px' }}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </GlowCard>

              <GlowCard glowColor="cyan" className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Revenue vs Valuation</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                    <YAxis yAxisId="left" stroke="#94a3b8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#C7A763" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #ffffff20', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#00D4FF" name="Revenue" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="valuation" stroke="#C7A763" strokeWidth={3} name="Valuation" />
                  </ComposedChart>
                </ResponsiveContainer>
              </GlowCard>
            </>
          ) : (
            <GlowCard glowColor="gold" className="p-12 text-center">
              <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">Select ventures in the ROI tab to see performance comparisons</p>
            </GlowCard>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}