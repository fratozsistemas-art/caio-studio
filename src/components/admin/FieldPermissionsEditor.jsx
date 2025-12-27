import React, { useState } from 'react';
import { Check, Eye, Edit3 } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import GlowCard from "@/components/ui/GlowCard";

const entityFieldsMap = {
  Venture: ['name', 'description', 'layer', 'status', 'category', 'tags', 'website', 'linkedin_url', 'logo_url', 'founded_date', 'team_size'],
  FinancialRecord: ['record_date', 'revenue', 'expenses', 'investment', 'cash_balance', 'period_type', 'notes'],
  VentureKPI: ['kpi_name', 'kpi_type', 'current_value', 'target_value', 'unit', 'period', 'measurement_date', 'notes']
};

export default function FieldPermissionsEditor({ fieldPermissions = {}, onChange }) {
  const [selectedEntity, setSelectedEntity] = useState('Venture');

  const handleFieldToggle = (entity, field, type) => {
    const currentPerms = fieldPermissions[entity] || { viewable_fields: [], editable_fields: [] };
    const fieldArray = type === 'view' ? 'viewable_fields' : 'editable_fields';
    const fields = currentPerms[fieldArray] || [];

    const newFields = fields.includes(field)
      ? fields.filter(f => f !== field)
      : [...fields, field];

    onChange({
      ...fieldPermissions,
      [entity]: {
        ...currentPerms,
        [fieldArray]: newFields
      }
    });
  };

  const handleSelectAll = (entity, type) => {
    const allFields = entityFieldsMap[entity];
    const fieldArray = type === 'view' ? 'viewable_fields' : 'editable_fields';
    const currentPerms = fieldPermissions[entity] || { viewable_fields: [], editable_fields: [] };
    
    const allSelected = allFields.every(f => currentPerms[fieldArray]?.includes(f));

    onChange({
      ...fieldPermissions,
      [entity]: {
        ...currentPerms,
        [fieldArray]: allSelected ? [] : allFields
      }
    });
  };

  const currentEntityPerms = fieldPermissions[selectedEntity] || { viewable_fields: [], editable_fields: [] };

  return (
    <div className="space-y-4">
      <Label className="text-white/70">Permissões por Campo (Granular)</Label>
      
      {/* Entity Selector */}
      <div className="flex gap-2">
        {Object.keys(entityFieldsMap).map(entity => (
          <button
            key={entity}
            onClick={() => setSelectedEntity(entity)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              selectedEntity === entity
                ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            {entity}
          </button>
        ))}
      </div>

      <GlowCard glowColor="cyan" className="p-4">
        <div className="space-y-3">
          {/* Header with select all */}
          <div className="grid grid-cols-3 gap-4 pb-2 border-b border-white/10">
            <span className="text-xs text-slate-400 font-medium">Campo</span>
            <button
              onClick={() => handleSelectAll(selectedEntity, 'view')}
              className="text-xs text-[#00D4FF] hover:text-[#33E0FF] flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              Visualizar (Todos)
            </button>
            <button
              onClick={() => handleSelectAll(selectedEntity, 'edit')}
              className="text-xs text-[#C7A763] hover:text-[#D4B474] flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              Editar (Todos)
            </button>
          </div>

          {/* Fields */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {entityFieldsMap[selectedEntity].map(field => (
              <div key={field} className="grid grid-cols-3 gap-4 items-center">
                <span className="text-sm text-white font-mono">{field}</span>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={currentEntityPerms.viewable_fields?.includes(field)}
                    onCheckedChange={() => handleFieldToggle(selectedEntity, field, 'view')}
                  />
                  <span className="text-xs text-slate-300">Ver</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={currentEntityPerms.editable_fields?.includes(field)}
                    onCheckedChange={() => handleFieldToggle(selectedEntity, field, 'edit')}
                  />
                  <span className="text-xs text-slate-300">Editar</span>
                </label>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="pt-3 border-t border-white/10 text-xs text-slate-400">
            <span className="text-[#00D4FF]">{currentEntityPerms.viewable_fields?.length || 0}</span> campos visíveis,{' '}
            <span className="text-[#C7A763]">{currentEntityPerms.editable_fields?.length || 0}</span> campos editáveis
          </div>
        </div>
      </GlowCard>
    </div>
  );
}