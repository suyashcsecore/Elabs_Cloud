const fs = require('fs');
const path = require('path');
const { getClient, pool } = require('./index');

async function runSeeds() {
  console.log('--- Starting Database Seeding ---');
  const client = await getClient();

  try {
    const seedPath = path.resolve(__dirname, '../../../database/seeds.sql');
    if (!fs.existsSync(seedPath)) {
      throw new Error(`Seed file not found at ${seedPath}`);
    }

    const sql = fs.readFileSync(seedPath, 'utf8');
    
    console.log(`Executing seed file: ${path.basename(seedPath)}...`);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log(' Seed data 001_seed_dev_data.sql applied successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(' Seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runSeeds();
}

module.exports = runSeeds;
