const fs = require('fs');
const path = require('path');
const { getClient, pool } = require('./index');

async function runMigrations() {
  console.log('--- Starting Database Migration ---');
  const client = await getClient();

  try {
    const migrationPath = path.resolve(__dirname, '../../../database/schema.sql');
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log(`Executing migration file: ${path.basename(migrationPath)}...`);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log(' Migration 001_initial_schema.sql applied successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(' Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
