const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};

// Auto DB Migration for default_team_id
pool.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS default_team_id INTEGER;').catch(err => console.log('Migration error or column already exists', err.message));
