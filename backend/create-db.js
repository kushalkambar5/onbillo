require('dotenv').config();
const postgres = require('postgres');
// Connect to the default 'postgres' database
const url = process.env.DATABASE_URL.replace('/onbillo', '/postgres');
const sql = postgres(url);
sql`CREATE DATABASE onbillo`.then(() => {
  console.log('Database onbillo created!');
  process.exit(0);
}).catch(e => {
  console.error('Failed to create database:', e.message);
  process.exit(1);
});
