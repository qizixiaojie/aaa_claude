# 后端 API 镜像：Node.js 运行 Express 服务
FROM node:22-alpine

WORKDIR /app

# 先复制依赖清单，利用 Docker 层缓存
COPY package*.json ./
RUN npm ci --omit=dev

# 复制源码（.dockerignore 已排除 node_modules/.env）
COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
