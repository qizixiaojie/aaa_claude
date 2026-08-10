import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

/**
 * axios 实例：统一请求/响应处理
 * - baseURL '/api'（开发环境经 vite 代理到后端）
 * - 请求拦截器：自动附加 token
 * - 响应拦截器：解包 { code, data, message }，code===0 直接返回 data
 */
const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 请求拦截器：从 localStorage 读取 token，附加 Authorization 头
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一解包与错误提示
request.interceptors.response.use(
  (response) => {
    const res = response.data
    // 业务成功：code === 0，直接返回 data
    if (res && res.code === 0) {
      return res.data
    }
    // 业务失败：弹出后端返回的错误信息
    const message = (res && res.message) || '请求失败，请稍后重试'
    ElMessage.error(message)
    return Promise.reject(new Error(message))
  },
  (error) => {
    // HTTP 401：登录失效，清除 token 并跳转登录页
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      ElMessage.warning('登录已过期，请重新登录')
      router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
    } else {
      // 其余错误：提示网络或后端错误信息
      const message = (error.response && error.response.data && error.response.data.message) ||
        error.message || '网络异常，请稍后重试'
      ElMessage.error(message)
    }
    return Promise.reject(error)
  }
)

export default request
