<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, Calendar, Document, FirstAidKit, ArrowRight, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

/**
 * 个人中心页：用户信息卡 + 功能菜单 + 退出登录
 */
const router = useRouter()
const userStore = useUserStore()

// 功能菜单
const menuItems = [
  { label: '我的预约', icon: Calendar, name: 'appointments' },
  { label: '我的处方', icon: Document, name: 'prescriptions' },
  { label: '药品查询', icon: FirstAidKit, name: 'medicines' },
]

function goMenu(item) {
  router.push({ name: item.name })
}

// 退出登录（确认后清空状态并跳登录页）
async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      type: 'warning',
      confirmButtonText: '退出登录',
      cancelButtonText: '取消',
    })
  } catch {
    return // 用户取消
  }
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push({ name: 'login' })
}

// 刷新用户信息
onMounted(async () => {
  try {
    await userStore.fetchMe()
  } catch {
    /* 未登录等错误由拦截器提示，使用本地缓存 */
  }
})
</script>

<template>
  <div class="page profile">
    <!-- 用户信息卡 -->
    <div class="card profile__user">
      <el-avatar :size="60" class="profile__avatar">
        <el-icon :size="30"><UserFilled /></el-icon>
      </el-avatar>
      <div class="profile__info">
        <div class="profile__name">{{ userStore.userInfo?.real_name || userStore.userInfo?.username || '未设置姓名' }}</div>
        <div class="profile__meta">
          手机号：{{ userStore.userInfo?.phone || '—' }}
          · {{ userStore.userInfo?.gender || '男' }}
        </div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="card profile__menu">
      <div
        v-for="item in menuItems"
        :key="item.name"
        class="profile__menu-item"
        @click="goMenu(item)"
      >
        <div class="profile__menu-left">
          <el-icon :size="18"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </div>
        <el-icon :size="14" class="text-secondary"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- 退出登录 -->
    <el-button class="profile__logout" @click="handleLogout">
      <el-icon :size="15"><SwitchButton /></el-icon>
      退出登录
    </el-button>
  </div>
</template>

<style scoped>
.profile__user {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, var(--color-primary), #66b1ff);
  border: none;
}

.profile__avatar {
  background-color: rgba(255, 255, 255, 0.25);
  border: 2px solid rgba(255, 255, 255, 0.6);
}

.profile__name {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.profile__meta {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.profile__menu {
  margin-top: 12px;
  padding: 4px 14px;
}

.profile__menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
}

.profile__menu-item:last-child {
  border-bottom: none;
}

.profile__menu-left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text-main);
}

.profile__menu-left .el-icon {
  color: var(--color-primary);
}

.profile__logout {
  width: 100%;
  height: 44px;
  margin-top: 20px;
  font-size: 15px;
}
</style>
