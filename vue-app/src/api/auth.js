import request from './request'

/**
 * 用户认证相关接口
 * 所有函数返回 Promise，直接解出响应中的 data（由 request 拦截器处理）
 */

// 登录：{ username, password } → { token, userInfo }
export function login(data) {
  return request.post('/auth/login', data)
}

// 注册：{ username, password, realName, phone, gender }
export function register(data) {
  return request.post('/auth/register', data)
}

// 获取当前登录用户信息
export function getMe() {
  return request.get('/auth/me')
}

// 更新头像：{ avatar: "data:image/...;base64,..." | null } → { avatar }
// 前端先 canvas 压缩成小图再上传；传 null 表示移除头像
export function updateAvatar(data) {
  return request.put('/auth/avatar', data)
}
