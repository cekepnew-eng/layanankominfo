require('dotenv').config();
const app = require('./src/app');
const fs = require('fs');
const path = require('path');
const db = require('./src/config/database');

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Final Architecture Server is running on ${HOST}:${PORT}`);

  const resetMarkerPath = path.join(__dirname, '.reset_2fa_done');
  if (!fs.existsSync(resetMarkerPath)) {
    db.query(`UPDATE users SET is_two_factor_enabled = false, two_factor_secret = NULL, backup_codes = '[]'::jsonb`)
      .then(() => {
        console.log('2FA reset successful for all users!');
        fs.writeFileSync(resetMarkerPath, 'done');
      })
      .catch(err => console.error('Error resetting 2FA:', err));
  }
});
