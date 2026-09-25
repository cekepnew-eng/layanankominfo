import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, Settings, X } from 'lucide-react';

import { FieldEditor } from './FieldEditor';

export const FormBuilder = ({ schema, onChange }) => {
  const addField = () => {
    const uniqueId = 'field_' + Math.random().toString(36).substr(2, 9);
    const newField = { 
      id: uniqueId, 
      label: 'Field Baru', 
      name: uniqueId, 
      type: 'text', 
      required: true 
    };
    onChange([...schema, newField]);
  };

  const updateField = (index, updatedField) => {
    const newSchema = [...schema];
    newSchema[index] = updatedField;
    onChange(newSchema);
  };

  const deleteField = (index) => {
    const newSchema = schema.filter((_, i) => i !== index);
    onChange(newSchema);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-black text-slate-800">Struktur Formulir (JSON)</h4>
          <p className="text-xs text-slate-500">Rancang field yang harus diisi pemohon secara dinamis.</p>
        </div>
        <button
          type="button"
          onClick={addField}
          className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Field
        </button>
      </div>

      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
        {schema.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold">Belum ada field formulir.</p>
            <p className="text-xs">Klik "Tambah Field" untuk mulai merancang.</p>
          </div>
        ) : (
          (schema || []).map((field, idx) => (
            <FieldEditor
              key={field.id || `field-${idx}`}
              field={field}
              onChange={(updated) => updateField(idx, updated)}
              onDelete={() => deleteField(idx)}
            />
          ))
        )}
      </div>
    </div>
  );
};
