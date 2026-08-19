import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ManageUsers = () => {
  const { users, setUsers, teams, setTeams } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [department, setDepartment] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [activeTab, setActiveTab] = useState('semua');

  const handleAddUser = (e) => {
    e.preventDefault();

    if (role === 'pegawai' && !selectedTeamId) {
      alert('Harap pilih Tim Kerja Pelaksana untuk pegawai!');
      return;
    }

    let deptVal = department;
    if (role === 'pegawai') {
      const targetTeam = teams.find(t => String(t.id) === String(selectedTeamId));
      if (targetTeam) {
        deptVal = `Diskominfo Kota Bogor (${targetTeam.name})`;

        const updatedTeams = teams.map(t => {
          if (String(t.id) === String(selectedTeamId)) {
            return {
              ...t,
              members: [...t.members, name]
            };
          }
          return t;
        });
        setTeams(updatedTeams);
      }
    }

    const newUser = {
      id: users.length + 1,
      name,
      email,
      role,
      department: deptVal
    };

    setUsers([...users, newUser]);

    setName('');
    setEmail('');
    setRole('user');
    setDepartment('');
    setSelectedTeamId('');
    setShowAddForm(false);
  };

  const handleDeleteUser = (id) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const tabs = [
    { id: 'semua', label: 'Semua', count: users.length },
    { id: 'admin', label: 'Admin', count: users.filter(u => u.role === 'admin').length },
    { id: 'helpdesk', label: 'Helpdesk', count: users.filter(u => u.role === 'helpdesk').length },
    { id: 'pegawai', label: 'Pegawai', count: users.filter(u => u.role === 'pegawai').length },
    { id: 'user', label: 'User OPD', count: users.filter(u => u.role === 'user').length }
  ];

  const filteredUsers = activeTab === 'semua' 
    ? users 
    : users.filter(u => u.role === activeTab);

  return (
    <div className="space-y-8 font-sans text-left">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Pengguna</h2>
          <p className="text-slate-505 text-base leading-relaxed">Daftarkan akun baru, atur role pengguna, dan kelola instansi dinas terkait.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-base font-bold transition-all"
        >
          {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          <span>{showAddForm ? 'Batal' : 'Tambah User'}</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddUser} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-xl">
          <h3 className="font-extrabold text-slate-800 text-lg">Tambah Akun Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-555 uppercase tracking-wider mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Lengkap"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-555 uppercase tracking-wider mb-1">Email Dinas</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh@bogor.go.id"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-555 uppercase tracking-wider mb-1">Hak Akses / Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="admin">Admin</option>
                <option value="helpdesk">Helpdesk</option>
                <option value="pegawai">Pegawai (Teknisi)</option>
                <option value="user">User (OPD / Dinas)</option>
              </select>
            </div>
            {role !== 'pegawai' ? (
              <div>
                <label className="block text-sm font-bold text-slate-555 uppercase tracking-wider mb-1">Instansi / Unit Kerja</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Dinas Pendidikan / Bidang Aplikasi"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-slate-555 uppercase tracking-wider mb-1">Pilih Tim Kerja Pelaksana</label>
                <select
                  required
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">-- Pilih Tim Kerja --</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-base font-bold transition-all"
          >
            Simpan User
          </button>
        </form>
      )}

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

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold text-base">Tidak ada data pengguna dalam kategori ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="text-left text-sm font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
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
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize tracking-wide ${
                        u.role === 'admin' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        u.role === 'helpdesk' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        u.role === 'pegawai' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        'bg-sky-50 text-sky-700 border border-sky-100'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">{u.department}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
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
    </div>
  );
};
