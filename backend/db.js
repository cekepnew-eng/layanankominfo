const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const db = require('./src/config/database');

module.exports = {
  query: (text, params) => db.query(text, params),
  pool: db.pool,
  runAutoMigrations: db.runAutoMigrations
};
