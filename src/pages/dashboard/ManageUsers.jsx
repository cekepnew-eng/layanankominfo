import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, X, Users, Building, Mail, Search, Lock, KeyRound, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ActionModal } from '../../components/ActionModal';
import { getPasswordStrength } from '../../utils/passwordStrength';

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
      const normalizedUsers = userList.map((u) => {
        const roles = Array.isArray(u.roles) && u.roles.length
          ? u.roles.map(role => String(role).toUpperCase())
          : [String(u.role || 'USER').toUpperCase()];
        const role = ['ADMIN', 'HELPDESK', 'PEGAWAI', 'USER', 'MASYARAKAT']
          .find(candidate => roles.includes(candidate)) || roles[0];
        return {
          ...u,
          roles,
          role,
          department: u.department || u.team || 'Dinas Komunikasi dan Informatika'
        };
      });
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
  const [userSortOrder, setUserSortOrder] = useState('newest');

  const [editingUser, setEditingUser] = useState(null);
  const [editRoleVal, setEditRoleVal] = useState('user');
  const [editRolesVal, setEditRolesVal] = useState([]);
  const [editTeamAssignments, setEditTeamAssignments] = useState({});

  const [showAddModal, setShowAddModal] = useState(false);
  const [newMasyarakatData, setNewMasyarakatData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    roleName: 'MASYARAKAT',
    roleNames: ['MASYARAKAT'],
    department: '',
    teamIds: []
  });
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [masyarakatFormError, setMasyarakatFormError] = useState('');
  const [showMasyarakatPassword, setShowMasyarakatPassword] = useState(false);
  const [showMasyarakatPasswordConfirmation, setShowMasyarakatPasswordConfirmation] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    cancelText: 'Batal',
    onConfirm: null
  });

  const {
    requirements: manualPasswordRequirements,
    level: manualPasswordLevel,
    color: manualPasswordColor,
    textColor: manualPasswordTextColor,
    isStrong: masyarakatPasswordIsValid
  } = getPasswordStrength(newMasyarakatData.password);
  const masyarakatPasswordConfirmationMismatch = Boolean(
    newMasyarakatData.confirmPassword &&
    newMasyarakatData.password !== newMasyarakatData.confirmPassword
  );

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

    const isMasyarakat = Boolean(
      u.department === 'Masyarakat Umum' ||
      u.department === 'Masyarakat' ||
      u.role?.toUpperCase() === 'MASYARAKAT' ||
      u.roles?.some(r => String(r).toUpperCase() === 'MASYARAKAT')
    );

    let initialRoles = (u.roles || [u.role || 'user']).map(r => r.toLowerCase());
    if (isMasyarakat) {
      initialRoles = ['masyarakat'];
    } else {
      initialRoles = initialRoles.filter(r => r !== 'masyarakat');
      if (!initialRoles.includes('user')) {
        initialRoles.push('user');
      }
    }
    setEditRolesVal(initialRoles);

    const initialAssignments = {};
    if (u.team_id) {
      initialAssignments[u.team_id] = true;
    }
    setEditTeamAssignments(initialAssignments);
  };

  const handleToggleRoleCheckbox = (roleKey) => {
    const isMasyarakat = Boolean(
      editingUser?.department === 'Masyarakat Umum' ||
      editingUser?.department === 'Masyarakat' ||
      editingUser?.role?.toUpperCase() === 'MASYARAKAT' ||
      editingUser?.roles?.some(r => String(r).toUpperCase() === 'MASYARAKAT')
    );

    if (isMasyarakat) {
      // Akun Masyarakat Umum tidak dapat diubah ke OPD/staf
      return;
    }

    if (roleKey === 'masyarakat') {
      // Akun OPD / Instansi tidak dapat diubah menjadi Masyarakat
      return;
    }

    if (roleKey === 'user') {
      // User (OPD / Dinas) adalah peran dasar instansi dan wajib aktif
      return;
    }

    setEditRolesVal(prev => {
      let newRoles = prev.includes(roleKey)
        ? prev.filter(r => r !== roleKey)
        : [...prev, roleKey];

      newRoles = newRoles.filter(r => r !== 'masyarakat');
      if (!newRoles.includes('user')) {
        newRoles.push('user');
      }

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
    if (newMasyarakatData.roleNames.length === 0) {
      setMasyarakatFormError('Pilih minimal satu role untuk akun baru.');
      return;
    }
    if (!masyarakatPasswordIsValid) {
      setMasyarakatFormError('Password harus memenuhi semua kriteria hingga level Kuat.');
      return;
    }
    if (masyarakatPasswordConfirmationMismatch || !newMasyarakatData.confirmPassword) {
      setMasyarakatFormError('Konfirmasi password tidak cocok.');
      return;
    }
    if (newMasyarakatData.roleNames.includes('PEGAWAI') && newMasyarakatData.teamIds.length === 0) {
      setMasyarakatFormError('Pilih minimal satu tim kerja untuk akun Pegawai.');
      return;
    }
    if (!newMasyarakatData.roleNames.includes('MASYARAKAT') && !newMasyarakatData.department.trim()) {
      setMasyarakatFormError('Nama instansi/perangkat daerah wajib diisi.');
      return;
    }
    try {
      const rolePriority = ['ADMIN', 'HELPDESK', 'PEGAWAI', 'USER', 'MASYARAKAT'];
      const roleName = rolePriority.find(role => newMasyarakatData.roleNames.includes(role));
      await api.createManualUser({ ...newMasyarakatData, roleName });
      setShowAddModal(false);
      setNewMasyarakatData({ fullName: '', email: '', password: '', confirmPassword: '', roleName: 'MASYARAKAT', roleNames: ['MASYARAKAT'], department: '', teamIds: [] });
      setMasyarakatFormError('');
      setIsRoleDropdownOpen(false);
      setShowMasyarakatPassword(false);
      setShowMasyarakatPasswordConfirmation(false);
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
      setMasyarakatFormError(err.message || 'Gagal menambahkan pengguna. Silakan coba kembali.');
    }
  };

  const closeAddUserModal = () => {
    setShowAddModal(false);
    setNewMasyarakatData({ fullName: '', email: '', password: '', confirmPassword: '', roleName: 'MASYARAKAT', roleNames: ['MASYARAKAT'], department: '', teamIds: [] });
    setMasyarakatFormError('');
    setIsRoleDropdownOpen(false);
    setShowMasyarakatPassword(false);
    setShowMasyarakatPasswordConfirmation(false);
  };

  const handleSaveEdit = async () => {
    const isMasyarakat = Boolean(
      editingUser?.department === 'Masyarakat Umum' ||
      editingUser?.department === 'Masyarakat' ||
      editingUser?.role?.toUpperCase() === 'MASYARAKAT' ||
      editingUser?.roles?.some(r => String(r).toUpperCase() === 'MASYARAKAT')
    );

    let finalRoles = isMasyarakat ? ['masyarakat'] : editRolesVal.filter(r => r !== 'masyarakat');
    if (!isMasyarakat && !finalRoles.includes('user')) {
      finalRoles.push('user');
    }

    const assignedTeamIds = Object.keys(editTeamAssignments).filter(id => editTeamAssignments[id]);

    if (finalRoles.includes('pegawai') && assignedTeamIds.length === 0) {
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

    const primaryRole = finalRoles[0] || (isMasyarakat ? 'masyarakat' : 'user');
    const primaryTeamId = assignedTeamIds.length > 0 ? assignedTeamIds[0] : null;

    try {
      await api.updateUserRole(editingUser.id, { roleNames: finalRoles, team_id: primaryTeamId });
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
          message: 'Anda baru saja mengubah hak akses akun Anda sendiri. Demi keamanan dan sinkronisasi dashboard, sistem akan mengarahkan Anda untuk login ulang.',
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
      (u.nip || '').toLowerCase().includes(query) ||
      (u.department || '').toLowerCase().includes(query)
    );
  });
  const sortedFilteredUsers = [...filteredUsers].sort((a, b) => {
    if (userSortOrder === 'name-asc' || userSortOrder === 'name-desc') {
      const nameOrder = String(a.name || '').localeCompare(String(b.name || ''), 'id', { sensitivity: 'base' });
      return userSortOrder === 'name-asc' ? nameOrder : -nameOrder;
    }

    const timeA = Date.parse(a.created_at || '');
    const timeB = Date.parse(b.created_at || '');
    const hasDateA = Number.isFinite(timeA);
    const hasDateB = Number.isFinite(timeB);
    if (hasDateA !== hasDateB) return hasDateA ? -1 : 1;
    if (hasDateA && timeA !== timeB) {
      return userSortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    }
    return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
  });

  const handleToggleNewUserRole = (roleName) => {
    setNewMasyarakatData(current => {
      const selectedRoles = current.roleNames || [];
      let roleNames;
      if (roleName === 'MASYARAKAT') {
        roleNames = selectedRoles.includes(roleName) ? [] : ['MASYARAKAT'];
      } else if (roleName === 'USER' && selectedRoles.includes('MASYARAKAT')) {
        roleNames = ['USER'];
      } else if (selectedRoles.includes('MASYARAKAT')) {
        roleNames = [roleName];
      } else {
        roleNames = selectedRoles.includes(roleName)
          ? selectedRoles.filter(role => role !== roleName)
          : [...selectedRoles, roleName];
      }

      return {
        ...current,
        roleNames,
        department: roleNames.includes('MASYARAKAT') ? '' : current.department || 'Dinas Komunikasi dan Informatika',
        teamIds: roleNames.includes('PEGAWAI') ? current.teamIds : []
      };
    });
    setMasyarakatFormError('');
  };

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

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, email, NIP, atau unit kerja..."
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
        <label className="flex items-center gap-2 text-xs font-bold text-slate-500">
          Urutkan
          <select
            value={userSortOrder}
            onChange={event => setUserSortOrder(event.target.value)}
            className="min-w-48 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="newest">Terbaru dibuat</option>
            <option value="oldest">Terlama dibuat</option>
            <option value="name-asc">Nama A–Z</option>
            <option value="name-desc">Nama Z–A</option>
          </select>
        </label>
      </div>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap -mb-px ${isActive
                  ? 'border-sky-600 text-sky-600 bg-sky-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
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
                  <th className="px-6 py-4">Email / NIP</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Unit Kerja</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-base text-slate-700">
                {sortedFilteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4 font-bold text-slate-800">{u.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">
                          {u.email && !/^\d{10,}$/.test(u.email) ? u.email : (u.email || '-')}
                        </span>
                        {u.nip && u.nip !== u.email ? (
                          <span className="text-xs text-slate-500 font-mono mt-0.5">
                            NIP: {u.nip}
                          </span>
                        ) : (/^\d{10,}$/.test(u.email || '') ? (
                          <span className="text-xs text-slate-500 font-mono mt-0.5">
                            NIP: {u.email}
                          </span>
                        ) : null)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 text-left">
                        {u.roles?.map(r => {
                          const rLower = r.toLowerCase();
                          return (
                            <span key={r} className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${rLower === 'admin' ? 'bg-rose-50 text-rose-700 border-rose-100' :
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
                    <p className="text-sm font-semibold text-slate-700">{editingUser.email || '-'}</p>
                  </div>
                  {editingUser.nip && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">NIP</span>
                      <p className="text-sm font-mono font-semibold text-slate-700">{editingUser.nip}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {editingUser.role?.toUpperCase() === 'USER' || editingUser.roles?.some(r => r.toUpperCase() === 'USER') ? 'Kategori Pemohon' : 'Unit Kerja / Instansi'}
                    </span>
                    <p className="text-sm font-extrabold text-sky-700">{editingUser.department}</p>
                  </div>
                </div>
                {(() => {
                  const isMasyarakatUser = Boolean(
                    editingUser.department === 'Masyarakat Umum' ||
                    editingUser.department === 'Masyarakat' ||
                    editingUser.role?.toUpperCase() === 'MASYARAKAT' ||
                    editingUser.roles?.some(r => String(r).toUpperCase() === 'MASYARAKAT')
                  );
                  return isMasyarakatUser ? (
                    <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-semibold leading-relaxed">
                      * Akun Masyarakat Umum terdaftar secara mandiri dan tidak dapat diubah menjadi akun OPD atau dinas.
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-200/50 leading-relaxed">
                      * Nama, email, dan unit kerja tersinkronisasi otomatis dari akun resmi instansi dan tidak dapat diubah manual oleh admin.
                    </p>
                  );
                })()}
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
                    const isMasyarakatUser = Boolean(
                      editingUser.department === 'Masyarakat Umum' ||
                      editingUser.department === 'Masyarakat' ||
                      editingUser.role?.toUpperCase() === 'MASYARAKAT' ||
                      editingUser.roles?.some(r => String(r).toUpperCase() === 'MASYARAKAT')
                    );

                    let isDisabled = false;
                    if (isMasyarakatUser) {
                      // Akun Masyarakat Umum tidak dapat diubah ke OPD/staf manapun
                      isDisabled = true;
                    } else {
                      // Akun OPD / Instansi tidak dapat diubah menjadi Masyarakat
                      if (item.key === 'masyarakat') {
                        isDisabled = true;
                      } else if (item.key === 'user') {
                        // User (OPD / Dinas) adalah peran dasar instansi dan wajib aktif
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
                          className={`w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                        />
                        <label
                          htmlFor={`edit-role-${item.key}`}
                          className={`text-xs font-bold select-none ${isDisabled ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 cursor-pointer'
                            }`}
                        >
                          {item.label}
                          {isDisabled && !isChecked && (
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
          <div className="bg-white max-h-[calc(100dvh-2rem)] max-w-lg w-full overflow-y-auto overscroll-contain rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-2xl space-y-5 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-xl tracking-tight">Tambah User Manual</h3>
              <button onClick={closeAddUserModal} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserManual} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Role Akun</label>
                <div className="relative">
                  <button
                    type="button"
                    aria-expanded={isRoleDropdownOpen}
                    onClick={() => setIsRoleDropdownOpen(open => !open)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left text-sm font-semibold focus:ring-2 focus:ring-sky-500"
                  >
                    <span className={newMasyarakatData.roleNames.length ? 'text-slate-800' : 'text-slate-400'}>
                      {newMasyarakatData.roleNames.length
                        ? newMasyarakatData.roleNames.map(role => role === 'USER' ? 'OPD' : role === 'PEGAWAI' ? 'Pegawai' : role === 'MASYARAKAT' ? 'Masyarakat' : role).join(', ')
                        : 'Pilih satu atau beberapa role'}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isRoleDropdownOpen && (
                    <div className="mt-1 space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                      {[
                        { value: 'ADMIN', label: 'Admin' },
                        { value: 'HELPDESK', label: 'Helpdesk' },
                        { value: 'PEGAWAI', label: 'Pegawai' },
                        { value: 'USER', label: 'OPD' },
                        { value: 'MASYARAKAT', label: 'Masyarakat' }
                      ].map(role => {
                        const selected = newMasyarakatData.roleNames.includes(role.value);
                        const masyarakatSelected = newMasyarakatData.roleNames.includes('MASYARAKAT');
                        const isIncompatible = role.value === 'MASYARAKAT'
                          ? newMasyarakatData.roleNames.some(value => value !== 'MASYARAKAT')
                          : masyarakatSelected;
                        return (
                          <label key={role.value} className={`flex items-center gap-2 text-sm font-semibold ${isIncompatible ? 'cursor-not-allowed text-slate-400' : 'cursor-pointer text-slate-700'}`}>
                            <input
                              type="checkbox"
                              checked={selected}
                              disabled={isIncompatible}
                              onChange={() => handleToggleNewUserRole(role.value)}
                              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 disabled:cursor-not-allowed"
                            />
                            {role.label}
                          </label>
                        );
                      })}
                      <p className="border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                        Role Masyarakat tidak dapat digabung dengan role lainnya.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Lengkap</label>
                <input
                  required
                  maxLength={255}
                  type="text"
                  value={newMasyarakatData.fullName}
                  onChange={event => setNewMasyarakatData({ ...newMasyarakatData, fullName: event.target.value })}
                  autoComplete="name"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 text-sm font-semibold"
                />
              </div>
              {!newMasyarakatData.roleNames.includes('MASYARAKAT') && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Instansi / Perangkat Daerah</label>
                  <input
                    required
                    maxLength={255}
                    type="text"
                    value={newMasyarakatData.department}
                    onChange={event => setNewMasyarakatData(current => ({ ...current, department: event.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 text-sm font-semibold"
                  />
                </div>
              )}
              {newMasyarakatData.roleNames.includes('PEGAWAI') && (
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Penugasan Tim Kerja Pelaksana (Wajib)</label>
                  <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {teams.map(team => (
                      <label key={team.id} className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={newMasyarakatData.teamIds.includes(String(team.id))}
                          onChange={event => {
                            setNewMasyarakatData(current => ({
                              ...current,
                              teamIds: event.target.checked
                                ? [...current.teamIds, String(team.id)]
                                : current.teamIds.filter(id => id !== String(team.id))
                            }));
                            setMasyarakatFormError('');
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        {team.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                <input
                  required
                  maxLength={255}
                  type="email"
                  value={newMasyarakatData.email}
                  onChange={event => setNewMasyarakatData({ ...newMasyarakatData, email: event.target.value })}
                  autoComplete="email"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password Akun</label>
                <div className="relative">
                  <input
                    required
                    minLength={8}
                    type={showMasyarakatPassword ? 'text' : 'password'}
                    value={newMasyarakatData.password}
                    onChange={event => {
                      setNewMasyarakatData({ ...newMasyarakatData, password: event.target.value });
                      setMasyarakatFormError('');
                    }}
                    autoComplete="new-password"
                    aria-invalid={Boolean(newMasyarakatData.password && !masyarakatPasswordIsValid)}
                    aria-describedby="masyarakat-password-feedback"
                    className={`w-full rounded-xl border p-3 pr-12 text-sm font-semibold focus:ring-2 focus:ring-sky-500 ${newMasyarakatData.password && !masyarakatPasswordIsValid
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-slate-200'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowMasyarakatPassword(value => !value)}
                    aria-label={showMasyarakatPassword ? 'Sembunyikan password' : 'Lihat password'}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-sky-600"
                  >
                    {showMasyarakatPassword
                      ? <EyeOff className="h-5 w-5" />
                      : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p
                  id="masyarakat-password-feedback"
                  className={`mt-1.5 text-xs font-semibold ${newMasyarakatData.password && !masyarakatPasswordIsValid
                      ? 'text-rose-600'
                      : masyarakatPasswordIsValid ? 'text-emerald-600' : 'text-slate-500'
                    }`}
                  aria-live="polite"
                >
                  {!newMasyarakatData.password
                    ? 'Gunakan minimal 8 karakter, huruf kapital di awal, angka, dan simbol.'
                    : masyarakatPasswordIsValid
                      ? 'Password sudah memenuhi kriteria level Kuat.'
                      : 'Lengkapi semua kriteria agar password mencapai level Kuat.'}
                </p>
                {newMasyarakatData.password && (
                  <div className="mt-2 space-y-2" aria-live="polite">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">Kekuatan kata sandi</span>
                      <span className={`text-[11px] font-bold ${manualPasswordTextColor}`}>{manualPasswordLevel}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1" aria-hidden="true">
                      {manualPasswordRequirements.map((requirement, index) => (
                        <span
                          key={index}
                          className={`h-1.5 rounded-full ${requirement.met ? manualPasswordColor : 'bg-slate-200'}`}
                        />
                      ))}
                    </div>
                    <div className="space-y-1">
                      {manualPasswordRequirements.map((requirement, index) => (
                        <div key={index} className="flex items-center gap-1.5">
                          <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-black ${requirement.met
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-slate-100 text-slate-400'
                            }`}>
                            {requirement.met ? '✓' : '○'}
                          </span>
                          <span className={`text-[11px] font-semibold ${requirement.met ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {requirement.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Konfirmasi Password</label>
                <div className="relative">
                  <input
                    required
                    minLength={8}
                    type={showMasyarakatPasswordConfirmation ? 'text' : 'password'}
                    value={newMasyarakatData.confirmPassword}
                    onChange={event => {
                      setNewMasyarakatData({ ...newMasyarakatData, confirmPassword: event.target.value });
                      setMasyarakatFormError('');
                    }}
                    autoComplete="new-password"
                    aria-invalid={masyarakatPasswordConfirmationMismatch}
                    aria-describedby="masyarakat-password-confirmation-feedback"
                    className={`w-full rounded-xl border p-3 pr-12 text-sm font-semibold focus:ring-2 focus:ring-sky-500 ${masyarakatPasswordConfirmationMismatch
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-slate-200'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowMasyarakatPasswordConfirmation(value => !value)}
                    aria-label={showMasyarakatPasswordConfirmation ? 'Sembunyikan konfirmasi password' : 'Lihat konfirmasi password'}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-sky-600"
                  >
                    {showMasyarakatPasswordConfirmation
                      ? <EyeOff className="h-5 w-5" />
                      : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p
                  id="masyarakat-password-confirmation-feedback"
                  className={`mt-1.5 text-xs font-semibold ${masyarakatPasswordConfirmationMismatch ? 'text-rose-600' :
                      newMasyarakatData.confirmPassword ? 'text-emerald-600' : 'text-slate-500'
                    }`}
                  aria-live="polite"
                >
                  {masyarakatPasswordConfirmationMismatch
                    ? 'Konfirmasi password belum sama dengan password di atas.'
                    : newMasyarakatData.confirmPassword
                      ? 'Konfirmasi password cocok.'
                      : 'Masukkan kembali password yang sama.'}
                </p>
              </div>
              {masyarakatFormError && (
                <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                  {masyarakatFormError}
                </p>
              )}
              <p className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm font-medium text-sky-800">
                Akun dibuat dengan role {newMasyarakatData.roleNames.map(role => role === 'USER' ? 'OPD' : role === 'PEGAWAI' ? 'Pegawai' : role === 'MASYARAKAT' ? 'Masyarakat' : role).join(', ') || 'belum dipilih'}. Password berlaku selama satu tahun.
              </p>
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={closeAddUserModal} className="flex-1 py-3 px-5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm sm:text-base font-bold text-slate-700 transition-all cursor-pointer">Batal</button>
                <button
                  type="submit"
                  disabled={!masyarakatPasswordIsValid || !newMasyarakatData.confirmPassword || masyarakatPasswordConfirmationMismatch}
                  className="flex-1 py-3 px-5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm sm:text-base font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  Buat Akun
                </button>
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
