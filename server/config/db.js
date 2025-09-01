const mysql = require("mysql2/promise");
require("dotenv").config();

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool;

async function connectWithRetry() {
  let retries = 10;
  while (retries > 0) {
    try {
      pool = mysql.createPool(config);
      await pool.getConnection();
      console.log("✅ DB Connected successfully");
      return pool;
    } catch (err) {
      retries -= 1;
      console.log(
        `❌ DB connection error, retries left: ${retries}`,
        err.message
      );
      if (retries === 0) {
        console.error("❌ Failed to connect to DB after several attempts.");
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, 3000)); // wait 3s
    }
  }
}

async function getDB() {
  if (!pool) {
    await connectWithRetry();
  }
  return pool;
}

module.exports = {
  getDB,
  query: (...args) => getDB().then((db) => db.query(...args)),
};
