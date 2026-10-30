import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ActionModal } from '../../components/ActionModal';
import { ArrowLeft, Lock, Mail, User, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { getPasswordStrength } from '../../utils/passwordStrength';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    confirmText: 'Tutup',
    onConfirm: null
  });

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));
  const normalizedEmail = email.trim().toLowerCase();

  const { requirements: passwordRequirements, level, badgeColor, color, isStrong: isPasswordStrong } = getPasswordStrength(password);
  const strength = password ? { text: level, color: badgeColor } : null;

  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError('Coba cocokkan password Anda kembali');
    } else {
      setPasswordError('');
    }
  }, [password, confirmPassword]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (verifiedEmail !== normalizedEmail) {
      setOtpError('Verifikasi email terlebih dahulu sebelum membuat akun.');
      return;
    }

    if (!isPasswordStrong) {
      const unmet = passwordRequirements.filter(r => !r.met).map(r => `\u2022 ${r.label}`).join('\n');
      setModalConfig({ isOpen: true, type: 'warning', title: 'Kata Sandi Belum Memenuhi Standar', message: `Kata sandi harus memenuhi semua kriteria berikut:\n${unmet}\n\nPastikan kata sandi diawali huruf kapital, minimal 8 karakter, mengandung angka, dan simbol.`, confirmText: 'Perbaiki Kata Sandi' });
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok! Pastikan kata sandi dan konfirmasi kata sandi sama.');
      return;
    }

    setPasswordError('');

    setIsRegistering(true);
    try {
      const regResult = await register({
        email: normalizedEmail,
        password,
        fullName: name,
        phone: '00000',
        otp: otpCode
      });
      if (!regResult.success) {
        setVerifiedEmail('');
        setOtpMessage('');
        setOtpError(regResult.message || 'Registrasi gagal.');
        setModalConfig({ isOpen: true, type: 'danger', title: 'Registrasi Gagal', message: regResult.message || 'Registrasi gagal', confirmText: 'Tutup' });
        return;
      }

      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Berhasil',
        message: 'Email berhasil diverifikasi dan akun Anda telah dibuat.',
        confirmText: 'Lanjutkan',
        onConfirm: () => navigate('/auth/login')
      });
    } catch (err) {
      setModalConfig({ isOpen: true, type: 'danger', title: 'Registrasi Gagal', message: err.message || 'Registrasi gagal', confirmText: 'Tutup' });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRequestOtp = async () => {
    setOtpError('');
    setOtpMessage('');
    setVerifiedEmail('');
    setOtpCode('');
    setIsSendingOtp(true);
    try {
      const result = await api.requestRegistrationOtp(normalizedEmail);
      setOtpRequested(true);
      setOtpMessage(result.message || 'Kode OTP sudah dikirim ke email Anda.');
    } catch (err) {
      setOtpRequested(false);
      setOtpError(err.message || 'Gagal mengirim kode OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyEmail = async () => {
    setOtpError('');
    setOtpMessage('');
    setIsVerifyingOtp(true);
    try {
      const result = await api.verifyRegistrationOtp(normalizedEmail, otpCode);
      setVerifiedEmail(normalizedEmail);
      setOtpMessage(result.message || 'Email berhasil diverifikasi.');
    } catch (err) {
      setVerifiedEmail('');
      setOtpError(err.message || 'Kode OTP tidak valid.');
    } finally {
      setIsVerifyingOtp(false);
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-400 text-xs font-black uppercase tracking-widest">
              Portal Helpdesk SPBE
            </div>
            <h1 className="text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white">
              Helpdesk Digital Layanan DISKOMINFO
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Pusat bantuan dan sistem pelayanan terpadu Diskominfo Kota Bogor untuk penanganan permohonan, bantuan teknis, dan digitalisasi layanan secara cepat, transparan, dan akuntabel.
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
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Email Aktif</label>
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/20 transition-all">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-450">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  disabled={isSendingOtp || isVerifyingOtp || isRegistering}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setOtpCode('');
                    setOtpRequested(false);
                    setVerifiedEmail('');
                    setOtpError('');
                    setOtpMessage('');
                  }}
                  placeholder="nama@email.com"
                  className="block w-full pl-11 pr-4 py-3 bg-transparent text-slate-800 text-base placeholder-slate-400 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={!normalizedEmail || isSendingOtp || isVerifyingOtp || isRegistering}
                className="mt-2 text-sm font-bold text-sky-700 hover:text-sky-800 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {isSendingOtp ? 'Mengirim kode...' : otpRequested ? 'Kirim ulang kode OTP' : 'Kirim kode OTP ke email'}
              </button>
              {otpRequested && (
                <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <label htmlFor="emailOtp" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Kode OTP Email
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="emailOtp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setOtpError('');
                      }}
                      placeholder="Masukkan 6 digit kode"
                      disabled={verifiedEmail === normalizedEmail}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center font-bold tracking-[0.3em] text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-100"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyEmail}
                      disabled={otpCode.length !== 6 || isVerifyingOtp || verifiedEmail === normalizedEmail}
                      className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {isVerifyingOtp ? 'Memeriksa...' : 'Verifikasi'}
                    </button>
                  </div>
                </div>
              )}
              {otpError && <p className="text-xs font-bold text-rose-600">{otpError}</p>}
              {otpMessage && (
                <p className={`flex items-center gap-1.5 text-xs font-semibold ${verifiedEmail === normalizedEmail ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {verifiedEmail === normalizedEmail && <ShieldCheck className="h-4 w-4" />}
                  {otpMessage}
                </p>
              )}
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
              {password && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${strength.color}`}>
                      {strength.text}
                    </span>
                    <div className="flex-1 flex gap-1 h-1.5">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className={`flex-1 rounded-full ${req.met ? color : 'bg-slate-200'}`}></div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1 pt-0.5">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black ${req.met
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-slate-100 text-slate-400'
                          }`}>
                          {req.met ? '\u2713' : '\u25CB'}
                        </span>
                        <span className={`text-[11px] font-semibold ${req.met ? 'text-emerald-700' : 'text-slate-500'
                          }`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  {!isPasswordStrong && (
                    <p className="text-[11px] text-rose-600 font-semibold">
                      Kata sandi harus <span className="font-black">Kuat</span> untuk dapat mendaftar.
                    </p>
                  )}
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
              disabled={isRegistering || !isPasswordStrong}
              className={`w-full py-3.5 px-4 rounded-xl text-base font-extrabold text-white shadow-md transition-all flex items-center justify-center ${!isPasswordStrong
                ? 'bg-slate-300 cursor-not-allowed opacity-60'
                : 'bg-sky-600 hover:bg-sky-700 shadow-sky-500/10 hover:shadow-lg hover:shadow-sky-500/15 cursor-pointer'
                }`}
            >
              {isRegistering ? 'Membuat Akun...' : 'Buat Akun'}
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
