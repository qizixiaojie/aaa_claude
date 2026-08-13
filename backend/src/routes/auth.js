// 认证模块：注册 / 登录 / 当前用户信息，以及启动时的演示账号种子
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, execute } = require('../config/db');
const { ok, fail } = require('../utils/response');
const auth = require('../middleware/auth');

const router = express.Router();

// 演示账号（密码均为 123456，bcrypt 哈希由 seedDemoUsers 生成）
const DEMO_USERS = [
  { username: '13800000001', password: '123456', realName: '王小明', gender: '男', phone: '13800000001' },
  { username: '13800000002', password: '123456', realName: '李丽丽', gender: '女', phone: '13800000002' },
];

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// 身份证号脱敏：保留前4后4
function maskIdCard(idCard) {
  if (!idCard) return null;
  return idCard.replace(/^(.{4}).*(.{4})$/, '$1****$2');
}

// POST /api/auth/register  body{username,password,realName,phone,gender}
router.post('/register', async (req, res) => {
  const { username, password, realName, phone, gender = '男' } = req.body || {};
  if (!username || !password || !realName || !phone) {
    return fail(res, '用户名、密码、姓名、手机号不能为空');
  }
  // 唯一性校验（用户名 / 手机号）
  const byUsername = await query('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
  if (byUsername.length > 0) return fail(res, '用户名已存在');
  const byPhone = await query('SELECT id FROM users WHERE phone = ? LIMIT 1', [phone]);
  if (byPhone.length > 0) return fail(res, '手机号已注册');

  const hash = await bcrypt.hash(password, 10);
  const result = await execute(
    'INSERT INTO users (username, password, real_name, gender, phone) VALUES (?,?,?,?,?)',
    [username, hash, realName, gender, phone]
  );
  const user = {
    id: result.insertId,
    username,
    realName,
    gender,
    phone,
    idCard: null,
    avatar: null,
    role: 'user',
  };
  return ok(res, { token: signToken(result.insertId), user });
});

// POST /api/auth/login  body{username,password}
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return fail(res, '用户名和密码不能为空');
  }
  const users = await query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
  if (users.length === 0) return fail(res, '用户名或密码错误', 401);
  const row = users[0];
  const matched = await bcrypt.compare(password, row.password);
  if (!matched) return fail(res, '用户名或密码错误', 401);

  const user = {
    id: row.id,
    realName: row.real_name,
    phone: row.phone,
    gender: row.gender,
    idCard: row.id_card,
    avatar: row.avatar,
    role: row.role || 'user',
  };
  return ok(res, { token: signToken(row.id), user });
});

// GET /api/auth/me  需登录
router.get('/me', auth, async (req, res) => {
  const users = await query(
    `SELECT id, username,
            real_name AS realName,
            phone,
            gender,
            id_card AS idCard,
            avatar,
            role,
            DATE_FORMAT(birth_date, '%Y-%m-%d') AS birthDate
     FROM users WHERE id = ? LIMIT 1`,
    [req.userId]
  );
  if (users.length === 0) return fail(res, '用户不存在', 404);
  users[0].idCard = maskIdCard(users[0].idCard);
  return ok(res, { user: users[0] });
});

// PUT /api/auth/avatar  body{ avatar: "data:image/jpeg;base64,..." | null }
// 本地上传头像：前端已用 canvas 压缩为 base64 data URL，直接存库（users.avatar 为 MEDIUMTEXT）。
// avatar 传 null 表示移除头像。
router.put('/avatar', auth, async (req, res) => {
  const { avatar } = req.body || {};

  // 移除头像
  if (avatar === null || avatar === '') {
    await execute('UPDATE users SET avatar = NULL WHERE id = ?', [req.userId]);
    return ok(res, { avatar: null });
  }

  // 校验：必须是图片 data URL（image/png|jpeg|jpg|webp|gif）
  if (typeof avatar !== 'string' || !/^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(avatar)) {
    return fail(res, '头像格式不正确，请选择图片文件');
  }
  // 解码后体积上限约 512KB，防止超大图片刷爆数据库
  const base64Part = avatar.split(',')[1] || '';
  const byteLen = Math.floor((base64Part.length * 3) / 4);
  if (byteLen > 512 * 1024) return fail(res, '图片过大，请选择更小的图片');

  await execute('UPDATE users SET avatar = ? WHERE id = ?', [avatar, req.userId]);
  return ok(res, { avatar });
});

/**
 * 启动时调用：若 users 表为空，创建演示账号并打印到控制台
 */
async function seedDemoUsers() {
  const rows = await query('SELECT COUNT(*) AS cnt FROM users');
  if (Number(rows[0].cnt) > 0) return;

  for (const u of DEMO_USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    await execute(
      'INSERT INTO users (username, password, real_name, gender, phone) VALUES (?,?,?,?,?)',
      [u.username, hash, u.realName, u.gender, u.phone]
    );
  }
  console.log('------------------------------------------------');
  console.log('已自动创建演示账号（密码均为 123456）：');
  console.log('  13800000001 / 123456 / 王小明（男）');
  console.log('  13800000002 / 123456 / 李丽丽（女）');
  console.log('------------------------------------------------');
}

/**
 * 启动时调用：确保存在管理员账号（admin / admin123）。
 * 兼容旧数据：
 *   - 已有 role='admin' 的账号 → 不动；
 *   - 存在同名 admin 账号但 role='user'（role 字段是后加的，旧账号默认 user）→ 提升为管理员，
 *     避免 INSERT 撞 username 唯一键失败；
 *   - 都没有 → 新建管理员。
 */
async function seedAdmin() {
  const admins = await query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
  if (admins.length > 0) return; // 已有管理员

  const hash = await bcrypt.hash('admin123', 10);
  const byName = await query(`SELECT id FROM users WHERE username = 'admin' LIMIT 1`);
  if (byName.length > 0) {
    await execute(`UPDATE users SET role = 'admin' WHERE id = ?`, [byName[0].id]);
    console.log('已将既有账号 admin 提升为管理员（密码不变：admin123）');
    return;
  }

  await execute(
    `INSERT INTO users (username, password, real_name, gender, phone, role) VALUES (?,?,?,?,?,?)`,
    ['admin', hash, '系统管理员', '男', '13800000000', 'admin']
  );
  console.log('已创建管理员账号：admin / admin123');
}

module.exports = router;
module.exports.seedDemoUsers = seedDemoUsers;
module.exports.seedAdmin = seedAdmin;
