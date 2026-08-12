#!/usr/bin/env bash
# =============================================================
# 医院预约系统 · 更新部署脚本（日常更新用）
# 用法：在项目根目录执行  bash update.sh
#
# 功能：
#   1. 首次运行：把 ZIP 解压目录自动转成 git 仓库（以后可直接 git 同步）
#   2. 同步最新代码；git 同步失败时【二次判断】自动改用 ZIP 下载兜底
#   3. 重新构建并启动后端 + 前端（不碰数据库，数据保留）
#   4. 【二次判断】校验关键文件、容器状态、页面可访问性
#
# 注意：
#   - 首次完整部署（建库、放行端口）请用 deploy-server.sh
#   - 本脚本不重新导入数据库，不会清空数据
# =============================================================
set -e
set +H

# ---- 颜色提示 ----
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }
err()  { echo -e "${RED}✗${NC} $1"; }

# ---- 配置 ----
GIT_URL="https://github.com/qizixiaojie/aaa_claude.git"
ZIP_URL="https://github.com/qizixiaojie/aaa_claude/archive/refs/heads/master.zip"

# git 遇到慢速/卡死时自动中止，好交给 ZIP 兜底
export GIT_HTTP_LOW_SPEED_LIMIT=1000
export GIT_HTTP_LOW_SPEED_TIME=20

# 切到脚本所在目录（即项目根目录）
cd "$(dirname "$0")"

# ---- ZIP 兜底：下载最新代码并覆盖当前目录 ----
fetch_zip() {
  if ! command -v unzip >/dev/null 2>&1; then
    warn "缺少 unzip，尝试安装 ..."
    sudo yum install -y unzip >/dev/null 2>&1 || yum install -y unzip >/dev/null 2>&1 || true
  fi
  local tmp_zip="/tmp/aaa_claude_update.zip"
  local tmp_dir="/tmp/aaa_claude_extract"
  echo "下载最新代码 ZIP ..."
  curl -fL --max-time 120 -o "$tmp_zip" "$ZIP_URL"
  rm -rf "$tmp_dir"
  mkdir -p "$tmp_dir"
  unzip -q "$tmp_zip" -d "$tmp_dir"
  cp -rf "$tmp_dir/aaa_claude-master/." .
  # 若已是 git 仓库，把这次覆盖记录成一个本地提交，避免下次同步冲突
  if [ -d ".git" ]; then
    git config user.name  "deploy"            >/dev/null 2>&1 || true
    git config user.email "deploy@localhost"  >/dev/null 2>&1 || true
    git add -A 2>/dev/null || true
    git commit -q -m "sync via zip fallback" 2>/dev/null || true
  fi
  ok "ZIP 下载并覆盖完成"
}

echo "================ 医院预约系统 · 更新部署 ================"

# ---------- 1/5 同步代码 ----------
echo "===== 1/5 同步代码 ====="
if [ ! -d ".git" ]; then
  ok "检测到还不是 git 仓库，首次运行将自动初始化（只需一次）"
  git init -q
  git remote add origin "$GIT_URL"
  git config user.name  "deploy"
  git config user.email "deploy@localhost"
  if timeout 120 git fetch origin && git checkout -B master origin/master && git branch --set-upstream-to=origin/master master; then
    ok "git 仓库初始化完成，已同步到最新代码"
  else
    warn "git 初始化失败（可能连不上 GitHub），改用 ZIP 下载兜底"
    fetch_zip
  fi
else
  # 部署机以远程 master 为准：fetch + 强制对齐，避免本地残留文件冲突
  if timeout 120 git fetch origin && git reset --hard origin/master; then
    ok "代码已同步到最新"
  else
    warn "git 同步失败（可能网络不通），改用 ZIP 下载兜底"
    fetch_zip
  fi
fi

# ---------- 2/5 校验关键文件（二次判断） ----------
echo "===== 2/5 校验关键文件 ====="
for f in docker-compose.server.yml backend vue-app database; do
  if [ ! -e "$f" ]; then
    err "缺少关键文件/目录：$f，代码同步可能不完整，已中止"
    exit 1
  fi
done
ok "关键文件齐全"

# ---------- 3/5 重新构建并启动 ----------
echo "===== 3/5 重新构建并启动 后端 + 前端 ====="
if ! docker compose version >/dev/null 2>&1; then
  err "缺少 docker compose 插件，先执行：sudo yum install -y docker-compose-plugin"
  exit 1
fi
if docker compose -f docker-compose.server.yml up -d --build; then
  ok "服务已重新构建并启动"
else
  err "构建/启动失败，请查看上方日志"
  exit 1
fi

# ---------- 4/5 校验容器状态（二次判断） ----------
echo "===== 4/5 校验容器状态 ====="
sleep 5
ps_out="$(docker compose -f docker-compose.server.yml ps)"
echo "$ps_out"
if echo "$ps_out" | grep -q "hospital-backend.*Up"; then ok "后端容器运行中"; else warn "后端容器未正常启动（见上方状态）"; fi
if echo "$ps_out" | grep -q "hospital-frontend.*Up"; then ok "前端容器运行中"; else warn "前端容器未正常启动（见上方状态）"; fi

# ---------- 5/5 校验页面可访问（二次判断） ----------
echo "===== 5/5 校验页面可访问 ====="
FE_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:8080/)
BE_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:3000/api/hospital/profile)
if [ "$FE_CODE" = "200" ]; then ok "前端页面正常（HTTP 200）"; else warn "前端返回 HTTP $FE_CODE（可能仍在启动，稍等后浏览器 Ctrl+F5 刷新）"; fi
if [ "$BE_CODE" = "200" ]; then ok "后端 API 正常（HTTP 200）"; else warn "后端返回 HTTP $BE_CODE，请执行 docker compose -f docker-compose.server.yml logs -f backend 查看"; fi

echo "========================================================"
echo "部署完成 🎉  访问：http://192.168.229.191:8080"
echo "以后每次更新代码，只需在项目目录再次执行：bash update.sh"
