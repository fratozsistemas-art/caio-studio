import React from 'react';
import { Card } from "@/components/ui/card";
import { Users, TrendingUp, Clock, Target, CheckCircle2, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function TalentKPIDashboard({ talents }) {
  // Status distribution
  const statusData = [
    { name: 'Novo', value: talents.filter(t => t.status === 'new').length, color: '#3B82F6' },
    { name: 'Triagem', value: talents.filter(t => t.status === 'screening').length, color: '#8B5CF6' },
    { name: 'Entrevista', value: talents.filter(t => t.status === 'interviewing').length, color: '#F59E0B' },
    { name: 'Pré-selecionado', value: talents.filter(t => t.status === 'shortlisted').length, color: '#10B981' },
    { name: 'Contratado', value: talents.filter(t => t.status === 'hired').length, color: '#059669' },
    { name: 'Rejeitado', value: talents.filter(t => t.status === 'rejected').length, color: '#EF4444' },
  ].filter(s => s.value > 0);

  // Seniority distribution
  const seniorityData = [
    { name: 'Junior', value: talents.filter(t => t.seniority_level === 'junior').length },
    { name: 'Mid-level', value: talents.filter(t => t.seniority_level === 'mid').length },
    { name: 'Senior', value: talents.filter(t => t.seniority_level === 'senior').length },
    { name: 'Lead', value: talents.filter(t => t.seniority_level === 'lead').length },
    { name: 'Executive', value: talents.filter(t => t.seniority_level === 'executive').length },
  ].filter(s => s.value > 0);

  // Top skills
  const skillsCount = {};
  talents.forEach(talent => {
    if (talent.skills && Array.isArray(talent.skills)) {
      talent.skills.forEach(skill => {
        skillsCount[skill] = (skillsCount[skill] || 0) + 1;
      });
    }
  });
  const topSkills = Object.entries(skillsCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  // Source distribution
  const sourceData = [
    { name: 'LinkedIn', value: talents.filter(t => t.source === 'linkedin').length, color: '#0077B5' },
    { name: 'CV Upload', value: talents.filter(t => t.source === 'cv_upload').length, color: '#C7A763' },
    { name: 'Referral', value: talents.filter(t => t.source === 'referral').length, color: '#8B5CF6' },
    { name: 'Aplicação Direta', value: talents.filter(t => t.source === 'direct_application').length, color: '#10B981' },
    { name: 'Job Board', value: talents.filter(t => t.source === 'job_board').length, color: '#F59E0B' },
  ].filter(s => s.value > 0);

  // KPI Metrics
  const totalTalents = talents.length;
  const activeInPipeline = talents.filter(t => ['screening', 'interviewing', 'shortlisted'].includes(t.status)).length;
  const hireRate = totalTalents > 0 ? ((talents.filter(t => t.status === 'hired').length / totalTalents) * 100).toFixed(1) : 0;
  const avgRating = talents.filter(t => t.rating).length > 0 
    ? (talents.filter(t => t.rating).reduce((sum, t) => sum + t.rating, 0) / talents.filter(t => t.rating).length).toFixed(1)
    : 'N/A';

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#0a1628] to-[#0d1d35] border-white/10 p-5">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-[#00D4FF]" />
            <span className="text-xs text-slate-400">Total</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalTalents}</div>
          <div className="text-xs text-slate-400 mt-1">Talentos cadastrados</div>
        </Card>

        <Card className="bg-gradient-to-br from-[#0a1628] to-[#0d1d35] border-white/10 p-5">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-[#F59E0B]" />
            <span className="text-xs text-slate-400">Pipeline</span>
          </div>
          <div className="text-2xl font-bold text-white">{activeInPipeline}</div>
          <div className="text-xs text-slate-400 mt-1">Em processo ativo</div>
        </Card>

        <Card className="bg-gradient-to-br from-[#0a1628] to-[#0d1d35] border-white/10 p-5">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-[#10B981]" />
            <span className="text-xs text-slate-400">Taxa de Contratação</span>
          </div>
          <div className="text-2xl font-bold text-white">{hireRate}%</div>
          <div className="text-xs text-slate-400 mt-1">Conversão total</div>
        </Card>

        <Card className="bg-gradient-to-br from-[#0a1628] to-[#0d1d35] border-white/10 p-5">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-[#C7A763]" />
            <span className="text-xs text-slate-400">Avaliação Média</span>
          </div>
          <div className="text-2xl font-bold text-white">{avgRating}</div>
          <div className="text-xs text-slate-400 mt-1">Rating dos candidatos</div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="bg-[#0a1628] border-white/10 p-6">
          <h3 className="text-white font-semibold mb-4">Status do Pipeline</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a1628', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Source Distribution */}
        <Card className="bg-[#0a1628] border-white/10 p-6">
          <h3 className="text-white font-semibold mb-4">Fonte de Candidatos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a1628', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Seniority Level */}
        <Card className="bg-[#0a1628] border-white/10 p-6">
          <h3 className="text-white font-semibold mb-4">Distribuição por Senioridade</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={seniorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis 
                stroke="#94a3b8" 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a1628', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="value" fill="#C7A763" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Skills */}
        <Card className="bg-[#0a1628] border-white/10 p-6">
          <h3 className="text-white font-semibold mb-4">Top 10 Competências</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topSkills} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                type="number" 
                stroke="#94a3b8" 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#94a3b8" 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                width={120}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a1628', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="value" fill="#00D4FF" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}