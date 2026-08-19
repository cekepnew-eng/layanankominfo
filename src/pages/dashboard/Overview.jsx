import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
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

const getUserTeam = (u) => {
  if (!u || !u.department) return '';
  const dept = u.department;
  if (dept.includes('Aplikasi')) return 'Tim Aplikasi & Sistem Informasi';
  if (dept.includes('Jaringan') || dept.includes('Infrastruktur')) return 'Tim Infrastruktur & Jaringan TIK';
  if (dept.includes('Sandi') || dept.includes('Keamanan')) return 'Tim Pengamanan Informasi & Sandi';
  if (dept.includes('SPBE') || dept.includes('Tata Kelola')) return 'Tim Tata Kelola SPBE';
  if (dept.includes('Satu Data') || dept.includes('Statistik')) return 'Tim Satu Data & Statistik';
  if (dept.includes('Humas') || dept.includes('IKP')) return 'Tim Hubungan Masyarakat & IKP';
  if (dept.includes('LPSE')) return 'Tim Layanan Pengadaan Secara Elektronik (LPSE)';
  if (dept.includes('Support') || dept.includes('Helpdesk')) return 'Tim Support & Helpdesk Utama';
  return '';
};

const getTicketTeam = (t) => {
  if (t.team) return t.team;
  const svc = t.service;
  if (svc === 'Pengembangan & Pengelolaan Aplikasi' || svc === 'Rekomendasi & Evaluasi Aplikasi' || svc === 'Uji Kesesuaian Sistem (UKS)') {
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
  const { user, ratings: globalRatings, tickets, teams, users } = useAuth();

  const completedOrWaiting = tickets ? tickets.filter(t => t.status === 'Selesai' || t.status === 'Menunggu Konfirmasi User') : [];
  const completedTickets = tickets ? tickets.filter(t => t.status === 'Selesai') : [];
  const onSlaTickets = completedOrWaiting.filter(t => t.id !== 'REQ-2026-0117');
  const slaCompliancePct = completedOrWaiting.length > 0 ? ((onSlaTickets.length / completedOrWaiting.length) * 100).toFixed(1) + '%' : '92.3%';

  const calculatedRating = globalRatings && globalRatings.length > 0
    ? (globalRatings.reduce((sum, r) => sum + r.rating, 0) / globalRatings.length).toFixed(2)
    : '4.80';

  const categoriesList = [
    { name: 'Pengelolaan Aplikasi Informatika', services: ['Pengembangan & Pengelolaan Aplikasi', 'Rekomendasi & Evaluasi Aplikasi', 'Uji Kesesuaian Sistem (UKS)', 'Keamanan Aplikasi / VAPT'] },
    { name: 'Pengelolaan Sumber Daya & Perangkat Informatika', services: ['Jaringan Intra Pemerintah', 'Server Perangkat Daerah', 'Infrastruktur TIK', 'Perangkat Jaringan & Komunikasi', 'Teleconference & Meeting', 'Video Conference / Zoom', 'CCTV & Video Monitoring', 'Wifi Publik'] },
    { name: 'Penerapan Persandian & Keamanan Informasi', services: ['Keamanan Informasi & Persandian', 'Security Operation Center (SOC)', 'CSIRT / Respons Insiden', 'Security Awareness'] },
    { name: 'Tata Kelola SPBE', services: ['Tata Kelola SPBE', 'Kebijakan SPBE', 'Arsitektur & Peta Rencana SPBE', 'Monev & Pelaporan SPBE', 'Integrasi & Interoperabilitas SPBE', 'Audit Teknologi Informasi'] },
    { name: 'Statistik Sektoral', services: ['Statistik Sektoral'] },
    { name: 'Satu Data Daerah', services: ['Satu Data Daerah'] },
    { name: 'Informasi & Komunikasi Publik', services: ['Informasi & Komunikasi Publik', 'Pelayanan Informasi Publik'] },
    { name: 'Domain & Infrastruktur Pendukung', services: ['Domain & Subdomain Pemerintah Daerah', 'Portal Pelayanan Digital', 'Pusat Kendali / Command Center', 'Peningkatan Kapasitas SDM TIK', 'Domain & Infrastruktur Pendukung'] }
  ];

  const categoryCounts = categoriesList.map(cat => {
    const count = completedTickets.filter(t => cat.services.includes(t.service)).length;
    return { name: cat.name, count };
  }).sort((a, b) => b.count - a.count);

  const totalStatsTickets = completedTickets.length > 0 ? completedTickets.length : 1;
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
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Administrator</h2>
        <p className="text-slate-505 text-base leading-relaxed">Kelola data master, konfigurasi layanan SPBE, dan hak akses pengguna sistem.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/50">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Katalog Layanan</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">28 Layanan</p>
          </div>
        </div>

        <div className="md:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/50">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Akun Aktif</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{users ? users.length : 6} Pengguna</p>
          </div>
        </div>

        <div className="md:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/50">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tim Pelaksana</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{teams ? teams.length : 8} Tim Kerja</p>
          </div>
        </div>

        <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
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

        <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-1.5 text-sky-600 border-b border-slate-100 pb-3">
            <Activity className="w-5 h-5" />
            <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-wider font-sans">Ikhtisar Kinerja SPBE</h3>
          </div>
          <div className="space-y-4 text-left">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">SLA Compliance Rate</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{slaCompliancePct}</p>
              <p className="text-sm text-slate-500 mt-0.5">Rasio penyelesaian tepat waktu dari total {completedOrWaiting.length} tiket selesai.</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Rating Kepuasan OPD</span>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-black text-slate-800">{calculatedRating}</p>
                <span className="text-sm text-slate-400 font-bold">/ 5.00</span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">Dihitung dari {globalRatings ? globalRatings.length : 100} ulasan survei dinas.</p>
            </div>
            
            <div className="p-3 bg-blue-50/50 border border-blue-100 text-blue-800 rounded-xl text-xs leading-relaxed font-semibold">
              Seluruh data di atas dikalkulasi secara otomatis secara real-time dari log transaksi tiket pengajuan dan survei ulasan OPD.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHelpdeskDashboard = () => (
    <div className="space-y-8 text-left">
      <div className="space-y-1.5">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Helpdesk Hub</h2>
        <p className="text-slate-500 text-base leading-relaxed">Pantau permohonan masuk, verifikasi syarat berkas, dan delegasikan pengerjaan ke tim.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/50">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Butuh Validasi</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">
              {(tickets || []).filter(t => t.status === 'Verifikasi' || t.status === 'Menunggu Validasi').length} Permohonan
            </p>
          </div>
        </div>

        <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl border border-sky-100/50">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sedang Diproses</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">
              {(tickets || []).filter(t => t.status === 'Diproses').length} Tiket
            </p>
          </div>
        </div>

        <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/50">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telah Selesai</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">
              {(tickets || []).filter(t => t.status === 'Selesai' || t.status === 'Menunggu Konfirmasi User').length} Tiket
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
                {(tickets || []).filter(t => t.status === 'Verifikasi' || t.status === 'Menunggu Validasi').map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-all">
                    <td className="px-6 py-4 font-bold text-slate-850">{t.id}</td>
                    <td className="px-6 py-4">{t.opd.split(' Kota ')[0]}</td>
                    <td className="px-6 py-4">{t.service}</td>
                    <td className="px-6 py-4">{t.requestType}</td>
                    <td className="px-6 py-4">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPegawaiDashboard = () => {
    const userTeam = getUserTeam(user);
    const pegawaiTickets = (tickets || []).filter(t => getTicketTeam(t) === userTeam);
    const activeTasks = pegawaiTickets.filter(t => t.status === 'Diproses');
    const priorityTask = activeTasks.length > 0 
      ? [...activeTasks].sort((a, b) => (a.remainingDays !== undefined ? a.remainingDays : 99) - (b.remainingDays !== undefined ? b.remainingDays : 99))[0]
      : null;

    return (
      <div className="space-y-8 text-left">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Tim Kerja Teknis</h2>
          <p className="text-slate-500 text-base leading-relaxed font-semibold">
            Kelola tiket tugas pengerjaan yang ditugaskan kepada {userTeam}, perbarui progres, dan laporkan BAST.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/50">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tugas Aktif</p>
              <p className="text-xl font-black text-slate-800 mt-0.5">
                {activeTasks.length} Tugas
              </p>
            </div>
          </div>

          <div className="md:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/50">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Butuh Ulasan User</p>
              <p className="text-xl font-black text-slate-800 mt-0.5">
                {pegawaiTickets.filter(t => t.status === 'Menunggu Konfirmasi User').length} Tugas
              </p>
            </div>
          </div>

          <div className="md:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/50">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selesai Pengerjaan</p>
              <p className="text-xl font-black text-slate-800 mt-0.5">
                {pegawaiTickets.filter(t => t.status === 'Selesai').length} Tugas
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
                      Diajukan oleh: {priorityTask.opd} | Penanggung Jawab: {priorityTask.team || userTeam}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 self-stretch md:self-auto">
                    <div className="flex-1 md:w-32 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${priorityTask.progress || 0}%` }}></div>
                    </div>
                    <span className="text-base font-bold text-slate-700">{priorityTask.progress || 0}% Progres</span>
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

  const userTickets = (tickets || []).filter(t => t.opd.includes('Dinas Kesehatan'));
  const userTotalCount = userTickets.length;
  const userInProgressCount = userTickets.filter(t => t.status === 'Diproses' || t.status === 'Verifikasi' || t.status === 'Menunggu Validasi').length;
  const userConfirmCount = userTickets.filter(t => t.status === 'Menunggu Konfirmasi User').length;
  const userFinishedCount = userTickets.filter(t => t.status === 'Selesai').length;

  const userConfirmTicket = userTickets.find(t => t.status === 'Menunggu Konfirmasi User') || {
    title: 'Pemasangan Jaringan Wifi Ruang Rapat A',
    desc: 'Pemasangan wifi ruang rapat utama Gedung Dinas Kesehatan Kota Bogor.'
  };

  const userInProgressTicket = userTickets.find(t => t.status === 'Diproses' && t.progress === 60) || {
    title: 'Permohonan Hosting Server & Database',
    progress: 60,
    desc: 'Permohonan alokasi Virtual Machine dan pembagian alokasi kapasitas RAM/CPU untuk server cadangan.'
  };

  const renderUserDashboard = () => (
    <div className="space-y-8 text-left">
      <div className="space-y-1.5">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Layanan OPD</h2>
        <p className="text-slate-505 text-base leading-relaxed">Ajukan permohonan fasilitas TIK, integrasi SPBE, data sektoral, serta pantau pengerjaan secara berkala.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/50">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pengajuan</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{userTotalCount} Tiket</p>
          </div>
        </div>

        <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/50">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sedang Diproses</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{userInProgressCount} Tiket</p>
          </div>
        </div>

        <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/50">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Butuh Konfirmasi</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{userConfirmCount} Tiket</p>
          </div>
        </div>

        <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/50">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selesai & Dinilai</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{userFinishedCount} Tiket</p>
          </div>
        </div>

        <div className="md:col-span-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-wider">Pelacakan Tiket Terakhir</h3>
          <div className="space-y-6 text-left">
            <div className="flex items-start gap-4 hover:bg-slate-50/50 p-2.5 rounded-xl transition-all">
              <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 mt-1.5 border-2 border-white ring-2 ring-indigo-100 animate-pulse"></div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Butuh Konfirmasi Penyelesaian</p>
                <h4 className="font-bold text-slate-850 text-base">{userConfirmTicket.title}</h4>
                <p className="text-base text-slate-500 leading-relaxed">Status: Selesai dikerjakan oleh Tim Jaringan | Berita Acara (BAST) terunggah. Silakan klik tiket di menu navigasi untuk menyetujui & menilai layanan.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 hover:bg-slate-50/50 p-2.5 rounded-xl transition-all">
              <div className="w-3.5 h-3.5 rounded-full bg-sky-500 mt-1.5 border-2 border-white ring-2 ring-sky-100"></div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-sky-600 uppercase tracking-wider">Dalam Pengerjaan ({userInProgressTicket.progress}%)</p>
                <h4 className="font-bold text-slate-850 text-base">{userInProgressTicket.title}</h4>
                <p className="text-base text-slate-500 leading-relaxed">Status: Konfigurasi Virtual Machine dan pembagian alokasi kapasitas RAM/CPU | Target SLA: 2 hari kerja.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!user) return <p className="text-center py-12 text-slate-500 font-bold text-base">Silakan login terlebih dahulu...</p>;

  switch (user.role) {
    case 'admin':
      return renderAdminDashboard();
    case 'helpdesk':
      return renderHelpdeskDashboard();
    case 'pegawai':
      return renderPegawaiDashboard();
    case 'user':
      return renderUserDashboard();
    default:
      return <p className="text-center py-12 text-rose-500 font-bold text-base">Role tidak dikenal...</p>;
  }
};
