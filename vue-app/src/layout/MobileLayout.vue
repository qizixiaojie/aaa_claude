<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, HomeFilled, OfficeBuilding, Tickets, User } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 顶部导航栏标题：随路由 meta.title 变化，默认「仁爱医院」
const pageTitle = computed(() => route.meta.title || '仁爱医院')

// 浮动导航（左上返回 + 右上首页）：首页不显示
const showFloatNav = computed(() => route.name !== 'home')

// 返回上一页；无历史记录时回首页
function goBack() {
  if (router.options.history.state.back) {
    router.back()
  } else {
    router.push({ name: 'home' })
  }
}

// 回首页
function goHome() {
  router.push({ name: 'home' })
}

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

    <!-- 浮动导航：左上返回上一页 / 右上回首页（首页隐藏，平滑过渡） -->
    <transition name="float-nav">
      <div v-if="showFloatNav" class="float-nav">
        <div class="float-nav__btn" @click="goBack">
          <el-icon :size="18"><ArrowLeft /></el-icon>
        </div>
        <div class="float-nav__btn" @click="goHome">
          <el-icon :size="18"><HomeFilled /></el-icon>
        </div>
      </div>
    </transition>

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

/* 浮动导航：叠加在顶部导航栏上，左右两个圆按钮，容器不拦截点击 */
.float-nav {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  width: 100%;
  max-width: var(--max-width);
  height: var(--navbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  pointer-events: none;
}

.float-nav__btn {
  pointer-events: auto;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.float-nav__btn:active {
  transform: scale(0.9);
  background-color: rgba(255, 255, 255, 0.35);
}

/* 平滑出现 / 隐藏（向下滑动淡入，向上滑动淡出） */
.float-nav-enter-active,
.float-nav-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.float-nav-enter-from,
.float-nav-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}
.float-nav-enter-to,
.float-nav-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
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
