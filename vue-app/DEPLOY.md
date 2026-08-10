# Docker 部署指南

本项目是一个 **Vue 3 + Vite** 单页应用（SPA），通过多阶段 Dockerfile 构建后，由 nginx 静态托管，支持 history 路由。

## 目录结构

```
.
├── Dockerfile          # 多阶段构建：node 构建 → nginx 运行
├── nginx.conf          # nginx 站点配置（SPA 路由 / gzip / 长缓存）
├── docker-compose.yml  # 容器编排
├── .dockerignore       # 排除构建上下文中的无用文件
└── .env.example        # 端口环境变量示例
```

## 1. 本地构建验证

先在本地执行一次生产构建，确认 `dist/` 产物正常，再走 Docker 流程：

```bash
npm install        # 或 npm ci
npm run build
```

构建成功后会在项目根目录生成 `dist/` 目录，可执行 `npm run preview` 在本地预览验证。

> 也可以不手动构建，下面的 Docker 构建会自行在容器内完成构建。

## 2. Docker 镜像构建

在项目根目录执行：

```bash
docker build -t vue-app:latest .
```

`Dockerfile` 采用多阶段构建：

- **阶段一 build**：基于 `node:22-alpine`，先 `npm ci` 安装依赖，再执行 `npm run build` 产出 `dist/`；
- **阶段二 serve**：基于 `nginx:1.27-alpine`，将 `dist/` 复制到 `/usr/share/nginx/html`，并覆盖默认站点配置。

## 3. Docker Compose 启动

```bash
# 如需自定义端口，先复制环境变量示例并修改
cp .env.example .env   # 修改 VUE_APP_PORT 即可，默认 8080

# 构建并后台启动
docker compose up -d --build
```

Compose 服务说明：

- 服务名：`vue-app`
- 端口映射：`${VUE_APP_PORT:-8080}:80`（宿主机端口 → 容器内 nginx 80）
- 重启策略：`restart: unless-stopped`（容器意外退出时自动重启）

## 4. 访问地址与端口说明

| 场景 | 访问地址 |
| ---- | -------- |
| 默认端口 8080 | http://服务器IP:8080 |
| 自定义端口（如 .env 中 `VUE_APP_PORT=9000`） | http://服务器IP:9000 |

- 容器内部 nginx 固定监听 **80** 端口；
- 宿主机端口由 `VUE_APP_PORT` 控制（默认 **8080**）；
- 若宿主机直接监听 80 端口（`VUE_APP_PORT=80`），可直接访问 `http://服务器IP`；
- 需在安全组/防火墙中放行对应的宿主机端口。

> 部署后请务必修改 `nginx.conf` 中的 `server_name` 占位符，替换为真实域名（或保持 `_` 用于 IP 直连）。

## 5. 查看日志

```bash
# 实时跟踪日志
docker compose logs -f vue-app

# 查看最近 200 行
docker compose logs --tail 200 vue-app

# 查看运行状态
docker compose ps
```

## 6. 更新代码后重新构建部署

```bash
# 拉取最新代码（git pull）或本地改完代码后，进入项目根目录
docker compose up -d --build
```

`--build` 会重新构建镜像并滚动更新容器，旧容器会自动重建替换。

也可以分步执行：

```bash
# 1. 重新构建镜像
docker compose build

# 2. 重建并重启容器
docker compose up -d
```

停止与清理：

```bash
docker compose down           # 停止并移除容器
docker compose down --volumes # 同时清理卷（谨慎）
```

> 提示：`docker compose up -d --build` 会优先使用 Docker 层缓存，若依赖未变化则构建很快；若安装新依赖，`npm ci` 阶段会自动重新执行。
