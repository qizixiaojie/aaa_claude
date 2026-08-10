// 医生模块：列表（departmentId/keyword 过滤）、详情（含 department 对象）
const express = require('express');
const { query } = require('../config/db');
const { ok, fail } = require('../utils/response');

const router = express.Router();

const SELECT_FIELDS = `
  doc.id,
  doc.name,
  doc.gender,
  doc.title,
  doc.specialty,
  doc.reg_fee AS regFee,
  doc.years_experience AS yearsExperience,
  doc.avatar,
  dep.id AS depId,
  dep.name AS depName
`;

// GET /api/doctors?departmentId=&keyword=
router.get('/', async (req, res) => {
  const { departmentId, keyword } = req.query;
  const conditions = [];
  const params = [];

  if (departmentId) {
    conditions.push('doc.department_id = ?');
    params.push(departmentId);
  }
  if (keyword) {
    conditions.push('(doc.name LIKE ? OR doc.title LIKE ? OR doc.specialty LIKE ?)');
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query(`
    SELECT ${SELECT_FIELDS}
    FROM doctors doc
    LEFT JOIN departments dep ON dep.id = doc.department_id
    ${where}
    ORDER BY doc.id
  `, params);

  const list = rows.map((r) => ({
    id: r.id,
    name: r.name,
    gender: r.gender,
    title: r.title,
    specialty: r.specialty,
    regFee: r.regFee,
    yearsExperience: r.yearsExperience,
    avatar: r.avatar,
    department: { id: r.depId, name: r.depName },
  }));
  return ok(res, list);
});

// GET /api/doctors/:id
router.get('/:id', async (req, res) => {
  const rows = await query(`
    SELECT ${SELECT_FIELDS},
           doc.introduction,
           dep.code AS depCode,
           dep.description AS depDescription,
           dep.location AS depLocation
    FROM doctors doc
    LEFT JOIN departments dep ON dep.id = doc.department_id
    WHERE doc.id = ?
  `, [req.params.id]);

  if (rows.length === 0) return fail(res, '医生不存在', 404);
  const r = rows[0];
  return ok(res, {
    doctor: {
      id: r.id,
      name: r.name,
      gender: r.gender,
      title: r.title,
      specialty: r.specialty,
      introduction: r.introduction,
      regFee: r.regFee,
      yearsExperience: r.yearsExperience,
      avatar: r.avatar,
      department: {
        id: r.depId,
        name: r.depName,
        code: r.depCode,
        description: r.depDescription,
        location: r.depLocation,
      },
    },
  });
});

module.exports = router;
