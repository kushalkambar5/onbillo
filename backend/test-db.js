require('dotenv').config();
const postgres = require('postgres');
console.log('URL', process.env.DATABASE_URL);
const sql = postgres(process.env.DATABASE_URL);
sql`SELECT 1`.then(() => {
  console.log('Connected!');
  process.exit(0);
}).catch(e => {
  console.error('Connection failed:', e.message);
  process.exit(1);
});
