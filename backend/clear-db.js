require('dotenv').config();
const postgres = require('postgres');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set in .env");
  process.exit(1);
}

const sql = postgres(url);

async function clearDb() {
  try {
    console.log('Clearing database tables...');
    // Order of tables or using CASCADE
    await sql`TRUNCATE TABLE bill_items, bills, shop_products, shop_members, staff_requests, products, shops, users CASCADE;`;
    console.log('Database cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDb();
