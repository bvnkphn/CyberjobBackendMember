/**
 * reset-db.cjs — รีเซ็ตฐานข้อมูลทั้งหมด เหลือแค่ admin
 * ใช้: node scripts/reset-db.cjs
 */
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/api/.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!DATABASE_URL) { console.error('ERROR: ไม่พบ DATABASE_URL'); process.exit(1); }

async function main() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected');

  const tables = ['"JobApplication"','"Bookmark"','"HiddenJob"','"Invitation"','"CandidateProfile"','"JobPosting"','"Company"'];
  for (const t of tables) {
    const r = await client.query('DELETE FROM ' + t);
    console.log('Deleted', t, r.rowCount, 'rows');
  }

  const r = await client.query('DELETE FROM "User" WHERE role != \'ADMIN\' RETURNING email');
  console.log('Deleted non-admin users:', r.rows.map(x=>x.email));

  const remaining = await client.query('SELECT email, role FROM "User"');
  console.log('Remaining users:', remaining.rows);
  await client.end();
  console.log('Done!');
}
main().catch(e => { console.error(e); process.exit(1); });
