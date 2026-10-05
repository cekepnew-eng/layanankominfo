const db = require('./db');

const resetAll2FA = async () => {
  const query = `
    UPDATE users 
    SET is_two_factor_enabled = false, 
        two_factor_secret = NULL, 
        backup_codes = '[]'::jsonb;
  `;

  try {
    console.log('Mereset sistem 2FA untuk SEMUA user (Admin, Pegawai, Helpdesk, Masyarakat)...');
    await db.query(query);
    console.log('Berhasil! Semua user sekarang akan diminta Scan QR ulang saat login.');
    process.exit(0);
  } catch (err) {
    console.error('Error saat mereset 2FA:', err);
    process.exit(1);
  }
};

resetAll2FA();
