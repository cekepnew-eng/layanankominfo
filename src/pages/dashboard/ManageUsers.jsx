import React, { useState } from 'react';
import { Edit2, Trash2, X, Users, Building, Mail, Search, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const ManageUsers = () => {
  const { teams, setTeams, user, setUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      if (response && response.data) {
        setUsers(response.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };
  const [activeTab, setActiveTab] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');

  const [editingUser, setEditingUser] = useState(null);
  const [editRoleVal, setEditRoleVal] = useState('user');
  const [editRolesVal, setEditRolesVal] = useState([]);
  const [editTeamAssignments, setEditTeamAssignments] = useState({});

  const [deletingUserId, setDeletingUserId] = useState(null);

  const handleStartEdit = (u) => {
    setEditingUser(u);
    setEditRoleVal(u.role || 'user');
    setEditRolesVal(u.roles || [u.role || 'user']);

    const initialAssignments = {};
    teams.forEach(t => {
      if (t.members.includes(u.name)) {
        initialAssignments[t.id] = true;
      }
    });
    setEditTeamAssignments(initialAssignments);
  };

  const handleToggleRoleCheckbox = (roleKey) => {
    if (editRolesVal.includes(roleKey)) {
      if (editRolesVal.length <= 1) {
        alert('Pengguna harus memiliki minimal satu peran!');
        return;
      }
      const newRoles = editRolesVal.filter(r => r !== roleKey);
      setEditRolesVal(newRoles);
      if (editRoleVal === roleKey) {
        setEditRoleVal(newRoles[0]);
      }
    } else {
      setEditRolesVal([...editRolesVal, roleKey]);
    }
  };

  const handleSaveEdit = async () => {
    const assignedTeamIds = Object.keys(editTeamAssignments).filter(id => editTeamAssignments[id]);

    if (editRolesVal.includes('pegawai') && assignedTeamIds.length === 0) {
      alert('Pegawai wajib dimasukkan ke minimal satu tim kerja pelaksana!');
      return;
    }

    const primaryRole = editRolesVal[0] || 'user';

    try {
      await api.updateUserRole(editingUser.id, { roleName: primaryRole });
      await fetchUsers(); // Refresh from DB

      const updatedTeams = teams.map(t => {
        let members = [...t.members];
        members = members.filter(m => m !== editingUser.name);
        if (editRolesVal.includes('pegawai') && editTeamAssignments[t.id]) {
          if (!members.includes(editingUser.name)) {
            members.push(editingUser.name);
          }
        }
        let leader = t.leader;
        if (leader === editingUser.name) {
          leader = editRolesVal.includes('pegawai') && editTeamAssignments[t.id] ? editingUser.name : '';
        }
        return { ...t, members, leader };
      });
      setTeams(updatedTeams);

      setEditingUser(null);
      alert('Peran pengguna berhasil diperbarui!');
    } catch (err) {
      alert('Gagal memperbarui peran: ' + err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    const userToDelete = users.find(u => u.id === id);
    if (!userToDelete) return;
    try {
      await api.deleteUser(id);
      
      setTeams(prevTeams => prevTeams.map(t => ({
        ...t,
        members: t.members.filter(m => m !== userToDelete.name),
        leader: t.leader === userToDelete.name ? '' : t.leader
      })));
      
      await fetchUsers();
      alert('Pengguna berhasil dihapus!');
    } catch (err) {
      alert('Gagal menghapus pengguna: ' + err.message);
    }
  };

  const tabs = [
    { id: 'semua', label: 'Semua', count: users.length },
    { id: 'admin', label: 'Admin', count: users.filter(u => u.roles?.includes('admin')).length },
    { id: 'helpdesk', label: 'Helpdesk', count: users.filter(u => u.roles?.includes('helpdesk')).length },
    { id: 'pegawai', label: 'Pegawai', count: users.filter(u => u.roles?.includes('pegawai')).length },
    { id: 'user', label: 'OPD', count: users.filter(u => u.roles?.includes('user')).length },
    { id: 'masyarakat', label: 'Masyarakat', count: users.filter(u => u.roles?.includes('masyarakat')).length }
  ];

  const filteredUsers = (activeTab === 'semua' 
    ? users 
    : users.filter(u => u.roles?.includes(activeTab))
  ).filter(u => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (u.name || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query) ||
      (u.department || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8 font-sans text-left animate-in fade-in duration-200">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Pengguna</h2>
          <p className="text-slate-500 text-base leading-relaxed">Kelola hak akses role pengguna secara dinamis dan kelola instansi dinas terkait.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap -mb-px ${
                isActive 
                  ? 'border-sky-600 text-sky-600 bg-sky-50/50 rounded-t-lg' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                isActive ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative max-w-md w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama, email, atau unit kerja..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-650"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold text-base">Tidak ada data pengguna dalam kategori ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Nama</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Unit Kerja</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-base text-slate-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4 font-bold text-slate-800">{u.name}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 text-left">
                        {u.roles?.map(r => (
                          <span key={r} className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                            r === 'admin' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            r === 'helpdesk' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            r === 'pegawai' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                            r === 'masyarakat' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            'bg-sky-50 text-sky-700 border border-sky-100'
                          }`}>
                            {r === 'user' ? 'OPD' : r === 'pegawai' ? 'Pegawai' : r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">{u.department}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleStartEdit(u)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingUserId(u.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-slate-100 shadow-2xl space-y-4 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-lg">Edit Hak Akses Pengguna</h3>
              <button onClick={() => setEditingUser(null)} className="p-1 text-slate-400 hover:text-slate-655 hover:bg-slate-50 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Identitas Pengguna</span>
                  <span className="text-[10px] font-extrabold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" /> {editingUser.role === 'masyarakat' || editingUser.roles?.includes('masyarakat') ? 'Akun Mandiri' : 'Data Sinkron'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2.5 text-left">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nama Lengkap</span>
                    <p className="text-sm font-extrabold text-slate-800">{editingUser.name}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email Akun</span>
                    <p className="text-sm font-semibold text-slate-700">{editingUser.email}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {editingUser.role === 'masyarakat' || editingUser.roles?.includes('masyarakat') ? 'Kategori Pemohon' : 'Unit Kerja / Instansi'}
                    </span>
                    <p className="text-sm font-extrabold text-sky-700">{editingUser.department}</p>
                  </div>
                </div>
                {!(editingUser.role === 'masyarakat' || editingUser.roles?.includes('masyarakat')) && (
                  <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-200/50 leading-relaxed">
                    * Nama, email, dan unit kerja tersinkronisasi otomatis dari akun resmi instansi dan tidak dapat diubah manual oleh admin.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Hak Akses / Peran</label>
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200 space-y-2">
                  {[
                    { key: 'admin', label: 'Admin' },
                    { key: 'helpdesk', label: 'Helpdesk' },
                    { key: 'pegawai', label: 'Pegawai (Teknisi)' },
                    { key: 'user', label: 'User (OPD / Dinas)' },
                    { key: 'masyarakat', label: 'Masyarakat' }
                  ].map((item) => {
                    const isChecked = editRolesVal.includes(item.key);
                    
                    let isDisabled = false;
                    if (item.key === 'user') {
                      if (editingUser.roles?.includes('user') || editingUser.roles?.includes('masyarakat')) {
                        isDisabled = true;
                      }
                    } else if (item.key === 'masyarakat') {
                      if (editingUser.roles?.includes('masyarakat') || editingUser.roles?.includes('user')) {
                        isDisabled = true;
                      }
                    }

                    return (
                      <div key={item.key} className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id={`edit-role-${item.key}`}
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={() => handleToggleRoleCheckbox(item.key)}
                          className={`w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer ${
                            isDisabled ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                        />
                        <label 
                          htmlFor={`edit-role-${item.key}`} 
                          className={`text-xs font-bold text-slate-700 cursor-pointer select-none ${
                            isDisabled ? 'text-slate-450 cursor-not-allowed' : ''
                          }`}
                        >
                          {item.label} {isDisabled && isChecked && <span className="text-[9px] text-slate-400 font-medium font-mono">(Bawaan / Locked)</span>}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {editRolesVal.includes('pegawai') && (
                <div className="space-y-2 pt-1.5 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Penugasan Tim Kerja Pelaksana (Wajib)</label>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2 max-h-40 overflow-y-auto">
                    {teams.map(t => {
                      const isAssigned = editTeamAssignments[t.id];
                      return (
                        <div key={t.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`edit-team-${t.id}`}
                            checked={!!isAssigned}
                            onChange={(e) => {
                              setEditTeamAssignments({
                                ...editTeamAssignments,
                                [t.id]: e.target.checked
                              });
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                          <label htmlFor={`edit-team-${t.id}`} className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                            {t.name}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2 px-4 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex-1 py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold transition-all"
              >
                Simpan Peran
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingUserId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 border border-slate-100 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-100 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-lg">Yakin untuk menghapus?</h3>
              <p className="text-sm text-slate-550">Tindakan ini tidak dapat dibatalkan dan akun pengguna akan dihapus permanen dari sistem prototype.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUserId(null)}
                className="flex-1 py-2 px-4 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteUser(deletingUserId);
                  setDeletingUserId(null);
                  alert('Pengguna berhasil dihapus.');
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
