<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { DataAnalysis, OfficeBuilding, User, Tickets, Document, Calendar, Back, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

/**
 * 管理后台布局（桌面端，非移动优先）
 * - 左侧菜单 + 顶部栏 + 内容区；position:fixed 全屏，脱离患者端 max-width 480px 限制
 * - 仅管理员可进入（路由守卫已校验 requiresAdmin）
 */
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const pageTitle = computed(() => route.meta.title || '管理后台')

// 侧边菜单（与 /admin 子路由对应）
const menus = [
  { label: '统计概览', icon: DataAnalysis, name: 'adminDashboard' },
  { label: '科室管理', icon: OfficeBuilding, name: 'adminDepartments' },
  { label: '医生管理', icon: User, name: 'adminDoctors' },
  { label: '预约管理', icon: Tickets, name: 'adminAppointments' },
  { label: '处方管理', icon: Document, name: 'adminPrescriptions' },
  { label: '排班管理', icon: Calendar, name: 'adminSchedules' },
]

// 返回患者端
function backToPatient() {
  router.push({ name: 'home' })
}

// 退出登录
async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      type: 'warning',
      confirmButtonText: '退出登录',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  userStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="admin-layout">
    <!-- 左侧菜单 -->
    <aside class="admin-layout__side">
      <div class="admin-layout__brand">
        <div class="admin-layout__logo">仁</div>
        <div>
          <div class="admin-layout__title">仁爱医院</div>
          <div class="admin-layout__sub">管理后台</div>
        </div>
      </div>
      <nav class="admin-layout__menu">
        <div
          v-for="m in menus"
          :key="m.name"
          class="admin-layout__item"
          :class="{ 'admin-layout__item--active': route.name === m.name }"
          @click="router.push({ name: m.name })"
        >
          <el-icon :size="16"><component :is="m.icon" /></el-icon>
          <span>{{ m.label }}</span>
        </div>
      </nav>
      <div class="admin-layout__side-foot" @click="backToPatient">
        <el-icon :size="15"><Back /></el-icon>
        <span>返回患者端</span>
      </div>
    </aside>

    <!-- 右侧内容 -->
    <div class="admin-layout__main">
      <header class="admin-layout__top">
        <div class="admin-layout__page-title">{{ pageTitle }}</div>
        <div class="admin-layout__top-right">
          <span class="admin-layout__admin">
            {{ userStore.userInfo?.realName || '管理员' }}
            <el-tag size="small" type="success" effect="plain">管理员</el-tag>
          </span>
          <el-button size="small" text @click="handleLogout">
            <el-icon :size="14"><SwitchButton /></el-icon>
            退出
          </el-button>
        </div>
      </header>

      <main class="admin-layout__content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 全屏固定布局：脱离 body 的 max-width:480px 限制 */
.admin-layout {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  width: 100%;
  background-color: #f5f7fa;
}

/* 左侧栏 */
.admin-layout__side {
  width: 208px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #2b6cb0 0%, #1f4e79 100%);
  color: #fff;
}

.admin-layout__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.admin-layout__logo {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background-color: #fff;
  color: #2b6cb0;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-layout__title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
}

.admin-layout__sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.admin-layout__menu {
  flex: 1;
  padding: 12px 10px;
  overflow-y: auto;
}

.admin-layout__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  margin-bottom: 4px;
  border-radius: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-layout__item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.admin-layout__item--active {
  background-color: #fff;
  color: #2b6cb0;
  font-weight: 600;
}

.admin-layout__side-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
}

.admin-layout__side-foot:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 右侧主区 */
.admin-layout__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-layout__top {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.admin-layout__page-title {
  font-size: 16px;
  font-weight: 600;
}

.admin-layout__top-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-layout__admin {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-regular);
}

.admin-layout__content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>
