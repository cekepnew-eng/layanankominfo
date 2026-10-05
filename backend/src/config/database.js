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

// Auto DB Migration for default_team_id & leader_id
pool.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS default_team_id INTEGER;').catch(err => console.log('Migration error or column already exists', err.message));
pool.query('ALTER TABLE teams ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES users(id) ON DELETE SET NULL;').catch(err => console.log('Migration error teams leader_id', err.message));

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

// Create subtasks if it doesn't exist
pool.query(`
  DROP TABLE IF EXISTS subtasks CASCADE;
  CREATE TABLE subtasks (
    id SERIAL PRIMARY KEY,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    task_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).catch(err => console.log('Migration error subtasks', err.message));
