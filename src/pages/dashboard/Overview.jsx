import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Layers, 
  Briefcase, 
  Star,
  Activity
} from 'lucide-react';



const getTicketTeam = (t) => {
  if (t.team) return t.team;
  const svc = t.service;
  if (svc === 'Pengembangan & Pengelolaan Aplikasi' || svc === 'Rekomendasi & Evaluasi Aplikasi' || svc === 'Uji Kesesuaian Sistem (UKS)' || svc === 'Aplikasi Informatika') {
    return 'Tim Aplikasi & Sistem Informasi';
  }
  if (svc === 'Jaringan Intra Pemerintah' || svc === 'Server Perangkat Daerah' || svc === 'Infrastruktur TIK' || svc === 'Wifi Publik' || svc === 'Domain & Subdomain Pemerintah Daerah') {
    return 'Tim Infrastruktur & Jaringan TIK';
  }
  if (svc === 'Keamanan Informasi & Persandian' || svc === 'Keamanan Aplikasi / VAPT' || svc === 'CSIRT / Respons Insiden') {
    return 'Tim Pengamanan Informasi & Sandi';
  }
  if (svc === 'Tata Kelola SPBE' || svc === 'Audit Teknologi Informasi') {
    return 'Tim Tata Kelola SPBE';
  }
  if (svc === 'Satu Data Daerah' || svc === 'Statistik Sektoral') {
    return 'Tim Satu Data & Statistik';
  }
  if (svc === 'Informasi & Komunikasi Publik' || svc === 'Video Conference / Zoom') {
    return 'Tim Hubungan Masyarakat & IKP';
  }
  if (svc === 'Sistem Informasi LPSE' || svc === 'Fasilitasi E-Katalog') {
    return 'Tim Layanan Pengadaan Secara Elektronik (LPSE)';
  }
  if (svc === 'Pelayanan Umum TIK' || svc === 'Pengaduan SP4N Lapor') {
    return 'Tim Support & Helpdesk Utama';
  }
  return 'Tim Support & Helpdesk Utama';
};

