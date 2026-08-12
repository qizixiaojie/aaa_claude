// 挂号模块：创建预约 / 我的预约 / 取消 / 模拟支付（支付成功自动生成电子处方）
const express = require('express');
const { pool, query, execute } = require('../config/db');
const { ok, fail } = require('../utils/response');
const auth = require('../middleware/auth');

const router = express.Router();

const PAY_METHODS = ['微信支付', '支付宝', '医保支付'];

function genNo(prefix) {
  return `${prefix}${Date.now()}${String(Math.floor(1000 + Math.random() * 9000))}`;
}

// 支付凭证号：13 位数字 + 2 位大写字母（随机生成，不携带时间/订单等可读信息，查库保证唯一）
async function genCertificateNo(conn) {
  const digits = '0123456789';
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // 剔除易混淆的 I、O
  for (let i = 0; i < 5; i++) {
    let no = '';
    for (let d = 0; d < 13; d++) no += digits[Math.floor(Math.random() * 10)];
    no += letters[Math.floor(Math.random() * letters.length)];
    no += letters[Math.floor(Math.random() * letters.length)];
    const [rows] = await conn.query('SELECT id FROM payments WHERE payment_no = ?', [no]);
    if (rows.length === 0) return no;
  }
  // 极小概率碰撞兜底
  return `0${Date.now()}`.slice(0, 13) + letters.slice(0, 2);
}

