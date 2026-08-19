import React, { useState } from 'react';
import { Plus, Users, User, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ManageTeams = () => {
  const { teams, setTeams } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [leader, setLeader] = useState('');
  const [membersText, setMembersText] = useState('');
  const [servicesText, setServicesText] = useState('');

  const handleAddTeam = (e) => {
    e.preventDefault();
    const newTeam = {
      id: teams.length + 1,
      name: teamName,
      leader,
      members: membersText.split(',').map(m => m.trim()).filter(Boolean),
      services: servicesText.split(',').map(s => s.trim()).filter(Boolean)
    };
    setTeams([...teams, newTeam]);

    setTeamName('');
    setLeader('');
    setMembersText('');
    setServicesText('');
    setShowAddForm(false);
  };

  const handleDeleteTeam = (id) => {
    setTeams(teams.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-8 font-sans text-left">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Tim Kerja</h2>
          <p className="text-slate-505 text-base leading-relaxed">Buat tim pelaksana teknis Diskominfo, tentukan ketua tim, dan hubungkan dengan klasifikasi layanan SPBE.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-base font-bold transition-all"
        >
          <span>{showAddForm ? 'Batal' : 'Buat Tim Kerja'}</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddTeam} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-xl">
          <h3 className="font-extrabold text-slate-800 text-lg">Buat Tim Kerja Baru</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-555 uppercase tracking-wider mb-1">Nama Tim Kerja</label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Contoh: Tim Keamanan Siber"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-555 uppercase tracking-wider mb-1">Ketua Tim / Koordinator</label>
              <input
                type="text"
                required
                value={leader}
                onChange={(e) => setLeader(e.target.value)}
                placeholder="Nama Ketua Tim"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-555 uppercase tracking-wider mb-1">Anggota Pegawai (Pisahkan dengan koma)</label>
              <input
                type="text"
                required
                value={membersText}
                onChange={(e) => setMembersText(e.target.value)}
                placeholder="Rian Hidayat, Sari Safitri, Deni Setiawan"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-555 uppercase tracking-wider mb-1">Layanan SPBE yang Ditangani (Pisahkan dengan koma)</label>
              <input
                type="text"
                required
                value={servicesText}
                onChange={(e) => setServicesText(e.target.value)}
                placeholder="Jaringan Intra Pemerintah, Wifi Publik"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-base font-bold transition-all"
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
                    <div className="flex items-center gap-1.5 mt-1 text-slate-700 text-base font-semibold">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>{t.leader}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Anggota Pegawai</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {t.members.length === 0 ? (
                        <span className="text-sm text-slate-400 italic">Belum ada anggota</span>
                      ) : (
                        t.members.map((member, mIdx) => (
                          <span key={mIdx} className="text-sm bg-slate-100 border border-slate-200 text-slate-650 px-2.5 py-0.5 rounded">
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
                        <li key={sIdx} className="text-sm text-slate-505 flex items-start gap-1">
                          <span className="text-sky-500 mt-0.5">•</span>
                          <span>{service}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button className="p-2 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteTeam(t.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
