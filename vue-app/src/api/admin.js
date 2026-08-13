import request from './request'

/**
 * 管理后台相关接口（需管理员权限）
 * 统一返回 Promise，data 已由拦截器解包
 */

// 统计概览
export function getAdminStats() {
  return request.get('/admin/stats')
}

// 科室管理
export function listAdminDepartments(params) {
  return request.get('/admin/departments', { params })
}
export function createDepartment(data) {
  return request.post('/admin/departments', data)
}
export function updateDepartment(id, data) {
  return request.put(`/admin/departments/${id}`, data)
}
export function deleteDepartment(id) {
  return request.delete(`/admin/departments/${id}`)
}

// 医生管理
export function listAdminDoctors(params) {
  return request.get('/admin/doctors', { params })
}
export function createDoctor(data) {
  return request.post('/admin/doctors', data)
}
export function updateDoctor(id, data) {
  return request.put(`/admin/doctors/${id}`, data)
}
export function deleteDoctor(id) {
  return request.delete(`/admin/doctors/${id}`)
}

// 手动生成排班
export function generateSchedules() {
  return request.post('/admin/schedules/generate')
}

// 预约管理
export function listAdminAppointments(params) {
  return request.get('/admin/appointments', { params })
}
export function updateAppointmentStatus(id, status) {
  return request.put(`/admin/appointments/${id}/status`, { status })
}

// 处方管理
export function listAdminPrescriptions(params) {
  return request.get('/admin/prescriptions', { params })
}
