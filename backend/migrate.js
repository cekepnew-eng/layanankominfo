const db = require('./src/config/database');
async function run() {
  try {
    const res = await db.query('SELECT td.ticket_id, td.form_data, s.form_schema FROM ticket_details td JOIN tickets t ON td.ticket_id = t.id JOIN services s ON t.service_id = s.id');
    let updatedCount = 0;
    for (const row of res.rows) {
      if (!row.form_data || !row.form_schema) continue;
      let formDataObj = row.form_data;
      if (typeof formDataObj === 'string') try { formDataObj = JSON.parse(formDataObj); } catch(e) { continue; }
      let schemaArr = row.form_schema;
      if (typeof schemaArr === 'string') try { schemaArr = JSON.parse(schemaArr); } catch(e) { continue; }
      let needsUpdate = false;
      const newFormData = {};
      for (const [key, value] of Object.entries(formDataObj)) {
        if (key.startsWith('field_')) {
          let newLabel = key;
          for (const field of schemaArr) {
            if (field.name === key || field.id === key) { newLabel = field.label || key; break; }
            if (field.type === 'group' && field.subFields) {
              for (const sub of field.subFields) {
                if (sub.name === key || sub.id === key) { newLabel = sub.label || key; break; }
              }
            }
          }
          if (newLabel !== key) {
             newFormData[newLabel] = value;
             needsUpdate = true;
             if (formDataObj[`${key}_name`]) {
                 newFormData[`${newLabel}_name`] = formDataObj[`${key}_name`];
             }
          } else {
             newFormData[key] = value;
          }
        } else if (!key.endsWith('_name') || !key.startsWith('field_')) {
          newFormData[key] = value;
        }
      }
      if (needsUpdate) {
        await db.query('UPDATE ticket_details SET form_data = $1 WHERE ticket_id = $2', [JSON.stringify(newFormData), row.ticket_id]);
        updatedCount++;
      }
    }
    console.log('Migrated ' + updatedCount + ' tickets.');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
