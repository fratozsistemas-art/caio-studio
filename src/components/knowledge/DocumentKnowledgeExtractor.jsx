import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Sparkles, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import GlowCard from '@/components/ui/GlowCard';

export default function DocumentKnowledgeExtractor({ ventureId, onDataExtracted }) {
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'text'
  const [extractedData, setExtractedData] = useState(null);

  const extractMutation = useMutation({
    mutationFn: async () => {
      const prompt = `You are a venture data extraction specialist. Analyze the following document and extract structured data.

Document Content:
${documentText || 'URL: ' + documentUrl}

Extract and return a JSON object with the following structure:
{
  "kpis": [
    {
      "kpi_name": "string",
      "kpi_type": "revenue|users|growth|efficiency|custom",
      "current_value": number,
      "target_value": number,
      "unit": "string",
      "period": "monthly|quarterly|yearly",
      "notes": "string"
    }
  ],
  "projections": [
    {
      "projection_type": "financial|users|market_share|revenue|custom",
      "period": "string (e.g. Q1 2026, Year 1)",
      "projected_value": number,
      "unit": "string",
      "assumptions": ["string"],
      "confidence_level": "low|medium|high",
      "scenario": "pessimistic|realistic|optimistic"
    }
  ],
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "priority": "low|medium|high|urgent",
      "due_date": "YYYY-MM-DD",
      "assigned_to": "email@example.com (or leave empty)"
    }
  ],
  "insights": {
    "summary": "string - brief overview",
    "key_findings": ["string"],
    "recommendations": ["string"]
  }
}

Important:
- Extract ALL quantifiable metrics as KPIs
- Identify ALL timeline-based goals as projections
- Extract ALL action items as tasks
- Be thorough and detailed
- Only return valid JSON, nothing else`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            kpis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  kpi_name: { type: "string" },
                  kpi_type: { type: "string" },
                  current_value: { type: "number" },
                  target_value: { type: "number" },
                  unit: { type: "string" },
                  period: { type: "string" },
                  notes: { type: "string" }
                }
              }
            },
            projections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  projection_type: { type: "string" },
                  period: { type: "string" },
                  projected_value: { type: "number" },
                  unit: { type: "string" },
                  assumptions: { type: "array", items: { type: "string" } },
                  confidence_level: { type: "string" },
                  scenario: { type: "string" }
                }
              }
            },
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string" },
                  due_date: { type: "string" },
                  assigned_to: { type: "string" }
                }
              }
            },
            insights: {
              type: "object",
              properties: {
                summary: { type: "string" },
                key_findings: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setExtractedData(data);
      toast.success('Data extracted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to extract data: ' + error.message);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDocumentUrl(file_url);
      toast.success('File uploaded!');
    } catch (error) {
      toast.error('Failed to upload file: ' + error.message);
    }
  };

  const handleImport = async () => {
    if (!extractedData || !ventureId) return;

    try {
      const promises = [];

      // Import KPIs
      if (extractedData.kpis?.length > 0) {
        const kpis = extractedData.kpis.map(kpi => ({
          ...kpi,
          venture_id: ventureId,
          measurement_date: new Date().toISOString().split('T')[0]
        }));
        promises.push(base44.entities.VentureKPI.bulkCreate(kpis));
      }

      // Import Projections
      if (extractedData.projections?.length > 0) {
        const projections = extractedData.projections.map(proj => ({
          ...proj,
          venture_id: ventureId
        }));
        promises.push(base44.entities.VentureProjection.bulkCreate(projections));
      }

      // Import Tasks
      if (extractedData.tasks?.length > 0) {
        const user = await base44.auth.me();
        const tasks = extractedData.tasks.map(task => ({
          ...task,
          venture_id: ventureId,
          assigned_to: task.assigned_to || user.email,
          status: 'todo'
        }));
        promises.push(base44.entities.VentureTask.bulkCreate(tasks));
      }

      await Promise.all(promises);
      toast.success('All data imported successfully!');
      
      if (onDataExtracted) {
        onDataExtracted(extractedData);
      }
      
      setExtractedData(null);
      setDocumentUrl('');
      setDocumentText('');
    } catch (error) {
      toast.error('Failed to import data: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="mixed" className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-[#C7A763]" />
          <h3 className="text-xl font-semibold">AI Knowledge Extraction</h3>
        </div>

        <p className="text-muted-foreground mb-6">
          Upload a document or paste text to automatically extract KPIs, projections, and tasks using AI.
        </p>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={uploadMode === 'url' ? 'default' : 'outline'}
            onClick={() => setUploadMode('url')}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </Button>
          <Button
            variant={uploadMode === 'text' ? 'default' : 'outline'}
            onClick={() => setUploadMode('text')}
            className="flex-1"
          >
            <FileText className="w-4 h-4 mr-2" />
            Paste Text
          </Button>
        </div>

        {/* Upload Mode */}
        {uploadMode === 'url' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".txt,.md,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  TXT, MD, PDF, DOC, DOCX (max 10MB)
                </p>
              </label>
            </div>
            {documentUrl && (
              <div className="flex items-center gap-2 text-sm text-green-500">
                <CheckCircle className="w-4 h-4" />
                <span>File uploaded successfully</span>
              </div>
            )}
          </div>
        )}

        {/* Text Mode */}
        {uploadMode === 'text' && (
          <Textarea
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            placeholder="Paste your document content here (README, audit report, business plan, etc)..."
            className="min-h-[200px] font-mono text-sm"
          />
        )}

        {/* Extract Button */}
        <Button
          onClick={() => extractMutation.mutate()}
          disabled={extractMutation.isPending || (!documentUrl && !documentText)}
          className="w-full mt-4 bg-[#C7A763] hover:bg-[#A88B4A]"
        >
          {extractMutation.isPending ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              Extracting with AI...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Extract Data
            </>
          )}
        </Button>
      </GlowCard>

      {/* Extracted Data Preview */}
      {extractedData && (
        <GlowCard glowColor="cyan" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="text-xl font-semibold">Extracted Data</h3>
            </div>
            <Button onClick={handleImport} className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Import All
            </Button>
          </div>

          {/* Insights */}
          {extractedData.insights && (
            <div className="mb-6 p-4 bg-background/50 rounded-lg">
              <h4 className="font-semibold mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground mb-4">{extractedData.insights.summary}</p>
              
              {extractedData.insights.key_findings?.length > 0 && (
                <div className="mb-3">
                  <div className="font-medium text-sm mb-2">Key Findings:</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {extractedData.insights.key_findings.map((finding, i) => (
                      <li key={i}>• {finding}</li>
                    ))}
                  </ul>
                </div>
              )}

              {extractedData.insights.recommendations?.length > 0 && (
                <div>
                  <div className="font-medium text-sm mb-2">Recommendations:</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {extractedData.insights.recommendations.map((rec, i) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-[#C7A763]">{extractedData.kpis?.length || 0}</div>
              <div className="text-sm text-muted-foreground">KPIs</div>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-[#00D4FF]">{extractedData.projections?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Projections</div>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-green-500">{extractedData.tasks?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Tasks</div>
            </div>
          </div>

          {/* Preview */}
          <details className="cursor-pointer">
            <summary className="text-sm font-medium mb-2">View detailed preview</summary>
            <pre className="text-xs bg-background p-4 rounded-lg overflow-auto max-h-96 mt-2">
              {JSON.stringify(extractedData, null, 2)}
            </pre>
          </details>
        </GlowCard>
      )}
    </div>
  );
}