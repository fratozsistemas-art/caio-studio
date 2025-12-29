import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlowCard from '@/components/ui/GlowCard';
import { FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

export default function ProjectReportGenerator({ ventureId }) {
  const [reportConfig, setReportConfig] = useState({
    format: 'pdf',
    includeMetrics: true,
    includeProjects: true,
    includeTasks: true,
    includeBottlenecks: true,
    includeTrends: false,
    timeRange: 'all'
  });
  const [generating, setGenerating] = useState(false);

  // Fetch data
  const { data: projects } = useQuery({
    queryKey: ['venture-projects', ventureId],
    queryFn: () => base44.entities.VentureProject.filter({ venture_id: ventureId }),
    enabled: !!ventureId
  });

  const { data: allProjectTasks } = useQuery({
    queryKey: ['all-project-tasks', ventureId],
    queryFn: async () => {
      if (!projects || projects.length === 0) return [];
      
      const allListIds = projects.flatMap(p => p.clickup_list_ids || []);
      if (allListIds.length === 0) return [];

      const taskPromises = allListIds.map(listId =>
        base44.functions.invoke('clickup', { action: 'getTasks', listId })
      );

      const results = await Promise.all(taskPromises);
      return results.flatMap(r => r.data.tasks || []);
    },
    enabled: !!projects?.length
  });

  const generatePDFReport = () => {
    setGenerating(true);
    
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Title
      doc.setFontSize(20);
      doc.text('Project Analytics Report', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, yPos);
      yPos += 15;

      // Metrics
      if (reportConfig.includeMetrics) {
        doc.setFontSize(16);
        doc.text('Key Metrics', 20, yPos);
        yPos += 10;

        const totalProjects = projects?.length || 0;
        const totalTasks = allProjectTasks?.length || 0;
        const completedTasks = allProjectTasks?.filter(t => 
          t.status?.status?.toLowerCase().includes('complete')
        ).length || 0;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        doc.setFontSize(10);
        doc.text(`Total Projects: ${totalProjects}`, 30, yPos);
        yPos += 7;
        doc.text(`Total Tasks: ${totalTasks}`, 30, yPos);
        yPos += 7;
        doc.text(`Completed Tasks: ${completedTasks}`, 30, yPos);
        yPos += 7;
        doc.text(`Completion Rate: ${completionRate}%`, 30, yPos);
        yPos += 15;
      }

      // Projects
      if (reportConfig.includeProjects && projects) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(16);
        doc.text('Projects Overview', 20, yPos);
        yPos += 10;

        projects.forEach(project => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(12);
          doc.text(`• ${project.name}`, 30, yPos);
          yPos += 6;
          doc.setFontSize(9);
          doc.text(`  Status: ${project.status}`, 35, yPos);
          yPos += 5;
          if (project.description) {
            const desc = project.description.substring(0, 80);
            doc.text(`  ${desc}${project.description.length > 80 ? '...' : ''}`, 35, yPos);
            yPos += 7;
          }
          yPos += 3;
        });
        yPos += 10;
      }

      // Tasks Summary
      if (reportConfig.includeTasks && allProjectTasks) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(16);
        doc.text('Tasks Summary', 20, yPos);
        yPos += 10;

        const tasksByStatus = {};
        allProjectTasks.forEach(task => {
          const status = task.status?.status || 'Unknown';
          tasksByStatus[status] = (tasksByStatus[status] || 0) + 1;
        });

        doc.setFontSize(10);
        Object.entries(tasksByStatus).forEach(([status, count]) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${status}: ${count} tasks`, 30, yPos);
          yPos += 7;
        });
        yPos += 10;
      }

      // Bottlenecks
      if (reportConfig.includeBottlenecks && allProjectTasks) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(16);
        doc.text('Bottlenecks & Risks', 20, yPos);
        yPos += 10;

        const bottlenecks = allProjectTasks.filter(t => {
          const isHighPriority = t.priority?.priority === 1 || t.priority?.priority === 2;
          const isOverdue = t.due_date && Date.now() > parseInt(t.due_date);
          return isHighPriority && isOverdue;
        });

        doc.setFontSize(10);
        doc.text(`High-priority overdue tasks: ${bottlenecks.length}`, 30, yPos);
        yPos += 10;

        bottlenecks.slice(0, 10).forEach(task => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          const taskName = task.name.substring(0, 60);
          doc.setFontSize(9);
          doc.text(`• ${taskName}${task.name.length > 60 ? '...' : ''}`, 35, yPos);
          yPos += 6;
        });
      }

      // Save
      doc.save(`project-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const generateCSVReport = () => {
    setGenerating(true);

    try {
      let csv = 'Project Name,Status,Total Tasks,Completed Tasks,In Progress,Overdue\n';

      projects?.forEach(project => {
        const projectListIds = project.clickup_list_ids || [];
        const projectTasks = allProjectTasks?.filter(task => 
          projectListIds.some(listId => task.list?.id === listId)
        ) || [];

        const completed = projectTasks.filter(t => 
          t.status?.status?.toLowerCase().includes('complete')
        ).length;
        const inProgress = projectTasks.filter(t => 
          t.status?.status?.toLowerCase().includes('progress')
        ).length;
        const overdue = projectTasks.filter(t => 
          t.due_date && Date.now() > parseInt(t.due_date)
        ).length;

        csv += `"${project.name}","${project.status}",${projectTasks.length},${completed},${inProgress},${overdue}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success('CSV report generated');
    } catch (error) {
      toast.error('Failed to generate CSV');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = () => {
    if (reportConfig.format === 'pdf') {
      generatePDFReport();
    } else {
      generateCSVReport();
    }
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="gold" className="p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#C7A763]" />
          Report Configuration
        </h3>

        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Export Format</label>
            <Select
              value={reportConfig.format}
              onValueChange={(val) => setReportConfig({ ...reportConfig, format: val })}
            >
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="csv">CSV Spreadsheet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Include Sections */}
          <div>
            <label className="text-sm text-slate-400 mb-3 block">Include in Report</label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="metrics"
                  checked={reportConfig.includeMetrics}
                  onCheckedChange={(checked) => 
                    setReportConfig({ ...reportConfig, includeMetrics: checked })
                  }
                />
                <label htmlFor="metrics" className="text-sm text-white cursor-pointer">
                  Key Metrics & Statistics
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="projects"
                  checked={reportConfig.includeProjects}
                  onCheckedChange={(checked) => 
                    setReportConfig({ ...reportConfig, includeProjects: checked })
                  }
                />
                <label htmlFor="projects" className="text-sm text-white cursor-pointer">
                  Projects Overview
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="tasks"
                  checked={reportConfig.includeTasks}
                  onCheckedChange={(checked) => 
                    setReportConfig({ ...reportConfig, includeTasks: checked })
                  }
                />
                <label htmlFor="tasks" className="text-sm text-white cursor-pointer">
                  Tasks Summary
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="bottlenecks"
                  checked={reportConfig.includeBottlenecks}
                  onCheckedChange={(checked) => 
                    setReportConfig({ ...reportConfig, includeBottlenecks: checked })
                  }
                />
                <label htmlFor="bottlenecks" className="text-sm text-white cursor-pointer">
                  Bottlenecks & Risks
                </label>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !projects?.length}
            className="w-full bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </GlowCard>
    </div>
  );
}