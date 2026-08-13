// 排班自动生成：复用 database/refresh_schedules.sql 的排班规则，
// 但只"补缺"不重建——已存在（且可能已被挂号占用）的排班原样保留，保证幂等。
const { pool } = require('../config/db');

const TOTAL_SLOTS = 20;
const DAYS = 7; // 未来 7 天

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 生成"今天起未来 7 天"的排班（缺哪补哪，幂等；重复调用不会重复插，也不重置已占用号源）。
 *
 * 规则与 refresh_schedules.sql 一致：
 *   - 每位医生每天上午必出诊；下午按 (doctor_id + 天数) % 3 轮换（整除则下午休息）；
 *   - remaining_slots = 20 - ((doctor_id + 天数*2 + 时段序号*3) % 13)
 *
 * @returns {Promise<number>} 本次补插的排班条数（无缺失返回 0）
 */
async function ensureSchedules() {
  const [doctors] = await pool.query('SELECT id FROM doctors');
  if (doctors.length === 0) return 0;

  // 计算未来 7 天期望的排班集合
  const wanted = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let dayNum = 1; dayNum <= DAYS; dayNum++) {
    const workDate = formatDate(new Date(today.getTime() + (dayNum - 1) * 86400000));
    for (const doc of doctors) {
      for (const [period, periodNum] of [['上午', 1], ['下午', 2]]) {
        // 与 refresh_schedules.sql 的 WHERE 条件一致：上午必出，下午轮换
        if ((doc.id + dayNum) % 3 === 0 && periodNum !== 1) continue;
        wanted.push([
          doc.id,
          workDate,
          period,
          20 - ((doc.id + dayNum * 2 + periodNum * 3) % 13),
        ]);
      }
    }
  }

  // 已存在的组合（未来 7 天内）原样保留，只补缺失的
  const [existingRows] = await pool.query(
    `SELECT doctor_id, work_date, period FROM schedules
     WHERE work_date BETWEEN ? AND ?`,
    [wanted[0][1], wanted[wanted.length - 1][1]]
  );
  const existing = new Set(existingRows.map((r) => `${r.doctor_id}|${r.work_date}|${r.period}`));

  const missing = wanted.filter((row) => !existing.has(`${row[0]}|${row[1]}|${row[2]}`));
  if (missing.length === 0) return 0;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const [doctorId, workDate, period, remaining] of missing) {
      await conn.query(
        'INSERT INTO schedules (doctor_id, work_date, period, total_slots, remaining_slots) VALUES (?,?,?,?,?)',
        [doctorId, workDate, period, TOTAL_SLOTS, remaining]
      );
    }
    await conn.commit();
    return missing.length;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { ensureSchedules };
