const app = require('./src/app');
const pool = require('./src/db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

async function start() {
  const schema = fs.readFileSync(path.join(__dirname, 'src/db/schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Schema ready');

  app.listen(PORT, () => {
    console.log(`ProjectDNA server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
