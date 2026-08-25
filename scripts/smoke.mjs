/**
 * Smoke test – ยิง API จริงเพื่อยืนยันว่าเส้นทางหลักยังทำงาน
 * ใช้ใน CI หลัง migrate + seed
 *
 *   node scripts/smoke.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? process.env.API_URL ?? 'http://localhost:4000/api';

let passed = 0;
let failed = 0;

function check(name, ok, extra = '') {
  if (ok) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${name} ${extra}`);
  }
}

async function json(path, init) {
  const res = await fetch(`${BASE}${path}`, init);
  const body = res.headers.get('content-type')?.includes('json')
    ? await res.json()
    : null;
  return { status: res.status, body, headers: res.headers };
}

async function main() {
  console.log(`Smoke test → ${BASE}`);

  /* ---- ประกาศงาน ---- */
  const jobs = await json('/jobs?pageSize=5');
  check('GET /jobs ตอบ 200', jobs.status === 200, `(${jobs.status})`);
  check('มีประกาศงานในฐานข้อมูล', (jobs.body?.total ?? 0) > 0);
  check(
    'ข้อมูลบริษัทถูกแนบมาด้วย',
    Boolean(jobs.body?.items?.[0]?.company?.slug),
  );

  const firstJob = jobs.body?.items?.[0];

  const filtered = await json('/jobs?workStyle=hybrid&pageSize=50');
  check(
    'ตัวกรองรูปแบบงานทำงาน',
    filtered.status === 200 &&
      filtered.body.items.every((j) => j.workStyle === 'hybrid'),
  );

  const suggest = await json('/jobs/suggest?q=d');
  check('Search Auto ตอบเป็นอาร์เรย์', Array.isArray(suggest.body));

  const detail = await json(`/jobs/${firstJob.slug}`);
  check('GET /jobs/:slug ตอบ 200', detail.status === 200);

  const related = await json(`/jobs/${firstJob.slug}/related`);
  check('งานที่แนะนำตอบเป็นอาร์เรย์', Array.isArray(related.body));

  /* ---- บริษัท ---- */
  const company = await json(`/companies/${firstJob.company.slug}`);
  check('GET /companies/:slug ตอบ 200', company.status === 200);
  check('มี jobCount', typeof company.body?.jobCount === 'number');

  /* ---- meta ---- */
  const meta = await json('/meta/filters');
  check('meta/filters มี categoryTree', Array.isArray(meta.body?.categoryTree));
  check('meta/filters มี regionTree', Array.isArray(meta.body?.regionTree));

  /* ---- validation ---- */
  const bad = await json('/jobs?workStyle=bogus');
  check('ค่า enum ผิดต้องได้ 400', bad.status === 400, `(${bad.status})`);

  /* ---- auth ---- */
  const email = `smoke_${Date.now()}@example.com`;
  const register = await json('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Passw0rd!', name: 'Smoke Test' }),
  });
  check('สมัครสมาชิกสำเร็จ', register.status === 201, `(${register.status})`);
  check('ได้ accessToken', Boolean(register.body?.accessToken));

  const token = register.body?.accessToken;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const me = await json('/auth/me', { headers: authHeaders });
  check('GET /auth/me ตอบ 200', me.status === 200);
  check('อีเมลตรงกับที่สมัคร', me.body?.email === email);

  const noAuth = await json('/me/bookmarks');
  check('เข้าถึง /me โดยไม่มี token ต้องได้ 401', noAuth.status === 401);

  const addBookmark = await json('/me/bookmarks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ jobId: firstJob.id }),
  });
  check('บันทึกงานสำเร็จ', addBookmark.status === 200, `(${addBookmark.status})`);

  const bookmarks = await json('/me/bookmarks', { headers: authHeaders });
  check(
    'งานที่บันทึกไว้ถูกเก็บในฐานข้อมูล',
    bookmarks.body?.some((j) => j.id === firstJob.id),
  );

  const apply = await json('/me/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ jobId: firstJob.id }),
  });
  check('สมัครงานสำเร็จ', apply.status === 201, `(${apply.status})`);

  const applyAgain = await json('/me/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ jobId: firstJob.id }),
  });
  check('สมัครซ้ำต้องได้ 409', applyAgain.status === 409, `(${applyAgain.status})`);

  const login = await json('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Passw0rd!' }),
  });
  check('เข้าสู่ระบบสำเร็จ', login.status === 200, `(${login.status})`);

  const wrongPassword = await json('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'wrong-password' }),
  });
  check('รหัสผ่านผิดต้องได้ 401', wrongPassword.status === 401);

  /* ---- support ---- */
  const ticket = await json('/support', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Smoke Test',
      email: 'smoke@example.com',
      topic: 'อื่น ๆ',
      message: 'ทดสอบระบบติดต่อฝ่ายสนับสนุนอัตโนมัติ',
    }),
  });
  check('ส่งเรื่องถึงฝ่ายสนับสนุนได้', ticket.status === 201);
  check('ได้หมายเลข ticket', Boolean(ticket.body?.ticketId));

  console.log(`\nผ่าน ${passed} / ล้มเหลว ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error('Smoke test ล้มเหลว:', error);
  process.exit(1);
});
