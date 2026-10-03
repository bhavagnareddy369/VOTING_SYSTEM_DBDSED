const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'bhavagnareddy', // <-- REPLACE THIS WITH YOUR MYSQL WORKBENCH PASSWORD
  database: 'voting_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;