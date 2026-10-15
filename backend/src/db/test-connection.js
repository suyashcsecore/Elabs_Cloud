const { testConnection, pool } = require('./index');

async function test() {
  console.log('Testing PostgreSQL connection...');
  const res = await testConnection();
  if (res.connected) {
    console.log(' Successfully connected to PostgreSQL:');
    console.log(`   Database: ${res.database}`);
    console.log(`   Server Timestamp: ${res.time}`);
  } else {
    console.error(' Failed to connect to PostgreSQL:');
    console.error(`   Error: ${res.error}`);
  }
  await pool.end();
}

test();
