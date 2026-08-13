-- ================================================================
-- 医院预约系统数据库脚本 - schema.sql
-- 建库 + 建表，共 10 张表
-- 字符集：utf8mb4 / 排序规则：utf8mb4_unicode_ci
-- 适用于 Navicat Premium 17 直接导入运行（MySQL 5.7+/8.x）
-- 开头 DROP DATABASE IF EXISTS，可重复导入
-- ================================================================

DROP DATABASE IF EXISTS hospital_db;
CREATE DATABASE hospital_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_db;

-- ----------------------------------------------------------------
-- 1. users 用户表
--    说明：密码为 bcrypt 哈希，本表不在 seed 中插入数据，
--    由后端启动时通过 bcrypt 生成演示账号。
-- ----------------------------------------------------------------
CREATE TABLE users (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    username    VARCHAR(50)     NOT NULL                COMMENT '用户名',
    password    VARCHAR(255)    NOT NULL                COMMENT '密码(bcrypt哈希)',
    real_name   VARCHAR(50)     NOT NULL                COMMENT '真实姓名',
    gender      ENUM('男','女') NOT NULL DEFAULT '男'   COMMENT '性别',
    phone       VARCHAR(20)     NOT NULL                COMMENT '手机号',
    id_card     VARCHAR(18)     DEFAULT NULL            COMMENT '身份证号(可空)',
    birth_date  DATE            DEFAULT NULL            COMMENT '出生日期(可空)',
    avatar      MEDIUMTEXT                              COMMENT '头像URL或dataURL(可空)',
    role        ENUM('user','admin') NOT NULL DEFAULT 'user' COMMENT '角色：user-患者 admin-管理员',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_username (username),
    UNIQUE KEY uk_users_phone (phone),
    UNIQUE KEY uk_users_id_card (id_card)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ----------------------------------------------------------------
-- 2. departments 科室表
-- ----------------------------------------------------------------
CREATE TABLE departments (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    name        VARCHAR(50)     NOT NULL                COMMENT '科室名称',
    code        VARCHAR(20)     NOT NULL                COMMENT '科室编码(拼音首字母+编号)',
    description VARCHAR(500)    DEFAULT NULL            COMMENT '科室简介',
    location    VARCHAR(100)    DEFAULT NULL            COMMENT '楼层位置',
    icon        VARCHAR(50)     DEFAULT NULL            COMMENT '图标名',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_departments_name (name),
    UNIQUE KEY uk_departments_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='科室表';

-- ----------------------------------------------------------------
-- 3. doctors 医生表
-- ----------------------------------------------------------------
CREATE TABLE doctors (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    department_id    BIGINT UNSIGNED NOT NULL                COMMENT '所属科室ID',
    name             VARCHAR(50)     NOT NULL                COMMENT '姓名',
    gender           ENUM('男','女') NOT NULL DEFAULT '男'   COMMENT '性别',
    title            VARCHAR(30)     NOT NULL                COMMENT '职称(主任医师/副主任医师/主治医师/住院医师)',
    specialty        VARCHAR(500)    DEFAULT NULL            COMMENT '擅长',
    introduction     TEXT                                    COMMENT '简介',
    avatar           VARCHAR(255)    DEFAULT NULL            COMMENT '头像URL',
    reg_fee          DECIMAL(6,2)    NOT NULL DEFAULT 0.00   COMMENT '挂号费(元)',
    years_experience INT             NOT NULL DEFAULT 0      COMMENT '从业年限',
    created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_doctors_department (department_id),
    CONSTRAINT fk_doctors_department FOREIGN KEY (department_id) REFERENCES departments (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='医生表';

-- ----------------------------------------------------------------
-- 4. schedules 排班表
-- ----------------------------------------------------------------
CREATE TABLE schedules (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    doctor_id       BIGINT UNSIGNED NOT NULL                COMMENT '医生ID',
    work_date       DATE            NOT NULL                COMMENT '出诊日期',
    period          ENUM('上午','下午') NOT NULL            COMMENT '出诊时段',
    total_slots     INT             NOT NULL DEFAULT 20     COMMENT '总号源数',
    remaining_slots INT             NOT NULL DEFAULT 20     COMMENT '剩余号源数',
    PRIMARY KEY (id),
    UNIQUE KEY uk_schedules_doctor_date_period (doctor_id, work_date, period),
    CONSTRAINT fk_schedules_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='排班表';

-- ----------------------------------------------------------------
-- 5. appointments 挂号表
-- ----------------------------------------------------------------
CREATE TABLE appointments (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    order_no     VARCHAR(50)     NOT NULL                COMMENT '订单号(GH+时间戳)',
    user_id      BIGINT UNSIGNED NOT NULL                COMMENT '用户ID',
    doctor_id    BIGINT UNSIGNED NOT NULL                COMMENT '医生ID',
    schedule_id  BIGINT UNSIGNED NOT NULL                COMMENT '排班ID',
    appoint_date DATE            NOT NULL                COMMENT '就诊日期',
    period       ENUM('上午','下午') NOT NULL            COMMENT '就诊时段',
    fee          DECIMAL(6,2)    NOT NULL DEFAULT 0.00   COMMENT '挂号费(元)',
    status       ENUM('待支付','已支付','待就诊','已完成','已取消') NOT NULL DEFAULT '待支付' COMMENT '状态',
    queue_no     INT             DEFAULT NULL            COMMENT '排队号',
    patient_name VARCHAR(50)     NOT NULL                COMMENT '就诊人姓名',
    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_appointments_order_no (order_no),
    KEY idx_appointments_user (user_id),
    KEY idx_appointments_doctor (doctor_id),
    KEY idx_appointments_schedule (schedule_id),
    CONSTRAINT fk_appointments_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id),
    CONSTRAINT fk_appointments_schedule FOREIGN KEY (schedule_id) REFERENCES schedules (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='挂号表';

-- ----------------------------------------------------------------
-- 6. medicines 药品表
-- ----------------------------------------------------------------
CREATE TABLE medicines (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    code         VARCHAR(30)     NOT NULL                COMMENT '药品编码',
    name         VARCHAR(100)    NOT NULL                COMMENT '药品名称',
    generic_name VARCHAR(100)    DEFAULT NULL            COMMENT '通用名',
    specification VARCHAR(100)   DEFAULT NULL            COMMENT '规格',
    unit         VARCHAR(20)     NOT NULL DEFAULT '盒'   COMMENT '单位(盒/瓶/袋/支)',
    price        DECIMAL(8,2)    NOT NULL DEFAULT 0.00   COMMENT '单价(元)',
    manufacturer VARCHAR(100)    DEFAULT NULL            COMMENT '生产厂家',
    category     VARCHAR(20)     NOT NULL DEFAULT '西药' COMMENT '分类(西药/中成药/外用药等)',
    stock        INT             NOT NULL DEFAULT 0      COMMENT '库存数量',
    description  VARCHAR(500)    DEFAULT NULL            COMMENT '用途说明',
    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_medicines_code (code),
    UNIQUE KEY uk_medicines_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='药品表';

-- ----------------------------------------------------------------
-- 7. prescriptions 处方表
-- ----------------------------------------------------------------
CREATE TABLE prescriptions (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    presc_no       VARCHAR(50)     NOT NULL                COMMENT '处方编号',
    appointment_id BIGINT UNSIGNED DEFAULT NULL            COMMENT '关联挂号ID(可空)',
    user_id        BIGINT UNSIGNED NOT NULL                COMMENT '用户ID',
    doctor_id      BIGINT UNSIGNED NOT NULL                COMMENT '医生ID',
    patient_name   VARCHAR(50)     NOT NULL                COMMENT '患者姓名',
    total_amount   DECIMAL(8,2)    NOT NULL DEFAULT 0.00   COMMENT '总金额(元)',
    status         ENUM('待取药','已取药','已取消') NOT NULL DEFAULT '待取药' COMMENT '状态',
    created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_prescriptions_presc_no (presc_no),
    KEY idx_prescriptions_user (user_id),
    KEY idx_prescriptions_doctor (doctor_id),
    KEY idx_prescriptions_appointment (appointment_id),
    CONSTRAINT fk_prescriptions_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_prescriptions_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id),
    CONSTRAINT fk_prescriptions_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='处方表';

-- ----------------------------------------------------------------
-- 8. prescription_items 处方明细表
-- ----------------------------------------------------------------
CREATE TABLE prescription_items (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    prescription_id BIGINT UNSIGNED NOT NULL                COMMENT '处方ID',
    medicine_id     BIGINT UNSIGNED NOT NULL                COMMENT '药品ID',
    quantity        INT             NOT NULL DEFAULT 1      COMMENT '数量',
    unit_price      DECIMAL(8,2)    NOT NULL DEFAULT 0.00   COMMENT '单价(元)',
    total           DECIMAL(8,2)    NOT NULL DEFAULT 0.00   COMMENT '小计(元)',
    dosage          VARCHAR(255)    DEFAULT NULL            COMMENT '用法用量',
    PRIMARY KEY (id),
    KEY idx_presc_items_prescription (prescription_id),
    KEY idx_presc_items_medicine (medicine_id),
    CONSTRAINT fk_presc_items_presc FOREIGN KEY (prescription_id) REFERENCES prescriptions (id) ON DELETE CASCADE,
    CONSTRAINT fk_presc_items_medicine FOREIGN KEY (medicine_id) REFERENCES medicines (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='处方明细表';

-- ----------------------------------------------------------------
-- 9. payments 支付记录表
-- ----------------------------------------------------------------
CREATE TABLE payments (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    payment_no VARCHAR(50)     NOT NULL                COMMENT '支付流水号',
    user_id    BIGINT UNSIGNED NOT NULL                COMMENT '用户ID',
    order_no   VARCHAR(50)     NOT NULL                COMMENT '关联订单号(挂号单/处方单)',
    amount     DECIMAL(8,2)    NOT NULL DEFAULT 0.00   COMMENT '支付金额(元)',
    method     ENUM('微信支付','支付宝','医保支付') NOT NULL DEFAULT '微信支付' COMMENT '支付方式',
    status     ENUM('成功','失败') NOT NULL DEFAULT '成功' COMMENT '支付状态',
    paid_at    DATETIME        DEFAULT NULL            COMMENT '支付时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_payments_payment_no (payment_no),
    KEY idx_payments_user (user_id),
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录表';

-- ----------------------------------------------------------------
-- 10. hospital_profile 医院简介表（单行，id 固定为 1）
-- ----------------------------------------------------------------
CREATE TABLE hospital_profile (
    id         TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '主键(固定为1)',
    name       VARCHAR(100)     NOT NULL           COMMENT '医院名称',
    level      VARCHAR(30)      DEFAULT NULL       COMMENT '医院等级',
    address    VARCHAR(200)     DEFAULT NULL       COMMENT '医院地址',
    phone      VARCHAR(30)      DEFAULT NULL       COMMENT '联系电话',
    intro      TEXT                                 COMMENT '医院简介',
    open_hours VARCHAR(200)     DEFAULT NULL       COMMENT '门诊时间',
    logo_url   VARCHAR(255)     DEFAULT NULL       COMMENT 'Logo地址',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='医院简介表';
