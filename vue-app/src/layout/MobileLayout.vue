<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { HomeFilled, OfficeBuilding, Tickets, User } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 顶部导航栏标题：随路由 meta.title 变化，默认「仁爱医院」
const pageTitle = computed(() => route.meta.title || '仁爱医院')

// 底部 TabBar 配置（四个 Tab）
const tabs = [
  { name: 'home', label: '首页', icon: HomeFilled },
  { name: 'departments', label: '科室', icon: OfficeBuilding },
  { name: 'appointments', label: '我的预约', icon: Tickets },
  { name: 'profile', label: '我的', icon: User },
]

// 仅带 meta.tab 的页面显示 TabBar
const showTabBar = computed(() => !!route.meta.tab)

// 当前激活 Tab
const activeTab = computed(() => route.meta.tab || '')

// 点击 Tab：编程式导航到对应命名路由
function switchTab(tab) {
  if (tab.name === activeTab.value) return
  router.push({ name: tab.name })
}
</script>

<template>
  <div class="mobile-layout">
    <!-- 顶部固定导航栏 -->
    <header class="navbar">
      <span class="navbar__title">{{ pageTitle }}</span>
    </header>

    <!-- 内容区 -->
    <main class="content" :class="{ 'content--with-tab': showTabBar }">
      <router-view />
    </main>

    <!-- 底部固定 TabBar -->
    <nav v-if="showTabBar" class="tabbar">
      <div
        v-for="tab in tabs"
        :key="tab.name"
        class="tabbar__item"
        :class="{ 'tabbar__item--active': activeTab === tab.name }"
        @click="switchTab(tab)"
      >
        <el-icon :size="20"><component :is="tab.icon" /></el-icon>
        <span class="tabbar__label">{{ tab.label }}</span>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.mobile-layout {
  min-height: 100vh;
}

/* 顶部固定导航栏（居中、限宽 480px） */
.navbar {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  width: 100%;
  max-width: var(--max-width);
  height: var(--navbar-height);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.navbar__title {
  font-size: 17px;
  font-weight: 600;
}

/* 内容区：顶部预留导航栏高度 */
.content {
  padding-top: calc(var(--navbar-height) + 12px);
  min-height: 100vh;
}

/* 带 TabBar 的页面：底部预留 TabBar 高度 */
.content--with-tab {
  padding-bottom: calc(var(--tabbar-height) + var(--safe-bottom) + 8px);
}

/* 底部固定 TabBar（居中、限宽 480px） */
.tabbar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  z-index: 30;
  width: 100%;
  max-width: var(--max-width);
  height: calc(var(--tabbar-height) + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  display: flex;
  align-items: stretch;
  background-color: #fff;
  border-top: 1px solid var(--color-border);
}

.tabbar__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s ease;
}

.tabbar__item--active {
  color: var(--color-primary);
  font-weight: 600;
}

.tabbar__label {
  font-size: 11px;
}
</style>
