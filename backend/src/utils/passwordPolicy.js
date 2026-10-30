const passwordRules = [
  { message: 'harus diawali huruf kapital', test: password => /^[A-Z]/.test(password) },
  { message: 'minimal 8 karakter', test: password => password.length >= 8 },
  { message: 'harus mengandung angka', test: password => /\d/.test(password) },
  { message: 'harus mengandung simbol', test: password => /[^A-Za-z0-9]/.test(password) }
];

function getPasswordPolicyFailures(password) {
  if (typeof password !== 'string') {
    return ['kata sandi wajib diisi'];
  }
  return passwordRules
    .filter(rule => !rule.test(password))
    .map(rule => rule.message);
}

module.exports = { getPasswordPolicyFailures };
