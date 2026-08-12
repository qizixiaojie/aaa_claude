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
  // 擅长/简介为空时自动生成占位内容，避免详情页空白
  const specialty = r.specialty || `${r.depName || '临床'}常见病的诊断与治疗`;
  const experienceText = r.yearsExperience > 0 ? `${r.yearsExperience} 年` : '多年';
  const introduction =
    r.introduction ||
    `${r.name}，${r.title}，从事${r.depName || '临床'}工作${experienceText}，临床经验丰富，医德高尚，深受患者信赖。`;
  return ok(res, {
    doctor: {
      id: r.id,
      name: r.name,
      gender: r.gender,
      title: r.title,
      specialty,
      introduction,
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
