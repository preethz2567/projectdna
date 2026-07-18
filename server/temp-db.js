const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:postgres123@localhost:5433/projectdna' });

async function run() {
  try {
    await pool.query("ALTER TABLE tasks DROP CONSTRAINT tasks_status_check");
    await pool.query("ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('backlog', 'todo', 'in_progress', 'done'))");
    console.log("Success");
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
