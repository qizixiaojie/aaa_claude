// 医院简介路由
const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { ok, fail } = require('../utils/response');

// GET /api/hospital/profile 医院简介（单行，id=1）
router.get('/profile', async (req, res) => {
  try {
    const rows = await query('SELECT id, name, level, address, phone, intro, open_hours, logo_url FROM hospital_profile WHERE id = 1 LIMIT 1');
    if (!rows.length) return fail(res, '医院简介不存在', 404);
    return ok(res, rows[0]);
  } catch (err) {
    return fail(res, err.message || '查询医院简介失败', 500);
  }
});

module.exports = router;
