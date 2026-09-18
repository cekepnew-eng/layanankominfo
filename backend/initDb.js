const db = require('./db');

const initDatabase = async () => {
  const dropTablesQuery = `
    DROP TABLE IF EXISTS skm_surveys CASCADE;
    DROP TABLE IF EXISTS ticket_feedback CASCADE;
    DROP TABLE IF EXISTS ticket_assignments CASCADE;
    DROP TABLE IF EXISTS ticket_details CASCADE;
    DROP TABLE IF EXISTS ticket_histories CASCADE;
    DROP TABLE IF EXISTS tickets CASCADE;
    DROP TABLE IF EXISTS ticket_statuses CASCADE;
    DROP TABLE IF EXISTS service_requirements CASCADE;
    DROP TABLE IF EXISTS services CASCADE;
    DROP TABLE IF EXISTS service_categories CASCADE;
    DROP TABLE IF EXISTS notifications CASCADE;
    DROP TABLE IF EXISTS device_tokens CASCADE;
    DROP TABLE IF EXISTS user_roles CASCADE;
    DROP TABLE IF EXISTS team_members CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS teams CASCADE;
    DROP TABLE IF EXISTS roles CASCADE;
  `;

  const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      team_name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      phone_number VARCHAR(50),
      department VARCHAR(255),
      role_id INT REFERENCES roles(id),
      is_active BOOLEAN DEFAULT true,
      is_two_factor_enabled BOOLEAN DEFAULT false,
      two_factor_secret TEXT,
      backup_codes JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS team_members (
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      team_id INT REFERENCES teams(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, team_id)
    );

    CREATE TABLE IF NOT EXISTS device_tokens (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      fcm_token VARCHAR(255) UNIQUE NOT NULL,
      device_type VARCHAR(50),
      last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      role_id INT REFERENCES roles(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, role_id)
    );

    CREATE TABLE IF NOT EXISTS ticket_statuses (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS service_categories (
      id SERIAL PRIMARY KEY,
      category_name VARCHAR(255) UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      category_id INT REFERENCES service_categories(id),
      service_name VARCHAR(255) NOT NULL,
      target_sla VARCHAR(100) DEFAULT '1-3 Hari',
      verification_type VARCHAR(50) DEFAULT 'Wajib Verifikasi',
      sop_link VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Aktif',
      form_schema JSONB DEFAULT '[]'::jsonb
    );

    CREATE TABLE IF NOT EXISTS service_requirements (
      id SERIAL PRIMARY KEY,
      service_id INT REFERENCES services(id),
      document_name VARCHAR(255) NOT NULL,
      is_mandatory BOOLEAN DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_number VARCHAR(50) UNIQUE NOT NULL,
      user_id UUID REFERENCES users(id),
      service_id INT REFERENCES services(id),
      status_id INT REFERENCES ticket_statuses(id),
      priority VARCHAR(50) DEFAULT 'MEDIUM',
      progress INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ticket_details (
      id SERIAL PRIMARY KEY,
      ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
      title VARCHAR(255),
      description TEXT,
      form_data JSONB DEFAULT '{}'::jsonb
    );

    CREATE TABLE IF NOT EXISTS ticket_assignments (
      id SERIAL PRIMARY KEY,
      ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
      team_id INT REFERENCES teams(id),
      assigned_to_user_id UUID REFERENCES users(id),
      assigned_by_user_id UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ticket_histories (
      id SERIAL PRIMARY KEY,
      ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
      changed_by_user_id UUID REFERENCES users(id),
      old_status_id INT REFERENCES ticket_statuses(id),
      new_status_id INT REFERENCES ticket_statuses(id),
      log_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ticket_feedback (
      id SERIAL PRIMARY KEY,
      ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id),
      rating INT CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
      type VARCHAR(50),
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skm_surveys (
      id SERIAL PRIMARY KEY,
      ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
      q1_answer VARCHAR(50) NOT NULL,
      q2_answer VARCHAR(50) NOT NULL,
      q3_answer VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    console.log('Dropping old tables to recreate clean schema...');
    await db.query(dropTablesQuery);

    console.log('Creating database tables...');
    await db.query(createTablesQuery);
    
    // Insert Default Roles, Categories, and Statuses
    await db.query(`INSERT INTO roles (name) VALUES ('MASYARAKAT'), ('ADMIN'), ('HELPDESK'), ('PEGAWAI'), ('USER') ON CONFLICT (name) DO NOTHING;`);
    await db.query(`INSERT INTO service_categories (category_name) VALUES 
      ('Pengelolaan Aplikasi Informatika'),
      ('Pengelolaan Sumber Daya & Perangkat Keras'),
      ('Penerapan Persandian & Keamanan Informasi')
      ON CONFLICT (category_name) DO NOTHING;`);
    
    await db.query(`INSERT INTO ticket_statuses (id, name) VALUES 
      (1, 'PENDING'),
      (2, 'VERIFIED'),
      (3, 'REJECTED'),
      (4, 'ASSIGNED'),
      (5, 'IN_PROGRESS'),
      (6, 'WAITING_USER_CONFIRMATION'),
      (7, 'COMPLETED')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;`);
    
    console.log('Tables created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error creating tables:', err);
    process.exit(1);
  }
};

initDatabase();
