const db = require('./database');

const runMigration = async () => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Dropping existing tables to rebuild final schema...');
    await client.query(`
      DROP TABLE IF EXISTS refresh_tokens CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS ticket_feedback CASCADE;
      DROP TABLE IF EXISTS ticket_histories CASCADE;
      DROP TABLE IF EXISTS ticket_assignments CASCADE;
      DROP TABLE IF EXISTS ticket_attachments CASCADE;
      DROP TABLE IF EXISTS ticket_details CASCADE;
      DROP TABLE IF EXISTS tickets CASCADE;
      DROP TABLE IF EXISTS ticket_statuses CASCADE;
      DROP TABLE IF EXISTS service_requirements CASCADE;
      DROP TABLE IF EXISTS services CASCADE;
      DROP TABLE IF EXISTS service_categories CASCADE;
      DROP TABLE IF EXISTS team_members CASCADE;
      DROP TABLE IF EXISTS teams CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS roles CASCADE;
    `);

    console.log('Creating 16 final tables...');
    await client.query(`
      -- 1. roles
      CREATE TABLE roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
      );

      -- 2. teams
      CREATE TABLE teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. users
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(50),
        role_id INT REFERENCES roles(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 4. team_members
      CREATE TABLE team_members (
        id SERIAL PRIMARY KEY,
        team_id INT REFERENCES teams(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, user_id)
      );

      -- 5. service_categories
      CREATE TABLE service_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 6. services
      CREATE TABLE services (
        id SERIAL PRIMARY KEY,
        category_id INT REFERENCES service_categories(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        target_sla VARCHAR(100) DEFAULT '1-3 Hari',
        verification_type VARCHAR(50) DEFAULT 'Wajib Verifikasi',
        sop_link VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 7. service_requirements
      CREATE TABLE service_requirements (
        id SERIAL PRIMARY KEY,
        service_id INT REFERENCES services(id) ON DELETE CASCADE,
        document_name VARCHAR(255) NOT NULL,
        is_mandatory BOOLEAN DEFAULT true
      );

      -- 8. ticket_statuses
      CREATE TABLE ticket_statuses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT
      );

      -- 9. tickets
      CREATE TABLE tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_number VARCHAR(50) UNIQUE NOT NULL,
        user_id UUID REFERENCES users(id),
        service_id INT REFERENCES services(id),
        status_id INT REFERENCES ticket_statuses(id),
        progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        priority VARCHAR(50) DEFAULT 'MEDIUM',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 10. ticket_details
      CREATE TABLE ticket_details (
        id SERIAL PRIMARY KEY,
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        app_name VARCHAR(255),
        target_users VARCHAR(255),
        callback_url VARCHAR(255),
        target_ip VARCHAR(255)
      );

      -- 11. ticket_attachments
      CREATE TABLE ticket_attachments (
        id SERIAL PRIMARY KEY,
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 12. ticket_assignments
      CREATE TABLE ticket_assignments (
        id SERIAL PRIMARY KEY,
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        team_id INT REFERENCES teams(id),
        assigned_to_user_id UUID REFERENCES users(id),
        assigned_by_user_id UUID REFERENCES users(id),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP
      );

      -- 13. ticket_histories
      CREATE TABLE ticket_histories (
        id SERIAL PRIMARY KEY,
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        changed_by_user_id UUID REFERENCES users(id),
        old_status_id INT REFERENCES ticket_statuses(id),
        new_status_id INT REFERENCES ticket_statuses(id),
        log_description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 14. ticket_feedback
      CREATE TABLE ticket_feedback (
        id SERIAL PRIMARY KEY,
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE UNIQUE,
        user_id UUID REFERENCES users(id),
        rating INT CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 15. notifications
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        type VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP
      );

      -- 16. refresh_tokens
      CREATE TABLE refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Seeding Master Data (Roles & Statuses)...');
    await client.query(`
      INSERT INTO roles (name) VALUES ('USER'), ('HELPDESK'), ('PEGAWAI'), ('ADMIN');
      
      INSERT INTO ticket_statuses (id, name, description) VALUES 
      (1, 'PENDING', 'Menunggu Verifikasi'),
      (2, 'VERIFIED', 'Sudah diverifikasi helpdesk, perlu ditugaskan'),
      (3, 'REJECTED', 'Ditolak oleh helpdesk'),
      (4, 'ASSIGNED', 'Ditugaskan ke tim/pegawai'),
      (5, 'IN_PROGRESS', 'Sedang dikerjakan'),
      (6, 'WAITING_USER_CONFIRMATION', 'Pekerjaan selesai 100%, menunggu rating pemohon'),
      (7, 'COMPLETED', 'Selesai dan sudah diberi rating');
      
      INSERT INTO service_categories (name) VALUES 
      ('Pengelolaan Aplikasi Informatika'),
      ('Pengelolaan Sumber Daya & Perangkat Keras'),
      ('Penerapan Persandian & Keamanan Informasi');
    `);

    await client.query('COMMIT');
    console.log('Migration successful!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
  }
};

runMigration();
