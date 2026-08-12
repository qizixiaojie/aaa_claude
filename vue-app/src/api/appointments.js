import request from './request'

/**
 * 挂号预约相关接口
 */

// 创建挂号：{ doctorId, scheduleId, appointDate, period, patientName } → 待支付订单
export function createAppointment(data) {
  return request.post('/appointments', data)
}

// 我的预约列表（后端路由为 /api/appointments/my）
export function listAppointments() {
  return request.get('/appointments/my')
}

// 取消预约
export function cancelAppointment(id) {
  return request.post(`/appointments/${id}/cancel`)
}

// 支付预约：data { method: 微信支付|支付宝|医保支付 } → 支付成功后的挂号（含排队号）
export function payAppointment(id, data) {
  return request.post(`/appointments/${id}/pay`, data)
}
