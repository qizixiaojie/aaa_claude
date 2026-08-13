// 管理后台路由：全部挂载在 /api/admin 下，需 auth + requireAdmin
const express = require('express');
const { pool, query } = require('../config/db');
const { ok, fail } = require('../utils/response');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');
const { ensureSchedules } = require('../utils/scheduleGenerator');
const { _createPrescription } = require('./appointments');

const router = express.Router();

// 所有 admin 路由都需要登录 + 管理员权限
router.use(auth, requireAdmin);

// ---------------- 统计 ----------------
// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  const [todayAppt] = await query(`
    SELECT COUNT(*) AS cnt FROM appointments WHERE appoint_date = CURDATE()
  `);
  const [waiting] = await query(`SELECT COUNT(*) AS cnt FROM appointments WHERE status = '待就诊'`);
  const [paidSum] = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = '成功'`
  );
  const [userCnt] = await query(`SELECT COUNT(*) AS cnt FROM users`);
  const [doctorCnt] = await query(`SELECT COUNT(*) AS cnt FROM doctors`);
  // 医生工作量：各医生已接诊（已完成）人次，取前 5
  const doctorLoad = await query(`
    SELECT doc.name AS doctorName, dep.name AS depName, COUNT(a.id) AS count
    FROM appointments a
    JOIN doctors doc ON doc.id = a.doctor_id
    LEFT JOIN departments dep ON dep.id = doc.department_id
    WHERE a.status = '已完成'
    GROUP BY doc.id, doc.name, dep.name
    ORDER BY count DESC
    LIMIT 5
  `);

  return ok(res, {
    todayAppointments: Number(todayAppt[0].cnt),
    waitingCount: Number(waiting[0].cnt),
    totalPaid: Number(paidSum[0].total),
    totalUsers: Number(userCnt[0].cnt),
    totalDoctors: Number(doctorCnt[0].cnt),
    doctorLoad,
  });
});

// ---------------- 科室管理 ----------------
// GET /api/admin/departments?keyword=
router.get('/departments', async (req, res) => {
  const { keyword } = req.query;
  const params = [];
  let where = '';
  if (keyword) {
    where = 'WHERE d.name LIKE ? OR d.code LIKE ?';
    const kw = `%${keyword}%`;
    params.push(kw, kw);
  }
  const rows = await query(`
    SELECT d.id, d.name, d.code, d.description, d.location, d.icon,
           (SELECT COUNT(*) FROM doctors doc WHERE doc.department_id = d.id) AS doctorCount
    FROM departments d
    ${where}
    ORDER BY d.id
  `, params);
  return ok(res, rows);
});

// POST /api/admin/departments body{name,code,description,location,icon}
router.post('/departments', async (req, res) => {
  const { name, code, description, location, icon } = req.body || {};
  if (!name || !code) return fail(res, '科室名称和编码不能为空');
  const result = await pool.query(
    'INSERT INTO departments (name, code, description, location, icon) VALUES (?,?,?,?,?)',
    [name, code, description || null, location || null, icon || null]
  );
  return ok(res, { id: result[0].insertId });
});

// PUT /api/admin/departments/:id
router.put('/departments/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, code, description, location, icon } = req.body || {};
  if (!name || !code) return fail(res, '科室名称和编码不能为空');
  await pool.query(
    'UPDATE departments SET name=?, code=?, description=?, location=?, icon=? WHERE id=?',
    [name, code, description || null, location || null, icon || null, id]
  );
  return ok(res, { id });
});

// DELETE /api/admin/departments/:id（有医生时禁止删除）
router.delete('/departments/:id', async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM doctors WHERE department_id = ?', [id]);
  if (Number(rows[0].cnt) > 0) return fail(res, '该科室下仍有医生，请先处理医生');
  await pool.query('DELETE FROM departments WHERE id = ?', [id]);
  return ok(res, { id });
});

// ---------------- 医生管理 ----------------
// GET /api/admin/doctors?departmentId=&keyword=
router.get('/doctors', async (req, res) => {
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
    SELECT doc.id, doc.name, doc.gender, doc.title, doc.specialty, doc.introduction,
           doc.reg_fee AS regFee, doc.years_experience AS yearsExperience, doc.avatar,
           doc.department_id AS departmentId, dep.name AS departmentName
    FROM doctors doc
    LEFT JOIN departments dep ON dep.id = doc.department_id
    ${where}
    ORDER BY doc.id
  `, params);
  return ok(res, rows);
});

// POST /api/admin/doctors
router.post('/doctors', async (req, res) => {
  const { departmentId, name, gender = '男', title, specialty, introduction, avatar, regFee, yearsExperience } = req.body || {};
  if (!departmentId || !name || !title) return fail(res, '科室、姓名、职称为必填');
  const result = await pool.query(
    `INSERT INTO doctors
       (department_id, name, gender, title, specialty, introduction, avatar, reg_fee, years_experience)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [departmentId, name, gender, title, specialty || null, introduction || null, avatar || null,
     regFee || 0, yearsExperience || 0]
  );
  return ok(res, { id: result[0].insertId });
});

