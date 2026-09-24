const { Client } = require('pg');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('No DATABASE_URL set, skipping setup-db');
    return;
  }
  let schema = 'public';
  try {
    const parsed = new URL(url);
    schema = parsed.searchParams.get('schema') || 'public';
  } catch (e) {
    const match = url.match(/[?&]schema=([^&]+)/);
    if (match) schema = match[1];
  }

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log(`Connected to database. Target schema: "${schema}"`);

    // Create schema if not exists
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`);

    // Set search_path so both schema and public are available
    await client.query(`SET search_path TO "${schema}", public;`);

    // Create in target schema
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS "${schema}"."User_code_seq";
      CREATE OR REPLACE FUNCTION "${schema}".next_user_code() RETURNS TEXT LANGUAGE sql AS $$
        SELECT 'CJ-' || lpad(n::text, greatest(4, length(n::text)), '0')
        FROM (SELECT nextval('"${schema}"."User_code_seq"') AS n) AS s
      $$;
    `);

    // Also create in public schema as fallback
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS public."User_code_seq";
      CREATE OR REPLACE FUNCTION public.next_user_code() RETURNS TEXT LANGUAGE sql AS $$
        SELECT 'CJ-' || lpad(n::text, greatest(4, length(n::text)), '0')
        FROM (SELECT nextval('public."User_code_seq"') AS n) AS s
      $$;
    `);

    console.log(`Successfully created/verified next_user_code() in "${schema}" and "public"!`);
  } catch (err) {
    console.error('setup-db warning:', err.message);
  } finally {
    await client.end().catch(() => {});
  }
}

main();
