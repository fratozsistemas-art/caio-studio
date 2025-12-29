import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlowCard from '@/components/ui/GlowCard';
import { RefreshCw, ArrowLeftRight, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TaskSyncPanel({ selectedList }) {
  const queryClient = useQueryClient();
  const [selectedVenture, setSelectedVenture] = useState('');
  const [syncDirection, setSyncDirection] = useState('both');

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!selectedList || !selectedVenture) {
        throw new Error('Please select both a list and venture');
      }

      return await base44.functions.invoke('syncClickUpTasks', {
        listId: selectedList,
        ventureId: selectedVenture,
        direction: syncDirection
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['venture-tasks'] });
      
      const results = data.data.results;
      toast.success(
        `Sync complete! ClickUp→Venture: ${results.clickupToVenture.created} created, ${results.clickupToVenture.updated} updated. Venture→ClickUp: ${results.ventureToClickup.created} created, ${results.ventureToClickup.updated} updated.`
      );
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    }
  });

  return (
    <GlowCard glowColor="mixed" className="p-6">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <RefreshCw className="w-5 h-5 text-[#C7A763]" />
        Two-Way Task Sync
      </h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Select Venture</label>
          <Select value={selectedVenture} onValueChange={setSelectedVenture}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="Choose venture to sync with" />
            </SelectTrigger>
            <SelectContent>
              {/* This will be populated dynamically */}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-2 block">Sync Direction</label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={syncDirection === 'both' ? 'default' : 'outline'}
              onClick={() => setSyncDirection('both')}
              className={syncDirection === 'both' ? 'bg-[#C7A763] text-[#06101F]' : ''}
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Both Ways
            </Button>
            <Button
              variant={syncDirection === 'clickup_to_venture' ? 'default' : 'outline'}
              onClick={() => setSyncDirection('clickup_to_venture')}
              className={syncDirection === 'clickup_to_venture' ? 'bg-[#C7A763] text-[#06101F]' : ''}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              ClickUp → Venture
            </Button>
            <Button
              variant={syncDirection === 'venture_to_clickup' ? 'default' : 'outline'}
              onClick={() => setSyncDirection('venture_to_clickup')}
              className={syncDirection === 'venture_to_clickup' ? 'bg-[#C7A763] text-[#06101F]' : ''}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Venture → ClickUp
            </Button>
          </div>
        </div>

        <Button
          onClick={() => syncMutation.mutate()}
          disabled={!selectedList || !selectedVenture || syncMutation.isPending}
          className="w-full bg-[#C7A763] hover:bg-[#A88B4A] text-[#06101F]"
        >
          {syncMutation.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Sync Tasks
            </>
          )}
        </Button>

        <div className="text-xs text-slate-400 space-y-1">
          <p>• <strong>Both Ways:</strong> Syncs all changes in both directions</p>
          <p>• <strong>ClickUp → Venture:</strong> Updates internal tasks from ClickUp</p>
          <p>• <strong>Venture → ClickUp:</strong> Pushes internal tasks to ClickUp</p>
        </div>
      </div>
    </GlowCard>
  );
}