// 本地时间格式化：YYYY-MM-DD HH:mm:ss
function formatDateTime(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// POST /api/appointments  body{doctorId,scheduleId,appointDate,period} 需登录
router.post('/', auth, async (req, res) => {
  const { doctorId, scheduleId, appointDate, period } = req.body || {};
  if (!doctorId || !scheduleId || !appointDate || !period) {
    return fail(res, '参数不完整：doctorId/scheduleId/appointDate/period 为必填');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 锁定排班行，防止并发超卖
    const [schedRows] = await conn.query(
      'SELECT * FROM schedules WHERE id = ? AND doctor_id = ? FOR UPDATE',
      [scheduleId, doctorId]
    );
    if (schedRows.length === 0) {
      await conn.rollback();
      return fail(res, '排班不存在或与医生不匹配', 404);
    }
    const sched = schedRows[0];
    if (sched.work_date !== appointDate || sched.period !== period) {
      await conn.rollback();
      return fail(res, '排班日期或时段不匹配');
    }
    if (sched.remaining_slots <= 0) {
      await conn.rollback();
      return fail(res, '该时段号源已约满');
    }

    // 医生挂号费
    const [docRows] = await conn.query('SELECT reg_fee AS regFee FROM doctors WHERE id = ?', [doctorId]);
    if (docRows.length === 0) {
      await conn.rollback();
      return fail(res, '医生不存在', 404);
    }
    const fee = docRows[0].regFee;

    // 就诊人姓名默认用户真实姓名
    const [userRows] = await conn.query('SELECT real_name AS realName FROM users WHERE id = ?', [req.userId]);
    if (userRows.length === 0) {
      await conn.rollback();
      return fail(res, '用户不存在', 404);
    }
    const patientName = userRows[0].realName;

    // 扣减号源
    await conn.query('UPDATE schedules SET remaining_slots = remaining_slots - 1 WHERE id = ?', [scheduleId]);

    // 排队号 = 该排班已预约数 + 1
    const [cntRows] = await conn.query(
      'SELECT COUNT(*) AS cnt FROM appointments WHERE schedule_id = ?',
      [scheduleId]
    );
    const queueNo = Number(cntRows[0].cnt) + 1;

    const orderNo = genNo('GH');
    const [insResult] = await conn.query(
      `INSERT INTO appointments
         (order_no, user_id, doctor_id, schedule_id, appoint_date, period, fee, status, queue_no, patient_name)
       VALUES (?,?,?,?,?,?,?,'待支付',?,?)`,
      [orderNo, req.userId, doctorId, scheduleId, appointDate, period, fee, queueNo, patientName]
    );

    await conn.commit();
    return ok(res, {
      appointment: { id: insResult.insertId, orderNo, queueNo, fee, status: '待支付' },
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// GET /api/appointments/my 需登录
// 说明：不返回已取消的预约（取消后即从列表移除）；已支付/已完成附带上支付时间与支付凭证号
router.get('/my', auth, async (req, res) => {
  const rows = await query(`
    SELECT a.id,
           a.order_no AS orderNo,
           DATE_FORMAT(a.appoint_date, '%Y-%m-%d') AS appointDate,
           a.period,
           a.fee,
           a.status,
           a.queue_no AS queueNo,
           DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
           a.patient_name AS patientName,
           pay.payment_no AS paymentNo,
           DATE_FORMAT(pay.paid_at, '%Y-%m-%d %H:%i:%s') AS paidAt,
           doc.id AS doctorId,
           doc.name AS doctorName,
           doc.title AS doctorTitle,
           dep.name AS departmentName
    FROM appointments a
    JOIN doctors doc ON doc.id = a.doctor_id
    LEFT JOIN departments dep ON dep.id = doc.department_id
    LEFT JOIN payments pay ON pay.order_no = a.order_no
    WHERE a.user_id = ? AND a.status <> '已取消'
    ORDER BY a.created_at DESC
  `, [req.userId]);

  const list = rows.map((r) => ({
    id: r.id,
    orderNo: r.orderNo,
    appointDate: r.appointDate,
    period: r.period,
    fee: r.fee,
    status: r.status,
    queueNo: r.queueNo,
    createdAt: r.createdAt,
    paymentNo: r.paymentNo,
    paidAt: r.paidAt,
    doctor: {
      id: r.doctorId,
      name: r.doctorName,
      title: r.doctorTitle,
      department: { name: r.departmentName },
    },
    patientName: r.patientName,
  }));
  return ok(res, list);
});

// POST /api/appointments/:id/cancel 需登录
router.post('/:id/cancel', auth, async (req, res) => {
  const id = Number(req.params.id);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT * FROM appointments WHERE id = ? AND user_id = ? FOR UPDATE',
      [id, req.userId]
    );
    if (rows.length === 0) {
      await conn.rollback();
      return fail(res, '预约不存在', 404);
    }
    const appt = rows[0];
    if (appt.status !== '待支付' && appt.status !== '已支付') {
      await conn.rollback();
      return fail(res, '当前状态不可取消');
    }

    await conn.query('UPDATE appointments SET status = ? WHERE id = ?', ['已取消', id]);
    await conn.query('UPDATE schedules SET remaining_slots = remaining_slots + 1 WHERE id = ?', [appt.schedule_id]);

    await conn.commit();
    return ok(res, {
      appointment: { id: appt.id, orderNo: appt.order_no, queueNo: appt.queue_no, fee: appt.fee, status: '已取消' },
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// POST /api/appointments/:id/pay  body{method} 需登录（模拟支付，成功后自动生成电子处方）
router.post('/:id/pay', auth, async (req, res) => {
  const id = Number(req.params.id);
  const { method = '微信支付' } = req.body || {};
  if (!PAY_METHODS.includes(method)) {
    return fail(res, '支付方式不合法（可选：微信支付/支付宝/医保支付）');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT * FROM appointments WHERE id = ? AND user_id = ? FOR UPDATE',
      [id, req.userId]
    );
    if (rows.length === 0) {
      await conn.rollback();
      return fail(res, '预约不存在', 404);
    }
    const appt = rows[0];
    if (appt.status !== '待支付') {
      await conn.rollback();
      return fail(res, '当前状态不可支付');
    }

    // 1. 插入支付记录（模拟成功）：生成唯一支付凭证号（13 位数字 + 2 位字母，随机无规律），
    //    支付成功时间 paid_at = NOW() 即此刻
    const paymentNo = await genCertificateNo(conn);
    await conn.query(
      `INSERT INTO payments (payment_no, user_id, order_no, amount, method, status, paid_at)
       VALUES (?,?,?,?,?,'成功', NOW())`,
      [paymentNo, req.userId, appt.order_no, appt.fee, method]
    );
    const paidAt = formatDateTime(new Date());

    // 2. 预约置为已支付
    await conn.query('UPDATE appointments SET status = ? WHERE id = ?', ['已支付', id]);

    // 3. 自动生成电子处方（演示取药流程）
    await createPrescription(conn, appt, id, req.userId);

    await conn.commit();
    return ok(res, {
      payment: { paymentNo, paidAt, amount: appt.fee, method, status: '成功' },
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

/**
 * 为已支付预约生成电子处方：稳定挑选 2-4 种药品（按预约 id 取模），写入 prescriptions + prescription_items
 * @param {import('mysql2/promise').Connection} conn 事务连接
 * @param {object} appt 预约行（含 doctor_id / patient_name）
 * @param {number} appointmentId 预约 ID（用于稳定选药）
 * @param {number} userId 用户 ID（处方归属人）
 */
async function createPrescription(conn, appt, appointmentId, userId) {
  const [medRows] = await conn.query('SELECT * FROM medicines ORDER BY id');
  if (medRows.length === 0) return; // 无药品则跳过处方生成

  // 按预约 id 稳定取 2~4 种药品（同预约每次一致）
  const count = 2 + (appointmentId % 3); // 2~4
  const offset = appointmentId % medRows.length;
  const picked = [];
  for (let i = 0; i < count; i++) {
    picked.push(medRows[(offset + i) % medRows.length]);
  }

  const dosages = ['每日2次，每次1片，饭后服用', '每日3次，每次2片，饭前服用', '每日1次，每次1片，睡前服用'];

  const items = picked.map((m) => {
    const quantity = 1 + ((m.id + appointmentId) % 3); // 1~3
    const total = Number((m.price * quantity).toFixed(2));
    return {
      medicineId: m.id,
      quantity,
      unitPrice: m.price,
      total,
      dosage: dosages[(m.id + appointmentId) % dosages.length],
    };
  });
  const totalAmount = Number(items.reduce((sum, it) => sum + it.total, 0).toFixed(2));

  const prescNo = genNo('PRESC');
  const [prescResult] = await conn.query(
    `INSERT INTO prescriptions
       (presc_no, appointment_id, user_id, doctor_id, patient_name, total_amount, status)
     VALUES (?,?,?,?,?,?,'待取药')`,
    [prescNo, appointmentId, userId, appt.doctor_id, appt.patient_name, totalAmount]
  );
  const prescriptionId = prescResult.insertId;

  for (const it of items) {
    await conn.query(
      `INSERT INTO prescription_items
         (prescription_id, medicine_id, quantity, unit_price, total, dosage)
       VALUES (?,?,?,?,?,?)`,
      [prescriptionId, it.medicineId, it.quantity, it.unitPrice, it.total, it.dosage]
    );
  }
}

module.exports = router;
module.exports._createPrescription = createPrescription; // 便于测试
