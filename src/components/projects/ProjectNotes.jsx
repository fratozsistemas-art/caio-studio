import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import GlowCard from '@/components/ui/GlowCard';
import { FileText, Plus, Pin, Trash2, Edit, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

export default function ProjectNotes({ projectId }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    note_type: 'general',
    linked_task_ids: []
  });

  // Fetch notes
  const { data: notes, isLoading } = useQuery({
    queryKey: ['project-notes', projectId],
    queryFn: async () => {
      const allNotes = await base44.entities.ProjectNote.filter({
        project_id: projectId
      });
      return allNotes.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.created_date) - new Date(a.created_date);
      });
    },
    enabled: !!projectId
  });

  // Create/Update note
  const saveNoteMutation = useMutation({
    mutationFn: async (noteData) => {
      const user = await base44.auth.me();
      const dataWithAuthor = { ...noteData, author_email: user.email, project_id: projectId };
      
      if (editingNote) {
        return await base44.entities.ProjectNote.update(editingNote.id, dataWithAuthor);
      } else {
        return await base44.entities.ProjectNote.create(dataWithAuthor);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-notes'] });
      setDialogOpen(false);
      setEditingNote(null);
      setNewNote({ title: '', content: '', note_type: 'general', linked_task_ids: [] });
      toast.success(editingNote ? 'Note updated' : 'Note created');
    }
  });

  // Delete note
  const deleteNoteMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.ProjectNote.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-notes'] });
      toast.success('Note deleted');
    }
  });

  // Toggle pin
  const togglePinMutation = useMutation({
    mutationFn: async ({ id, pinned }) => {
      return await base44.entities.ProjectNote.update(id, { pinned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-notes'] });
    }
  });

  const handleEdit = (note) => {
    setEditingNote(note);
    setNewNote({
      title: note.title,
      content: note.content,
      note_type: note.note_type,
      linked_task_ids: note.linked_task_ids || []
    });
    setDialogOpen(true);
  };

  const getNoteTypeColor = (type) => {
    const colors = {
      meeting: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      decision: 'bg-green-500/10 text-green-400 border-green-500/30',
      blocker: 'bg-red-500/10 text-red-400 border-red-500/30',
      update: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      general: 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    };
    return colors[type] || colors.general;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#C7A763]" />
          <h3 className="text-lg font-semibold text-white">Project Notes</h3>
          <Badge variant="outline" className="bg-[#C7A763]/10 text-[#C7A763]">
            {notes?.length || 0}
          </Badge>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]">
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0a1628] border-white/10 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingNote ? 'Edit Note' : 'Create Note'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Title</label>
                <Input
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Note title"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">Type</label>
                <Select
                  value={newNote.note_type}
                  onValueChange={(val) => setNewNote({ ...newNote, note_type: val })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="meeting">Meeting Notes</SelectItem>
                    <SelectItem value="decision">Decision</SelectItem>
                    <SelectItem value="blocker">Blocker</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">Content (Markdown supported)</label>
                <Textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Write your note here... Markdown is supported"
                  className="bg-white/5 border-white/10 text-white font-mono"
                  rows={12}
                />
              </div>

              <Button
                onClick={() => saveNoteMutation.mutate(newNote)}
                disabled={!newNote.title || !newNote.content || saveNoteMutation.isPending}
                className="w-full bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]"
              >
                {saveNoteMutation.isPending ? 'Saving...' : editingNote ? 'Update Note' : 'Create Note'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400">Loading notes...</div>
      ) : notes?.length === 0 ? (
        <GlowCard glowColor="gold" className="p-8 text-center">
          <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">No notes yet</p>
          <p className="text-sm text-slate-500">Create your first note to document project progress</p>
        </GlowCard>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <GlowCard key={note.id} glowColor="cyan" className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {note.pinned && <Pin className="w-4 h-4 text-[#C7A763]" />}
                    <h4 className="text-white font-semibold">{note.title}</h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Badge variant="outline" className={getNoteTypeColor(note.note_type)}>
                      {note.note_type}
                    </Badge>
                    <span>•</span>
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(note.created_date), 'MMM dd, yyyy')}</span>
                    <span>•</span>
                    <span>by {note.author_email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePinMutation.mutate({ id: note.id, pinned: !note.pinned })}
                    className={`h-8 w-8 p-0 ${note.pinned ? 'text-[#C7A763]' : 'text-slate-400'} hover:text-[#C7A763]`}
                  >
                    <Pin className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(note)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this note?')) {
                        deleteNoteMutation.mutate(note.id);
                      }
                    }}
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown>{note.content}</ReactMarkdown>
              </div>
            </GlowCard>
          ))}
        </div>
      )}
    </div>
  );
}