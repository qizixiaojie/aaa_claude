// 药品模块：列表（keyword 模糊 / category 过滤）、详情
const express = require('express');
const { query } = require('../config/db');
const { ok, fail } = require('../utils/response');

const router = express.Router();

const SELECT_FIELDS = `
  id,
  code,
  name,
  generic_name AS genericName,
  specification,
  unit,
  price,
  manufacturer,
  category,
  stock,
  description
`;

// GET /api/medicines?keyword=&category=
router.get('/', async (req, res) => {
  const { keyword, category } = req.query;
  const conditions = [];
  const params = [];

  if (keyword) {
    conditions.push('(name LIKE ? OR generic_name LIKE ?)');
    const kw = `%${keyword}%`;
    params.push(kw, kw);
  }
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query(`SELECT ${SELECT_FIELDS} FROM medicines ${where} ORDER BY id`, params);
  return ok(res, rows);
});

// GET /api/medicines/:id
router.get('/:id', async (req, res) => {
  const rows = await query(`SELECT ${SELECT_FIELDS} FROM medicines WHERE id = ?`, [req.params.id]);
  if (rows.length === 0) return fail(res, '药品不存在', 404);
  return ok(res, { medicine: rows[0] });
});

module.exports = router;
