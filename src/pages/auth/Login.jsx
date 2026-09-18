import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { api } from '../../services/api';
import { Monitor, ArrowLeft, Lock, Mail, ChevronRight, Check, ShieldCheck, QrCode, Copy } from 'lucide-react';

export const Login = () => {
  const { login, login2FA, setUser } = useAuth();
  const navigate = useNavigate();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [tempToken, setTempToken] = useState('');

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpStep, setOtpStep] = useState(1);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [targetRole, setTargetRole] = useState('user');
  const [qrData, setQrData] = useState({ qrUrl: '', secretFormatted: '' });
  const [captchaData, setCaptchaData] = useState({ text: '', token: '' });
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const loadCaptcha = async () => {
    try {
      const data = await api.getCaptcha();
      
      if (data.success) {
        setCaptchaData({ text: data.text, token: data.token });
        setCaptchaAnswer('');
      } else {
        setCaptchaData({ text: 'Error: ' + (data.message || 'Gagal memuat'), token: '' });
      }
    } catch (err) {
      console.error('Failed to load captcha', err);
      setCaptchaData({ text: 'Error Jaringan: ' + err.message, token: '' });
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

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

  const triggerLogin = async (email, pass, cToken, cAnswer) => {
    const loginResult = await login(email, pass, cToken, cAnswer);
    if (loginResult && loginResult.requires2FA) {
      setTempToken(loginResult.tempToken);
      setOtpStep(2);
      setShowOtpModal(true);
    } else if (loginResult && loginResult.requires2FASetup) {
      setTempToken(loginResult.tempToken);
      try {
        const qrRes = await api.generate2FA(loginResult.tempToken);
        if (qrRes.success) {
          setQrData({ qrUrl: qrRes.qrCodeUrl, secretFormatted: qrRes.secret });
          setOtpStep(1);
          setOtpCode('');
          setOtpError('');
          setShowOtpModal(true);
        } else {
          alert('Gagal generate QR Code 2FA.');
        }
      } catch (err) {
        alert('Error generate 2FA QR: ' + err.message);
      }
    } else if (loginResult && loginResult.success) {
      navigate('/dashboard');
    } else {
      alert(loginResult?.message || 'Login gagal, periksa kredensial Anda.');
      loadCaptcha(); // Reload captcha on failure
    }
  };

  useEffect(() => {
    if (showOtpModal) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [showOtpModal]);

  const normalizeLoginEmail = (value) => {
    const raw = (value || '').trim().toLowerCase();
    if (!raw) return '';

    if (raw.includes('@')) {
      const [localPart, domainPart] = raw.split('@');
      if (!localPart || !domainPart) return raw;

      const normalizedDomain = domainPart.replace(/^kota\./, '').replace(/^(bogor\.)?id$/i, 'bogor.go.id');
      if (domainPart.toLowerCase().includes('bogor')) {
        return `${localPart}@${normalizedDomain}`;
      }

      return raw;
    }

    if (['admin', 'helpdesk', 'pegawai', 'user'].includes(raw)) {
      return `${raw}@bogor.go.id`;
    }

    if (raw === 'masyarakat') {
      return 'masyarakat@bogor.go.id';
    }

    return raw;
  };

  const handleStandardLogin = (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim() || !password) {
      alert('Silakan masukkan Email/Username dan password terlebih dahulu!');
      return;
    }
    if (!captchaAnswer.trim()) {
      alert('Silakan isi Captcha terlebih dahulu!');
      return;
    }

    const email = normalizeLoginEmail(identifier);
    triggerLogin(email, password, captchaData.token, captchaAnswer);
  };

  const handleGmailSubmit = (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim() || !password) {
      alert('Silakan masukkan email dan password terlebih dahulu!');
      return;
    }
    if (!captchaAnswer.trim()) {
      alert('Silakan isi Captcha terlebih dahulu!');
      return;
    }
    const emailLower = normalizeLoginEmail(identifier);
    triggerLogin(emailLower, password, captchaData.token, captchaAnswer);
  };

  const handleTndSubmit = (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim() || !password) {
      alert('Silakan masukkan Username/Email dan password terlebih dahulu!');
      return;
    }
    if (!captchaAnswer.trim()) {
      alert('Silakan isi Captcha terlebih dahulu!');
      return;
    }
    triggerLogin(normalizeLoginEmail(identifier), password, captchaData.token, captchaAnswer);
  };

  const handleQuickLogin = async (role) => {
    const quickEmails = {
      admin: 'admin@bogor.go.id',
      helpdesk: 'helpdesk@bogor.go.id',
      pegawai: 'pegawai@bogor.go.id',
      user: 'opd@bogor.go.id',
      masyarakat: 'masyarakat@bogor.go.id'
    };
    const quickPasswords = {
      admin: 'admin123',
      helpdesk: 'admin123',
      pegawai: 'admin123',
      user: 'admin123',
      masyarakat: 'admin123'
    };

    const email = quickEmails[role] || 'masyarakat@bogor.go.id';
    const password = quickPasswords[role] || 'admin123';
    setIdentifier(email);
    setPassword(password);

    const match = captchaData.text?.match(/(\d+)\s*\+\s*(\d+)/i);
    const answer = match ? Number(match[1]) + Number(match[2]) : '';
    triggerLogin(email, password, captchaData.token, String(answer));
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Masukkan 6 digit kode OTP');
      return;
    }
    
    // Check if we are doing setup or login
    if (qrData.qrUrl) {
      // Doing Setup
      try {
        const result = await api.verifySetup2FA(tempToken, otpCode);
        if (result.success) {
          const userData = result.user || { id: null, email: '', name: '', role: 'USER', roles: ['USER'] };
          if (userData.role) userData.role = String(userData.role).toUpperCase();
          if (userData.roles) userData.roles = userData.roles.map((role) => String(role).toUpperCase());

          localStorage.setItem('spbe_token', result.token);
          localStorage.setItem('spbe_user', JSON.stringify(userData));
          setUser(userData);
          setShowOtpModal(false);
          navigate('/dashboard');
        } else {
          setOtpError(result.message || 'Kode autentikasi salah!');
        }
      } catch (err) {
        setOtpError(err.message || 'Kesalahan server saat verifikasi setup.');
      }
    } else {
      // Normal Login
      const result = await login2FA(tempToken, otpCode);
      if (result && result.success) {
        setShowOtpModal(false);
        navigate('/dashboard');
      } else {
        setOtpError(result?.message || 'Kode autentikasi salah!');
      }
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

            <div className="space-y-1.5 pt-2">
              <label htmlFor="captcha" className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
                Verifikasi Keamanan
              </label>
              <div className="flex gap-3">
                <div className="flex-1 bg-slate-100/80 border border-slate-200 rounded-xl px-4 flex items-center justify-center cursor-pointer" onClick={loadCaptcha} title="Klik untuk memuat ulang">
                  {captchaData.text ? (
                    <span className="font-mono font-extrabold text-slate-700 tracking-wider text-sm select-none">{captchaData.text}</span>
                  ) : (
                    <div className="w-20 h-4 bg-slate-200 rounded animate-pulse"></div>
                  )}
                </div>
                <div className="flex-1 relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/20 transition-all">
                  <input
                    id="captcha"
                    type="text"
                    required
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder="Jawaban"
                    className="block w-full px-4 py-3 bg-transparent text-slate-800 text-base placeholder-slate-400 focus:outline-none font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-4">
              <button
                type="button"
                onClick={handleStandardLogin}
                className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-base font-extrabold text-white shadow-md shadow-sky-500/10 hover:shadow-lg hover:shadow-sky-500/15 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>Masuk</span>
              </button>

              <button
                type="button"
                onClick={handleGmailSubmit}
                className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-base font-extrabold text-white shadow-md shadow-red-500/10 hover:shadow-lg hover:shadow-red-500/15 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-200 font-sans">
          <div className="relative bg-white max-w-md sm:max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xl space-y-5 text-left animate-in zoom-in-95 duration-200">

            {otpStep === 1 && (
              <>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100/60 mb-1">
                    <QrCode className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">Daftarkan Perangkat 2FA</h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Sebelum masuk ke sistem, daftarkan akun Anda ke aplikasi <strong className="text-slate-800">Google Authenticator</strong> dengan memindai QR code di bawah ini.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2.5 pt-1">
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                    <img 
                      src={qrData.qrUrl || '/google_authenticator_qr.png'} 
                      onError={(e) => { e.target.src = '/google_authenticator_qr.png'; }}
                      alt="QR Google Authenticator" 
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain" 
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium text-center">Tidak bisa scan? Masukkan kode manual:</p>
                  <div className="flex items-center gap-2.5 px-4 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
                    <code className="text-sm font-black text-slate-800 tracking-wider font-mono">{qrData.secretFormatted}</code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(qrData.secretFormatted || '')}
                      className="text-slate-400 hover:text-sky-600 transition-all cursor-pointer p-0.5"
                      title="Salin kode"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    className="flex-1 py-3 px-5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm sm:text-base font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpError(''); setOtpStep(2); }}
                    className="flex-1 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm sm:text-base font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                  >
                    Lanjut &rarr;
                  </button>
                </div>
              </>
            )}

            {otpStep === 2 && (
              <>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center border border-sky-100/60 mb-1">
                    <ShieldCheck className="w-6 h-6 text-sky-600" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">Verifikasi 2FA</h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Buka <strong className="text-slate-800">Google Authenticator</strong> dan masukkan 6-digit kode yang tampil untuk akun <strong className="text-slate-800">SPBE Diskominfo</strong>.
                  </p>
                </div>

                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Kode OTP 6-Digit</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => { setOtpCode(e.target.value); setOtpError(''); }}
                      placeholder="Contoh: 123456"
                      autoFocus
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xl sm:text-2xl font-black tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>

                  {otpError && (
                    <p className="text-xs sm:text-sm font-bold text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl">
                      {otpError}
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    {qrData.qrUrl && (
                      <button
                        type="button"
                        onClick={() => setOtpStep(1)}
                        className="flex-1 py-3 px-5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm sm:text-base font-bold text-slate-700 transition-all cursor-pointer"
                      >
                        &larr; Kembali
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 py-3 px-5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm sm:text-base font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer"
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
