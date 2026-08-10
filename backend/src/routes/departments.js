// 科室模块：列表（带医生数）、详情
const express = require('express');
const { query } = require('../config/db');
const { ok, fail } = require('../utils/response');

const router = express.Router();

// GET /api/departments
router.get('/', async (req, res) => {
  const rows = await query(`
    SELECT d.id, d.name, d.code, d.description, d.location, d.icon,
           (SELECT COUNT(*) FROM doctors doc WHERE doc.department_id = d.id) AS doctorCount
    FROM departments d
    ORDER BY d.id
  `);
  return ok(res, rows);
});

// GET /api/departments/:id
router.get('/:id', async (req, res) => {
  const rows = await query(
    'SELECT id, name, code, description, location, icon FROM departments WHERE id = ?',
    [req.params.id]
  );
  if (rows.length === 0) return fail(res, '科室不存在', 404);
  return ok(res, { department: rows[0] });
});

module.exports = router;
