import React, { useState, useEffect } from 'react';
import { FileText, Star, AlertCircle, CheckCircle2, ChevronRight, Check } from 'lucide-react';
import { api } from '../../services/api';

export const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.getMyTickets();
      setTickets(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil data tiket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSendSurvey = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      await api.submitFeedback(selectedTicket.id, { rating, comment });
      alert('Penilaian berhasil dikirim. Terima kasih!');
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim penilaian');
    }
  };

  const getStatusColor = (statusName) => {
    switch (statusName) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'VERIFIED': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'IN_PROGRESS': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'WAITING_USER_CONFIRMATION': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) return <div className="p-8 text-slate-500 font-bold">Loading tiket saya...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-left">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tiket Pengajuan Saya</h2>
        <p className="text-slate-500">Pantau status layanan dan berikan penilaian untuk pekerjaan yang telah selesai.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center border-b border-slate-100">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Belum Ada Tiket</h3>
            <p className="text-slate-500">Anda belum membuat tiket pengajuan layanan.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map(ticket => (
              <div key={ticket.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono font-bold text-sm text-slate-500">{ticket.ticket_number}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(ticket.status_name)}`}>
                          {ticket.status_name.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1">{ticket.service_name}</h4>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>Diajukan: {new Date(ticket.created_at).toLocaleDateString('id-ID')}</span>
                        {ticket.status_name === 'IN_PROGRESS' && (
                          <span className="text-sky-600 font-semibold">Progress: {ticket.progress}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {ticket.status_name === 'WAITING_USER_CONFIRMATION' && (
                      <button 
                        onClick={() => setSelectedTicket(ticket)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Beri Penilaian
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RATING MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Beri Penilaian Layanan</h3>
                <p className="text-sm text-slate-500 mt-1">Tiket: {selectedTicket.ticket_number}</p>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSendSurvey} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Bintang Penilaian (1-5)</label>
                  <input type="number" min="1" max="5" value={rating} onChange={(e)=>setRating(e.target.value)} className="w-full border p-2 rounded-xl" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Ulasan</label>
                  <textarea value={comment} onChange={(e)=>setComment(e.target.value)} className="w-full border p-2 rounded-xl" rows="4" required></textarea>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setSelectedTicket(null)} className="flex-1 px-4 py-3 border rounded-xl font-bold">Batal</button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold">Kirim Penilaian</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
