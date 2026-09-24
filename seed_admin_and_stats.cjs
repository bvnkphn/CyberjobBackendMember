const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres.sniigrychtgeazobudjk:5PmawimKNDesiLwgzpo8UNB9@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('Connecting to database...');
    
    // 1. Check counts
    const jobs = await pool.query('SELECT COUNT(*) FROM "Job"');
    const companies = await pool.query('SELECT COUNT(*) FROM "Company"');
    const apps = await pool.query('SELECT COUNT(*) FROM "Application"');
    console.log(`Current DB Stats: Jobs=${jobs.rows[0].count}, Companies=${companies.rows[0].count}, Applications=${apps.rows[0].count}`);

    // 2. Create or Update Admin user
    const adminEmail = 'admin@cyberjob.co.th';
    const adminPass = 'Admin1234!';
    const passwordHash = await bcrypt.hash(adminPass, 10);

    const existingAdmin = await pool.query('SELECT id, email, role FROM "User" WHERE email = $1', [adminEmail]);
    if (existingAdmin.rows.length > 0) {
      await pool.query(
        'UPDATE "User" SET role = $1, "passwordHash" = $2, name = $3 WHERE email = $4',
        ['ADMIN', passwordHash, 'ผู้ดูแลระบบ CyberJob', adminEmail]
      );
      console.log(`Updated existing user ${adminEmail} to ADMIN with password ${adminPass}`);
    } else {
      // Generate cuid-like ID
      const newId = 'admin_' + Date.now().toString(36);
      await pool.query(
        'INSERT INTO "User" (id, email, name, "passwordHash", role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [newId, adminEmail, 'ผู้ดูแลระบบ CyberJob', passwordHash, 'ADMIN']
      );
      console.log(`Created new ADMIN user: ${adminEmail} with password: ${adminPass}`);
    }

    // 3. List all users
    const allUsers = await pool.query('SELECT id, email, role, name FROM "User"');
    console.log('All Users in DB:', allUsers.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
