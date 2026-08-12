import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, register as registerApi, getMe } from '../api/auth'

/**
 * 用户状态管理
 * - token 与 userInfo 从 localStorage 初始化，刷新后保持登录
 * - actions：login / register / fetchMe / logout
 */
export const useUserStore = defineStore('user', () => {
  // 从 localStorage 初始化
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  // 登录：保存 token 与用户信息
  async function login(credentials) {
    const data = await loginApi(credentials)
    token.value = data.token
    userInfo.value = data.userInfo || data.user || null
    localStorage.setItem('token', token.value)
    if (userInfo.value) {
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
    return data
  }

  // 注册
  function register(data) {
    return registerApi(data)
  }

  // 拉取当前登录用户信息（接口返回 { user }，与 login 保持一致只存用户对象）
  async function fetchMe() {
    const data = await getMe()
    const user = data.user || data
    userInfo.value = user
    localStorage.setItem('userInfo', JSON.stringify(user))
    return data
  }

  // 退出登录：清空本地存储
  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return { token, userInfo, isLoggedIn, login, register, fetchMe, logout }
})
