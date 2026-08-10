#!/usr/bin/env bash
# =============================================================
# 医院预约系统 · 服务器一键部署脚本
# 适用：原生 MySQL（已装好运行在 3306）+ Docker 跑后端/前端
# 用法：在项目根目录执行  bash deploy-server.sh
# =============================================================
set -e

# 0. 检查 docker compose 插件
if ! docker compose version >/dev/null 2>&1; then
  echo "❌ 缺少 docker compose 插件，先安装：yum install -y docker-compose-plugin"
  exit 1
fi

echo "===== 1/5 创建 MySQL 远程用户 hospital ====="
read -sp "请输入 MySQL root 密码（刚安装 MySQL 时设置的）: " MYSQL_ROOT_PW
echo
mysql -uroot -p"$MYSQL_ROOT_PW" -e "CREATE USER IF NOT EXISTS 'hospital'@'%' IDENTIFIED BY 'hospital123456'; GRANT ALL PRIVILEGES ON *.* TO 'hospital'@'%' WITH GRANT OPTION; FLUSH PRIVILEGES;"
echo "✅ 用户 hospital / hospital123456 已创建（供后端和 Navicat 使用）"

echo "===== 2/5 导入数据库（建库建表 + 种子数据 + 刷新排班）====="
mysql -uhospital -phospital123456 < database/schema.sql
mysql -uhospital -phospital123456 < database/seed_data.sql
mysql -uhospital -phospital123456 < database/refresh_schedules.sql
echo "✅ 数据库 hospital_db 已创建并导入数据"

echo "===== 3/5 开放防火墙端口 (3306/3000/8080) ====="
if systemctl is-active firewalld >/dev/null 2>&1; then
  firewall-cmd --permanent --add-port=3306/tcp --add-port=3000/tcp --add-port=8080/tcp >/dev/null
  firewall-cmd --reload >/dev/null
  echo "✅ 防火墙端口已开放"
else
  echo "⚠️ 未检测到 firewalld，跳过（CentOS 7 无防火墙时端口默认开放）"
fi

echo "===== 4/5 启动 Docker 后端 + 前端 ====="
docker compose -f docker-compose.server.yml up -d --build

echo "===== 5/5 部署完成 🎉 ====="
echo "----------------------------------------------"
echo "前端页面:   http://192.168.229.191:8080"
echo "后端 API:   http://192.168.229.191:3000/api"
echo "Navicat 连接:"
echo "  主机 192.168.229.191  端口 3306"
echo "  用户 hospital  密码 hospital123456"
echo "  数据库 hospital_db"
echo "----------------------------------------------"
echo "查看状态:  docker compose -f docker-compose.server.yml ps"
echo "查看日志:  docker compose -f docker-compose.server.yml logs -f backend"
echo "重新部署:  改完代码后重跑本脚本，或 docker compose -f docker-compose.server.yml up -d --build"
