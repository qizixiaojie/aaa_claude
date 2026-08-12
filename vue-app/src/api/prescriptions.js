import request from './request'

/**
 * 处方相关接口
 */

// 我的处方列表（后端路由为 /api/prescriptions/my）
export function listPrescriptions() {
  return request.get('/prescriptions/my')
}

// 处方详情（含处方明细 items，后端返回 { prescription },解包）
export function getPrescription(id) {
  return request.get(`/prescriptions/${id}`).then((d) => d.prescription)
}

// 模拟取药
export function pickupPrescription(id) {
  return request.post(`/prescriptions/${id}/pickup`)
}
