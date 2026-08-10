-- ================================================================
-- 刷新排班脚本（解决种子数据日期过期问题）
-- 用法：任何时候排班过期/约满后，在 Navicat 中重新运行本脚本，
-- 即可为所有医生生成从今天起连续 7 天的全新排班。
-- ================================================================

USE hospital_db;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE schedules;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO schedules (doctor_id, work_date, period, total_slots, remaining_slots)
SELECT d.id,
       c.work_date,
       c.period,
       20 AS total_slots,
       20 - ((d.id + c.day_num * 2 + c.period_num * 3) % 13) AS remaining_slots
FROM doctors d
CROSS JOIN (
    SELECT CURDATE() AS work_date, 1 AS day_num, '上午' AS period, 1 AS period_num
    UNION ALL SELECT CURDATE(), 1, '下午', 2
    UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 1 DAY), 2, '上午', 1
    UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 1 DAY), 2, '下午', 2
    UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 2 DAY), 3, '上午', 1
    UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 2 DAY), 3, '下午', 2
    UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 3 DAY), 4, '上午', 1
    UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 3 DAY), 4, '下午', 2
    UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 4 DAY), 5, '上午', 1
    UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 4 DAY), 5, '下午', 2
    UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 5 DAY), 6, '上午', 1
    UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 5 DAY), 6, '下午', 2
    UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 6 DAY), 7, '上午', 1
    UNION ALL SELECT DATE_ADD(CURDATE(), INTERVAL 6 DAY), 7, '下午', 2
) c
WHERE (d.id + c.day_num) % 3 <> 0 OR c.period_num = 1;
