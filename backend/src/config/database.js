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

// Create ticket_attachments if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS ticket_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    file_name VARCHAR(255),
    file_url TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).catch(err => console.log('Migration error ticket_attachments', err.message));
