const { Pool } = require('pg');
const path = require('path');

// Load environment variables from backend/.env explicitly
const envPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: envPath });

// Fallback to project root .env if not found
if (!process.env.DATABASE_URL && !process.env.DB_PASSWORD) {
  require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
}

// Build pool configuration ensuring password is a valid string
const getPoolConfig = () => {
  const dbUrl = process.env.DATABASE_URL;
  const dbPassword = process.env.DB_PASSWORD;

  if (dbUrl) {
    return {
      connectionString: dbUrl,
      ...(dbPassword !== undefined && dbPassword !== null ? { password: String(dbPassword) } : {})
    };
  }

  return {
    user: process.env.DB_USER || 'postgres',
    password: String(dbPassword || ''),
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'helpdesk-kominfo'
  };
};

const pool = new Pool(getPoolConfig());

pool.on('error', (err) => {
  console.error('[pg.Pool] Unexpected error on idle client:', err.message);
});

// Accurate error classifier for migrations
const handleMigrationError = (target, err) => {
  const isAuthOrConnError =
    err.code === '28P01' || // invalid_password
    err.code === '28000' || // invalid_authorization_specification
    err.code === 'ECONNREFUSED' ||
    (err.message && (
      err.message.includes('SASL') ||
      err.message.includes('password') ||
      err.message.includes('authentication')
    ));

  if (isAuthOrConnError) {
    console.error(`[DB Migration Error - Autentikasi/Koneksi Gagal pada ${target}]:`, err.message);
  } else if (err.code === '42701' || (err.message && err.message.toLowerCase().includes('column') && err.message.toLowerCase().includes('already exists'))) {
    console.log(`[DB Migration] Kolom sudah ada pada ${target}.`);
  } else if (err.code === '42P07' || (err.message && err.message.toLowerCase().includes('relation') && err.message.toLowerCase().includes('already exists'))) {
    console.log(`[DB Migration] Tabel sudah ada pada ${target}.`);
  } else {
    console.error(`[DB Migration Error pada ${target}]:`, err.message);
  }
};

// Safe auto-migrations preserving existing data and tables
const runAutoMigrations = async () => {
  try {
    // 1. ALTER TABLE services for default_team_id
    try {
      await pool.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS default_team_id INTEGER;');
    } catch (err) {
      handleMigrationError('services.default_team_id', err);
    }

    // 2. ALTER TABLE teams for leader_id
    try {
      await pool.query('ALTER TABLE teams ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES users(id) ON DELETE SET NULL;');
    } catch (err) {
      handleMigrationError('teams.leader_id', err);
    }

    // 3. CREATE TABLE ticket_attachments IF NOT EXISTS
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ticket_attachments (
          id SERIAL PRIMARY KEY,
          ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
          file_name VARCHAR(255),
          file_url TEXT,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (err) {
      handleMigrationError('ticket_attachments', err);
    }

    // 4. CREATE TABLE subtasks IF NOT EXISTS (without DROP TABLE to preserve data!)
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS subtasks (
          id SERIAL PRIMARY KEY,
          ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
          assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
          task_name VARCHAR(255),
          status VARCHAR(50) DEFAULT 'PENDING',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (err) {
      handleMigrationError('subtasks', err);
    }

    // 5. ALTER TABLE users for previous_password_hash, password_changed_at, and nip
    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS previous_password_hash VARCHAR(255);');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS nip VARCHAR(50);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_users_nip ON users(nip);');
    } catch (err) {
      handleMigrationError('users.password_tracking', err);
    }

    // 6. CREATE TABLE password_reset_otps for Forgot Password OTP
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS password_reset_otps (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          otp_hash VARCHAR(255) NOT NULL,
          attempts INT DEFAULT 0,
          is_used BOOLEAN DEFAULT false,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_reset_otps_email ON password_reset_otps(email);
      `);
    } catch (err) {
      handleMigrationError('password_reset_otps', err);
    }

    // 7. Auto-seed services from official PDF if table is unpopulated
    try {
      const srvCheck = await pool.query('SELECT count(*) FROM services');
      if (parseInt(srvCheck.rows[0].count, 10) < 5) {
        console.log('[DB Migration] Layanan belum terisi lengkap. Menjalankan auto-seeder layanan...');
        const { seedServices } = require('../../seed_services');
        await seedServices();
      }
    } catch (err) {
      handleMigrationError('auto_seed_services', err);
    }
  } catch (err) {
    console.error('[DB Migration Unexpected Error]:', err.message);
  }
};

runAutoMigrations();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  runAutoMigrations
};
