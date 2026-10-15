const { query, pool } = require('./index');

async function fixPasswords() {
  // Hash for 'Password123!'
  const freshHash = '$2b$10$NVqvQYG.9khWdkvyACYeFO0w8LknFWZ5w7Y.AOT/gCssB1rS0dtie';

  try {
    const res = await query('UPDATE users SET password_hash = $1', [freshHash]);
    console.log(` Successfully updated ${res.rowCount} users with verified password 'Password123!'`);
  } catch (err) {
    console.error('Failed to update passwords:', err);
  } finally {
    await pool.end();
  }
}

fixPasswords();
