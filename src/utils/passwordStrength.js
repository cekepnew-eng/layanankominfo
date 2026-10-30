const passwordRules = [
  { label: 'Diawali huruf kapital (A-Z)', test: password => /^[A-Z]/.test(password) },
  { label: 'Minimal 8 karakter', test: password => password.length >= 8 },
  { label: 'Mengandung angka (0-9)', test: password => /\d/.test(password) },
  { label: 'Mengandung simbol (!@#$%^&* dll)', test: password => /[^A-Za-z0-9]/.test(password) }
];

export const getPasswordStrength = (password = '') => {
  const requirements = passwordRules.map(rule => ({
    label: rule.label,
    met: rule.test(password)
  }));
  const score = requirements.filter(requirement => requirement.met).length;
  const level = score === requirements.length ? 'Kuat' : score >= 2 ? 'Sedang' : 'Lemah';

  return {
    requirements,
    score,
    level,
    isStrong: score === requirements.length,
    color: level === 'Kuat' ? 'bg-emerald-500' : level === 'Sedang' ? 'bg-amber-400' : 'bg-rose-500',
    textColor: level === 'Kuat' ? 'text-emerald-700' : level === 'Sedang' ? 'text-amber-700' : 'text-rose-700',
    badgeColor: level === 'Kuat'
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : level === 'Sedang'
        ? 'text-amber-600 bg-amber-50 border-amber-200'
        : 'text-rose-600 bg-rose-50 border-rose-200'
  };
};
