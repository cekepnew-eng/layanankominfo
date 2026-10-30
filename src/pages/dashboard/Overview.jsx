import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Activity,
  PlusCircle,
  BarChart3,
  SlidersHorizontal,
  TrendingUp,
  ArrowUpDown,
  Calendar,
  Info
} from 'lucide-react';

const defaultDiskominfoCategories = [
  'Aplikasi Informatika',
  'Pengelolaan Sumber Daya & Perangkat Informatika',
  'Penerapan Persandian & Sistem Pengamanan Informasi',
  'Tata Kelola SPBE',
  'Statistik Sektoral',
  'Informasi & Komunikasi Publik',
  'Pengembangan SDM'
];

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getInitialStatDateRange = () => {
  const endDate = new Date();
  const startDate = new Date(endDate);
  const dayOfMonth = startDate.getDate();
  startDate.setDate(1);
  startDate.setMonth(startDate.getMonth() - 2);
  const lastDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
  startDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));

  return {
    startDate: formatDateInput(startDate),
    endDate: formatDateInput(endDate)
  };
};

const categoryMetadataMap = {
  'Aplikasi Informatika': {
    short: 'Aplikasi',
    gradientV: 'from-sky-500 to-blue-600',
    gradientH: 'from-sky-500 to-blue-600',
    dot: 'bg-sky-500',
    text: 'text-sky-600',
    border: 'border-sky-200',
    bgSoft: 'bg-sky-50'
  },
  'Pengelolaan Sumber Daya & Perangkat Informatika': {
    short: 'Infrastruktur',
    gradientV: 'from-emerald-500 to-teal-600',
    gradientH: 'from-emerald-500 to-teal-600',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    bgSoft: 'bg-emerald-50'
  },
  'Penerapan Persandian & Sistem Pengamanan Informasi': {
    short: 'Keamanan',
    gradientV: 'from-violet-500 to-purple-600',
    gradientH: 'from-violet-500 to-purple-600',
    dot: 'bg-violet-500',
    text: 'text-violet-600',
    border: 'border-violet-200',
    bgSoft: 'bg-violet-50'
  },
  'Tata Kelola SPBE': {
    short: 'Tata SPBE',
    gradientV: 'from-indigo-500 to-blue-700',
    gradientH: 'from-indigo-500 to-blue-700',
    dot: 'bg-indigo-500',
    text: 'text-indigo-600',
    border: 'border-indigo-200',
    bgSoft: 'bg-indigo-50'
  },
  'Statistik Sektoral': {
    short: 'Statistik',
    gradientV: 'from-amber-500 to-orange-500',
    gradientH: 'from-amber-500 to-orange-500',
    dot: 'bg-amber-500',
    text: 'text-amber-600',
    border: 'border-amber-200',
    bgSoft: 'bg-amber-50'
  },
  'Informasi & Komunikasi Publik': {
    short: 'IKP / Humas',
    gradientV: 'from-rose-500 to-pink-600',
    gradientH: 'from-rose-500 to-pink-600',
    dot: 'bg-rose-500',
    text: 'text-rose-600',
    border: 'border-rose-200',
    bgSoft: 'bg-rose-50'
  },
  'Pengembangan SDM': {
    short: 'SDM',
    gradientV: 'from-cyan-500 to-teal-500',
    gradientH: 'from-cyan-500 to-teal-500',
    dot: 'bg-cyan-500',
    text: 'text-cyan-600',
    border: 'border-cyan-200',
    bgSoft: 'bg-cyan-50'
  }
};

