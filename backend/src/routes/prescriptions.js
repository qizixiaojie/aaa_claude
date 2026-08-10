// 处方模块：我的处方列表（含明细）/ 处方详情 / 取药
const express = require('express');
const { query, execute } = require('../config/db');
const { ok, fail } = require('../utils/response');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * 查询处方（含 items 明细），仅允许本人查看
 */
async function getPrescriptionDetail(id, userId) {
  const rows = await query(`
    SELECT p.id,
           p.presc_no AS prescNo,
           doc.name AS doctorName,
           p.patient_name AS patientName,
           p.total_amount AS totalAmount,
           p.status,
           DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt
    FROM prescriptions p
    LEFT JOIN doctors doc ON doc.id = p.doctor_id
    WHERE p.id = ? AND p.user_id = ?
  `, [id, userId]);
  if (rows.length === 0) return null;

  const items = await query(`
    SELECT m.name AS medicineName,
           m.specification,
           pi.quantity,
           pi.unit_price AS unitPrice,
           pi.total,
           pi.dosage
    FROM prescription_items pi
    JOIN medicines m ON m.id = pi.medicine_id
    WHERE pi.prescription_id = ?
  `, [id]);

  return { ...rows[0], items };
}

// GET /api/prescriptions/my 需登录
router.get('/my', auth, async (req, res) => {
  const rows = await query(`
    SELECT p.id,
           p.presc_no AS prescNo,
           doc.name AS doctorName,
           p.patient_name AS patientName,
           p.total_amount AS totalAmount,
           p.status,
           DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt
    FROM prescriptions p
    LEFT JOIN doctors doc ON doc.id = p.doctor_id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `, [req.userId]);

  const result = [];
  for (const r of rows) {
    const items = await query(`
      SELECT m.name AS medicineName,
             m.specification,
             pi.quantity,
             pi.unit_price AS unitPrice,
             pi.total,
             pi.dosage
      FROM prescription_items pi
      JOIN medicines m ON m.id = pi.medicine_id
      WHERE pi.prescription_id = ?
    `, [r.id]);
    result.push({ ...r, items });
  }
  return ok(res, result);
});

// GET /api/prescriptions/:id 需登录
router.get('/:id', auth, async (req, res) => {
  const detail = await getPrescriptionDetail(Number(req.params.id), req.userId);
  if (!detail) return fail(res, '处方不存在', 404);
  return ok(res, { prescription: detail });
});

// POST /api/prescriptions/:id/pickup 需登录（待取药 -> 已取药）
router.post('/:id/pickup', auth, async (req, res) => {
  const id = Number(req.params.id);
  const result = await execute(
    'UPDATE prescriptions SET status = ? WHERE id = ? AND user_id = ? AND status = ?',
    ['已取药', id, req.userId, '待取药']
  );
  if (result.affectedRows === 0) {
    const exists = await query('SELECT id FROM prescriptions WHERE id = ? AND user_id = ?', [id, req.userId]);
    if (exists.length === 0) return fail(res, '处方不存在', 404);
    return fail(res, '当前状态不可取药');
  }
  const detail = await getPrescriptionDetail(id, req.userId);
  return ok(res, { prescription: detail });
});

module.exports = router;
