import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "3306"),
  waitForConnections: true,
  connectionLimit: 10, // Adjust based on your Azure MySQL plan
  queueLimit: 0,
  ssl: process.env.DB_HOST?.includes("azure.com")
    ? { rejectUnauthorized: false } // Azure requires SSL
    : undefined,
});

export default pool;