const db = require('./src/config/database');

const CATEGORY_NAME = 'Aplikasi Informatika';

const applicationFormFields = [
  { id: 'nama', name: 'nama', label: 'Nama', type: 'text', required: true },
  { id: 'perangkat_daerah', name: 'perangkat_daerah', label: 'Perangkat Daerah', type: 'text', required: true },
  { id: 'alamat', name: 'alamat', label: 'Alamat', type: 'textarea', required: true },
  { id: 'no_telephone', name: 'no_telephone', label: 'No Telephone', type: 'text', required: true },
  { id: 'pengaduan_saran', name: 'pengaduan_saran', label: 'Pengaduan/Saran', type: 'textarea', required: true },
  { id: 'upload_bukti', name: 'upload_bukti', label: 'Upload Bukti (PDF / Gambar)', type: 'file', required: true }
];

const parseFormSchema = (formSchema, serviceName) => {
  if (formSchema == null) return [];

  const parsedSchema = typeof formSchema === 'string'
    ? JSON.parse(formSchema)
    : formSchema;

  if (!Array.isArray(parsedSchema)) {
    throw new Error(`Form schema layanan "${serviceName}" bukan array.`);
  }

  return parsedSchema;
};

const seedApplicationForms = async () => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const categoryResult = await client.query(
      'SELECT id FROM service_categories WHERE LOWER(TRIM(category_name)) = LOWER($1) LIMIT 1',
      [CATEGORY_NAME]
    );

    if (categoryResult.rows.length === 0) {
      throw new Error(`Kategori "${CATEGORY_NAME}" tidak ditemukan.`);
    }

    const serviceResult = await client.query(
      'SELECT id, service_name, form_schema FROM services WHERE category_id = $1 ORDER BY id FOR UPDATE',
      [categoryResult.rows[0].id]
    );

    if (serviceResult.rows.length === 0) {
      throw new Error(`Tidak ada layanan pada kategori "${CATEGORY_NAME}".`);
    }

    let updatedCount = 0;
    for (const service of serviceResult.rows) {
      const currentSchema = parseFormSchema(service.form_schema, service.service_name);
      const nextSchema = applicationFormFields;

      if (JSON.stringify(currentSchema) !== JSON.stringify(nextSchema)) {
        await client.query(
          'UPDATE services SET form_schema = $1::jsonb WHERE id = $2',
          [JSON.stringify(nextSchema), service.id]
        );
        updatedCount += 1;
      }
    }

    await client.query('COMMIT');
    console.log(`[Seeder] Formulir berhasil diterapkan ke ${updatedCount} layanan kategori "${CATEGORY_NAME}".`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Seeder] Gagal memperbarui formulir layanan Aplikasi:', error);
    throw error;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  seedApplicationForms()
    .then(() => db.pool.end())
    .catch(async () => {
      await db.pool.end();
      process.exitCode = 1;
    });
}

module.exports = { seedApplicationForms };
