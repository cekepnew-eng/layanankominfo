import React, { useState } from 'react';
import { Plus, Users, User, Trash2, Edit2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const availableServices = [
  'Pengelolaan Aplikasi Informatika',
  'Pengelolaan Sumber Daya & Perangkat Informatika',
  'Penerapan Persandian & Keamanan Informasi',
  'Tata Kelola SPBE'
];

export const ManageTeams = () => {
  const { teams, setTeams, users } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [leader, setLeader] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  const [editingTeam, setEditingTeam] = useState(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editLeader, setEditLeader] = useState('');
  const [editSelectedMembers, setEditSelectedMembers] = useState([]);
  const [editSelectedServices, setEditSelectedServices] = useState([]);

  const [deletingTeamId, setDeletingTeamId] = useState(null);

  const pegawaiList = users ? users.filter(u => u.roles?.includes('pegawai') || u.role === 'pegawai') : [];

  const handleAddTeam = (e) => {
    e.preventDefault();
    if (selectedMembers.length === 0) {
      alert('Harap pilih minimal satu anggota pegawai!');
      return;
    }
    if (selectedServices.length === 0) {
      alert('Harap pilih minimal satu cakupan layanan SPBE!');
      return;
    }

    const newTeam = {
      id: teams.length + 1,
      name: teamName.trim(),
      leader,
      members: selectedMembers,
      services: selectedServices
    };

    setTeams([...teams, newTeam]);

    setTeamName('');
    setLeader('');
    setSelectedMembers([]);
    setSelectedServices([]);
    setShowAddForm(false);
    alert('Tim kerja baru berhasil ditambahkan.');
  };

  const handleStartEdit = (team) => {
    setEditingTeam(team);
    setEditTeamName(team.name || '');
    setEditLeader(team.leader || '');
    setEditSelectedMembers(team.members || []);
    setEditSelectedServices(team.services || []);
  };

  const handleSaveEdit = () => {
    if (!editTeamName.trim() || !editLeader) {
      alert('Nama Tim dan Ketua Tim wajib diisi!');
      return;
    }
    if (editSelectedMembers.length === 0) {
      alert('Harap pilih minimal satu anggota pegawai!');
      return;
    }
    if (editSelectedServices.length === 0) {
      alert('Harap pilih minimal satu cakupan layanan SPBE!');
      return;
    }

    setTeams(prev => prev.map(t => {
      if (t.id === editingTeam.id) {
        return {
          ...t,
          name: editTeamName.trim(),
          leader: editLeader,
          members: editSelectedMembers,
          services: editSelectedServices
        };
      }
      return t;
    }));

    setEditingTeam(null);
    alert('Informasi tim kerja berhasil diperbarui!');
  };

  const handleDeleteTeam = (id) => {
    setTeams(teams.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-8 font-sans text-left animate-in fade-in duration-200">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Tim Kerja</h2>
          <p className="text-slate-500 text-base leading-relaxed">Buat tim pelaksana teknis Diskominfo, tentukan ketua tim, dan hubungkan dengan klasifikasi layanan SPBE.</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (!showAddForm) {
              setTeamName('');
              setLeader('');
              setSelectedMembers([]);
              setSelectedServices([]);
            }
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-base font-bold transition-all shadow-sm"
        >
          {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          <span>{showAddForm ? 'Batal' : 'Buat Tim Kerja'}</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddTeam} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <h3 className="font-extrabold text-slate-800 text-lg">Buat Tim Kerja Baru</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Tim Kerja</label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Contoh: Tim Pengembangan Aplikasi"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ketua Tim / Koordinator</label>
              <select
                required
                value={leader}
                onChange={(e) => setLeader(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="">-- Pilih Ketua Tim --</option>
                {pegawaiList.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Anggota Pegawai</label>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 max-h-48 overflow-y-auto">
                {pegawaiList.map(p => {
                  const isChecked = selectedMembers.includes(p.name);
                  return (
                    <div key={p.id} className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        id={`add-member-${p.id}`}
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedMembers(selectedMembers.filter(m => m !== p.name));
                          } else {
                            setSelectedMembers([...selectedMembers, p.name]);
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                      <label htmlFor={`add-member-${p.id}`} className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                        {p.name} <span className="text-[10px] text-slate-400 font-medium">({p.department})</span>
                      </label>
                    </div>
                  );
                })}
                {pegawaiList.length === 0 && (
                  <p className="text-xs text-slate-450 italic">Tidak ada data pegawai. Silakan daftarkan pegawai terlebih dahulu di Kelola User.</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cakupan Layanan SPBE</label>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                {availableServices.map(service => {
                  const isChecked = selectedServices.includes(service);
                  return (
                    <div key={service} className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        id={`add-service-${service}`}
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedServices(selectedServices.filter(s => s !== service));
                          } else {
                            setSelectedServices([...selectedServices, service]);
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                      <label htmlFor={`add-service-${service}`} className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                        {service}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-base font-bold transition-all shadow-sm"
          >
            Simpan Tim Kerja
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {teams.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold text-base">Belum ada tim kerja pelaksana yang didaftarkan.</p>
          </div>
        ) : (
          teams.map((t) => (
            <div key={t.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-800 leading-tight">{t.name}</h3>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ketua Tim</span>
                    <div className="flex items-center gap-1.5 mt-1 text-slate-750 text-base font-semibold">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>{t.leader}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Anggota Pegawai</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {t.members.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">Belum ada anggota</span>
                      ) : (
                        t.members.map((member, mIdx) => (
                          <span key={mIdx} className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-lg font-bold">
                            {member}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Cakupan Layanan SPBE</span>
                    <ul className="mt-1 space-y-1">
                      {t.services.map((service, sIdx) => (
                        <li key={sIdx} className="text-xs text-slate-505 flex items-start gap-1 font-semibold">
                          <span className="text-sky-500 mt-0.5">•</span>
                          <span>{service}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleStartEdit(t)}
                  className="p-2 text-slate-400 hover:text-sky-655 rounded-lg hover:bg-sky-50 transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setDeletingTeamId(t.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editingTeam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-slate-100 shadow-2xl space-y-4 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-lg">Edit Tim Kerja</h3>
              <button onClick={() => setEditingTeam(null)} className="p-1 text-slate-400 hover:text-slate-655 hover:bg-slate-50 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Tim Kerja</label>
                <input
                  type="text"
                  required
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ketua Tim / Koordinator</label>
                <select
                  required
                  value={editLeader}
                  onChange={(e) => setEditLeader(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none"
                >
                  <option value="">-- Pilih Ketua Tim --</option>
                  {pegawaiList.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Anggota Pegawai</label>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 max-h-48 overflow-y-auto">
                  {pegawaiList.map(p => {
                    const isChecked = editSelectedMembers.includes(p.name);
                    return (
                      <div key={p.id} className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id={`edit-member-${p.id}`}
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setEditSelectedMembers(editSelectedMembers.filter(m => m !== p.name));
                            } else {
                              setEditSelectedMembers([...editSelectedMembers, p.name]);
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                        <label htmlFor={`edit-member-${p.id}`} className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                          {p.name} <span className="text-[10px] text-slate-400 font-medium">({p.department})</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cakupan Layanan SPBE</label>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  {availableServices.map(service => {
                    const isChecked = editSelectedServices.includes(service);
                    return (
                      <div key={service} className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id={`edit-service-${service}`}
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setEditSelectedServices(editSelectedServices.filter(s => s !== service));
                            } else {
                              setEditSelectedServices([...editSelectedServices, service]);
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                        <label htmlFor={`edit-service-${service}`} className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                          {service}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="flex-1 py-2 px-4 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex-1 py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold transition-all"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingTeamId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 border border-slate-100 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-100 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-lg">Yakin untuk menghapus?</h3>
              <p className="text-sm text-slate-505">Tindakan ini tidak dapat dibatalkan dan tim kerja pelaksana akan dihapus permanen dari sistem prototype.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTeamId(null)}
                className="flex-1 py-2 px-4 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteTeam(deletingTeamId);
                  setDeletingTeamId(null);
                  alert('Tim kerja berhasil dihapus.');
                }}
                className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-all"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
