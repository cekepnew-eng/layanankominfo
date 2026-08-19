import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Star, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

export const ManageRatings = () => {
  const { ratings, toggleRatingForLanding } = useAuth();
  const [selectedStarFilter, setSelectedStarFilter] = useState('all');

  const totalRatings = ratings.length;
  const commentedRatings = ratings.filter(r => r.comment && r.comment.trim() !== '');
  const starOnlyRatings = ratings.filter(r => !r.comment || r.comment.trim() === '');
  const selectedRatingsCount = ratings.filter(r => r.selectedForLanding).length;

  const displayedRatings = selectedStarFilter === 'all'
    ? ratings
    : ratings.filter(r => r.rating === selectedStarFilter);

  return (
    <div className="space-y-8 font-sans text-left">
      <div className="space-y-1.5">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Ulasan & Rating</h2>
        <p className="text-slate-500 text-base leading-relaxed">Pantau ulasan kepuasan layanan SPBE, rating bintang, dan komentar yang dikirimkan oleh perwakilan OPD daerah Kota Bogor.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Responden Rating</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{totalRatings} Orang</p>
          <p className="text-sm text-slate-500 mt-1.5">Total responden yang mengisi penilaian survei.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rating Dengan Ulasan Komentar</p>
          <p className="text-3xl font-black text-sky-600 mt-1">{commentedRatings.length} Orang</p>
          <p className="text-sm text-slate-500 mt-1.5">Responden yang menyertakan ulasan tertulis komentar.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rating Hanya Bintang</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{starOnlyRatings.length} Orang</p>
          <p className="text-sm text-slate-500 mt-1.5">Responden yang hanya memberikan penilaian bintang.</p>
        </div>
      </div>

      <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="text-sm text-sky-850 space-y-1">
          <p className="font-bold text-slate-800">Aturan Tampilan Testimoni Landing Page</p>
          <p className="leading-relaxed text-slate-650">Silakan pilih **tepat 10 ulasan komentar** di bawah ini untuk ditampilkan pada slider testimoni halaman depan. Saat ini terpilih **{selectedRatingsCount} ulasan**.</p>
        </div>
      </div>

      {/* Filter Bintang Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/60 pb-5">
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mr-2">Filter Bintang:</span>
        <button
          onClick={() => setSelectedStarFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedStarFilter === 'all'
              ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/20'
              : 'bg-white hover:bg-slate-50 text-slate-650 border border-slate-200'
          }`}
        >
          Semua ({ratings.length})
        </button>
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = ratings.filter(r => r.rating === stars).length;
          return (
            <button
              key={stars}
              onClick={() => setSelectedStarFilter(stars)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedStarFilter === stars
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/20'
                  : 'bg-white hover:bg-slate-50 text-slate-650 border border-slate-200'
              }`}
            >
              <span>{stars} Bintang</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                selectedStarFilter === stars ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedRatings.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400 space-y-3">
            <ShieldAlert className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold text-base">Tidak ada ulasan komentar dengan {selectedStarFilter} bintang.</p>
          </div>
        ) : (
          displayedRatings.map((r) => (
            <div 
              key={r.id} 
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between hover:shadow-md transition-all ${
                r.selectedForLanding ? 'border-sky-500 ring-1 ring-sky-500/20' : 'border-slate-200'
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} />
                    ))}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    r.status?.includes('SLA') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {r.status || 'Selesai'}
                  </span>
                </div>
                
                {/* Badge Layanan Yang Di-rating */}
                <div className="flex items-center">
                  <span className="px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-500">
                    Layanan: {r.service || 'SPBE Diskominfo'}
                  </span>
                </div>

                {r.comment && r.comment.trim() !== '' ? (
                  <p className="text-base text-slate-655 leading-relaxed italic">
                    "{r.comment}"
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic font-medium">
                    (Tidak ada ulasan tertulis / Hanya memberikan rating bintang)
                  </p>
                )}

                {r.aspects && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-xs">
                    <div className="flex justify-between items-center text-slate-550 font-bold">
                      <span>Kecepatan</span>
                      <span className="text-amber-600 flex items-center gap-0.5 font-extrabold">★ {r.aspects.speed}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-550 font-bold">
                      <span>Kesesuaian</span>
                      <span className="text-amber-600 flex items-center gap-0.5 font-extrabold">★ {r.aspects.result}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-550 font-bold">
                      <span>Komunikasi</span>
                      <span className="text-amber-600 flex items-center gap-0.5 font-extrabold">★ {r.aspects.communication}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-550 font-bold">
                      <span>Kualitas</span>
                      <span className="text-amber-600 flex items-center gap-0.5 font-extrabold">★ {r.aspects.quality}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">OPD Pengirim</span>
                  <span className="text-sm font-bold text-slate-800">{r.name}</span>
                </div>
                
                {r.comment && r.comment.trim() !== '' ? (
                  <button
                    type="button"
                    onClick={() => toggleRatingForLanding(r.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      r.selectedForLanding 
                        ? 'bg-sky-600 hover:bg-sky-700 text-white' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {r.selectedForLanding ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ditampilkan (Landing)</span>
                      </>
                    ) : (
                      <span>Tampilkan</span>
                    )}
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-md">
                    Hanya Bintang
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};