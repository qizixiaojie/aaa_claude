# 医院预约系统 - 数据库设计说明

本目录包含医院预约系统（hospital_db）的建库建表脚本与种子数据，可直接用 **Navicat Premium 17** 导入运行。

## 一、文件清单

| 文件 | 说明 |
| ---- | ---- |
| `schema.sql` | 建库建表脚本（开头 `DROP DATABASE IF EXISTS hospital_db`，可重复导入） |
| `seed_data.sql` | 种子数据（科室、医生、排班、药品、医院简介），可重复执行 |
| `README.md` | 本说明文件 |

- 数据库名：`hospital_db`
- 字符集：`utf8mb4`，排序规则：`utf8mb4_unicode_ci`（完整支持中文与 emoji）
- 适用 MySQL 版本：5.7 / 8.x

## 二、表结构清单（共 10 张表）

| 序号 | 表名 | 中文名 | 关键字段 / 约束 |
| ---- | ---- | ------ | ---------------- |
| 1 | `users` | 用户表 | username 唯一、phone 唯一、id_card 唯一（可空）、password 存 bcrypt 哈希 |
| 2 | `departments` | 科室表 | name 唯一、code 唯一（拼音首字母+编号） |
| 3 | `doctors` | 医生表 | department_id 外键→departments，reg_fee DECIMAL(6,2) 挂号费 |
| 4 | `schedules` | 排班表 | doctor_id 外键→doctors，UNIQUE(doctor_id, work_date, period)，total_slots/remaining_slots |
| 5 | `appointments` | 挂号表 | order_no 唯一（GH+时间戳），user_id/doctor_id/schedule_id 外键，状态 待支付/已支付/已完成/已取消 |
| 6 | `medicines` | 药品表 | code 唯一、name 唯一，分类 西药/中成药/外用药 |
| 7 | `prescriptions` | 处方表 | presc_no 唯一，appointment_id 外键（可空），状态 待取药/已取药/已取消 |
| 8 | `prescription_items` | 处方明细表 | prescription_id 外键（`ON DELETE CASCADE`），medicine_id 外键 |
| 9 | `payments` | 支付记录表 | payment_no 唯一，支付方式 微信支付/支付宝/医保支付 |
| 10 | `hospital_profile` | 医院简介表 | 单行数据，id 固定为 1 |

### 字段命名与约束约定

- 所有字段使用 `snake_case` 命名，主键统一为自增 `id`（BIGINT UNSIGNED）。
- 常用外键均建立索引（`idx_*`），并设置具名外键约束（`fk_*`）。
- 表与字段均带 `COMMENT` 注释，在 Navicat 中可直观查看中文说明。
- 枚举字段（gender、period、status、method 等）使用 MySQL `ENUM` 约束取值。
- 药品 `unit` 单位支持 盒/瓶/袋/支（VARCHAR），`category` 分类为 西药/中成药/外用药。

## 三、种子数据规模

- 医院简介：1 条（仁爱综合医院，三级甲等）
- 科室：10 个（心血管内科、呼吸内科、消化内科、神经内科、骨科、儿科、妇产科、眼科、皮肤科、中医科）
- 医生：20 名（每科室 2 名，主任医师 7 / 副主任医师 6 / 主治医师 4 / 住院医师 1，挂号费 10-60 元）
- 排班：2026-08-11 至 2026-08-17 连续 7 天，每位医生每天 1-2 个时段，总号源 20，剩余 8-20 不等
- 药品：24 种（西药 10 / 中成药 8 / 外用药 6，单价 3.50-168.00 元，库存 50-2000）

> 所有种子数据的 name / code 均不重复；脚本开头会 `TRUNCATE` 清理旧数据，可重复导入不报唯一键冲突。

## 四、Navicat Premium 17 导入步骤

1. **新建连接**：打开 Navicat，点击左上角「连接」→「MySQL」。
   填写：连接名（如 `hospital_db`）、主机 `localhost`、端口 `3306`、用户名 `root`、密码（你的 MySQL 密码）。
   点击「测试连接」成功后点「确定」，完成连接创建。
2. **运行 schema.sql（建库建表）**：
   - 在左侧连接上**双击**进入连接；
   - 菜单栏点击「查询」→「新建查询」（或使用快捷键 `Ctrl+Q`），打开查询编辑器；
   - 将 `database/schema.sql` 的**全部内容**粘贴到编辑器（或点击编辑器工具栏「加载 SQL 文件」图标选择该文件）；
   - 点击「运行」（或按 `F6` / 工具栏 ▶ 按钮）执行。
   - 执行后左侧列表中应出现 `hospital_db` 数据库，展开可见 10 张表。
3. **运行 seed_data.sql（种子数据）**：
   - 同样新建一个查询，加载/粘贴 `database/seed_data.sql` 全部内容并运行；
   - 运行完毕后，在 `hospital_db` 中执行一条校验 SQL：
     ```sql
     SELECT
       (SELECT COUNT(*) FROM departments) AS 科室数,
       (SELECT COUNT(*) FROM doctors)     AS 医生数,
       (SELECT COUNT(*) FROM schedules)   AS 排班数,
       (SELECT COUNT(*) FROM medicines)   AS 药品数;
     ```
   - 预期结果：科室数 10、医生数 20、排班数约 230、药品数 24。
4. **后续开发**：后端（`../backend`）通过 mysql2 连接 `hospital_db`，导入 `hospital_db` 后即可启动联调。

> 提示：如果运行 schema.sql 时提示权限不足（DROP/CREATE DATABASE 需要权限），请使用具有 DDL 权限的账号，或在「连接属性-高级」中确认已勾选允许执行多语句。排班表的 UNIQUE(doctor_id, work_date, period) 用于保证同一医生同一天同一时段不重复出诊。

## 五、演示账号说明

`users` 表**不**在本目录种子数据中插入任何记录，演示账号由**后端启动时**自动生成：

- 后端位于项目根目录 `backend/`（Node.js + Express + mysql2 + bcryptjs）；
- 后端服务启动后会使用 `bcrypt` 生成密码哈希并写入 `users` 表（用户名/密码等默认值见后端配置，一般如 `admin / admin123` 之类）；
- 因此导入顺序为：先运行本目录的 `schema.sql` → `seed_data.sql`，再启动 `backend`，后端会自动创建演示账号。

> 挂号（appointments）、处方（prescriptions）、支付（payments）等业务数据同样由后端运行时产生，无需手工录入。