const getCategoryMeta = (catName, index = 0) => {
  if (categoryMetadataMap[catName]) {
    return categoryMetadataMap[catName];
  }
  const fallbackList = [
    { short: catName?.slice(0, 10) || 'Lainnya', gradientV: 'from-sky-500 to-blue-600', gradientH: 'from-sky-500 to-blue-600', dot: 'bg-sky-500', text: 'text-sky-600', border: 'border-sky-200', bgSoft: 'bg-sky-50' },
    { short: catName?.slice(0, 10) || 'Lainnya', gradientV: 'from-emerald-500 to-teal-600', gradientH: 'from-emerald-500 to-teal-600', dot: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200', bgSoft: 'bg-emerald-50' },
    { short: catName?.slice(0, 10) || 'Lainnya', gradientV: 'from-amber-500 to-orange-500', gradientH: 'from-amber-500 to-orange-500', dot: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200', bgSoft: 'bg-amber-50' },
    { short: catName?.slice(0, 10) || 'Lainnya', gradientV: 'from-purple-500 to-pink-600', gradientH: 'from-purple-500 to-pink-600', dot: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-200', bgSoft: 'bg-purple-50' }
  ];
  return fallbackList[index % fallbackList.length];
};



const isGenericTeam = (name) => {
  if (!name) return true;
  const n = String(name).toLowerCase().trim();
  return (
    n.includes('dinas komunikasi') ||
    n.includes('diskominfo') ||
    n === 'tim teknis' ||
    n === 'tim pelaksana teknis' ||
    n === 'belum ada tim kerja'
  );
};

const getTeamCategoryKey = (str = '') => {
  if (!str) return '';
  const s = String(str).toLowerCase();
  if (s.includes('aplikasi') || s.includes('sistem') || s.includes('software') || s.includes('uks') || s.includes('web') || s.includes('mobile')) {
    return 'aplikasi';
  }
  if (s.includes('infrastruktur') || s.includes('jaringan') || s.includes('server') || s.includes('wifi') || s.includes('domain') || s.includes('hardware') || s.includes('hosting')) {
    return 'infrastruktur';
  }
  if (s.includes('keamanan') || s.includes('pengamanan') || s.includes('sandi') || s.includes('vapt') || s.includes('csirt') || s.includes('security')) {
    return 'keamanan';
  }
  if (s.includes('tata kelola') || s.includes('spbe') || s.includes('audit')) {
    return 'spbe';
  }
  if (s.includes('data') || s.includes('statistik')) {
    return 'data';
  }
  if (s.includes('komunikasi') || s.includes('ikp') || s.includes('humas') || s.includes('zoom')) {
    return 'ikp';
  }
  if (s.includes('lpse') || s.includes('katalog')) {
    return 'lpse';
  }
  if (s.includes('helpdesk') || s.includes('lapor') || s.includes('umum')) {
    return 'helpdesk';
  }
  return '';
};

const getTicketTeam = (t) => {
  const existingTeam = t?.team || t?.team_name;
  if (existingTeam && !isGenericTeam(existingTeam)) {
    return existingTeam;
  }
  const svc = String(t?.service || t?.service_name || t?.title || '');
  const key = getTeamCategoryKey(svc);
  if (key === 'aplikasi') return 'Tim Aplikasi';
  if (key === 'infrastruktur') return 'Tim Infrastruktur';
  if (key === 'keamanan') return 'Tim Keamanan';
  if (key === 'spbe') return 'Tim Tata Kelola SPBE';
  if (key === 'data') return 'Tim Satu Data & Statistik';
  if (key === 'ikp') return 'Tim Hubungan Masyarakat & IKP';
  if (key === 'lpse') return 'Tim Layanan Pengadaan Secara Elektronik (LPSE)';
  if (key === 'helpdesk') return 'Tim Support & Helpdesk Utama';
  return existingTeam || 'Tim Pelaksana Teknis';
};

const isTicketForTeam = (tk, teamName) => {
  const targetKey = getTeamCategoryKey(teamName);
  const assignedTeams = Array.isArray(tk.teams) ? tk.teams : [];
  if (assignedTeams.some((name) => {
    const assignedName = String(name || '').toLowerCase();
    const targetLower = String(teamName).toLowerCase();
    return assignedName && (
      assignedName.includes(targetLower) ||
      targetLower.includes(assignedName) ||
      (targetKey && getTeamCategoryKey(assignedName) === targetKey)
    );
  })) return true;

  // 1. Direct name match (ignoring generic dinas names)
  const tkTeamRaw = String(tk.team || tk.team_name || '').toLowerCase();
  const targetLower = String(teamName).toLowerCase();
  if (tkTeamRaw && !isGenericTeam(tkTeamRaw)) {
    if (tkTeamRaw.includes(targetLower) || targetLower.includes(tkTeamRaw)) return true;
    const tkTeamKey = getTeamCategoryKey(tkTeamRaw);
    if (targetKey && tkTeamKey && targetKey === tkTeamKey) return true;
  }

  // 2. Service & Title based match
  const svcRaw = String(tk.service || tk.service_name || tk.category_name || tk.title || '');
  const svcKey = getTeamCategoryKey(svcRaw);
  if (targetKey && svcKey && targetKey === svcKey) return true;

  return false;
};

export const Overview = () => {
  const { user, services } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminTeams, setAdminTeams] = useState([]);
  const [adminServicesCount, setAdminServicesCount] = useState(0);
  const [adminServices, setAdminServices] = useState([]);
  const [statDateRange, setStatDateRange] = useState(getInitialStatDateRange);
  const [selectedStatPreset, setSelectedStatPreset] = useState(null);
  const [statSort, setStatSort] = useState('desc');
  const [statChartType, setStatChartType] = useState('vertical');
  const [activeHoveredBar, setActiveHoveredBar] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRole = user?.role?.toUpperCase();
        let raw = [];
        if (userRole === 'ADMIN') {
          const [data, uData, teamsData, tData, sData] = await Promise.all([
            api.getAdminTickets(),
            api.getUsers(),
            api.getTeams(),
            api.getHelpdeskTickets(),
            api.getPublicServices()
          ]);
          raw = data.data || tData.data || [];
          setAdminUsers(uData.data || []);
          setAdminTeams(teamsData.data || []);
          setAdminServicesCount(sData.data ? sData.data.length : 0);
          setAdminServices(sData.data || []);
        } else if (userRole === 'HELPDESK') {
          const data = await api.getHelpdeskTickets();
          raw = data.data || [];
        } else if (userRole === 'PEGAWAI') {
          const data = await api.getEmployeeTickets();
          raw = data.data || [];
        } else {
          const data = await api.getMyTickets();
          raw = data.data || [];
        }

        if (userRole === 'USER' || userRole === 'MASYARAKAT' || !['ADMIN', 'HELPDESK', 'PEGAWAI'].includes(userRole)) {
          raw = raw.filter(t => {
            const isHelpdeskTicket =
              t.form_data?.submitted_by_helpdesk === true ||
              t.form_data?.submitted_by_helpdesk === 'true' ||
              String(t.pemohon || '').toLowerCase().includes('helpdesk') ||
              String(t.form_data?.['Nama Pemohon'] || '').toLowerCase().includes('helpdesk') ||
              String(t.opd || '').toLowerCase().includes('helpdesk') ||
              String(t.form_data?.['Instansi / Asal Pemohon'] || '').toLowerCase().includes('helpdesk');
            return !isHelpdeskTicket;
          });
        }

        const mapped = raw.map(t => {
          const serviceName = String(t.service_name || t.service || '').trim().toLocaleLowerCase('id-ID');
          const configuredService = (services || []).find(service => String(service.id) === String(t.service_id))
            || (services || []).find(service =>
              [service.service_name, service.name].some(name => String(name || '').trim().toLocaleLowerCase('id-ID') === serviceName)
            );
          const status = t.status_name === 'PENDING' ? 'Verifikasi'
            : t.status_name === 'VERIFIED' ? 'Menunggu Validasi'
              : t.status_name === 'REJECTED' ? 'Pending'
                : t.status_name === 'ASSIGNED' ? 'Diproses'
                  : t.status_name === 'IN_PROGRESS' ? 'Diproses'
                    : t.status_name === 'WAITING_USER_CONFIRMATION' ? 'Selesai'
                      : t.status_name === 'COMPLETED' ? 'Selesai & Dinilai'
                        : (t.status || t.status_name || '');

          return {
            ...t,
            ticket_number: t.ticket_number || t.id,
            id: t.ticket_number || t.id,
            uuid: t.id,
            team: getTicketTeam(t),
            team_name: getTicketTeam(t),
            status,
            status_name: t.status_name || (status === 'Verifikasi' ? 'PENDING' : status === 'Menunggu Validasi' ? 'VERIFIED' : status === 'Pending' ? 'REJECTED' : status === 'Diproses' ? 'IN_PROGRESS' : status.includes('Selesai') ? 'COMPLETED' : ''),
            title: t.title || `Pengajuan Layanan ${t.service_name || t.service || 'SPBE'}`,
            service: t.service_name || t.service,
            service_name: t.service_name || t.service,
            opd: t.form_data?.['Instansi / Asal Pemohon'] || t.form_data?.['Instansi'] || ((t.opd && t.opd !== 'OPD') ? t.opd : (t.department || 'Dinas Komunikasi dan Informatika')),
            pemohon: t.pemohon || t.form_data?.['Nama Pemohon'] || 'Pemohon',
            date: t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID') : (t.date || '-'),
            requestType: 'Baru',
            slaDuration: configuredService?.target_sla || configuredService?.sla || t.target_sla || '7 Hari',
            remainingDays: 7,
            slaRemainingDays: 7
          };
        });
        setTickets(mapped);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, services]);

  const getUserTeam = (u) => {
    return user.teamId ? 'Tim Teknis' : '';
  };

  const completedOrWaiting = tickets.filter(t => t.status_name === 'COMPLETED' || t.status_name === 'WAITING_USER_CONFIRMATION' || (t.status || '').includes('Selesai'));
  const completedTickets = tickets.filter(t => t.status_name === 'COMPLETED' || (t.status || '') === 'Selesai & Dinilai');

  const inSlaTickets = completedOrWaiting.filter(t => t.progress === 100 || (t.status || '').includes('Selesai'));
  const slaCompliancePct = completedOrWaiting.length > 0 ? ((inSlaTickets.length / completedOrWaiting.length) * 100).toFixed(1) + '%' : '100.0%';

  const ratedTickets = tickets.filter(t => Number(t.rating) > 0);
  const avgRating = ratedTickets.length > 0
    ? (ratedTickets.reduce((acc, curr) => acc + Number(curr.rating), 0) / ratedTickets.length).toFixed(2)
    : '0.00';
  const calculatedRating = avgRating;

  if (loading) return <div className="p-8 text-slate-500 font-bold">Loading dashboard data...</div>;

  const parseTicketDate = (t) => {
    if (t?.created_at) {
      const d = new Date(t.created_at);
      if (!isNaN(d.getTime())) return d;
    }
    if (t?.date) {
      const d = new Date(t.date);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  const parseDateInput = (date) => {
    if (!date) return null;
    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    return Number.isNaN(parsedDate.getTime()) ||
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
      ? null
      : parsedDate;
  };

  const applyStatDatePreset = (preset) => {
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    const startDate = new Date(endDate);

    if (preset === 'weekly') {
      startDate.setDate(startDate.getDate() - 6);
    } else if (preset === 'monthly') {
      const dayOfMonth = startDate.getDate();
      startDate.setDate(1);
      startDate.setMonth(startDate.getMonth() - 1);
      const lastDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
      startDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));
    } else if (preset === 'yearly') {
      const month = startDate.getMonth();
      const dayOfMonth = startDate.getDate();
      startDate.setDate(1);
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setMonth(month);
      const lastDayOfMonth = new Date(startDate.getFullYear(), month + 1, 0).getDate();
      startDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));
    }

    setStatDateRange({
      startDate: formatDateInput(startDate),
      endDate: formatDateInput(endDate)
    });
    setSelectedStatPreset(preset);
  };

  const selectedStartDate = parseDateInput(statDateRange.startDate);
  const selectedEndDate = parseDateInput(statDateRange.endDate);
  const isStatDateRangeValid = Boolean(
    selectedStartDate &&
    selectedEndDate &&
    selectedStartDate.getTime() <= selectedEndDate.getTime()
  );
  const statsStartTime = isStatDateRangeValid ? selectedStartDate.getTime() : null;
  const statsEndTime = isStatDateRangeValid
    ? new Date(selectedEndDate.getFullYear(), selectedEndDate.getMonth(), selectedEndDate.getDate() + 1).getTime()
    : null;
  const filteredTickets = isStatDateRangeValid
    ? tickets.filter(ticket => {
      const date = parseTicketDate(ticket);
      return date && date.getTime() >= statsStartTime && date.getTime() < statsEndTime;
    })
    : [];

  const dynamicCategories = [...new Set(adminServices.map(s => s.category_name || s.category))].filter(Boolean);
  const allCategories = dynamicCategories.length > 0 ? dynamicCategories : defaultDiskominfoCategories;

  const totalPeriodTickets = filteredTickets.length;
  const periodCompletedOrWaiting = filteredTickets.filter(ticket =>
    ticket.status_name === 'COMPLETED' ||
    ticket.status_name === 'WAITING_USER_CONFIRMATION' ||
    (ticket.status || '').includes('Selesai')
  );
  const periodInSlaTickets = periodCompletedOrWaiting.filter(ticket =>
    ticket.progress === 100 || (ticket.status || '').includes('Selesai')
  );
  const periodSlaCompliancePct = periodCompletedOrWaiting.length > 0
    ? `${((periodInSlaTickets.length / periodCompletedOrWaiting.length) * 100).toFixed(1)}%`
    : '100.0%';
  const periodRatedTickets = filteredTickets.filter(ticket => Number(ticket.rating) > 0);
  const periodCalculatedRating = periodRatedTickets.length > 0
    ? (periodRatedTickets.reduce((total, ticket) => total + Number(ticket.rating), 0) / periodRatedTickets.length).toFixed(2)
    : '0.00';

  const periodCounts = {};
  allCategories.forEach(cat => periodCounts[cat] = 0);

  filteredTickets.forEach(t => {
    const svc = adminServices.find(s =>
      (t.service_id && String(s.id) === String(t.service_id)) ||
      (t.service_name && String(s.name || s.service_name).trim().toLowerCase() === String(t.service_name).trim().toLowerCase()) ||
      (t.service && String(s.name || s.service_name).trim().toLowerCase() === String(t.service).trim().toLowerCase())
    );
    const cat = svc ? (svc.category_name || svc.category) : (t.category_name || null);
    if (cat && periodCounts[cat] !== undefined) {
      periodCounts[cat]++;
    } else {
      const key = getTeamCategoryKey(t.service_name || t.service || t.title || '');
      let mappedCat = 'Aplikasi Informatika';
      if (key === 'aplikasi') mappedCat = 'Aplikasi Informatika';
      else if (key === 'infrastruktur') mappedCat = 'Pengelolaan Sumber Daya & Perangkat Informatika';
      else if (key === 'keamanan') mappedCat = 'Penerapan Persandian & Sistem Pengamanan Informasi';
      else if (key === 'spbe') mappedCat = 'Tata Kelola SPBE';
      else if (key === 'data') mappedCat = 'Statistik Sektoral';
      else if (key === 'ikp') mappedCat = 'Informasi & Komunikasi Publik';
      else if (key === 'sdm') mappedCat = 'Pengembangan SDM';

      if (periodCounts[mappedCat] !== undefined) {
        periodCounts[mappedCat]++;
      } else if (cat) {
        periodCounts[cat] = (periodCounts[cat] || 0) + 1;
      } else {
        periodCounts['Aplikasi Informatika'] = (periodCounts['Aplikasi Informatika'] || 0) + 1;
      }
    }
  });

  const categoryBarData = Object.entries(periodCounts)
    .map(([name, count], index) => {
      const meta = getCategoryMeta(name, index);
      return {
        name,
        shortName: meta.short,
        count,
        meta,
        pct: totalPeriodTickets > 0 ? ((count / totalPeriodTickets) * 100).toFixed(1) : '0'
      };
    });

  if (statSort === 'desc') {
    categoryBarData.sort((a, b) => b.count - a.count);
  } else if (statSort === 'asc') {
    categoryBarData.sort((a, b) => a.count - b.count);
  } else if (statSort === 'az') {
    categoryBarData.sort((a, b) => a.name.localeCompare(b.name, 'id'));
  } else if (statSort === 'za') {
    categoryBarData.sort((a, b) => b.name.localeCompare(a.name, 'id'));
  }

  const maxCategoryVal = Math.max(...categoryBarData.map(c => c.count), 0);
  const yMax = maxCategoryVal === 0 ? 5 : (
    maxCategoryVal <= 5 ? 5 :
    maxCategoryVal <= 10 ? 10 :
    maxCategoryVal <= 20 ? 20 :
    maxCategoryVal <= 50 ? 50 :
    Math.ceil(maxCategoryVal * 1.25 / 10) * 10
  );
  const yTicks = [
    yMax,
    Math.round(yMax * 0.75),
    Math.round(yMax * 0.5),
    Math.round(yMax * 0.25),
    0
  ];

  const getTrendData = () => {
    if (!isStatDateRangeValid) return [];

    const durationDays = Math.ceil((statsEndTime - statsStartTime) / (24 * 60 * 60 * 1000));
    const bucketType = durationDays <= 14 ? 'day' : durationDays <= 90 ? 'week' : 'month';
    const buckets = [];
    let bucketStart = new Date(selectedStartDate);

    while (bucketStart.getTime() < statsEndTime) {
      const bucketEndDate = new Date(bucketStart);
      if (bucketType === 'day') bucketEndDate.setDate(bucketEndDate.getDate() + 1);
      else if (bucketType === 'week') bucketEndDate.setDate(bucketEndDate.getDate() + 7);
      else {
        bucketEndDate.setDate(1);
        bucketEndDate.setMonth(bucketEndDate.getMonth() + 1);
      }

      const bucketEnd = Math.min(bucketEndDate.getTime(), statsEndTime);
      const count = filteredTickets.filter(ticket => {
        const date = parseTicketDate(ticket);
        return date && date.getTime() >= bucketStart.getTime() && date.getTime() < bucketEnd;
      }).length;
      const label = bucketType === 'month'
        ? bucketStart.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
        : bucketStart.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });

      buckets.push({
        label,
        fullLabel: bucketType === 'week'
          ? `${bucketStart.toLocaleDateString('id-ID')} - ${new Date(bucketEnd - 1).toLocaleDateString('id-ID')}`
          : bucketStart.toLocaleDateString('id-ID', { dateStyle: 'full' }),
        count
      });
      bucketStart = bucketEndDate;
    }

    return buckets;
  };

  const trendData = getTrendData();
  const maxTrendVal = Math.max(...trendData.map(t => t.count), 0);
  const yTrendMax = maxTrendVal === 0 ? 5 : (
    maxTrendVal <= 5 ? 5 :
    maxTrendVal <= 10 ? 10 :
    maxTrendVal <= 20 ? 20 :
    Math.ceil(maxTrendVal * 1.25 / 10) * 10
  );
  const yTrendTicks = [
    yTrendMax,
    Math.round(yTrendMax * 0.75),
    Math.round(yTrendMax * 0.5),
    Math.round(yTrendMax * 0.25),
    0
  ];

  const getPeriodDescription = () => isStatDateRangeValid
    ? `${selectedStartDate.toLocaleDateString('id-ID')} – ${selectedEndDate.toLocaleDateString('id-ID')}`
    : 'Rentang tanggal belum valid';

  const renderAdminDashboard = () => (
    <div className="space-y-8 text-left">
      <div className="space-y-1.5">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Administrator</h2>
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

        {/* STATISTIK PENGGUNAAN LAYANAN (BAGAN BATANG) */}
        <div className="md:col-span-8 glass-card rounded-3xl p-6 space-y-6">
          {/* Header & Period Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/40 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sky-600" />
                <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-wider">
                  Statistik Penggunaan Layanan
                </h3>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {statChartType === 'trend'
                  ? `Bagan batang tren volume permohonan tiket (${getPeriodDescription()})`
                  : `Bagan batang per kategori layanan SPBE (${getPeriodDescription()})`}
              </p>
            </div>

            <div className="flex flex-col gap-2 self-start sm:self-auto">
              <div className="flex flex-wrap items-center gap-1 p-1 bg-white/70 rounded-2xl border border-white/80 shadow-sm">
                {[
                  { id: 'daily', label: 'Harian' },
                  { id: 'weekly', label: 'Mingguan' },
                  { id: 'monthly', label: 'Bulanan' },
                  { id: 'yearly', label: 'Tahunan' }
                ].map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyStatDatePreset(preset.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                      selectedStatPreset === preset.id
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500">
                  Tanggal mulai
                  <input
                    type="date"
                    value={statDateRange.startDate}
                    onChange={event => {
                      setStatDateRange(current => ({ ...current, startDate: event.target.value }));
                      setSelectedStatPreset(null);
                    }}
                    className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    aria-label="Tanggal mulai statistik"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500">
                  Tanggal akhir
                  <input
                    type="date"
                    value={statDateRange.endDate}
                    onChange={event => {
                      setStatDateRange(current => ({ ...current, endDate: event.target.value }));
                      setSelectedStatPreset(null);
                    }}
                    className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    aria-label="Tanggal akhir statistik"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Controls Bar: Total Badge + Chart View Toggle + Sorting Order */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-sky-50/80 text-sky-700 border border-sky-200/60 font-bold flex items-center gap-1.5 shadow-xs">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span className="font-black text-sky-800">{getPeriodDescription()}</span>
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/80 text-slate-700 font-bold border border-white shadow-xs">
                Total: <span className="font-black text-slate-900">{totalPeriodTickets}</span> Tiket
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Chart Mode Toggle */}
              <div className="flex items-center p-0.5 bg-slate-100/90 rounded-xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setStatChartType('vertical')}
                  title="Bagan Batang Vertikal"
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    statChartType === 'vertical' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Vertikal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatChartType('horizontal')}
                  title="Bagan Batang Horizontal"
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    statChartType === 'horizontal' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Horizontal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatChartType('trend')}
                  title="Bagan Tren Waktu"
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    statChartType === 'trend' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tren Waktu</span>
                </button>
              </div>

              {/* Sorting Order Dropdown (Only for Category view) */}
              {statChartType !== 'trend' && (
                <div className="flex items-center gap-1 bg-white/80 border border-slate-200/70 rounded-xl px-2.5 py-1 text-slate-600 shadow-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 hidden sm:inline">Urutkan:</span>
                  <select
                    value={statSort}
                    onChange={(e) => setStatSort(e.target.value)}
                    className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer pr-1"
                  >
                    <option value="desc">Terbanyak ↓</option>
                    <option value="asc">Terendah ↑</option>
                    <option value="az">Nama A - Z</option>
                    <option value="za">Nama Z - A</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* CHART BODY */}
          {statChartType === 'vertical' && (
            <div className="relative pt-6 pb-2">
              {/* Y-axis ticks & Horizontal Dashed Gridlines */}
              <div className="absolute inset-x-0 top-6 bottom-9 flex flex-col justify-between pointer-events-none">
                {yTicks.map((val, idx) => (
                  <div key={idx} className="w-full flex items-center">
                    <span className="w-8 text-[11px] font-bold text-slate-400 text-right pr-2 shrink-0">{val}</span>
                    <div className="w-full border-b border-dashed border-slate-200/80"></div>
                  </div>
                ))}
              </div>

              {/* Vertical Columns */}
              <div className="relative pl-8 h-64 flex items-end justify-between gap-1.5 sm:gap-3 z-10">
                {categoryBarData.map((item, idx) => {
                  const heightPercent = yMax > 0 ? (item.count / yMax) * 100 : 0;
                  const meta = item.meta;
                  const isHovered = activeHoveredBar === idx;

                  return (
                    <div
                      key={item.name}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                      onMouseEnter={() => setActiveHoveredBar(idx)}
                      onMouseLeave={() => setActiveHoveredBar(null)}
                    >
                      {/* Floating Tooltip */}
                      {isHovered && (
                        <div className="absolute bottom-full mb-2 z-30 flex flex-col items-center pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                          <div className="bg-slate-900/95 text-white px-3 py-2 rounded-xl shadow-xl backdrop-blur-md border border-white/10 text-center whitespace-nowrap min-w-[140px]">
                            <p className="font-bold text-xs text-white truncate max-w-[210px]">{item.name}</p>
                            <div className="flex items-center justify-center gap-2 mt-1 text-[11px]">
                              <span className="font-black text-sky-400">{item.count} Tiket</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-300 font-semibold">{item.pct}%</span>
                            </div>
                          </div>
                          <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1"></div>
                        </div>
                      )}

                      {/* Top Count Badge */}
                      <span className={`text-xs font-black mb-1.5 transition-all ${isHovered ? 'text-sky-600 scale-125' : item.count > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
                        {item.count}
                      </span>

                      {/* Bar Container & Bar Pill */}
                      <div className="w-full max-w-[44px] flex justify-center items-end h-[calc(100%-32px)]">
                        <div
                          className={`w-full rounded-t-xl bg-gradient-to-t ${meta.gradientV} transition-all duration-500 ease-out relative shadow-sm ${
                            isHovered ? 'brightness-110 shadow-lg scale-y-[1.03] origin-bottom' : 'opacity-90 hover:opacity-100'
                          }`}
                          style={{
                            height: item.count > 0 ? `${Math.max(heightPercent, 8)}%` : '6px',
                            minHeight: '6px'
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        </div>
                      </div>

                      {/* X-axis Category Label */}
                      <div className="h-9 flex items-center justify-center pt-2">
                        <span
                          className={`text-[11px] font-bold text-center truncate max-w-[56px] sm:max-w-[72px] transition-colors ${
                            isHovered ? 'text-sky-600 font-black' : 'text-slate-600'
                          }`}
                          title={item.name}
                        >
                          {item.shortName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {statChartType === 'horizontal' && (
            <div className="space-y-3 pt-2">
              {categoryBarData.map((item, idx) => {
                const meta = item.meta;
                const maxVal = maxCategoryVal > 0 ? maxCategoryVal : 1;
                const widthPct = totalPeriodTickets > 0 ? (item.count / maxVal) * 100 : 0;
                const isHovered = activeHoveredBar === idx;

                return (
                  <div
                    key={item.name}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isHovered ? 'bg-white shadow-md border-sky-300 scale-[1.01]' : 'bg-white/40 border-white/60 hover:bg-white/70'
                    }`}
                    onMouseEnter={() => setActiveHoveredBar(idx)}
                    onMouseLeave={() => setActiveHoveredBar(null)}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${meta.dot} shrink-0`}></div>
                        <span className="font-bold text-sm text-slate-800 truncate" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-slate-500">
                          {item.pct}%
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-black text-xs">
                          {item.count} Tiket
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${meta.gradientH} transition-all duration-500`}
                        style={{ width: `${Math.max(widthPct, item.count > 0 ? 5 : 0)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {statChartType === 'trend' && (
            <div className="relative pt-6 pb-2">
              {/* Y-axis & horizontal dashed gridlines */}
              <div className="absolute inset-x-0 top-6 bottom-9 flex flex-col justify-between pointer-events-none">
                {yTrendTicks.map((val, idx) => (
                  <div key={idx} className="w-full flex items-center">
                    <span className="w-8 text-[11px] font-bold text-slate-400 text-right pr-2 shrink-0">{val}</span>
                    <div className="w-full border-b border-dashed border-slate-200/80"></div>
                  </div>
                ))}
              </div>

              {/* Trend Columns */}
              <div className="relative pl-8 h-64 flex items-end justify-between gap-1 sm:gap-2 z-10">
                {trendData.map((item, idx) => {
                  const heightPercent = yTrendMax > 0 ? (item.count / yTrendMax) * 100 : 0;
                  const isHovered = activeHoveredBar === idx;

                  return (
                    <div
                      key={item.label + idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                      onMouseEnter={() => setActiveHoveredBar(idx)}
                      onMouseLeave={() => setActiveHoveredBar(null)}
                    >
                      {isHovered && (
                        <div className="absolute bottom-full mb-2 z-30 flex flex-col items-center pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                          <div className="bg-slate-900/95 text-white px-3 py-2 rounded-xl shadow-xl backdrop-blur-md border border-white/10 text-center whitespace-nowrap">
                            <p className="font-bold text-xs text-white">{item.fullLabel}</p>
                            <p className="font-black text-sky-400 text-xs mt-0.5">{item.count} Tiket Diajukan</p>
                          </div>
                          <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1"></div>
                        </div>
                      )}

                      <span className={`text-xs font-black mb-1.5 transition-all ${isHovered ? 'text-sky-600 scale-125' : item.count > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
                        {item.count}
                      </span>

                      <div className="w-full max-w-[40px] flex justify-center items-end h-[calc(100%-32px)]">
                        <div
                          className={`w-full rounded-t-xl bg-gradient-to-t from-sky-500 to-indigo-600 transition-all duration-500 ease-out relative shadow-sm ${
                            isHovered ? 'brightness-110 shadow-lg scale-y-[1.03] origin-bottom' : 'opacity-90 hover:opacity-100'
                          }`}
                          style={{
                            height: item.count > 0 ? `${Math.max(heightPercent, 8)}%` : '6px',
                            minHeight: '6px'
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        </div>
                      </div>

                      <div className="h-9 flex items-center justify-center pt-2">
                        <span
                          className={`text-[10px] sm:text-xs font-bold text-center truncate max-w-[50px] transition-colors ${
                            isHovered ? 'text-sky-600 font-black' : 'text-slate-600'
                          }`}
                          title={item.fullLabel}
                        >
                          {item.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* KETERANGAN KATEGORI / LEGENDA (Saat dalam mode Kategori) */}
          {statChartType !== 'trend' && (
            <div className="pt-4 border-t border-slate-100/80">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Keterangan Kategori Layanan:</p>
              <div className="flex flex-wrap gap-2">
                {categoryBarData.map((item, idx) => (
                  <div
                    key={item.name}
                    onClick={() => setActiveHoveredBar(activeHoveredBar === idx ? null : idx)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      activeHoveredBar === idx ? 'bg-white shadow-sm border-sky-400 text-sky-800' : 'bg-white/50 border-white/60 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${item.meta.dot}`}></span>
                    <span className="truncate max-w-[130px] sm:max-w-none">{item.name}</span>
                    <span className="text-slate-400 font-normal">({item.count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty / Real-time Notification Info */}
          {!isStatDateRangeValid && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Pilih tanggal mulai dan tanggal akhir yang valid. Tanggal mulai tidak boleh melewati tanggal akhir.</span>
            </div>
          )}
          {isStatDateRangeValid && totalPeriodTickets === 0 && (
            <div className="p-3 bg-blue-50/60 border border-blue-200/60 rounded-2xl flex items-center gap-2.5 text-xs text-blue-800">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Belum ada tiket yang diajukan pada rentang {getPeriodDescription()}. Bagan batang akan terisi dan terupdate otomatis secara real-time saat permohonan tiket baru masuk.</span>
            </div>
          )}
        </div>

        <div className="md:col-span-4 glass-card rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-1.5 text-sky-600 border-b border-white/40 pb-3">
            <Activity className="w-5 h-5" />
            <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-wider font-sans">Ikhtisar Kinerja SPBE</h3>
          </div>
          <div className="space-y-4 text-left">
            <div className="p-4 bg-white/40 border border-white/50 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">SLA Compliance Rate</span>
              <p className="text-3xl font-black text-slate-800 mt-1 gradient-text">{periodSlaCompliancePct}</p>
              <p className="text-sm text-slate-500 mt-0.5 font-medium">Rasio penyelesaian tepat waktu dari {periodCompletedOrWaiting.length} tiket selesai/menunggu konfirmasi pada periode ini.</p>
            </div>

            <div className="p-4 bg-white/40 border border-white/50 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Rating Kepuasan OPD</span>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-black text-slate-800 gradient-text">{periodCalculatedRating}</p>
                <span className="text-sm text-slate-400 font-bold">/ 5.00</span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5 font-medium">Dihitung dari {periodRatedTickets.length} ulasan pada periode ini.</p>
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
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${t.status === 'Selesai' || t.status_name === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Helpdesk Hub</h2>
          <p className="text-slate-600 text-base leading-relaxed font-semibold">Pantau permohonan masuk, verifikasi syarat berkas, dan delegasikan pengerjaan ke tim.</p>
        </div>
        <Link
          to="/dashboard/user/create-ticket"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-sky-600/20 transition-all shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Ajukan / Bantu Pemohon</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-3 glass-card p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-default">
          <div className="p-4 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-2xl shadow-lg shadow-amber-500/30">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Butuh Validasi</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              {(tickets || []).filter(t => t.status === 'Verifikasi' || t.status === 'Menunggu Validasi' || t.status_name === 'PENDING' || t.status_name === 'VERIFIED').length} <span className="text-sm text-slate-500">Tiket</span>
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
              {(tickets || []).filter(t => t.status === 'Diproses' || t.status_name === 'ASSIGNED' || t.status_name === 'IN_PROGRESS').length} <span className="text-sm text-slate-500">Tiket</span>
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
              {(tickets || []).filter(t => t.status === 'Selesai' || t.status_name === 'COMPLETED' || t.status_name === 'WAITING_USER_CONFIRMATION').length} <span className="text-sm text-slate-500">Tiket</span>
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
    const pegawaiTickets = (tickets || []);

    // Auto-detect team names if user.teams is empty or placeholder
    const detectedTicketTeams = Array.from(new Set(
      pegawaiTickets.map(tk => tk.team || tk.team_name || getTicketTeam(tk)).filter(Boolean)
    ));

    const configuredUserTeams = Array.isArray(user?.teams)
      ? Array.from(new Map(user.teams
        .filter(name => typeof name === 'string' && name.trim() && name.trim().toLowerCase() !== 'belum ada tim kerja')
        .map(name => [name.trim().toLowerCase(), name.trim()])).values())
      : [];
    const userTeamsList = configuredUserTeams.length > 0
      ? configuredUserTeams
      : (detectedTicketTeams.length > 0
        ? detectedTicketTeams
        : (user?.team_name ? [user.team_name] : ['Tim Pelaksana Teknis']));

    const activeTasks = pegawaiTickets.filter(t => {
      const s = (t.status || '').toLowerCase();
      const sn = (t.status_name || '').toUpperCase();
      return (
        s === 'diproses' ||
        s === 'sedang dikerjakan' ||
        s === 'ditugaskan' ||
        sn === 'IN_PROGRESS' ||
        sn === 'ASSIGNED' ||
        s === 'menunggu validasi' ||
        sn === 'VERIFIED'
      );
    });

    const priorityTask = activeTasks.length > 0 ? activeTasks[0] : null;

    const myTeams = userTeamsList.map((name, idx) => ({
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
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Tim Kerja Teknis</h2>
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
              {myTeams.length} Tim Kerja Aktif • {activeTasks.length} Tugas Berjalan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {(() => {
              const allTeamCounts = myTeams.map((t) => activeTasks.filter(tk => isTicketForTeam(tk, t.name)).length);
              return myTeams.map((t, idx) => {
                const teamActiveTasks = allTeamCounts[idx];

                return (
                  <div
                    key={t.id}
                    className="p-6 rounded-3xl bg-white/40 border border-white/60 space-y-3 hover:border-indigo-300 hover:bg-white/70 transition-all flex flex-col justify-between shadow-sm cursor-default"
                  >
                    <div className="space-y-1.5">
                      <h4 className="text-lg font-black text-slate-900 leading-snug tracking-tight">
                        {t.name}
                      </h4>
                    </div>
                    <div className="pt-4 border-t border-white/40 flex items-center justify-between text-xs sm:text-sm font-bold">
                      <span className="text-slate-500">{t.members ? t.members.length : 1} Personel</span>
                      <span className="text-indigo-700 bg-white/80 shadow-sm px-3 py-1.5 rounded-xl border border-white">
                        {teamActiveTasks} Tugas Aktif
                      </span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-3 glass-card p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform">
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

          <div className="md:col-span-3 glass-card p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform">
            <div className="p-4 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-2xl shadow-lg shadow-amber-500/30">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Butuh Ulasan User</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">
                {pegawaiTickets.filter(t => t.status === 'Menunggu Konfirmasi User' || t.status_name === 'WAITING_USER_CONFIRMATION').length} <span className="text-sm text-slate-500">Tugas</span>
              </p>
            </div>
          </div>

          <div className="md:col-span-3 glass-card p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform">
            <div className="p-4 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selesai Pengerjaan</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">
                {pegawaiTickets.filter(t => t.status === 'Selesai' || t.status_name === 'COMPLETED').length} <span className="text-sm text-slate-500">Tugas</span>
              </p>
            </div>
          </div>

          <div className="md:col-span-3 glass-card p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform">
            <div className="p-4 bg-gradient-to-br from-indigo-400 to-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">SLA Tepat Waktu</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">
                {slaCompliancePct}
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
                      Prioritas SLA: Sisa {priorityTask.remainingDays !== undefined ? priorityTask.remainingDays : 7} Hari (SLA Standar: {priorityTask.slaDuration || 7} Hari)
                    </span>
                    <h4 className="font-extrabold text-slate-850 text-base mt-1">{priorityTask.title}</h4>
                    <p className="text-base text-slate-500">
                      Diajukan oleh: {priorityTask.opd} | Penanggung Jawab: {priorityTask.team || getTicketTeam(priorityTask) || 'Tim Teknis'}
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
  const userInProgressCount = userTickets.filter(t => t.status === 'Diproses' || t.status === 'Verifikasi' || t.status === 'Pending' || t.status === 'Menunggu Validasi' || t.status_name === 'PENDING' || t.status_name === 'VERIFIED' || t.status_name === 'ASSIGNED' || t.status_name === 'IN_PROGRESS').length;
  const userConfirmCount = userTickets.filter(t => (t.status === 'Selesai' && !t.rating) || (t.status_name === 'WAITING_USER_CONFIRMATION')).length;
  const userFinishedCount = userTickets.filter(t => t.status === 'Selesai & Dinilai' || (t.status === 'Selesai' && t.rating) || (t.status_name === 'COMPLETED')).length;

  const userInProgressTicket = userTickets.find(t => t.status === 'Diproses' || t.status === 'Verifikasi' || t.status === 'Pending' || t.status === 'Menunggu Validasi' || t.status_name === 'PENDING' || t.status_name === 'ASSIGNED' || t.status_name === 'IN_PROGRESS');

  const renderUserDashboard = () => (
    <div className="space-y-8 text-left animate-in fade-in duration-200">
      <div className="space-y-1.5">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Layanan {user?.role?.toUpperCase() === 'MASYARAKAT' ? 'Masyarakat' : 'OPD'}</h2>
        <p className="text-slate-600 text-base leading-relaxed font-semibold">Ajukan permohonan fasilitas TIK, integrasi SPBE, data sektoral, serta pantau pengerjaan secara berkala.</p>
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

        {userInProgressTicket && <div className="md:col-span-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-wider">Pelacakan Tiket Terakhir</h3>
            <span className="text-xs font-bold bg-sky-50 text-sky-700 px-3 py-1 rounded-lg border border-sky-200">
              SLA Standar: {userInProgressTicket.slaDuration}
            </span>
          </div>
          <div className="space-y-6 text-left">
            <>
              <div className="flex items-start gap-4 hover:bg-slate-50/50 p-2.5 rounded-xl transition-all">
                <div className={`w-3.5 h-3.5 rounded-full mt-1.5 border-2 border-white ring-2 ${userInProgressTicket.status === 'Pending' ? 'bg-amber-500 ring-amber-100' : 'bg-sky-500 ring-sky-100'
                  }`}></div>
                <div className="space-y-1">
                  <p className={`text-sm font-bold uppercase tracking-wider ${userInProgressTicket.status === 'Pending'
                    ? 'text-amber-600'
                    : userInProgressTicket.status === 'Verifikasi' || userInProgressTicket.status === 'Menunggu Validasi'
                      ? 'text-amber-600'
                      : 'text-sky-600'
                    }`}>
                    {userInProgressTicket.status === 'Pending'
                      ? 'Ditangguhkan (Pending)'
                      : userInProgressTicket.status === 'Verifikasi' || userInProgressTicket.status === 'Menunggu Validasi'
                        ? 'Menunggu Verifikasi Helpdesk'
                        : 'Sedang Diproses Tim Teknis'}
                  </p>
                  <h4 className="font-bold text-slate-850 text-base">{userInProgressTicket.title}</h4>
                  <p className="text-base text-slate-500 leading-relaxed">
                    Status: {userInProgressTicket.status === 'Pending'
                      ? 'Berkas permohonan kurang lengkap / ditangguhkan untuk perbaikan berkas.'
                      : userInProgressTicket.status === 'Verifikasi' || userInProgressTicket.status === 'Menunggu Validasi'
                        ? `Menunggu verifikasi berkas oleh Helpdesk | SLA Standar: ${userInProgressTicket.slaDuration} (SLA Belum Berjalan)`
                        : `Pekerjaan teknis sedang berjalan | SLA Standar: ${userInProgressTicket.slaDuration} (Sisa ${userInProgressTicket.remainingDays !== undefined ? userInProgressTicket.remainingDays : 7} Hari)`}
                  </p>
                </div>
              </div>
            </>
          </div>
        </div>}
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