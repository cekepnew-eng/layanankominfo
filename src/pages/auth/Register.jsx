import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ActionModal } from '../../components/ActionModal';
import { Monitor, ArrowLeft, Lock, Mail, User, ShieldCheck, QrCode, Copy, Eye, EyeOff } from 'lucide-react';

export const Register = () => {
  const { login, register, setUser } = useAuth();
  const { generate2FA, verifySetup2FA } = api;
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    confirmText: 'Tutup',
    onConfirm: null
  });

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const getPasswordStrength = (pass) => {
    if (!pass) return null;
    let score = 0;
    if (pass.length > 5) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score < 2) return { text: 'Lemah', color: 'text-rose-600 bg-rose-50 border-rose-200' };
    if (score === 2 || score === 3) return { text: 'Sedang', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { text: 'Kuat', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  };

  const strength = getPasswordStrength(password);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpStep, setOtpStep] = useState(1);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [targetRole, setTargetRole] = useState('masyarakat');
  const [qrData, setQrData] = useState({ qrUrl: '', secretFormatted: '' });
  const [tempToken, setTempToken] = useState('');

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

  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError('Coba cocokkan password Anda kembali');
    } else {
      setPasswordError('');
    }
  }, [password, confirmPassword]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const emailLower = email.toLowerCase().trim();

    // Password Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      setModalConfig({ isOpen: true, type: 'warning', title: 'Perhatian', message: 'Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka.', confirmText: 'Mengerti' });
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok! Pastikan kata sandi dan konfirmasi kata sandi sama.');
      return;
    }
    
    setPasswordError('');
    
    const regResult = await register({ email: emailLower, password, fullName: name, phone: '00000' });
    if (!regResult.success) {
      setModalConfig({ isOpen: true, type: 'danger', title: 'Registrasi Gagal', message: regResult.message || 'Registrasi gagal', confirmText: 'Tutup' });
      return;
    }

    setModalConfig({
      isOpen: true,
      type: 'success',
      title: 'Berhasil',
      message: 'Anda berhasil membuat akun',
      confirmText: 'Lanjutkan',
      onConfirm: () => navigate('/auth/login')
    });
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Masukkan 6 digit kode OTP');
      return;
    }

    try {
      const result = await verifySetup2FA(tempToken, otpCode);
      if (result.success) {
        // Save the real token
        localStorage.setItem('spbe_token', result.token);
        // Ensure role is preserved exactly from backend
        if (result.user && result.user.role) {
          result.user.role = result.user.role;
        }
        setUser(result.user);
        setShowOtpModal(false);
        navigate('/dashboard');
      } else {
        setOtpError(result.message || 'Kode autentikasi salah!');
      }
    } catch (err) {
      setOtpError(err.message || 'Terjadi kesalahan saat verifikasi.');
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
              Satu Akses Layanan Publik
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Daftarkan akun Anda sebagai perwakilan masyarakat umum untuk mengajukan layanan publik, permohonan, maupun pelaporan ke Diskominfo secara mandiri.
            </p>
          </div>

          <div className="text-sm text-slate-650 font-bold uppercase tracking-wider text-left">
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
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Daftar Akun Masyarakat</h2>
            <p className="text-slate-500 text-base leading-relaxed">Isi formulir secara lengkap untuk mendaftarkan akun masyarakat umum Anda.</p>
          </div>

          <form className="space-y-5" onSubmit={handleFormSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/20 transition-all">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-450">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap Anda"
                  className="block w-full pl-11 pr-4 py-3 bg-transparent text-slate-800 text-base placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Email Gmail Aktif</label>
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/20 transition-all">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-450">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Gmail Anda"
                  className="block w-full pl-11 pr-4 py-3 bg-transparent text-slate-800 text-base placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-bold text-slate-550 uppercase tracking-wider">Kata Sandi</label>
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/20 transition-all">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-450">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="block w-full pl-11 pr-12 py-3 bg-transparent text-slate-800 text-base placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-sky-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {strength && (
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${strength.color}`}>
                    {strength.text}
                  </span>
                  <div className="flex-1 flex gap-1 h-1.5">
                    <div className={`flex-1 rounded-full ${strength.text === 'Lemah' ? 'bg-rose-500' : strength.text === 'Sedang' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                    <div className={`flex-1 rounded-full ${strength.text === 'Lemah' ? 'bg-slate-200' : strength.text === 'Sedang' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                    <div className={`flex-1 rounded-full ${strength.text === 'Kuat' ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-550 uppercase tracking-wider">Konfirmasi Kata Sandi</label>
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/20 transition-all">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-450">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi Anda"
                  className="block w-full pl-11 pr-12 py-3 bg-transparent text-slate-800 text-base placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-sky-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs font-bold text-rose-500 mt-1">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-base font-extrabold text-white shadow-md shadow-sky-500/10 hover:shadow-lg hover:shadow-sky-500/15 transition-all flex items-center justify-center"
            >
              Buat Akun
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-base text-slate-500">
              Sudah memiliki akun?{' '}
              <Link to="/auth/login" className="font-bold text-sky-600 hover:text-sky-500">
                Masuk ke sistem
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
                    Selamat datang! Sebelum menggunakan layanan, daftarkan akun Anda ke <strong className="text-slate-800">Google Authenticator</strong> dengan memindai QR code di bawah ini.
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
                      onClick={() => navigator.clipboard?.writeText(qrData.secret || '')}
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
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">Verifikasi Akun Baru</h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Masukkan 6-digit kode dari <strong className="text-slate-800">Google Authenticator</strong> untuk mengaktifkan akun Anda.
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
                    <button
                      type="button"
                      onClick={() => setOtpStep(1)}
                      className="flex-1 py-3 px-5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm sm:text-base font-bold text-slate-700 transition-all cursor-pointer"
                    >
                      &larr; Kembali
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 px-5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm sm:text-base font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer"
                    >
                      Aktifkan Akun
                    </button>
                  </div>
                </form>
              </>
            )}

          </div>
        </div>
      )}

      <ActionModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
};
