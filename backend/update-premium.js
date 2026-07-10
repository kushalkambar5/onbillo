require('dotenv').config();
const postgres = require('postgres');
console.log('Connecting to database:', process.env.DATABASE_URL);
const sql = postgres(process.env.DATABASE_URL);

async function run() {
  try {
    const result = await sql`UPDATE users SET is_premium = true;`;
    console.log('Successfully updated all existing users to premium!', result);
    process.exit(0);
  } catch (error) {
    console.error('Failed to update users:', error);
    process.exit(1);
  }
}

run();
