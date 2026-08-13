// 启动时自动执行的轻量迁移（均幂等，重复启动不重复执行）。
// 现状：改到表结构时同步手动执行 schema.sql 即可，这里只兜底最必要的一处。
const { pool } = require('../config/db');

/**
 * appointments.status ENUM 增加「待就诊」（就诊闭环：已支付 → 待就诊 → 已完成）
 * 检测 information_schema 中当前 ENUM 是否含「待就诊」，缺则 ALTER。
 */
async function ensureStatusEnum() {
  const [rows] = await pool.query(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND COLUMN_NAME = 'status'`
  );
  if (rows.length === 0) return; // 表尚未创建
  if ((rows[0].COLUMN_TYPE || '').includes('待就诊')) return; // 已迁移过

  await pool.query(
    `ALTER TABLE appointments
       MODIFY COLUMN status ENUM('待支付','已支付','待就诊','已完成','已取消')
       NOT NULL DEFAULT '待支付'`
  );
  console.log('[迁移] appointments.status 已增加「待就诊」状态');
}

/**
 * users 表增加 role 列（user/admin），管理后台用；缺则 ALTER。
 */
async function ensureRoleColumn() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'`
  );
  if (rows.length === 0 || Number(rows[0].cnt) > 0) return; // 表未创建或已存在

  await pool.query(
    `ALTER TABLE users
       ADD COLUMN role ENUM('user','admin') NOT NULL DEFAULT 'user' COMMENT '角色' AFTER avatar`
  );
  console.log('[迁移] users 表已增加 role 字段');
}

/**
 * users.avatar 从 VARCHAR(255) 扩为 MEDIUMTEXT：
 * 本地上传头像以 base64 data URL 存库（一张压缩后图片约几万字符，255 放不下），
 * 原 URL 型头像（如医生头像、无头像空值）不受影响。
 */
async function ensureAvatarLongtext() {
  const [rows] = await pool.query(
    `SELECT DATA_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'avatar'`
  );
  if (rows.length === 0) return; // 表尚未创建
  const type = rows[0].DATA_TYPE;
  if (type === 'text' || type === 'mediumtext' || type === 'longtext') return; // 已是文本类型
  await pool.query(
    `ALTER TABLE users MODIFY avatar MEDIUMTEXT COMMENT '头像URL或dataURL(可空)'`
  );
  console.log('[迁移] users.avatar 已扩为 MEDIUMTEXT（支持本地上传头像）');
}

module.exports = { ensureStatusEnum, ensureRoleColumn, ensureAvatarLongtext };
