<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, Camera, Calendar, Document, FirstAidKit, Setting, ArrowRight, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import { updateAvatar } from '../api/auth'

/**
 * 个人中心页：用户信息卡 + 功能菜单 + 退出登录
 * 管理员额外显示「管理后台」入口（无权限时路由守卫兜底拦截）
 */
const router = useRouter()
const userStore = useUserStore()

// ---------------- 头像上传 ----------------
// 点击头像 → 打开文件选择器 → canvas 压缩 → base64 data URL 上传存库
const fileInput = ref(null)
const uploading = ref(false)
const avatarSrc = computed(() => userStore.userInfo?.avatar || '')

// 头像 max 300x300，压缩为 JPEG，控制存库体积（单张约几十 KB）
function resizeToAvatar(img, maxSize = 300) {
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff' // 白底：PNG 透明图转 JPEG 时避免变黑
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.85)
}

function openFilePicker() {
  if (!uploading.value) fileInput.value?.click()
}

// 选择本地文件 → 读取 → 压缩 → 上传
function onFileChange(e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = '' // 清空以便再次选择同一文件
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片不能超过 5MB')
    return
  }
  uploading.value = true
  const reader = new FileReader()
  reader.onload = (ev) => {
    const img = new Image()
    img.onload = async () => {
      try {
        await uploadAvatar(resizeToAvatar(img))
      } finally {
        uploading.value = false
      }
    }
    img.onerror = () => {
      uploading.value = false
      ElMessage.error('图片读取失败，请换一张试试')
    }
    img.src = ev.target.result
  }
  reader.onerror = () => {
    uploading.value = false
    ElMessage.error('文件读取失败')
  }
  reader.readAsDataURL(file)
}

async function uploadAvatar(dataUrl) {
  try {
    await updateAvatar({ avatar: dataUrl })
    await userStore.fetchMe() // 刷新用户信息（含头像）并写回 localStorage
    ElMessage.success('头像更新成功')
  } catch {
    /* 拦截器已提示 */
  }
}

// 移除头像（确认后置空）
async function removeAvatar() {
  try {
    await ElMessageBox.confirm('确定要移除头像吗？', '提示', { type: 'warning' })
  } catch {
    return // 用户取消
  }
  try {
    await updateAvatar({ avatar: null })
    await userStore.fetchMe()
    ElMessage.success('已移除头像')
  } catch {
    /* 拦截器已提示 */
  }
}

// 功能菜单（管理员额外显示管理后台入口）
const isAdmin = computed(() => userStore.userInfo?.role === 'admin')
const menuItems = computed(() => {
  const base = [
    { label: '我的预约', icon: Calendar, name: 'appointments' },
    { label: '我的处方', icon: Document, name: 'prescriptions' },
    { label: '药品查询', icon: FirstAidKit, name: 'medicines' },
  ]
  if (isAdmin.value) {
    base.push({ label: '管理后台', icon: Setting, name: 'adminDashboard' })
  }
  return base
})

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
      <!-- 头像：点击选择本地图片文件作为头像 -->
      <div class="profile__avatar-wrap" v-loading="uploading" @click="openFilePicker">
        <el-avatar :size="68" :src="avatarSrc" class="profile__avatar">
          <el-icon :size="30"><UserFilled /></el-icon>
        </el-avatar>
        <div class="profile__avatar-badge">
          <el-icon :size="12"><Camera /></el-icon>
        </div>
        <input ref="fileInput" type="file" accept="image/*" class="profile__avatar-input" @change="onFileChange" />
      </div>
      <div class="profile__info">
        <div class="profile__name">
          {{ userStore.userInfo?.realName || userStore.userInfo?.username || '未设置姓名' }}
          <el-tag v-if="isAdmin" size="small" effect="dark" type="warning">管理员</el-tag>
        </div>
        <div class="profile__meta">
          手机号：{{ userStore.userInfo?.phone || '—' }}
          · {{ userStore.userInfo?.gender || '男' }}
        </div>
        <div class="profile__avatar-tip">
          点击头像更换照片
          <span v-if="avatarSrc" class="profile__avatar-remove" @click.stop="removeAvatar">移除</span>
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

.profile__avatar-wrap {
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
}

.profile__avatar {
  background-color: rgba(255, 255, 255, 0.25);
  border: 2px solid rgba(255, 255, 255, 0.6);
}

/* 头像右下角小相机角标：提示可点击更换 */
.profile__avatar-badge {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
}

/* 隐藏的文件选择框（点击头像触发） */
.profile__avatar-input {
  display: none;
}

.profile__avatar-tip {
  margin-top: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
}

.profile__avatar-remove {
  margin-left: 8px;
  padding: 0 4px;
  color: #ffe58f;
  text-decoration: underline;
  cursor: pointer;
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
