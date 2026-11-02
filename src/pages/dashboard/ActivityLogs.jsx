import React, { useEffect, useState } from 'react';
import { Activity, CalendarDays, ChevronLeft, ChevronRight, RefreshCw, Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const ACTIVITY_TYPES = [
  ['login', 'Login'],
  ['logout', 'Logout'],
  ['ticket_created', 'Tiket dibuat'],
  ['ticket_status_changed', 'Status tiket berubah'],
  ['ticket_assignment', 'Penugasan tiket'],
  ['ticket_progress_updated', 'Progres tiket diperbarui'],
  ['ticket_updated', 'Tiket diperbarui'],
  ['user_created', 'Pengguna dibuat'],
  ['user_updated', 'Data pengguna diubah'],
  ['user_deleted', 'Pengguna dihapus'],
  ['user_2fa_reset', '2FA pengguna direset'],
  ['two_factor_enabled', '2FA diaktifkan'],
  ['two_factor_disabled', '2FA dinonaktifkan'],
  ['service_created', 'Layanan dibuat'],
  ['service_updated', 'Layanan diubah'],
  ['service_deleted', 'Layanan dihapus'],
  ['service_category_created', 'Kategori layanan dibuat'],
  ['service_category_updated', 'Kategori layanan diubah'],
  ['service_category_deleted', 'Kategori layanan dihapus'],
  ['service_requirement_created', 'Persyaratan layanan ditambahkan'],
  ['service_requirement_deleted', 'Persyaratan layanan dihapus'],
  ['rating_visibility_updated', 'Tampilan ulasan diperbarui'],
  ['team_created', 'Tim dibuat'],
  ['team_updated', 'Tim diubah'],
  ['team_deleted', 'Tim dihapus']
];

const formatDateTime = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '-'
    : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const normalizeRole = role => String(role || '')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean)
  .map(value => value === 'USER' ? 'OPD' : value)
  .join(', ') || 'Tidak diketahui';

export const ActivityLogs = () => {
  const { user } = useAuth();
  const roles = (user?.roles || [user?.role]).map(role => String(role).toUpperCase());
  const isAdmin = roles.includes('ADMIN');
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ search: '', type: '', from: '', to: '', actor: '', role: '' });
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const response = await api.getActivityLogs(
          { ...filters, page, pageSize: 25 },
          { signal: controller.signal }
        );
        setRecords(response.data || []);
        setPagination(response.pagination || { page, pageSize: 25, total: 0, totalPages: 0 });
      } catch (error) {
        if (error.name !== 'AbortError') {
          setErrorMessage(error.message || 'Log Activity gagal dimuat.');
          setRecords([]);
          setPagination({ page, pageSize: 25, total: 0, totalPages: 0 });
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, filters.search ? 250 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [filters, page, reloadKey]);

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters(current => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({ search: '', type: '', from: '', to: '', actor: '', role: '' });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Log Activity</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Riwayat aktivitas dan penanganan tiket sesuai hak akses akun Anda.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey(value => value + 1)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
        </button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-800">
          <CalendarDays className="h-4 w-4 text-sky-600" /> Filter aktivitas
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="relative block">
            <span className="sr-only">Cari aktivitas</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.search}
              onChange={event => updateFilter('search', event.target.value)}
              placeholder="Cari deskripsi, tiket, atau pengguna"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sky-400"
            />
          </label>
          <select
            aria-label="Filter jenis aktivitas"
            value={filters.type}
            onChange={event => updateFilter('type', event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400"
          >
            <option value="">Semua jenis aktivitas</option>
            {ACTIVITY_TYPES.map(([type, label]) => <option key={type} value={type}>{label}</option>)}
          </select>
          {isAdmin && (
            <>
              <input
                value={filters.actor}
                onChange={event => updateFilter('actor', event.target.value)}
                placeholder="Filter nama pengguna"
                aria-label="Filter nama pengguna"
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400"
              />
              <select
                aria-label="Filter role pengguna"
                value={filters.role}
                onChange={event => updateFilter('role', event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400"
              >
                <option value="">Semua role</option>
                <option value="ADMIN">Admin</option>
                <option value="HELPDESK">Helpdesk</option>
                <option value="PEGAWAI">Pegawai</option>
                <option value="USER">OPD</option>
                <option value="MASYARAKAT">Masyarakat</option>
              </select>
            </>
          )}
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500">
            Dari
            <input
              type="date"
              value={filters.from}
              onChange={event => updateFilter('from', event.target.value)}
              aria-label="Tanggal mulai"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none"
            />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500">
            Sampai
            <input
              type="date"
              value={filters.to}
              onChange={event => updateFilter('to', event.target.value)}
              aria-label="Tanggal akhir"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none"
            />
          </label>
        </div>
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900">
            <X className="h-3.5 w-3.5" /> Hapus filter
          </button>
        </div>
      </section>

      {errorMessage && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {errorMessage}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-sky-600" />
            <div>
              <h3 className="font-black text-slate-800">Riwayat aktivitas</h3>
              <p className="text-xs text-slate-500">{pagination.total} aktivitas ditemukan</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] table-auto text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="whitespace-nowrap px-5 py-3">Pengguna</th>
                <th className="whitespace-nowrap px-5 py-3">Jenis aktivitas</th>
                <th className="px-5 py-3">Deskripsi</th>
                <th className="whitespace-nowrap px-5 py-3">Tiket</th>
                <th className="whitespace-nowrap px-5 py-3">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-5 py-10 text-center font-semibold text-slate-400">Memuat Log Activity...</td></tr>
              ) : records.length ? records.map(record => (
                <tr key={record.id} className="align-middle text-slate-700 transition-colors hover:bg-slate-50/80">
                  <td className="min-w-[180px] px-5 py-4">
                    <p className="font-bold text-slate-800">{record.actor_name}</p>
                    <p className="mt-1 text-xs text-slate-500">{normalizeRole(record.actor_role)}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="inline-flex rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 ring-1 ring-inset ring-sky-100">
                      {ACTIVITY_TYPES.find(([type]) => type === record.activity_type)?.[1] || record.activity_type}
                    </span>
                  </td>
                  <td className="max-w-xl whitespace-normal px-5 py-4 leading-relaxed">{record.description}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold text-slate-600">{record.ticket_number || '-'}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDateTime(record.created_at)}</td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="px-5 py-10 text-center text-sm font-medium text-slate-400">Belum ada aktivitas yang dapat ditampilkan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <p className="text-xs font-medium text-slate-500">
            Halaman {pagination.totalPages ? page : 0} dari {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage(current => Math.max(1, current - 1))}
              disabled={loading || page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Sebelumnya
            </button>
            <button
              type="button"
              onClick={() => setPage(current => current + 1)}
              disabled={loading || page >= pagination.totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-40"
            >
              Berikutnya <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
