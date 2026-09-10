import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { Monitor, ArrowLeft, Lock, Mail, ChevronRight, Check, ShieldCheck, QrCode, Copy } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpStep, setOtpStep] = useState(1);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [targetRole, setTargetRole] = useState('user');
  const [qrData, setQrData] = useState({ qrUrl: '', secretFormatted: '' });

  const identifyRoleFromTnd = (username) => {
    const userLower = (username || '').toLowerCase().trim();
    if (userLower.includes('admin') || userLower.includes('199001') || userLower.includes('ahmad') || userLower.includes('faisal')) {
      return 'admin';
    }
    if (userLower.includes('helpdesk') || userLower.includes('199002') || userLower.includes('siti') || userLower.includes('rahmawati')) {
      return 'helpdesk';
    }
    if (userLower.includes('rian') || userLower.includes('hidayat') || userLower.includes('pegawai') || userLower.includes('199003') || userLower.includes('programmer')) {
      return 'pegawai';
    }
    return 'user';
  };

  const openOtpModal = async (role, email) => {
    const data = await authService.getOtpSecret(email || identifier);
    setQrData(data);
    setOtpStep(1);
    setOtpCode('');
    setOtpError('');
    setTargetRole(role);
    setShowOtpModal(true);
  };

  const handleGmailSubmit = (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      alert('Silakan masukkan email Gmail Anda terlebih dahulu!');
      return;
    }
    if (!password) {
      alert('Silakan masukkan kata sandi terlebih dahulu!');
      return;
    }
    const emailLower = identifier.toLowerCase().trim();
    if (!emailLower.endsWith('@gmail.com')) {
      alert('Login e-mail biasa khusus untuk Masyarakat menggunakan akun Gmail (@gmail.com). Jika Anda adalah pegawai instansi daerah, silakan klik tombol "Masuk dengan SSO TND"!');
      return;
    }
    openOtpModal('masyarakat', emailLower);
  };

  const handleTndSubmit = (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      alert('Silakan masukkan Username TND atau NIP Pegawai terlebih dahulu!');
      return;
    }
    if (!password) {
      alert('Silakan masukkan kata sandi terlebih dahulu!');
      return;
    }
    const role = identifyRoleFromTnd(identifier);
    openOtpModal(role, identifier);
  };

  const handleQuickLogin = async (role) => {
    const quickEmails = {
      admin: 'ahmad.faisal@kotabogor.go.id',
      helpdesk: 'siti.rahmawati@kotabogor.go.id',
      pegawai: 'rian.hidayat@kotabogor.go.id',
      user: 'budi.utomo@kotabogor.go.id',
      masyarakat: 'mortazaaazkaa2509@gmail.com'
    };
    const email = quickEmails[role] || 'budi.utomo@kotabogor.go.id';
    setIdentifier(email);
    setPassword('password123');
    openOtpModal(role, email);
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    const result = await authService.verifyOtp(identifier, otpCode);
    if (result.success) {
      login(targetRole, identifier || null);
      setShowOtpModal(false);
      navigate('/dashboard');
    } else {
      setOtpError('Kode autentikasi salah! Masukkan 6 digit kode dari Google Authenticator (demo: 123456).');
    }
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

        <div className="mx-auto w-full max-w-sm space-y-6 text-left">
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Portal Masuk</h2>
            <p className="text-slate-500 text-base leading-relaxed">
              Masuk menggunakan akun e-mail Gmail (Masyarakat) atau Single Sign-On TND (OPD/Staf Pemerintah Kota Bogor).
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="identifier" className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
                Email Gmail / Username TND / NIP
              </label>
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/20 transition-all">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-450">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Gmail atau Username TND / NIP"
                  className="block w-full pl-11 pr-4 py-3 bg-transparent text-slate-800 text-base placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
                Kata Sandi
              </label>
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
                  placeholder="Masukkan kata sandi"
                  className="block w-full pl-11 pr-4 py-3 bg-transparent text-slate-800 text-base placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleGmailSubmit}
                className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-base font-extrabold text-white shadow-md shadow-sky-500/10 hover:shadow-lg hover:shadow-sky-500/15 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Mail className="w-5 h-5" />
                <span>Masuk dengan Gmail (Masyarakat)</span>
              </button>

              <button
                type="button"
                onClick={handleTndSubmit}
                className="w-full py-3.5 px-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-base font-extrabold text-slate-800 transition-all shadow-sm flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <img src="/logo-bogor.png" alt="Logo TND" className="h-5 w-auto object-contain" />
                <span>Masuk dengan SSO TND (OPD/Staf)</span>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-3">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Akses Cepat (Prototype Demo)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="flex items-center justify-between px-3 py-2 border border-slate-200/80 bg-slate-50/50 hover:bg-sky-50 hover:border-sky-200 rounded-xl text-sm font-bold text-slate-700 hover:text-sky-700 transition-all shadow-sm cursor-pointer"
              >
                <span>Admin</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-450" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('helpdesk')}
                className="flex items-center justify-between px-3 py-2 border border-slate-200/80 bg-slate-50/50 hover:bg-sky-50 hover:border-sky-200 rounded-xl text-sm font-bold text-slate-700 hover:text-sky-700 transition-all shadow-sm cursor-pointer"
              >
                <span>Helpdesk</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-450" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('pegawai')}
                className="flex items-center justify-between px-3 py-2 border border-slate-200/80 bg-slate-50/50 hover:bg-sky-50 hover:border-sky-200 rounded-xl text-sm font-bold text-slate-700 hover:text-sky-700 transition-all shadow-sm cursor-pointer"
              >
                <span>Pegawai (Teknisi)</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-450" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('user')}
                className="flex items-center justify-between px-3 py-2 border border-slate-200/80 bg-slate-50/50 hover:bg-sky-50 hover:border-sky-200 rounded-xl text-sm font-bold text-slate-700 hover:text-sky-700 transition-all shadow-sm cursor-pointer"
              >
                <span>User (OPD)</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-450" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('masyarakat')}
                className="col-span-2 flex items-center justify-between px-3 py-2 border border-slate-200/80 bg-slate-50/50 hover:bg-sky-50 hover:border-sky-200 rounded-xl text-sm font-bold text-slate-700 hover:text-sky-700 transition-all shadow-sm cursor-pointer"
              >
                <span>Masyarakat Umum (Gmail)</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-450" />
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-base text-slate-500">
              Belum terdaftar?{' '}
              <Link to="/auth/register" className="font-bold text-sky-600 hover:text-sky-500">
                Daftar Baru
              </Link>
            </p>
          </div>
        </div>
      </div>

      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-8 border border-slate-100 shadow-2xl space-y-6 text-left animate-in fade-in zoom-in-95 duration-200">

            {otpStep === 1 && (
              <>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100/60 mb-3">
                    <QrCode className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Daftarkan Perangkat 2FA</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Buka aplikasi <strong className="text-slate-800">Google Authenticator</strong> di ponsel Anda, lalu pindai QR code di bawah ini untuk mendaftarkan akun.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
                    {qrData.qrUrl ? (
                      <img src={qrData.qrUrl} alt="QR Google Authenticator" className="w-48 h-48 object-contain" />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">Memuat QR...</div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 text-center">Tidak bisa scan? Masukkan kode manual:</p>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">
                    <code className="text-sm font-black text-slate-800 tracking-widest">{qrData.secretFormatted}</code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(qrData.secret || '')}
                      className="text-slate-400 hover:text-sky-600 transition-all"
                      title="Salin kode"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 rounded-xl text-base font-extrabold text-slate-700 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpError(''); setOtpStep(2); }}
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-base font-extrabold transition-all"
                  >
                    Lanjut &rarr;
                  </button>
                </div>
              </>
            )}

            {otpStep === 2 && (
              <>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center border border-sky-100/60 mb-3">
                    <ShieldCheck className="w-6 h-6 text-sky-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Verifikasi 2FA</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Buka <strong className="text-slate-800">Google Authenticator</strong> dan masukkan 6-digit kode yang tampil untuk akun <strong className="text-slate-800">SPBE Diskominfo</strong>.
                  </p>
                </div>

                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider">Kode OTP 6-Digit</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => { setOtpCode(e.target.value); setOtpError(''); }}
                      placeholder="Contoh: 123456"
                      autoFocus
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-lg font-black tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>

                  {otpError && (
                    <p className="text-sm font-bold text-rose-600 bg-rose-50 border border-rose-100 p-3.5 rounded-xl">
                      {otpError}
                    </p>
                  )}

                  <div className="bg-sky-50 text-sky-850 p-4 rounded-xl border border-sky-100 text-sm leading-relaxed font-semibold">
                    Demo prototipe: masukkan kode <strong className="text-sky-950 font-black">123456</strong>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setOtpStep(1)}
                      className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 rounded-xl text-base font-extrabold text-slate-700 transition-all"
                    >
                      &larr; Kembali
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-base font-extrabold transition-all"
                    >
                      Verifikasi &amp; Masuk
                    </button>
                  </div>
                </form>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
