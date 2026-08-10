export const meta = {
  name: 'vue-deploy-pipeline',
  description: 'Vue 3 + Vite 项目从页面开发到 Docker 部署配置的全流程工作流',
  phases: [
    { title: 'Develop', detail: '开发基础展示页面、路由与状态管理' },
    { title: 'Dockerize', detail: '编写 Docker 多阶段构建与 Nginx 部署配置' },
    { title: 'Verify', detail: '执行生产构建并验证产物' },
  ],
}

const ROOT = 'c:/Users/Administrator/Desktop/初次使用工作流搭建VUE项目/vue-app'

const FRONTEND_SCHEMA = {
  type: 'object',
  properties: {
    filesCreated: { type: 'array', items: { type: 'string' } },
    features: { type: 'array', items: { type: 'string' } },
    routerMode: { type: 'string' },
    notes: { type: 'string' },
  },
  required: ['filesCreated', 'features', 'routerMode', 'notes'],
}

const DOCKER_SCHEMA = {
  type: 'object',
  properties: {
    filesCreated: { type: 'array', items: { type: 'string' } },
    dockerImage: { type: 'string' },
    exposedPort: { type: 'number' },
    notes: { type: 'string' },
  },
  required: ['filesCreated', 'dockerImage', 'exposedPort', 'notes'],
}

const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    buildSuccess: { type: 'boolean' },
    buildOutput: { type: 'string' },
    distFiles: { type: 'array', items: { type: 'string' } },
    warnings: { type: 'array', items: { type: 'string' } },
    errors: { type: 'array', items: { type: 'string' } },
  },
  required: ['buildSuccess', 'distFiles', 'warnings', 'errors'],
}

const frontendPrompt = `你是一名资深 Vue 3 前端工程师。请在项目目录中完成基础展示页面的开发。

项目绝对路径: ${ROOT}
技术栈: Vue 3 (Composition API + <script setup>), Vite 8, Vue Router 4, Pinia 4。依赖已安装完毕，绝对不要运行 npm install。

任务：
1. 创建路由系统 src/router/index.js：
   - 使用 createWebHistory() 历史模式
   - 创建一个共享布局，包含顶部导航栏(Navbar)和底部页脚(Footer)
   - 路由页面：/ (Home)、/about、/services、/contact
2. 创建 4 个页面组件（放在 src/views/ 下）：
   - Home.vue：Hero 首屏 + 特性卡片（3-4 个，介绍网站/产品亮点）
   - About.vue：关于我们，介绍项目背景
   - Services.vue：服务列表，展示 4-6 项服务
   - Contact.vue：联系我们，含一个前端表单（无需真实提交）
3. 创建布局组件（放在 src/components/layout/ 下）：
   - SiteLayout.vue：包含 Navbar 和 Footer，Navbar 用 router-link，当前路由高亮
4. 配置 Pinia：
   - 在 src/stores/ 下创建至少一个 store（例如 useSiteStore，管理站点标题/信息），并在组件中实际使用
5. 修改入口文件：
   - src/main.js：注册 createPinia() 和 router
   - src/App.vue：使用 SiteLayout 并渲染 <router-view>
   - src/style.css：重写为干净的全局样式（CSS 变量主题色 + 基础重置 + 排版），与组件样式协调，现代简洁
6. UI 文案使用中文，组件用 <script setup>，代码干净、注释适度、可维护。

约束：
- 不要运行 npm run build（后续阶段执行）
- 不要删除 public/ 下的文件
- 完成后自查：所有 import 路径正确、路由文件引用与实际组件路径一致

完成后通过 schema 返回：创建的源码文件列表、实现的功能特性、路由模式、备注。`

const dockerPrompt = `你是一名资深 DevOps 工程师。请在项目目录中完成 Docker 容器化部署配置。

项目绝对路径: ${ROOT}
技术栈: Vue 3 + Vite 8，生产构建产物在 dist/ 目录。目标服务器为 Linux，使用 Docker 部署 SPA。

任务：
1. 创建 Dockerfile（多阶段构建）：
   - 阶段一 build：基于 node:22-alpine，先复制 package*.json 执行 npm ci，再复制全部源码执行 npm run build
   - 阶段二 serve：基于 nginx:1.27-alpine，将 dist/ 复制到 /usr/share/nginx/html，将 nginx.conf 复制为 /etc/nginx/conf.d/default.conf
2. 创建 nginx.conf：
   - 支持 SPA history 路由：location / { try_files $uri $uri/ /index.html; }
   - 开启 gzip
   - /assets/ 静态资源加 Cache-Control: max-age=31536000 长缓存（对 js/css hash 文件生效）
   - server_name 使用占位符
3. 创建 docker-compose.yml：
   - 服务名 vue-app，build 当前目录
   - 端口映射：\${VUE_APP_PORT:-8080}:80
   - restart: unless-stopped
4. 创建 .dockerignore：排除 node_modules、dist、.git、*.log、.env
5. 创建 .env.example：定义 VUE_APP_PORT=8080
6. 创建 DEPLOY.md（中文部署指南）：包括 本地构建验证、Docker 镜像构建、docker compose 启动、访问地址与端口说明、docker compose logs 查看日志、以及后续更新代码后如何重新构建部署

约束：
- 不要运行任何 npm 或 docker 命令（构建由后续阶段验证）
- 不要修改 src/ 下的文件
- Dockerfile 必须可以直接构建成功，注意 nginx 镜像路径与 Vue SPA 配置正确

完成后通过 schema 返回：创建的文件列表、docker 镜像名、暴露端口、备注。`

const verifyPrompt = `你是一名质量保障工程师。请在项目目录中验证生产构建。

项目绝对路径: ${ROOT}

任务：
1. 在项目目录执行 npm run build（如首次构建较慢请耐心等待，可加超时）
2. 确认构建成功，且 dist/ 目录包含 index.html 与 assets/
3. 记录构建日志中的警告(warnings)和错误(errors)，有错误则详细说明
4. 列出 dist/ 目录的主要产物文件（index.html、assets 下的大文件）

若构建失败，报告里必须包含具体错误信息（日志关键行），供主流程修复。

完成后通过 schema 返回：构建是否成功、构建日志摘要、dist 产物列表、警告列表、错误列表。`

phase('Develop')
phase('Dockerize')
const [frontend, docker] = await parallel([
  () => agent(frontendPrompt, { label: 'dev-pages', phase: 'Develop', schema: FRONTEND_SCHEMA }),
  () => agent(dockerPrompt, { label: 'docker-config', phase: 'Dockerize', schema: DOCKER_SCHEMA }),
])

phase('Verify')
const verify = await agent(verifyPrompt, { label: 'build-verify', phase: 'Verify', schema: VERIFY_SCHEMA })

return { frontend, docker, verify }
