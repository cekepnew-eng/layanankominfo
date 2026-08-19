import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  Briefcase, 
  ShieldCheck, 
  CheckSquare, 
  PlusCircle, 
  FileText, 
  LogOut, 
  ChevronDown,
  Bell,
  Star
} from 'lucide-react';

export const DashboardLayout = () => {
  const { user, login, logout } = useAuth();
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
    { id: 'user', label: 'User (OPD / Dinas)' }
  ];

  const getHistoryLabel = () => {
    if (!user) return 'Daftar Tiket';
    switch (user.role) {
      case 'user':
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

    const adminLinks = [
      { path: '/dashboard/admin/users', label: 'Kelola User', icon: Users },
      { path: '/dashboard/admin/services', label: 'Kelola Layanan', icon: Layers },
      { path: '/dashboard/admin/teams', label: 'Kelola Tim Kerja', icon: Briefcase },
      { path: '/dashboard/admin/ratings', label: 'Kelola Ulasan & Rating', icon: Star }
    ];

    const userLinks = [
      { path: '/dashboard/user/create-ticket', label: 'Ajukan Layanan', icon: PlusCircle }
    ];

    if (!user) return [home, history];

    switch (user.role) {
      case 'admin':
        return [
          home,
          adminLinks[0],
          adminLinks[1],
          adminLinks[2],
          history,
          adminLinks[3]
        ];
      case 'helpdesk':
        return [home, history];
      case 'pegawai':
        return [home, history];
      case 'user':
        return [home, ...userLinks, history];
      default:
        return [home, history];
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
      history: getHistoryLabel()
    };

    return mapping[pageName] || pageName;
  };

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

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {menuLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
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
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Portal</span>
            <span className="text-slate-300 text-base">/</span>
            <span className="text-sm font-bold text-slate-850">{getBreadcrumb()}</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2.5 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-xl relative transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500"></span>
            </button>

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

            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 font-bold text-sm uppercase">
                {user ? user.role.slice(0, 2) : 'Us'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-bold text-slate-800 leading-none">{user ? user.name : 'Unknown'}</p>
                <p className="text-xs text-slate-400 mt-1.5 uppercase font-semibold tracking-wider">
                  {user ? `${user.role} • ${user.department.slice(0, 15)}...` : ''}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
