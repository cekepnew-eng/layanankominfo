import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

export const DashboardLayout = () => {
  const { user, setUser, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roles = [
    { id: 'admin', label: 'Admin (Master Data)' },
    { id: 'helpdesk', label: 'Helpdesk (Validator)' },
    { id: 'pegawai', label: 'Pegawai (Teknisi)' },
    { id: 'user', label: 'User (OPD / Dinas)' },
    { id: 'masyarakat', label: 'Masyarakat Umum' }
  ];

  const getHistoryLabel = () => {
    if (!user) return 'Daftar Tiket';
    switch (user.role) {
      case 'user':
      case 'masyarakat':
        return 'Tiket Saya';
      case 'helpdesk':
        return 'Kelola Tiket';
      case 'pegawai':
        return 'Tiket Pekerjaan';
      case 'admin':
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
      case 'admin':
        return [
          home,
          adminLinks[0],
          adminLinks[1],
          adminLinks[2],
          history,
          adminLinks[3],
          profile
        ];
      case 'helpdesk':
        return [home, userLinks[0], history, profile];
      case 'pegawai':
        return [home, history, profile];
      case 'user':
      case 'masyarakat':
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
    if (user.role === 'user') return 'OPD';
    if (user.role === 'masyarakat') return 'Masyarakat';
    if (user.role === 'admin') return 'Admin';
    if (user.role === 'helpdesk') return 'Helpdesk';
    if (user.role === 'pegawai') return 'Pegawai';
    return user.role;
  };

  const getProfileDeptLabel = () => {
    if (!user) return '';
    if (user.role === 'masyarakat') return 'Masyarakat Umum';
    return user.department || '';
  };

  const getProfileRoleBadgeClass = () => {
    if (!user) return 'bg-slate-100 text-slate-700 border-slate-200';
    switch (user.role) {
      case 'admin':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'helpdesk':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pegawai':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'masyarakat':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'user':
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
                  admin: 'Dasbor Admin',
                  helpdesk: 'Dasbor Helpdesk',
                  pegawai: 'Dasbor Pegawai',
                  user: 'Dasbor OPD',
                  masyarakat: 'Dasbor Warga'
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
            <div className="relative">
              <button 
                onClick={() => setShowRoleSelector(!showRoleSelector)}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold tracking-wide transition-all"
              >
                <span>Simulasi Role</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showRoleSelector && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 z-30">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        login(r.id);
                        setShowRoleSelector(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-all ${
                        user?.role === r.id ? 'font-bold text-sky-600' : 'text-slate-700'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
          <Outlet />
        </main>
      </div>
    </div>
  );
};
