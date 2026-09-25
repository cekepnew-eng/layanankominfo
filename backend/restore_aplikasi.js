const db = require('./db');
const run = async () => {
  try {
    const servicesData = [
      { name: 'Pengembangan aplikasi baru' },
      { name: 'Penambahan fitur' },
      { name: 'Perubahan fitur' },
      { name: 'Perbaikan error/bug' },
      { name: 'Pemeliharaan aplikasi' },
      { name: 'Upgrade aplikasi' },
      { name: 'Migrasi aplikasi' },
      { name: 'Integrasi API' },
      { name: 'Integrasi SSO' },
      { name: 'Integrasi SPLP' },
      { name: 'Konsultasi aplikasi' },
      { name: 'Asistensi teknis' },
      { name: 'Permohonan rekomendasi aplikasi' },
      { name: 'Evaluasi aplikasi' },
      { name: 'Review kebutuhan aplikasi' },
      { name: 'Review arsitektur aplikasi' },
      { name: 'Konsultasi pengembangan aplikasi' },
      { name: 'Pendampingan pengembangan aplikasi' },
      { name: 'Permohonan UKS' },
      { name: 'Pengajuan uji aplikasi' },
      { name: 'Konsultasi UKS' },
      { name: 'Perbaikan hasil UKS' },
      { name: 'Tindak lanjut hasil UKS' },
      { name: 'Vulnerability Assessment' },
      { name: 'Penetration Testing' },
      { name: 'VAPT' },
      { name: 'Security Assessment' },
      { name: 'Retest keamanan' },
      { name: 'Konsultasi keamanan aplikasi' }
    ];
    let catRes = await db.query('SELECT id FROM service_categories WHERE category_name = $1', ['Aplikasi Informatika']);
    if (catRes.rows.length === 0) {
      console.log('Inserting category: Aplikasi Informatika');
      catRes = await db.query('INSERT INTO service_categories (category_name) VALUES ($1) RETURNING id', ['Aplikasi Informatika']);
    }
    const catId = catRes.rows[0].id;
    for (const service of servicesData) {
      // Check if it already exists to avoid duplicates
      const exists = await db.query('SELECT id FROM services WHERE service_name = $1 AND category_id = $2', [service.name, catId]);
      if (exists.rows.length === 0) {
        await db.query('INSERT INTO services (category_id, service_name, target_sla, status) VALUES ($1, $2, $3, $4)', [catId, service.name, '7 Hari', 'Aktif']);
      }
    }
    console.log('Successfully inserted Aplikasi Informatika services!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
run();
