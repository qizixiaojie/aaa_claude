// 排班模块：GET /api/doctors/:doctorId/schedules?days=7
// 返回从今天起 N 天、尚未过期且有余号的排班
const express = require('express');
const { query } = require('../config/db');
const { ok } = require('../utils/response');

const router = express.Router();

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// GET /api/doctors/:doctorId/schedules?days=7
router.get('/:doctorId/schedules', async (req, res) => {
  const doctorId = Number(req.params.doctorId);
  const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 30);

  // 从今天(含)起 N 天的日期，用本地时间生成避免时区偏移
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(formatDate(d));
  }

  const placeholders = dates.map(() => '?').join(',');
  const rows = await query(`
    SELECT id,
           DATE_FORMAT(work_date, '%Y-%m-%d') AS workDate,
           period,
           total_slots AS totalSlots,
           remaining_slots AS remainingSlots
    FROM schedules
    WHERE doctor_id = ? AND work_date IN (${placeholders}) AND remaining_slots > 0
    ORDER BY work_date, FIELD(period, '上午', '下午')
  `, [doctorId, ...dates]);

  return ok(res, rows);
});

module.exports = router;
