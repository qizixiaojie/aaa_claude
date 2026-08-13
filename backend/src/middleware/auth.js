// JWT 鉴权中间件：解析 Authorization: Bearer <token>，验证后挂载 req.userId
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { fail } = require('../utils/response');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return fail(res, '未登录，请先登录', 401);
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    return next();
  } catch (err) {
    return fail(res, '登录已过期，请重新登录', 401);
  }
}

/**
 * 管理员鉴权中间件：需在 auth 之后使用，校验当前用户 role === 'admin'
 * （实时查库，改权限即时生效，不依赖 token 内的过期信息）
 */
async function requireAdmin(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (rows.length === 0) return fail(res, '用户不存在', 401);
    if (rows[0].role !== 'admin') return fail(res, '无管理员权限', 403);
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = auth;
module.exports.requireAdmin = requireAdmin;
