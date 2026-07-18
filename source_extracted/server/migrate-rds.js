const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: 'memory-gallery-db.cb6km4ayuv2w.ap-south-1.rds.amazonaws.com',
  port: 5432,
  user: 'postgres',
  password: 'postgres123',
  database: 'projectdna',
  ssl: { rejectUnauthorized: false }
});

const schemaPath = path.join(__dirname, '../server/src/db/schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8');

async function run() {
  try {
    await client.connect();
    console.log('Connected to RDS projectdna database');
    await client.query(sql);
    console.log('Schema applied successfully!');

    // Verify tables
    const res = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log('Tables created:', res.rows.map(r => r.table_name).join(', '));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
