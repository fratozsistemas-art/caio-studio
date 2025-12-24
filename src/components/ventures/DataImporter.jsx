import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import GlowCard from "@/components/ui/GlowCard";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function DataImporter({ ventureId, onImportComplete }) {
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [importMode, setImportMode] = useState('file'); // 'file' or 'api'

  const handleFileImport = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo');
      return;
    }

    setImporting(true);
    try {
      // Upload file
      const uploadResult = await base44.integrations.Core.UploadFile({
        file: selectedFile
      });

      // Extract data from file
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadResult.file_url,
        json_schema: {
          type: "object",
          properties: {
            records: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  revenue: { type: "number" },
                  expenses: { type: "number" },
                  cash_balance: { type: "number" }
                }
              }
            }
          }
        }
      });

      if (extractResult.status === 'success' && extractResult.output?.records) {
        // Import financial records
        const records = extractResult.output.records.map(record => ({
          venture_id: ventureId,
          record_date: record.date,
          revenue: record.revenue || 0,
          expenses: record.expenses || 0,
          cash_balance: record.cash_balance || 0,
          period_type: 'monthly'
        }));

        // Bulk create records
        for (const record of records) {
          await base44.functions.invoke('secureEntityQuery', {
            entity_name: 'FinancialRecord',
            operation: 'create',
            data: record
          });
        }

        toast.success(`${records.length} registros financeiros importados com sucesso!`);
        setSelectedFile(null);
        if (onImportComplete) onImportComplete();
      } else {
        toast.error('Erro ao extrair dados: ' + extractResult.details);
      }
    } catch (error) {
      toast.error('Erro ao importar: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleApiImport = async () => {
    if (!apiUrl) {
      toast.error('Insira a URL da API');
      return;
    }

    setImporting(true);
    try {
      // Use LLM to fetch and structure data from API
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Faça uma requisição para a seguinte API e extraia dados financeiros estruturados:
        
URL: ${apiUrl}
${apiKey ? `API Key: ${apiKey}` : ''}

Extraia os seguintes campos de cada registro:
- data (formato YYYY-MM-DD)
- receita (número)
- despesas (número)  
- saldo de caixa (número)

Retorne uma lista de registros estruturados.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            records: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  revenue: { type: "number" },
                  expenses: { type: "number" },
                  cash_balance: { type: "number" }
                }
              }
            }
          }
        }
      });

      if (response.records && response.records.length > 0) {
        // Import records
        const records = response.records.map(record => ({
          venture_id: ventureId,
          record_date: record.date,
          revenue: record.revenue || 0,
          expenses: record.expenses || 0,
          cash_balance: record.cash_balance || 0,
          period_type: 'monthly'
        }));

        for (const record of records) {
          await base44.functions.invoke('secureEntityQuery', {
            entity_name: 'FinancialRecord',
            operation: 'create',
            data: record
          });
        }

        toast.success(`${records.length} registros importados da API!`);
        setApiUrl('');
        setApiKey('');
        if (onImportComplete) onImportComplete();
      } else {
        toast.error('Nenhum dado encontrado na API');
      }
    } catch (error) {
      toast.error('Erro ao importar da API: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <GlowCard glowColor="cyan" className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="w-5 h-5 text-[#00D4FF]" />
        <h3 className="text-xl font-bold text-white">Importar Dados Financeiros</h3>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setImportMode('file')}
          className={`p-4 rounded-xl border transition-all ${
            importMode === 'file'
              ? 'border-[#00D4FF] bg-[#00D4FF]/10'
              : 'border-white/10 bg-white/5 hover:bg-white/10'
          }`}
        >
          <FileSpreadsheet className={`w-6 h-6 mx-auto mb-2 ${
            importMode === 'file' ? 'text-[#00D4FF]' : 'text-white/50'
          }`} />
          <span className={`text-sm ${
            importMode === 'file' ? 'text-[#00D4FF]' : 'text-white/70'
          }`}>
            Planilha (CSV/Excel)
          </span>
        </button>
        
        <button
          onClick={() => setImportMode('api')}
          className={`p-4 rounded-xl border transition-all ${
            importMode === 'api'
              ? 'border-[#C7A763] bg-[#C7A763]/10'
              : 'border-white/10 bg-white/5 hover:bg-white/10'
          }`}
        >
          <Upload className={`w-6 h-6 mx-auto mb-2 ${
            importMode === 'api' ? 'text-[#C7A763]' : 'text-white/50'
          }`} />
          <span className={`text-sm ${
            importMode === 'api' ? 'text-[#C7A763]' : 'text-white/70'
          }`}>
            API Externa
          </span>
        </button>
      </div>

      {/* File Import */}
      {importMode === 'file' && (
        <div className="space-y-4">
          <div>
            <Label className="text-white/70 mb-2 block">Selecionar Arquivo</Label>
            <label className="block">
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                accept=".csv,.xlsx,.xls"
                className="hidden"
              />
              <div className="p-6 border-2 border-dashed border-white/20 rounded-xl hover:border-[#00D4FF]/50 transition-colors cursor-pointer text-center bg-white/5">
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2 text-[#00D4FF]">
                    <Check className="w-6 h-6" />
                    <span className="text-sm">{selectedFile.name}</span>
                    <span className="text-xs text-white/50">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                ) : (
                  <div className="text-white/50">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Clique para selecionar planilha</p>
                    <p className="text-xs mt-1">CSV, XLS, XLSX</p>
                  </div>
                )}
              </div>
            </label>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-300">
                <p className="font-medium mb-1">Formato esperado:</p>
                <p>Colunas: data, receita, despesas, saldo_caixa</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleFileImport}
            disabled={importing || !selectedFile}
            className="w-full bg-gradient-to-r from-[#00D4FF] to-[#0099CC] hover:from-[#00E5FF] hover:to-[#00A3DD] text-white"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Importar Planilha
              </>
            )}
          </Button>
        </div>
      )}

      {/* API Import */}
      {importMode === 'api' && (
        <div className="space-y-4">
          <div>
            <Label className="text-white/70 mb-2 block">URL da API</Label>
            <Input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.exemplo.com/financeiro"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <Label className="text-white/70 mb-2 block">API Key (opcional)</Label>
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              type="password"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-300">
                <p>A IA irá buscar e estruturar automaticamente os dados financeiros da API fornecida.</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleApiImport}
            disabled={importing || !apiUrl}
            className="w-full bg-gradient-to-r from-[#C7A763] to-[#A88B4A] hover:from-[#D4B474] hover:to-[#B99B5A] text-[#06101F]"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Importar da API
              </>
            )}
          </Button>
        </div>
      )}
    </GlowCard>
  );
}