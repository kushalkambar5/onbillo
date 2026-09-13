require('dotenv').config();
const postgres = require('postgres');
console.log('URL', process.env.DATABASE_URL);
const sql = postgres(process.env.DATABASE_URL);
sql`SELECT id, clerk_id, email, name, role, is_premium, is_banned, created_at FROM users`.then(users => {
  console.log('USERS IN DB:', users);
  return sql`SELECT id, name, created_by FROM shops`;
}).then(shops => {
  console.log('SHPOS IN DB:', shops);
  process.exit(0);
}).catch(e => {
  console.error('Query failed:', e.message);
  process.exit(1);
});
