# 🏥 仁爱医院 · 预约挂号系统（全栈）

一个与市面上预约小程序无差别的医院预约系统：**登录注册、科室导航、医生介绍/职位、按科室挂号、排班预约、模拟支付、电子处方取药、药品价格查询、个人中心**。

| 层次 | 技术 | 目录 |
|------|------|------|
| 前端 | Vue 3 + Vite 8 + **Element Plus** + Vue Router + Pinia | `vue-app/` |
| 后端 | Node.js + Express + JWT + mysql2 | `backend/` |
| 数据库 | MySQL 8（Navicat Premium 17 可直接连接） | `database/` |
| 部署 | Docker Compose 一键启动三服务 | `docker-compose.yml` |

---

## 一、数据库（最重要，先做）

> 你的电脑上**还没有安装 MySQL**。二选一：

### 方式 A：用 Docker 起 MySQL（推荐，一行命令）
```bash
docker run -d --name hospital-mysql \
  -e MYSQL_ROOT_PASSWORD=root123456 \
  -e MYSQL_DATABASE=hospital_db \
  -p 3306:3306 \
  -v mysql-data:/var/lib/mysql \
  mysql:8.0
```
然后用 **Navicat Premium 17** 连接：`localhost:3306`，用户 `root`，密码 `root123456`。

### 方式 B：已有自己的 MySQL
直接连接，然后导入脚本：
1. 用 Navicat 新建连接（填你的 MySQL 地址/账号/密码）
2. 打开连接 → 新建查询 → 依次运行：
   - `database/schema.sql`（建库建表）
   - `database/seed_data.sql`（导入 10 科室 / 20 医生 / 24 药品 / 医院信息）
3. **可选**：`database/refresh_schedules.sql`（排班过期时刷新为当前日期，7 天有效）

> 📌 数据库密码是 `root123456`（如果你用方式 B 且密码不同，改 `backend/.env` 即可）。

---

## 二、启动后端 API

```bash
cd backend
npm install            # 已装过可跳过
# 编辑 .env，把 DB_PASSWORD 改成你的 MySQL 密码（默认 root123456 已填）
npm run dev            # 开发模式（nodemon 热重载）或 npm start
```
启动成功日志（含自动创建的演示账号）：
```
医院预约系统后端已启动: http://localhost:3000
已自动创建演示账号（密码均为 123456）：
  13800000001 / 123456 / 王小明（男）
  13800000002 / 123456 / 李丽丽（女）
```

---

## 三、启动前端

```bash
cd vue-app
npm install            # 已装过可跳过
npm run dev            # 开发模式 → http://localhost:5173
```
浏览器打开 **http://localhost:5173**，用演示账号登录即可完整体验流程：
> 首页 → 科室/医生 → 医生详情选排班 → 挂号 → 模拟支付（微信/支付宝/医保）→ 我的预约 → 查看处方 → 模拟取药

---

## 四、Docker 一键部署（服务器上线）

```bash
docker compose up -d --build
```
| 服务 | 地址 |
|------|------|
| 前端 | http://服务器IP:8080 |
| 后端 API | http://服务器IP:3000/api |
| MySQL | 3306 端口（Navicat 可连，root/root123456） |

更新代码后重新部署：`docker compose up -d --build`

---

## 五、接口清单（前端已对接）

| 模块 | 接口 |
|------|------|
| 认证 | POST `/api/auth/register` · `/login` · GET `/api/auth/me` |
| 科室 | GET `/api/departments` · `/api/departments/:id` |
| 医生 | GET `/api/doctors?departmentId=&keyword=` · `/api/doctors/:id` |
| 排班 | GET `/api/doctors/:id/schedules?days=7` |
| 挂号 | POST `/api/appointments` · GET `/api/appointments/my` · POST `/:id/cancel` · POST `/:id/pay` |
| 药品 | GET `/api/medicines?keyword=&category=` · `/api/medicines/:id` |
| 处方 | GET `/api/prescriptions/my` · `/api/prescriptions/:id` · POST `/:id/pickup` |
| 医院 | GET `/api/hospital/profile` |

> 支付为**模拟支付**：不真实扣款；支付成功后后端自动生成该预约的电子处方（2~4 种药品），便于演示取药流程。

---

## 六、说明

- 前端采用移动端小程序风格（底部 TabBar、卡片式布局），PC 浏览器按 F12 切换到手机模式体验最佳。
- 组件复用：`DoctorCard` / `DepartmentCard` / `SectionTitle` / `StatusTag` / `EmptyState` / `PubPaymentDialog`（多处复用）。
- 路由：嵌套布局 + 命名路由 + 动态参数 + 编程式跳转 + 登录守卫。
