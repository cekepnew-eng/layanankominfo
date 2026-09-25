import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, X, Users, Building, Mail, Search, Lock, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ActionModal } from '../../components/ActionModal';

export const ManageUsers = () => {
  const { teams, setTeams, fetchTeams, user, setUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      const userList = response?.data || response?.users || [];
      const normalizedUsers = userList.map((u) => ({
        ...u,
        roles: Array.isArray(u.roles) ? u.roles.map(r => String(r).toUpperCase()) : [String(u.role || 'USER').toUpperCase()],
        role: String(u.role || u.roles?.[0] || 'USER').toUpperCase(),
        department: u.department || u.team || 'Dinas Komunikasi dan Informatika'
      }));
      setUsers(normalizedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
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

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    full_name: '', email: '', password: '', department: '', roleName: 'USER'
  });

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    cancelText: 'Batal',
    onConfirm: null
  });

  useEffect(() => {
    if (editingUser) {
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
  }, [editingUser]);

  const handleStartEdit = (u) => {
    setEditingUser(u);
    setEditRoleVal((u.role || 'user').toLowerCase());
    
    let initialRoles = (u.roles || [u.role || 'user']).map(r => r.toLowerCase());
    if (initialRoles.some(r => r !== 'masyarakat' && r !== 'user')) {
      if (!initialRoles.includes('user')) initialRoles.push('user');
    }
    setEditRolesVal(initialRoles);

    const initialAssignments = {};
    if (u.team_id) {
       initialAssignments[u.team_id] = true;
    }
    setEditTeamAssignments(initialAssignments);
  };

  const handleToggleRoleCheckbox = (roleKey) => {
    setEditRolesVal(prev => {
      let newRoles = prev.includes(roleKey) 
        ? prev.filter(r => r !== roleKey) 
        : [...prev, roleKey];
        
      if (roleKey === 'masyarakat' && !prev.includes('masyarakat')) {
        newRoles = ['masyarakat'];
      } else if (roleKey !== 'masyarakat' && !prev.includes(roleKey)) {
        newRoles = newRoles.filter(r => r !== 'masyarakat');
      }

      if (newRoles.some(r => r !== 'masyarakat' && r !== 'user')) {
        if (!newRoles.includes('user')) newRoles.push('user');
      }

      if (newRoles.length === 0) newRoles = ['masyarakat']; // Fallback

      return newRoles;
    });
  };

  useEffect(() => {
    if (editingUser || showAddModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [editingUser, showAddModal]);

  const handleAddUserManual = async (e) => {
    e.preventDefault();
    try {
      await api.createUserManual(newUserData);
      setShowAddModal(false);
      setNewUserData({ full_name: '', email: '', password: '', department: '', roleName: 'USER' });
      await fetchUsers();
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Pengguna Berhasil Ditambahkan',
        message: 'Pengguna baru telah berhasil ditambahkan.',
        confirmText: 'Selesai',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    } catch (err) {
      alert('Gagal menambahkan pengguna: ' + err.message);
    }
  };

  const handleSaveEdit = async () => {
    const assignedTeamIds = Object.keys(editTeamAssignments).filter(id => editTeamAssignments[id]);

    if (editRolesVal.includes('pegawai') && assignedTeamIds.length === 0) {
      setModalConfig({
        isOpen: true,
        type: 'warning',
        title: 'Penugasan Tim Belum Dipilih',
        message: 'Pengguna dengan peran Pegawai wajib ditugaskan ke minimal satu Tim Kerja Pelaksana Teknis.',
        confirmText: 'Pilih Tim',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    const primaryRole = editRolesVal[0] || 'user';
    const primaryTeamId = assignedTeamIds.length > 0 ? assignedTeamIds[0] : null;

    try {
      await api.updateUserRole(editingUser.id, { roleNames: editRolesVal, team_id: primaryTeamId });
      await fetchUsers(); // Refresh from DB
      if (fetchTeams) {
        await fetchTeams();
      }

      if (editingUser.id === user.id) {
        setEditingUser(null);
        setModalConfig({
          isOpen: true,
          type: 'warning',
          title: 'Sesi Diperbarui',
          message: 'Anda baru saja mengubah hak akses akun Anda sendiri. Demi keamanan dan sinkronisasi dasbor, sistem akan mengarahkan Anda untuk login ulang.',
          confirmText: 'Login Ulang',
          cancelText: '',
          onConfirm: () => {
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            setUser(null);
            localStorage.removeItem('spbe_user');
            localStorage.removeItem('spbe_token');
            window.location.href = '/auth/login';
          }
        });
        return;
      }

      setEditingUser(null);
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Peran Berhasil Diperbarui',
        message: 'Hak akses dan penugasan tim pengguna telah berhasil disesuaikan.',
        confirmText: 'Selesai',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    } catch (err) {
      alert('Gagal memperbarui peran: ' + err.message);
    }
  };

  const handlePromptDeleteUser = (u) => {
    setModalConfig({
      isOpen: true,
      type: 'danger',
      title: 'Konfirmasi Hapus Pengguna',
      message: `Apakah Anda yakin ingin menghapus akun "${u.name}" (${u.email}) secara permanen dari sistem? Seluruh hak akses dan keterlibatan tim akan dibatalkan.`,
      confirmText: 'Ya, Hapus Akun',
      cancelText: 'Batal',
      onConfirm: () => executeDeleteUser(u.id)
    });
  };

  const executeDeleteUser = async (id) => {
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
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Pengguna Berhasil Dihapus',
        message: 'Akun pengguna telah berhasil dihapus secara permanen dari sistem.',
        confirmText: 'Selesai',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    } catch (err) {
      alert('Gagal menghapus pengguna: ' + err.message);
    }
  };

  const handlePromptReset2FA = (u) => {
    setModalConfig({
      isOpen: true,
      type: 'warning',
      title: 'Reset Autentikasi 2FA',
      message: `Apakah Anda yakin ingin mereset 2FA untuk akun "${u.name}"? Pengguna akan diminta memindai QR Code ulang saat login berikutnya.`,
      confirmText: 'Ya, Reset 2FA',
      cancelText: 'Batal',
      onConfirm: () => executeReset2FA(u.id)
    });
  };

  const executeReset2FA = async (id) => {
    try {
      await api.reset2FA(id);
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: '2FA Berhasil Direset',
        message: 'Autentikasi 2 Langkah untuk pengguna ini telah berhasil direset.',
        confirmText: 'Selesai',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    } catch (err) {
      alert('Gagal mereset 2FA: ' + err.message);
    }
  };

  const tabs = [
    { id: 'semua', label: 'Semua', count: users.length },
    { id: 'admin', label: 'Admin', count: users.filter(u => u.roles?.some(r => r.toLowerCase() === 'admin')).length },
    { id: 'helpdesk', label: 'Helpdesk', count: users.filter(u => u.roles?.some(r => r.toLowerCase() === 'helpdesk')).length },
    { id: 'pegawai', label: 'Pegawai', count: users.filter(u => u.roles?.some(r => r.toLowerCase() === 'pegawai')).length },
    { id: 'user', label: 'OPD', count: users.filter(u => u.roles?.some(r => r.toLowerCase() === 'user')).length },
    { id: 'masyarakat', label: 'Masyarakat', count: users.filter(u => u.roles?.some(r => r.toLowerCase() === 'masyarakat')).length }
  ];

  const filteredUsers = (activeTab === 'semua' 
    ? users 
    : users.filter(u => u.roles?.some(r => r.toLowerCase() === activeTab))
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
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer flex items-center gap-2"
        >
          <span>+ Tambah User Manual</span>
        </button>
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
          className="w-full pl-11 pr-4 py-3 glass-card rounded-2xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-sm"
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

      <div className="glass-card rounded-3xl border border-white/60 shadow-sm overflow-hidden">
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
                        {u.roles?.map(r => {
                          const rLower = r.toLowerCase();
                          return (
                          <span key={r} className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                            rLower === 'admin' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            rLower === 'helpdesk' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            rLower === 'pegawai' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                            rLower === 'masyarakat' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            'bg-sky-50 text-sky-700 border border-sky-100'
                          }`}>
                            {rLower === 'user' ? 'OPD' : rLower === 'pegawai' ? 'Pegawai' : r}
                          </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.department || (u.roles?.some(r => r.toLowerCase() === 'masyarakat') ? 'Masyarakat Umum' : '-')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleStartEdit(u)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-all"
                          title="Edit Pengguna"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handlePromptReset2FA(u)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-all"
                          title="Reset 2FA"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePromptDeleteUser(u)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                          title="Hapus Pengguna"
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
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white max-w-lg sm:max-w-xl w-full rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-2xl space-y-5 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-xl tracking-tight">Edit Hak Akses Pengguna</h3>
              <button onClick={() => setEditingUser(null)} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Identitas Pengguna</span>
                  <span className="text-[10px] font-extrabold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" /> {editingUser.role?.toUpperCase() === 'USER' || editingUser.roles?.some(r => r.toUpperCase() === 'USER') ? 'Akun Mandiri' : 'Data Sinkron'}
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
                      {editingUser.role?.toUpperCase() === 'USER' || editingUser.roles?.some(r => r.toUpperCase() === 'USER') ? 'Kategori Pemohon' : 'Unit Kerja / Instansi'}
                    </span>
                    <p className="text-sm font-extrabold text-sky-700">{editingUser.department}</p>
                  </div>
                </div>
                {!(editingUser.role?.toUpperCase() === 'USER' || editingUser.roles?.some(r => r.toUpperCase() === 'USER')) && (
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
                    if (item.key === 'masyarakat') {
                      if (editRolesVal.some(r => r !== 'masyarakat')) {
                        isDisabled = true;
                      }
                    } else if (item.key === 'user') {
                      if (editRolesVal.some(r => r !== 'masyarakat' && r !== 'user')) {
                        isDisabled = true; // Cannot uncheck if admin/helpdesk/pegawai
                      }
                    } else {
                      if (editRolesVal.includes('masyarakat')) {
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
                            isDisabled ? 'opacity-40 cursor-not-allowed' : ''
                          }`}
                        />
                        <label 
                          htmlFor={`edit-role-${item.key}`} 
                          className={`text-xs font-bold select-none ${
                            isDisabled ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 cursor-pointer'
                          }`}
                        >
                          {item.label}
                          {isDisabled && (
                            <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                              (Tidak Kompatibel)
                            </span>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {editRolesVal.includes('pegawai') && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
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

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex-1 py-3 px-5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm sm:text-base font-bold text-slate-700 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex-1 py-3 px-5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm sm:text-base font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer"
              >
                Simpan Peran
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-2xl space-y-5 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-xl tracking-tight">Tambah Pengguna Manual</h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUserManual} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Lengkap</label>
                <input required type="text" value={newUserData.full_name} onChange={e => setNewUserData({...newUserData, full_name: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 text-sm font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email / NIK</label>
                <input required type="text" value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 text-sm font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                <input required type="password" value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 text-sm font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">OPD / Instansi</label>
                <input required type="text" value={newUserData.department} onChange={e => setNewUserData({...newUserData, department: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 text-sm font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                <select value={newUserData.roleName} onChange={e => setNewUserData({...newUserData, roleName: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 text-sm font-semibold">
                  <option value="USER">User (OPD)</option>
                  <option value="PEGAWAI">Pegawai (Teknisi)</option>
                  <option value="HELPDESK">Helpdesk</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 px-5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm sm:text-base font-bold text-slate-700 transition-all cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 py-3 px-5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm sm:text-base font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer">Tambah User</button>
              </div>
            </form>
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
