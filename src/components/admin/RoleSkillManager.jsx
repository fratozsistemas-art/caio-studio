import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Briefcase, Award, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';

const roleCategories = [
  { value: 'engineering', label: 'Engenharia' },
  { value: 'product', label: 'Produto' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Vendas' },
  { value: 'operations', label: 'Operações' },
  { value: 'finance', label: 'Financeiro' },
  { value: 'leadership', label: 'Liderança' },
  { value: 'other', label: 'Outros' }
];

const skillCategories = [
  { value: 'technical', label: 'Técnicas' },
  { value: 'business', label: 'Negócios' },
  { value: 'soft_skills', label: 'Soft Skills' },
  { value: 'languages', label: 'Idiomas' },
  { value: 'tools', label: 'Ferramentas' },
  { value: 'frameworks', label: 'Frameworks' },
  { value: 'other', label: 'Outras' }
];

const seniorities = [
  { value: 'junior', label: 'Júnior' },
  { value: 'mid', label: 'Pleno' },
  { value: 'senior', label: 'Sênior' },
  { value: 'lead', label: 'Lead' },
  { value: 'executive', label: 'Executivo' }
];

export default function RoleSkillManager() {
  const [activeTab, setActiveTab] = useState('roles');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  // Roles
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Role',
        operation: 'filter',
        query: {},
        sort: 'name'
      });
      return res.data?.data || [];
    }
  });

  // Skills
  const { data: skills = [] } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'Skill',
        operation: 'filter',
        query: {},
        sort: 'name'
      });
      return res.data?.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async ({ entity, data }) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: entity,
        operation: 'create',
        data
      });
    },
    onSuccess: (_, { entity }) => {
      queryClient.invalidateQueries([entity === 'Role' ? 'roles' : 'skills']);
      setShowDialog(false);
      setEditingItem(null);
      toast.success(`${entity === 'Role' ? 'Cargo' : 'Skill'} criado com sucesso`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ entity, id, data }) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: entity,
        operation: 'update',
        id,
        data
      });
    },
    onSuccess: (_, { entity }) => {
      queryClient.invalidateQueries([entity === 'Role' ? 'roles' : 'skills']);
      setShowDialog(false);
      setEditingItem(null);
      toast.success(`${entity === 'Role' ? 'Cargo' : 'Skill'} atualizado com sucesso`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ entity, id }) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: entity,
        operation: 'delete',
        id
      });
    },
    onSuccess: (_, { entity }) => {
      queryClient.invalidateQueries([entity === 'Role' ? 'roles' : 'skills']);
      toast.success(`${entity === 'Role' ? 'Cargo' : 'Skill'} removido com sucesso`);
    }
  });

  const handleSave = (entity) => {
    if (!editingItem?.name?.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (editingItem.id) {
      updateMutation.mutate({ entity, id: editingItem.id, data: editingItem });
    } else {
      createMutation.mutate({ entity, data: editingItem });
    }
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || role.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || skill.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gerenciar Cargos e Skills</h2>
          <p className="text-slate-400 mt-1">Mantenha a consistência dos dados no sistema</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="roles">
            <Briefcase className="w-4 h-4 mr-2" />
            Cargos ({roles.length})
          </TabsTrigger>
          <TabsTrigger value="skills">
            <Award className="w-4 h-4 mr-2" />
            Skills ({skills.length})
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {(activeTab === 'roles' ? roleCategories : skillCategories).map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingItem({ name: '', description: '', category: activeTab === 'roles' ? 'engineering' : 'technical', is_active: true });
                }}
                className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a1628] border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingItem?.id ? 'Editar' : 'Adicionar'} {activeTab === 'roles' ? 'Cargo' : 'Skill'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Nome *"
                  value={editingItem?.name || ''}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Textarea
                  placeholder="Descrição"
                  value={editingItem?.description || ''}
                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Select 
                  value={editingItem?.category} 
                  onValueChange={(v) => setEditingItem({...editingItem, category: v})}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(activeTab === 'roles' ? roleCategories : skillCategories).map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeTab === 'roles' && (
                  <Select 
                    value={editingItem?.seniority} 
                    onValueChange={(v) => setEditingItem({...editingItem, seniority: v})}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Senioridade (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {seniorities.map(sen => (
                        <SelectItem key={sen.value} value={sen.value}>{sen.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingItem?.is_active !== false}
                    onChange={(e) => setEditingItem({...editingItem, is_active: e.target.checked})}
                    className="rounded"
                  />
                  <label className="text-sm text-white">Ativo</label>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowDialog(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => handleSave(activeTab === 'roles' ? 'Role' : 'Skill')}
                    className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]"
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map((role) => (
              <motion.div key={role.id} layout>
                <GlowCard className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{role.name}</h3>
                      {role.description && (
                        <p className="text-sm text-slate-400 mt-1">{role.description}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-[#C7A763]/20 text-[#C7A763]">
                          {roleCategories.find(c => c.value === role.category)?.label}
                        </span>
                        {role.seniority && (
                          <span className="text-xs px-2 py-1 rounded-full bg-[#00D4FF]/20 text-[#00D4FF]">
                            {seniorities.find(s => s.value === role.seniority)?.label}
                          </span>
                        )}
                        {!role.is_active && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                            Inativo
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingItem(role);
                          setShowDialog(true);
                        }}
                        className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate({ entity: 'Role', id: role.id })}
                        className="p-1.5 rounded hover:bg-red-500/10 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
          {filteredRoles.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">Nenhum cargo encontrado</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((skill) => (
              <motion.div key={skill.id} layout>
                <GlowCard className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{skill.name}</h3>
                      {skill.description && (
                        <p className="text-sm text-slate-400 mt-1">{skill.description}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-[#C7A763]/20 text-[#C7A763]">
                          {skillCategories.find(c => c.value === skill.category)?.label}
                        </span>
                        {!skill.is_active && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                            Inativo
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingItem(skill);
                          setShowDialog(true);
                        }}
                        className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate({ entity: 'Skill', id: skill.id })}
                        className="p-1.5 rounded hover:bg-red-500/10 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
          {filteredSkills.length === 0 && (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">Nenhuma skill encontrada</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}