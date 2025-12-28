import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Target, CheckSquare, X, Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import GlowCard from '@/components/ui/GlowCard';
import { motion, AnimatePresence } from 'framer-motion';

export default function DocumentAIAnalysis({ document, ventureId, onClose }) {
  const [analysis, setAnalysis] = useState(null);
  const [selectedInsights, setSelectedInsights] = useState({
    kpis: [],
    tasks: [],
    insights: []
  });
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const prompt = `You are an expert venture analyst. Analyze the following document and extract strategic insights.

Document: ${document.title}
Description: ${document.description || 'N/A'}
Category: ${document.category}

Please analyze this document and return a comprehensive assessment in JSON format:
{
  "key_insights": [
    {
      "title": "string - brief insight title",
      "description": "string - detailed explanation",
      "impact": "high|medium|low",
      "category": "market|product|financial|team|technology"
    }
  ],
  "risks": [
    {
      "title": "string - risk title",
      "description": "string - detailed risk explanation",
      "severity": "high|medium|low",
      "mitigation": "string - suggested mitigation strategy"
    }
  ],
  "opportunities": [
    {
      "title": "string - opportunity title",
      "description": "string - detailed opportunity explanation",
      "potential": "high|medium|low",
      "timeline": "short-term|medium-term|long-term"
    }
  ],
  "suggested_kpis": [
    {
      "kpi_name": "string",
      "kpi_type": "revenue|users|growth|efficiency|custom",
      "current_value": number,
      "target_value": number,
      "unit": "string",
      "rationale": "string - why this KPI matters"
    }
  ],
  "suggested_tasks": [
    {
      "title": "string",
      "description": "string",
      "priority": "low|medium|high|urgent",
      "estimated_due_date": "YYYY-MM-DD",
      "rationale": "string - why this task is important"
    }
  ],
  "executive_summary": "string - 2-3 sentence summary of the document's key takeaways"
}

Provide deep, actionable insights based on the document content.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: [document.file_url],
        response_json_schema: {
          type: "object",
          properties: {
            key_insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" },
                  category: { type: "string" }
                }
              }
            },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string" },
                  mitigation: { type: "string" }
                }
              }
            },
            opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  potential: { type: "string" },
                  timeline: { type: "string" }
                }
              }
            },
            suggested_kpis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  kpi_name: { type: "string" },
                  kpi_type: { type: "string" },
                  current_value: { type: "number" },
                  target_value: { type: "number" },
                  unit: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            },
            suggested_tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string" },
                  estimated_due_date: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            },
            executive_summary: { type: "string" }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      toast.success('Document analyzed successfully!');
    },
    onError: (error) => {
      toast.error('Failed to analyze document: ' + error.message);
    }
  });

  const applyInsightsMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      const promises = [];

      // Create selected KPIs
      if (selectedInsights.kpis.length > 0) {
        const kpis = selectedInsights.kpis.map(kpi => ({
          venture_id: ventureId,
          kpi_name: kpi.kpi_name,
          kpi_type: kpi.kpi_type,
          current_value: kpi.current_value,
          target_value: kpi.target_value,
          unit: kpi.unit,
          measurement_date: new Date().toISOString().split('T')[0],
          notes: `Auto-generated from document analysis: ${document.title}. ${kpi.rationale}`
        }));
        promises.push(base44.entities.VentureKPI.bulkCreate(kpis));
      }

      // Create selected tasks
      if (selectedInsights.tasks.length > 0) {
        const tasks = selectedInsights.tasks.map(task => ({
          venture_id: ventureId,
          title: task.title,
          description: `${task.description}\n\nRationale: ${task.rationale}\n\nSource: AI analysis of "${document.title}"`,
          status: 'todo',
          priority: task.priority,
          assigned_to: user.email,
          due_date: task.estimated_due_date,
          related_entity: 'document',
          related_entity_id: document.id
        }));
        promises.push(base44.entities.VentureTask.bulkCreate(tasks));
      }

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventureKPIs', ventureId] });
      queryClient.invalidateQueries({ queryKey: ['ventureTasks', ventureId] });
      toast.success(`Applied ${selectedInsights.kpis.length} KPIs and ${selectedInsights.tasks.length} tasks`);
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to apply insights: ' + error.message);
    }
  });

  const toggleSelection = (type, index) => {
    setSelectedInsights(prev => {
      const newSelected = { ...prev };
      const item = analysis[type === 'kpis' ? 'suggested_kpis' : 'suggested_tasks'][index];
      
      if (newSelected[type].some(i => JSON.stringify(i) === JSON.stringify(item))) {
        newSelected[type] = newSelected[type].filter(i => JSON.stringify(i) !== JSON.stringify(item));
      } else {
        newSelected[type] = [...newSelected[type], item];
      }
      
      return newSelected;
    });
  };

  const impactColors = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-green-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-background border border-border rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#C7A763]" />
            <div>
              <h2 className="text-xl font-bold">AI Document Analysis</h2>
              <p className="text-sm text-muted-foreground">{document.title}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!analysis ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-6">
                Click below to analyze this document with AI
              </p>
              <Button
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending}
                className="bg-[#C7A763] hover:bg-[#A88B4A]"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Document
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Executive Summary */}
              <GlowCard glowColor="gold" className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-[#C7A763]" />
                  Executive Summary
                </h3>
                <p className="text-sm text-muted-foreground">{analysis.executive_summary}</p>
              </GlowCard>

              {/* Key Insights */}
              {analysis.key_insights?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#00D4FF]" />
                    Key Insights ({analysis.key_insights.length})
                  </h3>
                  <div className="space-y-2">
                    {analysis.key_insights.map((insight, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-background/50 border border-border">
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-medium text-sm">{insight.title}</div>
                          <span className={`text-xs ${impactColors[insight.impact]}`}>
                            {insight.impact} impact
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{insight.description}</p>
                        <span className="text-xs text-[#C7A763] mt-1 inline-block">{insight.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risks */}
              {analysis.risks?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    Risks Identified ({analysis.risks.length})
                  </h3>
                  <div className="space-y-2">
                    {analysis.risks.map((risk, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-medium text-sm">{risk.title}</div>
                          <span className={`text-xs ${impactColors[risk.severity]}`}>
                            {risk.severity}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{risk.description}</p>
                        <div className="text-xs text-green-400">
                          <strong>Mitigation:</strong> {risk.mitigation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Opportunities */}
              {analysis.opportunities?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-green-400" />
                    Opportunities ({analysis.opportunities.length})
                  </h3>
                  <div className="space-y-2">
                    {analysis.opportunities.map((opp, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-medium text-sm">{opp.title}</div>
                          <span className="text-xs text-muted-foreground">{opp.timeline}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{opp.description}</p>
                        <span className={`text-xs ${impactColors[opp.potential]} mt-1 inline-block`}>
                          {opp.potential} potential
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested KPIs */}
              {analysis.suggested_kpis?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#C7A763]" />
                    Suggested KPIs ({analysis.suggested_kpis.length})
                  </h3>
                  <div className="space-y-2">
                    {analysis.suggested_kpis.map((kpi, idx) => {
                      const isSelected = selectedInsights.kpis.some(k => JSON.stringify(k) === JSON.stringify(kpi));
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected ? 'bg-[#C7A763]/10 border-[#C7A763]' : 'bg-background/50 border-border hover:border-[#C7A763]/50'
                          }`}
                          onClick={() => toggleSelection('kpis', idx)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm mb-1">{kpi.kpi_name}</div>
                              <div className="text-xs text-muted-foreground mb-2">
                                Current: {kpi.current_value} {kpi.unit} → Target: {kpi.target_value} {kpi.unit}
                              </div>
                              <p className="text-xs text-muted-foreground italic">{kpi.rationale}</p>
                            </div>
                            <Button
                              size="sm"
                              variant={isSelected ? 'default' : 'outline'}
                              className={isSelected ? 'bg-[#C7A763] hover:bg-[#A88B4A]' : ''}
                            >
                              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suggested Tasks */}
              {analysis.suggested_tasks?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-[#00D4FF]" />
                    Suggested Tasks ({analysis.suggested_tasks.length})
                  </h3>
                  <div className="space-y-2">
                    {analysis.suggested_tasks.map((task, idx) => {
                      const isSelected = selectedInsights.tasks.some(t => JSON.stringify(t) === JSON.stringify(task));
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected ? 'bg-[#00D4FF]/10 border-[#00D4FF]' : 'bg-background/50 border-border hover:border-[#00D4FF]/50'
                          }`}
                          onClick={() => toggleSelection('tasks', idx)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="font-medium text-sm">{task.title}</div>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                                  task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                  task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-green-500/20 text-green-400'
                                }`}>
                                  {task.priority}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">{task.description}</p>
                              <div className="text-xs text-muted-foreground">
                                Due: {new Date(task.estimated_due_date).toLocaleDateString()}
                              </div>
                              <p className="text-xs text-muted-foreground italic mt-1">{task.rationale}</p>
                            </div>
                            <Button
                              size="sm"
                              variant={isSelected ? 'default' : 'outline'}
                              className={isSelected ? 'bg-[#00D4FF] hover:bg-[#00B4DF]' : ''}
                            >
                              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {analysis && (
          <div className="p-6 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Selected: {selectedInsights.kpis.length} KPIs, {selectedInsights.tasks.length} tasks
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => applyInsightsMutation.mutate()}
                disabled={applyInsightsMutation.isPending || (selectedInsights.kpis.length === 0 && selectedInsights.tasks.length === 0)}
                className="bg-[#C7A763] hover:bg-[#A88B4A]"
              >
                {applyInsightsMutation.isPending ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Apply Selected Insights
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}