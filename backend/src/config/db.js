// mysql2/promise 连接池封装，统一从这里拿 query/execute
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  dateStrings: true,        // DATE/DATETIME 以字符串返回，避免时区与序列化问题
  decimalNumbers: true,     // DECIMAL 转成 JS number
});

/**
 * 查询（SELECT），返回行数组
 * @param {string} sql   SQL 语句（? 占位符）
 * @param {Array}  params
 */
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * 写操作（INSERT/UPDATE/DELETE），返回 ResultSetHeader
 */
async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

module.exports = { pool, query, execute };
