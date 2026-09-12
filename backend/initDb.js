const db = require('./db');

const initDatabase = async () => {
  const dropTablesQuery = `
    DROP TABLE IF EXISTS skm_surveys CASCADE;
    DROP TABLE IF EXISTS ratings CASCADE;
    DROP TABLE IF EXISTS ticket_histories CASCADE;
    DROP TABLE IF EXISTS tickets CASCADE;
    DROP TABLE IF EXISTS service_requirements CASCADE;
    DROP TABLE IF EXISTS services CASCADE;
    DROP TABLE IF EXISTS service_categories CASCADE;
    DROP TABLE IF EXISTS notifications CASCADE;
    DROP TABLE IF EXISTS device_tokens CASCADE;
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
      role_id INT REFERENCES roles(id),
      team_id INT REFERENCES teams(id) NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS device_tokens (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      fcm_token VARCHAR(255) UNIQUE NOT NULL,
      device_type VARCHAR(50),
      last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      status VARCHAR(50) DEFAULT 'Aktif'
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
      status VARCHAR(50) DEFAULT 'PENDING',
      priority VARCHAR(50) DEFAULT 'MEDIUM',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ticket_histories (
      id SERIAL PRIMARY KEY,
      ticket_id UUID REFERENCES tickets(id),
      changed_by UUID REFERENCES users(id),
      previous_status VARCHAR(50),
      new_status VARCHAR(50) NOT NULL,
      remarks TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id SERIAL PRIMARY KEY,
      ticket_id UUID REFERENCES tickets(id),
      speed_score INT CHECK (speed_score BETWEEN 1 AND 5),
      result_score INT CHECK (result_score BETWEEN 1 AND 5),
      communication_score INT CHECK (communication_score BETWEEN 1 AND 5),
      quality_score INT CHECK (quality_score BETWEEN 1 AND 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skm_surveys (
      id SERIAL PRIMARY KEY,
      ticket_id UUID REFERENCES tickets(id),
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
    
    // Insert Default Roles and Categories
    await db.query(`INSERT INTO roles (name) VALUES ('Masyarakat'), ('Admin'), ('Helpdesk'), ('Pegawai'), ('OPD') ON CONFLICT (name) DO NOTHING;`);
    await db.query(`INSERT INTO service_categories (category_name) VALUES 
      ('Pengelolaan Aplikasi Informatika'),
      ('Pengelolaan Sumber Daya & Perangkat Keras'),
      ('Penerapan Persandian & Keamanan Informasi')
      ON CONFLICT (category_name) DO NOTHING;`);
    
    console.log('Tables created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error creating tables:', err);
    process.exit(1);
  }
};

initDatabase();
