// JWT 鉴权中间件：解析 Authorization: Bearer <token>，验证后挂载 req.userId
const jwt = require('jsonwebtoken');
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

module.exports = auth;
