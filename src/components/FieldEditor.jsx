import React from 'react';
import { Plus, Trash2, X } from 'lucide-react';

export const FieldEditor = ({ field, onChange, onDelete, level = 0 }) => {
  const isGroup = field.type === 'group';
  
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    onChange({
      ...field,
      type: newType,
      options: newType === 'select' ? ['Opsi 1', 'Opsi 2'] : undefined,
      subFields: newType === 'group' ? [] : undefined
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...field.options];
    newOptions[index] = value;
    onChange({ ...field, options: newOptions });
  };

  const addOption = () => {
    onChange({ ...field, options: [...(field.options || []), `Opsi ${(field.options?.length || 0) + 1}`] });
  };

  const removeOption = (index) => {
    const newOptions = field.options.filter((_, i) => i !== index);
    onChange({ ...field, options: newOptions });
  };

  const addSubField = () => {
    const newId = 'sub_' + Math.random().toString(36).substr(2, 9);
    const newSubField = { id: newId, label: 'Field Baru', name: `field_${newId}`, type: 'text', required: false };
    onChange({ ...field, subFields: [...(field.subFields || []), newSubField] });
  };

  const updateSubField = (index, updatedSubField) => {
    const newSubFields = [...field.subFields];
    newSubFields[index] = updatedSubField;
    onChange({ ...field, subFields: newSubFields });
  };

  const deleteSubField = (index) => {
    const newSubFields = field.subFields.filter((_, i) => i !== index);
    onChange({ ...field, subFields: newSubFields });
  };

  return (
    <div className={`border rounded-xl mb-3 bg-white ${level > 0 ? 'ml-6 border-l-4 border-l-sky-400' : 'border-slate-200'}`}>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={field.label ?? ""}
              onChange={(e) => {
                const label = e.target.value;
                const name = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
                onChange({ ...field, label, name: field.name || name });
              }}
              placeholder="Label Field (Contoh: Nama Lengkap)"
              className="w-full px-3 py-2 text-sm font-bold border-b border-slate-200 focus:border-sky-500 focus:outline-none bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={field.type ?? "text"}
              onChange={handleTypeChange}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg focus:outline-none"
            >
              <option value="text">Teks Pendek</option>
              <option value="textarea">Teks Panjang</option>
              <option value="number">Angka</option>
              <option value="select">Pilihan (Dropdown)</option>
              <option value="date">Tanggal</option>
              <option value="file">Upload File</option>
              <option value="group">Grup / Sub-Form</option>
            </select>
            {!isGroup && (
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer px-2">
                <input
                  type="checkbox"
                  checked={field.required || false}
                  onChange={(e) => onChange({ ...field, required: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-sky-600"
                />
                Wajib Isi
              </label>
            )}
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded-lg">
          <span className="font-bold text-slate-700">JSON Key:</span>
          <input 
            type="text" 
            value={field.name ?? ""} 
            onChange={(e) => onChange({ ...field, name: e.target.value })}
            className="bg-transparent border-none focus:outline-none w-full"
            placeholder="nama_field"
          />
        </div>

        {field.type === 'select' && (
          <div className="pl-4 py-2 border-l-2 border-slate-100 space-y-2 mt-2">
            <p className="text-xs font-bold text-slate-500">Pilihan Dropdown:</p>
            {field.options?.map((opt, idx) => (
              <div key={`opt-${idx}`} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                <input
                  type="text"
                  value={opt ?? ""}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border-b border-slate-200 focus:border-sky-500 focus:outline-none"
                />
                <button type="button" onClick={() => removeOption(idx)} className="text-slate-400 hover:text-red-500 p-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 mt-1"
            >
              <Plus className="w-3 h-3" /> Tambah Pilihan
            </button>
          </div>
        )}

        {isGroup && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Field di dalam grup ini:</p>
            </div>
            
            {(field.subFields || []).map((subField, idx) => (
              <FieldEditor
                key={subField.id || `sub-${idx}`}
                field={subField}
                onChange={(updated) => updateSubField(idx, updated)}
                onDelete={() => deleteSubField(idx)}
                level={level + 1}
              />
            ))}
            
            <button
              type="button"
              onClick={addSubField}
              className="w-full py-2 border-2 border-dashed border-sky-200 rounded-xl text-sky-600 text-xs font-bold hover:bg-sky-50 hover:border-sky-400 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Tambah Sub-Field
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
