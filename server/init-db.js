const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function init() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'src', 'db', 'schema.sql'), 'utf-8');
    await pool.query(schema);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Failed to apply schema:', err);
  } finally {
    pool.end();
  }
}

init();
