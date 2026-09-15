import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ActionModal } from '../components/ActionModal';
import { 
  LayoutDashboard, 
  Users, 
  User,
  Layers, 
  Briefcase, 
  ShieldCheck, 
  CheckSquare, 
  PlusCircle, 
  FileText, 
  LogOut, 
  ChevronDown,
  ChevronRight,
  Star,
  Home
} from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#fee', color: '#c00' }}>
          <h2>Something went wrong in Dashboard.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

export const DashboardLayout = () => {
  const { user, setUser, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  const roles = [
    { id: 'ADMIN', label: 'Admin (Master Data)' },
    { id: 'HELPDESK', label: 'Helpdesk (Validator)' },
    { id: 'PEGAWAI', label: 'Pegawai (Teknisi)' },
    { id: 'USER', label: 'User (OPD / Dinas)' },
    { id: 'MASYARAKAT', label: 'Masyarakat' }
  ];

  const getHistoryLabel = () => {
    if (!user) return 'Daftar Tiket';
    switch (user.role) {
      case 'USER':
      case 'MASYARAKAT':
        return 'Tiket Saya';
      case 'HELPDESK':
        return 'Kelola Tiket';
      case 'PEGAWAI':
        return 'Tiket Pekerjaan';
      case 'ADMIN':
        return 'Daftar Tiket SPBE';
      default:
        return 'Daftar Tiket';
    }
  };

  const getMenuLinks = () => {
    const home = { path: '/dashboard', label: 'Ringkasan', icon: LayoutDashboard };
    const history = { path: '/dashboard/history', label: getHistoryLabel(), icon: FileText };
    const profile = { path: '/dashboard/profile', label: 'Profil Pengguna', icon: User };

    const adminLinks = [
      { path: '/dashboard/admin/users', label: 'Kelola User', icon: Users },
      { path: '/dashboard/admin/services', label: 'Kelola Layanan', icon: Layers },
      { path: '/dashboard/admin/teams', label: 'Kelola Tim Kerja', icon: Briefcase },
      { path: '/dashboard/admin/ratings', label: 'Kelola Ulasan & Rating', icon: Star, disabled: true }
    ];

    const userLinks = [
      { path: '/dashboard/user/create-ticket', label: 'Ajukan Layanan', icon: PlusCircle }
    ];

    if (!user) return [home, history, profile];

    switch (user.role) {
      case 'ADMIN':
        return [
          home,
          adminLinks[0],
          adminLinks[1],
          adminLinks[2],
          history,
          adminLinks[3],
          profile
        ];
      case 'HELPDESK':
        return [home, userLinks[0], history, profile];
      case 'PEGAWAI':
        return [home, history, profile];
      case 'USER':
      case 'MASYARAKAT':
        return [home, ...userLinks, history, profile];
      default:
        return [home, history, profile];
    }
  };

  const menuLinks = getMenuLinks();

  const getBreadcrumb = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length <= 1) return 'Ringkasan';
    
    const pageName = paths[paths.length - 1];
    const mapping = {
      users: 'Kelola User',
      services: 'Kelola Layanan SPBE',
      teams: 'Kelola Tim Kerja',
      ratings: 'Kelola Ulasan & Rating',
      tasks: 'Tugas Pengerjaan',
      'create-ticket': 'Ajukan Layanan',
      profile: 'Profil Pengguna',
      history: getHistoryLabel()
    };

    return mapping[pageName] || pageName;
  };

  const getProfileRoleLabel = () => {
    if (!user) return '';
    if (user.role === 'USER') return 'OPD';
    if (user.role === 'MASYARAKAT') return 'Masyarakat';
    if (user.role === 'ADMIN') return 'Admin';
    if (user.role === 'HELPDESK') return 'Helpdesk';
    if (user.role === 'PEGAWAI') return 'Pegawai';
    return user.role;
  };

  const getProfileDeptLabel = () => {
    if (!user) return '';
    if (user.role === 'MASYARAKAT' || user.roles?.includes('MASYARAKAT') || user.roles?.includes('masyarakat')) return 'Masyarakat Umum';
    return user.department || 'Dinas Komunikasi dan Informatika';
  };

  const getProfileRoleBadgeClass = () => {
    if (!user) return 'bg-slate-100 text-slate-700 border-slate-200';
    switch (user.role) {
      case 'ADMIN':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HELPDESK':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PEGAWAI':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'USER':
      default:
        return 'bg-sky-50 text-sky-700 border-sky-200';
    }
  };

  const profileSubtitle = user ? `${getProfileRoleLabel()} • ${getProfileDeptLabel()}` : '';

  return (
    <div className="h-screen w-screen bg-slate-50 flex font-sans overflow-hidden">
      <aside className="w-64 h-full bg-white border-r border-slate-200 flex flex-col z-20 shrink-0">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <img src="/logo-bogor.png" alt="Logo Bogor" className="h-9 w-auto" />
          <div className="text-left">
            <h1 className="font-extrabold text-base text-slate-900 tracking-tight leading-none">DISKOMINFO</h1>
            <p className="text-xs text-sky-600 font-bold uppercase tracking-widest mt-1.5">Kota Bogor</p>
          </div>
        </div>

        {user && user.roles && user.roles.length > 1 && (
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 text-left">Ganti Dasbor</label>
            <select
              value={user.role}
              onChange={(e) => {
                const selectedRole = e.target.value;
                setUser({ ...user, role: selectedRole });
                navigate('/dashboard');
              }}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              {user.roles.map((r) => {
                const labels = {
                  ADMIN: 'Dasbor Admin',
                  HELPDESK: 'Dasbor Helpdesk',
                  PEGAWAI: 'Dasbor Pegawai',
                  USER: 'Dasbor OPD',
                  MASYARAKAT: 'Dasbor Masyarakat'
                };
                return <option key={r} value={r}>{labels[r] || r}</option>;
              })}
            </select>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all text-slate-550 hover:bg-slate-50 hover:text-slate-800 mb-3 border border-slate-200/60 bg-slate-50/40"
          >
            <Home className="w-5 h-5 text-slate-400" />
            <span>Portal Layanan</span>
          </Link>
          {menuLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            if (link.disabled) {
              return (
                <div
                  key={link.label}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 bg-slate-50/70 border border-slate-200/60 opacity-60 cursor-not-allowed select-none"
                  title="Fitur ulasan dinonaktifkan sementara"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-slate-300" />
                    <span className="line-through">{link.label}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded">
                    Off
                  </span>
                </div>
              );
            }
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-sky-50 text-sky-700 shadow-sm' 
                    : 'text-slate-550 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all text-left"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-20 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xs text-slate-400 font-bold uppercase tracking-widest hover:text-sky-600 transition-colors">Portal</Link>
            <span className="text-slate-300 text-base">/</span>
            <span className="text-sm font-bold text-slate-850">{getBreadcrumb()}</span>
          </div>

          <div className="flex items-center gap-4">
              {/* Simulasi Role removed as real auth is implemented */}

            <Link 
              to="/dashboard/profile"
              className="flex items-center gap-3 bg-slate-50 hover:bg-sky-50/80 border border-slate-200 hover:border-sky-300 px-3.5 py-2 rounded-2xl transition-all shadow-xs hover:shadow-sm cursor-pointer group shrink-0"
              title="Lihat & Kelola Profil Pengguna"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 group-hover:border-sky-300 flex items-center justify-center text-sky-600 shadow-2xs shrink-0 group-hover:scale-105 transition-all">
                <User className="w-5 h-5 text-sky-600" />
              </div>
              <div className="text-left hidden sm:block max-w-[160px] lg:max-w-[200px]">
                <p className="text-sm font-black text-slate-800 leading-tight truncate group-hover:text-sky-700 transition-colors" title={user ? user.name : 'Unknown'}>
                  {user ? user.name : 'Unknown'}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border leading-none shrink-0 ${getProfileRoleBadgeClass()}`}>
                    {getProfileRoleLabel()}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 truncate" title={getProfileDeptLabel()}>
                    {getProfileDeptLabel()}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all shrink-0 hidden md:block" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <ActionModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        type="danger"
        title="Konfirmasi Keluar Sistem"
        message="Apakah Anda yakin ingin keluar dari sesi akun ini? Anda akan diminta melakukan autentikasi 2FA Google Authenticator saat ingin masuk kembali ke dasbor."
        confirmText="Ya, Keluar Akun"
        cancelText="Batal"
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
};
