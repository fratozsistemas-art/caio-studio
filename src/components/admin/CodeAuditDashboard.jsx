import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, FileCode, Github, FileArchive, AlertTriangle, CheckCircle, AlertCircle, Info, Loader2, Upload, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';

const severityConfig = {
  critical: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'CRÍTICO' },
  high: { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'ALTO' },
  medium: { icon: Info, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'MÉDIO' },
  low: { icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'BAIXO' }
};

export default function CodeAuditDashboard() {
  const [sourceType, setSourceType] = useState('local'); // local, github, zip
  const [localFilePath, setLocalFilePath] = useState('');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [githubFilePath, setGithubFilePath] = useState('');
  const [zipUrl, setZipUrl] = useState('');
  const [zipTargetPath, setZipTargetPath] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [auditResults, setAuditResults] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAuditResults(null);

    try {
      let conversation;
      if (!conversationId) {
        conversation = await base44.agents.createConversation({
          agent_name: 'code_auditor',
          metadata: { name: 'Code Audit Session', source: sourceType }
        });
        setConversationId(conversation.id);
      } else {
        conversation = await base44.agents.getConversation(conversationId);
      }

      let prompt = '';
      if (sourceType === 'local') {
        prompt = `Analise o arquivo local: ${localFilePath}

Realize uma auditoria completa de segurança (OWASP Top 10), performance e qualidade de código.

Estruture a resposta em JSON com:
{
  "summary": "Resumo executivo da análise",
  "security": [{ "severity": "critical|high|medium|low", "issue": "descrição", "line": número, "recommendation": "solução" }],
  "performance": [{ "severity": "...", "issue": "...", "recommendation": "..." }],
  "quality": [{ "severity": "...", "issue": "...", "recommendation": "..." }],
  "score": { "security": 0-100, "performance": 0-100, "quality": 0-100 }
}`;
      } else if (sourceType === 'github') {
        prompt = `Analise o repositório GitHub: ${githubRepoUrl}
Arquivo: ${githubFilePath || 'todos os arquivos principais'}

Realize uma auditoria completa de segurança (OWASP Top 10), performance e qualidade de código.

Estruture a resposta em JSON com:
{
  "summary": "Resumo executivo da análise",
  "security": [{ "severity": "critical|high|medium|low", "issue": "descrição", "line": número, "recommendation": "solução" }],
  "performance": [{ "severity": "...", "issue": "...", "recommendation": "..." }],
  "quality": [{ "severity": "...", "issue": "...", "recommendation": "..." }],
  "score": { "security": 0-100, "performance": 0-100, "quality": 0-100 }
}`;
      } else {
        prompt = `Analise o arquivo ZIP: ${zipUrl}
${zipTargetPath ? `Arquivo específico: ${zipTargetPath}` : 'Todos os arquivos de código'}

Realize uma auditoria completa de segurança (OWASP Top 10), performance e qualidade de código.

Estruture a resposta em JSON com:
{
  "summary": "Resumo executivo da análise",
  "security": [{ "severity": "critical|high|medium|low", "issue": "descrição", "line": número, "recommendation": "solução" }],
  "performance": [{ "severity": "...", "issue": "...", "recommendation": "..." }],
  "quality": [{ "severity": "...", "issue": "...", "recommendation": "..." }],
  "score": { "security": 0-100, "performance": 0-100, "quality": 0-100 }
}`;
      }

      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: prompt
      });

      // Wait for response
      let attempts = 0;
      const maxAttempts = 60;
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const updated = await base44.agents.getConversation(conversationId || conversation.id);
        const lastMessage = updated.messages[updated.messages.length - 1];
        
        if (lastMessage.role === 'assistant' && lastMessage.content) {
          try {
            const jsonMatch = lastMessage.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const results = JSON.parse(jsonMatch[0]);
              setAuditResults(results);
              toast.success('Análise concluída!');
              break;
            }
          } catch (e) {
            // Still processing
          }
        }
        attempts++;
      }

      if (!auditResults) {
        toast.error('Timeout na análise. Tente novamente.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao executar análise: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const renderIssues = (issues, category) => {
    if (!issues || issues.length === 0) {
      return (
        <div className="text-center py-8 text-slate-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum problema encontrado em {category}</p>
        </div>
      );
    }

    const grouped = issues.reduce((acc, issue) => {
      acc[issue.severity] = acc[issue.severity] || [];
      acc[issue.severity].push(issue);
      return acc;
    }, {});

    return (
      <div className="space-y-4">
        {Object.entries(grouped).map(([severity, items]) => {
          const config = severityConfig[severity] || severityConfig.medium;
          const Icon = config.icon;

          return (
            <div key={severity}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <span className={`font-semibold ${config.color}`}>
                  {config.label} ({items.length})
                </span>
              </div>
              <div className="space-y-2">
                {items.map((issue, idx) => (
                  <GlowCard key={idx} className={`p-4 ${config.bg} border ${config.border}`}>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white font-medium">{issue.issue}</p>
                        {issue.line && (
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            Linha {issue.line}
                          </span>
                        )}
                      </div>
                      {issue.recommendation && (
                        <div className="bg-black/20 rounded-lg p-3">
                          <div className="text-xs text-slate-400 mb-1">Recomendação:</div>
                          <p className="text-sm text-slate-300">{issue.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </GlowCard>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C7A763]/20 to-[#00D4FF]/20 border border-white/10 flex items-center justify-center">
          <Shield className="w-6 h-6 text-[#C7A763]" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Code Auditor</h3>
          <p className="text-sm text-slate-400">Análise de Segurança, Performance e Qualidade</p>
        </div>
      </div>

      {/* Source Selection */}
      <GlowCard glowColor="mixed" className="p-6">
        <Tabs value={sourceType} onValueChange={setSourceType}>
          <TabsList className="bg-white/5 border border-white/10 w-full">
            <TabsTrigger value="local" className="flex-1">
              <FileCode className="w-4 h-4 mr-2" />
              App Local
            </TabsTrigger>
            <TabsTrigger value="github" className="flex-1">
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </TabsTrigger>
            <TabsTrigger value="zip" className="flex-1">
              <FileArchive className="w-4 h-4 mr-2" />
              ZIP Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="local" className="space-y-4 mt-4">
            <Input
              placeholder="Caminho do arquivo (ex: pages/Home.js)"
              value={localFilePath}
              onChange={(e) => setLocalFilePath(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <div className="text-xs text-slate-400">
              Diretórios permitidos: pages/, components/, functions/, entities/, Layout.js
            </div>
          </TabsContent>

          <TabsContent value="github" className="space-y-4 mt-4">
            <Input
              placeholder="URL do repositório (ex: https://github.com/owner/repo)"
              value={githubRepoUrl}
              onChange={(e) => setGithubRepoUrl(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              placeholder="Arquivo específico (opcional)"
              value={githubFilePath}
              onChange={(e) => setGithubFilePath(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </TabsContent>

          <TabsContent value="zip" className="space-y-4 mt-4">
            <Input
              placeholder="URL do arquivo ZIP"
              value={zipUrl}
              onChange={(e) => setZipUrl(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              placeholder="Arquivo específico no ZIP (opcional)"
              value={zipTargetPath}
              onChange={(e) => setZipTargetPath(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleAnalyze}
          disabled={analyzing || (!localFilePath && !githubRepoUrl && !zipUrl)}
          className="w-full mt-4 bg-gradient-to-r from-[#C7A763] to-[#00D4FF] hover:from-[#A88B4A] hover:to-[#00B8E0]"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Iniciar Auditoria
            </>
          )}
        </Button>
      </GlowCard>

      {/* Results */}
      <AnimatePresence>
        {auditResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Summary */}
            <GlowCard glowColor="gold" className="p-6">
              <h4 className="text-white font-semibold mb-3">Resumo Executivo</h4>
              <p className="text-slate-300">{auditResults.summary}</p>
            </GlowCard>

            {/* Scores */}
            {auditResults.score && (
              <div className="grid md:grid-cols-3 gap-4">
                <GlowCard glowColor="cyan" className="p-5">
                  <div className="text-xs text-slate-400 mb-1">Score de Segurança</div>
                  <div className="text-3xl font-bold text-white">
                    {auditResults.score.security}/100
                  </div>
                </GlowCard>
                <GlowCard glowColor="gold" className="p-5">
                  <div className="text-xs text-slate-400 mb-1">Score de Performance</div>
                  <div className="text-3xl font-bold text-white">
                    {auditResults.score.performance}/100
                  </div>
                </GlowCard>
                <GlowCard glowColor="mixed" className="p-5">
                  <div className="text-xs text-slate-400 mb-1">Score de Qualidade</div>
                  <div className="text-3xl font-bold text-white">
                    {auditResults.score.quality}/100
                  </div>
                </GlowCard>
              </div>
            )}

            {/* Issues by Category */}
            <Tabs defaultValue="security">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="security">
                  Segurança ({auditResults.security?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="performance">
                  Performance ({auditResults.performance?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="quality">
                  Qualidade ({auditResults.quality?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="security" className="mt-4">
                {renderIssues(auditResults.security, 'segurança')}
              </TabsContent>

              <TabsContent value="performance" className="mt-4">
                {renderIssues(auditResults.performance, 'performance')}
              </TabsContent>

              <TabsContent value="quality" className="mt-4">
                {renderIssues(auditResults.quality, 'qualidade de código')}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}