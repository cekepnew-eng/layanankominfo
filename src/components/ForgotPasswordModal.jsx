import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { getPasswordStrength } from '../utils/passwordStrength';
import {
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  X,
  Loader2,
  Clock,
  RefreshCw,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

export const ForgotPasswordModal = ({ isOpen, onClose, onSuccess }) => {
  // Step 1: Input Email/NIP
  // Step 2: Input 6-Digit OTP only
  // Step 3: Input New Password & Confirm Password only
  // Step 4: Success confirmation
  const [step, setStep] = useState(1);

  const [identifier, setIdentifier] = useState('');
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [method, setMethod] = useState('email');

  // OTP input state
  const [otp, setOtp] = useState('');
  const otpInputRef = useRef(null);

  // Wrong OTP Modal State
  const [showWrongOtpModal, setShowWrongOtpModal] = useState(false);
  const [wrongOtpMessage, setWrongOtpMessage] = useState('');

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    requirements: passwordRequirements,
    level,
    color,
    textColor,
    isStrong: isPasswordStrong
  } = getPasswordStrength(newPassword);
  const passwordStrengthObj = { label: level, color, text: textColor };

  // Feedback & Loading
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cooldown countdown for resending OTP (60s)
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      handleReset();
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  // Focus OTP input when entering step 2
  useEffect(() => {
    if (step === 2 && isOpen) {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [step, isOpen]);

  const handleReset = () => {
    setStep(1);
    setIdentifier('');
    setResetIdentifier('');
    setMaskedEmail('');
    setResetToken('');
    setMethod('email');
    setOtp('');
    setShowWrongOtpModal(false);
    setWrongOtpMessage('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setSuccessMsg('');
    setLoading(false);
    setCooldown(0);
  };

  // STEP 1: Choose a recovery method
  const handleContinue = async (e) => {
    e.preventDefault();
    setError('');

    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Silakan masukkan NIP atau Email Anda.');
      return;
    }

    setLoading(true);
    try {
      setResetIdentifier(cleanId);
      if (method === 'email') {
        const res = await api.requestResetOtp(cleanId);
        if (!res.success) {
          setError(res.message || 'Gagal mengirim kode pemulihan.');
          return;
        }
        setMaskedEmail(res.maskedEmail || '');
        setCooldown(60);
      } else {
        setMaskedEmail('');
        setCooldown(0);
      }
      setStep(2);
      setOtp('');
    } catch (err) {
      setError(err.data?.message || err.message || 'Terjadi kesalahan saat meminta kode OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP in Step 2
  const handleResendOtp = async () => {
    if (method !== 'email' || cooldown > 0 || resending) return;
    setError('');
    setSuccessMsg('');
    setResending(true);

    try {
      const res = await api.requestResetOtp(resetIdentifier || identifier);
      if (res.success) {
        setSuccessMsg('Permintaan kode diproses. Jika akun terdaftar, periksa inbox atau spam email Anda.');
        setCooldown(60);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.message || 'Gagal mengirim ulang kode OTP.');
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Gagal mengirim ulang kode OTP.');
    } finally {
      setResending(false);
    }
  };

  // STEP 2: Verify OTP Only
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Kode OTP harus terdiri dari 6 digit angka.');
      return;
    }

    setLoading(true);
    try {
      const res = method === '2fa'
        ? await api.verifyReset2FA(resetIdentifier, cleanOtp)
        : await api.validateResetOtp(resetIdentifier, cleanOtp);
      if (res.success) {
        setResetToken(res.resetToken || '');
        if (res.maskedEmail) setMaskedEmail(res.maskedEmail);
        setError('');
        // Alur berhasil: arahkan ke halaman ganti kata sandi baru!
        setStep(3);
      } else {
        // Jika OTP salah, buka modal peringatan khusus
        setWrongOtpMessage(res.message || 'Kode OTP yang kamu masukkan salah. Silakan coba lagi!');
        setShowWrongOtpModal(true);
      }
    } catch (err) {
      if (method === 'email' && err.status === 404) {
        setResetToken('');
        setSuccessMsg('Verifikasi akan dilakukan bersama saat kata sandi baru disimpan.');
        setStep(3);
        return;
      }
      if (err.status === 404) {
        setError('Layanan verifikasi 2FA belum tersedia. Muat ulang aplikasi atau hubungi administrator.');
        return;
      }
      const errMsg = err.data?.message || err.message || 'Kode OTP yang kamu masukkan salah. Silakan coba lagi!';
      setWrongOtpMessage(errMsg);
      setShowWrongOtpModal(true);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Change Password Only
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordStrong) {
      setError('Kata sandi belum memenuhi standar. Lengkapi semua kriteria hingga level Kuat.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: resetIdentifier,
        otp: otp.trim(),
        resetToken: resetToken || undefined,
        newPassword,
        confirmPassword
      };

      const res = await api.verifyResetOtp(payload);
      if (res.success) {
        setStep(4);
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || 'Gagal memperbarui kata sandi.');
      }
    } catch (err) {
      setError(err.status === 404
        ? 'Layanan reset kata sandi belum tersedia di server. Restart atau perbarui backend, lalu coba lagi.'
        : err.data?.message || err.message || 'Gagal memperbarui kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* MAIN FORGOT PASSWORD MODAL */}
      <div
        className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 font-sans"
      // onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
      >
        <div
          className="relative bg-white max-w-md sm:max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xl space-y-5 text-left animate-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer disabled:opacity-50 z-10"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-2 pb-1 pr-10">
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-blue-600' : 'w-3 bg-blue-200'}`} />
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-blue-600' : 'w-3 bg-slate-200'}`} />
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 3 ? 'w-8 bg-blue-600' : 'w-3 bg-slate-200'}`} />
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 4 ? 'w-8 bg-emerald-600' : 'w-3 bg-slate-200'}`} />
            <span className="text-xs font-bold text-slate-400 ml-auto whitespace-nowrap">
              {step <= 3 ? `Langkah ${step} dari 3` : 'Selesai'}
            </span>
          </div>

          {/* ============================================================ */}
          {/* LANGKAH 1: INPUT EMAIL / NIP                                */}
          {/* ============================================================ */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center border border-sky-100/60 mb-1">
                  <KeyRound className="w-6 h-6 text-sky-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  Lupa Kata Sandi?
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Masukkan <strong className="text-slate-800">Email</strong> atau <strong className="text-slate-800">NIP</strong>, lalu pilih cara verifikasi untuk memulihkan akun.
                </p>
              </div>

              <form onSubmit={handleContinue} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label htmlFor="reset-identifier" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    NIP / Alamat Email Terdaftar
                  </label>
                  <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/20 transition-all">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="reset-identifier"
                      type="text"
                      required
                      autoFocus
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Contoh: nama@kotabogor.go.id atau NIP"
                      className="block w-full pl-11 pr-4 py-3 bg-transparent text-slate-800 text-base placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <fieldset className="space-y-2">
                  <legend className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Pilih cara verifikasi
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      aria-pressed={method === 'email'}
                      onClick={() => setMethod('email')}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${method === 'email'
                        ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-500/10'
                        : 'border-slate-200 bg-white hover:border-sky-300'
                        }`}
                    >
                      <Mail className={`mt-0.5 h-5 w-5 shrink-0 ${method === 'email' ? 'text-sky-600' : 'text-slate-400'}`} />
                      <span>
                        <span className="block text-sm font-bold text-slate-800">Kirim kode ke email</span>
                        <span className="mt-0.5 block text-xs text-slate-500">Kode OTP dikirim ke email akun</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={method === '2fa'}
                      onClick={() => setMethod('2fa')}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${method === '2fa'
                        ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-500/10'
                        : 'border-slate-200 bg-white hover:border-sky-300'
                        }`}
                    >
                      <ShieldCheck className={`mt-0.5 h-5 w-5 shrink-0 ${method === '2fa' ? 'text-sky-600' : 'text-slate-400'}`} />
                      <span>
                        <span className="block text-sm font-bold text-slate-800">Kode authenticator 2FA</span>
                        <span className="mt-0.5 block text-xs text-slate-500">Gunakan kode 6 digit dari aplikasi 2FA</span>
                      </span>
                    </button>
                  </div>
                </fieldset>

                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 animate-in fade-in duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 py-3 px-5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm sm:text-base font-bold text-slate-700 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !identifier.trim()}
                    className="flex-1 py-3 px-5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white rounded-xl text-sm sm:text-base font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{method === 'email' ? 'Mengirim...' : 'Melanjutkan...'}</span>
                      </>
                    ) : (
                      <span>{method === 'email' ? 'Kirim Kode OTP' : 'Lanjut Verifikasi 2FA'} &rarr;</span>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ============================================================ */}
          {/* LANGKAH 2: VERIFIKASI KODE OTP SAJA (TERPISAH)                */}
          {/* ============================================================ */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center border border-sky-100/60 mb-1">
                  <ShieldCheck className="w-6 h-6 text-sky-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {method === '2fa' ? 'Verifikasi Authenticator 2FA' : 'Verifikasi Kode OTP'}
                </h3>
                {method === '2fa' ? (
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Masukkan kode 6 digit terbaru dari aplikasi authenticator yang sudah ditautkan ke akun Anda.
                  </p>
                ) : (
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Jika akun terdaftar dan memiliki email, kode verifikasi akan dikirim ke{' '}
                    {maskedEmail ? (
                      <span className="inline-block px-2 py-0.5 bg-sky-50 text-sky-700 font-bold rounded-md border border-sky-200/60">
                        {maskedEmail}
                      </span>
                    ) : 'alamat email akun'}. Masukkan kode tersebut untuk melanjutkan.
                  </p>
                )}
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="otp-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {method === '2fa' ? 'Kode Authenticator 6-Digit' : 'Kode OTP 6-Digit'}
                    </label>
                    {method === 'email' && (
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Berlaku 10 menit
                      </span>
                    )}
                  </div>
                  <input
                    ref={otpInputRef}
                    id="otp-input"
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setOtp(val);
                      if (error) setError('');
                    }}
                    placeholder="000000"
                    className="w-full px-4 py-3.5 border-2 border-sky-200 focus:border-sky-500 rounded-2xl text-3xl font-black tracking-[0.5em] text-center font-mono focus:outline-none focus:ring-4 focus:ring-sky-500/15 bg-slate-50/70 transition-all"
                  />
                  <p className="text-xs text-slate-500 text-center">
                    {method === '2fa'
                      ? 'Kode authenticator berubah secara berkala. Gunakan kode yang sedang aktif.'
                      : <>Periksa folder <strong>Kotak Masuk (Inbox)</strong> atau <strong>Spam</strong> email Anda.</>}
                  </p>
                </div>

                {/* Resend OTP Link */}
                {method === 'email' && (
                  <div className="flex items-center justify-between pt-1 pb-1">
                    <span className="text-xs text-slate-500">Tidak menerima kode?</span>
                    {cooldown > 0 ? (
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Kirim ulang dalam {cooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resending}
                        className="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                        Kirim Ulang Kode OTP
                      </button>
                    )}
                  </div>
                )}

                {/* Alerts */}
                {successMsg && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs sm:text-sm font-semibold text-emerald-700 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 animate-in fade-in duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setStep(1);
                    }}
                    disabled={loading}
                    className="flex-1 py-3 px-5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm sm:text-base font-bold text-slate-700 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="flex-1 py-3 px-5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white rounded-xl text-sm sm:text-base font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memeriksa kode...</span>
                      </>
                    ) : (
                      <span>Verifikasi Kode &rarr;</span>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ============================================================ */}
          {/* LANGKAH 3: GANTI KATA SANDI BARU (TERPISAH)                   */}
          {/* ============================================================ */}
          {step === 3 && (
            <>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100/60 mb-1">
                  <Lock className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  Buat Kata Sandi Baru
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  {successMsg
                    ? <>Masukkan kata sandi baru untuk akun <strong className="text-slate-800">{maskedEmail || resetIdentifier}</strong>. Kode email akan diverifikasi saat kata sandi disimpan.</>
                    : <>Verifikasi berhasil. Silakan tentukan kata sandi baru untuk akun <strong className="text-slate-800">{maskedEmail || resetIdentifier}</strong>.</>}
                </p>
                {successMsg && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 pt-1">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label htmlFor="new-password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Kata Sandi Baru
                  </label>
                  <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/20 transition-all">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Minimal 8 karakter"
                      className="password-visibility-input block w-full pl-11 pr-12 py-3 bg-transparent text-slate-800 text-base placeholder-slate-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-sky-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label htmlFor="confirm-password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/20 transition-all">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Ulangi kata sandi baru"
                      className="password-visibility-input block w-full pl-11 pr-12 py-3 bg-transparent text-slate-800 text-base placeholder-slate-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-sky-600 focus:outline-none cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Validation hint & Strength Checklist */}
                {newPassword && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">Kekuatan kata sandi</span>
                      <span className={`text-[11px] font-bold ${passwordStrengthObj.text}`}>
                        {passwordStrengthObj.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1" aria-hidden="true">
                      {passwordRequirements.map((req, index) => (
                        <span
                          key={index}
                          className={`h-1.5 rounded-full ${req.met ? passwordStrengthObj.color : 'bg-slate-200'
                            }`}
                        />
                      ))}
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
                    {confirmPassword && (
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black ${newPassword === confirmPassword
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-rose-100 text-rose-600'
                          }`}>
                          {newPassword === confirmPassword ? '\u2713' : '\u2717'}
                        </span>
                        <span className={`text-[11px] font-semibold ${newPassword === confirmPassword ? 'text-emerald-700' : 'text-rose-600'
                          }`}>
                          {newPassword === confirmPassword ? 'Kata sandi cocok' : 'Konfirmasi kata sandi belum sama'}
                        </span>
                      </div>
                    )}
                    {!isPasswordStrong && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">
                        Kata sandi harus <span className="font-black">Kuat</span> untuk dapat disimpan.
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 animate-in fade-in duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setStep(2);
                    }}
                    disabled={loading}
                    className="flex-1 py-3 px-5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm sm:text-base font-bold text-slate-700 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || !isPasswordStrong}
                    className={`flex-1 py-3 px-5 text-white rounded-xl text-sm sm:text-base font-bold transition-all shadow-md flex items-center justify-center gap-2 ${!isPasswordStrong
                      ? 'bg-slate-300 cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 shadow-blue-500/20 cursor-pointer disabled:opacity-50'
                      }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan Sandi Baru</span>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ============================================================ */}
          {/* LANGKAH 4: KONFIRMASI SUKSES                                 */}
          {/* ============================================================ */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center border border-emerald-100 text-emerald-600 mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Kata Sandi Berhasil Diubah!
                </h3>
                <p className="text-slate-600 text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
                  Kata sandi baru akun Anda telah aktif. Silakan masuk menggunakan kata sandi yang baru dibuat.
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white rounded-xl text-base font-bold transition-all shadow-lg shadow-blue-500/30 cursor-pointer"
                >
                  Masuk ke Akun Sekarang
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* POPUP MODAL KHUSUS: KODE OTP SALAH, COBA LAGI               */}
      {/* ============================================================ */}
      {showWrongOtpModal && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-70 flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
          <div className="relative bg-white max-w-sm sm:max-w-md w-full rounded-3xl p-6 sm:p-7 border border-rose-100 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100 text-rose-600 mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="text-xl font-black text-slate-900 tracking-tight">
                Kode OTP Salah!
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {wrongOtpMessage || 'Kode OTP yang kamu masukkan salah. Silakan periksa kembali email Anda dan coba lagi!'}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                autoFocus
                onClick={() => {
                  setShowWrongOtpModal(false);
                  setOtp('');
                  setTimeout(() => otpInputRef.current?.focus(), 100);
                }}
                className="w-full py-3.5 px-5 bg-rose-600 hover:bg-rose-700 text-white text-base font-bold rounded-xl shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
