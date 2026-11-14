import React, { useState, useEffect } from 'react';
import { Plus, Users, User, Trash2, Edit2, X, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ActionModal } from '../../components/ActionModal';
import { api } from '../../services/api';

export const ManageTeams = () => {
  const { teams, setTeams, fetchTeams } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await api.getUsers();
        const userList = response?.data || response?.users || [];
        setUsers(userList);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    loadUsers();
  }, []);

  const [showAddForm, setShowAddForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [leader, setLeader] = useState('');
  const [leaderSearchQuery, setLeaderSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  const [editingTeam, setEditingTeam] = useState(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editLeader, setEditLeader] = useState('');
  const [editLeaderSearchQuery, setEditLeaderSearchQuery] = useState('');
  const [editSelectedMembers, setEditSelectedMembers] = useState([]);
  const [editMemberSearchQuery, setEditMemberSearchQuery] = useState('');

  useEffect(() => {
    if (editingTeam) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [editingTeam]);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    cancelText: 'Batal',
    onConfirm: null
  });

  const pegawaiList = users ? users.filter(u => {
    const roleArr = u.roles || [u.role];
    return roleArr.some(r => ['PEGAWAI', 'ADMIN', 'HELPDESK'].includes(r));
  }) : [];

  const filterPegawai = (query) => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return pegawaiList;
    return pegawaiList.filter(p =>
      `${p.name || ''} ${p.department || ''}`.toLocaleLowerCase().includes(normalizedQuery)
    );
  };

  const renderMemberPicker = (query, selectedMembers, setQuery, setSelectedMembers) => {
    const matches = filterPegawai(query);
    return (
      <>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik nama atau instansi pegawai..."
            autoComplete="off"
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
        {query.trim() && (
          <div className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {matches.map(p => {
              const isSelected = selectedMembers.includes(p.name);
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isSelected}
                  onClick={() => {
                    setSelectedMembers(current => current.includes(p.name) ? current : [...current, p.name]);
                    setQuery('');
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                    isSelected ? 'cursor-not-allowed opacity-50' : 'hover:bg-sky-50'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-800">{p.name}</span>
                    <span className="block truncate text-xs text-slate-400">{p.department}</span>
                  </span>
                  <span className="shrink-0 rounded-md bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-700">
                    {isSelected ? 'Dipilih' : 'Pilih'}
                  </span>
                </button>
              );
            })}
            {matches.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-400">Pegawai tidak ditemukan.</p>
            )}
          </div>
        )}
        {pegawaiList.length === 0 && (
          <p className="mt-2 text-xs text-slate-400 italic">Tidak ada data pegawai. Silakan daftarkan pegawai terlebih dahulu di Kelola User.</p>
        )}
        <div className="mt-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
          {selectedMembers.map((member, index) => (
            <span key={`${member}-${index}`} className="inline-flex items-center gap-1.5 rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-800">
              {member}
              <button
                type="button"
                aria-label={`Hapus ${member} dari pilihan anggota`}
                onClick={() => setSelectedMembers(current => current.filter(name => name !== member))}
                className="rounded-full text-sky-500 hover:bg-sky-100 hover:text-rose-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {selectedMembers.length === 0 && pegawaiList.length > 0 && (
            <p className="text-xs text-slate-400 italic">Belum ada anggota yang dipilih.</p>
          )}
        </div>
      </>
    );
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    if (!leader) {
      setModalConfig({
        isOpen: true,
        type: 'warning',
        title: 'Ketua Tim Belum Dipilih',
        message: 'Pilih ketua tim dari hasil pencarian pegawai.',
        confirmText: 'Pilih Ketua Tim',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    if (selectedMembers.length === 0) {
      setModalConfig({
        isOpen: true,
        type: 'warning',
        title: 'Anggota Tim Belum Dipilih',
        message: 'Harap pilih minimal satu orang anggota teknisi pegawai untuk tim kerja ini.',
        confirmText: 'Lengkapi Anggota',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    try {
      await api.createTeam({
        name: teamName.trim(),
        description: 'Unit Kerja Pelaksana Teknis SPBE Diskominfo Kota Bogor',
        members: selectedMembers,
        leader: leader
      });

      if (fetchTeams) await fetchTeams();

      setTeamName('');
      setLeader('');
      setSelectedMembers([]);
      setShowAddForm(false);
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Tim Kerja Berhasil Dibuat',
        message: `Tim kerja telah berhasil didaftarkan ke dalam sistem SPBE.`,
        confirmText: 'Selesai',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    } catch (err) {
      alert('Gagal membuat tim: ' + err.message);
    }
  };

  const handleStartEdit = (team) => {
    setEditingTeam(team);
    setEditTeamName(team.name || '');
    setEditLeader(team.leader || '');
    setEditLeaderSearchQuery(team.leader || '');
    setEditSelectedMembers(team.members || []);
    setEditMemberSearchQuery('');
  };

  const handleSaveEdit = async () => {
    if (!editTeamName.trim() || !editLeader) {
      setModalConfig({
        isOpen: true,
        type: 'warning',
        title: 'Data Belum Lengkap',
        message: 'Nama Tim dan Ketua Tim wajib diisi.',
        confirmText: 'Lengkapi Data',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    try {
      await api.updateTeam(editingTeam.id, {
        name: editTeamName.trim(),
        description: editingTeam.description || 'Unit Kerja Pelaksana Teknis SPBE Diskominfo Kota Bogor',
        members: editSelectedMembers,
        leader: editLeader
      });

      if (fetchTeams) await fetchTeams();

      setEditingTeam(null);
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Informasi Tim Diperbarui',
        message: 'Perubahan data tim kerja telah berhasil disimpan.',
        confirmText: 'Selesai',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    } catch (err) {
      alert('Gagal menyimpan tim: ' + err.message);
    }
  };

  const handlePromptDeleteTeam = (t) => {
    setModalConfig({
      isOpen: true,
      type: 'danger',
      title: 'Konfirmasi Hapus Tim Kerja',
      message: `Apakah Anda yakin ingin menghapus tim kerja "${t.name}"? Penugasan tiket dan pembagian tugas anggota pada tim ini akan dibebaskan.`,
      confirmText: 'Ya, Hapus Tim',
      cancelText: 'Batal',
      onConfirm: () => executeDeleteTeam(t.id)
    });
  };

  const executeDeleteTeam = async (id) => {
    try {
      await api.deleteTeam(id);
      if (fetchTeams) await fetchTeams();

      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Tim Kerja Berhasil Dihapus',
        message: 'Tim kerja teknis telah berhasil dihapus dari sistem.',
        confirmText: 'Selesai',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    } catch (err) {
      alert('Gagal menghapus tim: ' + err.message);
    }
  };

  return (
    <div className="space-y-8 font-sans text-left animate-in fade-in duration-200">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Tim Kerja</h2>
          <p className="text-slate-500 text-base leading-relaxed">Kelola tim pelaksana teknis Diskominfo Kota Bogor, tentukan ketua tim, dan atur penugasan personel anggota.</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (!showAddForm) {
              setTeamName('');
              setLeader('');
              setLeaderSearchQuery('');
              setSelectedMembers([]);
              setMemberSearchQuery('');
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={leaderSearchQuery}
                  onChange={(e) => {
                    setLeader('');
                    setLeaderSearchQuery(e.target.value);
                  }}
                  placeholder="Cari nama ketua tim..."
                  autoComplete="off"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              {!leader && leaderSearchQuery.trim() && (
                <div className="mt-1 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  {filterPegawai(leaderSearchQuery).map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setLeader(p.name);
                        setLeaderSearchQuery(p.name);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-sky-50"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-slate-800">{p.name}</span>
                          <span className="block truncate text-xs text-slate-400">{p.department}</span>
                        </span>
                        <span className="shrink-0 rounded-md bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-700">Pilih</span>
                      </span>
                    </button>
                  ))}
                  {filterPegawai(leaderSearchQuery).length === 0 && (
                    <p className="px-3 py-2 text-xs text-slate-400">Pegawai tidak ditemukan.</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Anggota Pegawai</label>
              {renderMemberPicker(memberSearchQuery, selectedMembers, setMemberSearchQuery, setSelectedMembers)}
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
                      {t.members.filter(m => m !== t.leader).length === 0 ? (
                        <span className="text-xs text-slate-400 italic">Belum ada anggota</span>
                      ) : (
                        t.members.filter(m => m !== t.leader).map((member, mIdx) => (
                          <span key={mIdx} className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-lg font-bold">
                            {member}
                          </span>
                        ))
                      )}
                    </div>
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
                  onClick={() => handlePromptDeleteTeam(t)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editingTeam && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white max-w-xl sm:max-w-2xl w-full rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-2xl space-y-5 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-xl tracking-tight">Edit Tim Kerja</h3>
              <button onClick={() => setEditingTeam(null)} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Tim Kerja</label>
                <input
                  type="text"
                  required
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ketua Tim / Koordinator</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={editLeaderSearchQuery}
                    onChange={(e) => {
                      setEditLeader('');
                      setEditLeaderSearchQuery(e.target.value);
                    }}
                    placeholder="Cari nama ketua tim..."
                    autoComplete="off"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                {!editLeader && editLeaderSearchQuery.trim() && (
                  <div className="mt-1 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    {filterPegawai(editLeaderSearchQuery).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setEditLeader(p.name);
                          setEditLeaderSearchQuery(p.name);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-sky-50"
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-slate-800">{p.name}</span>
                            <span className="block truncate text-xs text-slate-400">{p.department}</span>
                          </span>
                          <span className="shrink-0 rounded-md bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-700">Pilih</span>
                        </span>
                      </button>
                    ))}
                    {filterPegawai(editLeaderSearchQuery).length === 0 && (
                      <p className="px-3 py-2 text-xs text-slate-400">Pegawai tidak ditemukan.</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Anggota Pegawai</label>
                {renderMemberPicker(editMemberSearchQuery, editSelectedMembers, setEditMemberSearchQuery, setEditSelectedMembers)}
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="flex-1 py-3 px-5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm sm:text-base font-bold text-slate-700 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex-1 py-3 px-5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm sm:text-base font-bold transition-all shadow-md cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      <ActionModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
};
