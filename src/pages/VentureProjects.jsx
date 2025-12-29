import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GlowCard from '@/components/ui/GlowCard';
import SectionTitle from '@/components/ui/SectionTitle';
import ProjectOverview from '@/components/projects/ProjectOverview';
import ProjectNotes from '@/components/projects/ProjectNotes';
import ProjectAnalyticsDashboard from '@/components/projects/ProjectAnalyticsDashboard';
import ProjectTrendAnalysis from '@/components/projects/ProjectTrendAnalysis';
import ProjectReportGenerator from '@/components/projects/ProjectReportGenerator';
import { FolderKanban, Plus, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function VentureProjects() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVenture, setSelectedVenture] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'planning',
    clickup_list_ids: []
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.role !== 'admin') {
          base44.auth.redirectToLogin(window.location.pathname);
          return;
        }
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(window.location.pathname);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch ventures
  const { data: ventures } = useQuery({
    queryKey: ['ventures'],
    queryFn: () => base44.entities.Venture.list(),
    enabled: !!user
  });

  // Fetch projects for selected venture
  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ['venture-projects', selectedVenture],
    queryFn: () => base44.entities.VentureProject.filter({ venture_id: selectedVenture }),
    enabled: !!selectedVenture
  });

  // Create project
  const createProjectMutation = useMutation({
    mutationFn: async (projectData) => {
      return await base44.entities.VentureProject.create({
        ...projectData,
        venture_id: selectedVenture
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venture-projects'] });
      setDialogOpen(false);
      setNewProject({ name: '', description: '', status: 'planning', clickup_list_ids: [] });
      toast.success('Project created');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C7A763]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('AdminHub')}>
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <SectionTitle
            subtitle="Project Management"
            title="Venture Projects"
            accent="cyan"
            align="left"
            className="mb-8"
          />

          {/* Venture Selection */}
          <GlowCard glowColor="gold" className="p-6 mb-8">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Select Venture</label>
                <Select value={selectedVenture} onValueChange={setSelectedVenture}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Choose a venture" />
                  </SelectTrigger>
                  <SelectContent>
                    {ventures?.map((venture) => (
                      <SelectItem key={venture.id} value={venture.id}>
                        {venture.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedVenture && (
                <div className="flex items-end">
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]">
                        <Plus className="w-4 h-4 mr-2" />
                        New Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0a1628] border-white/10 max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-white">Create New Project</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="text-sm text-slate-400 mb-2 block">Project Name</label>
                          <Input
                            value={newProject.name}
                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                            placeholder="e.g., Q1 2025 Launch"
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-slate-400 mb-2 block">Description</label>
                          <Textarea
                            value={newProject.description}
                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                            placeholder="Describe the project"
                            className="bg-white/5 border-white/10 text-white"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-slate-400 mb-2 block">Status</label>
                          <Select
                            value={newProject.status}
                            onValueChange={(val) => setNewProject({ ...newProject, status: val })}
                          >
                            <SelectTrigger className="bg-white/5 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="planning">Planning</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="on_hold">On Hold</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={() => createProjectMutation.mutate(newProject)}
                          disabled={!newProject.name || createProjectMutation.isPending}
                          className="w-full bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]"
                        >
                          Create Project
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </GlowCard>

          {/* Analytics Dashboard for Selected Venture */}
          {selectedVenture && !selectedProject && (
            <GlowCard glowColor="mixed" className="p-8 mb-8">
              <Tabs defaultValue="dashboard" className="space-y-6">
                <TabsList className="bg-white/5 border border-white/10">
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard">
                  <ProjectAnalyticsDashboard ventureId={selectedVenture} />
                </TabsContent>

                <TabsContent value="trends">
                  <ProjectTrendAnalysis ventureId={selectedVenture} />
                </TabsContent>

                <TabsContent value="reports">
                  <ProjectReportGenerator ventureId={selectedVenture} />
                </TabsContent>
              </Tabs>
            </GlowCard>
          )}

          {/* Projects List & Details */}
          {selectedVenture && (
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Projects Sidebar */}
              <div className="lg:col-span-1">
                <GlowCard glowColor="cyan" className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FolderKanban className="w-5 h-5" />
                    Projects
                  </h3>
                  {loadingProjects ? (
                    <div className="text-center py-4 text-slate-400">Loading...</div>
                  ) : projects?.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-sm">
                      No projects yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => setSelectedProject(project)}
                          className={`w-full text-left p-3 rounded-lg transition-all ${
                            selectedProject?.id === project.id
                              ? 'bg-[#C7A763]/20 border border-[#C7A763]/30'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-white font-medium text-sm">{project.name}</div>
                          <div className="text-xs text-slate-400 mt-1">{project.status}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </GlowCard>
              </div>

              {/* Project Details */}
              <div className="lg:col-span-3">
                {selectedProject ? (
                  <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="bg-white/5 border border-white/10">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="notes">Notes & Docs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                      <ProjectOverview project={selectedProject} />
                    </TabsContent>

                    <TabsContent value="notes">
                      <ProjectNotes projectId={selectedProject.id} />
                    </TabsContent>
                  </Tabs>
                ) : (
                  <GlowCard glowColor="gold" className="p-12 text-center">
                    <FolderKanban className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">Select a project to view details</p>
                  </GlowCard>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}