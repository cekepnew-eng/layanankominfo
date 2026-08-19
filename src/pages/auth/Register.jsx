import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Monitor, ArrowLeft, Lock, Mail, User, Building } from 'lucide-react';

export const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    login('user');
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
          <div className="flex items-center gap-3 text-left">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Monitor className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <p className="font-extrabold text-base tracking-widest text-amber-500 uppercase leading-none">Diskominfo</p>
              <p className="text-sm text-slate-400 font-semibold mt-1">Kota Bogor</p>
            </div>
          </div>

          <div className="space-y-6 max-w-md text-left">
            <h1 className="text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white">
              Satu Akses Layanan IT Instansi
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Daftarkan perwakilan dinas atau kecamatan Anda untuk mengelola integrasi sistem, pengamanan informasi, dan pengajuan fasilitas TIK secara mandiri.
            </p>
          </div>

          <div className="text-sm text-slate-650 font-bold uppercase tracking-wider text-left">
            &copy; 2026 Pemerintah Kota Bogor.
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-20 bg-white relative z-20">
        <div className="absolute top-8 left-8 md:left-12 lg:left-20">
          <Link to="/" className="flex items-center gap-1.5 text-slate-400 hover:text-sky-600 text-base font-bold transition-all">
            <ArrowLeft className="w-5 h-5" />
            <span>Beranda</span>
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm space-y-8 text-left">
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Daftar Baru</h2>
            <p className="text-slate-400 text-base leading-relaxed">Isi formulir secara lengkap untuk mendaftarkan akun instansi dinas resmi Anda.</p>
          </div>

          <form className="space-y-6" onSubmit={handleFormSubmit}>
            <div className="space-y-1">
              <label htmlFor="name" className="block text-sm font-bold text-slate-450 uppercase tracking-widest">Nama Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center text-slate-450">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Rahmat Hidayat"
                  className="block w-full pl-7 pr-3 py-3 bg-transparent border-b border-slate-200 text-slate-800 text-base placeholder-slate-300 focus:outline-none focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="department" className="block text-sm font-bold text-slate-450 uppercase tracking-widest">Nama Dinas / OPD</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center text-slate-450">
                  <Building className="w-4 h-4" />
                </div>
                <input
                  id="department"
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Dinas Ketahanan Pangan"
                  className="block w-full pl-7 pr-3 py-3 bg-transparent border-b border-slate-200 text-slate-800 text-base placeholder-slate-300 focus:outline-none focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-bold text-slate-450 uppercase tracking-widest">Email Resmi Pemerintah</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center text-slate-450">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahmat.hidayat@bogor.go.id"
                  className="block w-full pl-7 pr-3 py-3 bg-transparent border-b border-slate-200 text-slate-800 text-base placeholder-slate-300 focus:outline-none focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-bold text-slate-450 uppercase tracking-widest">Kata Sandi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center text-slate-450">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-7 pr-3 py-3 bg-transparent border-b border-slate-200 text-slate-800 text-base placeholder-slate-300 focus:outline-none focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 px-4 rounded-xl bg-slate-900 hover:bg-slate-855 text-base font-bold text-white transition-all"
            >
              Buat Akun
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-base text-slate-400">
              Sudah memiliki akun?{' '}
              <Link to="/auth/login" className="font-bold text-sky-600 hover:text-sky-500">
                Masuk ke sistem
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
