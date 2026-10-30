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
  ClipboardList,
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
  const [isToastFading, setIsToastFading] = useState(false);
  const toastTimerRef = React.useRef(null);
  const toastFadeTimerRef = React.useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const notifRef = React.useRef(null);
  const profileImage = user?.profile_image || user?.profileImage;
  const [profileImageLoadError, setProfileImageLoadError] = useState(false);
  const profileInitials = String(user?.name || 'U')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(namePart => namePart[0])
    .join('')
    .toUpperCase() || 'U';

  React.useEffect(() => {
    setProfileImageLoadError(false);
  }, [profileImage]);

  const dismissToastGradually = React.useCallback(() => {
    setIsToastFading(true);
    if (toastFadeTimerRef.current) clearTimeout(toastFadeTimerRef.current);
    toastFadeTimerRef.current = setTimeout(() => {
      setLiveToast(null);
      setIsToastFading(false);
    }, 800); // 800ms duration for fade out animation
  }, []);

  const handleToastMouseEnter = () => {
    // Pause auto dismiss when user hovers over notification
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (toastFadeTimerRef.current) clearTimeout(toastFadeTimerRef.current);
    setIsToastFading(false);
  };

  const handleToastMouseLeave = () => {
    // Resume gradual fade out 2.5s after mouse leaves
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      dismissToastGradually();
    }, 2500);
  };

  React.useEffect(() => {
    if (!liveToast) return;

    setIsToastFading(false);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (toastFadeTimerRef.current) clearTimeout(toastFadeTimerRef.current);

    // Auto-dismiss smoothly after 5.5 seconds
    toastTimerRef.current = setTimeout(() => {
      dismissToastGradually();
    }, 5500);

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastFadeTimerRef.current) clearTimeout(toastFadeTimerRef.current);
    };
  }, [liveToast, dismissToastGradually]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showNotifications]);

  React.useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const markNotificationAsReadLocally = (id) => {
    try {
      const readIds = JSON.parse(localStorage.getItem('read_notif_ids') || '[]');
      const idStr = String(id);
      if (!readIds.map(String).includes(idStr)) {
        readIds.push(id);
        localStorage.setItem('read_notif_ids', JSON.stringify(readIds));
      }
    } catch (e) { }
  };

  React.useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const { api } = await import('../services/api');
        const res = await api.getNotifications();

        if (res.data) {
          let readIds = new Set();
          try {
            readIds = new Set(JSON.parse(localStorage.getItem('read_notif_ids') || '[]').map(String));
          } catch (e) { }

          const allNotifs = res.data.map(n => {
            const isRead = Boolean(n.is_read || readIds.has(String(n.id)));
            return {
              id: n.id,
              title: n.title || 'Update Tiket',
              message: n.message,
              time: n.created_at,
              isRead: isRead,
              type: n.type ? n.type.toLowerCase() : 'info',
              ticket_id: n.ticket_id || n.ticket_uuid || null,
              ticket_number: n.ticket_number || null,
              ticket_status_id: n.ticket_status_id,
              ticket_status_name: n.ticket_status_name
            };
          });

          const unreadNotifs = allNotifs.filter(n => !n.isRead);

          setNotifications(prevNotifs => {
            if (prevNotifs.length > 0) {
              const prevIds = prevNotifs.map(n => n.id);
              const newUnreads = unreadNotifs.filter(n => !prevIds.includes(n.id));
              if (newUnreads.length > 0) {
                const newest = newUnreads[0];
                setLiveToast({
                  id: newest.id,
                  title: newest.title,
                  message: newest.message,
                  type: newest.type,
                  ticket_id: newest.ticket_id,
                  ticket_status_id: newest.ticket_status_id,
                  ticket_status_name: newest.ticket_status_name
                });
                // Notifikasi tidak hilang otomatis setelah 5 detik, hanya hilang jika dipencet/ditutup oleh pengguna

                // TRIGER BROWSER PUSH NOTIFICATION
                if ("Notification" in window && Notification.permission === "granted") {
                  new Notification(newest.title, {
                    body: newest.message,
                    icon: '/logo-bogor.png'
                  });
                }
              }
            }
            return allNotifs;
          });
          setUnreadCount(unreadNotifs.length);
        }
      } catch (e) {
        console.error("Failed to fetch notifications:", e);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleNotificationClick = async (n) => {
    setShowNotifications(false);

    // 1. Seketika hilangkan biru-birunya & kurangi counter jika belum dibaca
    if (!n.isRead) {
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
      setUnreadCount(prev => Math.max(0, prev - 1));
      markNotificationAsReadLocally(n.id);

      // 2. Tandai sudah dibaca di backend
      try {
        const { api } = await import('../services/api');
        await api.markNotificationRead(n.id);
        if (n.ticket_id) {
          await api.markTicketNotificationsRead?.(n.ticket_id);
        }
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    // 3. Langsung arahkan ke tiket yang sesuai (Tiket Selesai vs Tiket Proses)
    let targetTicketId = n.ticket_id || n.ticket_uuid || n.ticket_number;
    if (!targetTicketId && n.message) {
      const match = n.message.match(/((?:REQ|TKT)-\d+(?:-\d+)?)/i);
      if (match) targetTicketId = match[1];
    }
    if (!targetTicketId && n.title) {
      const match = n.title.match(/((?:REQ|TKT)-\d+(?:-\d+)?)/i);
      if (match) targetTicketId = match[1];
    }

    // Let the ticket list route using the ticket's current status, not notification metadata.
    const targetPath = '/dashboard/history';

    if (targetTicketId) {
      sessionStorage.setItem('fromNotificationTicketId', String(targetTicketId));

      // Dispatch custom event to trigger immediate select if already on the same page
      if (location.pathname === targetPath) {
        window.dispatchEvent(new CustomEvent('notification-ticket-selected', {
          detail: {
            ticketId: String(targetTicketId)
          }
        }));
      }

      // Navigate with query params and timestamp to guarantee re-render/reaction
      navigate(`${targetPath}?ticket=${encodeURIComponent(targetTicketId)}&t=${Date.now()}`);
    } else {
      navigate(`${targetPath}?t=${Date.now()}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
    setUnreadCount(0);
    try {
      const readIds = notifications.map(n => n.id);
      localStorage.setItem('read_notif_ids', JSON.stringify(readIds));
      const { api } = await import('../services/api');
      await api.markAllNotificationsRead?.();
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  };

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
      { path: '/dashboard/admin/ticket-recap', label: 'Rekap Tiket', icon: ClipboardList },
      { path: '/dashboard/admin/ratings', label: 'Kelola Ulasan & Rating', icon: Star }
    ];

    const userLinks = [
      { path: '/dashboard/user/create-ticket', label: 'Ajukan Layanan', icon: PlusCircle }
    ];

    if (!user) return [home, history, ticketHistory, profile];

    const role = (user?.role || '').toUpperCase();

    if (role === 'HELPDESK') {
      return [home, userLinks[0], history, ticketHistory, trackTicket, profile];
    }

    if (role === 'ADMIN') {
      return [
        home,
        adminLinks[0],
        adminLinks[1],
        adminLinks[2],
        adminLinks[3],
        history,
        ticketHistory,
        trackTicket,
        adminLinks[4],
        profile
      ];
    }

    if (role === 'PEGAWAI') {
      return [home, history, ticketHistory, profile];
    }

    return [home, ...userLinks, history, ticketHistory, profile];
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
      'ticket-recap': 'Rekap Tiket',
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
    const role = String(user.role || user.roles?.[0] || '').trim().toUpperCase();
    if (role === 'USER' || role === 'OPD') return 'OPD';
    if (role === 'MASYARAKAT') return 'Masyarakat';
    if (role === 'ADMIN') return 'Admin';
    if (role === 'HELPDESK') return 'Helpdesk';
    if (role === 'PEGAWAI') return 'Pegawai';
    return role;
  };

  const getProfileDeptLabel = () => {
    if (!user) return '';
    const roles = [user.role, ...(user.roles || [])].map(role => String(role).toUpperCase());
    if (roles.includes('MASYARAKAT')) return 'Masyarakat Umum';
    return user.department || 'Dinas Komunikasi dan Informatika';
  };

  const getProfileRoleBadgeClass = () => {
    if (!user) return 'bg-slate-100 text-slate-700 border-slate-200';
    switch (String(user.role || user.roles?.[0] || '').trim().toUpperCase()) {
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
    <div className="h-screen w-full theme-premium-bg flex font-sans overflow-hidden">
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
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 text-left">Ganti Dasboard</label>
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
                  ADMIN: 'Dasboard Admin',
                  HELPDESK: 'Dasboard Helpdesk',
                  PEGAWAI: 'Dasboard Pegawai',
                  USER: 'Dasboard OPD',
                  MASYARAKAT: 'Dasboard Masyarakat'
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
                onClick={() => {
                  setShowSidebar(false);
                  sessionStorage.removeItem('fromNotificationTicketId');
                  sessionStorage.removeItem('redirectedForTicket');
                  sessionStorage.removeItem('activeTicketId');
                }}
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
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-300 rounded-xl text-slate-500 hover:text-sky-600 transition-all shadow-none cursor-pointer"
                style={{ boxShadow: 'none' }}
                aria-label="Notifikasi"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[19px] h-[19px] px-1 flex items-center justify-center bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-white shadow-xs">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Backdrop to close notification on outside click - transparent without dark shadow overlay */}
              {showNotifications && (
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  style={{ boxShadow: 'none' }}
                  onClick={() => setShowNotifications(false)}
                  aria-hidden="true"
                />
              )}

              {showNotifications && (
                <div
                  ref={notifRef}
                  className="fixed inset-x-3 top-20 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl sm:rounded-3xl shadow-none border border-slate-200 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200"
                  style={{ boxShadow: 'none', filter: 'none' }}
                >
                  <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0" style={{ boxShadow: 'none' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4" />
                      </div>
                      <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                        Notifikasi
                      </h3>
                      {unreadCount > 0 && (
                        <span className="text-[11px] font-bold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-lg">
                          {unreadCount} Baru
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="text-[11px] font-bold text-sky-600 hover:text-sky-800 hover:bg-sky-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                          title="Tandai semua notifikasi sudah dibaca"
                        >
                          Tandai Dibaca
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        aria-label="Tutup Notifikasi"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[60vh] sm:max-h-[26rem] overflow-y-auto overflow-x-hidden p-2 space-y-1 bg-slate-50/50 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 border border-slate-100">
                          <Bell className="w-5 h-5 text-slate-300" />
                        </div>
                        <p className="text-slate-600 text-sm font-bold">Belum ada notifikasi.</p>
                        <p className="text-slate-400 text-xs font-medium mt-1">Anda sudah melihat semuanya.</p>
                      </div>
                    ) : (
                      notifications.map((n, i) => (
                        <div
                          key={n.id || i}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 sm:p-3.5 rounded-2xl transition-all cursor-pointer group flex items-start gap-3 border shadow-none ${n.isRead
                            ? 'bg-white/60 hover:bg-white border-transparent hover:border-slate-200'
                            : 'bg-sky-50/60 hover:bg-white border-sky-100 hover:border-sky-200'
                            }`}
                          style={{ boxShadow: 'none' }}
                        >
                          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 border transition-colors ${n.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-100' :
                            n.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-100' :
                              n.type === 'processing' ? 'bg-sky-50 border-sky-100 text-sky-600 group-hover:bg-sky-100' :
                                'bg-slate-50 border-slate-200 text-slate-600 group-hover:bg-slate-100'
                            }`}>
                            {n.type === 'warning' ? <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" /> :
                              n.type === 'success' ? <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" /> :
                                n.type === 'processing' ? <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" /> :
                                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className={`text-xs sm:text-sm font-black truncate ${n.isRead ? 'text-slate-500 font-semibold' : 'text-slate-800'}`}>
                                {n.title}
                              </h4>
                              {!n.isRead && (
                                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0 ring-4 ring-sky-100" title="Belum dibaca"></span>
                              )}
                            </div>
                            <p className={`text-xs mt-0.5 leading-relaxed line-clamp-2 break-words break-all ${n.isRead ? 'text-slate-500 font-normal' : 'text-slate-700 font-semibold'}`}>
                              {n.message}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(n.time).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 bg-slate-50/90 backdrop-blur-md border-t border-slate-100 text-center rounded-b-2xl sm:rounded-b-3xl shrink-0">
                    <Link
                      to="/dashboard/ticket-history"
                      onClick={() => {
                        setShowNotifications(false);
                        sessionStorage.removeItem('fromNotificationTicketId');
                        sessionStorage.removeItem('redirectedForTicket');
                        sessionStorage.removeItem('activeTicketId');
                      }}
                      className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center justify-center gap-1"
                    >
                      <span>Lihat Semua Riwayat Tiket Selesai</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Pembatas Elemen Header (Putih Kehitaman sesuai tema yang tegas dan jelas terlihat) */}
            <div className="h-8 flex items-center mx-1 shrink-0" aria-hidden="true">
              <div className="h-6 w-[1.5px] bg-slate-400 rounded-l"></div>
              <div className="h-6 w-[1.5px] bg-white rounded-r shadow-xs"></div>
            </div>

            <Link
              to="/dashboard/profile"
              className="flex items-center gap-3 glass-card hover:bg-white/80 border border-white/50 hover:border-sky-300 px-3.5 py-2 rounded-2xl transition-all shadow-xs hover:shadow-sm cursor-pointer group shrink-0"
              title="Lihat & Kelola Profil Pengguna"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-white group-hover:border-sky-300 flex items-center justify-center text-sky-700 shadow-2xs shrink-0 group-hover:scale-105 transition-all overflow-hidden font-black text-xs">
                {profileImage && !profileImageLoadError ? (
                  <img
                    src={profileImage}
                    alt="Foto Profil"
                    className="w-full h-full object-cover"
                    onError={() => setProfileImageLoadError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-white flex items-center justify-center">
                    {profileInitials}
                  </div>
                )}
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

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto overflow-x-hidden w-full custom-scrollbar">
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
        message="Apakah Anda yakin ingin keluar dari sesi akun ini? Anda akan diminta melakukan autentikasi 2FA Google Authenticator saat ingin masuk kembali ke dasboard."
        confirmText="Ya, Keluar Akun"
        cancelText="Batal"
        onConfirm={handleConfirmLogout}
      />

      {/* Global Real-time Notification Toast (Hilang Perlahan) */}
      {liveToast && (
        <div
          onMouseEnter={handleToastMouseEnter}
          onMouseLeave={handleToastMouseLeave}
          onClick={() => {
            handleNotificationClick(liveToast);
            setLiveToast(null);
            setIsToastFading(false);
          }}
          className={`fixed bottom-6 right-6 z-50 transition-all duration-700 ease-in-out cursor-pointer ${isToastFading
              ? 'opacity-0 translate-y-4 scale-95 pointer-events-none'
              : 'opacity-100 translate-y-0 scale-100 animate-in slide-in-from-bottom-5 duration-300'
            }`}
        >
          <div
            className="bg-white/95 backdrop-blur-md rounded-2xl p-4 flex items-start gap-4 border border-slate-200/90 max-w-sm shadow-xl shadow-slate-900/10 hover:border-sky-300 transition-all relative overflow-hidden group"
          >
            {/* Progress countdown line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r from-sky-400 to-blue-600 ${!isToastFading ? 'animate-toast-progress' : 'w-0'
                  }`}
              />
            </div>

            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0 border border-sky-200 shadow-sm">
              <Bell className="w-5 h-5 text-sky-600 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0 pr-2 pt-0.5">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-black text-slate-800">{liveToast.title}</h4>
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
              </div>
              <p className="text-xs font-semibold text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                {liveToast.message}
              </p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                Klik untuk detail • Menutup otomatis
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissToastGradually();
              }}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-all shrink-0 cursor-pointer"
              aria-label="Tutup notifikasi"
              title="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
