// 医院预约系统 - Express 服务入口
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { ok, fail } = require('./utils/response');
const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');
const doctorRoutes = require('./routes/doctors');
const scheduleRoutes = require('./routes/schedules');
const appointmentRoutes = require('./routes/appointments');
const medicineRoutes = require('./routes/medicines');
const prescriptionRoutes = require('./routes/prescriptions');
const hospitalRoutes = require('./routes/hospital');
const adminRoutes = require('./routes/admin');
const { seedDemoUsers, seedAdmin } = require('./routes/auth');
const { ensureStatusEnum, ensureRoleColumn, ensureAvatarLongtext } = require('./utils/migrate');
const { ensureSchedules } = require('./utils/scheduleGenerator');

const app = express();

app.use(cors());
// 上传头像为 base64 data URL，放宽 JSON 体积（前端已压缩，单张约几十 KB）
app.use(express.json({ limit: '2mb' }));

// 统一前缀 /api 挂载各业务路由
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/doctors', scheduleRoutes); // GET /api/doctors/:doctorId/schedules
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/admin', adminRoutes);

// 404
app.use((req, res) => {
  return fail(res, '接口不存在', 404);
});

// 全局错误处理中间件
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[全局错误]', err);
  return fail(res, '服务器内部错误', 500);
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, async () => {
  console.log(`医院预约系统后端已启动: http://localhost:${PORT}`);
  // 启动时若 users 表为空则创建演示账号
  try {
    await seedDemoUsers();
  } catch (err) {
    console.error('初始化演示账号失败（请确认数据库已导入 schema 且 .env 配置正确）:', err.message);
  }
  // 状态字段迁移：appointments.status 增加「待就诊」（幂等，重复启动不重复执行）
  try {
    await ensureStatusEnum();
  } catch (err) {
    console.error('[迁移] appointments.status 执行失败:', err.message);
  }
  // 角色字段迁移：users 增加 role（幂等）
  try {
    await ensureRoleColumn();
  } catch (err) {
    console.error('[迁移] users.role 执行失败:', err.message);
  }
  // 头像字段迁移：users.avatar 扩为 MEDIUMTEXT，容纳 base64 data URL（幂等）
  try {
    await ensureAvatarLongtext();
  } catch (err) {
    console.error('[迁移] users.avatar 扩列执行失败:', err.message);
  }
  // 缺管理员账号则补建 admin / admin123（依赖 role 字段已就位）
  try {
    await seedAdmin();
  } catch (err) {
    console.error('[初始化] 管理员账号创建失败:', err.message);
  }
  // 自动补未来 7 天排班（幂等，缺哪补哪），解决种子排班过期后无号可挂的问题
  try {
    const added = await ensureSchedules();
    if (added > 0) console.log(`[排班] 已自动补齐 ${added} 条排班`);
    else console.log('[排班] 未来 7 天排班完整，无需补充');
  } catch (err) {
    console.error('[排班] 自动生成失败:', err.message);
  }
});
