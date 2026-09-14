const db = require('./src/config/database');

const alterDb = async () => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Altering services table...');
    await client.query(`ALTER TABLE services ADD COLUMN IF NOT EXISTS form_schema JSONB DEFAULT '[]'::jsonb;`);
    
    console.log('Altering ticket_details table...');
    await client.query(`ALTER TABLE ticket_details ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}'::jsonb;`);
    await client.query(`ALTER TABLE ticket_details DROP COLUMN IF EXISTS app_name;`);
    await client.query(`ALTER TABLE ticket_details DROP COLUMN IF EXISTS target_users;`);
    await client.query(`ALTER TABLE ticket_details DROP COLUMN IF EXISTS callback_url;`);
    await client.query(`ALTER TABLE ticket_details DROP COLUMN IF EXISTS target_ip;`);
    
    await client.query('COMMIT');
    console.log('Database successfully altered!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error altering database:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

alterDb();
