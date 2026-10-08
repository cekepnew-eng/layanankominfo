import React, { useState } from 'react';
import { Search, Ticket, Activity, CheckCircle2, Clock, AlertTriangle, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { TruncatedText } from '../../components/TruncatedText';

export const TrackTicket = () => {
  const [ticketNumber, setTicketNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!ticketNumber.trim()) return;
    
    setLoading(true);
    setError('');
    setTicketData(null);
    
    try {
      // Find ticket by number
      // We can use getAdminTickets or getHelpdeskTickets then filter, but ideally an API call. 
      // Assuming getAdminTickets gets all tickets
      const res = await api.getAdminTickets();
      if (res.data) {
        const found = res.data.find(t => t.ticket_number === ticketNumber.trim());
        if (found) {
          // Fetch history
          const histRes = await api.getHistory(found.id);
          if (histRes.success) {
            found.logs = histRes.data;
          }
          setTicketData(found);
        } else {
          setError('Tiket tidak ditemukan.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Gagal melacak tiket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-2 text-center items-center pt-8">
        <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mb-2 shadow-sm border border-sky-200">
          <Search className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Lacak Tiket Layanan</h2>
        <p className="text-slate-500 max-w-lg">Masukkan nomor referensi untuk melacak status tiket Anda.</p>
      </div>

      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/60 shadow-md bg-white/50">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Contoh: REQ-2026-0001" 
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-sm"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="px-8 py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Activity className="w-5 h-5 animate-spin" /> : 'Lacak Sekarang'}
          </button>
        </form>
        {error && <p className="mt-4 text-center text-sm font-bold text-rose-500">{error}</p>}
      </div>

      {ticketData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-lg text-xs font-black tracking-widest uppercase border border-sky-200">
                  {ticketData.status}
                </span>
                <span className="text-sm font-bold text-slate-400">{ticketData.ticket_number}</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">{ticketData.service_name}</h3>
              <p className="text-slate-600 font-medium text-sm mt-1">Pemohon: <span className="font-bold text-slate-800">{ticketData.pemohon} ({ticketData.opd})</span></p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Diajukan Pada</span>
              <p className="font-bold text-slate-800">{new Date(ticketData.created_at).toLocaleString('id-ID')}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-600" /> Tahapan Progres Tiket
            </h4>
            
            {ticketData.logs && ticketData.logs.length > 0 ? (
              <div className="space-y-6 pl-4 border-l-2 border-slate-100 ml-2">
                {ticketData.logs.map((log, i) => (
                  <div key={i} className="relative pl-6">
                    <div className="absolute w-4 h-4 bg-sky-500 rounded-full border-2 border-white -left-[35px] top-1 shadow-sm"></div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-sky-200 transition-colors">
                      <div className="flex items-center gap-2 text-xs font-bold text-sky-600 mb-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{log.date || new Date(log.created_at).toLocaleString('id-ID')}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">{log.user_name || 'Sistem'}</span>
                      </div>
                      <TruncatedText text={log.log_description || log.text} className="text-sm font-bold text-slate-700 leading-relaxed" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                <p className="font-semibold">Riwayat tiket kosong.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
