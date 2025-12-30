import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, ArrowUpDown, Calendar, User, Tag, Clock, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import GlowCard from "@/components/ui/GlowCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from 'date-fns';

export default function AdvancedTaskSearch({ ventureId, onTaskSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('created_date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    dueDateFrom: null,
    dueDateTo: null,
    clickupTags: [],
    relatedEntity: 'all'
  });

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', ventureId],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'VentureTask',
        operation: 'filter',
        query: ventureId ? { venture_id: ventureId } : {},
        sort: `${sortOrder === 'desc' ? '-' : ''}${sortBy}`
      });
      return res.data?.data || [];
    }
  });

  // Extract unique assignees
  const uniqueAssignees = useMemo(() => {
    const assignees = new Set();
    tasks.forEach(task => {
      if (task.assigned_to) assignees.add(task.assigned_to);
    });
    return Array.from(assignees);
  }, [tasks]);

  // Extract unique ClickUp tags
  const uniqueTags = useMemo(() => {
    const tags = new Set();
    tasks.forEach(task => {
      task.clickup_data?.tags?.forEach(tag => tags.add(tag.name || tag));
    });
    return Array.from(tags);
  }, [tasks]);

  // Advanced filtering logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Text search across multiple fields
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        task.title?.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.assigned_to?.toLowerCase().includes(searchLower) ||
        task.clickup_data?.status_text?.toLowerCase().includes(searchLower) ||
        task.clickup_data?.tags?.some(tag => 
          (typeof tag === 'string' ? tag : tag.name)?.toLowerCase().includes(searchLower)
        );

      // Status filter
      const matchesStatus = filters.status === 'all' || task.status === filters.status;

      // Priority filter
      const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;

      // Assignee filter
      const matchesAssignee = filters.assignee === 'all' || task.assigned_to === filters.assignee;

      // Due date range filter
      const matchesDueDateFrom = !filters.dueDateFrom || 
        (task.due_date && new Date(task.due_date) >= filters.dueDateFrom);
      const matchesDueDateTo = !filters.dueDateTo || 
        (task.due_date && new Date(task.due_date) <= filters.dueDateTo);

      // ClickUp tags filter
      const matchesTags = filters.clickupTags.length === 0 ||
        filters.clickupTags.some(filterTag => 
          task.clickup_data?.tags?.some(taskTag => 
            (typeof taskTag === 'string' ? taskTag : taskTag.name) === filterTag
          )
        );

      // Related entity filter
      const matchesRelatedEntity = filters.relatedEntity === 'all' || 
        task.related_entity === filters.relatedEntity;

      return matchesSearch && matchesStatus && matchesPriority && 
             matchesAssignee && matchesDueDateFrom && matchesDueDateTo && 
             matchesTags && matchesRelatedEntity;
    });
  }, [tasks, searchQuery, filters]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'created_date':
          comparison = new Date(a.created_date) - new Date(b.created_date);
          break;
        case 'due_date':
          const dateA = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
          const dateB = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
          comparison = dateA - dateB;
          break;
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          const statusOrder = { todo: 0, in_progress: 1, review: 2, completed: 3, cancelled: 4 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [filteredTasks, sortBy, sortOrder]);

  const toggleTag = (tag) => {
    setFilters(prev => ({
      ...prev,
      clickupTags: prev.clickupTags.includes(tag)
        ? prev.clickupTags.filter(t => t !== tag)
        : [...prev.clickupTags, tag]
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      assignee: 'all',
      dueDateFrom: null,
      dueDateTo: null,
      clickupTags: [],
      relatedEntity: 'all'
    });
    setSearchQuery('');
  };

  const activeFiltersCount = 
    (filters.status !== 'all' ? 1 : 0) +
    (filters.priority !== 'all' ? 1 : 0) +
    (filters.assignee !== 'all' ? 1 : 0) +
    (filters.dueDateFrom ? 1 : 0) +
    (filters.dueDateTo ? 1 : 0) +
    filters.clickupTags.length +
    (filters.relatedEntity !== 'all' ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const statusConfig = {
    todo: { label: 'To Do', color: 'text-slate-400' },
    in_progress: { label: 'In Progress', color: 'text-blue-400' },
    review: { label: 'Review', color: 'text-yellow-400' },
    completed: { label: 'Completed', color: 'text-green-400' },
    cancelled: { label: 'Cancelled', color: 'text-red-400' }
  };

  const priorityConfig = {
    low: { label: 'Low', color: 'text-slate-400' },
    medium: { label: 'Medium', color: 'text-yellow-400' },
    high: { label: 'High', color: 'text-orange-400' },
    urgent: { label: 'Urgent', color: 'text-red-400' }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <GlowCard glowColor="cyan" className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title, description, assignee, ClickUp tags..."
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`border-white/20 ${showFilters ? 'bg-white/10' : ''}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-[#C7A763]">{activeFiltersCount}</Badge>
              )}
            </Button>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(val) => {
              const [field, order] = val.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}>
              <SelectTrigger className="w-48 bg-white/5 border-white/10">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_date-desc">Newest First</SelectItem>
                <SelectItem value="created_date-asc">Oldest First</SelectItem>
                <SelectItem value="due_date-asc">Due Date (Earliest)</SelectItem>
                <SelectItem value="due_date-desc">Due Date (Latest)</SelectItem>
                <SelectItem value="priority-asc">Priority (High to Low)</SelectItem>
                <SelectItem value="priority-desc">Priority (Low to High)</SelectItem>
                <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                <SelectItem value="status-asc">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlowCard>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlowCard glowColor="gold" className="p-6">
              <div className="space-y-6">
                {/* Status & Priority */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Status</label>
                    <Select value={filters.status} onValueChange={(val) => setFilters({...filters, status: val})}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Priority</label>
                    <Select value={filters.priority} onValueChange={(val) => setFilters({...filters, priority: val})}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        {Object.entries(priorityConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Assignee & Related Entity */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Assignee
                    </label>
                    <Select value={filters.assignee} onValueChange={(val) => setFilters({...filters, assignee: val})}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Assignees</SelectItem>
                        {uniqueAssignees.map(assignee => (
                          <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Related Entity</label>
                    <Select value={filters.relatedEntity} onValueChange={(val) => setFilters({...filters, relatedEntity: val})}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="clickup">ClickUp</SelectItem>
                        <SelectItem value="kpi">KPI</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Due Date Range */}
                <div>
                  <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Due Date Range
                  </label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal bg-white/5 border-white/10">
                          <Calendar className="w-4 h-4 mr-2" />
                          {filters.dueDateFrom ? format(filters.dueDateFrom, 'PPP') : 'From date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={filters.dueDateFrom}
                          onSelect={(date) => setFilters({...filters, dueDateFrom: date})}
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal bg-white/5 border-white/10">
                          <Calendar className="w-4 h-4 mr-2" />
                          {filters.dueDateTo ? format(filters.dueDateTo, 'PPP') : 'To date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={filters.dueDateTo}
                          onSelect={(date) => setFilters({...filters, dueDateTo: date})}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* ClickUp Tags */}
                {uniqueTags.length > 0 && (
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      ClickUp Tags ({filters.clickupTags.length} selected)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {uniqueTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                            filters.clickupTags.includes(tag)
                              ? 'bg-[#C7A763] text-[#06101F]'
                              : 'bg-white/5 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-sm text-slate-400">
                      {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''} found
                    </span>
                    <Button
                      variant="ghost"
                      onClick={clearFilters}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            </GlowCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">
          Showing <span className="text-[#C7A763] font-semibold">{sortedTasks.length}</span> of <span className="text-white">{tasks.length}</span> tasks
        </span>
        {isLoading && (
          <span className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4 animate-spin" />
            Loading...
          </span>
        )}
      </div>

      {/* Task Results */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              layout
            >
              <GlowCard 
                glowColor="mixed" 
                className="p-4 cursor-pointer hover:scale-[1.01] transition-transform"
                onClick={() => onTaskSelect?.(task)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h4 className="text-white font-medium">{task.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${priorityConfig[task.priority]?.color}`}>
                          {priorityConfig[task.priority]?.label}
                        </span>
                        <span className={`text-xs ${statusConfig[task.status]?.color}`}>
                          {statusConfig[task.status]?.label}
                        </span>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-slate-400 mb-3 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {task.assigned_to}
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.due_date), 'MMM d, yyyy')}
                        </div>
                      )}
                      {task.clickup_data?.url && (
                        <a
                          href={task.clickup_data.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00D4FF] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ClickUp →
                        </a>
                      )}
                    </div>

                    {/* ClickUp metadata */}
                    {task.clickup_data && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {task.clickup_data.tags?.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="bg-[#C7A763]/20 text-[#C7A763] border-[#C7A763]/30">
                            {typeof tag === 'string' ? tag : tag.name}
                          </Badge>
                        ))}
                        {task.clickup_data.time_estimate && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                            Est: {Math.round(task.clickup_data.time_estimate / 3600000)}h
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </AnimatePresence>

        {sortedTasks.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto text-slate-500 mb-3" />
            <p className="text-slate-400">No tasks found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}