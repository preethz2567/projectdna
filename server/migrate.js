const pool = require('./src/db/index.js');

async function migrate() {
  try {
    console.log('Adding status column...');
    await pool.query(`
      ALTER TABLE project_members 
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted'))
    `);
    
    console.log('Updating existing members...');
    await pool.query(`
      UPDATE project_members 
      SET status = 'accepted' 
      WHERE status = 'pending'
    `);
    
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
