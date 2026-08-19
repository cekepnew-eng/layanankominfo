import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Monitor, ArrowLeft, Lock, Mail, ChevronRight } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    login('user');
    navigate('/dashboard');
  };

  const handleQuickLogin = (role) => {
    login(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans overflow-hidden">
      <div className="hidden md:flex md:w-1/2 relative bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/tugu.jpg" 
            alt="Tugu Kujang Bogor" 
            className="w-full h-full object-cover opacity-25 scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/95 to-indigo-950/80 z-10"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl z-15"></div>

        <div className="relative z-20 flex flex-col justify-between p-16 w-full text-white">
          <div className="flex items-center gap-3.5 text-left">
            <img src="/logo-bogor.png" alt="Logo Pemkot Bogor" className="h-12 w-auto object-contain" />
            <div>
              <p className="font-black text-lg tracking-wider text-white uppercase leading-none">Diskominfo</p>
              <p className="text-xs text-slate-350 font-bold uppercase tracking-widest mt-1">Kota Bogor</p>
            </div>
          </div>

          <div className="space-y-6 max-w-md text-left">
            <h1 className="text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white">
              Sinergi Teknologi Pemerintahan
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Mewujudkan efisiensi, akuntabilitas, dan pelayanan terbaik bagi warga Kota Bogor melalui penerapan arsitektur SPBE terintegrasi.
            </p>
          </div>

          <div className="text-sm text-slate-600 font-bold uppercase tracking-wider text-left">
            &copy; 2026 Pemerintah Kota Bogor.
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-20 bg-white relative z-20">
        <div className="absolute top-6 left-6 md:top-8 md:left-8">
          <Link to="/" className="flex items-center gap-1.5 text-slate-400 hover:text-sky-600 text-base font-bold transition-all">
            <ArrowLeft className="w-5 h-5" />
            <span>Beranda</span>
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm space-y-8 text-left">
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Masuk Akun</h2>
            <p className="text-slate-500 text-base leading-relaxed">Gunakan surat elektronik dinas resmi Anda untuk melanjutkan akses bantuan SPBE.</p>
          </div>

          <form className="space-y-5" onSubmit={handleFormSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Alamat Email Dinas</label>
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/20 transition-all">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-450">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama.instansi@bogor.go.id"
                  className="block w-full pl-11 pr-4 py-3 bg-transparent text-slate-800 text-base placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Kata Sandi</label>
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/20 transition-all">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-450">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-3 bg-transparent text-slate-800 text-base placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-base font-extrabold text-white shadow-md shadow-sky-500/10 hover:shadow-lg hover:shadow-sky-500/15 transition-all flex items-center justify-center"
            >
              Masuk
            </button>
          </form>

          <div className="border-t border-slate-100 pt-6 space-y-3">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Akses Cepat (Prototype Demo)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="flex items-center justify-between px-3.5 py-2.5 border border-slate-200/80 bg-slate-50/50 hover:bg-sky-50 hover:border-sky-200 rounded-xl text-sm font-bold text-slate-700 hover:text-sky-700 transition-all shadow-sm"
              >
                <span>Admin Panel</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-450" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('helpdesk')}
                className="flex items-center justify-between px-3.5 py-2.5 border border-slate-200/80 bg-slate-50/50 hover:bg-sky-50 hover:border-sky-200 rounded-xl text-sm font-bold text-slate-700 hover:text-sky-700 transition-all shadow-sm"
              >
                <span>Helpdesk Hub</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-450" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('pegawai')}
                className="flex items-center justify-between px-3.5 py-2.5 border border-slate-200/80 bg-slate-50/50 hover:bg-sky-50 hover:border-sky-200 rounded-xl text-sm font-bold text-slate-700 hover:text-sky-700 transition-all shadow-sm"
              >
                <span>Staf Pegawai</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-450" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('user')}
                className="flex items-center justify-between px-3.5 py-2.5 border border-slate-200/80 bg-slate-50/50 hover:bg-sky-50 hover:border-sky-200 rounded-xl text-sm font-bold text-slate-700 hover:text-sky-700 transition-all shadow-sm"
              >
                <span>User (OPD)</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-450" />
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-base text-slate-500">
              Belum terdaftar?{' '}
              <Link to="/auth/register" className="font-bold text-sky-600 hover:text-sky-500">
                Hubungi Admin / Daftar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
