<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'

/**
 * 登录 / 注册页
 * - Tab 切换「登录 / 注册」
 * - 登录成功按 redirect 跳转（来自路由守卫或上一次访问路径）
 */
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeTab = ref('login')
const loading = ref(false)

const loginFormRef = ref()
const registerFormRef = ref()

// 登录表单
const loginForm = reactive({ account: '', password: '' })
const loginRules = {
  account: [
    { required: true, message: '请输入用户名或手机号', trigger: 'blur' },
    { min: 2, message: '至少 2 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

// 注册表单
const registerForm = reactive({
  username: '',
  password: '',
  realName: '',
  phone: '',
  gender: '男',
})
const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度为 2-20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
}

// 登录
async function handleLogin() {
  try {
    await loginFormRef.value.validate()
  } catch {
    return // 校验未通过，提示已由表单展示
  }
  loading.value = true
  try {
    await userStore.login({
      username: loginForm.account,
      password: loginForm.password,
    })
    ElMessage.success('登录成功')
    // 登录成功：优先跳 redirect，否则回首页
    const redirect = route.query.redirect
    router.push(redirect || { name: 'home' })
  } finally {
    loading.value = false
  }
}

// 注册
async function handleRegister() {
  try {
    await registerFormRef.value.validate()
  } catch {
    return // 校验未通过，提示已由表单展示
  }
  loading.value = true
  try {
    await userStore.register({ ...registerForm })
    ElMessage.success('注册成功，请登录')
    activeTab.value = 'login'
  } finally {
    loading.value = false
  }
}

// 注册成功后自动回填用户名
function onTabChange() {
  if (activeTab.value === 'login' && registerForm.username) {
    loginForm.account = registerForm.username
  }
}
</script>

<template>
  <div class="login-page">
    <!-- 顶部医院名 + Logo 圆点 -->
    <div class="login-page__brand">
      <div class="login-page__logo"></div>
      <div class="login-page__name">仁爱医院</div>
      <div class="login-page__slogan">预约挂号，就医更便捷</div>
    </div>

    <!-- 登录 / 注册 Tab -->
    <div class="login-page__card">
      <el-tabs v-model="activeTab" class="login-page__tabs" @tab-change="onTabChange">
        <!-- 登录 -->
        <el-tab-pane label="登录" name="login">
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            label-position="top"
          >
            <el-form-item label="用户名 / 手机号" prop="account">
              <el-input v-model="loginForm.account" placeholder="请输入用户名或手机号" clearable />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-button
              type="primary"
              class="login-page__submit"
              :loading="loading"
              @click="handleLogin"
            >登 录</el-button>
          </el-form>
        </el-tab-pane>

        <!-- 注册 -->
        <el-tab-pane label="注册" name="register">
          <el-form
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            label-position="top"
          >
            <el-form-item label="用户名" prop="username">
              <el-input v-model="registerForm.username" placeholder="请设置用户名" clearable />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="请设置密码（至少 6 位）"
                show-password
              />
            </el-form-item>
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="registerForm.realName" placeholder="请输入真实姓名" clearable />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="registerForm.phone" placeholder="请输入手机号" clearable />
            </el-form-item>
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="registerForm.gender">
                <el-radio value="男">男</el-radio>
                <el-radio value="女">女</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-button
              type="primary"
              class="login-page__submit"
              :loading="loading"
              @click="handleRegister"
            >注 册</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>

    <div class="login-page__footer">仁爱医院 · 用心服务每一位患者</div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  padding: 48px 24px 24px;
  background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-bg) 40%);
  display: flex;
  flex-direction: column;
}

.login-page__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 36px;
}

.login-page__logo {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #fff;
  border: 6px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-page__name {
  margin-top: 6px;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 2px;
}

.login-page__slogan {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.login-page__card {
  background-color: #fff;
  border-radius: var(--radius);
  padding: 8px 20px 24px;
  box-shadow: var(--shadow-card);
}

.login-page__tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

.login-page__submit {
  width: 100%;
  height: 44px;
  margin-top: 8px;
  font-size: 15px;
}

.login-page__footer {
  margin-top: auto;
  padding-top: 24px;
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
