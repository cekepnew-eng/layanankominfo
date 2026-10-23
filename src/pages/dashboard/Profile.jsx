import React, { useState, useEffect } from 'react';
import { User, Mail, ShieldCheck, Building, Tag, Info, Activity, Lock, Eye, EyeOff, Check, Briefcase, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ActionModal } from '../../components/ActionModal';

export const Profile = () => {
  const { user, setUser, users, setUsers, teams } = useAuth();

  const isMasyarakat = user?.role?.toLowerCase() === 'masyarakat' || user?.roles?.some(r => r.toLowerCase() === 'masyarakat');
  const isPegawai = user?.role?.toLowerCase() === 'pegawai' || user?.roles?.some(r => r.toLowerCase() === 'pegawai');
  const myTeams = (teams || []).filter(t => (t.members && t.members.includes(user?.name)) || t.leader === user?.name);

  const [nameVal, setNameVal] = useState(user?.name || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    cancelText: 'Batal',
    onConfirm: null
  });

  useEffect(() => {
    if (user?.name) {
      setNameVal(user.name);
    }
  }, [user?.name]);

  const userRoles = (user?.roles && user.roles.length > 0)
    ? user.roles
    : (user?.role ? [user.role] : ['user']);
  const passwordStrengthChecks = [
    newPassword.length >= (isMasyarakat ? 8 : 6),
    newPassword.length >= 8,
    /[a-z]/.test(newPassword),
    /[A-Z]/.test(newPassword),
    /\d/.test(newPassword),
    /[^A-Za-z0-9]/.test(newPassword)
  ];
  const passwordStrengthScore = passwordStrengthChecks.filter(Boolean).length;
  const passwordStrength = passwordStrengthScore >= 5
    ? { label: 'Kuat', color: 'bg-emerald-500', text: 'text-emerald-700' }
    : passwordStrengthScore >= 3
      ? { label: 'Sedang', color: 'bg-amber-400', text: 'text-amber-700' }
      : { label: 'Lemah', color: 'bg-rose-500', text: 'text-rose-700' };
  const profileImage = user?.profileImage || user?.profile_image;
  const isTndProfileImage = String(user?.profileImageSource || user?.profile_image_source || '').toUpperCase() === 'TND';
  const canUploadProfileImage = isMasyarakat || userRoles.some(role => String(role).toUpperCase() === 'USER');
  const passwordMinLength = isMasyarakat ? 8 : 6;

  useEffect(() => {
    setImageLoadError(false);
  }, [profileImage]);

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setModalConfig({
        isOpen: true,
        type: 'warning',
        title: 'Format Foto Tidak Didukung',
        message: 'Gunakan foto berformat JPG, PNG, atau WEBP.',
        confirmText: 'Mengerti',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setModalConfig({
        isOpen: true,
        type: 'warning',
        title: 'Ukuran Foto Terlalu Besar',
        message: 'Ukuran foto maksimal 2 MB.',
        confirmText: 'Mengerti',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setIsUploadingProfileImage(true);
    try {
      const imageData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string'
          ? resolve(reader.result)
          : reject(new Error('Foto tidak dapat dibaca.'));
        reader.onerror = () => reject(new Error('Foto tidak dapat dibaca.'));
        reader.readAsDataURL(file);
      });
      const response = await api.updateProfile({ profileImage: imageData });
      const updatedUser = {
        ...user,
        profileImage: response.user?.profileImage || imageData,
        profileImageSource: response.user?.profileImageSource || 'MANUAL'
      };
      setUser(updatedUser);
      sessionStorage.setItem('spbe_user', JSON.stringify(updatedUser));
      setSuccessMessage('Foto profil berhasil diperbarui.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      setModalConfig({
        isOpen: true,
        type: 'danger',
        title: 'Gagal Memperbarui Foto',
        message: error.message || 'Terjadi kesalahan saat menyimpan foto profil.',
        confirmText: 'Tutup',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setIsUploadingProfileImage(false);
    }
  };

  const getBadgeClass = (r) => {
    switch (r) {
      case 'admin':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'helpdesk':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'pegawai':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'masyarakat':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'user':
      default:
        return 'bg-sky-50 text-sky-700 border-sky-100';
    }
  };

  const getBadgeLabel = (r) => {
    if (r === 'user') return 'OPD';
    if (r === 'pegawai') return 'Pegawai';
    return r.toUpperCase();
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!nameVal.trim()) {
      setModalConfig({
        isOpen: true,
        type: 'warning',
        title: 'Nama Pengguna Kosong',
        message: 'Nama lengkap pengguna wajib diisi dan tidak boleh kosong.',
        confirmText: 'Lengkapi Nama',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    if (isMasyarakat && user?.passwordChangeRequired && !newPassword) {
      setModalConfig({
        isOpen: true,
        type: 'warning',
        title: 'Kata Sandi Wajib Diperbarui',
        message: 'Demi keamanan, akun masyarakat wajib mengganti kata sandi setidaknya satu tahun sekali.',
        confirmText: 'Ganti Kata Sandi',
        cancelText: 'Tutup',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    if (oldPassword || newPassword || confirmPassword) {
      if (!oldPassword) {
        setModalConfig({
          isOpen: true,
          type: 'warning',
          title: 'Kata Sandi Lama Wajib Diisi',
          message: 'Silakan masukkan kata sandi lama Anda terlebih dahulu untuk mengubah kata sandi.',
          confirmText: 'Lengkapi Sandi Lama',
          cancelText: '',
          onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
        return;
      }
      if (!newPassword) {
        setModalConfig({
          isOpen: true,
          type: 'warning',
          title: 'Kata Sandi Baru Wajib Diisi',
          message: 'Silakan masukkan kata sandi baru Anda.',
          confirmText: 'Lengkapi Sandi Baru',
          cancelText: '',
          onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
        return;
      }
      if (newPassword.length < passwordMinLength) {
        setModalConfig({
          isOpen: true,
          type: 'warning',
          title: 'Kata Sandi Terlalu Pendek',
          message: `Kata sandi baru minimal harus terdiri dari ${passwordMinLength} karakter.`,
          confirmText: 'Perbaiki Kata Sandi',
          cancelText: '',
          onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        setModalConfig({
          isOpen: true,
          type: 'warning',
          title: 'Konfirmasi Sandi Tidak Cocok',
          message: 'Konfirmasi kata sandi baru tidak sesuai dengan kata sandi yang dimasukkan.',
          confirmText: 'Periksa Kembali',
          cancelText: '',
          onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const payload = {
        fullName: nameVal.trim(),
        ...(newPassword ? { oldPassword, newPassword } : {})
      };

      const res = await api.updateProfile(payload);

      if (res.token) {
        sessionStorage.setItem('spbe_token', res.token);
      }
      const updatedUser = {
        ...user,
        name: res.user?.name || res.user?.full_name || nameVal.trim(),
        passwordChangeRequired: res.user?.passwordChangeRequired ?? (newPassword ? false : user?.passwordChangeRequired)
      };

      setUser(updatedUser);
      sessionStorage.setItem('spbe_user', JSON.stringify(updatedUser));

      if (users && setUsers) {
        setUsers(prev => prev.map(u => 
          u.email.toLowerCase() === user.email.toLowerCase()
            ? { ...u, name: nameVal.trim() }
            : u
        ));
      }

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Data profil dan kata sandi berhasil diperbarui!');
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Profil Berhasil Diperbarui',
        message: 'Perubahan data profil dan kata sandi akun Anda telah berhasil disimpan.',
        confirmText: 'Selesai',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setModalConfig({
        isOpen: true,
        type: 'danger',
        title: 'Gagal Memperbarui Profil',
        message: err.message || 'Terjadi kesalahan saat menyimpan perubahan profil.',
        confirmText: 'Tutup',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto font-sans space-y-6 text-left animate-in fade-in duration-200">
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Profil Pengguna</h2>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
          Informasi identitas akun dan hak akses yang terdaftar pada sistem SPBE Kota Bogor.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs pt-10 pb-8 px-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-2xl bg-sky-50 border-2 border-sky-200/80 text-sky-600 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
            {profileImage && !imageLoadError
              ? (
                <img 
                  src={profileImage} 
                  alt="Foto profil" 
                  onError={() => setImageLoadError(true)}
                  className="h-full w-full object-cover" 
                />
              )
              : <User className="w-12 h-12 stroke-[1.75]" />}
          </div>
          {canUploadProfileImage && !isTndProfileImage && (
            <label className={`mt-3 inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 transition-colors ${isUploadingProfileImage ? 'cursor-wait opacity-60' : 'cursor-pointer hover:bg-sky-100'}`}>
              <Camera className="h-4 w-4" />
              {isUploadingProfileImage ? 'Mengunggah foto...' : profileImage ? 'Ganti Foto Profil' : 'Tambah Foto Profil'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={isUploadingProfileImage}
                onChange={handleProfileImageChange}
              />
            </label>
          )}
          {isTndProfileImage && (
            <p className="mt-2 text-[11px] font-semibold text-slate-400">Foto profil tersinkronisasi dari TND</p>
          )}

          <h3 className="text-xl font-black text-slate-900 mt-4 tracking-tight">
            {user?.name || 'Pengguna SPBE'}
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center justify-center gap-1.5 break-all">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{user?.email || '-'}</span>
          </p>
          {user?.nip && (
            <p className="text-[11px] font-bold text-slate-600 mt-1 flex items-center justify-center gap-1.5">
              <span className="text-slate-400">NIP:</span>
              <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{user.nip}</span>
            </p>
          )}

          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5">
            {userRoles.map((r) => (
              <span 
                key={r} 
                className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${getBadgeClass(r)}`}
              >
                {getBadgeLabel(r)}
              </span>
            ))}
          </div>

          <div className="w-full h-px bg-slate-100 my-6" />

          <div className="w-full space-y-3.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                Status Akun
              </span>
              <span className="font-extrabold text-emerald-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Aktif
              </span>
            </div>

            <div className="flex items-start justify-between py-1.5 gap-2">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5 shrink-0 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                Hak Akses / Role
              </span>
              <div className="flex flex-wrap justify-end gap-1.5">
                {userRoles.map((r) => (
                  <span 
                    key={r} 
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider border ${getBadgeClass(r)}`}
                  >
                    {getBadgeLabel(r)}
                  </span>
                ))}
              </div>
            </div>

            {isPegawai && (
              <div className="flex items-start justify-between py-1.5 gap-2 border-t border-slate-100">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5 shrink-0 pt-0.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  Tim Kerja
                </span>
                <div className="flex flex-col items-end gap-1 text-right">
                  {myTeams.length > 0 ? (
                    myTeams.map((t) => (
                      <span 
                        key={t.id || t.name} 
                        className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
                      >
                        {t.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">Belum ditugaskan</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Rincian Identitas Pengguna
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {isMasyarakat 
                  ? 'Kelola data identitas profil dan kata sandi akun masyarakat umum.'
                  : 'Data resmi yang tersinkronisasi dalam basis data layanan SPBE Diskominfo Kota Bogor.'}
              </p>
            </div>

            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {isMasyarakat && user?.passwordChangeRequired && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm font-semibold text-amber-900">
                Demi keamanan, akun masyarakat wajib mengganti kata sandi setidaknya satu tahun sekali. Ganti kata sandi sekarang untuk melanjutkan menggunakan layanan.
              </div>
            )}

            {isMasyarakat ? (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-start gap-3.5 focus-within:border-sky-300 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        required
                        value={nameVal}
                        onChange={(e) => setNameVal(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-extrabold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        placeholder="Nama lengkap pemohon"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Alamat E-mail Resmi
                      </span>
                      <p className="text-sm font-extrabold text-slate-800 mt-0.5 truncate">
                        {user?.email || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Hak Akses / Peran
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {userRoles.map((r) => (
                          <span 
                            key={r} 
                            className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${getBadgeClass(r)}`}
                          >
                            {getBadgeLabel(r)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <Tag className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Kategori Pemohon
                      </span>
                      <p className="text-sm font-extrabold text-slate-800 mt-0.5 truncate">
                        Masyarakat Umum
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-sky-600" />
                      <h4 className="text-sm font-black text-slate-900 tracking-tight">Ubah Kata Sandi</h4>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Kosongkan jika tidak ingin mengubah kata sandi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">
                        Kata Sandi Lama
                      </label>
                      <div className="relative">
                        <input
                          type={showOldPassword ? 'text' : 'password'}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Masukkan sandi lama"
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">
                        Kata Sandi Baru
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={`Minimal ${passwordMinLength} karakter`}
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {newPassword && (
                        <div className="mt-2 space-y-1.5" aria-live="polite">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-500">Kekuatan password</span>
                            <span className={`text-[11px] font-bold ${passwordStrength.text}`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-6 gap-1" aria-hidden="true">
                            {passwordStrengthChecks.map((meetsRequirement, index) => (
                              <span
                                key={index}
                                className={`h-1.5 rounded-full ${
                                  meetsRequirement ? passwordStrength.color : 'bg-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <p className={`text-[11px] ${newPassword.length >= passwordMinLength ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {newPassword.length >= passwordMinLength
                              ? `Minimal ${passwordMinLength} karakter terpenuhi.`
                              : `Masih kurang ${passwordMinLength - newPassword.length} karakter dari minimal ${passwordMinLength}.`}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">
                        Konfirmasi Kata Sandi Baru
                      </label>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi baru"
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-xl text-sm font-extrabold shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Nama Lengkap
                      </span>
                      <p className="text-sm font-extrabold text-slate-800 mt-0.5 truncate">
                        {user?.name || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Alamat E-mail Resmi
                      </span>
                      <p className="text-sm font-extrabold text-slate-800 mt-0.5 truncate">
                        {user?.email || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Hak Akses / Peran
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {userRoles.map((r) => (
                          <span 
                            key={r} 
                            className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${getBadgeClass(r)}`}
                          >
                            {getBadgeLabel(r)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <Building className="w-5 h-5 text-sky-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Perangkat Daerah / Instansi
                      </span>
                      <p className="text-sm font-extrabold text-slate-800 mt-0.5 truncate">
                        {user?.department || 'Dinas Komunikasi dan Informatika Kota Bogor'}
                      </p>
                    </div>
                  </div>

                  {user?.nip && (
                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-start gap-3.5 sm:col-span-2">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs">
                        <Tag className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Nomor Induk Pegawai (NIP)
                        </span>
                        <p className="text-sm font-extrabold text-slate-800 mt-0.5 font-mono truncate">
                          {user.nip}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {isPegawai && (
                  <div className="p-6 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3 border-b border-indigo-100 pb-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Penugasan Tim Kerja Teknis</h4>
                          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                            Daftar tim kerja pelaksana penanganan tiket layanan yang ditugaskan kepada Anda.
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider bg-indigo-100 text-indigo-800">
                        {myTeams.length} Tim Kerja
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {myTeams.length > 0 ? (
                        myTeams.map((t) => {
                          return (
                            <div key={t.id || t.name} className="p-4 bg-white rounded-xl border border-indigo-100 shadow-2xs space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                                  {t.name}
                                </h5>
                              </div>
                              {t.services && t.services.length > 0 && (
                                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                                  <span className="font-bold text-slate-700">Lingkup Layanan:</span> {t.services.join(', ')}
                                </p>
                              )}
                              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 font-semibold flex items-center justify-between">
                                <span>{t.members ? t.members.length : 1} Personel Terdaftar</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-2 p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400 font-semibold">
                          Belum terdaftar pada tim kerja pelaksana mana pun.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-sky-50/70 border border-sky-200/90 rounded-xl flex items-start gap-3 text-xs text-sky-900 leading-relaxed">
                  <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-sky-950 block mb-0.5">Sinkronisasi Identitas SPBE</span>
                    Data identitas akun ini disinkronkan secara resmi dengan Single Sign-On (SSO) Pemerintah Kota Bogor. Apabila ada perubahan unit kerja kedinasan atau mutasi hak akses peran, silakan hubungi Administrator SPBE Diskominfo Kota Bogor.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ActionModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
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
