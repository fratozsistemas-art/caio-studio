import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import GlowCard from '@/components/ui/GlowCard';
import { Zap, Plus, Trash2, Edit, PlayCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AutomationRuleManager({ selectedList }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    trigger_type: 'task_completed',
    trigger_conditions: {},
    action_type: 'send_notification',
    action_config: {},
    list_id: selectedList,
    active: true
  });

  // Fetch automations
  const { data: automations, isLoading } = useQuery({
    queryKey: ['clickup-automations', selectedList],
    queryFn: async () => {
      const rules = await base44.entities.ClickUpAutomation.filter({
        list_id: selectedList
      });
      return rules;
    },
    enabled: !!selectedList
  });

  // Create/Update automation
  const saveAutomationMutation = useMutation({
    mutationFn: async (ruleData) => {
      if (editingRule) {
        return await base44.entities.ClickUpAutomation.update(editingRule.id, ruleData);
      } else {
        return await base44.entities.ClickUpAutomation.create(ruleData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clickup-automations'] });
      setDialogOpen(false);
      setEditingRule(null);
      setNewRule({
        name: '',
        description: '',
        trigger_type: 'task_completed',
        trigger_conditions: {},
        action_type: 'send_notification',
        action_config: {},
        list_id: selectedList,
        active: true
      });
      toast.success(editingRule ? 'Automation updated' : 'Automation created');
    }
  });

  // Delete automation
  const deleteAutomationMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.ClickUpAutomation.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clickup-automations'] });
      toast.success('Automation deleted');
    }
  });

  // Toggle automation
  const toggleAutomationMutation = useMutation({
    mutationFn: async ({ id, active }) => {
      return await base44.entities.ClickUpAutomation.update(id, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clickup-automations'] });
    }
  });

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setNewRule(rule);
    setDialogOpen(true);
  };

  const handleSave = () => {
    saveAutomationMutation.mutate(newRule);
  };

  const getTriggerLabel = (type) => {
    const labels = {
      task_created: 'Task Created',
      task_completed: 'Task Completed',
      task_status_changed: 'Status Changed',
      task_assigned: 'Task Assigned',
      task_priority_changed: 'Priority Changed'
    };
    return labels[type] || type;
  };

  const getActionLabel = (type) => {
    const labels = {
      create_task: 'Create Task',
      send_notification: 'Send Notification',
      update_task: 'Update Task',
      assign_task: 'Assign Task',
      send_email: 'Send Email'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#C7A763]" />
          <h3 className="text-lg font-semibold text-white">Automation Rules</h3>
          <Badge variant="outline" className="bg-[#C7A763]/10 text-[#C7A763]">
            {automations?.length || 0}
          </Badge>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]">
              <Plus className="w-4 h-4 mr-2" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0a1628] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Rule Name</label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g., Create follow-up on completion"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">Description</label>
                <Textarea
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="Describe what this automation does"
                  className="bg-white/5 border-white/10 text-white"
                  rows={2}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Trigger (When)</label>
                  <Select
                    value={newRule.trigger_type}
                    onValueChange={(val) => setNewRule({ ...newRule, trigger_type: val })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task_created">Task Created</SelectItem>
                      <SelectItem value="task_completed">Task Completed</SelectItem>
                      <SelectItem value="task_status_changed">Status Changed</SelectItem>
                      <SelectItem value="task_assigned">Task Assigned</SelectItem>
                      <SelectItem value="task_priority_changed">Priority Changed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Action (Then)</label>
                  <Select
                    value={newRule.action_type}
                    onValueChange={(val) => setNewRule({ ...newRule, action_type: val })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="create_task">Create Task</SelectItem>
                      <SelectItem value="send_notification">Send Notification</SelectItem>
                      <SelectItem value="send_email">Send Email</SelectItem>
                      <SelectItem value="update_task">Update Task</SelectItem>
                      <SelectItem value="assign_task">Assign Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Configuration */}
              <div className="border border-white/10 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-white">Action Configuration</h4>
                
                {newRule.action_type === 'create_task' && (
                  <>
                    <Input
                      placeholder="Task name (use {{task_name}} for original task name)"
                      value={newRule.action_config?.task_name || ''}
                      onChange={(e) => setNewRule({
                        ...newRule,
                        action_config: { ...newRule.action_config, task_name: e.target.value }
                      })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <Textarea
                      placeholder="Task description (use {{task_url}} for link)"
                      value={newRule.action_config?.task_description || ''}
                      onChange={(e) => setNewRule({
                        ...newRule,
                        action_config: { ...newRule.action_config, task_description: e.target.value }
                      })}
                      className="bg-white/5 border-white/10 text-white"
                      rows={2}
                    />
                  </>
                )}

                {newRule.action_type === 'send_notification' && (
                  <>
                    <Input
                      placeholder="User email"
                      value={newRule.action_config?.user_email || ''}
                      onChange={(e) => setNewRule({
                        ...newRule,
                        action_config: { ...newRule.action_config, user_email: e.target.value }
                      })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <Input
                      placeholder="Notification title"
                      value={newRule.action_config?.title || ''}
                      onChange={(e) => setNewRule({
                        ...newRule,
                        action_config: { ...newRule.action_config, title: e.target.value }
                      })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <Textarea
                      placeholder="Message (use {{task_name}}, {{task_status}})"
                      value={newRule.action_config?.message || ''}
                      onChange={(e) => setNewRule({
                        ...newRule,
                        action_config: { ...newRule.action_config, message: e.target.value }
                      })}
                      className="bg-white/5 border-white/10 text-white"
                      rows={2}
                    />
                  </>
                )}

                {newRule.action_type === 'send_email' && (
                  <>
                    <Input
                      placeholder="Recipient email"
                      value={newRule.action_config?.recipient_email || ''}
                      onChange={(e) => setNewRule({
                        ...newRule,
                        action_config: { ...newRule.action_config, recipient_email: e.target.value }
                      })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <Input
                      placeholder="Email subject"
                      value={newRule.action_config?.subject || ''}
                      onChange={(e) => setNewRule({
                        ...newRule,
                        action_config: { ...newRule.action_config, subject: e.target.value }
                      })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <Textarea
                      placeholder="Email body"
                      value={newRule.action_config?.body || ''}
                      onChange={(e) => setNewRule({
                        ...newRule,
                        action_config: { ...newRule.action_config, body: e.target.value }
                      })}
                      className="bg-white/5 border-white/10 text-white"
                      rows={3}
                    />
                  </>
                )}
              </div>

              <Button
                onClick={handleSave}
                disabled={!newRule.name || saveAutomationMutation.isPending}
                className="w-full bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]"
              >
                {saveAutomationMutation.isPending ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400">Loading automations...</div>
      ) : automations?.length === 0 ? (
        <GlowCard glowColor="gold" className="p-8 text-center">
          <Zap className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">No automation rules yet</p>
          <p className="text-sm text-slate-500">Create your first rule to automate your workflow</p>
        </GlowCard>
      ) : (
        <div className="space-y-3">
          {automations.map((rule) => (
            <GlowCard key={rule.id} glowColor="cyan" className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`mt-1 ${rule.active ? 'text-green-400' : 'text-slate-500'}`}>
                    {rule.active ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">{rule.name}</h4>
                    {rule.description && (
                      <p className="text-sm text-slate-400 mb-2">{rule.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                        When: {getTriggerLabel(rule.trigger_type)}
                      </Badge>
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs">
                        Then: {getActionLabel(rule.action_type)}
                      </Badge>
                      {rule.execution_count > 0 && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                          <PlayCircle className="w-3 h-3 mr-1" />
                          {rule.execution_count}x
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.active}
                    onCheckedChange={(checked) => 
                      toggleAutomationMutation.mutate({ id: rule.id, active: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(rule)}
                    className="h-8 w-8 p-0 text-[#C7A763] hover:text-[#A88B4A]"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this automation rule?')) {
                        deleteAutomationMutation.mutate(rule.id);
                      }
                    }}
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      )}
    </div>
  );
}