export const Overview = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [globalRatings, setGlobalRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminTeams, setAdminTeams] = useState([]);
  const [adminServicesCount, setAdminServicesCount] = useState(0);
  const [adminServices, setAdminServices] = useState([]);

  // Fallback variables to prevent ReferenceErrors
  const users = [];
  const teams = [];
  const ratings = [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user.role === 'ADMIN') {
          const [data, uData, teamsData, tData, sData] = await Promise.all([
            api.getAdminTickets(),
            api.getUsers(),
            api.getTeams(),
            api.getHelpdeskTickets(),
            api.getPublicServices()
          ]);
          setTickets(tData.data || data.data || []);
          setAdminUsers(uData.data || []);
          setAdminTeams(teamsData.data || []);
          setAdminServicesCount(sData.data ? sData.data.length : 0);
          setAdminServices(sData.data || []);
        } else if (user.role === 'HELPDESK') {
          const data = await api.getHelpdeskTickets();
          setTickets(data.data || []);
        } else if (user.role === 'PEGAWAI') {
          const data = await api.getEmployeeTickets();
          setTickets(data.data || []);
        } else {
          const data = await api.getMyTickets();
          setTickets(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const getUserTeam = (u) => {
    return user.teamId ? 'Tim Teknis' : '';
  };

  const completedOrWaiting = tickets.filter(t => t.status_name === 'COMPLETED' || t.status_name === 'WAITING_USER_CONFIRMATION');
  const completedTickets = tickets.filter(t => t.status_name === 'COMPLETED');
  
  const inSlaTickets = completedOrWaiting.filter(t => t.progress === 100); 
  const slaCompliancePct = completedOrWaiting.length > 0 ? ((inSlaTickets.length / completedOrWaiting.length) * 100).toFixed(1) + '%' : '100.0%';

  const ratedTickets = tickets.filter(t => t.rating);
  const avgRating = ratedTickets.length > 0 
    ? (ratedTickets.reduce((acc, curr) => acc + curr.rating, 0) / ratedTickets.length).toFixed(2)
    : '5.00';
  const calculatedRating = avgRating;

  if (loading) return <div className="p-8 text-slate-500 font-bold">Loading dashboard data...</div>;

  const allCategories = [...new Set(adminServices.map(s => s.category_name || s.category))].filter(Boolean);
  
  const initialCounts = {};
  allCategories.forEach(cat => initialCounts[cat] = 0);

  // Count usage across all tickets to show true service utilization
  tickets.forEach(t => {
     const svc = adminServices.find(s => s.name === t.service_name);
     const cat = svc ? (svc.category_name || svc.category) : 'Lain-lain';
     if (initialCounts[cat] !== undefined) {
         initialCounts[cat]++;
     } else {
         initialCounts[cat] = 1;
     }
  });

  const categoryCounts = Object.entries(initialCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const totalStatsTickets = tickets.length > 0 ? tickets.length : 1;
  const barColors = [
    'bg-sky-500', 
    'bg-emerald-500', 
    'bg-amber-500', 
    'bg-rose-500', 
    'bg-violet-500', 
    'bg-indigo-500', 
    'bg-teal-500', 
    'bg-pink-500'
  ];

  const renderAdminDashboard = () => (
    <div className="space-y-8 text-left">
      <div className="space-y-1.5">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dasbor Administrator</h2>
        <p className="text-slate-505 text-base leading-relaxed gradient-text font-bold">Kelola data master, konfigurasi layanan SPBE, dan hak akses pengguna sistem.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 glass-card p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-default">
          <div className="p-4 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Katalog Layanan</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{adminServicesCount || 28} <span className="text-sm font-bold text-slate-500">Layanan</span></p>
          </div>
        </div>

        <div className="md:col-span-4 glass-card p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-default">
          <div className="p-4 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Akun Aktif</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{adminUsers.length} <span className="text-sm font-bold text-slate-500">Pengguna</span></p>
          </div>
        </div>

        <div className="md:col-span-4 glass-card p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-default">
          <div className="p-4 bg-gradient-to-br from-indigo-400 to-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tim Pelaksana</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{adminTeams.length} <span className="text-sm font-bold text-slate-500">Tim Kerja</span></p>
          </div>
        </div>

        <div className="md:col-span-8 glass-card rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-wider">Statistik Penggunaan Layanan</h3>
            <span className="text-sm font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200/50">Bulan Ini</span>
          </div>
          <div className="space-y-4">
            {categoryCounts.map((svc, idx) => {
              const pct = totalStatsTickets > 0 ? (svc.count / totalStatsTickets * 100).toFixed(0) : 0;
              const color = barColors[idx % barColors.length];
              return (
                <div key={svc.name} className="space-y-2">
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-slate-600">{svc.name}</span>
                    <span className="text-slate-800">{svc.count} Tiket</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className={`${color} h-full rounded-full`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-4 glass-card rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-1.5 text-sky-600 border-b border-white/40 pb-3">
            <Activity className="w-5 h-5" />
            <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-wider font-sans">Ikhtisar Kinerja SPBE</h3>
          </div>
          <div className="space-y-4 text-left">
            <div className="p-4 bg-white/40 border border-white/50 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">SLA Compliance Rate</span>
              <p className="text-3xl font-black text-slate-800 mt-1 gradient-text">{slaCompliancePct}</p>
              <p className="text-sm text-slate-500 mt-0.5 font-medium">Rasio penyelesaian tepat waktu dari total {completedOrWaiting.length} tiket selesai/menunggu konfirmasi.</p>
            </div>

            <div className="p-4 bg-white/40 border border-white/50 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Rating Kepuasan OPD</span>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-black text-slate-800 gradient-text">{calculatedRating}</p>
                <span className="text-sm text-slate-400 font-bold">/ 5.00</span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5 font-medium">Dihitung dari {ratedTickets.length} ulasan survei dinas.</p>
            </div>
            
            <div className="p-3 bg-blue-50/50 border border-blue-100 text-blue-800 rounded-xl text-xs leading-relaxed font-semibold">
              Seluruh data di atas dikalkulasi secara otomatis secara real-time dari log transaksi tiket pengajuan dan survei ulasan OPD.
            </div>
          </div>
        </div>
      </div>

      {/* ADMIN TICKET MONITORING */}
      <div className="md:col-span-12 glass-card rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/40 pb-4">
          <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-wider">Monitoring Tiket Seluruh Sistem</h3>
          <span className="text-sm font-bold bg-white/60 text-slate-600 px-3 py-1 rounded-lg shadow-sm border border-white">Real-time</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/40">
            <thead>
              <tr className="text-left text-sm font-bold text-slate-500 uppercase tracking-widest bg-white/40">
                <th className="px-6 py-4 rounded-tl-xl">ID Tiket</th>
                <th className="px-6 py-4">Pemohon</th>
                <th className="px-6 py-4">Layanan SPBE</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 rounded-tr-xl">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base text-slate-650">
              {(() => {
                const queue = (tickets || []).slice(0, 5); // Show latest 5 tickets
                if (queue.length === 0) {
                  return (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500 font-bold">
                        Belum ada tiket pengajuan di dalam sistem.
                      </td>
                    </tr>
                  );
                }
                return queue.map((t, index) => (
                  <tr key={t.id || index} className="hover:bg-slate-50 transition-all">
                    <td className="px-6 py-4 font-bold text-slate-850">{t.ticket_number || t.id}</td>
                    <td className="px-6 py-4 truncate max-w-xs">{t.pemohon || t.department || 'Masyarakat'}</td>
                    <td className="px-6 py-4 truncate max-w-xs">{t.service_name || t.service || 'Layanan SPBE'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-600">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        t.status === 'Selesai' || t.status_name === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        t.status === 'Verifikasi' || t.status_name === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-sky-50 text-sky-700 border-sky-200'
                      }`}>
                        {t.status || t.status_name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID') : t.date}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );

  const renderHelpdeskDashboard = () => (
    <div className="space-y-8 text-left">
      <div className="space-y-1.5">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dasbor Helpdesk Hub</h2>
        <p className="text-slate-600 text-base leading-relaxed font-semibold">Pantau permohonan masuk, verifikasi syarat berkas, dan delegasikan pengerjaan ke tim.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-3 glass-card p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-default">
          <div className="p-4 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-2xl shadow-lg shadow-amber-500/30">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Butuh Validasi</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              {(tickets || []).filter(t => t.status === 'Verifikasi' || t.status === 'Menunggu Validasi').length} <span className="text-sm text-slate-500">Tiket</span>
            </p>
          </div>
        </div>

        <div className="md:col-span-3 glass-card p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-default">
          <div className="p-4 bg-gradient-to-br from-sky-400 to-sky-600 text-white rounded-2xl shadow-lg shadow-sky-500/30">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sedang Diproses</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              {(tickets || []).filter(t => t.status === 'Diproses').length} <span className="text-sm text-slate-500">Tiket</span>
            </p>
          </div>
        </div>

        <div className="md:col-span-3 glass-card p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-default">
          <div className="p-4 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/30">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telah Selesai</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              {(tickets || []).filter(t => t.status === 'Selesai').length} <span className="text-sm text-slate-500">Tiket</span>
            </p>
          </div>
        </div>

        <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/50">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rating Rata-rata</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{calculatedRating} / 5.00</p>
          </div>
        </div>

        <div className="md:col-span-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-wider">Antrean Validasi Utama</h3>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="text-left text-sm font-bold text-slate-400 uppercase tracking-widest bg-slate-50">
                  <th className="px-6 py-3.5">ID Tiket</th>
                  <th className="px-6 py-3.5">OPD Pemohon</th>
                  <th className="px-6 py-3.5">Layanan SPBE</th>
                  <th className="px-6 py-3.5">Kebutuhan</th>
                  <th className="px-6 py-3.5">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-base text-slate-650">
                {(() => {
                  const queue = (tickets || []).filter(t => t.status === 'Verifikasi' || t.status === 'Menunggu Validasi' || t.status_name === 'PENDING' || t.status_name === 'VERIFIED');
                  if (queue.length === 0) {
                    return (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-slate-500 font-bold">
                          Tidak ada antrean tiket yang menunggu verifikasi saat ini.
                        </td>
                      </tr>
                    );
                  }
                  return queue.map((t, index) => (
                    <tr key={t.id || index} className="hover:bg-slate-50 transition-all">
                      <td className="px-6 py-4 font-bold text-slate-850">{t.ticket_number || t.id}</td>
                      <td className="px-6 py-4">{(t.opd || t.department || 'Masyarakat').split(' Kota ')[0]}</td>
                      <td className="px-6 py-4">{t.service_name || t.service || 'Layanan SPBE'}</td>
                      <td className="px-6 py-4">{t.title || t.requestType || '-'}</td>
                      <td className="px-6 py-4">{t.created_at ? new Date(t.created_at).toLocaleDateString() : t.date}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );


  const renderPegawaiDashboard = () => {
    const myTeamNames = user?.teams && user.teams.length > 0 ? user.teams : ['Belum ada tim kerja'];
    const pegawaiTickets = (tickets || []);
    const activeTasks = pegawaiTickets.filter(t => t.status_name === 'IN_PROGRESS' || t.status === 'Diproses');
    const priorityTask = activeTasks.length > 0 ? activeTasks[0] : null;

    const myTeams = myTeamNames.map((name, idx) => ({
      id: idx + 1,
      name,
      members: ['Anda'] // Ideally fetched, but we only have team names for now.
    }));

    const subtitleText = myTeams.length > 1
      ? `Kelola tiket tugas pengerjaan yang ditugaskan kepada ${myTeams.length} Tim Kerja Anda (${myTeams.map(t => t.name).join(', ')}), perbarui progres, dan laporkan BAST.`
      : myTeams.length === 1 && myTeams[0].name !== 'Belum ada tim kerja'
        ? `Kelola tiket tugas pengerjaan yang ditugaskan kepada ${myTeams[0].name}, perbarui progres, dan laporkan BAST.`
        : 'Kelola tiket tugas pengerjaan teknis, perbarui progres, dan laporkan BAST.';

    return (
      <div className="space-y-8 text-left">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dasbor Tim Kerja Teknis</h2>
          <p className="text-slate-500 text-base leading-relaxed font-semibold">
            {subtitleText}
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-white/40 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
                <Briefcase className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Penugasan Tim Kerja Pelaksana
                </h3>
                <p className="text-sm text-slate-600 font-semibold mt-0.5">
                  {myTeams.length > 0 
                    ? `Anda terdaftar aktif pada ${myTeams.length} tim kerja teknis di bawah Diskominfo Kota Bogor.`
                    : 'Anda belum terdaftar pada tim kerja pelaksana mana pun.'}
                </p>
              </div>
            </div>
            <span className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider bg-white/60 text-indigo-700 shadow-sm">
              {myTeams.length} Tim Kerja Aktif
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {myTeams.map((t) => {
              const teamActiveTasks = tickets.filter(tk => (tk.team || tk.team_name || '') === t.name && tk.status === 'Diproses').length;
              return (
                <div 
                  key={t.id} 
                  className="p-6 rounded-3xl bg-white/40 border border-white/60 space-y-3 hover:border-indigo-300 hover:bg-white/70 transition-all flex flex-col justify-between shadow-sm cursor-default"
                >
                  <div className="space-y-1.5">
                    <h4 className="text-lg font-black text-slate-900 leading-snug tracking-tight">
                      {t.name}
                    </h4>
                    {t.services && t.services.length > 0 && (
                      <p className="text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed">
                        Layanan: {t.services.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="pt-4 border-t border-white/40 flex items-center justify-between text-xs sm:text-sm font-bold">
                    <span className="text-slate-500">{t.members ? t.members.length : 1} Personel</span>
                    <span className="text-indigo-700 bg-white/80 shadow-sm px-3 py-1.5 rounded-xl border border-white">
                      {teamActiveTasks} Tugas Aktif
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 glass-card p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform">
            <div className="p-4 bg-gradient-to-br from-sky-400 to-sky-600 text-white rounded-2xl shadow-lg shadow-sky-500/30">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tugas Aktif</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">
                {activeTasks.length} <span className="text-sm text-slate-500">Tugas</span>
              </p>
            </div>
          </div>

          <div className="md:col-span-4 glass-card p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform">
            <div className="p-4 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-2xl shadow-lg shadow-amber-500/30">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Butuh Ulasan User</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">
                {pegawaiTickets.filter(t => t.status === 'Menunggu Konfirmasi User').length} <span className="text-sm text-slate-500">Tugas</span>
              </p>
            </div>
          </div>

          <div className="md:col-span-4 glass-card p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform">
            <div className="p-4 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selesai Pengerjaan</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">
                {pegawaiTickets.filter(t => t.status === 'Selesai').length} <span className="text-sm text-slate-500">Tugas</span>
              </p>
            </div>
          </div>

          <div className="md:col-span-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-wider">Tugas Dengan Prioritas Utama (SLA Terbatas)</h3>
            <div className="space-y-3">
              {priorityTask ? (
                <div className="p-5 bg-amber-50/50 border border-amber-200/50 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-amber-50 transition-all">
                  <div className="space-y-1.5">
                    <span className="inline-block text-sm font-bold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded uppercase tracking-wider">
                      Prioritas SLA: Sisa {priorityTask.remainingDays !== undefined ? priorityTask.remainingDays : 3} Hari
                    </span>
                    <h4 className="font-extrabold text-slate-850 text-base mt-1">{priorityTask.title}</h4>
                    <p className="text-base text-slate-500">
                      Diajukan oleh: {priorityTask.opd} | Penanggung Jawab: {priorityTask.team || '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-stretch md:self-auto">
                    <span className="inline-block px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">Sedang Diproses</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-400 font-bold">
                  Tidak ada tugas aktif dalam pengerjaan saat ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const userTickets = tickets || [];
  const userTotalCount = userTickets.length;
  const userInProgressCount = userTickets.filter(t => t.status === 'Diproses' || t.status === 'Verifikasi' || t.status === 'Pending').length;
  const userConfirmCount = userTickets.filter(t => t.status === 'Selesai' && !t.rating).length;
  const userFinishedCount = userTickets.filter(t => t.status === 'Selesai' && t.rating).length;

  const userConfirmTicket = userTickets.find(t => t.status === 'Selesai' && !t.rating);
  const userInProgressTicket = userTickets.find(t => t.status === 'Diproses' || t.status === 'Verifikasi' || t.status === 'Pending');

  const renderUserDashboard = () => (
    <div className="space-y-8 text-left animate-in fade-in duration-200">
      <div className="space-y-1.5">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dasbor Layanan {user?.role === 'masyarakat' ? 'Masyarakat' : 'OPD'}</h2>
        <p className="text-slate-505 text-base leading-relaxed">Ajukan permohonan fasilitas TIK, integrasi SPBE, data sektoral, serta pantau pengerjaan secara berkala.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-3 glass-card p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform">
          <div className="p-4 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengajuan</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{userTotalCount} <span className="text-sm font-bold text-slate-500">Tiket</span></p>
          </div>
        </div>

        <div className="md:col-span-3 glass-card p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform">
          <div className="p-4 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-2xl shadow-lg shadow-amber-500/30">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sedang Diproses</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{userInProgressCount} <span className="text-sm font-bold text-slate-500">Tiket</span></p>
          </div>
        </div>

        <div className="md:col-span-3 glass-card p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform">
          <div className="p-4 bg-gradient-to-br from-indigo-400 to-purple-500 text-white rounded-2xl shadow-lg shadow-indigo-500/30">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Belum Dinilai</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{userConfirmCount} <span className="text-sm font-bold text-slate-500">Tiket</span></p>
          </div>
        </div>

        <div className="md:col-span-3 glass-card p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform">
          <div className="p-4 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/30">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selesai & Dinilai</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{userFinishedCount} <span className="text-sm font-bold text-slate-500">Tiket</span></p>
          </div>
        </div>

        <div className="md:col-span-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-wider">Pelacakan Tiket Terakhir</h3>
          <div className="space-y-6 text-left">
            {!userConfirmTicket && !userInProgressTicket ? (
              <p className="text-slate-400 font-semibold text-sm">Tidak ada tiket pengajuan aktif saat ini.</p>
            ) : (
              <>
                {userConfirmTicket && (
                  <div className="flex items-start gap-4 hover:bg-slate-50/50 p-2.5 rounded-xl transition-all">
                    <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 mt-1.5 border-2 border-white ring-2 ring-indigo-100 animate-pulse"></div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Butuh Evaluasi SKM & Rating</p>
                      <h4 className="font-bold text-slate-850 text-base">{userConfirmTicket.title}</h4>
                      <p className="text-base text-slate-500 leading-relaxed">
                        Status: Pekerjaan telah selesai dikerjakan | BAST terunggah. Silakan klik menu "Tiket Saya" untuk mengisi kuesioner SKM dan memberikan ulasan bintang.
                      </p>
                    </div>
                  </div>
                )}
                
                {userInProgressTicket && (
                  <div className="flex items-start gap-4 hover:bg-slate-50/50 p-2.5 rounded-xl transition-all">
                    <div className={`w-3.5 h-3.5 rounded-full mt-1.5 border-2 border-white ring-2 ${
                      userInProgressTicket.status === 'Pending' ? 'bg-amber-500 ring-amber-100' : 'bg-sky-500 ring-sky-100'
                    }`}></div>
                    <div className="space-y-1">
                      <p className={`text-sm font-bold uppercase tracking-wider ${
                        userInProgressTicket.status === 'Pending' ? 'text-amber-600' : 'text-sky-600'
                      }`}>
                        {userInProgressTicket.status === 'Pending' ? 'Ditangguhkan (Pending)' : 'Sedang Diproses'}
                      </p>
                      <h4 className="font-bold text-slate-850 text-base">{userInProgressTicket.title}</h4>
                      <p className="text-base text-slate-500 leading-relaxed">
                        Status: {userInProgressTicket.status === 'Pending' ? 'Berkas permohonan kurang lengkap / ditangguhkan.' : `Pekerjaan teknis sedang berjalan | SLA: ${userInProgressTicket.slaDuration} Hari (Sisa ${userInProgressTicket.slaRemainingDays} Hari)`}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (!user) return <p className="text-center py-12 text-slate-500 font-bold text-base">Silakan login terlebih dahulu...</p>;

  switch (user.role?.toUpperCase()) {
    case 'ADMIN':
      return renderAdminDashboard();
    case 'HELPDESK':
      return renderHelpdeskDashboard();
    case 'PEGAWAI':
      return renderPegawaiDashboard();
    case 'USER':
    case 'MASYARAKAT':
      return renderUserDashboard();
    default:
      return <p className="text-center py-12 text-rose-500 font-bold text-base">Role tidak dikenal...</p>;
  }
};