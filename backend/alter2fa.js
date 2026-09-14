const db = require('./db');

const alterDatabase = async () => {
  const alterQuery = `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_two_factor_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS backup_codes JSONB DEFAULT '[]'::jsonb;
  `;

  try {
    console.log('Adding 2FA columns to users table...');
    await db.query(alterQuery);
    console.log('Columns added successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error altering table:', err);
    process.exit(1);
  }
};

alterDatabase();