// PUT /api/admin/doctors/:id
router.put('/doctors/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { departmentId, name, gender, title, specialty, introduction, avatar, regFee, yearsExperience } = req.body || {};
  if (!departmentId || !name || !title) return fail(res, '科室、姓名、职称为必填');
  await pool.query(
    `UPDATE doctors SET department_id=?, name=?, gender=?, title=?, specialty=?,
       introduction=?, avatar=?, reg_fee=?, years_experience=? WHERE id=?`,
    [departmentId, name, gender, title, specialty || null, introduction || null, avatar || null,
     regFee || 0, yearsExperience || 0, id]
  );
  return ok(res, { id });
});

// DELETE /api/admin/doctors/:id（有预约记录时禁止删除）
router.delete('/doctors/:id', async (req, res) => {
  const id = Number(req.params.id);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [apptRows] = await conn.query(
      'SELECT COUNT(*) AS cnt FROM appointments WHERE doctor_id = ?', [id]
    );
    if (Number(apptRows[0].cnt) > 0) {
      await conn.rollback();
      return fail(res, '该医生已有预约记录，不能删除');
    }
    await conn.query('DELETE FROM schedules WHERE doctor_id = ?', [id]);
    await conn.query('DELETE FROM doctors WHERE id = ?', [id]);
    await conn.commit();
    return ok(res, { id });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// ---------------- 排班生成 ----------------
// POST /api/admin/schedules/generate（手动补未来 7 天排班，幂等）
router.post('/schedules/generate', async (req, res) => {
  const added = await ensureSchedules();
  return ok(res, { added });
});

// ---------------- 预约管理 ----------------
// GET /api/admin/appointments?status=&date=&keyword=&doctorId=
router.get('/appointments', async (req, res) => {
  const { status, date, keyword, doctorId } = req.query;
  const conditions = [];
  const params = [];
  if (status) {
    conditions.push('a.status = ?');
    params.push(status);
  }
  if (date) {
    conditions.push('a.appoint_date = ?');
    params.push(date);
  }
  if (doctorId) {
    conditions.push('a.doctor_id = ?');
    params.push(doctorId);
  }
  if (keyword) {
    conditions.push('(a.patient_name LIKE ? OR a.order_no LIKE ? OR u.phone LIKE ? OR u.real_name LIKE ?)');
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw, kw);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query(`
    SELECT a.id, a.order_no AS orderNo, DATE_FORMAT(a.appoint_date, '%Y-%m-%d') AS appointDate,
           a.period, a.fee, a.status, a.queue_no AS queueNo, a.patient_name AS patientName,
           DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
           u.real_name AS userName, u.phone AS userPhone,
           doc.name AS doctorName, dep.name AS departmentName,
           pay.payment_no AS paymentNo
    FROM appointments a
    JOIN users u ON u.id = a.user_id
    JOIN doctors doc ON doc.id = a.doctor_id
    LEFT JOIN departments dep ON dep.id = doc.department_id
    LEFT JOIN payments pay ON pay.order_no = a.order_no
    ${where}
    ORDER BY a.id DESC
    LIMIT 300
  `, params);
  return ok(res, rows);
});

// PUT /api/admin/appointments/:id/status body{status}
// 手动改状态；改为「已完成」时若尚无处方则自动补生成，保持数据一致
router.put('/appointments/:id/status', async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  const valid = ['待支付', '已支付', '待就诊', '已完成', '已取消'];
  if (!valid.includes(status)) return fail(res, '状态不合法（待支付/已支付/待就诊/已完成/已取消）');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query('SELECT * FROM appointments WHERE id = ? FOR UPDATE', [id]);
    if (rows.length === 0) {
      await conn.rollback();
      return fail(res, '预约不存在', 404);
    }
    const appt = rows[0];

    if (status === '已完成') {
      const [prescRows] = await conn.query(
        'SELECT id FROM prescriptions WHERE appointment_id = ?', [id]
      );
      if (prescRows.length === 0) {
        await _createPrescription(conn, appt, id, appt.user_id);
      }
    }
    if (status === '已取消') {
      // 取消后恢复号源
      await conn.query('UPDATE schedules SET remaining_slots = remaining_slots + 1 WHERE id = ?', [appt.schedule_id]);
    }

    await conn.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
    await conn.commit();
    return ok(res, { id, status });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// ---------------- 处方管理 ----------------
// GET /api/admin/prescriptions?keyword=&status=
router.get('/prescriptions', async (req, res) => {
  const { keyword, status } = req.query;
  const conditions = [];
  const params = [];
  if (status) {
    conditions.push('p.status = ?');
    params.push(status);
  }
  if (keyword) {
    conditions.push('(p.presc_no LIKE ? OR p.patient_name LIKE ? OR u.real_name LIKE ?)');
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query(`
    SELECT p.id, p.presc_no AS prescNo, p.patient_name AS patientName,
           p.total_amount AS totalAmount, p.status,
           DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
           doc.name AS doctorName, u.real_name AS userName
    FROM prescriptions p
    JOIN doctors doc ON doc.id = p.doctor_id
    JOIN users u ON u.id = p.user_id
    ${where}
    ORDER BY p.id DESC
    LIMIT 300
  `, params);
  return ok(res, rows);
});

module.exports = router;
