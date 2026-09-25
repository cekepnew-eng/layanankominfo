const db = require('./src/config/database'); // or wherever db is

const runCleanup = async () => {
  try {
    console.log('Starting data cleanup...');
    
    // 1. Delete all tickets and ticket histories to avoid foreign key constraints
    await db.query('DELETE FROM ticket_histories');
    await db.query('DELETE FROM ticket_assignments');
    await db.query('DELETE FROM ticket_details');
    await db.query('DELETE FROM tickets');
    console.log('Cleared all tickets data.');

    // 2. Find the Aptika category ID
    const aptikaCat = await db.query("SELECT id FROM service_categories WHERE category_name ILIKE '%Informatika%' OR category_name = 'Aplikasi Informatika' LIMIT 1");
    
    let aptikaId = null;
    if (aptikaCat.rows.length > 0) {
      aptikaId = aptikaCat.rows[0].id;
      console.log('Found Aptika category ID:', aptikaId);
    }

    // 3. Delete requirements for ALL services
    await db.query('DELETE FROM service_requirements');
    
    // 4. Delete all services except those in Aptika
    if (aptikaId) {
      await db.query('DELETE FROM services WHERE category_id != $1', [aptikaId]);
      await db.query('DELETE FROM service_categories WHERE id != $1', [aptikaId]);
      console.log('Deleted all services and categories EXCEPT Aptika.');
    } else {
      await db.query('DELETE FROM services');
      await db.query('DELETE FROM service_categories');
      console.log('No Aptika category found. Deleted all services and categories.');
      
      // Re-create Aptika category
      const res = await db.query("INSERT INTO service_categories (category_name) VALUES ('Aplikasi Informatika') RETURNING id");
      aptikaId = res.rows[0].id;
      console.log('Recreated Aptika category with ID:', aptikaId);
    }

    // 5. Optionally, update the remaining Aptika services to have an empty or sample JSONB form_schema if they don't have one
    await db.query(`UPDATE services SET form_schema = '[
      {
        "id": "123",
        "label": "Nama Lengkap",
        "name": "nama_lengkap",
        "type": "text",
        "required": true
      }
    ]'::jsonb WHERE form_schema IS NULL OR form_schema::text = '[]'`);

    console.log('Cleanup finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
};

runCleanup();
