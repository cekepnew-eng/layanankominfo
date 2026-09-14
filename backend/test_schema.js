const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:helpdeskyareu@localhost:5432/helpdesk-kominfo?schema=public' });
client.connect().then(async () => {
  const t = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tickets'");
  console.log('TICKETS:');
  t.rows.forEach(r => console.log(r.column_name, r.data_type));
  const d = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ticket_details'");
  console.log('DETAILS:');
  d.rows.forEach(r => console.log(r.column_name, r.data_type));
  const f = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ticket_feedback'");
  console.log('FEEDBACK:');
  f.rows.forEach(r => console.log(r.column_name, r.data_type));
}).catch(err => console.error(err.message)).finally(() => client.end());
