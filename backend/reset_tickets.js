const db = require('./db');

async function cleanAllTickets() {
  const client = await db.pool.connect();
  try {
    console.log('--- MEMULAI PENGHAPUSAN SELURUH DATA TIKET ---');

    await client.query('BEGIN');

    // 1. Hitung data sebelum dihapus untuk laporan
    const countQuery = async (table) => {
      try {
        const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
        return parseInt(res.rows[0].count, 10);
      } catch (err) {
        return 0; // jika tabel belum ada / error
      }
    };

    const before = {
      tickets: await countQuery('tickets'),
      ticket_details: await countQuery('ticket_details'),
      ticket_assignments: await countQuery('ticket_assignments'),
      ticket_histories: await countQuery('ticket_histories'),
      ticket_attachments: await countQuery('ticket_attachments'),
      ticket_feedback: await countQuery('ticket_feedback'),
      skm_surveys: await countQuery('skm_surveys'),
      subtasks: await countQuery('subtasks'),
      notifications: await countQuery('notifications'),
      users: await countQuery('users'),
      services: await countQuery('services')
    };

    console.log('Data sebelum pembersihan:', before);

    // 2. Hapus notifikasi terkait tiket terlebih dahulu atau bersihkan notifikasi tiket
    try {
      await client.query(`DELETE FROM notifications WHERE ticket_id IS NOT NULL;`);
    } catch (e) {
      console.log('Notice notifikasi:', e.message);
    }

    // 3. Eksekusi TRUNCATE CASCADE pada tickets dan ticket_attachments
    // TRUNCATE CASCADE di PostgreSQL otomatis mengosongkan tickets dan semua tabel turunannya
    await client.query(`TRUNCATE TABLE tickets RESTART IDENTITY CASCADE;`);
    try {
      await client.query(`TRUNCATE TABLE ticket_attachments RESTART IDENTITY CASCADE;`);
    } catch (e) {
      console.log('Notice ticket_attachments:', e.message);
    }

    // Reset sequence tabel-tabel turunan jika menggunakan SERIAL
    const sequences = [
      'ticket_details_id_seq',
      'ticket_assignments_id_seq',
      'ticket_histories_id_seq',
      'ticket_feedback_id_seq',
      'skm_surveys_id_seq',
      'ticket_attachments_id_seq',
      'subtasks_id_seq'
    ];

    for (const seq of sequences) {
      try {
        await client.query(`ALTER SEQUENCE IF EXISTS ${seq} RESTART WITH 1;`);
      } catch (err) {
        // Abaikan jika sequence tidak ada
      }
    }

    await client.query('COMMIT');

    // 4. Hitung data setelah dihapus untuk verifikasi
    const after = {
      tickets: await countQuery('tickets'),
      ticket_details: await countQuery('ticket_details'),
      ticket_assignments: await countQuery('ticket_assignments'),
      ticket_histories: await countQuery('ticket_histories'),
      ticket_attachments: await countQuery('ticket_attachments'),
      ticket_feedback: await countQuery('ticket_feedback'),
      skm_surveys: await countQuery('skm_surveys'),
      subtasks: await countQuery('subtasks'),
      users: await countQuery('users'),
      services: await countQuery('services')
    };

    console.log('--- PEMBERSIHAN SELESAI DENGAN SUKSES ---');
    console.log('Data sesudah pembersihan:', after);
    console.log('Data Master (Users & Services) tetap utuh!');

    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saat menghapus data tiket:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

cleanAllTickets();
