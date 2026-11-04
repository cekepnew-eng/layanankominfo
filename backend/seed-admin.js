const db = require('./src/config/database');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    console.log('Seeding default admin role and account...');

    await client.query(
      `INSERT INTO roles (name) VALUES ('ADMIN') ON CONFLICT (name) DO NOTHING;`
    );

    const roleRes = await client.query(
      `SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1;`
    );

    const adminRoleId = roleRes.rows[0]?.id;
    if (!adminRoleId) {
      throw new Error('Admin role not found after insert.');
    }

    const passwordHash = await bcrypt.hash('admin123', 10);

    const userRes = await client.query(
      `INSERT INTO users (
        email,
        password_hash,
        full_name,
        phone_number,
        department,
        role_id,
        is_active,
        password_auth_source
      ) VALUES ($1, $2, $3, $4, $5, $6, true, 'LOCAL')
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        department = EXCLUDED.department,
        role_id = EXCLUDED.role_id,
        is_active = true,
        password_auth_source = 'LOCAL'
      RETURNING id;`,
      [
        'admin@bogor.go.id',
        passwordHash,
        'Administrator Sistem',
        '081111111111',
        'Dinas Komunikasi dan Informatika',
        adminRoleId
      ]
    );

    const userId = userRes.rows[0]?.id;
    if (!userId) {
      throw new Error('Admin user not created.');
    }

    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING;`,
      [userId, adminRoleId]
    );

    await client.query('COMMIT');
    console.log('Admin seeder berhasil dibuat.');
    console.log('Login: admin@bogor.go.id');
    console.log('Password: admin123');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Admin seeder error:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    process.exit();
  }
};

seedAdmin();
