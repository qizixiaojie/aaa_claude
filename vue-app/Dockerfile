# ---------- 阶段一：构建 ----------
FROM node:22-alpine AS build

WORKDIR /app

# 先复制依赖清单，利用 Docker 层缓存（源码变更时避免重复安装依赖）
COPY package*.json ./
RUN npm ci

# 复制全部源码并执行生产构建
COPY . .
RUN npm run build

# ---------- 阶段二：运行 ----------
FROM nginx:1.27-alpine AS serve

# 复制 Vue 构建产物到 nginx 静态资源目录
COPY --from=build /app/dist /usr/share/nginx/html

# 覆盖默认 nginx 站点配置（支持 SPA history 路由 / gzip / 静态资源长缓存）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# 前台运行 nginx，保证容器不退出
CMD ["nginx", "-g", "daemon off;"]
