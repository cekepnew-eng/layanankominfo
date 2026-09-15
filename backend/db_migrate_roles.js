const db = require('./src/config/database');

const migrateRoles = async () => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Creating user_roles table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          role_id INT REFERENCES roles(id) ON DELETE CASCADE,
          PRIMARY KEY (user_id, role_id)
      );
    `);
    
    console.log('Migrating existing role_id data to user_roles...');
    // Only migrate if users table still has role_id column
    const checkCol = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='role_id';
    `);
    
    if (checkCol.rows.length > 0) {
      await client.query(`
        INSERT INTO user_roles (user_id, role_id)
        SELECT id, role_id FROM users WHERE role_id IS NOT NULL
        ON CONFLICT (user_id, role_id) DO NOTHING;
      `);
      
      console.log('Dropping role_id from users table...');
      await client.query(`ALTER TABLE users DROP COLUMN role_id;`);
    } else {
      console.log('Migration already applied (role_id not found in users).');
    }
    
    await client.query('COMMIT');
    console.log('Role migration successfully completed!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error migrating roles:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

migrateRoles();
