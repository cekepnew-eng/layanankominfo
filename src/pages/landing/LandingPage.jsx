import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  ChevronRight, 
  Star, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Cpu,
  Globe,
  Shield,
  FileText,
  BarChart2,
  Database,
  Megaphone,
  GraduationCap,
  X,
  ChevronDown,
  Terminal,
  Activity,
  Info,
  ExternalLink
} from 'lucide-react';

export const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDrawerCategory, setSelectedDrawerCategory] = useState(null);
  const [liveTickets, setLiveTickets] = useState([]);
  const [activeFaqId, setActiveFaqId] = useState(null);

  const { ratings, tickets } = useAuth();
  const displayTestimonials = ratings ? ratings.filter(r => r.selectedForLanding) : [];
  const commentedRatings = ratings ? ratings.filter(r => r.comment !== '') : [];
  const paddedTestimonials = [...displayTestimonials];
  for (let r of commentedRatings) {
    if (paddedTestimonials.length >= 10) break;
    if (!paddedTestimonials.some(existing => existing.id === r.id)) {
      paddedTestimonials.push(r);
    }
  }
  const completedOrWaiting = tickets ? tickets.filter(t => t.status === 'Selesai' || t.status === 'Menunggu Konfirmasi User') : [];
  const onSlaTickets = completedOrWaiting.filter(t => t.id !== 'REQ-2026-0117');
  const sla = completedOrWaiting.length > 0 ? ((onSlaTickets.length / completedOrWaiting.length) * 100).toFixed(1) + '%' : '96.4%';
  const rating = ratings && ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2)
    : '4.85';
  
  const app = completedOrWaiting.filter(t => 
    t.service === 'Pengembangan & Pengelolaan Aplikasi' || 
    t.service === 'Keamanan Aplikasi / VAPT' || 
    t.service === 'Rekomendasi & Evaluasi Aplikasi' ||
    t.service === 'Uji Kesesuaian Sistem (UKS)'
  ).length;

  const wifi = completedOrWaiting.filter(t => 
    t.service === 'Jaringan Intra Pemerintah' || 
    t.service === 'Wifi Publik' || 
    t.service === 'Infrastruktur TIK' ||
    t.service === 'Perangkat Jaringan & Komunikasi'
  ).length;

  const server = completedOrWaiting.filter(t => t.service === 'Server Perangkat Daerah').length;
  const [activeSection, setActiveSection] = useState('beranda');

  const opds = ['Dinas Kesehatan', 'Dinas Pendidikan', 'Dinas PUPR', 'Kecamatan Bogor Tengah', 'DPMPTSP'];
  const services = ['Pemeliharaan Server', 'Setup Jaringan', 'Konsultasi SPBE', 'Keamanan Aplikasi', 'Pembuatan Website'];
  const statuses = ['Diterima', 'Diproses', 'Selesai'];

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['beranda', 'statistik', 'alur', 'layanan', 'testimoni', 'faq'];
      const scrollPosition = window.scrollY + 160;

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10) {
        setActiveSection('faq');
        return;
      }

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomOpd = opds[Math.floor(Math.random() * opds.length)];
      const randomService = services[Math.floor(Math.random() * services.length)];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      setLiveTickets(prev => {
        const newTicket = {
          id: Date.now(),
          opd: randomOpd,
          service: randomService,
          status: randomStatus,
          time: 'Baru saja'
        };
        return [newTicket, ...prev.slice(0, 3)];
      });
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const categories = [
    {
      id: 'cat1',
      title: 'Pengelolaan Aplikasi Informatika',
      desc: 'Layanan pengembangan, rekomendasi, evaluasi, kesesuaian, dan keamanan aplikasi perkantoran pemerintah.',
      icon: Cpu,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      services: [
        { name: 'Pengembangan & Pengelolaan Aplikasi', sla: '30-90 Hari', sop: 'sop-pengembangan.pdf', items: ['Pengembangan aplikasi baru', 'Penambahan fitur', 'Perubahan fitur', 'Perbaikan error/bug', 'Pemeliharaan aplikasi', 'Upgrade aplikasi', 'Migrasi aplikasi', 'Integrasi API', 'Integrasi SSO', 'Integrasi SPLP', 'Konsultasi aplikasi', 'Asistensi teknis'] },
        { name: 'Rekomendasi & Evaluasi Aplikasi', sla: '7 Hari', sop: 'sop-rekomendasi.pdf', items: ['Permohonan rekomendasi aplikasi', 'Evaluasi aplikasi', 'Review kebutuhan aplikasi', 'Review arsitektur aplikasi', 'Konsultasi pengembangan aplikasi', 'Pendampingan pengembangan aplikasi'] },
        { name: 'Uji Kesesuaian Sistem (UKS)', sla: '14 Hari', sop: 'sop-uks.pdf', items: ['Permohonan UKS', 'Pengajuan uji aplikasi', 'Konsultasi UKS', 'Perbaikan hasil UKS', 'Tindak lanjut hasil UKS'] },
        { name: 'Keamanan Aplikasi / VAPT', sla: '10 Hari', sop: 'sop-vapt.pdf', items: ['Vulnerability Assessment', 'Penetration Testing', 'VAPT', 'Security Assessment', 'Retest keamanan', 'Konsultasi keamanan aplikasi'] }
      ]
    },
    {
      id: 'cat2',
      title: 'Pengelolaan Sumber Daya & Perangkat Informatika',
      desc: 'Layanan jaringan intra pemerintah, server/hosting daerah, penyediaan CCTV, video conference, wifi publik, dan infrastruktur TIK.',
      icon: Globe,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      services: [
        { name: 'Jaringan Intra Pemerintah', sla: '3 Hari', sop: 'sop-jaringan.pdf', items: ['Gangguan jaringan', 'Permintaan akses jaringan', 'Permintaan koneksi jaringan', 'Instalasi jaringan', 'Penambahan titik jaringan', 'Pemindahan titik jaringan', 'Perubahan konfigurasi', 'Pemeriksaan jaringan', 'Konsultasi jaringan'] },
        { name: 'Server Perangkat Daerah', sla: '5 Hari', sop: 'sop-server.pdf', items: ['Permohonan hosting', 'Permohonan server', 'Pembuatan virtual server', 'Deploy aplikasi', 'Penambahan resource', 'Perubahan resource', 'Backup server', 'Restore server', 'Pemindahan aplikasi', 'Gangguan server', 'Pemeliharaan server', 'Konsultasi server'] },
        { name: 'Infrastruktur TIK', sla: '7 Hari', sop: 'sop-infra.pdf', items: ['Permintaan infrastruktur', 'Instalasi & konfigurasi perangkat', 'Pemeliharaan & perbaikan', 'Penggantian & pemeriksaan'] },
        { name: 'Perangkat Jaringan & Komunikasi', sla: '5 Hari', sop: 'sop-perangkat.pdf', items: ['Permintaan & peminjaman perangkat', 'Instalasi & konfigurasi', 'Perbaikan & pemeliharaan'] },
        { name: 'Teleconference & Meeting', sla: '1 Hari', sop: 'sop-meeting.pdf', items: ['Peminjaman perangkat/ruang teleconference', 'Permohonan operator', 'Setup & uji coba perangkat', 'Pendampingan kegiatan'] },
        { name: 'Video Conference / Zoom', sla: '1 Hari', sop: 'sop-zoom.pdf', items: ['Permohonan link Zoom', 'Pembuatan Zoom Meeting/Webinar', 'Pengaturan host/co-host', 'Dukungan operator'] },
        { name: 'CCTV & Video Monitoring', sla: '3 Hari', sop: 'sop-cctv.pdf', items: ['Permohonan akses CCTV/live streaming', 'Rekaman CCTV', 'Gangguan & pemeriksaan kamera', 'Permintaan pemasangan/pemindahan'] },
        { name: 'Wifi Publik', sla: '2 Hari', sop: 'sop-wifi.pdf', items: ['Gangguan wifi', 'Permintaan pemasangan/pengecekan', 'Pelaporan lokasi wifi', 'Pemeliharaan wifi'] }
      ]
    },
    {
      id: 'cat3',
      title: 'Penerapan Persandian & Keamanan Informasi',
      desc: 'Layanan konsultasi keamanan, Security Operation Center (SOC), penanganan insiden siber (CSIRT), dan edukasi keamanan informasi.',
      icon: Shield,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
      services: [
        { name: 'Keamanan Informasi & Persandian', sla: '5 Hari', sop: 'sop-security.pdf', items: ['Konsultasi keamanan informasi/persandian', 'Asesmen & audit keamanan', 'Penyusunan tata kelola', 'Pendampingan keamanan'] },
        { name: 'Security Operation Center (SOC)', sla: '1 Hari', sop: 'sop-soc.pdf', items: ['Permintaan monitoring keamanan', 'Investigasi alert keamanan', 'Analisis log', 'Konsultasi SOC'] },
        { name: 'CSIRT / Respons Insiden', sla: '1 Hari', sop: 'sop-csirt.pdf', items: ['Pelaporan insiden keamanan', 'Penanganan & investigasi insiden', 'Analisis & pemulihan insiden', 'Konsultasi insiden'] },
        { name: 'Security Awareness', sla: '3 Hari', sop: 'sop-awareness.pdf', items: ['Permohonan sosialisasi/pelatihan/bimtek', 'Edukasi keamanan siber', 'Pendampingan keamanan'] }
      ]
    },
    {
      id: 'cat4',
      title: 'Tata Kelola SPBE',
      desc: 'Layanan penyusunan kebijakan, tata kelola, arsitektur, peta rencana, integrasi sistem, dan evaluasi SPBE daerah.',
      icon: FileText,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      services: [
        { name: 'Kebijakan SPBE', sla: '10 Hari', sop: 'sop-kebijakan.pdf', items: ['Konsultasi kebijakan/tata kelola SPBE', 'Permintaan rekomendasi SPBE', 'Pendampingan SPBE', 'Konsultasi regulasi'] },
        { name: 'Arsitektur & Peta Rencana SPBE', sla: '14 Hari', sop: 'sop-arsitektur.pdf', items: ['Konsultasi arsitektur/peta rencana SPBE', 'Penyusunan & review arsitektur', 'Pendampingan pemetaan SPBE'] },
        { name: 'Monev & Pelaporan SPBE', sla: '14 Hari', sop: 'sop-monev.pdf', items: ['Konsultasi evaluasi/pelaporan SPBE', 'Pendampingan evaluasi SPBE', 'Konsultasi indikator/bukti dukung', 'Pendampingan pengisian evaluasi'] },
        { name: 'Integrasi & Interoperabilitas SPBE', sla: '7 Hari', sop: 'sop-integrasi.pdf', items: ['Permohonan integrasi', 'Integrasi API/SPLP', 'Konsultasi interoperabilitas', 'Pengujian & pendampingan integrasi'] }
      ]
    },
    {
      id: 'cat5',
      title: 'Statistik Sektoral',
      desc: 'Penyediaan data statistik daerah, dataset sectoral, metadata, validasi data, serta konsultasi metodologi statistik.',
      icon: BarChart2,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-100',
      services: [
        { name: 'Statistik Sektoral', sla: '5 Hari', sop: 'sop-statistik.pdf', items: ['Permintaan data statistik/dataset/metadata', 'Konsultasi statistik/metodologi', 'Rekomendasi & validasi data', 'Pendampingan statistik'] }
      ]
    },
    {
      id: 'cat6',
      title: 'Satu Data Daerah',
      desc: 'Penyelenggaraan Satu Data Indonesia tingkat daerah, integrasi data, kode referensi, standar data, dan validasi data daerah.',
      icon: Database,
      color: 'text-teal-600 bg-teal-50 border-teal-100',
      services: [
        { name: 'Satu Data Daerah', sla: '5 Hari', sop: 'sop-satudata.pdf', items: ['Permintaan data/dataset/metadata', 'Konsultasi Satu Data', 'Standar data & kode referensi', 'Integrasi & validasi data'] }
      ]
    },
    {
      id: 'cat7',
      title: 'Informasi & Komunikasi Publik',
      desc: 'Layanan diseminasi informasi publik, peliputan kegiatan pemda, dokumentasi acara, serta permohonan informasi publik (PPID).',
      icon: Megaphone,
      color: 'text-violet-600 bg-violet-50 border-violet-100',
      services: [
        { name: 'Informasi & Komunikasi Publik', sla: '3 Hari', sop: 'sop-publikasi.pdf', items: ['Permohonan publikasi/diseminasi informasi', 'Permohonan peliputan & dokumentasi', 'Konsultasi komunikasi publik', 'Dukungan komunikasi kegiatan'] },
        { name: 'Pelayanan Informasi Publik', sla: '3 Hari', sop: 'sop-ppid.pdf', items: ['Permohonan informasi', 'Permintaan data/informasi', 'Konsultasi informasi publik', 'Permintaan salinan informasi'] }
      ]
    },
    {
      id: 'cat8',
      title: 'Domain & Infrastruktur Pendukung',
      desc: 'Layanan administrasi domain pemda, portal pelayanan digital terintegrasi, command center, serta pengembangan SDM TIK.',
      icon: GraduationCap,
      color: 'text-slate-700 bg-slate-100 border-slate-200',
      services: [
        { name: 'Domain & Subdomain Pemerintah Daerah', sla: '2 Hari', sop: 'sop-domain.pdf', items: ['Permohonan domain/subdomain', 'Perubahan DNS/konfigurasi domain', 'Perpanjangan/pengelolaan domain'] },
        { name: 'Portal Pelayanan Digital', sla: '3 Hari', sop: 'sop-portal.pdf', items: ['Permohonan integrasi portal', 'Permintaan akses/akun', 'Perubahan konten & gangguan portal', 'Konsultasi portal'] },
        { name: 'Pusat Kendali / Command Center', sla: '5 Hari', sop: 'sop-command.pdf', items: ['Permintaan integrasi data/API', 'Permintaan dashboard & data monitoring', 'Dukungan teknis dashboard'] },
        { name: 'Peningkatan Kapasitas SDM TIK', sla: '5 Hari', sop: 'sop-sdm.pdf', items: ['Permohonan pelatihan/bimtek/sosialisasi', 'Permohonan narasumber', 'Konsultasi kompetensi & pendampingan SDM'] }
      ]
    }
  ];

  const handleCategoryClick = (cat) => {
    setSelectedDrawerCategory(cat);
    setIsDrawerOpen(true);
  };

  const handleApplyClick = () => {
    setIsDrawerOpen(false);
    if (user) {
      navigate('/dashboard/user/create-ticket');
    } else {
      navigate('/auth/login');
    }
  };

  const faqs = [
    {
      id: 'faq1',
      question: 'Apakah masyarakat umum dapat mengajukan permohonan di portal ini?',
      answer: 'Secara umum tidak. Portal ini dikhususkan bagi OPD (Organisasi Perangkat Daerah) internal Pemerintah Kota Bogor untuk meminta layanan infrastruktur, jaringan, dan sistem informatika. Layanan publik untuk masyarakat memiliki jalurnya sendiri seperti SIBADRA atau PPID Kota Bogor.'
    },
    {
      id: 'faq2',
      question: 'Bagaimana jika berkas administrasi/syarat permohonan saya ditolak?',
      answer: 'Jika ditolak oleh petugas Helpdesk, Anda akan menerima notifikasi email beserta alasan detail penolakan. Anda dapat merevisi berkas yang kurang atau salah melalui menu \'Tiket Saya\' di dashboard, lalu mengajukannya kembali tanpa perlu membuat tiket baru.'
    },
    {
      id: 'faq3',
      question: 'Berapa lama target waktu penyelesaian (SLA) per jenis layanan?',
      answer: 'Target waktu penyelesaian (SLA) bervariasi bergantung pada kompleksitas layanan yang diajukan. Contohnya, gangguan jaringan minor diselesaikan dalam waktu 1-3 hari kerja, sedangkan permohonan pengembangan aplikasi baru berskala besar memiliki target 30-90 hari kerja.'
    }
  ];

  const filteredCategories = categories.filter(cat => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchesTitle = cat.title.toLowerCase().includes(q);
    const matchesServices = cat.services.some(srv => srv.name.toLowerCase().includes(q));
    return matchesTitle || matchesServices;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      <div className="bg-slate-900 text-slate-300 text-sm font-bold tracking-widest text-center py-2.5 uppercase border-b border-slate-800">
        Pemerintah Kota Bogor • Portal Pelayanan SPBE Elektronik Resmi
      </div>
      
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo-bogor.png" alt="Logo Pemkot Bogor" className="h-10 w-auto" />
            <div className="border-l border-slate-200 pl-4">
              <h1 className="font-extrabold text-lg text-slate-900 tracking-tight leading-none">DISKOMINFO</h1>
              <p className="text-sm text-sky-600 font-bold uppercase tracking-widest mt-1">KOTA BOGOR</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className={`text-base font-bold tracking-wider ${activeSection === 'beranda' ? 'text-sky-600' : 'text-slate-600 hover:text-sky-600'}`}>Beranda</a>
            <a href="#statistik" className={`text-base font-bold tracking-wider ${activeSection === 'statistik' ? 'text-sky-600' : 'text-slate-600 hover:text-sky-600'}`}>Statistik</a>
            <a href="#alur" className={`text-base font-bold tracking-wider ${activeSection === 'alur' ? 'text-sky-600' : 'text-slate-600 hover:text-sky-600'}`}>Alur</a>
            <a href="#layanan" className={`text-base font-bold tracking-wider ${activeSection === 'layanan' ? 'text-sky-600' : 'text-slate-600 hover:text-sky-600'}`}>Layanan SPBE</a>
            <a href="#testimoni" className={`text-base font-bold tracking-wider ${activeSection === 'testimoni' ? 'text-sky-600' : 'text-slate-600 hover:text-sky-600'}`}>Ulasan</a>
            <a href="#faq" className={`text-base font-bold tracking-wider ${activeSection === 'faq' ? 'text-sky-600' : 'text-slate-600 hover:text-sky-600'}`}>FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <Link 
                to="/dashboard" 
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-855 text-white rounded-lg text-base font-bold transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  to="/auth/login" 
                  className="text-slate-700 hover:text-sky-600 text-base font-bold tracking-wider px-3 py-2 transition-all"
                >
                  Masuk
                </Link>
                <Link 
                  to="/auth/register" 
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-base font-bold transition-all"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section id="beranda" className="relative overflow-hidden bg-slate-950 text-white min-h-[calc(100vh-112px)] flex flex-col justify-center py-16 px-8">
        <div className="absolute inset-0 z-0">
          <img 
            src="/tugu.jpg" 
            alt="Tugu Kujang Bogor" 
            className="w-full h-full object-cover opacity-35 scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/95 via-slate-950/80 to-sky-950/60 z-10"></div>
        
        <div className="max-w-4xl mx-auto w-full relative z-20 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 border border-sky-400/20 rounded-full text-sm font-bold text-sky-400 uppercase tracking-widest mx-auto">
            <span>Platform SPBE Hub</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-white max-w-3xl mx-auto">
            Helpdesk Digital Layanan DISKOMINFO
          </h2>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Portal satu pintu bagi Organisasi Perangkat Daerah (OPD) untuk mengajukan infrastruktur TIK, integrasi sistem, dan pengembangan aplikasi secara cepat, terukur, dan transparan.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="#layanan"
              className="px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-base font-bold transition-all"
            >
              Lihat Katalog Layanan
            </a>
            <button
              onClick={() => {
                if (user) {
                  navigate('/dashboard/user/create-ticket');
                } else {
                  navigate('/auth/login');
                }
              }}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-base font-bold backdrop-blur-md transition-all"
            >
              Ajukan Permohonan
            </button>
          </div>
        </div>
      </section>

      <section id="statistik" className="scroll-mt-[120px] py-24 bg-white border-b border-slate-200 relative z-20">
        <div className="max-w-7xl mx-auto px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Kinerja SPBE Kota Bogor</h3>
            <p className="text-slate-505 text-base">Metrik pencapaian layanan digital kami dalam menghadirkan kepuasan optimal bagi seluruh OPD.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4 bg-slate-50 p-8 rounded-3xl border border-slate-200 flex flex-col justify-between gap-8 hover:border-slate-350 transition-all">
              <div className="space-y-3 text-left">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">SLA Compliance</span>
                <h4 className="font-extrabold text-slate-900 text-lg leading-tight">Penyelesaian Layanan Tepat Waktu</h4>
              </div>
              <div className="flex items-center gap-6">
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-slate-200" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-emerald-500" strokeDasharray={`${parseFloat(sla) || 96}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <span className="absolute text-xs font-black text-slate-800">{(parseFloat(sla) || 96).toFixed(0)}%</span>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-black text-slate-900">{sla}</p>
                  <p className="text-sm text-slate-500">Tiket selesai sesuai SLA</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 bg-slate-50 p-8 rounded-3xl border border-slate-200 flex flex-col justify-between gap-8 hover:border-slate-350 transition-all">
              <div className="space-y-3 text-left">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">User Satisfaction</span>
                <h4 className="font-extrabold text-slate-900 text-lg leading-tight">Kepuasan OPD Terhadap Staf Teknis</h4>
              </div>
              <div className="space-y-3 text-left">
                <div className="flex gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(parseFloat(rating) || 5) ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} />
                  ))}
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">{rating} / 5.00</p>
                  <p className="text-sm text-slate-500">Dari total {ratings ? ratings.length : 100} responden</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 bg-slate-50 p-8 rounded-3xl border border-slate-200 flex flex-col justify-between gap-8 hover:border-slate-350 transition-all">
              <div className="space-y-3 text-left">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Popular Services</span>
                <h4 className="font-extrabold text-slate-900 text-lg leading-tight">Layanan Paling Sering Digunakan</h4>
              </div>
              <div className="space-y-3.5 text-left">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Pengembangan Aplikasi</span>
                    <span>{app} Tiket</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full rounded-full" style={{ width: `${(app + wifi + server) > 0 ? (app / (app + wifi + server) * 100).toFixed(0) : 0}%` }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Jaringan & Wifi</span>
                    <span>{wifi} Tiket</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-sky-400 h-full rounded-full" style={{ width: `${(app + wifi + server) > 0 ? (wifi / (app + wifi + server) * 100).toFixed(0) : 0}%` }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Server & Hosting</span>
                    <span>{server} Tiket</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-sky-300 h-full rounded-full" style={{ width: `${(app + wifi + server) > 0 ? (server / (app + wifi + server) * 100).toFixed(0) : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="alur" className="scroll-mt-[120px] py-24 bg-slate-50 border-b border-slate-200 relative z-20">
        <div className="max-w-7xl mx-auto px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Alur Pengajuan Layanan</h3>
            <p className="text-slate-550 text-base">Prosedur sederhana pengerjaan tiket dari awal registrasi hingga penyelesaian oleh tim ahli kami.</p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-slate-200 hidden md:block z-0 -translate-y-1/2"></div>
            
            <div className="relative z-10 bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-350 hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center font-bold text-base">01</div>
                <h4 className="font-extrabold text-slate-900 text-base">Registrasi Akun</h4>
                <p className="text-base text-slate-500 leading-relaxed">Mendaftarkan instansi / OPD Anda menggunakan email dinas resmi pemerintah Kota Bogor.</p>
              </div>
            </div>

            <div className="relative z-10 bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-350 hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center font-bold text-base">02</div>
                <h4 className="font-extrabold text-slate-900 text-base">Kirim Pengajuan</h4>
                <p className="text-base text-slate-500 leading-relaxed">Pilih jenis layanan SPBE, isi formulir kustom, lampirkan dokumen persyaratan, dan kirim tiket.</p>
              </div>
            </div>

            <div className="relative z-10 bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-350 hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center font-bold text-base">03</div>
                <h4 className="font-extrabold text-slate-900 text-base">Validasi & Pengerjaan</h4>
                <p className="text-base text-slate-500 leading-relaxed">Helpdesk memverifikasi berkas, meneruskan ke Tim Kerja, dan staf teknis memperbarui progres kerja.</p>
              </div>
            </div>

            <div className="relative z-10 bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-350 hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center font-bold text-base">04</div>
                <h4 className="font-extrabold text-slate-900 text-base">Konfirmasi & Survei</h4>
                <p className="text-base text-slate-500 leading-relaxed">Terima laporan hasil (BAST), lakukan konfirmasi kesesuaian, dan isi rating ulasan pelayanan.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="layanan" className="scroll-mt-[120px] py-24 w-full flex-1">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Katalog Layanan SPBE</h3>
            <p className="text-slate-505 text-base">
              Temukan layanan IT resmi kami berdasarkan kategori proses bisnis SPBE dan ajukan secara langsung.
            </p>
          <div className="max-w-xl mx-auto relative bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm mt-6 hover:border-slate-300 transition-all">
            <div className="flex text-slate-700">
              <div className="flex items-center pl-4 pr-2 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Cari layanan SPBE (misal: hosting, domain)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3 px-3 bg-transparent text-base rounded-lg focus:outline-none placeholder-slate-400 text-slate-800"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div 
                key={cat.id} 
                onClick={() => handleCategoryClick(cat)}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-350 transition-all cursor-pointer flex flex-col justify-between text-left group"
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${cat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-base text-slate-900 leading-snug group-hover:text-sky-600 transition-all">
                      {cat.title}
                    </h4>
                    <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-slate-400 uppercase mt-4">
                  <span>{cat.services.length} Layanan</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>

      <section id="testimoni" className="scroll-mt-[120px] py-24 bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Apa Kata Pengguna Kami?</h3>
            <p className="text-slate-505 text-base">Ulasan dan rating kepuasan yang dikirimkan langsung oleh perwakilan dinas/OPD setelah penyelesaian tiket.</p>
          </div>

          <div className="relative w-full overflow-hidden py-4 select-none">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-100 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-100 to-transparent z-10 pointer-events-none"></div>
            
            <div className="animate-marquee flex gap-8">
              {paddedTestimonials.map((t, idx) => (
                <div key={`copy1-${t.id || idx}`} className="w-[380px] shrink-0 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all select-none pointer-events-none text-left">
                  <div className="space-y-4">
                    <div className="flex gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < t.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    <p className="text-base text-slate-600 leading-relaxed italic">
                      "{t.comment}"
                    </p>
                  </div>
                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm text-slate-400 font-bold uppercase tracking-wider mt-4">
                    <span className="text-slate-700">{t.name}</span>
                    <span className="text-emerald-600">{t.status || 'Selesai'}</span>
                  </div>
                </div>
              ))}
              {paddedTestimonials.map((t, idx) => (
                <div key={`copy2-${t.id || idx}`} className="w-[380px] shrink-0 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all select-none pointer-events-none text-left">
                  <div className="space-y-4">
                    <div className="flex gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < t.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    <p className="text-base text-slate-600 leading-relaxed italic">
                      "{t.comment}"
                    </p>
                  </div>
                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm text-slate-400 font-bold uppercase tracking-wider mt-4">
                    <span className="text-slate-700">{t.name}</span>
                    <span className="text-emerald-600">{t.status || 'Selesai'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>      <section id="faq" className="scroll-mt-[120px] py-24 bg-white border-t border-slate-200 relative z-20">
        <div className="max-w-4xl mx-auto px-8 space-y-16">
          <div className="text-center space-y-3">
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Pertanyaan Umum (FAQ)</h3>
            <p className="text-slate-505 text-base">Menjawab kendala atau pertanyaan yang sering ditanyakan mengenai sistem helpdesk SPBE Kota Bogor.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 text-left">
            {faqs.map((faq) => {
              const isOpen = activeFaqId === faq.id;
              return (
                <div key={faq.id} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden transition-all">
                  <button
                    onClick={() => setActiveFaqId(isOpen ? null : faq.id)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-slate-800 text-base focus:outline-none"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-450 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-base text-slate-505 leading-relaxed border-t border-slate-100 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-500 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <img src="/logo-bogor.png" alt="Logo Pemkot Bogor" className="h-8 w-auto grayscale opacity-50" />
            <div className="border-l border-slate-800 pl-4 text-left">
              <p className="font-bold text-white text-base leading-none">Dinas Komunikasi dan Informatika</p>
              <p className="text-sm text-slate-600 mt-1.5">Pemerintah Kota Bogor</p>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm">DISKOMINFO &copy; 2026. Hak Cipta Dilindungi.</p>
            <p className="text-sm text-slate-700 mt-1.5">Sistem Digitalisasi & Helpdesk SPBE Terintegrasi</p>
          </div>
        </div>
      </footer>

      {isDrawerOpen && selectedDrawerCategory && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          ></div>
          
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl z-10 flex flex-col animate-slide-in text-left">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${selectedDrawerCategory.color}`}>
                  <selectedDrawerCategory.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 leading-none">{selectedDrawerCategory.title}</h4>
                  <p className="text-sm text-slate-400 mt-1.5 uppercase font-bold tracking-wider">Detail Kategori</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-all focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1 text-sm font-bold text-sky-600 uppercase tracking-widest bg-sky-50 px-2 py-1 rounded">
                  <Info className="w-3.5 h-3.5" />
                  <span>Deskripsi Bidang</span>
                </span>
                <p className="text-base text-slate-600 leading-relaxed">
                  {selectedDrawerCategory.desc}
                </p>
              </div>

              <div className="space-y-4">
                <span className="block text-sm font-bold text-slate-400 uppercase tracking-widest">Daftar Layanan SPBE ({selectedDrawerCategory.services.length})</span>
                <div className="space-y-3">
                  {selectedDrawerCategory.services.map((srv, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl p-4 space-y-3 hover:border-slate-350 transition-all bg-white shadow-sm">
                      <div className="flex justify-between items-start">
                        <h5 className="font-extrabold text-base text-slate-800 max-w-[70%] leading-snug">{srv.name}</h5>
                        <span className="text-sm font-bold bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                          SLA: {srv.sla}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {srv.items.map((item, itemIdx) => (
                          <span key={itemIdx} className="text-sm bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded">
                            {item}
                          </span>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-sm text-slate-400 font-semibold flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          SOP: {srv.sop}
                        </span>
                        <a 
                          href="#" 
                          onClick={(e) => e.preventDefault()}
                          className="text-sm font-bold text-sky-600 hover:text-sky-700 flex items-center gap-0.5"
                        >
                          <span>Lihat SOP</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={handleApplyClick}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-855 text-white rounded-xl text-base font-bold transition-all text-center flex items-center justify-center gap-1.5"
              >
                <span>Ajukan Tiket Layanan Kategori Ini</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
