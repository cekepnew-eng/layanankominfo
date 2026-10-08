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
  Home,
  Bell,
  Search,
  Clock,
  X
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
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [liveToast, setLiveToast] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);

  React.useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  React.useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const { api } = await import('../services/api');
        const res = await api.getNotifications();

        if (res.data) {
          const notifs = res.data.map(n => ({
            id: n.id,
            title: n.title || 'Update Tiket',
            message: n.message,
            time: n.created_at,
            isRead: n.is_read,
            type: n.type ? n.type.toLowerCase() : 'info',
            ticket_id: n.ticket_id || n.ticket_uuid || null
          }));

          setNotifications(prevNotifs => {
            if (prevNotifs.length > 0) {
              const prevIds = prevNotifs.map(n => n.id);
              const newNotifs = notifs.filter(n => !prevIds.includes(n.id));
              if (newNotifs.length > 0) {
                const newest = newNotifs[0];
                setLiveToast({
                  title: newest.title,
                  message: newest.message,
                  type: newest.type
                });
                setTimeout(() => setLiveToast(null), 5000);

                // TRIGER BROWSER PUSH NOTIFICATION
                if ("Notification" in window && Notification.permission === "granted") {
                  new Notification(newest.title, {
                    body: newest.message,
                    icon: '/logo-bogor.png' // Default icon
                  });
                }
              }
            }
            return notifs;
          });
          setUnreadCount(notifs.filter(n => !n.isRead).length);
        }
      } catch (e) {
        console.error("Failed to fetch notifications:", e);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

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
    { id: 'USER', label: 'OPD (Dinas / Perangkat Daerah)' },
    { id: 'MASYARAKAT', label: 'Masyarakat' }
  ];

  const getHistoryLabel = () => {
    if (!user) return 'Tiket Proses';
    if (user.role === 'MASYARAKAT') return 'Tiket Saya';
    return 'Tiket Proses';
  };

  const getMenuLinks = () => {
    const home = { path: '/dashboard', label: 'Ringkasan', icon: LayoutDashboard };
    const history = { path: '/dashboard/history', label: getHistoryLabel(), icon: FileText };
    const ticketHistory = { path: '/dashboard/ticket-history', label: 'Tiket Selesai', icon: CheckSquare };
    const trackTicket = { path: '/dashboard/track-ticket', label: 'Lacak Tiket', icon: Search };
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

    if (!user) return [home, history, ticketHistory, profile];

    switch (user.role) {
      case 'ADMIN':
        return [
          home,
          adminLinks[0],
          adminLinks[1],
          adminLinks[2],
          history,
          ticketHistory,
          trackTicket,
          adminLinks[3],
          profile
        ];
      case 'HELPDESK':
        return [home, userLinks[0], history, ticketHistory, trackTicket, profile];
      case 'PEGAWAI':
        return [home, history, ticketHistory, profile];
      case 'USER':
      case 'MASYARAKAT':
        return [home, ...userLinks, history, ticketHistory, profile];
      default:
        return [home, history, ticketHistory, profile];
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
      history: getHistoryLabel(),
      'ticket-history': 'Tiket Selesai'
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
    <div className="h-screen w-screen theme-premium-bg flex font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden" 
          onClick={() => setShowSidebar(false)}
        />
      )}

      <aside className={`fixed md:relative top-0 left-0 w-64 h-full glass-sidebar flex flex-col z-40 shrink-0 transition-transform duration-300 ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-100/50 flex items-center gap-3">
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
              className="w-full px-2.5 py-1.5 border border-sky-300 bg-sky-50 text-sky-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors"
            >
              {user.roles.map((r) => {
                const labels = {
                  ADMIN: 'Dasbor Admin',
                  HELPDESK: 'Dasbor Helpdesk',
                  PEGAWAI: 'Dasbor Pegawai',
                  USER: 'Dasbor OPD',
                  MASYARAKAT: 'Dasbor Masyarakat'
                };
                return <option key={r} value={r} className="bg-white text-slate-800 font-semibold">{labels[r] || r}</option>;
              })}
            </select>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <Link
            to="/"
            onClick={() => setShowSidebar(false)}
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
                onClick={() => setShowSidebar(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-500/30 translate-x-1 border border-sky-500'
                    : 'text-slate-550 hover:bg-slate-50 hover:text-slate-800'
                  }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400'}`} />
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
        <header className="h-20 shrink-0 glass-panel border-b-0 flex items-center justify-between px-4 sm:px-8 z-10 sticky top-0">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-sky-600 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <Link to="/" className="text-xs text-slate-400 font-bold uppercase tracking-widest hover:text-sky-600 transition-colors hidden sm:block">Portal</Link>
            <span className="text-slate-300 text-base hidden sm:block">/</span>
            <span className="text-sm font-bold text-slate-850 truncate max-w-[150px] sm:max-w-none">{getBreadcrumb()}</span>
          </div>

          <div className="flex items-center gap-4">

            {/* NOTIFICATIONS */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setUnreadCount(0);
                }}
                className="relative p-2.5 glass-card border border-white/50 hover:border-sky-300 rounded-xl text-slate-500 hover:text-sky-600 transition-all shadow-xs"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-96 glass-panel rounded-3xl shadow-2xl border border-white/60 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white/70 backdrop-blur-md">
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Bell className="w-4 h-4 text-sky-600" />
                      Notifikasi
                    </h3>
                    {notifications.length > 0 && (
                      <span className="text-xs font-bold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-lg">{notifications.length} Baru</span>
                    )}
                  </div>
                  <div className="max-h-[26rem] overflow-y-auto p-2 space-y-1 bg-white/40">
                    {notifications.length === 0 ? (
                      <div className="p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100 shadow-sm">
                          <Bell className="w-5 h-5 text-slate-300" />
                        </div>
                        <p className="text-slate-500 text-sm font-bold">Belum ada notifikasi.</p>
                        <p className="text-slate-400 text-xs font-medium mt-1">Anda sudah melihat semuanya.</p>
                      </div>
                    ) : (
                      notifications.map((n, i) => (
                        <div key={i} onClick={() => {
                          setShowNotifications(false);
                          if (n.ticket_id) {
                            sessionStorage.setItem('activeTicketId', n.ticket_id);
                            navigate('/dashboard/history');
                          }
                        }} className="p-3.5 rounded-2xl hover:bg-white/80 transition-all cursor-pointer group flex items-start gap-3 border border-transparent hover:border-slate-100 shadow-xs hover:shadow-md">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-xs transition-colors ${n.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-100' :
                              n.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-100' :
                                n.type === 'processing' ? 'bg-sky-50 border-sky-100 text-sky-600 group-hover:bg-sky-100' :
                                  'bg-slate-50 border-slate-200 text-slate-600 group-hover:bg-slate-100'
                            }`}>
                            {n.type === 'warning' ? <ShieldCheck className="w-5 h-5" /> :
                              n.type === 'success' ? <CheckSquare className="w-5 h-5" /> :
                                n.type === 'processing' ? <Briefcase className="w-5 h-5" /> :
                                  <FileText className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className={`text-sm font-black truncate ${n.isRead ? 'text-slate-500' : 'text-slate-800'}`}>{n.title}</h4>
                              {!n.isRead && <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 shadow-sm"></span>}
                            </div>
                            <p className="text-xs font-semibold text-slate-600 mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(n.time).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 text-center rounded-b-3xl">
                    <Link to="/dashboard/history" onClick={() => setShowNotifications(false)} className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center justify-center gap-1">
                      Lihat Semua Riwayat
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/dashboard/profile"
              className="flex items-center gap-3 glass-card hover:bg-white/80 border border-white/50 hover:border-sky-300 px-3.5 py-2 rounded-2xl transition-all shadow-xs hover:shadow-sm cursor-pointer group shrink-0"
              title="Lihat & Kelola Profil Pengguna"
            >
              <div className="w-10 h-10 rounded-xl bg-white/80 border border-white group-hover:border-sky-300 flex items-center justify-center text-sky-600 shadow-2xs shrink-0 group-hover:scale-105 transition-all">
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

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto w-full">
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

      {/* Global Real-time Notification Toast (WhatsApp-like) */}
      {liveToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="glass-panel bg-white/90 shadow-2xl rounded-2xl p-4 flex items-start gap-4 border border-sky-100 max-w-sm">
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0 border border-sky-200">
              <Bell className="w-5 h-5 text-sky-600 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0 pr-2 pt-0.5">
              <h4 className="text-sm font-black text-slate-800">{liveToast.title}</h4>
              <p className="text-xs font-semibold text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                {liveToast.message}
              </p>
            </div>
            <button
              onClick={() => setLiveToast(null)}
              className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
