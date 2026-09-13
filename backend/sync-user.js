require('dotenv').config();
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    const res = await sql`
      INSERT INTO users (clerk_id, email, name, role, is_premium, is_banned)
      VALUES (
        'user_3JGWUwUj5Ej6mynOLlcQ9qrpJN2',
        'kushalkambar07@gmail.com',
        'Kushal Kambar',
        'app_admin',
        true,
        false
      )
      ON CONFLICT (clerk_id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = 'app_admin',
        is_premium = true,
        updated_at = now()
      RETURNING *;
    `;
    console.log('SYNC SUCCESSFUL:', res);
  } catch (err) {
    console.error('SYNC FAILED:', err);
  } finally {
    await sql.end();
  }
}

main();
